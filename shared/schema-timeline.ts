import { text, integer, timestamp, pgTable, index, serial, boolean, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define timeline stages for bills
export const timelineStages = pgTable('timeline_stages', {
  id: serial('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id),
  stageType: text('stage_type').notNull(),
  stageTitle: text('stage_title').notNull(),
  stageDescription: text('stage_description'),
  stageAction: text('stage_action'),
  stageOrder: integer('stage_order').notNull(),
  stageDate: timestamp('stage_date'),
  completed: boolean('completed').default(false),
  active: boolean('active').default(false),
  voteData: json('vote_data').$type<{
    yeas?: number,
    nays?: number,
    present?: number,
    absent?: number,
    abstain?: number
  }>(),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Reference to existing bills table
export const bills = pgTable('bills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  sessionId: text('session_id'),
  status: text('status'),
  chamber: text('chamber'),
  authors: text('authors').array(),
  subjects: text('subjects').array(),
  fullText: text('full_text'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Timeline custom events (for annotations and user entries)
export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id),
  userId: integer('user_id'),
  title: text('title').notNull(),
  description: text('description'),
  eventDate: timestamp('event_date').notNull(),
  eventType: text('event_type').notNull(),
  isPublic: boolean('is_public').default(true),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// We'll create indexes in the migration script instead

// Schema for inserting timeline stages
export const insertTimelineStageSchema = createInsertSchema(timelineStages, {
  stageType: z.string().min(1),
  stageTitle: z.string().min(1),
  stageDescription: z.string().optional(),
  stageAction: z.string().optional(),
  stageOrder: z.number().int(),
  stageDate: z.date().optional(),
  completed: z.boolean().optional(),
  active: z.boolean().optional(),
  voteData: z.object({
    yeas: z.number().optional(),
    nays: z.number().optional(),
    present: z.number().optional(),
    absent: z.number().optional(),
    abstain: z.number().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
}).omit({ id: true, createdAt: true, updatedAt: true });

// Schema for inserting timeline events
export const insertTimelineEventSchema = createInsertSchema(timelineEvents, {
  title: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.date(),
  eventType: z.string().min(1),
  isPublic: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
}).omit({ id: true, createdAt: true, updatedAt: true });

// Define types
export type TimelineStage = typeof timelineStages.$inferSelect;
export type InsertTimelineStage = z.infer<typeof insertTimelineStageSchema>;

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;

// Define a stage type mapping for UI display
export const stageTypeNameMap = {
  introduced: 'Bill Filed',
  committee_assigned: 'Assigned to Committee',
  committee_hearing: 'Committee Hearing Scheduled',
  committee_vote: 'Committee Vote',
  chamber_vote_first: 'Chamber Vote (First)',
  other_chamber_assigned: 'Sent to Other Chamber',
  other_chamber_committee: 'Committee in Other Chamber',
  other_chamber_vote: 'Other Chamber Vote',
  conference_committee: 'Conference Committee',
  governor_action: 'Governor Action',
  effective: 'Effective Date',
  failed: 'Failed',
  withdrawn: 'Withdrawn'
};

// Define chamber specific text
export const chamberSpecificText = {
  house: {
    chamber_vote_first: 'House Vote (First Reading)',
    other_chamber_assigned: 'Sent to Senate',
    other_chamber_committee: 'Senate Committee',
    other_chamber_vote: 'Senate Vote'
  },
  senate: {
    chamber_vote_first: 'Senate Vote (First Reading)',
    other_chamber_assigned: 'Sent to House',
    other_chamber_committee: 'House Committee',
    other_chamber_vote: 'House Vote'
  }
};