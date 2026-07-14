import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /notifications
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const items = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    const unreadCount = items.filter((n) => !n.read).length;
    res.json({ items, unreadCount });
  } catch (err) {
    req.log.error(err, "List notifications error");
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// PATCH /notifications/read-all
router.patch("/read-all", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    req.log.error(err, "Mark all read error");
    res.status(500).json({ error: "Failed to update notifications." });
  }
});

// PATCH /notifications/:id/read
router.patch("/:id/read", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));
  const userId = req.user!.userId;
  try {
    const [updated] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Notification not found." }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err, "Mark read error");
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// DELETE /notifications/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));
  const userId = req.user!.userId;
  try {
    const deleted = await db
      .delete(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
      .returning({ id: notificationsTable.id });
    if (deleted.length === 0) { res.status(404).json({ error: "Notification not found." }); return; }
    res.json({ message: "Notification dismissed." });
  } catch (err) {
    req.log.error(err, "Dismiss notification error");
    res.status(500).json({ error: "Failed to dismiss notification." });
  }
});

export default router;
