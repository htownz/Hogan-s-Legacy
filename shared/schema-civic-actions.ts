import { pgTable, serial, text, timestamp, integer, boolean, index, uniqueIndex, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { bills, users } from './schema';

/**
 * Available civic action types that users can take
 */
export const civicActionTypes = pgTable("civic_action_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  category: text("category").notNull(), // e.g., "advocacy", "education", "participation"
  impact_level: integer("impact_level").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCivicActionTypeSchema = createInsertSchema(civicActionTypes).omit({
  id: true,
  createdAt: true,
});

export type CivicActionType = typeof civicActionTypes.$inferSelect;
export type InsertCivicActionType = z.infer<typeof insertCivicActionTypeSchema>;

/**
 * User-initiated civic actions
 */
export const civicActions = pgTable("civic_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  actionTypeId: integer("action_type_id").references(() => civicActionTypes.id).notNull(),
  billId: text("bill_id"),
  description: text("description"),
  targetDate: timestamp("target_date"),
  completed: boolean("completed").default(false).notNull(),
  completionDate: timestamp("completion_date"),
  result: text("result"), // E.g., "email sent", "call connected", "petition signed"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCivicActionSchema = createInsertSchema(civicActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CivicAction = typeof civicActions.$inferSelect;
export type InsertCivicAction = z.infer<typeof insertCivicActionSchema>;

/**
 * Quick action shortcuts that can be placed on various pages
 */
export const quickActionShortcuts = pgTable("quick_action_shortcuts", {
  id: serial("id").primaryKey(),
  actionTypeId: integer("action_type_id").references(() => civicActionTypes.id).notNull(),
  priority: integer("priority").default(0), // Renamed from position to priority based on DB column
  createdAt: timestamp("created_at").defaultNow(),
  icon: text("icon"), // Custom icon
  buttonColor: text("button_color"), // Renamed from theme to button_color based on DB column
  location: text("location"), // E.g., "bill_detail", "dashboard", "legislation_list"
  displayText: text("display_text"), // Renamed from displayName to display_text based on DB column
}, (table) => {
  return {
    locationIdx: index("location_idx").on(table.location),
    actionTypeIdx: index("action_type_idx").on(table.actionTypeId),
  };
});

export const insertQuickActionShortcutSchema = createInsertSchema(quickActionShortcuts).omit({
  id: true,
  createdAt: true,
});

export type QuickActionShortcut = typeof quickActionShortcuts.$inferSelect;
export type InsertQuickActionShortcut = z.infer<typeof insertQuickActionShortcutSchema>;

/**
 * Tracks user interactions with quick action shortcuts
 */
export const quickActionInteractions = pgTable("quick_action_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  shortcutId: integer("shortcut_id").references(() => quickActionShortcuts.id).notNull(),
  interactionType: text("interaction_type").notNull(), // "click", "view", "complete", "dismiss"
  context: text("context").notNull(), // Additional context about where the interaction occurred
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userShortcutIdx: uniqueIndex("user_shortcut_idx").on(
      table.userId, 
      table.shortcutId, 
      table.interactionType
    ),
  };
});

export const insertQuickActionInteractionSchema = createInsertSchema(quickActionInteractions).omit({
  id: true,
  createdAt: true,
});

export type QuickActionInteraction = typeof quickActionInteractions.$inferSelect;
export type InsertQuickActionInteraction = z.infer<typeof insertQuickActionInteractionSchema>;