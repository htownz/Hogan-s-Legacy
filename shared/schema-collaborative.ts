import { relations, sql } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Schema for collaborative bill editing sessions
export const collaborativeEditSessions = pgTable("collaborative_edit_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  billId: text("bill_id"),
  documentContent: text("document_content").notNull(),
  status: text("status").notNull().default("active"), // active, archived, published
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  createdById: integer("created_by_id").references(() => users.id),
});

// Schema to track user presence in editing sessions
export const sessionParticipants = pgTable("session_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => collaborativeEditSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").default(sql`now()`),
  leftAt: timestamp("left_at"),
  currentCursorPosition: integer("current_cursor_position"),
  lastActiveAt: timestamp("last_active_at").default(sql`now()`),
});

// Schema to track changes made in collaborative sessions
export const collaborativeChanges = pgTable("collaborative_changes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => collaborativeEditSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  changeType: text("change_type").notNull(), // insert, delete, replace
  startPosition: integer("start_position").notNull(),
  endPosition: integer("end_position"),
  content: text("content"),
  timestamp: timestamp("timestamp").default(sql`now()`),
  metadata: jsonb("metadata"), // optional metadata about the change
});

// Schema to track document versions
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => collaborativeEditSessions.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
  createdById: integer("created_by_id").references(() => users.id),
  changeDescription: text("change_description"),
});

// Schema to track document comments
export const documentComments = pgTable("document_comments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => collaborativeEditSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  startPosition: integer("start_position"),
  endPosition: integer("end_position"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  resolved: integer("resolved").default(0),
  resolvedById: integer("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
});

// Relations
export const collaborativeEditSessionsRelations = relations(collaborativeEditSessions, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [collaborativeEditSessions.createdById],
    references: [users.id],
  }),
  participants: many(sessionParticipants),
  changes: many(collaborativeChanges),
  versions: many(documentVersions),
  comments: many(documentComments),
}));

export const sessionParticipantsRelations = relations(sessionParticipants, ({ one }) => ({
  session: one(collaborativeEditSessions, {
    fields: [sessionParticipants.sessionId],
    references: [collaborativeEditSessions.id],
  }),
  user: one(users, {
    fields: [sessionParticipants.userId],
    references: [users.id],
  }),
}));

export const collaborativeChangesRelations = relations(collaborativeChanges, ({ one }) => ({
  session: one(collaborativeEditSessions, {
    fields: [collaborativeChanges.sessionId],
    references: [collaborativeEditSessions.id],
  }),
  user: one(users, {
    fields: [collaborativeChanges.userId],
    references: [users.id],
  }),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  session: one(collaborativeEditSessions, {
    fields: [documentVersions.sessionId],
    references: [collaborativeEditSessions.id],
  }),
  createdBy: one(users, {
    fields: [documentVersions.createdById],
    references: [users.id],
  }),
}));

export const documentCommentsRelations = relations(documentComments, ({ one }) => ({
  session: one(collaborativeEditSessions, {
    fields: [documentComments.sessionId],
    references: [collaborativeEditSessions.id],
  }),
  user: one(users, {
    fields: [documentComments.userId],
    references: [users.id],
  }),
  resolvedBy: one(users, {
    fields: [documentComments.resolvedById],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertCollaborativeEditSessionSchema = createInsertSchema(collaborativeEditSessions)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertSessionParticipantSchema = createInsertSchema(sessionParticipants)
  .omit({ id: true, joinedAt: true, lastActiveAt: true });

export const insertCollaborativeChangeSchema = createInsertSchema(collaborativeChanges)
  .omit({ id: true, timestamp: true });

export const insertDocumentVersionSchema = createInsertSchema(documentVersions)
  .omit({ id: true, createdAt: true });

export const insertDocumentCommentSchema = createInsertSchema(documentComments)
  .omit({ id: true, createdAt: true, updatedAt: true, resolved: true, resolvedById: true, resolvedAt: true });

// Types
export type CollaborativeEditSession = typeof collaborativeEditSessions.$inferSelect;
export type InsertCollaborativeEditSession = z.infer<typeof insertCollaborativeEditSessionSchema>;

export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type InsertSessionParticipant = z.infer<typeof insertSessionParticipantSchema>;

export type CollaborativeChange = typeof collaborativeChanges.$inferSelect;
export type InsertCollaborativeChange = z.infer<typeof insertCollaborativeChangeSchema>;

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type DocumentComment = typeof documentComments.$inferSelect;
export type InsertDocumentComment = z.infer<typeof insertDocumentCommentSchema>;