import { pgTable, serial, integer, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { videoGenerationsTable } from "./videoGenerations.js";

export const notificationsTable = pgTable("notifications", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type:      varchar("type", { length: 50 }).notNull(), // video_completed | video_failed | credits_added | system
  title:     varchar("title", { length: 255 }).notNull(),
  message:   text("message").notNull(),
  read:      boolean("read").notNull().default(false),
  videoId:   integer("video_id").references(() => videoGenerationsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
