import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./schema";

/**
 * Table for storing user feedback
 */
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "suggestion", "issue", "praise", "other"
  message: text("message").notNull(),
  url: text("url").notNull(), // The URL where the feedback was submitted
  userId: integer("user_id"), // Optional, only if user is logged in
  isAnonymous: boolean("is_anonymous").default(true),
  sentiment: text("sentiment").default("neutral"), // "positive", "negative", "neutral"
  browser: text("browser"),
  operatingSystem: text("operating_system"),
  status: text("status").notNull().default("new"), // "new", "reviewed", "addressed", "closed"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "critical"
  assignedTo: integer("assigned_to"), // Optional, staff member assigned to address the feedback
  resolution: text("resolution"), // Optional, how the feedback was addressed
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userFeedbackRelations = relations(userFeedback, ({ one }) => ({
  user: one(users, {
    fields: [userFeedback.userId],
    references: [users.id],
    relationName: "user_feedback_relation"
  }),
  assignee: one(users, {
    fields: [userFeedback.assignedTo],
    references: [users.id],
    relationName: "feedback_assignee_relation"
  }),
}));

export const insertUserFeedbackSchema = createInsertSchema(userFeedback)
  .omit({ 
    id: true, 
    status: true, 
    priority: true, 
    assignedTo: true, 
    resolution: true,
    createdAt: true, 
    updatedAt: true 
  });

export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;