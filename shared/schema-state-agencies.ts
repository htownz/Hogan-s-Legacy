import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { bills } from "./schema";

// State agencies table
export const stateAgencies = pgTable("state_agencies", {
  id: text("id").notNull().primaryKey(), // Agency identifier like 'tdi', 'tceq'
  name: text("name").notNull(), // Full name of the agency: Texas Department of Insurance
  url: text("url").notNull(), // Base URL of the agency website
  logoUrl: text("logo_url"), // Optional URL to agency logo
  description: text("description"), // Brief description of the agency
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// State agency bill reports/analyses
export const agencyBillReports = pgTable("agency_bill_reports", {
  id: serial("id").primaryKey(),
  agencyId: text("agency_id").notNull().references(() => stateAgencies.id), // Foreign key to agencies
  title: text("title").notNull(), // Report title
  url: text("url").notNull(), // URL to the full report
  publishDate: timestamp("publish_date").notNull(), // When the report was published
  billIds: text("bill_ids").array(), // Array of bill IDs this report mentions
  summary: text("summary"), // Brief summary of the report
  contentHash: text("content_hash").notNull(), // Hash to detect changes
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// State agency legislative contacts
export const agencyLegislativeContacts = pgTable("agency_legislative_contacts", {
  id: serial("id").primaryKey(),
  agencyId: text("agency_id").notNull().references(() => stateAgencies.id),
  name: text("name").notNull(),
  title: text("title").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agency initiatives related to legislation
export const agencyInitiatives = pgTable("agency_initiatives", {
  id: serial("id").primaryKey(),
  agencyId: text("agency_id").notNull().references(() => stateAgencies.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  relatedBillIds: text("related_bill_ids").array(),
  status: text("status").notNull(), // 'active', 'completed', 'planned'
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relationships between tables
export const stateAgenciesRelations = relations(stateAgencies, ({ many }) => ({
  reports: many(agencyBillReports),
  contacts: many(agencyLegislativeContacts),
  initiatives: many(agencyInitiatives),
}));

export const agencyBillReportsRelations = relations(agencyBillReports, ({ one }) => ({
  agency: one(stateAgencies, {
    fields: [agencyBillReports.agencyId],
    references: [stateAgencies.id],
  }),
}));

// Zod schemas for validation
export const insertStateAgencySchema = createInsertSchema(stateAgencies).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAgencyBillReportSchema = createInsertSchema(agencyBillReports).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertAgencyLegislativeContactSchema = createInsertSchema(agencyLegislativeContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgencyInitiativeSchema = createInsertSchema(agencyInitiatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types based on the schemas
export type InsertStateAgency = z.infer<typeof insertStateAgencySchema>;
export type StateAgency = typeof stateAgencies.$inferSelect;

export type InsertAgencyBillReport = z.infer<typeof insertAgencyBillReportSchema>;
export type AgencyBillReport = typeof agencyBillReports.$inferSelect;

export type InsertAgencyLegislativeContact = z.infer<typeof insertAgencyLegislativeContactSchema>;
export type AgencyLegislativeContact = typeof agencyLegislativeContacts.$inferSelect;

export type InsertAgencyInitiative = z.infer<typeof insertAgencyInitiativeSchema>;
export type AgencyInitiative = typeof agencyInitiatives.$inferSelect;