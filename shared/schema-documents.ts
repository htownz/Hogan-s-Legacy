import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, type InferSelectModel } from "drizzle-orm";
import { users } from "./schema";

// ---- USER DOCUMENTS ----
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  fileKey: text("file_key").notNull().unique(), // S3 file key (path)
  fileUrl: text("file_url"), // Optional cached URL
  fileType: text("file_type").notNull(), // MIME type
  fileName: text("file_name").notNull(), // Original file name
  fileSize: integer("file_size").notNull(), // Size in bytes
  isPublic: boolean("is_public").notNull().default(false),
  allowComments: boolean("allow_comments").notNull().default(true),
  tags: text("tags").array(),
  category: text("category"), // Optional category for organizing documents
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  shares: many(documentShares),
  comments: many(documentComments),
}));

export const insertDocumentSchema = createInsertSchema(documents).pick({
  ownerId: true,
  title: true,
  description: true,
  fileKey: true,
  fileUrl: true,
  fileType: true,
  fileName: true,
  fileSize: true,
  isPublic: true,
  allowComments: true,
  tags: true,
  category: true,
});

// ---- DOCUMENT SHARES ----
export const documentShares = pgTable("document_shares", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  sharedById: integer("shared_by_id").notNull().references(() => users.id),
  sharedWithId: integer("shared_with_id").references(() => users.id), // Null for link-based shares
  accessLink: text("access_link"), // UUID for public link shares
  accessPermission: text("access_permission").notNull().default("view"), // "view", "comment", "edit"
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  isActive: boolean("is_active").notNull().default(true),
});

export const documentSharesRelations = relations(documentShares, ({ one }) => ({
  document: one(documents, {
    fields: [documentShares.documentId],
    references: [documents.id],
  }),
  sharedBy: one(users, {
    fields: [documentShares.sharedById],
    references: [users.id],
  }),
  sharedWith: one(users, {
    fields: [documentShares.sharedWithId],
    references: [users.id],
  }),
}));

export const insertDocumentShareSchema = createInsertSchema(documentShares).pick({
  documentId: true,
  sharedById: true,
  sharedWithId: true,
  accessLink: true,
  accessPermission: true,
  expiresAt: true,
  isActive: true,
});

// ---- DOCUMENT COMMENTS ----
export const documentComments = pgTable("document_comments", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  parentId: integer("parent_id"), // Will be added as a reference after table is created
});

export const documentCommentsRelations = relations(documentComments, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentComments.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentComments.userId],
    references: [users.id],
  }),
  parent: one(documentComments, {
    fields: [documentComments.parentId],
    references: [documentComments.id],
  }),
  replies: many(documentComments, { relationName: "replies" }),
}));

export const insertDocumentCommentSchema = createInsertSchema(documentComments).pick({
  documentId: true,
  userId: true,
  content: true,
  parentId: true,
});

// ---- DOCUMENT COLLECTIONS ----
export const documentCollections = pgTable("document_collections", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentCollectionsRelations = relations(documentCollections, ({ one, many }) => ({
  owner: one(users, {
    fields: [documentCollections.ownerId],
    references: [users.id],
  }),
  items: many(collectionItems),
}));

export const insertDocumentCollectionSchema = createInsertSchema(documentCollections).pick({
  ownerId: true,
  title: true,
  description: true,
  isPublic: true,
});

// ---- COLLECTION ITEMS ----
export const collectionItems = pgTable("collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => documentCollections.id, { onDelete: "cascade" }),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(documentCollections, {
    fields: [collectionItems.collectionId],
    references: [documentCollections.id],
  }),
  document: one(documents, {
    fields: [collectionItems.documentId],
    references: [documents.id],
  }),
}));

export const insertCollectionItemSchema = createInsertSchema(collectionItems).pick({
  collectionId: true,
  documentId: true,
  displayOrder: true,
});

// Type definitions for TypeScript
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentShare = typeof documentShares.$inferSelect;
export type InsertDocumentShare = z.infer<typeof insertDocumentShareSchema>;

export type DocumentComment = typeof documentComments.$inferSelect;
export type InsertDocumentComment = z.infer<typeof insertDocumentCommentSchema>;

export type DocumentCollection = typeof documentCollections.$inferSelect;
export type InsertDocumentCollection = z.infer<typeof insertDocumentCollectionSchema>;

export type CollectionItem = typeof collectionItems.$inferSelect;
export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;