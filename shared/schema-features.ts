import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users, bills } from "./schema";

// ---- POLICY ANNOTATIONS ----
export const policyAnnotations = pgTable("policy_annotations", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  userId: integer("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  sectionReference: text("section_reference"),
  pageNumber: integer("page_number"),
  visibility: text("visibility").notNull().default("public"), // 'private', 'circle', 'public'
  circleId: integer("circle_id"), // Optional circle ID if shared with specific circle
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertPolicyAnnotationSchema = createInsertSchema(policyAnnotations)
  .omit({ id: true, createdAt: true, updatedAt: true, upvotes: true, downvotes: true, isActive: true });

export const policyAnnotationsRelations = relations(policyAnnotations, ({ one, many }) => ({
  bill: one(bills, {
    fields: [policyAnnotations.billId],
    references: [bills.id],
  }),
  user: one(users, {
    fields: [policyAnnotations.userId],
    references: [users.id],
  }),
  replies: many(annotationReplies),
}));

// ---- ANNOTATION REPLIES ----
export const annotationReplies = pgTable("annotation_replies", {
  id: serial("id").primaryKey(),
  annotationId: integer("annotation_id").notNull().references(() => policyAnnotations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertAnnotationReplySchema = createInsertSchema(annotationReplies).pick({
  annotationId: true,
  userId: true,
  text: true,
});

export const annotationRepliesRelations = relations(annotationReplies, ({ one }) => ({
  annotation: one(policyAnnotations, {
    fields: [annotationReplies.annotationId],
    references: [policyAnnotations.id],
  }),
  user: one(users, {
    fields: [annotationReplies.userId],
    references: [users.id],
  }),
}));

// ---- CIVIC ACTIONS ----
export const civicActions = pgTable("civic_actions", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").references(() => bills.id), // Optional - can be related to a bill or not
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionType: text("action_type").notNull(), // 'contact_rep', 'attend_hearing', 'share_testimony', 'community_event', 'phone_bank', etc.
  actionUrl: text("action_url"), // URL for taking the action if applicable
  contactInfo: jsonb("contact_info").default({}), // JSON with contact information if applicable
  location: text("location"), // Optional location information
  startDate: timestamp("start_date"), // For scheduled events
  endDate: timestamp("end_date"), // For scheduled events
  effectivenessRating: integer("effectiveness_rating").notNull().default(5), // 1-10 scale
  difficultyLevel: integer("difficulty_level").notNull().default(3), // 1-5 scale
  isQuickAction: boolean("is_quick_action").notNull().default(false), // If this should appear in quick action shortcuts
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertCivicActionSchema = createInsertSchema(civicActions).pick({
  billId: true,
  title: true,
  description: true,
  actionType: true,
  actionUrl: true,
  contactInfo: true,
  location: true,
  startDate: true,
  endDate: true,
  effectivenessRating: true,
  difficultyLevel: true,
  isQuickAction: true,
  createdBy: true,
  isActive: true,
});

export const civicActionsRelations = relations(civicActions, ({ one, many }) => ({
  bill: one(bills, {
    fields: [civicActions.billId],
    references: [bills.id],
  }),
  creator: one(users, {
    fields: [civicActions.createdBy],
    references: [users.id],
  }),
  participants: many(userCivicActions),
}));

// ---- USER CIVIC ACTIONS ----
export const userCivicActions = pgTable("user_civic_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  actionId: integer("action_id").notNull().references(() => civicActions.id),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  impactRating: integer("impact_rating"), // User's rating of the action's impact (1-5)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserCivicActionSchema = createInsertSchema(userCivicActions).pick({
  userId: true,
  actionId: true,
  status: true,
  notes: true,
  impactRating: true,
});

export const userCivicActionsRelations = relations(userCivicActions, ({ one }) => ({
  user: one(users, {
    fields: [userCivicActions.userId],
    references: [users.id],
  }),
  action: one(civicActions, {
    fields: [userCivicActions.actionId],
    references: [civicActions.id],
  }),
}));

// Types based on schemas
export type PolicyAnnotation = typeof policyAnnotations.$inferSelect;
export type InsertPolicyAnnotation = z.infer<typeof insertPolicyAnnotationSchema>;

export type AnnotationReply = typeof annotationReplies.$inferSelect;
export type InsertAnnotationReply = z.infer<typeof insertAnnotationReplySchema>;

export type CivicAction = typeof civicActions.$inferSelect;
export type InsertCivicAction = z.infer<typeof insertCivicActionSchema>;

export type UserCivicAction = typeof userCivicActions.$inferSelect;
export type InsertUserCivicAction = z.infer<typeof insertUserCivicActionSchema>;