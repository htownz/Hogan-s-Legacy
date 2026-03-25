import { integer, pgTable, serial, text, timestamp, boolean, pgEnum, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums for officials
export const officialStatusEnum = pgEnum('official_status', ['elected', 'appointed']);
export const officialPartyEnum = pgEnum('official_party', ['republican', 'democrat', 'independent', 'other']);
export const officialTypeEnum = pgEnum('official_type', [
  'senator', 
  'representative', 
  'governor', 
  'lt_governor', 
  'attorney_general', 
  'comptroller', 
  'land_commissioner', 
  'agriculture_commissioner', 
  'railroad_commissioner',
  'supreme_court_justice',
  'appeals_court_judge',
  'secretary_of_state',
  'other'
]);

// State Officials (both elected and appointed)
export const stateOfficials = pgTable('state_officials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  officialType: officialTypeEnum('official_type').notNull(),
  officialStatus: officialStatusEnum('official_status').notNull().default('elected'),
  party: officialPartyEnum('party').default('other'),
  position: text('position').notNull(),
  district: text('district'),
  districtId: integer('district_id').references(() => districts.id),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  officeAddress: text('office_address'),
  biography: text('biography'),
  termStart: timestamp('term_start'),
  termEnd: timestamp('term_end'),
  politicalLeaning: integer('political_leaning'), // 1-10 scale, 1 being very liberal, 10 being very conservative
  voteConsistency: integer('vote_consistency'), // Percentage of votes aligned with party
  legislativePriorities: text('legislative_priorities').array(),
  keyCommittees: text('key_committees').array(),
  photoUrl: text('photo_url'),
  cartoonAvatarUrl: text('cartoon_avatar_url'),
  socialMedia: text('social_media'),
  // Physical attributes for avatar generation
  gender: text('gender'),
  ethnicity: text('ethnicity'),
  approximateAge: integer('approximate_age'),
  hairDescription: text('hair_description'),
  facialFeatures: text('facial_features'),
  distinguishingFeatures: text('distinguishing_features'),
  // Record management fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Districts
export const districts = pgTable('districts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // senate, house, etc.
  geography: text('geography'), // GeoJSON or similar
  population: integer('population'),
  demographics: text('demographics'), // JSON string with demographic breakdown
  medianIncome: integer('median_income'),
  majorIndustries: text('major_industries').array(),
  keyIssues: text('key_issues').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Campaign Finance
export const campaignFinances = pgTable('campaign_finances', {
  id: serial('id').primaryKey(),
  officialId: integer('official_id').notNull().references(() => stateOfficials.id),
  reportingPeriod: text('reporting_period').notNull(),
  totalRaised: integer('total_raised').notNull(),
  totalSpent: integer('total_spent').notNull(),
  cashOnHand: integer('cash_on_hand').notNull(),
  topDonors: text('top_donors').array(), // JSON array of {name, amount, entity_type}
  topDonorSectors: text('top_donor_sectors').array(), // JSON array of {sector, amount}
  source: text('source'), // Where this data was sourced from
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Lobbying Entities
export const lobbyingEntities = pgTable('lobbying_entities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // corporation, trade association, advocacy group, etc.
  description: text('description'),
  industry: text('industry'),
  website: text('website'),
  address: text('address'),
  keyIssues: text('key_issues').array(),
  annualLobbyingSpend: integer('annual_lobbying_spend'),
  registeredLobbyists: integer('registered_lobbyists'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Lobbying Relationships
export const lobbyingRelationships = pgTable('lobbying_relationships', {
  id: serial('id').primaryKey(),
  officialId: integer('official_id').notNull().references(() => stateOfficials.id),
  entityId: integer('entity_id').notNull().references(() => lobbyingEntities.id),
  relationshipType: text('relationship_type').notNull(), // financial support, meetings, former employer, etc.
  strength: integer('strength'), // 1-10 scale indicating strength of relationship
  financialAmount: integer('financial_amount'), // If financial relationship, amount in dollars
  description: text('description'),
  evidenceUrls: text('evidence_urls').array(),
  lastContact: timestamp('last_contact'),
  confidenceScore: integer('confidence_score'), // 1-100, confidence in the validity of this relationship
  source: text('source'), // Where this relationship data was found
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Advocacy Arguments
export const advocacyArguments = pgTable('advocacy_arguments', {
  id: serial('id').primaryKey(),
  officialId: integer('official_id').notNull().references(() => stateOfficials.id),
  issueArea: text('issue_area').notNull(), // economy, healthcare, education, etc.
  position: text('position').notNull(), // the official's position on this issue
  effectiveFraming: text('effective_framing').notNull(), // how to frame arguments to this official
  valueAppeals: text('value_appeals').array(), // values to appeal to
  evidenceTypes: text('evidence_types').array(), // types of evidence that resonate (personal stories, statistics, etc.)
  thingsToAvoid: text('things_to_avoid').array(), // arguments or approaches to avoid
  successExamples: text('success_examples').array(), // examples of successful advocacy with this official
  researchSources: text('research_sources').array(), // sources for this advocacy information
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Define types from the schema
export type StateOfficial = typeof stateOfficials.$inferSelect;
export type District = typeof districts.$inferSelect;
export type CampaignFinance = typeof campaignFinances.$inferSelect;
export type LobbyingEntity = typeof lobbyingEntities.$inferSelect;
export type LobbyingRelationship = typeof lobbyingRelationships.$inferSelect;
export type AdvocacyArgument = typeof advocacyArguments.$inferSelect;

// Define insert types
export const insertStateOfficialSchema = createInsertSchema(stateOfficials).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDistrictSchema = createInsertSchema(districts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampaignFinanceSchema = createInsertSchema(campaignFinances).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLobbyingEntitySchema = createInsertSchema(lobbyingEntities).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLobbyingRelationshipSchema = createInsertSchema(lobbyingRelationships).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAdvocacyArgumentSchema = createInsertSchema(advocacyArguments).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertStateOfficial = z.infer<typeof insertStateOfficialSchema>;
export type InsertDistrict = z.infer<typeof insertDistrictSchema>;
export type InsertCampaignFinance = z.infer<typeof insertCampaignFinanceSchema>;
export type InsertLobbyingEntity = z.infer<typeof insertLobbyingEntitySchema>;
export type InsertLobbyingRelationship = z.infer<typeof insertLobbyingRelationshipSchema>;
export type InsertAdvocacyArgument = z.infer<typeof insertAdvocacyArgumentSchema>;