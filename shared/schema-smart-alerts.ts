import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { users, bills } from "./schema";

// ---- SMART BILL ALERTS ----
export const smartBillAlerts = pgTable("smart_bill_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  alertType: text("alert_type").notNull(), // 'status_change', 'committee_action', 'vote_scheduled', 'amendment_filed'
  title: text("title").notNull(),
  message: text("message").notNull(),
  contextualExplanation: text("contextual_explanation"),
  aiAnalysis: jsonb("ai_analysis"), // Contains impact assessment, timeline predictions, etc.
  actionButtons: jsonb("action_buttons"), // Array of action button configs
  urgencyLevel: text("urgency_level").notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

export const smartBillAlertsRelations = relations(smartBillAlerts, ({ one }) => ({
  user: one(users, {
    fields: [smartBillAlerts.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [smartBillAlerts.billId],
    references: [bills.id],
  }),
}));

export const insertSmartBillAlertSchema = createInsertSchema(smartBillAlerts).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type SmartBillAlert = typeof smartBillAlerts.$inferSelect;
export type InsertSmartBillAlert = typeof insertSmartBillAlertSchema._type;

// ---- BILL TIMELINE EVENTS ----
export const billTimelineEvents = pgTable("bill_timeline_events", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  eventType: text("event_type").notNull(), // 'introduced', 'committee_assigned', 'hearing_scheduled', 'voted', 'passed', 'signed'
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  stage: text("stage").notNull(), // 'introduction', 'committee', 'floor', 'other_chamber', 'governor'
  isCompleted: boolean("is_completed").default(false),
  isPredicted: boolean("is_predicted").default(false), // AI-predicted future events
  confidence: integer("confidence"), // 0-100 for AI predictions
  metadata: jsonb("metadata"), // Additional event data
  createdAt: timestamp("created_at").defaultNow(),
});

export const billTimelineEventsRelations = relations(billTimelineEvents, ({ one }) => ({
  bill: one(bills, {
    fields: [billTimelineEvents.billId],
    references: [bills.id],
  }),
}));

export const insertBillTimelineEventSchema = createInsertSchema(billTimelineEvents).omit({
  id: true,
  createdAt: true,
});

export type BillTimelineEvent = typeof billTimelineEvents.$inferSelect;
export type InsertBillTimelineEvent = typeof insertBillTimelineEventSchema._type;

// ---- USER ALERT PREFERENCES ----
export const userAlertPreferences = pgTable("user_alert_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  enableSmartAlerts: boolean("enable_smart_alerts").default(true),
  enablePushNotifications: boolean("enable_push_notifications").default(false),
  enableEmailAlerts: boolean("enable_email_alerts").default(true),
  alertFrequency: text("alert_frequency").default('immediate'), // 'immediate', 'daily', 'weekly'
  urgencyFilter: text("urgency_filter").default('medium'), // 'low', 'medium', 'high', 'urgent'
  topicFilters: jsonb("topic_filters"), // Array of topics user wants alerts for
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userAlertPreferencesRelations = relations(userAlertPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userAlertPreferences.userId],
    references: [users.id],
  }),
}));

export const insertUserAlertPreferencesSchema = createInsertSchema(userAlertPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserAlertPreferences = typeof userAlertPreferences.$inferSelect;
export type InsertUserAlertPreferences = typeof insertUserAlertPreferencesSchema._type;