import { pgTable, serial, integer, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Multimodal AI Assistant Sessions
export const multimodalSessions = pgTable("multimodal_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  context: jsonb("context").default({})
});

export const insertMultimodalSessionSchema = createInsertSchema(multimodalSessions).pick({
  userId: true,
  title: true,
  isActive: true,
  context: true
});

// Multimodal AI Assistant Messages
export const multimodalMessages = pgTable("multimodal_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => multimodalSessions.id),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
  hasAttachment: boolean("has_attachment").default(false),
  attachmentType: text("attachment_type"), // 'image', 'document', 'infographic'
  attachmentUrl: text("attachment_url")
});

export const insertMultimodalMessageSchema = createInsertSchema(multimodalMessages).pick({
  sessionId: true,
  content: true,
  role: true,
  metadata: true,
  hasAttachment: true,
  attachmentType: true,
  attachmentUrl: true
});

// Multimodal AI Assistant Attachments
export const multimodalAttachments = pgTable("multimodal_attachments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => multimodalMessages.id),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(), // MIME type
  fileSize: integer("file_size").notNull(),
  storageLocation: text("storage_location").notNull(), // S3 key or local path
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  analysisStatus: text("analysis_status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  analysisResult: jsonb("analysis_result").default({})
});

export const insertMultimodalAttachmentSchema = createInsertSchema(multimodalAttachments).pick({
  messageId: true,
  filename: true,
  fileType: true,
  fileSize: true,
  storageLocation: true,
  analysisStatus: true,
  analysisResult: true
});

// Multimodal AI Assistant Saved Queries
export const multimodalSavedQueries = pgTable("multimodal_saved_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  queryText: text("query_text").notNull(),
  parameters: jsonb("parameters").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  useCount: integer("use_count").default(0)
});

export const insertMultimodalSavedQuerySchema = createInsertSchema(multimodalSavedQueries).pick({
  userId: true,
  name: true,
  queryText: true,
  parameters: true
});

// Export types
export type MultimodalSession = typeof multimodalSessions.$inferSelect;
export type InsertMultimodalSession = z.infer<typeof insertMultimodalSessionSchema>;

export type MultimodalMessage = typeof multimodalMessages.$inferSelect;
export type InsertMultimodalMessage = z.infer<typeof insertMultimodalMessageSchema>;

export type MultimodalAttachment = typeof multimodalAttachments.$inferSelect;
export type InsertMultimodalAttachment = z.infer<typeof insertMultimodalAttachmentSchema>;

export type MultimodalSavedQuery = typeof multimodalSavedQueries.$inferSelect;
export type InsertMultimodalSavedQuery = z.infer<typeof insertMultimodalSavedQuerySchema>;