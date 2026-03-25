import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const civicTermCategoryEnum = pgEnum("civic_term_category", [
  "legislative_process",
  "bill_terminology",
  "government_structure",
  "voting",
  "civic_rights",
  "advocacy",
]);

export type CivicTermCategory = typeof civicTermCategoryEnum.enumValues[number];

export const civicTermDifficultyEnum = pgEnum("civic_term_difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

export type CivicTermDifficulty = typeof civicTermDifficultyEnum.enumValues[number];

export const civicTerms = pgTable("civic_terms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  category: civicTermCategoryEnum("category").notNull(),
  difficulty: civicTermDifficultyEnum("difficulty").notNull(),
  examples: text("examples").array().notNull(),
  relatedTerms: text("related_terms").array().notNull(),
  funFact: text("fun_fact"),
  learnMoreUrl: text("learn_more_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CivicTerm = {
  id: number;
  term: string;
  definition: string;
  category: CivicTermCategory;
  difficulty: CivicTermDifficulty;
  examples: string[];
  relatedTerms: string[];
  funFact: string | null;
  learnMoreUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Table to track where terms appear in the application
export const civicTermAppearances = pgTable("civic_term_appearances", {
  id: serial("id").primaryKey(),
  termId: integer("term_id").notNull().references(() => civicTerms.id),
  pageLocation: text("page_location").notNull(), // e.g., "bill-detail", "dashboard"
  elementId: text("element_id").notNull(), // the HTML element ID where the term appears
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const civicTermRelations = relations(civicTerms, ({ many }) => ({
  civicTermAppearances: many(civicTermAppearances),
}));

export const civicTermAppearanceRelations = relations(civicTermAppearances, ({ one }) => ({
  term: one(civicTerms, {
    fields: [civicTermAppearances.termId],
    references: [civicTerms.id],
  }),
}));

// Schema for inserting a new civic term
export const insertCivicTermSchema = createInsertSchema(civicTerms)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Type for inserting a new civic term
export type InsertCivicTerm = z.infer<typeof insertCivicTermSchema>;

// Schema for inserting a new civic term appearance
export const insertCivicTermAppearanceSchema = createInsertSchema(civicTermAppearances)
  .omit({ id: true, createdAt: true });

// Type for inserting a new civic term appearance
export type InsertCivicTermAppearance = z.infer<typeof insertCivicTermAppearanceSchema>;
