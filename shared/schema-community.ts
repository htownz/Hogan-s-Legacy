import { pgTable, serial, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./schema";

/**
 * Bill Suggestions Table
 * Allows users to suggest bills for community focus
 */
export const billSuggestions = pgTable("bill_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  billId: text("bill_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rationale: text("rationale").notNull(),
  actionItems: text("action_items"),
  priority: text("priority"),
  impact: text("impact"),
  category: text("category").default("general"),
  submittedBy: text("submitted_by"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  status: text("status").default("pending"),
  tags: text("tags").array(),
  views: integer("views").default(0),
  upvoteCount: integer("upvote_count").default(0),
  commentCount: integer("comment_count").default(0),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

/**
 * Bill Suggestion Categories Table
 * Allow categorization of bill suggestions for better filtering and organization
 */
export const billSuggestionCategories = pgTable("bill_suggestion_categories", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

/**
 * Bill Suggestion Upvotes Table
 * Track upvotes on bill suggestions
 */
export const billSuggestionUpvotes = pgTable("bill_suggestion_upvotes", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

/**
 * Bill Suggestion Comments Table
 * Allow users to comment on bill suggestions
 */
export const billSuggestionComments = pgTable("bill_suggestion_comments", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Define relations between tables
export const billSuggestionsRelations = relations(billSuggestions, ({ many, one }) => ({
  categories: many(billSuggestionCategories),
  upvotes: many(billSuggestionUpvotes),
  comments: many(billSuggestionComments),
  user: one(users, {
    fields: [billSuggestions.userId],
    references: [users.id]
  })
}));

export const billSuggestionCategoriesRelations = relations(billSuggestionCategories, ({ one }) => ({
  suggestion: one(billSuggestions, {
    fields: [billSuggestionCategories.suggestionId],
    references: [billSuggestions.id]
  })
}));

export const billSuggestionUpvotesRelations = relations(billSuggestionUpvotes, ({ one }) => ({
  suggestion: one(billSuggestions, {
    fields: [billSuggestionUpvotes.suggestionId],
    references: [billSuggestions.id]
  }),
  user: one(users, {
    fields: [billSuggestionUpvotes.userId],
    references: [users.id]
  })
}));

export const billSuggestionCommentsRelations = relations(billSuggestionComments, ({ one }) => ({
  suggestion: one(billSuggestions, {
    fields: [billSuggestionComments.suggestionId],
    references: [billSuggestions.id]
  }),
  user: one(users, {
    fields: [billSuggestionComments.userId],
    references: [users.id]
  })
}));

// Define Zod schemas for data validation
export const insertBillSuggestionSchema = createInsertSchema(billSuggestions);
export const insertBillSuggestionCategorySchema = createInsertSchema(billSuggestionCategories);
export const insertBillSuggestionUpvoteSchema = createInsertSchema(billSuggestionUpvotes);
export const insertBillSuggestionCommentSchema = createInsertSchema(billSuggestionComments);

// Define TypeScript types for use throughout the application
export type BillSuggestion = typeof billSuggestions.$inferSelect;
export type InsertBillSuggestion = z.infer<typeof insertBillSuggestionSchema>;

export type BillSuggestionCategory = typeof billSuggestionCategories.$inferSelect;
export type InsertBillSuggestionCategory = z.infer<typeof insertBillSuggestionCategorySchema>;

export type BillSuggestionUpvote = typeof billSuggestionUpvotes.$inferSelect;
export type InsertBillSuggestionUpvote = z.infer<typeof insertBillSuggestionUpvoteSchema>;

export type BillSuggestionComment = typeof billSuggestionComments.$inferSelect;
export type InsertBillSuggestionComment = z.infer<typeof insertBillSuggestionCommentSchema>;