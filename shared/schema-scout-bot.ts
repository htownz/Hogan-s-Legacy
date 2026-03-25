import { relations } from "drizzle-orm";
import {
  boolean,
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

// Define enums for the Scout Bot
export const profileTypeEnum = pgEnum("profile_type", [
  "consultant",
  "influencer",
  "strategist",
  "corporate",
]);

export const profileStatusEnum = pgEnum("profile_status", [
  "pending",
  "approved",
  "rejected",
]);

// Main Scout Bot profile queue table
export const scoutBotProfiles = pgTable("scout_bot_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: profileTypeEnum("type").notNull(),
  summary: text("summary"),
  source_urls: json("source_urls").$type<string[]>().notNull(),
  status: profileStatusEnum("status").default("pending").notNull(),
  submitted_at: timestamp("submitted_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  reviewed_by: uuid("reviewed_by"),
  review_notes: text("review_notes"),
  crawl_status: text("crawl_status").default("pending"),
  auto_categorized: boolean("auto_categorized").default(false),
  confidence_score: integer("confidence_score"),
  source_trigger: text("source_trigger"),
  influence_topics: json("influence_topics").$type<string[]>().default([]),
});

// Track affiliations discovered by the Scout Bot
export const scoutBotAffiliations = pgTable("scout_bot_affiliations", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  organization: text("organization").notNull(),
  role: text("role").notNull(),
  dates: text("dates"),
  verified: boolean("verified").default(false),
  source_url: text("source_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Track media mentions discovered by the Scout Bot
export const scoutBotMediaMentions = pgTable("scout_bot_media_mentions", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: uuid("profile_id")
    .notNull()
    .references(() => scoutBotProfiles.id, { onDelete: "cascade" }),
  headline: text("headline").notNull(),
  source: text("source").notNull(),
  url: text("url").notNull(),
  date: text("date"),
  snippet: text("snippet"),
  sentiment: text("sentiment"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations for easier querying
export const scoutBotProfilesRelations = relations(
  scoutBotProfiles,
  ({ many }) => ({
    affiliations: many(scoutBotAffiliations),
    mediaMentions: many(scoutBotMediaMentions),
  })
);

export const scoutBotAffiliationsRelations = relations(
  scoutBotAffiliations,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotAffiliations.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

export const scoutBotMediaMentionsRelations = relations(
  scoutBotMediaMentions,
  ({ one }) => ({
    profile: one(scoutBotProfiles, {
      fields: [scoutBotMediaMentions.profile_id],
      references: [scoutBotProfiles.id],
    }),
  })
);

// Zod schemas for validation
export const insertScoutBotProfileSchema = createInsertSchema(scoutBotProfiles, {
  source_urls: z.array(z.string().url()),
  influence_topics: z.array(z.string()).optional(),
}).omit({ id: true });

export const insertScoutBotAffiliationSchema = createInsertSchema(scoutBotAffiliations)
  .omit({ id: true });

export const insertScoutBotMediaMentionSchema = createInsertSchema(scoutBotMediaMentions)
  .omit({ id: true });

// Types based on the schemas
export type InsertScoutBotProfile = z.infer<typeof insertScoutBotProfileSchema>;
export type ScoutBotProfile = typeof scoutBotProfiles.$inferSelect;

export type InsertScoutBotAffiliation = z.infer<typeof insertScoutBotAffiliationSchema>;
export type ScoutBotAffiliation = typeof scoutBotAffiliations.$inferSelect;

export type InsertScoutBotMediaMention = z.infer<typeof insertScoutBotMediaMentionSchema>;
export type ScoutBotMediaMention = typeof scoutBotMediaMentions.$inferSelect;