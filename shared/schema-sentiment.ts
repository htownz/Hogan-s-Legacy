import { pgTable, text, serial, integer, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { bills, users } from "./schema";

// ---- SENTIMENT SNAPSHOTS ----
// This table stores periodic snapshots of sentiment for bills
export const billSentimentSnapshots = pgTable("bill_sentiment_snapshots", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  snapshotDate: date("snapshot_date").notNull(),
  overallSentiment: integer("overall_sentiment").notNull(), // -100 to 100 
  communitySupport: integer("community_support").notNull(), // Percentage 0-100
  socialMediaSentiment: integer("social_media_sentiment"), // -100 to 100
  newsMediaSentiment: integer("news_media_sentiment"), // -100 to 100
  legislatorSentiment: integer("legislator_sentiment"), // -100 to 100
  communityEngagement: integer("community_engagement").notNull(), // Raw count of interactions
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata").default({}), // Store additional metrics as needed
});

export const insertBillSentimentSnapshotSchema = createInsertSchema(billSentimentSnapshots).pick({
  billId: true,
  snapshotDate: true,
  overallSentiment: true,
  communitySupport: true,
  socialMediaSentiment: true, 
  newsMediaSentiment: true,
  legislatorSentiment: true,
  communityEngagement: true,
  metadata: true,
});

export type InsertBillSentimentSnapshot = z.infer<typeof insertBillSentimentSnapshotSchema>;
export type BillSentimentSnapshot = typeof billSentimentSnapshots.$inferSelect;

// ---- SENTIMENT BY DEMOGRAPHICS ----
// This table tracks sentiment breakdowns by demographic groups
export const demographicSentimentBreakdowns = pgTable("demographic_sentiment_breakdowns", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  snapshotDate: date("snapshot_date").notNull(),
  demographicGroup: text("demographic_group").notNull(), // e.g., "age_18_24", "region_central", etc.
  demographicValue: text("demographic_value").notNull(), // e.g., "18-24", "Central Texas", etc.
  sentiment: integer("sentiment").notNull(), // -100 to 100
  sampleSize: integer("sample_size").notNull(), // Number of people in this demographic group
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDemographicSentimentBreakdownSchema = createInsertSchema(demographicSentimentBreakdowns).pick({
  billId: true,
  snapshotDate: true,
  demographicGroup: true,
  demographicValue: true,
  sentiment: true,
  sampleSize: true,
});

export type InsertDemographicSentimentBreakdown = z.infer<typeof insertDemographicSentimentBreakdownSchema>;
export type DemographicSentimentBreakdown = typeof demographicSentimentBreakdowns.$inferSelect;

// ---- SENTIMENT TRIGGERS ----
// This table tracks significant events that may have caused sentiment shifts
export const sentimentTriggers = pgTable("sentiment_triggers", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  triggerDate: date("trigger_date").notNull(),
  triggerType: text("trigger_type").notNull(), // "news_event", "legislative_action", "social_media_trend", etc.
  description: text("description").notNull(),
  impact: integer("impact").notNull(), // -100 to 100, measure of how much this affected sentiment
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSentimentTriggerSchema = createInsertSchema(sentimentTriggers).pick({
  billId: true,
  triggerDate: true,
  triggerType: true,
  description: true,
  impact: true,
  sourceName: true,
  sourceUrl: true,
});

export type InsertSentimentTrigger = z.infer<typeof insertSentimentTriggerSchema>;
export type SentimentTrigger = typeof sentimentTriggers.$inferSelect;

// ---- USER SENTIMENT VOTES ----
// This table tracks individual user sentiment votes on bills
export const userSentimentVotes = pgTable("user_sentiment_votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  sentiment: integer("sentiment").notNull(), // -100 to 100
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSentimentVoteSchema = createInsertSchema(userSentimentVotes).pick({
  userId: true,
  billId: true,
  sentiment: true,
  comment: true,
});

export type InsertUserSentimentVote = z.infer<typeof insertUserSentimentVoteSchema>;
export type UserSentimentVote = typeof userSentimentVotes.$inferSelect;

// ---- RELATIONS ----
export const billSentimentSnapshotsRelations = relations(billSentimentSnapshots, ({ one }) => ({
  bill: one(bills, {
    fields: [billSentimentSnapshots.billId],
    references: [bills.id],
  }),
}));

export const demographicSentimentBreakdownsRelations = relations(demographicSentimentBreakdowns, ({ one }) => ({
  bill: one(bills, {
    fields: [demographicSentimentBreakdowns.billId],
    references: [bills.id],
  }),
}));

export const sentimentTriggersRelations = relations(sentimentTriggers, ({ one }) => ({
  bill: one(bills, {
    fields: [sentimentTriggers.billId],
    references: [bills.id],
  }),
}));

export const userSentimentVotesRelations = relations(userSentimentVotes, ({ one }) => ({
  user: one(users, {
    fields: [userSentimentVotes.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [userSentimentVotes.billId],
    references: [bills.id],
  }),
}));