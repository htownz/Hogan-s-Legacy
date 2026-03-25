import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const insiderUpdateTypeEnum = pgEnum('insider_update_type', [
  'legislation_update', 
  'committee_insider', 
  'political_dynamic', 
  'voting_prediction', 
  'floor_action',
  'behind_scenes',
  'policy_analysis'
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'pending', 
  'verified', 
  'disputed',
  'unverified',
  'confirmed_by_multiple'
]);

// Tables
export const insiderUpdates = pgTable('insider_updates', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  updateType: insiderUpdateTypeEnum('update_type').notNull(),
  userId: integer('user_id').notNull(),
  billId: text('bill_id'),
  committeeId: integer('committee_id'),
  verificationStatus: verificationStatusEnum('verification_status').default('pending').notNull(),
  verifiedBy: integer('verified_by'),
  verificationNotes: text('verification_notes'),
  visibility: text('visibility').default('public').notNull(), // 'public', 'subscribers_only'
  source: text('source'),
  sourceUrl: text('source_url'),
  importance: integer('importance').default(3).notNull(), // 1-5 scale
  expiryDate: timestamp('expiry_date'), // When this update becomes outdated
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const insiderVerifications = pgTable('insider_verifications', {
  id: serial('id').primaryKey(),
  updateId: integer('update_id').notNull(),
  userId: integer('user_id').notNull(),
  isVerified: boolean('is_verified').notNull(), // true = verified, false = disputed
  verificationNotes: text('verification_notes'),
  credentials: text('credentials'), // User's basis for verification
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insiderReactions = pgTable('insider_reactions', {
  id: serial('id').primaryKey(),
  updateId: integer('update_id').notNull(),
  userId: integer('user_id').notNull(),
  reaction: text('reaction').notNull(), // 'helpful', 'insightful', 'thanks', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insiderSources = pgTable('insider_sources', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  sourceType: text('source_type').notNull(), // 'government', 'staff', 'committee', 'press', 'lobbyist', etc.
  organization: text('organization'),
  position: text('position'),
  relationshipType: text('relationship_type'), // 'direct', 'indirect', 'public'
  verificationStatus: verificationStatusEnum('verification_status').default('pending').notNull(),
  verifiedBy: integer('verified_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const insiderTags = pgTable('insider_tags', {
  id: serial('id').primaryKey(),
  updateId: integer('update_id').notNull(),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insiderVerifiers = pgTable('insider_verifiers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  expertise: text('expertise').array(),
  credentials: text('credentials'), // Professional background
  verifierLevel: integer('verifier_level').default(1).notNull(), // 1 = basic, 2 = trusted, 3 = expert, 4 = official
  totalVerifications: integer('total_verifications').default(0).notNull(),
  approvedBy: integer('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// Insert schemas (for validation)
export const insertInsiderUpdateSchema = createInsertSchema(insiderUpdates)
  .omit({ id: true, createdAt: true, updatedAt: true, verifiedBy: true });

export const insertInsiderVerificationSchema = createInsertSchema(insiderVerifications)
  .omit({ id: true, createdAt: true });

export const insertInsiderReactionSchema = createInsertSchema(insiderReactions)
  .omit({ id: true, createdAt: true });
  
export const insertInsiderSourceSchema = createInsertSchema(insiderSources)
  .omit({ id: true, createdAt: true, updatedAt: true, verifiedBy: true });
  
export const insertInsiderTagSchema = createInsertSchema(insiderTags)
  .omit({ id: true, createdAt: true });
  
export const insertInsiderVerifierSchema = createInsertSchema(insiderVerifiers)
  .omit({ id: true, createdAt: true, updatedAt: true, approvedBy: true, totalVerifications: true });

// Types
export type InsiderUpdate = typeof insiderUpdates.$inferSelect;
export type InsertInsiderUpdate = z.infer<typeof insertInsiderUpdateSchema>;

export type InsiderVerification = typeof insiderVerifications.$inferSelect;
export type InsertInsiderVerification = z.infer<typeof insertInsiderVerificationSchema>;

export type InsiderReaction = typeof insiderReactions.$inferSelect;
export type InsertInsiderReaction = z.infer<typeof insertInsiderReactionSchema>;

export type InsiderSource = typeof insiderSources.$inferSelect;
export type InsertInsiderSource = z.infer<typeof insertInsiderSourceSchema>;

export type InsiderTag = typeof insiderTags.$inferSelect;
export type InsertInsiderTag = z.infer<typeof insertInsiderTagSchema>;

export type InsiderVerifier = typeof insiderVerifiers.$inferSelect;
export type InsertInsiderVerifier = z.infer<typeof insertInsiderVerifierSchema>;