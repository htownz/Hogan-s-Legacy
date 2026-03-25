import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Interests Table
export const userInterests = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topics: text("topics").array(),
  causes: text("causes").array(),
  keywords: text("keywords").array(),
  settings: text("settings").notNull().default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Bill Recommendations Table
export const billRecommendations = pgTable("bill_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  billId: text("bill_id").notNull(),
  score: integer("score").notNull().default(0),
  reason: text("reason").notNull(),
  matchedInterests: text("matched_interests").array(),
  personalImpact: text("personal_impact").notNull(),
  impactAreas: text("impact_areas").array(),
  familyImpact: text("family_impact"),
  communityImpact: text("community_impact"),
  viewed: boolean("viewed").notNull().default(false),
  saved: boolean("saved").notNull().default(false),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Interest Inference Sources Table
export const interestInferences = pgTable("interest_inferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  source: text("source").notNull(),
  billId: text("bill_id"),
  action: text("action"),
  topics: text("topics").array(),
  confidence: integer("confidence").notNull().default(50),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// User Interests Schema
export const insertUserInterestSchema = createInsertSchema(userInterests).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;
export type UserInterest = typeof userInterests.$inferSelect;

// Bill Recommendations Schema
export const insertBillRecommendationSchema = createInsertSchema(billRecommendations).omit({
  id: true,
  createdAt: true
});
export type InsertBillRecommendation = z.infer<typeof insertBillRecommendationSchema>;
export type BillRecommendation = typeof billRecommendations.$inferSelect;

// Interest Inferences Schema
export const insertInterestInferenceSchema = createInsertSchema(interestInferences).omit({
  id: true,
  createdAt: true
});
export type InsertInterestInference = z.infer<typeof insertInterestInferenceSchema>;
export type InterestInference = typeof interestInferences.$inferSelect;