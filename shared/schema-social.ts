import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./schema";
import { z } from "zod";
import { type InferSelectModel } from "drizzle-orm";

/**
 * Social shares table to track all social media sharing activities
 */
export const social_shares = pgTable('social_shares', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  platform: text('platform').notNull(), // e.g., 'twitter', 'facebook', 'linkedin', 'email'
  url: text('url').notNull(),
  objectType: text('object_type'), // e.g., 'bill', 'action', 'challenge', etc.
  objectId: text('object_id'),    // ID of the object being shared
  metadata: text('metadata'), // JSON string containing additional data (title, desc, etc)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  referrer: text('referrer'), // Where the share originated from
});

export const social_shares_relations = relations(social_shares, ({ one }) => ({
  user: one(users, {
    fields: [social_shares.userId],
    references: [users.id],
  }),
}));

export const insertSocialShareSchema = createInsertSchema(social_shares, {
  metadata: z.string().transform(str => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return {};
    }
  }).optional(),
}).omit({ id: true, createdAt: true });

export const selectSocialShareSchema = createSelectSchema(social_shares, {
  metadata: z.string().transform(str => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return {};
    }
  }).optional(),
});

export type SocialShare = InferSelectModel<typeof social_shares>;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;

/**
 * Interface for tracking sharing events
 */
export interface SocialShareEvent {
  platform: string;
  url: string;
  objectType?: string;
  objectId?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for statistics of shares
 */
export interface SocialShareStats {
  total: number;
  platforms: Record<string, number>; // platform -> count
}

/**
 * Interface for trending shared items
 */
export interface TrendingShareItem {
  count: number;
  objectType?: string;
  objectId?: string;
  url?: string;
  title?: string;
  description?: string;
}