import { pgTable, serial, text, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { committeeMeetings, committees } from './schema';

// Live Stream Segments for Real-Time Committee Meeting Analysis
export const liveStreamSegments = pgTable("live_stream_segments", {
  id: serial("id").primaryKey(),
  committeeMeetingId: integer("committee_meeting_id").notNull().references(() => committeeMeetings.id),
  committeeId: integer("committee_id").notNull().references(() => committees.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  startTimestamp: text("start_timestamp").notNull(), // Format: HH:MM:SS
  endTimestamp: text("end_timestamp").notNull(), // Format: HH:MM:SS
  description: text("description").notNull(),
  speakerName: text("speaker_name"),
  speakerRole: text("speaker_role"),
  speakerAffiliation: text("speaker_affiliation"),
  billIds: text("bill_ids"), // Comma-separated list of bill IDs
  billsDiscussed: text("bills_discussed"), // Human-readable list of bills
  keyWords: text("key_words").array(), // Array of keywords
  summary: text("summary").notNull(),
  sentimentScore: integer("sentiment_score").default(0), // -100 to 100
  isPublicTestimony: boolean("is_public_testimony").default(false),
  position: text("position"), // 'for', 'against', 'neutral'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLiveStreamSegmentSchema = createInsertSchema(liveStreamSegments).omit({
  id: true,
  createdAt: true
});

export type LiveStreamSegment = typeof liveStreamSegments.$inferSelect;
export type InsertLiveStreamSegment = z.infer<typeof insertLiveStreamSegmentSchema>;

// Relations for live stream segments
export const liveStreamSegmentsRelations = relations(liveStreamSegments, ({ one }) => ({
  meeting: one(committeeMeetings, {
    fields: [liveStreamSegments.committeeMeetingId],
    references: [committeeMeetings.id],
  }),
  committee: one(committees, {
    fields: [liveStreamSegments.committeeId],
    references: [committees.id],
  }),
}));

// Notable quotes from committee meetings
export const liveStreamQuotes = pgTable("live_stream_quotes", {
  id: serial("id").primaryKey(),
  committeeMeetingId: integer("committee_meeting_id").notNull().references(() => committeeMeetings.id),
  speaker: text("speaker").notNull(),
  speakerRole: text("speaker_role"),
  speakerAffiliation: text("speaker_affiliation"),
  quote: text("quote").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  billId: text("bill_id"),
  sentiment: integer("sentiment").default(0), // -1 (against), 0 (neutral), 1 (for)
  isSignificant: boolean("is_significant").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLiveStreamQuoteSchema = createInsertSchema(liveStreamQuotes).omit({
  id: true,
  createdAt: true
});

export type LiveStreamQuote = typeof liveStreamQuotes.$inferSelect;
export type InsertLiveStreamQuote = z.infer<typeof insertLiveStreamQuoteSchema>;

// Relations for quotes
export const liveStreamQuotesRelations = relations(liveStreamQuotes, ({ one }) => ({
  meeting: one(committeeMeetings, {
    fields: [liveStreamQuotes.committeeMeetingId],
    references: [committeeMeetings.id],
  }),
}));

// Add new fields to committee meetings for enhanced analysis
// This would typically go in a migration file, but we're adding it here for reference
export const committeeMeetingsEnhancedFields = {
  // Final summaries of the meeting
  summarySummary: text("summary_summary"),
  summaryKeyPoints: text("summary_key_points"), // JSON string of key points
  summaryBillDiscussions: text("summary_bill_discussions"), // JSON string of bill discussions
  summaryPublicTestimonies: text("summary_public_testimonies"), // JSON string of public testimony summaries
  
  // Status fields
  processingStatus: text("processing_status").default("pending"), // pending, in_progress, completed, failed
  hasLiveStream: boolean("has_live_stream").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
};