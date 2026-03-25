// @ts-nocheck
import { relations } from "drizzle-orm";
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Enum for post types
export const postTypeEnum = pgEnum('post_type', ['news', 'user_post', 'bill_update', 'action_alert', 'event']);

// Feed posts table
export const feedPosts = pgTable('feed_posts', {
  id: serial('id').primaryKey(),
  type: postTypeEnum('type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  externalUrl: text('external_url'),
  authorId: integer('author_id').references(() => users.id),
  tags: text('tags').array(),
  metadata: jsonb('metadata').$type<{
    billId?: string;
    eventDate?: Date;
    sourceName?: string;
    sourceUrl?: string;
    priority?: number;
    location?: string;
  }>(),
  isVerified: boolean('is_verified').default(false),
  isFeatured: boolean('is_featured').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User interests for personalized feed
export const userInterests = pgTable('user_interests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  topics: text('topics').array(),
  representatives: text('representatives').array(),
  locations: text('locations').array(),
  committees: text('committees').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User feed interactions for algorithm improvement
export const feedInteractions = pgTable('feed_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  postId: integer('post_id').notNull().references(() => feedPosts.id),
  interactionType: text('interaction_type').notNull(), // view, click, share, react, comment, hide
  interactionData: jsonb('interaction_data').$type<{
    timeSpent?: number; // in seconds
    reactionType?: string;
    commentId?: number;
    shareDestination?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Post comments
export const feedComments = pgTable('feed_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => feedPosts.id),
  userId: integer('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  parentId: integer('parent_id').references(() => feedComments.id),
  isHidden: boolean('is_hidden').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reactions (likes, etc.)
export const feedReactions = pgTable('feed_reactions', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => feedPosts.id),
  commentId: integer('comment_id').references(() => feedComments.id),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // like, love, support, insightful, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const feedPostsRelations = relations(feedPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [feedPosts.authorId],
    references: [users.id],
    relationName: 'post_author',
  }),
  comments: many(feedComments),
  reactions: many(feedReactions),
}));

export const feedCommentsRelations = relations(feedComments, ({ one, many }) => ({
  post: one(feedPosts, {
    fields: [feedComments.postId],
    references: [feedPosts.id],
  }),
  user: one(users, {
    fields: [feedComments.userId],
    references: [users.id],
  }),
  parent: one(feedComments, {
    fields: [feedComments.parentId],
    references: [feedComments.id],
    relationName: 'parent_comment',
  }),
  replies: many(feedComments, { relationName: 'parent_comment' }),
  reactions: many(feedReactions),
}));

// Insert schemas for inserting data
export const insertFeedPostSchema = createInsertSchema(feedPosts)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertUserInterestSchema = createInsertSchema(userInterests)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertFeedInteractionSchema = createInsertSchema(feedInteractions)
  .omit({ id: true, createdAt: true });

export const insertFeedCommentSchema = createInsertSchema(feedComments)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertFeedReactionSchema = createInsertSchema(feedReactions)
  .omit({ id: true, createdAt: true });

// Types
export type FeedPost = typeof feedPosts.$inferSelect;
export type InsertFeedPost = z.infer<typeof insertFeedPostSchema>;

export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;

export type FeedInteraction = typeof feedInteractions.$inferSelect;
export type InsertFeedInteraction = z.infer<typeof insertFeedInteractionSchema>;

export type FeedComment = typeof feedComments.$inferSelect;
export type InsertFeedComment = z.infer<typeof insertFeedCommentSchema>;

export type FeedReaction = typeof feedReactions.$inferSelect;
export type InsertFeedReaction = z.infer<typeof insertFeedReactionSchema>;