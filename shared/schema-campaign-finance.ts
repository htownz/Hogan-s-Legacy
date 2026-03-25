import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
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
import { scoutBotProfiles } from "./schema-scout-bot";

// Define enums for campaign finance data
export const campaignFinanceSourceEnum = pgEnum("campaign_finance_source", [
  "fec", // Federal Election Commission
  "tec", // Texas Ethics Commission
  "other_state", // Other state disclosure systems
  "manual", // Manually entered data
]);

export const campaignFinanceEntityTypeEnum = pgEnum("campaign_finance_entity_type", [
  "individual", // Individual donor or recipient
  "candidate", // Political candidate
  "committee", // Campaign committee
  "pac", // Political Action Committee
  "super_pac", // Super PAC
  "party_committee", // Political party committee
  "organization", // Non-political organization
  "lobbyist", // Registered lobbyist
  "consulting_firm", // Political consulting firm
]);

export const campaignFinanceTransactionTypeEnum = pgEnum("campaign_finance_transaction_type", [
  "contribution", // Donation to campaign/committee
  "expenditure", // Spending by campaign/committee
  "transfer", // Transfer between committees
  "loan", // Loan to campaign
  "loan_repayment", // Repayment of campaign loan
  "refund", // Refund of contribution
  "in_kind", // In-kind contribution
  "independent_expenditure", // Independent expenditure
]);

// Base political entity table (for both FEC and TEC records)
export const politicalEntities = pgTable("political_entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  entity_type: campaignFinanceEntityTypeEnum("entity_type").notNull(),
  profile_id: uuid("profile_id").references(() => scoutBotProfiles.id, { onDelete: "set null" }),
  source_system: campaignFinanceSourceEnum("source_system").notNull(),
  source_id: text("source_id"), // ID in the original system (FEC ID, TEC ID)
  first_name: text("first_name"),
  last_name: text("last_name"),
  middle_name: text("middle_name"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  occupation: text("occupation"),
  employer: text("employer"),
  party: text("party"),
  office: text("office"), // For candidates: House, Senate, President, etc.
  district: text("district"), // For candidates: district number
  categories: json("categories").$type<string[]>().default([]),
  flags: json("flags").$type<{
    type: string;
    severity: string;
    description: string;
  }[]>().default([]),
  attributes: json("attributes").$type<Record<string, any>>().default({}),
  official_url: text("official_url"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  verified: boolean("verified").default(false),
  verified_by: uuid("verified_by"),
  verified_at: timestamp("verified_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Financial transactions (contributions, expenditures, etc.)
export const financialTransactions = pgTable("financial_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  transaction_type: campaignFinanceTransactionTypeEnum("transaction_type").notNull(),
  source_entity_id: uuid("source_entity_id").references(() => politicalEntities.id),
  target_entity_id: uuid("target_entity_id").references(() => politicalEntities.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  transaction_date: date("transaction_date"),
  filing_date: date("filing_date"),
  source_system: campaignFinanceSourceEnum("source_system").notNull(),
  source_transaction_id: text("source_transaction_id"),
  purpose: text("purpose"),
  description: text("description"),
  election_year: text("election_year"),
  election_type: text("election_type"), // Primary, General, Special
  memo: text("memo"),
  line_number: text("line_number"), // Form line number
  aggregated_amount: decimal("aggregated_amount", { precision: 12, scale: 2 }),
  report_type: text("report_type"),
  report_id: text("report_id"),
  transaction_id: text("transaction_id"),
  flags: json("flags").$type<{
    type: string;
    severity: string;
    description: string;
  }[]>().default([]),
  attributes: json("attributes").$type<Record<string, any>>().default({}),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Committees (both FEC and TEC)
export const committees = pgTable("committees", {
  id: uuid("id").defaultRandom().primaryKey(),
  entity_id: uuid("entity_id").notNull().references(() => politicalEntities.id, { onDelete: "cascade" }),
  committee_type: text("committee_type").notNull(), // PAC, Super PAC, Campaign, etc.
  committee_designation: text("committee_designation"), // Principal, Joint Fundraising, etc.
  organization_type: text("organization_type"),
  connected_organization: text("connected_organization"),
  candidate_id: uuid("candidate_id").references(() => politicalEntities.id),
  treasurer_name: text("treasurer_name"),
  custodian_name: text("custodian_name"),
  first_file_date: date("first_file_date"),
  last_file_date: date("last_file_date"),
  filing_frequency: text("filing_frequency"),
  party_affiliation: text("party_affiliation"),
  interest_group_category: text("interest_group_category"),
  source_system: campaignFinanceSourceEnum("source_system").notNull(),
  source_id: text("source_id").notNull(),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Candidates (both FEC and TEC)
export const candidates = pgTable("candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  entity_id: uuid("entity_id").notNull().references(() => politicalEntities.id, { onDelete: "cascade" }),
  office: text("office").notNull(), // President, Senate, House, Governor, etc.
  state: text("state"), // State abbreviation
  district: text("district"), // District number
  incumbent_challenger: text("incumbent_challenger"), // I = Incumbent, C = Challenger, O = Open Seat
  party_affiliation: text("party_affiliation"),
  election_year: text("election_year").array(),
  active_through: text("active_through"),
  source_system: campaignFinanceSourceEnum("source_system").notNull(),
  source_id: text("source_id").notNull(),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Entity relationships
export const entityRelationships = pgTable("entity_relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  source_entity_id: uuid("source_entity_id").notNull().references(() => politicalEntities.id, { onDelete: "cascade" }),
  target_entity_id: uuid("target_entity_id").notNull().references(() => politicalEntities.id, { onDelete: "cascade" }),
  relationship_type: text("relationship_type").notNull(), // employer, family, business_partner, etc.
  description: text("description"),
  start_date: date("start_date"),
  end_date: date("end_date"),
  is_active: boolean("is_active").default(true),
  monetary_value: decimal("monetary_value", { precision: 12, scale: 2 }),
  source_system: campaignFinanceSourceEnum("source_system").notNull(),
  confidence_score: integer("confidence_score").default(70),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const politicalEntitiesRelations = relations(politicalEntities, ({ many }) => ({
  sourceTransactions: many(financialTransactions, { relationName: "sourceEntity" }),
  targetTransactions: many(financialTransactions, { relationName: "targetEntity" }),
  committees: many(committees),
  candidacies: many(candidates),
  sourceRelationships: many(entityRelationships, { relationName: "sourceEntity" }),
  targetRelationships: many(entityRelationships, { relationName: "targetEntity" }),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  sourceEntity: one(politicalEntities, {
    fields: [financialTransactions.source_entity_id],
    references: [politicalEntities.id],
    relationName: "sourceEntity",
  }),
  targetEntity: one(politicalEntities, {
    fields: [financialTransactions.target_entity_id],
    references: [politicalEntities.id],
    relationName: "targetEntity",
  }),
}));

export const committeesRelations = relations(committees, ({ one }) => ({
  entity: one(politicalEntities, {
    fields: [committees.entity_id],
    references: [politicalEntities.id],
  }),
  candidate: one(politicalEntities, {
    fields: [committees.candidate_id],
    references: [politicalEntities.id],
  }),
}));

export const candidatesRelations = relations(candidates, ({ one }) => ({
  entity: one(politicalEntities, {
    fields: [candidates.entity_id],
    references: [politicalEntities.id],
  }),
}));

export const entityRelationshipsRelations = relations(entityRelationships, ({ one }) => ({
  sourceEntity: one(politicalEntities, {
    fields: [entityRelationships.source_entity_id],
    references: [politicalEntities.id],
    relationName: "sourceEntity",
  }),
  targetEntity: one(politicalEntities, {
    fields: [entityRelationships.target_entity_id],
    references: [politicalEntities.id],
    relationName: "targetEntity",
  }),
}));

// Export Zod schemas
export const insertPoliticalEntitySchema = createInsertSchema(politicalEntities).omit({ id: true });
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({ id: true });
export const insertCommitteeSchema = createInsertSchema(committees).omit({ id: true });
export const insertCandidateSchema = createInsertSchema(candidates).omit({ id: true });
export const insertEntityRelationshipSchema = createInsertSchema(entityRelationships).omit({ id: true });

// Export types
export type InsertPoliticalEntity = z.infer<typeof insertPoliticalEntitySchema>;
export type PoliticalEntity = typeof politicalEntities.$inferSelect;

export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

export type InsertCommittee = z.infer<typeof insertCommitteeSchema>;
export type Committee = typeof committees.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertEntityRelationship = z.infer<typeof insertEntityRelationshipSchema>;
export type EntityRelationship = typeof entityRelationships.$inferSelect;