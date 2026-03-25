// @ts-nocheck
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Documents that can be collaboratively annotated
export const legislativeDocuments = pgTable("legislative_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(), // e.g., "bill", "amendment", "testimony"
  externalId: varchar("external_id", { length: 100 }), // Optional external reference ID (e.g., bill number)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Annotations on documents
export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => legislativeDocuments.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull(), // references users table
  content: text("content").notNull(),
  startOffset: integer("start_offset").notNull(),
  endOffset: integer("end_offset").notNull(),
  selectionText: text("selection_text").notNull(),
  color: varchar("color", { length: 20 }).default("yellow").notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  isResolved: boolean("is_resolved").default(false).notNull(),
  parentId: integer("parent_id").references(() => annotations.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Define relations for annotations
export const annotationsRelations = relations(annotations, ({ one, many }) => ({
  document: one(legislativeDocuments, {
    fields: [annotations.documentId],
    references: [legislativeDocuments.id]
  }),
  parent: one(annotations, {
    fields: [annotations.parentId],
    references: [annotations.id]
  }),
  replies: many(annotations),
  reactions: many(annotationReactions)
}));

// Reactions to annotations (likes, agrees, disagrees, etc.)
export const annotationReactions = pgTable("annotation_reactions", {
  id: serial("id").primaryKey(),
  annotationId: integer("annotation_id").notNull().references(() => annotations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull(), // references users table
  reaction: varchar("reaction", { length: 20 }).notNull(), // e.g., "like", "agree", "disagree"
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations for annotation reactions
export const annotationReactionsRelations = relations(annotationReactions, ({ one }) => ({
  annotation: one(annotations, {
    fields: [annotationReactions.annotationId],
    references: [annotations.id]
  })
}));

// Document collaborators (users who can view/edit/comment on documents)
export const documentCollaborators = pgTable("document_collaborators", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => legislativeDocuments.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull(), // references users table
  role: varchar("role", { length: 20 }).default("viewer").notNull(), // "owner", "editor", "viewer"
  joinedAt: timestamp("joined_at").defaultNow().notNull()
});

// Relations for document collaborators
export const documentCollaboratorsRelations = relations(documentCollaborators, ({ one }) => ({
  document: one(legislativeDocuments, {
    fields: [documentCollaborators.documentId],
    references: [legislativeDocuments.id]
  })
}));

// Define relations for legislative documents
export const legislativeDocumentsRelations = relations(legislativeDocuments, ({ many }) => ({
  annotations: many(annotations),
  collaborators: many(documentCollaborators)
}));

// Zod schemas for validation
export const insertLegislativeDocumentSchema = createInsertSchema(legislativeDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnnotationSchema = createInsertSchema(annotations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnnotationReactionSchema = createInsertSchema(annotationReactions).omit({ id: true, createdAt: true });
export const insertDocumentCollaboratorSchema = createInsertSchema(documentCollaborators).omit({ id: true, joinedAt: true });

// Type definitions for easier usage
export type InsertLegislativeDocument = z.infer<typeof insertLegislativeDocumentSchema>;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export type InsertAnnotationReaction = z.infer<typeof insertAnnotationReactionSchema>;
export type InsertDocumentCollaborator = z.infer<typeof insertDocumentCollaboratorSchema>;

export type LegislativeDocument = typeof legislativeDocuments.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;
export type AnnotationReaction = typeof annotationReactions.$inferSelect;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;