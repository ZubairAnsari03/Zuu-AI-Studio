import { Router } from "express";
import { db } from "@workspace/db";
import { characterProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { z } from "zod";

const router = Router();

const characterSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.string().max(50).nullish(),
  gender: z.string().max(50).nullish(),
  faceDescription: z.string().max(1000).nullish(),
  hair: z.string().max(500).nullish(),
  clothes: z.string().max(500).nullish(),
  bodyType: z.string().max(200).nullish(),
  personality: z.string().max(500).nullish(),
  animalType: z.string().max(100).nullish(),
  cartoonStyle: z.string().max(200).nullish(),
  referenceImageUrl: z.string().url().nullish(),
  consistencyNotes: z.string().max(2000).nullish(),
});

// GET /characters
router.get("/", requireAuth, async (req, res) => {
  try {
    const characters = await db
      .select()
      .from(characterProfilesTable)
      .where(eq(characterProfilesTable.userId, req.user!.userId));

    res.json(characters);
  } catch (err) {
    req.log.error(err, "List characters error");
    res.status(500).json({ error: "Failed to fetch characters." });
  }
});

// POST /characters
router.post("/", requireAuth, async (req, res) => {
  const parsed = characterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const [character] = await db
      .insert(characterProfilesTable)
      .values({ userId: req.user!.userId, ...parsed.data })
      .returning();

    res.status(201).json(character);
  } catch (err) {
    req.log.error(err, "Create character error");
    res.status(500).json({ error: "Failed to create character." });
  }
});

// GET /characters/:id
router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));

  try {
    const [character] = await db
      .select()
      .from(characterProfilesTable)
      .where(
        and(
          eq(characterProfilesTable.id, id),
          eq(characterProfilesTable.userId, req.user!.userId),
        ),
      )
      .limit(1);

    if (!character) {
      res.status(404).json({ error: "Character not found." });
      return;
    }

    res.json(character);
  } catch (err) {
    req.log.error(err, "Get character error");
    res.status(500).json({ error: "Failed to fetch character." });
  }
});

// PUT /characters/:id
router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));
  const parsed = characterSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const [character] = await db
      .update(characterProfilesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(
          eq(characterProfilesTable.id, id),
          eq(characterProfilesTable.userId, req.user!.userId),
        ),
      )
      .returning();

    if (!character) {
      res.status(404).json({ error: "Character not found." });
      return;
    }

    res.json(character);
  } catch (err) {
    req.log.error(err, "Update character error");
    res.status(500).json({ error: "Failed to update character." });
  }
});

// DELETE /characters/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));

  try {
    const deleted = await db
      .delete(characterProfilesTable)
      .where(
        and(
          eq(characterProfilesTable.id, id),
          eq(characterProfilesTable.userId, req.user!.userId),
        ),
      )
      .returning({ id: characterProfilesTable.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Character not found." });
      return;
    }

    res.json({ message: "Character deleted." });
  } catch (err) {
    req.log.error(err, "Delete character error");
    res.status(500).json({ error: "Failed to delete character." });
  }
});

export default router;
