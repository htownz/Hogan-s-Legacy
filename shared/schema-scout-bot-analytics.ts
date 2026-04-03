import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  integer, 
  pgEnum,
  json, 
  boolean,
  date
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { scoutBotProfiles } from "./schema-scout-bot";
import { scoutBotInfluenceNetworks, scoutBotInfluencePatterns } from "./schema-scout-bot-network";

// Analysis type enum
export const analysisTypeEnum = pgEnum("analysis_type", [
  "financial_flow",
  "revolving_door",
  "temporal_correlation",
  "coincidental_timing",
  "legislative_impact",
  "cross_dataset_pattern",
  "entity_connections",
  "historical_comparison"
]);

// Data source reliability enum
export const dataReliabilityEnum = pgEnum("data_reliability", [
  "verified",
  "high",
  "medium",
  "low",
  "unverified"
]);

// Advanced analysis results
export const scoutBotAdvancedAnalysis = pgTable("scout_bot_advanced_analysis", {
  id: uuid("id").primaryKey().notNull(),
  analysis_type: analysisTypeEnum("analysis_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  involved_entities: json("involved_entities").$type<{ 
    id: string, 
    name: string, 
    role: string, 
    relevance_score: number 
  }[]>(),
  analysis_data: json("analysis_data").$type<{
    metrics: Record<string, number>,
    dimensions: string[],
    time_series?: { date: string, values: Record<string, number> }[],
    anomalies?: { description: string, severity: number, confidence: number }[]
  }>(),
  source_datasets: json("source_datasets").$type<string[]>(),
  confidence_score: integer("confidence_score").default(70),
  data_reliability: dataReliabilityEnum("data_reliability").default("medium"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  related_network_id: uuid("related_network_id").references(() => scoutBotInfluenceNetworks.id),
  related_pattern_id: uuid("related_pattern_id").references(() => scoutBotInfluencePatterns.id)
});

// Historical trend analysis
export const scoutBotHistoricalTrends = pgTable("scout_bot_historical_trends", {
  id: uuid("id").primaryKey().notNull(),
  trend_name: text("trend_name").notNull(),
  description: text("description").notNull(),
  entity_type: text("entity_type").notNull(), // legislator, lobbyist, PAC, etc.
  metric_name: text("metric_name").notNull(), // donations, bills_sponsored, etc.
  time_range_start: date("time_range_start").notNull(),
  time_range_end: date("time_range_end").notNull(),
  trend_data: json("trend_data").$type<{
    periods: string[],
    values: number[],
    anomalies?: { period: string, expected: number, actual: number, deviation: number }[]
  }>(),
  trend_visualization: json("trend_visualization").$type<{
    chart_type: string,
    series: { name: string, data: number[] }[],
    annotations?: { type: string, x: string, y?: number, text?: string }[]
  }>(),
  significance_score: integer("significance_score").default(5), // 1-10
  verified: boolean("verified").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Cross-dataset anomaly detection
export const scoutBotCrossDatasetAnomalies = pgTable("scout_bot_cross_dataset_anomalies", {
  id: uuid("id").primaryKey().notNull(),
  anomaly_title: text("anomaly_title").notNull(),
  description: text("description").notNull(),
  primary_entity_id: uuid("primary_entity_id").references(() => scoutBotProfiles.id),
  involved_entities: json("involved_entities").$type<{ id: string, name: string, role: string }[]>(),
  datasets_involved: json("datasets_involved").$type<string[]>(),
  detection_method: text("detection_method").notNull(),
  anomaly_data: json("anomaly_data").$type<{
    signals: { name: string, value: number, threshold: number, source: string }[],
    correlation_factors: { factor: string, strength: number }[],
    timeline: { date: string, event: string, significance: number }[]
  }>(),
  severity_score: integer("severity_score").default(5), // 1-10
  confidence_score: integer("confidence_score").default(70), // 0-100
  status: text("status").default("pending"), // pending, confirmed, dismissed
  review_notes: text("review_notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Automated insights and reports
export const scoutBotAutomatedReports = pgTable("scout_bot_automated_reports", {
  id: uuid("id").primaryKey().notNull(),
  report_title: text("report_title").notNull(),
  report_type: text("report_type").notNull(), // daily_summary, entity_profile, network_analysis, etc.
  report_content: json("report_content").$type<{
    summary: string,
    key_findings: { title: string, description: string, importance: number }[],
    data_visualizations: { title: string, type: string, data_reference: string }[],
    detailed_sections: { title: string, content: string, references?: string[] }[]
  }>(),
  entities_covered: json("entities_covered").$type<{ id: string, name: string }[]>(),
  time_period: text("time_period"), // e.g., "2023Q1", "2022-W01"
  time_period_start: date("time_period_start"),
  time_period_end: date("time_period_end"),
  generated_at: timestamp("generated_at").defaultNow(),
  scheduled: boolean("scheduled").default(false),
  schedule_frequency: text("schedule_frequency"), // daily, weekly, monthly, etc.
  recipient_group: text("recipient_group"),
  last_sent: timestamp("last_sent"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Relations
export const scoutBotAdvancedAnalysisRelations = relations(
  scoutBotAdvancedAnalysis, 
  ({ one }) => ({
    relatedNetwork: one(scoutBotInfluenceNetworks, {
      fields: [scoutBotAdvancedAnalysis.related_network_id],
      references: [scoutBotInfluenceNetworks.id],
    }),
    relatedPattern: one(scoutBotInfluencePatterns, {
      fields: [scoutBotAdvancedAnalysis.related_pattern_id],
      references: [scoutBotInfluencePatterns.id],
    }),
  })
);

export const scoutBotCrossDatasetAnomaliesRelations = relations(
  scoutBotCrossDatasetAnomalies, 
  ({ one }) => ({
    primaryEntity: one(scoutBotProfiles, {
      fields: [scoutBotCrossDatasetAnomalies.primary_entity_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

// Extend profile relations
export const extendedScoutBotAnalyticsProfilesRelations = relations(
  scoutBotProfiles, 
  ({ many }) => ({
    anomalies: many(scoutBotCrossDatasetAnomalies),
  })
);

// Zod schemas for inserts
export const insertScoutBotAdvancedAnalysisSchema = createInsertSchema(scoutBotAdvancedAnalysis).omit({ id: true });
export const insertScoutBotHistoricalTrendsSchema = createInsertSchema(scoutBotHistoricalTrends).omit({ id: true });
export const insertScoutBotCrossDatasetAnomaliesSchema = createInsertSchema(scoutBotCrossDatasetAnomalies).omit({ id: true });
export const insertScoutBotAutomatedReportsSchema = createInsertSchema(scoutBotAutomatedReports).omit({ id: true });

// Types
export type InsertScoutBotAdvancedAnalysis = z.infer<typeof insertScoutBotAdvancedAnalysisSchema>;
export type ScoutBotAdvancedAnalysis = typeof scoutBotAdvancedAnalysis.$inferSelect;

export type InsertScoutBotHistoricalTrends = z.infer<typeof insertScoutBotHistoricalTrendsSchema>;
export type ScoutBotHistoricalTrends = typeof scoutBotHistoricalTrends.$inferSelect;

export type InsertScoutBotCrossDatasetAnomalies = z.infer<typeof insertScoutBotCrossDatasetAnomaliesSchema>;
export type ScoutBotCrossDatasetAnomalies = typeof scoutBotCrossDatasetAnomalies.$inferSelect;

export type InsertScoutBotAutomatedReports = z.infer<typeof insertScoutBotAutomatedReportsSchema>;
export type ScoutBotAutomatedReports = typeof scoutBotAutomatedReports.$inferSelect;