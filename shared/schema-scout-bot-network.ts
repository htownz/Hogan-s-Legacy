import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  integer, 
  pgEnum,
  json, 
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { scoutBotProfiles } from "./schema-scout-bot";

// Network connection strength enum
export const networkStrengthEnum = pgEnum("network_strength", [
  "weak",
  "moderate",
  "strong",
  "very_strong"
]);

// Network type enum
export const networkTypeEnum = pgEnum("network_type", [
  "financial",
  "political",
  "familial",
  "professional",
  "mixed"
]);

// Pattern type enum
export const patternTypeEnum = pgEnum("pattern_type", [
  "circular_funding",
  "revolving_door",
  "family_business",
  "conflict_of_interest",
  "political_favoritism",
  "cross_agency_influence",
  "coordinated_action",
  "lobbying_cluster"
]);

// Network connections between profiles
export const scoutBotNetworkConnections = pgTable("scout_bot_network_connections", {
  id: uuid("id").primaryKey().notNull(),
  source_profile_id: text("source_profile_id").notNull().references(() => scoutBotProfiles.id),
  target_profile_id: text("target_profile_id").notNull().references(() => scoutBotProfiles.id),
  connection_type: text("connection_type").notNull(), // employer, donor, recipient, family_member, etc.
  strength: networkStrengthEnum("strength").default("moderate"),
  description: text("description"),
  first_detected: timestamp("first_detected"),
  evidence_urls: text("evidence_urls").array(),
  evidence_summary: text("evidence_summary"),
  verified: integer("verified").default(0), // 0 = unverified, 1 = verified, 2 = disputed
  verification_notes: text("verification_notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Influence networks (groups of entities with shared interests/activities)
export const scoutBotInfluenceNetworks = pgTable("scout_bot_influence_networks", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  network_type: networkTypeEnum("network_type"),
  central_entities: json("central_entities").$type<{ id: string, name: string, role: string }[]>(),
  entity_count: integer("entity_count").default(0),
  source_data: json("source_data").$type<{ 
    data_sources: string[], 
    analysis_timestamp: string,
    additional_context?: string 
  }>(),
  influence_metrics: json("influence_metrics").$type<{
    financial_weight?: number,
    political_reach?: number,
    public_profile?: number,
    influence_score?: number
  }>(),
  confidence: integer("confidence").default(75),
  verified: integer("verified").default(0),
  network_graph: json("network_graph").$type<{
    nodes: { id: string, type: string, attributes?: Record<string, any> }[],
    edges: { source: string, target: string, type: string, attributes?: Record<string, any> }[]
  }>(),
  first_detected: timestamp("first_detected"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Network members (profiles that are part of an influence network)
export const scoutBotNetworkMembers = pgTable("scout_bot_network_members", {
  id: uuid("id").primaryKey().notNull(),
  network_id: text("network_id").notNull().references(() => scoutBotInfluenceNetworks.id),
  profile_id: text("profile_id").notNull().references(() => scoutBotProfiles.id),
  role: text("role").notNull(), // central, peripheral, connector, etc.
  role_description: text("role_description"),
  joined_date: timestamp("joined_date"),
  influence_level: integer("influence_level").default(5), // 1-10 scale
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Influence patterns (detected patterns of suspicious or notable influence behavior)
export const scoutBotInfluencePatterns = pgTable("scout_bot_influence_patterns", {
  id: uuid("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pattern_type: patternTypeEnum("pattern_type").notNull(),
  primary_entities: json("primary_entities").$type<{ id: string, name: string, role: string }[]>(),
  involved_profiles: text("involved_profiles"), // Serialized array of profile IDs
  detected_data: json("detected_data").$type<{ 
    detection_method: string,
    confidence_factors: string[],
    evidence_references?: string[],
    detection_timestamp: string 
  }>(),
  severity: integer("severity").default(5), // 1-10 scale
  confidence: integer("confidence").default(70), // 0-100 scale
  verified: integer("verified").default(0),
  verification_notes: text("verification_notes"),
  first_detected: timestamp("first_detected"),
  last_detected: timestamp("last_detected"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Temporal influence (tracking changes in influence over time)
export const scoutBotTemporalInfluence = pgTable("scout_bot_temporal_influence", {
  id: uuid("id").primaryKey().notNull(),
  profile_id: text("profile_id").notNull().references(() => scoutBotProfiles.id),
  time_period: text("time_period").notNull(), // e.g., "2023Q1", "2022H2", "2021"
  time_period_start: timestamp("time_period_start").notNull(),
  time_period_end: timestamp("time_period_end").notNull(),
  influence_score: integer("influence_score"),
  connections_count: integer("connections_count"),
  financial_activities: integer("financial_activities"),
  legislative_actions: integer("legislative_actions"),
  public_statements: integer("public_statements"),
  key_relationships: json("key_relationships").$type<{ id: string, name: string, role: string }[]>(),
  notable_events: text("notable_events"),
  influence_change_factors: text("influence_change_factors"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Relations
export const scoutBotNetworkConnectionsRelations = relations(
  scoutBotNetworkConnections, 
  ({ one }) => ({
    sourceProfile: one(scoutBotProfiles, {
      fields: [scoutBotNetworkConnections.source_profile_id],
      references: [scoutBotProfiles.id],
    }),
    targetProfile: one(scoutBotProfiles, {
      fields: [scoutBotNetworkConnections.target_profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotInfluenceNetworksRelations = relations(
  scoutBotInfluenceNetworks, 
  ({ many }) => ({
    members: many(scoutBotNetworkMembers),
  })
);

export const scoutBotNetworkMembersRelations = relations(
  scoutBotNetworkMembers, 
  ({ one }) => ({
    network: one(scoutBotInfluenceNetworks, {
      fields: [scoutBotNetworkMembers.network_id],
      references: [scoutBotInfluenceNetworks.id],
    }),
    profile: one(scoutBotProfiles, {
      fields: [scoutBotNetworkMembers.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotInfluencePatternsRelations = relations(
  scoutBotInfluencePatterns, 
  ({ many }) => ({
    // No direct relations, but we have JSON fields linking to profiles
  })
);

export const scoutBotTemporalInfluenceRelations = relations(
  scoutBotTemporalInfluence, 
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotTemporalInfluence.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const extendedScoutBotNetworkProfilesRelations = relations(
  scoutBotProfiles, 
  ({ many }) => ({
    outgoingConnections: many(scoutBotNetworkConnections, { relationName: "sourceProfile" }),
    incomingConnections: many(scoutBotNetworkConnections, { relationName: "targetProfile" }),
    networkMemberships: many(scoutBotNetworkMembers),
    temporalInfluence: many(scoutBotTemporalInfluence),
  })
);

// Zod schemas for inserts
export const insertScoutBotNetworkConnectionSchema = createInsertSchema(scoutBotNetworkConnections).omit({ id: true });
export const insertScoutBotInfluenceNetworkSchema = createInsertSchema(scoutBotInfluenceNetworks).omit({ id: true });
export const insertScoutBotNetworkMemberSchema = createInsertSchema(scoutBotNetworkMembers).omit({ id: true });
export const insertScoutBotInfluencePatternSchema = createInsertSchema(scoutBotInfluencePatterns).omit({ id: true });
export const insertScoutBotTemporalInfluenceSchema = createInsertSchema(scoutBotTemporalInfluence).omit({ id: true });

// Types
export type InsertScoutBotNetworkConnection = z.infer<typeof insertScoutBotNetworkConnectionSchema>;
export type ScoutBotNetworkConnection = typeof scoutBotNetworkConnections.$inferSelect;

export type InsertScoutBotInfluenceNetwork = z.infer<typeof insertScoutBotInfluenceNetworkSchema>;
export type ScoutBotInfluenceNetwork = typeof scoutBotInfluenceNetworks.$inferSelect;

export type InsertScoutBotNetworkMember = z.infer<typeof insertScoutBotNetworkMemberSchema>;
export type ScoutBotNetworkMember = typeof scoutBotNetworkMembers.$inferSelect;

export type InsertScoutBotInfluencePattern = z.infer<typeof insertScoutBotInfluencePatternSchema>;
export type ScoutBotInfluencePattern = typeof scoutBotInfluencePatterns.$inferSelect;

export type InsertScoutBotTemporalInfluence = z.infer<typeof insertScoutBotTemporalInfluenceSchema>;
export type ScoutBotTemporalInfluence = typeof scoutBotTemporalInfluence.$inferSelect;