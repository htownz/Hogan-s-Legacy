/**
 * Texas Capitol Website Updates Schema
 * 
 * This file defines the database schema for storing live updates from the
 * Texas Legislature's official website (https://capitol.texas.gov/).
 */

import { pgTable, serial, text, timestamp, uniqueIndex, json, varchar, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { bills } from "./schema";

/**
 * Capitol Updates Table
 * Stores updates from various sections of the Texas Capitol website
 */
export const capitolUpdates = pgTable("capitol_updates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 50 }).notNull(), // main_page, bill_action, committee_schedule, notices, amendment, fiscal_note
  publishDate: timestamp("publish_date").notNull().defaultNow(),
  links: json("links").$type<string[]>().default([]),
  billId: varchar("bill_id", { length: 20 }), // Optional reference to a bill
  chamber: varchar("chamber", { length: 10 }), // house, senate, joint
  committee: varchar("committee", { length: 100 }),
  contentHash: varchar("content_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Capitol Notices Table
 * Stores specific notices, bulletins, and announcements from the Capitol website
 */
export const capitolNotices = pgTable("capitol_notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  publishDate: timestamp("publish_date").notNull().defaultNow(),
  links: json("links").$type<string[]>().default([]),
  category: varchar("category", { length: 50 }).notNull().default("general"), // calendar, hearing, amendment, fiscal, vote, emergency, general
  contentHash: varchar("content_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Committee Meeting Schedule Table
 * Stores schedule information for committee meetings
 */
export const committeeSchedules = pgTable("committee_schedules", {
  id: serial("id").primaryKey(),
  committee: varchar("committee", { length: 100 }).notNull(),
  chamber: varchar("chamber", { length: 10 }).notNull(), // house, senate, joint
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 50 }),
  location: varchar("location", { length: 100 }),
  agendaUrl: text("agenda_url"),
  videoUrl: text("video_url"),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled, postponed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Define relationships between tables
 */
export const capitolUpdatesRelations = relations(capitolUpdates, ({ one }) => ({
  bill: one(bills, {
    fields: [capitolUpdates.billId],
    references: [bills.id],
  }),
}));

/**
 * Zod schemas for validation
 */
export const insertCapitolUpdateSchema = createInsertSchema(capitolUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertCapitolNoticeSchema = createInsertSchema(capitolNotices).omit({
  id: true,
  createdAt: true,
});

export const insertCommitteeScheduleSchema = createInsertSchema(committeeSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * TypeScript types
 */
export type InsertCapitolUpdate = z.infer<typeof insertCapitolUpdateSchema>;
export type CapitolUpdate = typeof capitolUpdates.$inferSelect;

export type InsertCapitolNotice = z.infer<typeof insertCapitolNoticeSchema>;
export type CapitolNotice = typeof capitolNotices.$inferSelect;

export type InsertCommitteeSchedule = z.infer<typeof insertCommitteeScheduleSchema>;
export type CommitteeSchedule = typeof committeeSchedules.$inferSelect;