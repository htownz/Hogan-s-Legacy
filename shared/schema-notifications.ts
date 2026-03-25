import { pgTable, serial, integer, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Notification Types 
export const notificationTypes = pgTable("notification_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  color: text("color").notNull(),
  defaultPriority: integer("default_priority").notNull().default(3),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertNotificationTypeSchema = createInsertSchema(notificationTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type NotificationType = typeof notificationTypes.$inferSelect;
export type InsertNotificationType = z.infer<typeof insertNotificationTypeSchema>;

// User Notification Preferences
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  notificationTypeId: integer("notification_type_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").notNull().default(3),
  inAppEnabled: boolean("in_app_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(false),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertUserNotificationPreferenceSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type UserNotificationPreference = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreference = z.infer<typeof insertUserNotificationPreferenceSchema>;

// Smart Notifications
export const smartNotifications = pgTable("smart_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  notificationTypeId: integer("notification_type_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: integer("priority").notNull().default(3),
  read: boolean("read").notNull().default(false),
  dismissed: boolean("dismissed").notNull().default(false),
  actionUrl: text("action_url"),
  actionLabel: text("action_label"),
  resourceId: text("resource_id"),
  resourceType: text("resource_type"),
  metadata: jsonb("metadata"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSmartNotificationSchema = createInsertSchema(smartNotifications).omit({
  id: true,
  read: true,
  dismissed: true,
  createdAt: true,
  updatedAt: true
});

export type SmartNotification = typeof smartNotifications.$inferSelect;
export type InsertSmartNotification = z.infer<typeof insertSmartNotificationSchema>;

// Notification Actions
export const notificationActions = pgTable("notification_actions", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // read, dismissed, clicked, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertNotificationActionSchema = createInsertSchema(notificationActions).omit({
  id: true,
  createdAt: true
});

export type NotificationAction = typeof notificationActions.$inferSelect;
export type InsertNotificationAction = z.infer<typeof insertNotificationActionSchema>;