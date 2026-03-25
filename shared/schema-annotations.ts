import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const annotationVisibilityEnum = pgEnum('annotation_visibility', ['private', 'circle', 'public']);
export const annotationTypeEnum = pgEnum('annotation_type', ['comment', 'question', 'insight', 'actionItem', 'concern', 'support', 'opposition']);

// Tables
export const billAnnotations = pgTable('bill_annotations', {
  id: serial('id').primaryKey(),
  billId: text('bill_id').notNull(),
  userId: integer('user_id').notNull(),
  circleId: integer('circle_id'),
  textSelection: text('text_selection'),
  selectionStartIndex: integer('selection_start_index'),
  selectionEndIndex: integer('selection_end_index'),
  annotationType: annotationTypeEnum('annotation_type').notNull().default('comment'),
  content: text('content').notNull(),
  visibility: annotationVisibilityEnum('visibility').notNull().default('private'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  section: text('section'),
  sentiment: integer('sentiment').default(0),
});

export const annotationReplies = pgTable('annotation_replies', {
  id: serial('id').primaryKey(),
  annotationId: integer('annotation_id').notNull(),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const annotationReactions = pgTable('annotation_reactions', {
  id: serial('id').primaryKey(),
  annotationId: integer('annotation_id'),
  replyId: integer('reply_id'),
  userId: integer('user_id').notNull(),
  reaction: text('reaction').notNull(), // e.g., 'like', 'heart', 'insightful', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const annotationTags = pgTable('annotation_tags', {
  id: serial('id').primaryKey(),
  annotationId: integer('annotation_id').notNull(),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas (for validation)
export const insertBillAnnotationSchema = createInsertSchema(billAnnotations)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertAnnotationReplySchema = createInsertSchema(annotationReplies)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertAnnotationReactionSchema = createInsertSchema(annotationReactions)
  .omit({ id: true, createdAt: true });

export const insertAnnotationTagSchema = createInsertSchema(annotationTags)
  .omit({ id: true, createdAt: true });

// Types
export type BillAnnotation = typeof billAnnotations.$inferSelect;
export type InsertBillAnnotation = z.infer<typeof insertBillAnnotationSchema>;

export type AnnotationReply = typeof annotationReplies.$inferSelect;
export type InsertAnnotationReply = z.infer<typeof insertAnnotationReplySchema>;

export type AnnotationReaction = typeof annotationReactions.$inferSelect;
export type InsertAnnotationReaction = z.infer<typeof insertAnnotationReactionSchema>;

export type AnnotationTag = typeof annotationTags.$inferSelect;
export type InsertAnnotationTag = z.infer<typeof insertAnnotationTagSchema>;