import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { bills } from "./schema";

// ---- LEGISLATORS ----
export const legislators = pgTable("legislators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  chamber: text("chamber").notNull(), // house, senate
  district: text("district").notNull(),
  party: text("party").notNull(), // D, R, I
  imageUrl: text("image_url"),
  cartoonAvatarUrl: text("cartoon_avatar_url"),
  electedDate: date("elected_date"),
  biography: text("biography"),
  committees: jsonb("committees").default([]), // Array of committee objects
  donorCategories: jsonb("donor_categories").default([]), // Top donors by category
  topDonors: jsonb("top_donors").default([]), // Top donor organizations/individuals
  contactInfo: jsonb("contact_info").default({}), // Email, phone, office, etc.
  socialMedia: jsonb("social_media").default({}), // Twitter, Facebook, etc.
  ideologyScore: integer("ideology_score"), // Liberal-conservative rating
  voteStats: jsonb("vote_stats").default({}), // Voting statistics
  stances: jsonb("stances").default({}), // Stances on various issues
  bills: jsonb("bills").default([]), // Bills sponsored or co-sponsored
  term: text("term"), // Current term
  termStart: date("term_start"),
  termEnd: date("term_end"),
  aiSummary: text("ai_summary"), // AI-generated profile summary
  gender: text("gender"), // For pronoun usage in summaries
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLegislatorSchema = createInsertSchema(legislators).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Legislator = typeof legislators.$inferSelect;
export type InsertLegislator = z.infer<typeof insertLegislatorSchema>;

// ---- LEGISLATOR VOTES ----
export const legislatorVotes = pgTable("legislator_votes", {
  id: serial("id").primaryKey(),
  legislatorId: integer("legislator_id").notNull().references(() => legislators.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  vote: text("vote").notNull(), // yea, nay, present, absent
  voteDate: timestamp("vote_date").notNull(),
  chamber: text("chamber").notNull(), // house, senate
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLegislatorVoteSchema = createInsertSchema(legislatorVotes).omit({
  id: true,
  createdAt: true,
});

export type LegislatorVote = typeof legislatorVotes.$inferSelect;
export type InsertLegislatorVote = z.infer<typeof insertLegislatorVoteSchema>;

// ---- LEGISLATOR ACCESSORIES ----
export const legislatorAccessories = pgTable("legislator_accessories", {
  id: serial("id").primaryKey(),
  legislatorId: integer("legislator_id").notNull().references(() => legislators.id),
  name: text("name").notNull(),
  svgCode: text("svg_code").notNull(),
  description: text("description"),
  category: text("category").notNull(), // donor, committee, behavior
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLegislatorAccessorySchema = createInsertSchema(legislatorAccessories).omit({
  id: true,
  createdAt: true,
});

export type LegislatorAccessory = typeof legislatorAccessories.$inferSelect;
export type InsertLegislatorAccessory = z.infer<typeof insertLegislatorAccessorySchema>;

// ---- LEGISLATOR RATINGS ----
export const legislatorRatings = pgTable("legislator_ratings", {
  id: serial("id").primaryKey(),
  legislatorId: integer("legislator_id").notNull().references(() => legislators.id),
  organizationName: text("organization_name").notNull(),
  rating: integer("rating").notNull(), // 0-100
  year: integer("year").notNull(),
  category: text("category").notNull(), // e.g., environment, guns, economy
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLegislatorRatingSchema = createInsertSchema(legislatorRatings).omit({
  id: true,
  createdAt: true,
});

export type LegislatorRating = typeof legislatorRatings.$inferSelect;
export type InsertLegislatorRating = z.infer<typeof insertLegislatorRatingSchema>;

// Define the legislator relations
export const legislatorsRelations = relations(legislators, ({ many }) => ({
  votes: many(legislatorVotes),
  accessories: many(legislatorAccessories),
  ratings: many(legislatorRatings)
}));

export const legislatorVotesRelations = relations(legislatorVotes, ({ one }) => ({
  legislator: one(legislators, {
    fields: [legislatorVotes.legislatorId],
    references: [legislators.id],
  }),
}));