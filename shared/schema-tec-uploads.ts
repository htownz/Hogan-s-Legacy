import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";
import { politicalEntities, financialTransactions, entityRelationships } from "./schema-campaign-finance";

// Define processing status enum
export const tecFileProcessingStatusEnum = pgEnum("tec_file_processing_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "manual_review"
]);

// Define file type enum
export const tecFileTypeEnum = pgEnum("tec_file_type", [
  "campaign_contributions",
  "campaign_expenditures",
  "lobbyist_registrations",
  "firm_registrations",
  "ethics_violations",
  "corrected_filings",
  "generic"
]);

// TEC File Uploads table
export const tecFileUploads = pgTable("tec_file_uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  originalFilename: text("original_filename").notNull(),
  storedFilename: text("stored_filename").notNull(),
  fileType: tecFileTypeEnum("file_type"),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type"),
  fileHash: text("file_hash"), // For duplicate detection
  status: tecFileProcessingStatusEnum("status").default("pending").notNull(),
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  errorMessage: text("error_message"),
  recordsTotal: integer("records_total").default(0),
  recordsProcessed: integer("records_processed").default(0),
  entitiesFound: integer("entities_found").default(0),
  transactionsFound: integer("transactions_found").default(0),
  relationshipsFound: integer("relationships_found").default(0),
  moderationQueueItems: integer("moderation_queue_items").default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TEC Moderation Queue
export const tecModerationQueue = pgTable("tec_moderation_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileUploadId: uuid("file_upload_id").references(() => tecFileUploads.id, { onDelete: "cascade" }),
  entityName: text("entity_name").notNull(),
  entityType: text("entity_type").notNull(),
  significanceScore: integer("significance_score").default(0).notNull(),
  transactionCount: integer("transaction_count").default(0),
  financialTotal: integer("financial_total").default(0),
  connectionCount: integer("connection_count").default(0),
  relatedEntities: json("related_entities").$type<string[]>().default([]),
  sampleData: json("sample_data").$type<Record<string, any>[]>().default([]),
  aiSummary: text("ai_summary"),
  flags: json("flags").$type<{
    type: string;
    severity: string;
    description: string;
  }[]>().default([]),
  status: text("status").default("pending_review").notNull(), // pending_review, approved, rejected, merged
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  entityId: uuid("entity_id").references(() => politicalEntities.id), // If approved and linked to an entity
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const tecFileUploadsRelations = relations(tecFileUploads, ({ one, many }) => ({
  uploader: one(users, {
    fields: [tecFileUploads.userId],
    references: [users.id],
  }),
  moderationItems: many(tecModerationQueue),
}));

export const tecModerationQueueRelations = relations(tecModerationQueue, ({ one }) => ({
  fileUpload: one(tecFileUploads, {
    fields: [tecModerationQueue.fileUploadId],
    references: [tecFileUploads.id],
  }),
  reviewer: one(users, {
    fields: [tecModerationQueue.reviewedBy],
    references: [users.id],
  }),
  entity: one(politicalEntities, {
    fields: [tecModerationQueue.entityId],
    references: [politicalEntities.id],
  }),
}));

// Export Zod schemas
export const insertTecFileUploadSchema = createInsertSchema(tecFileUploads).omit({ 
  id: true, 
  uploadedAt: true,
  updatedAt: true,
});

export const insertTecModerationQueueSchema = createInsertSchema(tecModerationQueue).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

// Export types
export type InsertTecFileUpload = z.infer<typeof insertTecFileUploadSchema>;
export type TecFileUpload = typeof tecFileUploads.$inferSelect;

export type InsertTecModerationQueue = z.infer<typeof insertTecModerationQueueSchema>;
export type TecModerationQueue = typeof tecModerationQueue.$inferSelect;