import { Router } from "express";
import { db } from "@workspace/db";
import { videoGenerationsTable, creditTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /activity  — returns unified recent activity feed
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const [videos, credits] = await Promise.all([
      db
        .select({
          id:        videoGenerationsTable.id,
          prompt:    videoGenerationsTable.prompt,
          status:    videoGenerationsTable.status,
          style:     videoGenerationsTable.style,
          provider:  videoGenerationsTable.provider,
          duration:  videoGenerationsTable.duration,
          videoUrl:  videoGenerationsTable.videoUrl,
          createdAt: videoGenerationsTable.createdAt,
        })
        .from(videoGenerationsTable)
        .where(eq(videoGenerationsTable.userId, userId))
        .orderBy(desc(videoGenerationsTable.createdAt))
        .limit(15),

      db
        .select()
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.userId, userId))
        .orderBy(desc(creditTransactionsTable.createdAt))
        .limit(15),
    ]);

    // Build unified activity items
    const items: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      meta?: Record<string, unknown>;
    }> = [];

    for (const v of videos) {
      items.push({
        id:    `video-${v.id}`,
        type:  `video_${v.status}`,
        title: v.status === "completed"
          ? "Video ready"
          : v.status === "failed"
            ? "Generation failed"
            : "Generation started",
        description: v.prompt.substring(0, 80) + (v.prompt.length > 80 ? "…" : ""),
        timestamp: v.createdAt,
        meta: { videoId: v.id, style: v.style, provider: v.provider, duration: v.duration },
      });
    }

    for (const c of credits) {
      if (c.type === "credit") {
        items.push({
          id:          `credit-${c.id}`,
          type:        "credits_added",
          title:       `${c.amount > 0 ? "+" : ""}${c.amount} credits`,
          description: c.description,
          timestamp:   c.createdAt,
          meta: { amount: c.amount },
        });
      }
    }

    // Sort by timestamp desc and cap at 20
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    res.json({ items: items.slice(0, 20) });
  } catch (err) {
    req.log.error(err, "Activity feed error");
    res.status(500).json({ error: "Failed to fetch activity." });
  }
});

export default router;
