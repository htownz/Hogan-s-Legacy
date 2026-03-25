import { pgTable, serial, text, integer, boolean, timestamp, json, pgEnum, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { bills } from "./schema";

// =========================================================================
// Power Influencer Types: Consultant and Mega Influencer
// =========================================================================
export const influencerTypeEnum = pgEnum('influencer_type', ['consultant', 'mega_influencer']);

// =========================================================================
// Power Influencer Profiles - Base Table
// =========================================================================
export const powerInfluencers = pgTable('power_influencers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: influencerTypeEnum('type').notNull(),
  imageUrl: text('image_url'),
  biography: text('biography'),
  title: text('title'),
  organization: text('organization'),
  website: text('website'),
  email: text('email'),
  phone: text('phone'),
  socialMedia: json('social_media').$type<{
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  }>(),
  active: boolean('active').default(true),
  influenceScore: integer('influence_score'),
  policyAreas: json('policy_areas').$type<string[]>(),
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Consultant-specific details
// =========================================================================
export const consultants = pgTable('consultants', {
  id: serial('id').primaryKey(),
  influencerId: integer('influencer_id').notNull().references(() => powerInfluencers.id),
  firm: text('firm'),
  certifications: json('certifications').$type<string[]>(),
  specialties: json('specialties').$type<string[]>(),
  consultingFocus: json('consulting_focus').$type<string[]>(),
  yearsActive: integer('years_active'),
  averageContractSize: decimal('average_contract_size', { precision: 12, scale: 2 }),
  registeredLobbyist: boolean('registered_lobbyist').default(false),
  transparencyRating: integer('transparency_rating'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Mega Influencer-specific details
// =========================================================================
export const megaInfluencers = pgTable('mega_influencers', {
  id: serial('id').primaryKey(),
  influencerId: integer('influencer_id').notNull().references(() => powerInfluencers.id),
  netWorth: decimal('net_worth', { precision: 14, scale: 2 }),
  companies: json('companies').$type<{
    name: string;
    role: string;
    ownership?: number;
  }[]>(),
  industryFocus: json('industry_focus').$type<string[]>(),
  politicalAffiliation: text('political_affiliation'),
  influenceRadius: text('influence_radius'), // local, state, national, international
  philanthropicFocus: json('philanthropic_focus').$type<string[]>(),
  totalDonations: decimal('total_donations', { precision: 12, scale: 2 }),
  transparencyRating: integer('transparency_rating'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Clients & Campaigns for Consultants
// =========================================================================
export const consultantClients = pgTable('consultant_clients', {
  id: serial('id').primaryKey(),
  consultantId: integer('consultant_id').notNull().references(() => consultants.id),
  clientName: text('client_name').notNull(),
  clientType: text('client_type'), // campaign, pac, company, individual
  relationshipStart: timestamp('relationship_start'),
  relationshipEnd: timestamp('relationship_end'),
  serviceDescription: text('service_description'),
  contractValue: decimal('contract_value', { precision: 12, scale: 2 }),
  clientImageUrl: text('client_image_url'),
  contractLink: text('contract_link'),
  successRate: integer('success_rate'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const consultantCampaigns = pgTable('consultant_campaigns', {
  id: serial('id').primaryKey(),
  consultantId: integer('consultant_id').notNull().references(() => consultants.id),
  campaignName: text('campaign_name').notNull(),
  candidateName: text('candidate_name'),
  office: text('office'),
  electionYear: integer('election_year'),
  electionCycle: text('election_cycle'), // primary, general, runoff, special
  result: text('result'), // won, lost, withdrawn
  campaignBudget: decimal('campaign_budget', { precision: 12, scale: 2 }),
  role: text('role'), // manager, strategist, comms, digital, etc.
  highlightedAchievements: json('highlighted_achievements').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Bill Topic Influence Mapping
// =========================================================================
export const billTopicInfluence = pgTable('bill_topic_influence', {
  id: serial('id').primaryKey(),
  influencerId: integer('influencer_id').notNull().references(() => powerInfluencers.id),
  topic: text('topic').notNull(),
  billsInfluenced: integer('bills_influenced'),
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }),
  successRate: integer('success_rate'), // % of bills that passed/failed according to influence
  documented: boolean('documented').default(false), // if there's solid evidence of influence
  influence: text('influence').notNull(), // support, oppose
  influenceStrength: integer('influence_strength'), // 1-10 scale
  firstActivity: timestamp('first_activity'),
  lastActivity: timestamp('last_activity'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Specific Bill Influence Records
// =========================================================================
export const billInfluenceRecords = pgTable('bill_influence_records', {
  id: serial('id').primaryKey(),
  influencerId: integer('influencer_id').notNull().references(() => powerInfluencers.id),
  billId: text('bill_id').notNull().references(() => bills.id),
  position: text('position').notNull(), // support, oppose, neutral
  activityType: text('activity_type').notNull(), // donation, testimony, lobbying, public statements
  amountSpent: decimal('amount_spent', { precision: 12, scale: 2 }),
  activityDate: timestamp('activity_date'),
  activityDescription: text('activity_description'),
  successMetric: boolean('success_metric'), // Did bill outcome match influencer position?
  evidenceUrl: text('evidence_url'),
  evidenceType: text('evidence_type'), // document, news article, public record, etc.
  verified: boolean('verified').default(false), // fact-checked
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Influencer Connections: networks, relationships, associations
// =========================================================================
export const influencerConnections = pgTable('influencer_connections', {
  id: serial('id').primaryKey(),
  influencerId: integer('influencer_id').notNull().references(() => powerInfluencers.id),
  connectedToId: integer('connected_to_id'), // could be another influencer, legislator, etc.
  connectedToType: text('connected_to_type').notNull(), // influencer, legislator, pac, company
  connectedToName: text('connected_to_name').notNull(),
  relationshipType: text('relationship_type').notNull(), // business, family, political, financial
  relationshipStrength: integer('relationship_strength'), // 1-10 scale
  connectionStart: timestamp('connection_start'),
  connectionEnd: timestamp('connection_end'),
  connectionDescription: text('connection_description'),
  financialValue: decimal('financial_value', { precision: 12, scale: 2 }),
  documentedSource: text('documented_source'),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Campaign Donations by Influencers
// =========================================================================
export const influencerDonations = pgTable('influencer_donations', {
  id: serial('id').primaryKey(),
  influencerId: integer('influencer_id').notNull().references(() => powerInfluencers.id),
  recipientName: text('recipient_name').notNull(),
  recipientType: text('recipient_type').notNull(), // candidate, pac, party
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  donationDate: timestamp('donation_date'),
  electionCycle: text('election_cycle'),
  donationMethod: text('donation_method'), // direct, pac, bundled
  reportUrl: text('report_url'), // Link to filing report
  donationPurpose: text('donation_purpose'),
  declared: boolean('declared').default(true), // Was it properly disclosed?
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Influence Heatmap Data (for visualization)
// =========================================================================
export const influenceHeatmapData = pgTable('influence_heatmap_data', {
  id: serial('id').primaryKey(),
  influencerId: integer('influencer_id').notNull().references(() => powerInfluencers.id),
  entity: text('entity').notNull(), // committee, district, agency, etc.
  entityType: text('entity_type').notNull(),
  influenceScore: integer('influence_score').notNull(), // 0-100
  activityCount: integer('activity_count'),
  moneySpent: decimal('money_spent', { precision: 12, scale: 2 }),
  billsInfluenced: integer('bills_influenced'),
  successRate: integer('success_rate'),
  lastActivity: timestamp('last_activity'),
  relationshipEvidenceUrl: text('relationship_evidence_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =========================================================================
// Zod validation schemas for inserts
// =========================================================================
export const insertPowerInfluencerSchema = createInsertSchema(powerInfluencers)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPowerInfluencer = z.infer<typeof insertPowerInfluencerSchema>;
export type PowerInfluencer = typeof powerInfluencers.$inferSelect;

export const insertConsultantSchema = createInsertSchema(consultants)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type Consultant = typeof consultants.$inferSelect;

export const insertMegaInfluencerSchema = createInsertSchema(megaInfluencers)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMegaInfluencer = z.infer<typeof insertMegaInfluencerSchema>;
export type MegaInfluencer = typeof megaInfluencers.$inferSelect;

export const insertConsultantClientSchema = createInsertSchema(consultantClients)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConsultantClient = z.infer<typeof insertConsultantClientSchema>;
export type ConsultantClient = typeof consultantClients.$inferSelect;

export const insertConsultantCampaignSchema = createInsertSchema(consultantCampaigns)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConsultantCampaign = z.infer<typeof insertConsultantCampaignSchema>;
export type ConsultantCampaign = typeof consultantCampaigns.$inferSelect;

export const insertBillTopicInfluenceSchema = createInsertSchema(billTopicInfluence)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBillTopicInfluence = z.infer<typeof insertBillTopicInfluenceSchema>;
export type BillTopicInfluence = typeof billTopicInfluence.$inferSelect;

export const insertBillInfluenceRecordSchema = createInsertSchema(billInfluenceRecords)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBillInfluenceRecord = z.infer<typeof insertBillInfluenceRecordSchema>;
export type BillInfluenceRecord = typeof billInfluenceRecords.$inferSelect;

export const insertInfluencerConnectionSchema = createInsertSchema(influencerConnections)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInfluencerConnection = z.infer<typeof insertInfluencerConnectionSchema>;
export type InfluencerConnection = typeof influencerConnections.$inferSelect;

export const insertInfluencerDonationSchema = createInsertSchema(influencerDonations)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInfluencerDonation = z.infer<typeof insertInfluencerDonationSchema>;
export type InfluencerDonation = typeof influencerDonations.$inferSelect;

export const insertInfluenceHeatmapDataSchema = createInsertSchema(influenceHeatmapData)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInfluenceHeatmapData = z.infer<typeof insertInfluenceHeatmapDataSchema>;
export type InfluenceHeatmapData = typeof influenceHeatmapData.$inferSelect;