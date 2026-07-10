import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  videoGenerationsTable,
  creditTransactionsTable,
  providerSettingsTable,
} from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { z } from "zod";

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// GET /admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [{ totalUsers }] = await db
      .select({ totalUsers: count() })
      .from(usersTable);

    const genRows = await db
      .select({
        status: videoGenerationsTable.status,
        provider: videoGenerationsTable.provider,
        creditsUsed: videoGenerationsTable.creditsUsed,
      })
      .from(videoGenerationsTable);

    const totalGenerations = genRows.length;
    const completedGenerations = genRows.filter((r) => r.status === "completed").length;
    const failedGenerations = genRows.filter((r) => r.status === "failed").length;
    const activeGenerations = genRows.filter(
      (r) => r.status === "queued" || r.status === "processing",
    ).length;
    const totalCreditsUsed = genRows.reduce(
      (sum, r) => sum + (r.creditsUsed ?? 0),
      0,
    );

    // Group by provider
    const providerCounts: Record<string, number> = {};
    for (const row of genRows) {
      providerCounts[row.provider] = (providerCounts[row.provider] ?? 0) + 1;
    }
    const generationsByProvider = Object.entries(providerCounts).map(
      ([provider, count]) => ({ provider, count }),
    );

    // Recent activity
    const recentActivity = await db
      .select({
        id: videoGenerationsTable.id,
        userId: videoGenerationsTable.userId,
        userEmail: usersTable.email,
        status: videoGenerationsTable.status,
        provider: videoGenerationsTable.provider,
        createdAt: videoGenerationsTable.createdAt,
      })
      .from(videoGenerationsTable)
      .leftJoin(usersTable, eq(videoGenerationsTable.userId, usersTable.id))
      .orderBy(desc(videoGenerationsTable.createdAt))
      .limit(10);

    res.json({
      totalUsers,
      totalGenerations,
      completedGenerations,
      failedGenerations,
      activeGenerations,
      totalCreditsUsed,
      generationsByProvider,
      recentActivity: recentActivity.map((r) => ({
        ...r,
        userEmail: r.userEmail ?? "unknown",
      })),
    });
  } catch (err) {
    req.log.error(err, "Admin stats error");
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// GET /admin/users
router.get("/users", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  try {
    const [{ total }] = await db.select({ total: count() }).from(usersTable);

    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        credits: usersTable.credits,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get generation counts
    const genCounts = await db
      .select({
        userId: videoGenerationsTable.userId,
        cnt: count(),
      })
      .from(videoGenerationsTable)
      .groupBy(videoGenerationsTable.userId);

    const countMap = new Map(genCounts.map((r) => [r.userId, r.cnt]));

    const items = users.map((u) => ({
      ...u,
      totalGenerations: countMap.get(u.id) ?? 0,
    }));

    res.json({ items, total, page, limit });
  } catch (err) {
    req.log.error(err, "Admin list users error");
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// POST /admin/users/:id/credits
router.post("/users/:id/credits", async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));

  const schema = z.object({
    amount: z.number().int(),
    description: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { amount, description } = parsed.data;

  try {
    await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} + ${amount}` })
      .where(eq(usersTable.id, id));

    await db.insert(creditTransactionsTable).values({
      userId: id,
      amount,
      type: amount >= 0 ? "credit" : "debit",
      description,
    });

    res.json({ message: `Credits adjusted by ${amount}.` });
  } catch (err) {
    req.log.error(err, "Admin adjust credits error");
    res.status(500).json({ error: "Failed to adjust credits." });
  }
});

// GET /admin/jobs
router.get("/jobs", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const statusFilter = req.query.status as string | undefined;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(videoGenerationsTable);

    const conditions = statusFilter
      ? eq(videoGenerationsTable.status, statusFilter)
      : undefined;

    const items = await db
      .select()
      .from(videoGenerationsTable)
      .where(conditions)
      .orderBy(desc(videoGenerationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ items, total, page });
  } catch (err) {
    req.log.error(err, "Admin list jobs error");
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});

// PATCH /admin/providers
router.patch("/providers", async (req, res) => {
  const schema = z.object({
    providerId: z.string().min(1),
    enabled: z.boolean(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { providerId, enabled } = parsed.data;

  try {
    // Upsert provider setting
    await db
      .insert(providerSettingsTable)
      .values({ providerId, enabled })
      .onConflictDoUpdate({
        target: providerSettingsTable.providerId,
        set: { enabled, updatedAt: new Date() },
      });

    res.json({ message: `Provider ${providerId} ${enabled ? "enabled" : "disabled"}.` });
  } catch (err) {
    req.log.error(err, "Admin update provider error");
    res.status(500).json({ error: "Failed to update provider." });
  }
});

export default router;
