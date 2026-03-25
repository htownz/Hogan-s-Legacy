import { pgTable, text, timestamp, uuid, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, bills } from "./schema";

/**
 * User interests table - stores topics and policy areas that users are interested in
 */
export const userInterests = pgTable("user_interests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Array of topics/categories the user is interested in (e.g., "Education", "Healthcare", "Environment")
  topics: text("topics").array().notNull(),
  // User-defined keywords for more specific interests
  keywords: text("keywords").array().notNull(),
  // Preference strength for different policy areas (1-10)
  policyPreferences: jsonb("policy_preferences").notNull(),
  // Geographic focus (e.g., "local", "state", "federal")
  geographicFocus: text("geographic_focus").array().notNull(),
  // Boolean indicating if the user wants automatic recommendations
  enableRecommendations: boolean("enable_recommendations").default(true).notNull(),
});

/**
 * Bill recommendations table - stores AI-generated bill recommendations for users
 */
export const userBillRecommendations = pgTable("user_bill_recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  billId: uuid("bill_id").references(() => bills.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Relevance score (0-100) determined by the recommendation algorithm
  relevanceScore: integer("relevance_score").notNull(),
  // Reason for recommendation (AI-generated explanation)
  reasonForRecommendation: text("reason_for_recommendation").notNull(),
  // Impact assessment (AI-generated explanation of potential impact)
  impactAssessment: text("impact_assessment"),
  // Whether the user has viewed this recommendation
  viewed: boolean("viewed").default(false).notNull(),
  // Whether the user has saved this recommendation
  saved: boolean("saved").default(false).notNull(),
  // Whether the user has dismissed this recommendation
  dismissed: boolean("dismissed").default(false).notNull(),
});

/**
 * User interest history - tracks changes in user interests over time
 */
export const userInterestHistory = pgTable("user_interest_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Previous interests
  previousTopics: text("previous_topics").array(),
  // New interests
  newTopics: text("new_topics").array(),
  // Source of the change (e.g., "explicit", "inferred", "behavior")
  changeSource: text("change_source").notNull(),
});

/**
 * Bill interaction feedback - tracks user feedback on recommended bills
 */
export const billInteractionFeedback = pgTable("bill_interaction_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  billId: uuid("bill_id").references(() => bills.id).notNull(),
  recommendationId: uuid("recommendation_id").references(() => userBillRecommendations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Feedback type (e.g., "relevant", "not_relevant", "too_specific", "too_general")
  feedbackType: text("feedback_type").notNull(),
  // Optional user comment
  comment: text("comment"),
});

// Insert schemas
export const insertUserInterestSchema = createInsertSchema(userInterests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBillRecommendationSchema = createInsertSchema(userBillRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertUserInterestHistorySchema = createInsertSchema(userInterestHistory).omit({
  id: true,
  createdAt: true,
});

export const insertBillInteractionFeedbackSchema = createInsertSchema(billInteractionFeedback).omit({
  id: true,
  createdAt: true,
});

// Types
export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;

export type UserBillRecommendation = typeof userBillRecommendations.$inferSelect;
export type InsertUserBillRecommendation = z.infer<typeof insertUserBillRecommendationSchema>;

export type UserInterestHistory = typeof userInterestHistory.$inferSelect;
export type InsertUserInterestHistory = z.infer<typeof insertUserInterestHistorySchema>;

export type BillInteractionFeedback = typeof billInteractionFeedback.$inferSelect;
export type InsertBillInteractionFeedback = z.infer<typeof insertBillInteractionFeedbackSchema>;