import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const discussionVisibilityEnum = pgEnum('discussion_visibility', ['public', 'private', 'circle']);
export const discussionCategoryEnum = pgEnum('discussion_category', ['general', 'legislation', 'action', 'feedback', 'question', 'announcement']);
export const moderationStatusEnum = pgEnum('moderation_status', ['pending', 'approved', 'rejected', 'flagged']);

// Tables
export const discussionForums = pgTable('discussion_forums', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: discussionCategoryEnum('category').default('general').notNull(),
  visibility: discussionVisibilityEnum('visibility').default('public').notNull(),
  circleId: integer('circle_id'),
  billId: text('bill_id'),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  totalThreads: integer('total_threads').default(0).notNull(),
  totalPosts: integer('total_posts').default(0).notNull(),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
});

export const discussionThreads = pgTable('discussion_threads', {
  id: serial('id').primaryKey(),
  forumId: integer('forum_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  totalReplies: integer('total_replies').default(0).notNull(),
  totalReactions: integer('total_reactions').default(0).notNull(),
  lastReplyAt: timestamp('last_reply_at').defaultNow().notNull(),
  moderationStatus: moderationStatusEnum('moderation_status').default('approved').notNull(),
  moderatedBy: integer('moderated_by'),
  moderationNotes: text('moderation_notes'),
});

export const discussionPosts = pgTable('discussion_posts', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id').notNull(),
  content: text('content').notNull(),
  userId: integer('user_id').notNull(),
  replyToId: integer('reply_to_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isEdited: boolean('is_edited').default(false).notNull(),
  totalReactions: integer('total_reactions').default(0).notNull(),
  moderationStatus: moderationStatusEnum('moderation_status').default('approved').notNull(),
  moderatedBy: integer('moderated_by'),
  moderationNotes: text('moderation_notes'),
});

export const discussionReactions = pgTable('discussion_reactions', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id'),
  postId: integer('post_id'),
  userId: integer('user_id').notNull(),
  reaction: text('reaction').notNull(), // e.g., 'like', 'heart', 'insightful', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const discussionModerators = pgTable('discussion_moderators', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  forumId: integer('forum_id'),
  isSuperModerator: boolean('is_super_moderator').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  addedBy: integer('added_by').notNull(),
});

export const discussionReports = pgTable('discussion_reports', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id'),
  postId: integer('post_id'),
  reportedBy: integer('reported_by').notNull(),
  reason: text('reason').notNull(),
  details: text('details'),
  status: text('status').default('pending').notNull(), // 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewedBy: integer('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas (for validation)
export const insertDiscussionForumSchema = createInsertSchema(discussionForums)
  .omit({ id: true, createdAt: true, updatedAt: true, totalThreads: true, totalPosts: true, lastActivityAt: true });

export const insertDiscussionThreadSchema = createInsertSchema(discussionThreads)
  .omit({ id: true, createdAt: true, updatedAt: true, totalReplies: true, totalReactions: true, lastReplyAt: true });

export const insertDiscussionPostSchema = createInsertSchema(discussionPosts)
  .omit({ id: true, createdAt: true, updatedAt: true, isEdited: true, totalReactions: true });

export const insertDiscussionReactionSchema = createInsertSchema(discussionReactions)
  .omit({ id: true, createdAt: true });

export const insertDiscussionModeratorSchema = createInsertSchema(discussionModerators)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertDiscussionReportSchema = createInsertSchema(discussionReports)
  .omit({ id: true, createdAt: true, reviewedAt: true, status: true });

// Types
export type DiscussionForum = typeof discussionForums.$inferSelect;
export type InsertDiscussionForum = z.infer<typeof insertDiscussionForumSchema>;

export type DiscussionThread = typeof discussionThreads.$inferSelect;
export type InsertDiscussionThread = z.infer<typeof insertDiscussionThreadSchema>;

export type DiscussionPost = typeof discussionPosts.$inferSelect;
export type InsertDiscussionPost = z.infer<typeof insertDiscussionPostSchema>;

export type DiscussionReaction = typeof discussionReactions.$inferSelect;
export type InsertDiscussionReaction = z.infer<typeof insertDiscussionReactionSchema>;

export type DiscussionModerator = typeof discussionModerators.$inferSelect;
export type InsertDiscussionModerator = z.infer<typeof insertDiscussionModeratorSchema>;

export type DiscussionReport = typeof discussionReports.$inferSelect;
export type InsertDiscussionReport = z.infer<typeof insertDiscussionReportSchema>;