import { Router } from "express";
import { getAllProviders } from "../providers/index.js";
import { requireAuth } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { videoGenerationsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

// GET /providers — list with usage stats
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    // Get per-provider generation counts for this user
    const usageRows = await db
      .select({
        provider: videoGenerationsTable.provider,
        count:    count(),
      })
      .from(videoGenerationsTable)
      .where(eq(videoGenerationsTable.userId, userId))
      .groupBy(videoGenerationsTable.provider);

    const usageMap = Object.fromEntries(usageRows.map((r) => [r.provider, Number(r.count)]));

    const providers = getAllProviders().map((p) => ({
      id:                   p.id,
      name:                 p.name,
      enabled:              p.hasKey || p.isMock,
      supportsImageToVideo: p.supportsImageToVideo,
      supportedDurations:   p.supportedDurations,
      supportedAspectRatios: p.supportedAspectRatios,
      isMock:               p.isMock,
      description:          p.description,
      generationCount:      usageMap[p.id] ?? 0,
      hasKey:               p.hasKey,
    }));

    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch providers." });
  }
});

export default router;
