import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { characterProfilesTable } from "./characterProfiles";

export const videoGenerationsTable = pgTable("video_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  enhancedPrompt: text("enhanced_prompt"),
  negativePrompt: text("negative_prompt"),
  style: text("style").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  duration: integer("duration").notNull(),
  quality: text("quality").notNull().default("standard"),
  cameraMovement: text("camera_movement"),
  lighting: text("lighting"),
  motionStrength: text("motion_strength").notNull().default("medium"),
  seed: integer("seed"),
  provider: text("provider").notNull().default("mock"),
  providerJobId: text("provider_job_id"),
  status: text("status").notNull().default("draft"),
  progressMessage: text("progress_message"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  referenceImageUrl: text("reference_image_url"),
  characterProfileId: integer("character_profile_id").references(
    () => characterProfilesTable.id,
    { onDelete: "set null" },
  ),
  scenes: jsonb("scenes"),
  isFavourite: boolean("is_favourite").notNull().default(false),
  creditsUsed: integer("credits_used").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVideoGenerationSchema = createInsertSchema(
  videoGenerationsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVideoGeneration = z.infer<typeof insertVideoGenerationSchema>;
export type VideoGeneration = typeof videoGenerationsTable.$inferSelect;
