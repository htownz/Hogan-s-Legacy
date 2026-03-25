import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";
import { bills } from "./schema";

// Learning resources
export const learningResources = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  resourceType: text("resource_type").notNull(), // 'article', 'guide', 'explainer', 'glossary'
  readLevel: text("read_level").notNull().default("intermediate"), // 'beginner', 'intermediate', 'advanced'
  tags: text("tags").array().notNull().default([]),
  topics: text("topics").array().notNull().default([]),
  relatedBillIds: text("related_bill_ids").array().default([]),
  metadata: jsonb("metadata").default({}),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isPublished: boolean("is_published").notNull().default(false),
});

export const insertLearningResourceSchema = createInsertSchema(learningResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LearningResource = typeof learningResources.$inferSelect;
export type InsertLearningResource = z.infer<typeof insertLearningResourceSchema>;

// Learning modules
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  learningObjectives: text("learning_objectives").array().notNull().default([]),
  topics: text("topics").array().notNull().default([]),
  difficulty: text("difficulty").notNull().default("intermediate"), // 'beginner', 'intermediate', 'advanced'
  estimatedTimeMinutes: integer("estimated_time_minutes").notNull().default(15),
  coverImage: text("cover_image"),
  metadata: jsonb("metadata").default({}),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isPublished: boolean("is_published").notNull().default(false),
});

export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;

// Learning module sections
export const learningModuleSections = pgTable("learning_module_sections", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull(),
  resourceIds: integer("resource_ids").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLearningModuleSectionSchema = createInsertSchema(learningModuleSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LearningModuleSection = typeof learningModuleSections.$inferSelect;
export type InsertLearningModuleSection = z.infer<typeof insertLearningModuleSectionSchema>;

// User learning progress
export const userLearningProgress = pgTable("user_learning_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  completedSectionIds: integer("completed_section_ids").array().default([]),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").notNull().default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserLearningProgressSchema = createInsertSchema(userLearningProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserLearningProgress = typeof userLearningProgress.$inferSelect;
export type InsertUserLearningProgress = z.infer<typeof insertUserLearningProgressSchema>;

// Learning quizzes and assessments
export const learningQuizzes = pgTable("learning_quizzes", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => learningModules.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questions: jsonb("questions").notNull(), // Array of question objects with options and correct answers
  passingScore: integer("passing_score").notNull().default(70), // Percentage needed to pass
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLearningQuizSchema = createInsertSchema(learningQuizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LearningQuiz = typeof learningQuizzes.$inferSelect;
export type InsertLearningQuiz = z.infer<typeof insertLearningQuizSchema>;

// User quiz attempts
export const userQuizAttempts = pgTable("user_quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  quizId: integer("quiz_id").notNull().references(() => learningQuizzes.id),
  score: integer("score").notNull(), // Percentage score
  answers: jsonb("answers").notNull(), // User's answers for review
  passed: boolean("passed").notNull().default(false),
  completedAt: timestamp("completed_at").defaultNow(),
  feedbackGenerated: text("feedback_generated"), // AI-generated feedback on performance
});

export const insertUserQuizAttemptSchema = createInsertSchema(userQuizAttempts).omit({
  id: true,
  completedAt: true,
});

export type UserQuizAttempt = typeof userQuizAttempts.$inferSelect;
export type InsertUserQuizAttempt = z.infer<typeof insertUserQuizAttemptSchema>;

// AI-generated contextual learning content
export const contextualLearningContent = pgTable("contextual_learning_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").references(() => bills.id),
  query: text("query").notNull(), // User's original question or prompt
  content: text("content").notNull(), // AI-generated learning content
  topics: text("topics").array().default([]),
  relatedResourceIds: integer("related_resource_ids").array().default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  feedbackRating: integer("feedback_rating"), // User's rating of the content
  feedbackComment: text("feedback_comment"), // User's feedback comment
});

export const insertContextualLearningContentSchema = createInsertSchema(contextualLearningContent).omit({
  id: true,
  createdAt: true,
});

export type ContextualLearningContent = typeof contextualLearningContent.$inferSelect;
export type InsertContextualLearningContent = z.infer<typeof insertContextualLearningContentSchema>;

// Civic concept definitions
export const civicConcepts = pgTable("civic_concepts", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  definition: text("definition").notNull(),
  category: text("category").notNull(), // 'legislative', 'judicial', 'electoral', etc.
  complexityLevel: text("complexity_level").notNull().default("intermediate"), // 'beginner', 'intermediate', 'advanced'
  examples: text("examples").array().default([]),
  relatedTerms: text("related_terms").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCivicConceptSchema = createInsertSchema(civicConcepts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CivicConcept = typeof civicConcepts.$inferSelect;
export type InsertCivicConcept = z.infer<typeof insertCivicConceptSchema>;