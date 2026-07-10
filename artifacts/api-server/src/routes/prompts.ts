import { Router } from "express";
import { db } from "@workspace/db";
import { savedPromptsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { enhancePrompt } from "../lib/promptEnhancer.js";
import { z } from "zod";

const router = Router();

// POST /prompts/enhance
router.post("/enhance", requireAuth, async (req, res) => {
  const schema = z.object({
    prompt: z.string().min(1).max(4000),
    style: z.string().nullish(),
    aspectRatio: z.string().nullish(),
    cameraMovement: z.string().nullish(),
    lighting: z.string().nullish(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const result = enhancePrompt(parsed.data);
    res.json(result);
  } catch (err) {
    req.log.error(err, "Enhance prompt error");
    res.status(500).json({ error: "Failed to enhance prompt." });
  }
});

// GET /prompts
router.get("/", requireAuth, async (req, res) => {
  try {
    const prompts = await db
      .select()
      .from(savedPromptsTable)
      .where(eq(savedPromptsTable.userId, req.user!.userId));

    res.json(prompts);
  } catch (err) {
    req.log.error(err, "List prompts error");
    res.status(500).json({ error: "Failed to fetch prompts." });
  }
});

// POST /prompts
router.post("/", requireAuth, async (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(200),
    prompt: z.string().min(1).max(4000),
    enhancedPrompt: z.string().max(8000).nullish(),
    style: z.string().nullish(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const [prompt] = await db
      .insert(savedPromptsTable)
      .values({ userId: req.user!.userId, ...parsed.data })
      .returning();

    res.status(201).json(prompt);
  } catch (err) {
    req.log.error(err, "Save prompt error");
    res.status(500).json({ error: "Failed to save prompt." });
  }
});

// DELETE /prompts/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));

  try {
    const deleted = await db
      .delete(savedPromptsTable)
      .where(
        and(
          eq(savedPromptsTable.id, id),
          eq(savedPromptsTable.userId, req.user!.userId),
        ),
      )
      .returning({ id: savedPromptsTable.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Prompt not found." });
      return;
    }

    res.json({ message: "Prompt deleted." });
  } catch (err) {
    req.log.error(err, "Delete prompt error");
    res.status(500).json({ error: "Failed to delete prompt." });
  }
});

export default router;
