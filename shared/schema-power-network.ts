/**
 * Political Power Network Schema
 *
 * Maps the Texas political power structure: Big Three (Governor, Lt Gov, Speaker),
 * their influence chains through leadership, committees, voting blocs, donors,
 * staff, lobbyists, and associations. Supports predictions on what legislation
 * will emerge and who will carry it.
 */
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { stakeholders } from "./schema-policy-intel";

// ── Enums ──────────────────────────────────────────────────────────────────

export const powerCenterRoleEnum = pgEnum("power_center_role", [
  "governor",
  "lieutenant_governor",
  "speaker",
  "pro_tempore",
  "majority_leader",
  "minority_leader",
  "whip",
  "caucus_chair",
  "committee_chair",
  "appropriations_chair",
  "rules_chair",
]);

export const actorTypeEnum = pgEnum("capitol_actor_type", [
  "elected_official",
  "capitol_staff",
  "campaign_staff",
  "lobbyist",
  "association_leader",
  "government_relations",
  "consultant",
  "donor",
  "media",
  "business_leader",
  "advocacy_org",
]);

export const connectionTypeEnum = pgEnum("network_connection_type", [
  "employs",
  "donates_to",
  "lobbies_for",
  "advises",
  "formerly_worked_for",
  "campaigns_for",
  "married_to",
  "related_to",
  "business_partner",
  "co_sponsors_with",
  "votes_with",
  "opposes",
  "mentors",
  "appointed_by",
  "association_member",
  "client_of",
]);

export const predictionStatusEnum = pgEnum("prediction_status", [
  "predicted",
  "filed",
  "confirmed",
  "missed",
  "partially_correct",
]);

// ── Power Centers ──────────────────────────────────────────────────────────

/** The Big Three + elected leadership positions */
export const powerCenters = pgTable("power_centers", {
  id: serial("id").primaryKey(),
  role: powerCenterRoleEnum("role").notNull(),
  name: text("name").notNull(),
  stakeholderId: integer("stakeholder_id").references(() => stakeholders.id),
  chamber: text("chamber"), // house, senate, executive
  party: text("party"),
  session: text("session").notNull(), // "89R", "88R"
  /** Key policy priorities for this leader */
  priorities: jsonb("priorities").$type<{
    topic: string;
    stance: "champion" | "oppose" | "neutral";
    intensity: number; // 1-10
    evidence: string;
  }[]>().default([]),
  /** Influence score 0-100 */
  influenceScore: integer("influence_score").default(0),
  /** Network stats */
  stats: jsonb("stats").$type<{
    loyalistCount: number;
    committeeChairsAppointed: number;
    billsPrioritized: number;
    passRate: number;
    donorOverlap: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Capitol Network Actors ─────────────────────────────────────────────────

/** All people in the political network beyond legislators */
export const capitolActors = pgTable("capitol_actors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  actorType: actorTypeEnum("actor_type").notNull(),
  /** If this actor is also a legislator */
  stakeholderId: integer("stakeholder_id").references(() => stakeholders.id),
  title: text("title"),
  organization: text("organization"),
  /** For lobbyists: registered clients */
  clients: jsonb("clients").$type<string[]>().default([]),
  /** For donors: total contributions tracked */
  totalContributions: doublePrecision("total_contributions").default(0),
  /** For staff: which office they work in */
  office: text("office"),
  party: text("party"),
  /** Influence score 0-100 based on network position */
  influenceScore: integer("influence_score").default(0),
  /** Contact info */
  email: text("email"),
  phone: text("phone"),
  /** External IDs for data linking */
  tecId: text("tec_id"), // Texas Ethics Commission ID
  fecId: text("fec_id"), // Federal Election Commission ID
  openStatesId: text("openstates_id"),
  /** Bio / background */
  bio: text("bio"),
  /** Tags for filtering */
  tags: jsonb("tags").$type<string[]>().default([]),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Network Connections ────────────────────────────────────────────────────

/** Edges in the political network graph */
export const capitolConnections = pgTable("capitol_connections", {
  id: serial("id").primaryKey(),
  /** Source node — can be actor or legislator */
  sourceActorId: integer("source_actor_id").references(() => capitolActors.id),
  sourceStakeholderId: integer("source_stakeholder_id").references(() => stakeholders.id),
  /** Target node — can be actor or legislator */
  targetActorId: integer("target_actor_id").references(() => capitolActors.id),
  targetStakeholderId: integer("target_stakeholder_id").references(() => stakeholders.id),
  connectionType: connectionTypeEnum("connection_type").notNull(),
  /** Strength 0-1 */
  strength: doublePrecision("strength").default(0.5),
  /** Evidence for this connection */
  evidence: text("evidence"),
  /** Financial amount if applicable */
  financialAmount: doublePrecision("financial_amount"),
  /** Time period */
  session: text("session"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  /** Is this connection currently active? */
  active: boolean("active").default(true),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Voting Blocs ───────────────────────────────────────────────────────────

/** Computed groups of legislators who consistently vote together */
export const votingBlocs = pgTable("voting_blocs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  session: text("session").notNull(),
  chamber: text("chamber").notNull(),
  /** How the bloc was detected */
  detectionMethod: text("detection_method").default("co-voting-analysis"),
  /** Cohesion score — how consistently members vote together (0-1) */
  cohesion: doublePrecision("cohesion").default(0),
  /** Number of members */
  memberCount: integer("member_count").default(0),
  /** Key issues this bloc votes together on */
  issueAreas: jsonb("issue_areas").$type<string[]>().default([]),
  /** Which power center this bloc aligns with */
  alignedPowerCenter: text("aligned_power_center"),
  /** How many votes analyzed */
  votesAnalyzed: integer("votes_analyzed").default(0),
  /** Is this bloc cross-party? */
  bipartisan: boolean("bipartisan").default(false),
  /** Narrative description */
  narrative: text("narrative"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Membership in a voting bloc */
export const votingBlocMembers = pgTable("voting_bloc_members", {
  id: serial("id").primaryKey(),
  blocId: integer("bloc_id").notNull().references(() => votingBlocs.id, { onDelete: "cascade" }),
  stakeholderId: integer("stakeholder_id").notNull().references(() => stakeholders.id),
  /** Loyalty score — how often this member votes with the bloc (0-1) */
  loyalty: doublePrecision("loyalty").default(0),
  /** Is this member a leader of the bloc? */
  isLeader: boolean("is_leader").default(false),
  /** Join date approximation */
  joinedSession: text("joined_session"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Legislation Predictions ────────────────────────────────────────────────

/** Predicted legislation — what we think will be filed and by whom */
export const legislationPredictions = pgTable("legislation_predictions", {
  id: serial("id").primaryKey(),
  session: text("session").notNull(),
  /** Predicted topic/title */
  predictedTopic: text("predicted_topic").notNull(),
  /** Predicted bill type */
  predictedBillType: text("predicted_bill_type"), // HB, SB, HJR, SJR
  /** Which chamber is expected to originate */
  predictedChamber: text("predicted_chamber"),
  /** Predicted sponsor(s) */
  predictedSponsors: jsonb("predicted_sponsors").$type<{
    stakeholderId: number;
    name: string;
    confidence: number;
    reasoning: string;
  }[]>().default([]),
  /** Who will prioritize it */
  predictedChampion: jsonb("predicted_champion").$type<{
    powerCenterId?: number;
    name: string;
    chamber: string;
    reasoning: string;
  }>(),
  /** Confidence score 0-1 */
  confidence: doublePrecision("confidence").default(0),
  /** Prediction reasoning */
  reasoning: text("reasoning"),
  /** Evidence sources */
  evidenceSources: jsonb("evidence_sources").$type<{
    type: string; // "voting_history", "donor_pattern", "leadership_priority", "media_signal", "historical_pattern"
    detail: string;
    weight: number;
  }[]>().default([]),
  /** Predicted passage probability */
  passageProbability: doublePrecision("passage_probability"),
  /** Which power center is likely to push/block */
  powerCenterDynamic: jsonb("power_center_dynamic").$type<{
    governor: "support" | "oppose" | "neutral" | "unknown";
    ltGov: "support" | "oppose" | "neutral" | "unknown";
    speaker: "support" | "oppose" | "neutral" | "unknown";
  }>(),
  /** Actual outcome for verification */
  status: predictionStatusEnum("status").default("predicted"),
  actualBillId: text("actual_bill_id"),
  actualSponsor: text("actual_sponsor"),
  /** Meta */
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Leadership Priorities ──────────────────────────────────────────────────

/** Track what the Big Three and elected leadership have signaled as priorities */
export const leadershipPriorities = pgTable("leadership_priorities", {
  id: serial("id").primaryKey(),
  powerCenterId: integer("power_center_id").references(() => powerCenters.id),
  session: text("session").notNull(),
  topic: text("topic").notNull(),
  stance: text("stance").notNull(), // champion, oppose, caution, negotiate
  /** Intensity 1-10 */
  intensity: integer("intensity").default(5),
  /** Evidence: speech, press release, bill filing, committee assignment */
  evidenceType: text("evidence_type"),
  evidenceDetail: text("evidence_detail"),
  evidenceUrl: text("evidence_url"),
  evidenceDate: timestamp("evidence_date"),
  /** Has this been acted on? */
  acted: boolean("acted").default(false),
  /** Status */
  billFiled: boolean("bill_filed").default(false),
  billId: text("bill_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const powerCentersRelations = relations(powerCenters, ({ one }) => ({
  stakeholder: one(stakeholders, {
    fields: [powerCenters.stakeholderId],
    references: [stakeholders.id],
  }),
}));

export const votingBlocsRelations = relations(votingBlocs, ({ many }) => ({
  members: many(votingBlocMembers),
}));

export const votingBlocMembersRelations = relations(votingBlocMembers, ({ one }) => ({
  bloc: one(votingBlocs, {
    fields: [votingBlocMembers.blocId],
    references: [votingBlocs.id],
  }),
  stakeholder: one(stakeholders, {
    fields: [votingBlocMembers.stakeholderId],
    references: [stakeholders.id],
  }),
}));

// ── Zod schemas ────────────────────────────────────────────────────────────

export const insertPowerCenterSchema = createInsertSchema(powerCenters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCapitolActorSchema = createInsertSchema(capitolActors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCapitolConnectionSchema = createInsertSchema(capitolConnections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVotingBlocSchema = createInsertSchema(votingBlocs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVotingBlocMemberSchema = createInsertSchema(votingBlocMembers).omit({ id: true, createdAt: true });
export const insertLegislationPredictionSchema = createInsertSchema(legislationPredictions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadershipPrioritySchema = createInsertSchema(leadershipPriorities).omit({ id: true, createdAt: true, updatedAt: true });

export type PowerCenter = typeof powerCenters.$inferSelect;
export type InsertPowerCenter = z.infer<typeof insertPowerCenterSchema>;
export type CapitolActor = typeof capitolActors.$inferSelect;
export type InsertCapitolActor = z.infer<typeof insertCapitolActorSchema>;
export type CapitolConnection = typeof capitolConnections.$inferSelect;
export type InsertCapitolConnection = z.infer<typeof insertCapitolConnectionSchema>;
export type VotingBloc = typeof votingBlocs.$inferSelect;
export type InsertVotingBloc = z.infer<typeof insertVotingBlocSchema>;
export type VotingBlocMember = typeof votingBlocMembers.$inferSelect;
export type InsertVotingBlocMember = z.infer<typeof insertVotingBlocMemberSchema>;
export type LegislationPrediction = typeof legislationPredictions.$inferSelect;
export type InsertLegislationPrediction = z.infer<typeof insertLegislationPredictionSchema>;
export type LeadershipPriority = typeof leadershipPriorities.$inferSelect;
export type InsertLeadershipPriority = z.infer<typeof insertLeadershipPrioritySchema>;
