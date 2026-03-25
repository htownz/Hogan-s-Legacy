import { pgTable, serial, text, timestamp, integer, boolean, index, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { bills, users, superUserRoles } from './schema';

/**
 * User activities across the platform
 * Tracks all user interactions for analytics and super user role progress
 */
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // 'view_bill', 'comment', 'share', 'follow', 'contact_rep', etc.
  activityCategory: text("activity_category").notNull(), // 'engagement', 'advocacy', 'education', 'community', etc.
  relatedRole: text("related_role"), // 'catalyst', 'amplifier', 'convincer' or null if not role-specific
  objectType: text("object_type"), // 'bill', 'comment', 'rep', 'article', etc.
  objectId: text("object_id"), // ID of the related object (if applicable)
  points: integer("points").notNull().default(1), // Points earned for this activity
  metadata: jsonb("metadata").default({}), // Additional context data about the activity
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sessionId: text("session_id"), // For tracking activities in the same session
  platform: text("platform"), // 'web', 'mobile', 'email', etc.
  deviceInfo: text("device_info"), // Basic device information
}, (table) => {
  return {
    userActivityTypeIdx: index("user_activity_type_idx").on(
      table.userId, 
      table.activityType
    ),
    userActivityTimeIdx: index("user_activity_time_idx").on(
      table.userId, 
      table.createdAt
    ),
    roleActivityIdx: index("role_activity_idx").on(
      table.relatedRole,
      table.activityType
    ),
  };
});

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
}));

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  createdAt: true,
});

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

/**
 * User action tracking specific to civic advocacy
 * Tracks completed civic actions that have direct impact
 */
export const userActionTracking = pgTable("user_action_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(), // 'contact_rep', 'testify', 'petition', 'protest', etc.
  status: text("status").notNull().default('completed'), // 'planned', 'in_progress', 'completed', 'verified'
  billId: text("bill_id").references(() => bills.id),
  repId: integer("rep_id"), // Optional reference to representative
  impact: text("impact").notNull().default('individual'), // 'individual', 'community', 'legislation', 'movement'
  impactScore: integer("impact_score").notNull().default(1), // Numeric representation of impact (1-100)
  details: text("details"), // Additional details about the action
  verifiedBy: integer("verified_by"), // User ID who verified this action (if applicable)
  metadata: jsonb("metadata").default({}), // Additional structured data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => {
  return {
    userActionTypeIdx: index("user_action_type_idx").on(
      table.userId, 
      table.actionType
    ),
    actionBillIdx: index("action_bill_idx").on(
      table.billId
    ),
    actionImpactIdx: index("action_impact_idx").on(
      table.impact,
      table.impactScore
    ),
  };
});

export const userActionTrackingRelations = relations(userActionTracking, ({ one }) => ({
  user: one(users, {
    fields: [userActionTracking.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [userActionTracking.billId],
    references: [bills.id],
  }),
}));

export const insertUserActionTrackingSchema = createInsertSchema(userActionTracking).omit({
  id: true,
  createdAt: true,
});

export type UserActionTracking = typeof userActionTracking.$inferSelect;
export type InsertUserActionTracking = z.infer<typeof insertUserActionTrackingSchema>;

/**
 * Achievements earned by users through platform activity
 */
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementType: text("achievement_type").notNull(), // 'first_action', 'community_builder', 'super_spreader', etc.
  title: text("title").notNull(), // Display name of the achievement
  description: text("description").notNull(), // Description of how it was earned
  badgeUrl: text("badge_url"), // URL to the badge image
  relatedRole: text("related_role"), // If this achievement is related to a specific role
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  level: integer("level").notNull().default(1), // For tiered achievements (bronze, silver, gold, etc.)
  points: integer("points").notNull().default(10), // Points earned for this achievement
  visible: boolean("visible").notNull().default(true), // Whether to show publicly on profile
  metadata: jsonb("metadata").default({}), // Additional achievement data
}, (table) => {
  return {
    userAchievementTypeIdx: index("user_achievement_type_idx").on(
      table.userId, 
      table.achievementType
    ),
    roleAchievementIdx: index("role_achievement_idx").on(
      table.relatedRole,
      table.achievementType
    ),
  };
});

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

/**
 * Activity streaks to encourage consistent engagement
 */
export const userActivityStreaks = pgTable("user_activity_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  streakType: text("streak_type").notNull().default('daily'), // 'daily', 'weekly', 'action', etc.
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date").defaultNow().notNull(),
  nextRequiredActivityDate: timestamp("next_required_activity_date"),
  streakBrokenCount: integer("streak_broken_count").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userStreakTypeIdx: index("user_streak_type_idx").on(
      table.userId, 
      table.streakType
    ),
  };
});

export const userActivityStreaksRelations = relations(userActivityStreaks, ({ one }) => ({
  user: one(users, {
    fields: [userActivityStreaks.userId],
    references: [users.id],
  }),
}));

export const insertUserActivityStreakSchema = createInsertSchema(userActivityStreaks).omit({
  id: true,
  updatedAt: true,
});

export type UserActivityStreak = typeof userActivityStreaks.$inferSelect;
export type InsertUserActivityStreak = z.infer<typeof insertUserActivityStreakSchema>;

/**
 * Role progress boosts from completing specific activities
 */
export const userRoleBoosts = pgTable("user_role_boosts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => superUserRoles.id),
  boostSource: text("boost_source").notNull(), // 'achievement', 'activity', 'challenge', 'admin'
  boostAmount: integer("boost_amount").notNull(), // Points added to progress
  boostReason: text("boost_reason").notNull(), // Explanation for the boost
  activityId: integer("activity_id"), // Related activity if applicable
  expiresAt: timestamp("expires_at"), // Boost might be temporary
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by"), // Admin or system ID if applicable
  metadata: jsonb("metadata").default({}),
}, (table) => {
  return {
    userRoleBoostIdx: index("user_role_boost_idx").on(
      table.userId, 
      table.roleId
    ),
  };
});

export const userRoleBoostsRelations = relations(userRoleBoosts, ({ one }) => ({
  user: one(users, {
    fields: [userRoleBoosts.userId],
    references: [users.id],
  }),
  role: one(superUserRoles, {
    fields: [userRoleBoosts.roleId],
    references: [superUserRoles.id],
  }),
}));

export const insertUserRoleBoostSchema = createInsertSchema(userRoleBoosts).omit({
  id: true,
  createdAt: true,
});

export type UserRoleBoost = typeof userRoleBoosts.$inferSelect;
export type InsertUserRoleBoost = z.infer<typeof insertUserRoleBoostSchema>;