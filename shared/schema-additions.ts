// Add these to the schema.ts file
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { users, bills } from './schema';

// Bill movement notifications
export const billMovementNotifications = pgTable("bill_movement_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  billId: text("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBillMovementNotificationSchema = createInsertSchema(billMovementNotifications).pick({
  userId: true,
  billId: true,
  message: true,
  read: true,
  metadata: true,
});

export type BillMovementNotification = typeof billMovementNotifications.$inferSelect;
export type InsertBillMovementNotification = typeof billMovementNotifications.$inferInsert;

export const billMovementNotificationsRelations = relations(billMovementNotifications, ({ one }) => ({
  user: one(users, {
    fields: [billMovementNotifications.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [billMovementNotifications.billId],
    references: [bills.id],
  }),
}));

// Bill history table
export const billHistory = pgTable("bill_history", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  chamber: text("chamber").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBillHistorySchema = createInsertSchema(billHistory).pick({
  billId: true,
  date: true,
  chamber: true,
  description: true,
});

export type BillHistory = typeof billHistory.$inferSelect;
export type InsertBillHistory = typeof billHistory.$inferInsert;

export const billHistoryRelations = relations(billHistory, ({ one }) => ({
  bill: one(bills, {
    fields: [billHistory.billId],
    references: [bills.id],
  }),
}));