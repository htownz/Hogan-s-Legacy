// Trending bills and passage probability analysis
import { pgTable, serial, text, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { bills } from './schema';
import { z } from 'zod';

// Table to store bill passage probability analytics
export const billPassageProbabilities = pgTable("bill_passage_probabilities", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  passageProbability: numeric("passage_probability", { precision: 5, scale: 2 }).notNull(), // 0-100 percentage
  stageOdds: jsonb("stage_odds").notNull(), // JSON object with probabilities for each stage
  reasoningFactors: jsonb("reasoning_factors").notNull(), // Factors that influenced the prediction
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  similarBillsData: jsonb("similar_bills_data"), // Optional comparison to historical bills
  momentum: integer("momentum").notNull(), // -100 to 100 scale of acceleration/deceleration
  communityInterest: integer("community_interest"), // Optional measure of user interest
  confidenceScore: integer("confidence_score").notNull().default(50), // 0-100 confidence in prediction
});

// Insert schema
export const insertBillPassageProbabilitySchema = createInsertSchema(billPassageProbabilities).pick({
  billId: true,
  passageProbability: true,
  stageOdds: true,
  reasoningFactors: true,
  momentum: true,
  communityInterest: true,
  confidenceScore: true,
  similarBillsData: true,
});

// Export types
export type BillPassageProbability = typeof billPassageProbabilities.$inferSelect;
export type InsertBillPassageProbability = z.infer<typeof insertBillPassageProbabilitySchema>;

// Table relations
export const billPassageProbabilitiesRelations = relations(billPassageProbabilities, ({ one }) => ({
  bill: one(bills, {
    fields: [billPassageProbabilities.billId],
    references: [bills.id],
  }),
}));

// Table to store trending bills metrics
export const trendingBillMetrics = pgTable("trending_bill_metrics", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  trendingScore: integer("trending_score").notNull(), // 0-100 score based on combined factors
  weeklyViewChange: integer("weekly_view_change"), // Percentage change in views
  socialMentions: integer("social_mentions"), // Count of social media mentions (if available)
  newAnnotations: integer("new_annotations"), // Count of new annotations/comments
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
  historicalScores: jsonb("historical_scores"), // JSON array of historical trending scores with dates
});

// Insert schema
export const insertTrendingBillMetricsSchema = createInsertSchema(trendingBillMetrics).pick({
  billId: true,
  trendingScore: true,
  weeklyViewChange: true,
  socialMentions: true,
  newAnnotations: true,
  historicalScores: true,
});

// Export types
export type TrendingBillMetric = typeof trendingBillMetrics.$inferSelect;
export type InsertTrendingBillMetric = z.infer<typeof insertTrendingBillMetricsSchema>;

// Table relations
export const trendingBillMetricsRelations = relations(trendingBillMetrics, ({ one }) => ({
  bill: one(bills, {
    fields: [trendingBillMetrics.billId],
    references: [bills.id],
  }),
}));