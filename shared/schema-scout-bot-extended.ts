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

// Define additional enums for expanded Scout Bot
export const dataSourceEnum = pgEnum("data_source_type", [
  "lobbyist_report",
  "campaign_finance",
  "filing_correction",
  "firm_registration",
  "family_appointment",
  "pac_leadership",
  "legislative_calendar",
  "news_feed",
  "manual_entry",
]);

export const entityRelationshipEnum = pgEnum("entity_relationship_type", [
  "employer",
  "client",
  "donor",
  "recipient",
  "family_member",
  "partner",
  "sponsor",
  "affiliated",
]);

export const flagTypeEnum = pgEnum("flag_type", [
  "late_filing",
  "correction",
  "conflict_of_interest",
  "multi_dataset_match",
  "family_connection",
  "pac_firm_connection",
]);

// Lobbyist reports
export const scoutBotLobbyistReports = pgTable("scout_bot_lobbyist_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  client_name: text("client_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  filing_date: date("filing_date"),
  quarter: text("quarter"),
  year: integer("year"),
  description: text("description"),
  category: text("category"),
  official_document_url: text("official_document_url"),
  verified: boolean("verified").default(false),
  source_dataset: dataSourceEnum("source_dataset").default("lobbyist_report").notNull(),
  confidence_score: integer("confidence_score").default(70),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Campaign finance reports
export const scoutBotCampaignFinance = pgTable("scout_bot_campaign_finance", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  committee_name: text("committee_name").notNull(),
  candidate_name: text("candidate_name"),
  transaction_type: text("transaction_type"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  filing_date: date("filing_date"),
  transaction_date: date("transaction_date"),
  purpose: text("purpose"),
  election_cycle: text("election_cycle"),
  official_document_url: text("official_document_url"),
  verified: boolean("verified").default(false),
  source_dataset: dataSourceEnum("source_dataset").default("campaign_finance").notNull(),
  confidence_score: integer("confidence_score").default(70),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Filing corrections and amendments
export const scoutBotFilingCorrections = pgTable("scout_bot_filing_corrections", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  original_filing_id: text("original_filing_id").notNull(),
  correction_date: date("correction_date"),
  filing_type: text("filing_type").notNull(),
  reason: text("reason"),
  days_late: integer("days_late"),
  penalty_amount: decimal("penalty_amount", { precision: 10, scale: 2 }),
  official_document_url: text("official_document_url"),
  verified: boolean("verified").default(false),
  source_dataset: dataSourceEnum("source_dataset").default("filing_correction").notNull(),
  confidence_score: integer("confidence_score").default(80),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Firm registrations
export const scoutBotFirmRegistrations = pgTable("scout_bot_firm_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  firm_name: text("firm_name").notNull(),
  role: text("role").notNull(),
  registration_date: date("registration_date"),
  registration_type: text("registration_type"),
  ownership_stake: decimal("ownership_stake", { precision: 5, scale: 2 }),
  parent_company: text("parent_company"),
  official_document_url: text("official_document_url"),
  verified: boolean("verified").default(false),
  source_dataset: dataSourceEnum("source_dataset").default("firm_registration").notNull(),
  confidence_score: integer("confidence_score").default(80),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Family & spouse appointments
export const scoutBotFamilyAppointments = pgTable("scout_bot_family_appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  related_name: text("related_name").notNull(),
  relationship: text("relationship").notNull(),
  appointed_position: text("appointed_position").notNull(),
  appointing_entity: text("appointing_entity"),
  appointment_date: date("appointment_date"),
  term_end_date: date("term_end_date"),
  compensation: text("compensation"),
  official_document_url: text("official_document_url"),
  verified: boolean("verified").default(false),
  source_dataset: dataSourceEnum("source_dataset").default("family_appointment").notNull(),
  confidence_score: integer("confidence_score").default(70),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// PAC leadership
export const scoutBotPacLeadership = pgTable("scout_bot_pac_leadership", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  pac_name: text("pac_name").notNull(),
  role: text("role").notNull(),
  appointment_date: date("appointment_date"),
  term_end_date: date("term_end_date"),
  pac_type: text("pac_type"),
  pac_focus: text("pac_focus"),
  official_document_url: text("official_document_url"),
  verified: boolean("verified").default(false),
  source_dataset: dataSourceEnum("source_dataset").default("pac_leadership").notNull(),
  confidence_score: integer("confidence_score").default(85),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Legislative calendar appearances
export const scoutBotLegislativeAppearances = pgTable("scout_bot_legislative_appearances", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  event_name: text("event_name").notNull(),
  committee: text("committee"),
  appearance_date: date("appearance_date"),
  bill_id: text("bill_id"),
  position: text("position"),
  testimony_url: text("testimony_url"),
  official_document_url: text("official_document_url"),
  verified: boolean("verified").default(false),
  source_dataset: dataSourceEnum("source_dataset").default("legislative_calendar").notNull(),
  confidence_score: integer("confidence_score").default(75),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Entity relationships (tracks connections between entities)
export const scoutBotEntityRelationships = pgTable("scout_bot_entity_relationships", {
  id: uuid("id").defaultRandom().primaryKey(),
  source_profile_id: uuid("source_profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  target_entity_name: text("target_entity_name").notNull(),
  target_entity_id: uuid("target_entity_id").references(() => scoutBotProfiles.id, { onDelete: "set null" }),
  relationship_type: entityRelationshipEnum("relationship_type").notNull(),
  relationship_description: text("relationship_description"),
  start_date: date("start_date"),
  end_date: date("end_date"),
  is_active: boolean("is_active").default(true),
  monetary_value: decimal("monetary_value", { precision: 12, scale: 2 }),
  source_dataset: dataSourceEnum("source_dataset").notNull(),
  source_url: text("source_url"),
  verified: boolean("verified").default(false),
  confidence_score: integer("confidence_score").default(70),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Transparency flags (suspicious behavior indicators)
export const scoutBotFlags = pgTable("scout_bot_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  flag_type: flagTypeEnum("flag_type").notNull(),
  description: text("description").notNull(),
  severity: integer("severity").default(1), // 1-5 scale
  detection_date: timestamp("detection_date").defaultNow(),
  related_entities: json("related_entities").$type<{id: string, name: string, type: string}[]>().default([]),
  evidence_urls: json("evidence_urls").$type<string[]>().default([]),
  reviewed: boolean("reviewed").default(false),
  reviewed_by: uuid("reviewed_by"),
  resolution_notes: text("resolution_notes"),
  source_dataset: dataSourceEnum("source_dataset").notNull(),
  confidence_score: integer("confidence_score").default(60),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations for easier querying
export const scoutBotLobbyistReportsRelations = relations(
  scoutBotLobbyistReports,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotLobbyistReports.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotCampaignFinanceRelations = relations(
  scoutBotCampaignFinance,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotCampaignFinance.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotFilingCorrectionsRelations = relations(
  scoutBotFilingCorrections,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotFilingCorrections.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotFirmRegistrationsRelations = relations(
  scoutBotFirmRegistrations,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotFirmRegistrations.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotFamilyAppointmentsRelations = relations(
  scoutBotFamilyAppointments,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotFamilyAppointments.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotPacLeadershipRelations = relations(
  scoutBotPacLeadership,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotPacLeadership.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotLegislativeAppearancesRelations = relations(
  scoutBotLegislativeAppearances,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotLegislativeAppearances.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotEntityRelationshipsRelations = relations(
  scoutBotEntityRelationships,
  ({ one }) => ({
    sourceProfile: one(scoutBotProfiles, {
      fields: [scoutBotEntityRelationships.source_profile_id],
      references: [scoutBotProfiles.id],
    }),
    targetProfile: one(scoutBotProfiles, {
      fields: [scoutBotEntityRelationships.target_entity_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotFlagsRelations = relations(
  scoutBotFlags,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotFlags.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

// Extend profile relations to include the new tables
export const extendedScoutBotProfilesRelations = relations(
  scoutBotProfiles,
  ({ many }) => ({
    lobbyistReports: many(scoutBotLobbyistReports),
    campaignFinance: many(scoutBotCampaignFinance),
    filingCorrections: many(scoutBotFilingCorrections),
    firmRegistrations: many(scoutBotFirmRegistrations),
    familyAppointments: many(scoutBotFamilyAppointments),
    pacLeadership: many(scoutBotPacLeadership),
    legislativeAppearances: many(scoutBotLegislativeAppearances),
    sourceRelationships: many(scoutBotEntityRelationships, { relationName: "sourceProfile" }),
    targetRelationships: many(scoutBotEntityRelationships, { relationName: "targetProfile" }),
    flags: many(scoutBotFlags),
  })
);

// Zod schemas for validation
export const insertScoutBotLobbyistReportSchema = createInsertSchema(scoutBotLobbyistReports).omit({ id: true });
export const insertScoutBotCampaignFinanceSchema = createInsertSchema(scoutBotCampaignFinance).omit({ id: true });
export const insertScoutBotFilingCorrectionSchema = createInsertSchema(scoutBotFilingCorrections).omit({ id: true });
export const insertScoutBotFirmRegistrationSchema = createInsertSchema(scoutBotFirmRegistrations).omit({ id: true });
export const insertScoutBotFamilyAppointmentSchema = createInsertSchema(scoutBotFamilyAppointments).omit({ id: true });
export const insertScoutBotPacLeadershipSchema = createInsertSchema(scoutBotPacLeadership).omit({ id: true });
export const insertScoutBotLegislativeAppearanceSchema = createInsertSchema(scoutBotLegislativeAppearances).omit({ id: true });
export const insertScoutBotEntityRelationshipSchema = createInsertSchema(scoutBotEntityRelationships).omit({ id: true });
export const insertScoutBotFlagSchema = createInsertSchema(scoutBotFlags).omit({ id: true });

// Types based on the schemas
export type InsertScoutBotLobbyistReport = z.infer<typeof insertScoutBotLobbyistReportSchema>;
export type ScoutBotLobbyistReport = typeof scoutBotLobbyistReports.$inferSelect;

export type InsertScoutBotCampaignFinance = z.infer<typeof insertScoutBotCampaignFinanceSchema>;
export type ScoutBotCampaignFinance = typeof scoutBotCampaignFinance.$inferSelect;

export type InsertScoutBotFilingCorrection = z.infer<typeof insertScoutBotFilingCorrectionSchema>;
export type ScoutBotFilingCorrection = typeof scoutBotFilingCorrections.$inferSelect;

export type InsertScoutBotFirmRegistration = z.infer<typeof insertScoutBotFirmRegistrationSchema>;
export type ScoutBotFirmRegistration = typeof scoutBotFirmRegistrations.$inferSelect;

export type InsertScoutBotFamilyAppointment = z.infer<typeof insertScoutBotFamilyAppointmentSchema>;
export type ScoutBotFamilyAppointment = typeof scoutBotFamilyAppointments.$inferSelect;

export type InsertScoutBotPacLeadership = z.infer<typeof insertScoutBotPacLeadershipSchema>;
export type ScoutBotPacLeadership = typeof scoutBotPacLeadership.$inferSelect;

export type InsertScoutBotLegislativeAppearance = z.infer<typeof insertScoutBotLegislativeAppearanceSchema>;
export type ScoutBotLegislativeAppearance = typeof scoutBotLegislativeAppearances.$inferSelect;

export type InsertScoutBotEntityRelationship = z.infer<typeof insertScoutBotEntityRelationshipSchema>;
export type ScoutBotEntityRelationship = typeof scoutBotEntityRelationships.$inferSelect;

export type InsertScoutBotFlag = z.infer<typeof insertScoutBotFlagSchema>;
export type ScoutBotFlag = typeof scoutBotFlags.$inferSelect;