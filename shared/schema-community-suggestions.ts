import { relations, sql } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Schema for community bill suggestions
export const billSuggestions = pgTable("bill_suggestions", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  rationale: text("rationale"),
  actionItems: text("action_items"),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  priority: text("priority"),
  impact: text("impact"),
  featured: boolean("featured"),
  upvoteCount: integer("upvote_count").default(0),
  commentCount: integer("comment_count").default(0),
});

// Schema for bill suggestion upvotes
export const billSuggestionUpvotes = pgTable("bill_suggestion_upvotes", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").references(() => billSuggestions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Schema for bill suggestion comments
export const billSuggestionComments = pgTable("bill_suggestion_comments", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").references(() => billSuggestions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Relations
export const billSuggestionsRelations = relations(billSuggestions, ({ one, many }) => ({
  user: one(users, {
    fields: [billSuggestions.userId],
    references: [users.id],
  }),
  upvotes: many(billSuggestionUpvotes),
  comments: many(billSuggestionComments),
}));

export const billSuggestionUpvotesRelations = relations(billSuggestionUpvotes, ({ one }) => ({
  suggestion: one(billSuggestions, {
    fields: [billSuggestionUpvotes.suggestionId],
    references: [billSuggestions.id],
  }),
  user: one(users, {
    fields: [billSuggestionUpvotes.userId],
    references: [users.id],
  }),
}));

export const billSuggestionCommentsRelations = relations(billSuggestionComments, ({ one }) => ({
  suggestion: one(billSuggestions, {
    fields: [billSuggestionComments.suggestionId],
    references: [billSuggestions.id],
  }),
  user: one(users, {
    fields: [billSuggestionComments.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertBillSuggestionSchema = createInsertSchema(billSuggestions)
  .omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true, 
    upvoteCount: true,
    commentCount: true
  });

export const insertBillSuggestionUpvoteSchema = createInsertSchema(billSuggestionUpvotes)
  .omit({ id: true, createdAt: true });

export const insertBillSuggestionCommentSchema = createInsertSchema(billSuggestionComments)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type BillSuggestion = typeof billSuggestions.$inferSelect;
export type InsertBillSuggestion = z.infer<typeof insertBillSuggestionSchema>;

export type BillSuggestionUpvote = typeof billSuggestionUpvotes.$inferSelect;
export type InsertBillSuggestionUpvote = z.infer<typeof insertBillSuggestionUpvoteSchema>;

export type BillSuggestionComment = typeof billSuggestionComments.$inferSelect;
export type InsertBillSuggestionComment = z.infer<typeof insertBillSuggestionCommentSchema>;