import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users, bills } from "./schema";

// Define the infographics table
export const infographics = pgTable("infographics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  svgContent: text("svg_content").notNull(),
  templateType: text("template_type").notNull(), // bill, voting, civic_action, etc.
  themeColor: text("theme_color").default("#FF6400"), // Default Act Up orange
  dataSource: jsonb("data_source").notNull(), // Stores the data used to create the infographic
  billId: text("bill_id").references(() => bills.id), // Optional reference to a bill
  isPublic: boolean("is_public").default(true),
  shareCount: integer("share_count").default(0),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define the relations for infographics
export const infographicsRelations = relations(infographics, ({ one }) => ({
  user: one(users, {
    fields: [infographics.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [infographics.billId],
    references: [bills.id],
  }),
}));

// Define the infographic shares table
export const infographicShares = pgTable("infographic_shares", {
  id: serial("id").primaryKey(),
  infographicId: integer("infographic_id").notNull().references(() => infographics.id),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // twitter, facebook, email, etc.
  clickCount: integer("click_count").default(0),
  shortUrl: text("short_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define the relations for infographic shares
export const infographicSharesRelations = relations(infographicShares, ({ one }) => ({
  infographic: one(infographics, {
    fields: [infographicShares.infographicId],
    references: [infographics.id],
  }),
  user: one(users, {
    fields: [infographicShares.userId],
    references: [users.id],
  }),
}));

// Define the infographic templates table
export const infographicTemplates = pgTable("infographic_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // bill, voting, civic_action, etc.
  templateSvg: text("template_svg").notNull(), // SVG template with placeholders
  dataSchema: jsonb("data_schema").notNull(), // JSON schema describing required data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define types for TypeScript
export type Infographic = typeof infographics.$inferSelect;
export type InsertInfographic = typeof infographics.$inferInsert;

export type InfographicShare = typeof infographicShares.$inferSelect;
export type InsertInfographicShare = typeof infographicShares.$inferInsert;

export type InfographicTemplate = typeof infographicTemplates.$inferSelect;
export type InsertInfographicTemplate = typeof infographicTemplates.$inferInsert;

// Create Zod schemas for validation
export const insertInfographicSchema = createInsertSchema(infographics).pick({
  userId: true,
  title: true,
  description: true,
  svgContent: true,
  templateType: true,
  themeColor: true,
  dataSource: true,
  billId: true,
  isPublic: true,
});

export const insertInfographicShareSchema = createInsertSchema(infographicShares).pick({
  infographicId: true,
  userId: true,
  platform: true,
  shortUrl: true,
});

export const insertInfographicTemplateSchema = createInsertSchema(infographicTemplates).pick({
  name: true,
  description: true,
  type: true,
  templateSvg: true,
  dataSchema: true,
  isActive: true,
});