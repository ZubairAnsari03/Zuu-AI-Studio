import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, creditTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /credits
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  try {
    const [user] = await db
      .select({ credits: usersTable.credits })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const transactions = await db
      .select()
      .from(creditTransactionsTable)
      .where(eq(creditTransactionsTable.userId, userId))
      .orderBy(desc(creditTransactionsTable.createdAt))
      .limit(50);

    res.json({
      balance: user.credits,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: Math.abs(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    req.log.error(err, "Get credits error");
    res.status(500).json({ error: "Failed to fetch credits." });
  }
});

export default router;
