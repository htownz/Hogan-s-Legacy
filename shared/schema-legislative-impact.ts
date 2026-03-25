import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { bills } from "./schema";

/**
 * Table to store legislative impact analyses
 */
export const legislativeImpactAnalyses = pgTable("legislative_impact_analyses", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id, { onDelete: "cascade" }),
  analysis: jsonb("analysis").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});

/**
 * Relations for legislative impact analyses
 */
export const legislativeImpactAnalysesRelations = relations(legislativeImpactAnalyses, ({ one }) => ({
  bill: one(bills, {
    fields: [legislativeImpactAnalyses.billId],
    references: [bills.id]
  })
}));

/**
 * Type definitions for legislative impact analyses
 */
export type LegislativeImpactAnalysis = typeof legislativeImpactAnalyses.$inferSelect;
export type InsertLegislativeImpactAnalysis = typeof legislativeImpactAnalyses.$inferInsert;

/**
 * Insertion schema for legislative impact analyses
 */
export const insertLegislativeImpactAnalysisSchema = createInsertSchema(legislativeImpactAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});