import { Router } from "express";
import { db } from "@workspace/db";
import {
  videoGenerationsTable,
  usersTable,
  creditTransactionsTable,
} from "@workspace/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { generationLimiter } from "../middlewares/rateLimiter.js";
import { moderateAllFields } from "../lib/contentModeration.js";
import { calculateCredits } from "../lib/creditsCalculator.js";
import { getProvider } from "../providers/index.js";
import { z } from "zod";

const router = Router();

const generateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  enhancedPrompt: z.string().max(8000).nullish(),
  negativePrompt: z.string().max(2000).nullish(),
  style: z.string().min(1),
  aspectRatio: z.enum(["9:16", "16:9", "1:1", "4:5"]),
  duration: z
    .number()
    .int()
    .refine((n: number) => [5, 10, 15, 24, 30, 60].includes(n)),
  quality: z.enum(["standard", "hd", "full_hd", "4k"]).default("standard"),
  cameraMovement: z.string().nullish(),
  lighting: z.string().nullish(),
  motionStrength: z.enum(["low", "medium", "high"]).default("medium"),
  seed: z.number().int().nullish(),
  provider: z.string().default("mock"),
  characterProfileId: z.number().int().nullish(),
  referenceImageUrl: z.string().url().nullish(),
  scenes: z.array(z.any()).nullish(),
});

// GET /videos/stats — must come before /:id
router.get("/stats", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const rows = await db
      .select({
        status: videoGenerationsTable.status,
        isFavourite: videoGenerationsTable.isFavourite,
        creditsUsed: videoGenerationsTable.creditsUsed,
      })
      .from(videoGenerationsTable)
      .where(eq(videoGenerationsTable.userId, userId));

    const total = rows.length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const processing = rows.filter(
      (r) => r.status === "processing" || r.status === "queued",
    ).length;
    const failed = rows.filter((r) => r.status === "failed").length;
    const creditsUsed = rows.reduce((sum, r) => sum + (r.creditsUsed ?? 0), 0);
    const favourites = rows.filter((r) => r.isFavourite).length;

    res.json({ total, completed, processing, failed, creditsUsed, favourites });
  } catch (err) {
    req.log.error(err, "Get video stats error");
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// GET /videos
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const statusFilter = req.query.status as string | undefined;
  const favouriteFilter = req.query.favourite;

  try {
    const conditions = [eq(videoGenerationsTable.userId, userId)];
    if (statusFilter) {
      conditions.push(eq(videoGenerationsTable.status, statusFilter));
    }
    if (favouriteFilter === "true") {
      conditions.push(eq(videoGenerationsTable.isFavourite, true));
    }

    const whereClause = and(...conditions);

    const [{ total }] = await db
      .select({ total: count() })
      .from(videoGenerationsTable)
      .where(whereClause);

    const items = await db
      .select()
      .from(videoGenerationsTable)
      .where(whereClause)
      .orderBy(desc(videoGenerationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ items, total, page, limit });
  } catch (err) {
    req.log.error(err, "List videos error");
    res.status(500).json({ error: "Failed to fetch videos." });
  }
});

// POST /videos
router.post("/", requireAuth, generationLimiter, async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const userId = req.user!.userId;
  const input = parsed.data;

  // Moderate ALL user-supplied text fields to prevent bypasses
  const sceneTexts = (input.scenes ?? []).flatMap((s: Record<string, unknown>) =>
    [s.description, s.characterAction, s.dialogue, s.soundEffect].filter(
      (v) => typeof v === "string",
    ),
  ) as string[];

  const modResult = moderateAllFields([
    input.prompt,
    input.enhancedPrompt,
    input.negativePrompt,
    ...sceneTexts,
  ]);
  if (!modResult.allowed) {
    res.status(400).json({ error: modResult.reason });
    return;
  }

  const creditsNeeded = calculateCredits(input.duration, input.quality);

  try {
    // Atomic: create job + deduct credits + record transaction in one transaction.
    // The credit deduction uses a WHERE guard to prevent overdraft races.
    let gen: typeof videoGenerationsTable.$inferSelect | undefined;

    await db.transaction(async (tx) => {
      // Atomically deduct credits — only succeeds if balance is sufficient
      const updated = await tx
        .update(usersTable)
        .set({ credits: sql`${usersTable.credits} - ${creditsNeeded}` })
        .where(
          and(
            eq(usersTable.id, userId),
            sql`${usersTable.credits} >= ${creditsNeeded}`,
          ),
        )
        .returning({ id: usersTable.id });

      if (updated.length === 0) {
        // Check if user exists at all vs insufficient credits
        const [user] = await tx
          .select({ credits: usersTable.credits })
          .from(usersTable)
          .where(eq(usersTable.id, userId))
          .limit(1);
        if (!user) throw new Error("USER_NOT_FOUND");
        throw new Error(
          `INSUFFICIENT_CREDITS:${creditsNeeded}:${user.credits}`,
        );
      }

      // Record debit transaction
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -creditsNeeded,
        type: "debit",
        description: `Video generation: ${input.duration}s ${input.quality} (${input.provider})`,
      });

      // Create generation record
      const [created] = await tx
        .insert(videoGenerationsTable)
        .values({
          userId,
          prompt: input.prompt,
          enhancedPrompt: input.enhancedPrompt ?? null,
          negativePrompt: input.negativePrompt ?? null,
          style: input.style,
          aspectRatio: input.aspectRatio,
          duration: input.duration,
          quality: input.quality,
          cameraMovement: input.cameraMovement ?? null,
          lighting: input.lighting ?? null,
          motionStrength: input.motionStrength,
          seed: input.seed ?? null,
          provider: input.provider,
          characterProfileId: input.characterProfileId ?? null,
          referenceImageUrl: input.referenceImageUrl ?? null,
          scenes: input.scenes ?? null,
          status: "queued",
          progressMessage: "Preparing generation",
          creditsUsed: creditsNeeded,
        })
        .returning();

      gen = created;
    });

    if (!gen) throw new Error("Transaction produced no generation record");

    const capturedGen = gen;

    // Start generation in background — refund on failure
    const provider = getProvider(input.provider);
    void (async () => {
      try {
        const result = await provider.generateVideo({
          prompt: input.prompt,
          enhancedPrompt: input.enhancedPrompt,
          negativePrompt: input.negativePrompt,
          style: input.style,
          aspectRatio: input.aspectRatio,
          duration: input.duration,
          quality: input.quality,
          cameraMovement: input.cameraMovement,
          lighting: input.lighting,
          motionStrength: input.motionStrength,
          seed: input.seed,
          referenceImageUrl: input.referenceImageUrl,
        });

        await db
          .update(videoGenerationsTable)
          .set({
            providerJobId: result.providerJobId,
            status: result.status,
            progressMessage: result.progressMessage ?? "Generation started",
            updatedAt: new Date(),
          })
          .where(eq(videoGenerationsTable.id, capturedGen.id));
      } catch (err) {
        // Provider failed to accept the job — refund credits
        await db.transaction(async (tx) => {
          await tx
            .update(usersTable)
            .set({ credits: sql`${usersTable.credits} + ${creditsNeeded}` })
            .where(eq(usersTable.id, userId));

          await tx.insert(creditTransactionsTable).values({
            userId,
            amount: creditsNeeded,
            type: "credit",
            description: `Refund: provider failed to start generation #${capturedGen.id}`,
          });

          await tx
            .update(videoGenerationsTable)
            .set({
              status: "failed",
              errorMessage:
                err instanceof Error ? err.message : "Provider error",
              creditsUsed: 0,
              updatedAt: new Date(),
            })
            .where(eq(videoGenerationsTable.id, capturedGen.id));
        });
      }
    })();

    res.status(201).json(capturedGen);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "USER_NOT_FOUND") {
        res.status(401).json({ error: "User not found." });
        return;
      }
      if (err.message.startsWith("INSUFFICIENT_CREDITS:")) {
        const [, needed, have] = err.message.split(":");
        res.status(402).json({
          error: `Insufficient credits. This generation requires ${needed} credits but you have ${have}.`,
        });
        return;
      }
    }
    req.log.error(err, "Generate video error");
    res.status(500).json({ error: "Failed to start generation." });
  }
});

// GET /videos/:id/status
router.get("/:id/status", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));
  const userId = req.user!.userId;

  try {
    const [gen] = await db
      .select()
      .from(videoGenerationsTable)
      .where(
        and(
          eq(videoGenerationsTable.id, id),
          eq(videoGenerationsTable.userId, userId),
        ),
      )
      .limit(1);

    if (!gen) {
      res.status(404).json({ error: "Generation not found." });
      return;
    }

    // Poll provider for live status updates
    if (
      (gen.status === "queued" || gen.status === "processing") &&
      gen.providerJobId
    ) {
      try {
        const provider = getProvider(gen.provider);
        const status = await provider.getStatus(gen.providerJobId);

        await db
          .update(videoGenerationsTable)
          .set({
            status: status.status,
            progressMessage: status.progressMessage ?? gen.progressMessage,
            videoUrl: status.videoUrl ?? gen.videoUrl,
            thumbnailUrl: status.thumbnailUrl ?? gen.thumbnailUrl,
            errorMessage: status.errorMessage ?? gen.errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(videoGenerationsTable.id, id));

        res.json({
          id: gen.id,
          status: status.status,
          progressMessage: status.progressMessage ?? gen.progressMessage,
          videoUrl: status.videoUrl ?? gen.videoUrl,
          thumbnailUrl: status.thumbnailUrl ?? gen.thumbnailUrl,
          errorMessage: status.errorMessage ?? gen.errorMessage,
        });
        return;
      } catch {
        // Return last known status if poll fails
      }
    }

    res.json({
      id: gen.id,
      status: gen.status,
      progressMessage: gen.progressMessage,
      videoUrl: gen.videoUrl,
      thumbnailUrl: gen.thumbnailUrl,
      errorMessage: gen.errorMessage,
    });
  } catch (err) {
    req.log.error(err, "Get video status error");
    res.status(500).json({ error: "Failed to fetch status." });
  }
});

// POST /videos/:id/regenerate
router.post(
  "/:id/regenerate",
  requireAuth,
  generationLimiter,
  async (req, res) => {
    const id = parseInt(String(req.params.id ?? "0"));
    const userId = req.user!.userId;

    try {
      const [original] = await db
        .select()
        .from(videoGenerationsTable)
        .where(
          and(
            eq(videoGenerationsTable.id, id),
            eq(videoGenerationsTable.userId, userId),
          ),
        )
        .limit(1);

      if (!original) {
        res.status(404).json({ error: "Generation not found." });
        return;
      }

      const creditsNeeded = calculateCredits(original.duration, original.quality);

      let gen: typeof videoGenerationsTable.$inferSelect | undefined;

      // Atomic credit deduction + job creation + transaction record
      await db.transaction(async (tx) => {
        const updated = await tx
          .update(usersTable)
          .set({ credits: sql`${usersTable.credits} - ${creditsNeeded}` })
          .where(
            and(
              eq(usersTable.id, userId),
              sql`${usersTable.credits} >= ${creditsNeeded}`,
            ),
          )
          .returning({ id: usersTable.id });

        if (updated.length === 0) {
          const [user] = await tx
            .select({ credits: usersTable.credits })
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);
          throw new Error(
            `INSUFFICIENT_CREDITS:${creditsNeeded}:${user?.credits ?? 0}`,
          );
        }

        // Record debit transaction
        await tx.insert(creditTransactionsTable).values({
          userId,
          amount: -creditsNeeded,
          type: "debit",
          description: `Regeneration: ${original.duration}s ${original.quality} (${original.provider})`,
        });

        const [created] = await tx
          .insert(videoGenerationsTable)
          .values({
            userId,
            prompt: original.prompt,
            enhancedPrompt: original.enhancedPrompt,
            negativePrompt: original.negativePrompt,
            style: original.style,
            aspectRatio: original.aspectRatio,
            duration: original.duration,
            quality: original.quality,
            cameraMovement: original.cameraMovement,
            lighting: original.lighting,
            motionStrength: original.motionStrength,
            seed: original.seed,
            provider: original.provider,
            characterProfileId: original.characterProfileId,
            status: "queued",
            progressMessage: "Preparing regeneration",
            creditsUsed: creditsNeeded,
          })
          .returning();

        gen = created;
      });

      if (!gen) throw new Error("Transaction produced no generation record");
      const capturedGen = gen;

      const provider = getProvider(original.provider);
      void (async () => {
        try {
          const result = await provider.generateVideo({
            prompt: original.prompt,
            enhancedPrompt: original.enhancedPrompt,
            negativePrompt: original.negativePrompt,
            style: original.style,
            aspectRatio: original.aspectRatio,
            duration: original.duration,
            quality: original.quality,
            cameraMovement: original.cameraMovement,
            lighting: original.lighting,
            motionStrength: original.motionStrength,
            seed: original.seed,
          });
          await db
            .update(videoGenerationsTable)
            .set({
              providerJobId: result.providerJobId,
              status: result.status,
              progressMessage: result.progressMessage ?? "Generation started",
              updatedAt: new Date(),
            })
            .where(eq(videoGenerationsTable.id, capturedGen.id));
        } catch (err) {
          // Refund on provider failure
          await db.transaction(async (tx) => {
            await tx
              .update(usersTable)
              .set({ credits: sql`${usersTable.credits} + ${creditsNeeded}` })
              .where(eq(usersTable.id, userId));
            await tx.insert(creditTransactionsTable).values({
              userId,
              amount: creditsNeeded,
              type: "credit",
              description: `Refund: provider failed to start regeneration #${capturedGen.id}`,
            });
            await tx
              .update(videoGenerationsTable)
              .set({
                status: "failed",
                errorMessage:
                  err instanceof Error ? err.message : "Provider error",
                creditsUsed: 0,
                updatedAt: new Date(),
              })
              .where(eq(videoGenerationsTable.id, capturedGen.id));
          });
        }
      })();

      res.status(201).json(capturedGen);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("INSUFFICIENT_CREDITS:")) {
        const [, needed, have] = err.message.split(":");
        res.status(402).json({
          error: `Insufficient credits. Need ${needed} but you have ${have}.`,
        });
        return;
      }
      req.log.error(err, "Regenerate error");
      res.status(500).json({ error: "Failed to regenerate." });
    }
  },
);

// POST /videos/:id/favourite
router.post("/:id/favourite", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));
  const userId = req.user!.userId;

  try {
    const [gen] = await db
      .select({ isFavourite: videoGenerationsTable.isFavourite })
      .from(videoGenerationsTable)
      .where(
        and(
          eq(videoGenerationsTable.id, id),
          eq(videoGenerationsTable.userId, userId),
        ),
      )
      .limit(1);

    if (!gen) {
      res.status(404).json({ error: "Generation not found." });
      return;
    }

    const [updated] = await db
      .update(videoGenerationsTable)
      .set({ isFavourite: !gen.isFavourite, updatedAt: new Date() })
      .where(eq(videoGenerationsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error(err, "Toggle favourite error");
    res.status(500).json({ error: "Failed to update favourite." });
  }
});

// GET /videos/:id
router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));
  const userId = req.user!.userId;

  try {
    const [gen] = await db
      .select()
      .from(videoGenerationsTable)
      .where(
        and(
          eq(videoGenerationsTable.id, id),
          eq(videoGenerationsTable.userId, userId),
        ),
      )
      .limit(1);

    if (!gen) {
      res.status(404).json({ error: "Generation not found." });
      return;
    }

    res.json(gen);
  } catch (err) {
    req.log.error(err, "Get video error");
    res.status(500).json({ error: "Failed to fetch video." });
  }
});

// DELETE /videos/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id ?? "0"));
  const userId = req.user!.userId;

  try {
    const deleted = await db
      .delete(videoGenerationsTable)
      .where(
        and(
          eq(videoGenerationsTable.id, id),
          eq(videoGenerationsTable.userId, userId),
        ),
      )
      .returning({ id: videoGenerationsTable.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: "Generation not found." });
      return;
    }

    res.json({ message: "Video generation deleted." });
  } catch (err) {
    req.log.error(err, "Delete video error");
    res.status(500).json({ error: "Failed to delete video." });
  }
});

export default router;
