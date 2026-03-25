import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { legislators } from "./schema-legislators";
import { bills } from "./schema";

// Texas Ethics Commission (TEC) filing types
export const tecFilingTypes = {
  lobbyistRegistration: 'lobbyist_registration',
  lobbyistUpdate: 'lobbyist_update',
  campaignFinance: 'campaign_finance_report',
  candidateReport: 'candidate_report',
  pacReport: 'pac_report',
  correctedFiling: 'corrected_filing',
  lateFiling: 'late_filing'
};

// ---- LOBBYISTS ----
export const lobbyists = pgTable("lobbyists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  firm: text("firm"),
  clients: jsonb("clients").default([]).notNull(), // Array of client names or IDs
  moneySpent: integer("money_spent").default(0), // Amount spent on lobbying
  lateReports: integer("late_reports").default(0), // Number of late reports filed
  legislatorContacts: jsonb("legislator_contacts").default([]), // Array of legislator IDs
  legalFlags: jsonb("legal_flags").default([]), // Array of legal flags
  relatedNews: jsonb("related_news").default([]), // Array of news URLs or snippets
  biography: text("biography"),
  imageUrl: text("image_url"),
  contactInfo: jsonb("contact_info").default({}), // Email, phone, office, etc.
  registrationDate: date("registration_date"),
  lastRegistrationRenewal: date("last_registration_renewal"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLobbyistSchema = createInsertSchema(lobbyists).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Lobbyist = typeof lobbyists.$inferSelect;
export type InsertLobbyist = z.infer<typeof insertLobbyistSchema>;

// ---- LOBBY FIRMS ----
export const lobbyFirms = pgTable("lobby_firms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  totalSpending: integer("total_spending").default(0), // Total spending on lobbying
  lobbyistCount: integer("lobbyist_count").default(0), // Number of lobbyists at the firm
  topClients: jsonb("top_clients").default([]), // Array of top client names
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  yearsActive: integer("years_active"), 
  clientIndustries: jsonb("client_industries").default([]), // Industries represented
  principalContact: text("principal_contact"), // Main contact at the firm
  legalFlags: jsonb("legal_flags").default([]), // Array of legal flags
  relatedNews: jsonb("related_news").default([]), // Array of news URLs or snippets
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLobbyFirmSchema = createInsertSchema(lobbyFirms).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LobbyFirm = typeof lobbyFirms.$inferSelect;
export type InsertLobbyFirm = z.infer<typeof insertLobbyFirmSchema>;

// ---- LOBBYING ACTIVITIES ----
export const lobbyingActivities = pgTable("lobbying_activities", {
  id: serial("id").primaryKey(),
  lobbyistId: integer("lobbyist_id").notNull().references(() => lobbyists.id),
  legislatorId: integer("legislator_id").references(() => legislators.id),
  billId: text("bill_id").references(() => bills.id),
  activityType: text("activity_type").notNull(), // meeting, communication, event, gift, etc.
  description: text("description"),
  date: timestamp("date").notNull(),
  amount: doublePrecision("amount"), // If monetary value is involved
  location: text("location"),
  reported: boolean("reported").default(false), // Whether activity was properly reported
  source: text("source"), // Source of the information
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLobbyingActivitySchema = createInsertSchema(lobbyingActivities).omit({ 
  id: true,
  createdAt: true,
});

export type LobbyingActivity = typeof lobbyingActivities.$inferSelect;
export type InsertLobbyingActivity = z.infer<typeof insertLobbyingActivitySchema>;

// ---- CAMPAIGN FINANCE ----
export const campaignFinance = pgTable("campaign_finance", {
  id: serial("id").primaryKey(),
  legislatorId: integer("legislator_id").notNull().references(() => legislators.id),
  donorName: text("donor_name").notNull(),
  donorType: text("donor_type").notNull(), // individual, corporation, PAC, lobbyist, etc.
  amount: doublePrecision("amount").notNull(),
  date: timestamp("date").notNull(),
  reportId: text("report_id"), // ID of the finance report
  reportingPeriod: text("reporting_period"),
  donorAffiliation: text("donor_affiliation"), // Organization the donor is affiliated with
  donorOccupation: text("donor_occupation"), // Occupation of individual donors
  inKind: boolean("in_kind").default(false), // Whether it's an in-kind contribution
  recurring: boolean("recurring").default(false), // Whether it's a recurring contribution
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampaignFinanceSchema = createInsertSchema(campaignFinance).omit({ 
  id: true,
  createdAt: true,
});

export type CampaignFinance = typeof campaignFinance.$inferSelect;
export type InsertCampaignFinance = z.infer<typeof insertCampaignFinanceSchema>;

// ---- NEWS FLAGS ----
export const newsFlags = pgTable("news_flags", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  publicationDate: timestamp("publication_date").notNull(),
  source: text("source").notNull(),
  relevantParties: jsonb("relevant_parties").default([]), // Legislator IDs, lobbyist IDs, etc.
  relevantBills: jsonb("relevant_bills").default([]), // Bill IDs
  category: text("category").notNull(), // ethics, campaign, legal, etc.
  sentiment: integer("sentiment"), // -100 to 100 scale
  verified: boolean("verified").default(false), // Whether independently verified
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewsFlagSchema = createInsertSchema(newsFlags).omit({ 
  id: true,
  createdAt: true,
});

export type NewsFlag = typeof newsFlags.$inferSelect;
export type InsertNewsFlag = z.infer<typeof insertNewsFlagSchema>;

// ---- ETHICS VIOLATIONS ----
export const ethicsViolations = pgTable("ethics_violations", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(), // ID of legislator or lobbyist
  subjectType: text("subject_type").notNull(), // legislator, lobbyist, etc.
  violationType: text("violation_type").notNull(), // conflict of interest, disclosure, gift, etc.
  description: text("description").notNull(),
  reportDate: timestamp("report_date").notNull(),
  status: text("status").notNull(), // alleged, under investigation, substantiated, cleared, etc.
  filingBody: text("filing_body"), // Who filed the ethics complaint
  resolution: text("resolution"),
  penalty: text("penalty"),
  relatedNews: jsonb("related_news").default([]), // Array of news URLs
  relatedDocuments: jsonb("related_documents").default([]), // Array of document URLs
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEthicsViolationSchema = createInsertSchema(ethicsViolations).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EthicsViolation = typeof ethicsViolations.$inferSelect;
export type InsertEthicsViolation = z.infer<typeof insertEthicsViolationSchema>;

// ---- HONESTY INDEX ----
export const honestyIndex = pgTable("honesty_index", {
  id: serial("id").primaryKey(),
  legislatorId: integer("legislator_id").notNull().references(() => legislators.id),
  score: integer("score").notNull(), // 0-100 honesty score
  categoryScores: jsonb("category_scores").default({}), // Scores by category (e.g., campaign promises, voting record)
  lastAssessment: timestamp("last_assessment").notNull(),
  assessmentMethod: text("assessment_method").notNull(), // How the score was calculated
  supportingEvidence: jsonb("supporting_evidence").default([]), // Array of evidence for score
  trendDirection: text("trend_direction"), // improving, declining, stable
  confidenceLevel: integer("confidence_level"), // Confidence in the assessment (0-100)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHonestyIndexSchema = createInsertSchema(honestyIndex).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type HonestyIndex = typeof honestyIndex.$inferSelect;
export type InsertHonestyIndex = z.infer<typeof insertHonestyIndexSchema>;

// Define lobbyist relations
export const lobbyistsRelations = relations(lobbyists, ({ many, one }) => ({
  activities: many(lobbyingActivities),
  firm: one(lobbyFirms, {
    fields: [lobbyists.firm],
    references: [lobbyFirms.name],
  }),
}));

// Define lobby firm relations
export const lobbyFirmsRelations = relations(lobbyFirms, ({ many }) => ({
  lobbyists: many(lobbyists),
}));

// Define lobbying activity relations
export const lobbyingActivitiesRelations = relations(lobbyingActivities, ({ one }) => ({
  lobbyist: one(lobbyists, {
    fields: [lobbyingActivities.lobbyistId],
    references: [lobbyists.id],
  }),
  legislator: one(legislators, {
    fields: [lobbyingActivities.legislatorId],
    references: [legislators.id],
  }),
}));

// Define campaign finance relations
export const campaignFinanceRelations = relations(campaignFinance, ({ one }) => ({
  legislator: one(legislators, {
    fields: [campaignFinance.legislatorId],
    references: [legislators.id],
  }),
}));

// Define honesty index relations
export const honestyIndexRelations = relations(honestyIndex, ({ one }) => ({
  legislator: one(legislators, {
    fields: [honestyIndex.legislatorId],
    references: [legislators.id],
  }),
}));