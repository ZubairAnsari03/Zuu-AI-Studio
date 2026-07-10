import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const characterProfilesTable = pgTable("character_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  age: text("age"),
  gender: text("gender"),
  faceDescription: text("face_description"),
  hair: text("hair"),
  clothes: text("clothes"),
  bodyType: text("body_type"),
  personality: text("personality"),
  animalType: text("animal_type"),
  cartoonStyle: text("cartoon_style"),
  referenceImageUrl: text("reference_image_url"),
  consistencyNotes: text("consistency_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCharacterProfileSchema = createInsertSchema(
  characterProfilesTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCharacterProfile = z.infer<
  typeof insertCharacterProfileSchema
>;
export type CharacterProfile = typeof characterProfilesTable.$inferSelect;
