import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { committeeMeetings } from './schema';

// ---- COMMITTEE MEETING TAGGED SEGMENTS ----
export const committeeMeetingTaggedSegments = pgTable("committee_meeting_tagged_segments", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull().references(() => committeeMeetings.id),
  startTime: integer("start_time").notNull(), // in seconds from start of video
  endTime: integer("end_time").notNull(), // in seconds from start of video
  transcript: text("transcript").notNull(),
  speakerName: text("speaker_name"),
  speakerRole: text("speaker_role"),
  speakerAffiliation: text("speaker_affiliation"),
  isPublicTestimony: boolean("is_public_testimony").notNull().default(false),
  billReferences: text("bill_references").notNull(), // JSON string containing bill IDs and confidence
  keyTopics: text("key_topics").notNull(), // JSON array of topic strings
  sentiment: text("sentiment").notNull().default("neutral"), // positive, negative, neutral, mixed
  importance: integer("importance").notNull().default(5), // 1-10 scale
  isQuestion: boolean("is_question").notNull().default(false),
  tags: text("tags").notNull(), // JSON array of tag strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommitteeMeetingTaggedSegmentSchema = createInsertSchema(committeeMeetingTaggedSegments).pick({
  meetingId: true,
  startTime: true,
  endTime: true,
  transcript: true,
  speakerName: true,
  speakerRole: true,
  speakerAffiliation: true,
  isPublicTestimony: true,
  billReferences: true,
  keyTopics: true,
  sentiment: true,
  importance: true,
  isQuestion: true,
  tags: true,
});

export type CommitteeMeetingTaggedSegment = typeof committeeMeetingTaggedSegments.$inferSelect;
export type InsertCommitteeMeetingTaggedSegment = z.infer<typeof insertCommitteeMeetingTaggedSegmentSchema>;

// Add relations for the tagged segments
export const committeeMeetingTaggedSegmentsRelations = relations(committeeMeetingTaggedSegments, ({ one }) => ({
  meeting: one(committeeMeetings, {
    fields: [committeeMeetingTaggedSegments.meetingId],
    references: [committeeMeetings.id],
  }),
}));