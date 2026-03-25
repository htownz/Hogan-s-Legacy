import { relations, sql } from "drizzle-orm";
import { 
  integer, 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean,
  real,
  jsonb,
  primaryKey
} from "drizzle-orm/pg-core";
import { 
  createInsertSchema, 
  createSelectSchema 
} from "drizzle-zod";
import { z } from "zod";
import { bills } from "./schema";

/**
 * Texas legislative district map data
 */
export const legislativeDistricts = pgTable('legislative_districts', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'house', 'senate'
  districtNumber: integer('district_number').notNull(),
  name: text('name').notNull(),
  representativeName: text('representative_name'),
  partyAffiliation: text('party_affiliation'), // 'R', 'D', etc.
  geoJson: jsonb('geo_json').notNull(), // GeoJSON representation of district boundaries
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

/**
 * Relations for legislative districts
 */
export const legislativeDistrictsRelations = relations(legislativeDistricts, ({ many }) => ({
  billImpacts: many(billDistrictImpacts)
}));

/**
 * Bill impact on specific districts
 */
export const billDistrictImpacts = pgTable('bill_district_impacts', {
  id: serial('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  districtId: integer('district_id').notNull().references(() => legislativeDistricts.id, { onDelete: 'cascade' }),
  impactScore: real('impact_score').notNull(), // 0-10 scale
  impactDescription: text('impact_description'),
  isPositive: boolean('is_positive'), // Whether the impact is generally positive or negative
  impactAreas: jsonb('impact_areas').default({}), // Areas of impact (economy, education, etc.)
  sourceData: jsonb('source_data').default({}), // Data sources used for the impact analysis
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

/**
 * Relations for bill district impacts
 */
export const billDistrictImpactsRelations = relations(billDistrictImpacts, ({ one }) => ({
  bill: one(bills, {
    fields: [billDistrictImpacts.billId],
    references: [bills.id]
  }),
  district: one(legislativeDistricts, {
    fields: [billDistrictImpacts.districtId],
    references: [legislativeDistricts.id]
  })
}));

/**
 * Bill activity heatmap data (for mapping real-time engagement)
 */
export const billActivityHeatmap = pgTable('bill_activity_heatmap', {
  id: serial('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  activityType: text('activity_type').notNull(), // 'view', 'comment', 'share', etc.
  intensity: real('intensity').notNull().default(1), // Weight for the heatmap
  userId: integer('user_id'), // Optional user ID if authenticated
  ipAddress: text('ip_address'), // Anonymized IP for clustering
  userAgent: text('user_agent'), // For platform analytics
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});

/**
 * Relations for bill activity heatmap
 */
export const billActivityHeatmapRelations = relations(billActivityHeatmap, ({ one }) => ({
  bill: one(bills, {
    fields: [billActivityHeatmap.billId],
    references: [bills.id]
  })
}));

/**
 * Committee meeting locations
 */
export const committeeMeetingLocations = pgTable('committee_meeting_locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull().default('TX'),
  zipCode: text('zip_code'),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  building: text('building'),
  room: text('room'),
  description: text('description'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Types and schemas for LegislativeDistrict
export type LegislativeDistrict = typeof legislativeDistricts.$inferSelect;
export type InsertLegislativeDistrict = typeof legislativeDistricts.$inferInsert;
export const insertLegislativeDistrictSchema = createInsertSchema(legislativeDistricts);
export const selectLegislativeDistrictSchema = createSelectSchema(legislativeDistricts);

// Types and schemas for BillDistrictImpact
export type BillDistrictImpact = typeof billDistrictImpacts.$inferSelect;
export type InsertBillDistrictImpact = typeof billDistrictImpacts.$inferInsert;
export const insertBillDistrictImpactSchema = createInsertSchema(billDistrictImpacts);
export const selectBillDistrictImpactSchema = createSelectSchema(billDistrictImpacts);

// Types and schemas for BillActivityHeatmap
export type BillActivityHeatmap = typeof billActivityHeatmap.$inferSelect;
export type InsertBillActivityHeatmap = typeof billActivityHeatmap.$inferInsert;
export const insertBillActivityHeatmapSchema = createInsertSchema(billActivityHeatmap);
export const selectBillActivityHeatmapSchema = createSelectSchema(billActivityHeatmap);

// Types and schemas for CommitteeMeetingLocation
export type CommitteeMeetingLocation = typeof committeeMeetingLocations.$inferSelect;
export type InsertCommitteeMeetingLocation = typeof committeeMeetingLocations.$inferInsert;
export const insertCommitteeMeetingLocationSchema = createInsertSchema(committeeMeetingLocations);
export const selectCommitteeMeetingLocationSchema = createSelectSchema(committeeMeetingLocations);