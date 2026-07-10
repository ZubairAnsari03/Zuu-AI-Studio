import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const savedPromptsTable = pgTable("saved_prompts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  enhancedPrompt: text("enhanced_prompt"),
  style: text("style"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSavedPromptSchema = createInsertSchema(
  savedPromptsTable,
).omit({ id: true, createdAt: true });
export type InsertSavedPrompt = z.infer<typeof insertSavedPromptSchema>;
export type SavedPrompt = typeof savedPromptsTable.$inferSelect;
