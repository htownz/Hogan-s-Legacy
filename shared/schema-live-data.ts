import { pgTable, serial, text, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Data sync status tracking
export const dataSyncStatus = pgTable("data_sync_status", {
  id: serial("id").primaryKey(),
  sourceName: text("source_name").notNull().unique(),
  status: text("status").notNull(), // 'active', 'error', 'inactive'
  lastSync: timestamp("last_sync"),
  errorCount: integer("error_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Campaign finance records from FEC and other sources
export const campaignFinanceRecords = pgTable("campaign_finance_records", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'candidate', 'committee', 'donor'
  entityName: text("entity_name").notNull(),
  entityId: text("entity_id").notNull(),
  amount: decimal("amount"),
  cycle: integer("cycle"),
  state: text("state"),
  party: text("party"),
  committeeType: text("committee_type"),
  source: text("source").notNull(), // 'fec', 'followthemoney', etc.
  createdAt: timestamp("created_at").defaultNow()
});

// Legislative sessions tracking
export const legislativeSessions = pgTable("legislative_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  sessionName: text("session_name").notNull(),
  state: text("state").notNull(),
  year: integer("year"),
  current: boolean("current").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Lobbyist registrations from TEC
export const lobbyistRegistrations = pgTable("lobbyist_registrations", {
  id: serial("id").primaryKey(),
  registrationId: text("registration_id").notNull().unique(),
  lobbyistName: text("lobbyist_name").notNull(),
  clientName: text("client_name"),
  registrationDate: timestamp("registration_date"),
  terminationDate: timestamp("termination_date"),
  subjectMatter: text("subject_matter"),
  compensation: decimal("compensation"),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Mobile performance metrics
export const mobilePerformanceMetrics = pgTable("mobile_performance_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  pageLoadTime: decimal("page_load_time"), // in milliseconds
  interactionDelay: decimal("interaction_delay"), // in milliseconds
  dataUsage: decimal("data_usage"), // in KB
  cacheHitRate: decimal("cache_hit_rate"), // percentage 0-1
  offlineCapability: boolean("offline_capability"),
  createdAt: timestamp("created_at").defaultNow()
});

// Notification queue for mobile push notifications
export const notificationQueue = pgTable("notification_queue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  type: text("type").notNull(), // 'mobile_push', 'email', 'in_app'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string with additional data
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertDataSyncStatus = createInsertSchema(dataSyncStatus);
export const insertCampaignFinanceRecord = createInsertSchema(campaignFinanceRecords);
export const insertLegislativeSession = createInsertSchema(legislativeSessions);
export const insertLobbyistRegistration = createInsertSchema(lobbyistRegistrations);
export const insertMobilePerformanceMetric = createInsertSchema(mobilePerformanceMetrics);
export const insertNotificationQueue = createInsertSchema(notificationQueue);

// Types
export type DataSyncStatus = typeof dataSyncStatus.$inferSelect;
export type CampaignFinanceRecord = typeof campaignFinanceRecords.$inferSelect;
export type LegislativeSession = typeof legislativeSessions.$inferSelect;
export type LobbyistRegistration = typeof lobbyistRegistrations.$inferSelect;
export type MobilePerformanceMetric = typeof mobilePerformanceMetrics.$inferSelect;
export type NotificationQueue = typeof notificationQueue.$inferSelect;

export type InsertDataSyncStatus = z.infer<typeof insertDataSyncStatus>;
export type InsertCampaignFinanceRecord = z.infer<typeof insertCampaignFinanceRecord>;
export type InsertLegislativeSession = z.infer<typeof insertLegislativeSession>;
export type InsertLobbyistRegistration = z.infer<typeof insertLobbyistRegistration>;
export type InsertMobilePerformanceMetric = z.infer<typeof insertMobilePerformanceMetric>;
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueue>;