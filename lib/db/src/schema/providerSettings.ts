import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providerSettingsTable = pgTable("provider_settings", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProviderSettingSchema = createInsertSchema(
  providerSettingsTable,
).omit({ id: true, updatedAt: true });
export type InsertProviderSetting = z.infer<typeof insertProviderSettingSchema>;
export type ProviderSetting = typeof providerSettingsTable.$inferSelect;
