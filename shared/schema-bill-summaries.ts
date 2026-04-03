import { pgTable, text, serial, integer, timestamp, jsonb, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { bills } from "./schema";

/**
 * Schema for AI-generated bill summaries
 */
export const billSummaries = pgTable("bill_summaries", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id), // Foreign key to bills
  
  // Generated summaries
  executiveSummary: text("executive_summary"), // Short 2-3 sentence overview
  keyPoints: jsonb("key_points").default([]), // Array of key points
  impactAnalysis: text("impact_analysis"), // Assessment of potential impact
  legalImplications: text("legal_implications"), // Legal implications and changes
  stakeholderAnalysis: jsonb("stakeholder_analysis").default([]), // Who's affected and how
  
  // Enhanced content for 89th Legislative Session
  committeeActions: jsonb("committee_actions").default([]), // Committee actions and hearings
  keyDates: jsonb("key_dates").default([]), // Important dates in the bill's history
  historyHighlights: jsonb("history_highlights").default([]), // Significant events in bill history
  
  // New enhanced fields for comprehensive bill analysis
  implementationTimeline: jsonb("implementation_timeline").default([]), // Timeline for implementation with phases
  fiscalConsiderations: text("fiscal_considerations"), // Budget impact and funding sources
  citizenActionGuide: text("citizen_action_guide"), // How citizens can engage with this legislation
  
  // Files and sharing
  pdfGeneratedUrl: text("pdf_generated_url"), // URL to generated PDF summary
  hasShareableVersion: boolean("has_shareable_version").default(false), // Flag for shareable version
  lastExportedAt: timestamp("last_exported_at"), // When last exported/downloaded
  
  // Metadata
  generatedAt: timestamp("generated_at").defaultNow(),
  version: text("version").default("1.0"), // For tracking summary algorithm versions
  processingStatus: varchar("processing_status", { length: 30 }).default("pending"), // pending, processing, completed, failed
  
  // Track usage
  viewCount: integer("view_count").default(0),
  lastViewed: timestamp("last_viewed"),
  shareCount: integer("share_count").default(0),
  downloadCount: integer("download_count").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const billSummariesRelations = relations(billSummaries, ({ one }) => ({
  bill: one(bills, {
    fields: [billSummaries.billId],
    references: [bills.id],
  }),
}));

// Insert schema
export const insertBillSummarySchema = createInsertSchema(billSummaries).pick({
  billId: true,
  executiveSummary: true,
  keyPoints: true,
  impactAnalysis: true,
  legalImplications: true,
  stakeholderAnalysis: true,
  committeeActions: true,
  keyDates: true,
  historyHighlights: true,
  implementationTimeline: true,
  fiscalConsiderations: true,
  citizenActionGuide: true,
  pdfGeneratedUrl: true,
  hasShareableVersion: true,
  version: true,
  processingStatus: true,
});

// Select types
export type BillSummary = typeof billSummaries.$inferSelect;
export type InsertBillSummary = z.infer<typeof insertBillSummarySchema>;