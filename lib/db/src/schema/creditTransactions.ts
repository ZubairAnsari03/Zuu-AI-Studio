import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const creditTransactionsTable = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive = credit, negative = debit
  type: text("type").notNull(), // "credit" | "debit"
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCreditTransactionSchema = createInsertSchema(
  creditTransactionsTable,
).omit({ id: true, createdAt: true });
export type InsertCreditTransaction = z.infer<
  typeof insertCreditTransactionSchema
>;
export type CreditTransaction = typeof creditTransactionsTable.$inferSelect;
