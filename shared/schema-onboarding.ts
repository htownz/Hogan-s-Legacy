import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Onboarding progress for users
export const onboardingProgress = pgTable("onboarding_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  step: varchar("step", { length: 50 }).notNull(), // current onboarding step
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User's civic interests tracked during onboarding
export const civicInterests = pgTable("civic_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  interestCategory: varchar("interest_category", { length: 100 }).notNull(),
  interestValue: varchar("interest_value", { length: 100 }).notNull(),
  priorityLevel: integer("priority_level").default(1), // 1-5 scale
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User engagement preferences
export const engagementPreferences = pgTable("engagement_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  emailFrequency: varchar("email_frequency", { length: 20 }).default("weekly"),
  pushNotificationsEnabled: boolean("push_notifications_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  locationSharingEnabled: boolean("location_sharing_enabled").default(false), 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tutorial completion tracking
export const tutorialProgress = pgTable("tutorial_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tutorialId: varchar("tutorial_id", { length: 50 }).notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relationships
export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  user: one(users, {
    fields: [onboardingProgress.userId],
    references: [users.id],
  }),
}));

export const civicInterestsRelations = relations(civicInterests, ({ one }) => ({
  user: one(users, {
    fields: [civicInterests.userId],
    references: [users.id],
  }),
}));

export const engagementPreferencesRelations = relations(engagementPreferences, ({ one }) => ({
  user: one(users, {
    fields: [engagementPreferences.userId],
    references: [users.id],
  }),
}));

export const tutorialProgressRelations = relations(tutorialProgress, ({ one }) => ({
  user: one(users, {
    fields: [tutorialProgress.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCivicInterestsSchema = createInsertSchema(civicInterests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEngagementPreferencesSchema = createInsertSchema(engagementPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTutorialProgressSchema = createInsertSchema(tutorialProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;

export type CivicInterest = typeof civicInterests.$inferSelect;
export type InsertCivicInterest = z.infer<typeof insertCivicInterestsSchema>;

export type EngagementPreference = typeof engagementPreferences.$inferSelect;
export type InsertEngagementPreference = z.infer<typeof insertEngagementPreferencesSchema>;

export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type InsertTutorialProgress = z.infer<typeof insertTutorialProgressSchema>;