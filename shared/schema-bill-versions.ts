import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { bills } from './schema';

// Bill Versions
export const billVersions = pgTable('bill_versions', {
  id: serial('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id),
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  content: text('content'),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

export const billVersionsRelations = relations(billVersions, ({ one }) => ({
  bill: one(bills, {
    fields: [billVersions.billId],
    references: [bills.id]
  })
}));

export const insertBillVersionSchema = createInsertSchema(billVersions).pick({
  billId: true,
  name: true,
  date: true,
  url: true,
  description: true,
  content: true,
  isPrimary: true
});

// Bill Amendments
export const billAmendments = pgTable('bill_amendments', {
  id: serial('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id),
  author: text('author').notNull(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(), // 'Adopted', 'Rejected', 'Pending'
  content: text('content'),
  url: text('url'),
  voteYes: integer('vote_yes'),
  voteNo: integer('vote_no'),
  votePresent: integer('vote_present'),
  createdAt: timestamp('created_at').defaultNow()
});

export const billAmendmentsRelations = relations(billAmendments, ({ one }) => ({
  bill: one(bills, {
    fields: [billAmendments.billId],
    references: [bills.id]
  })
}));

export const insertBillAmendmentSchema = createInsertSchema(billAmendments).pick({
  billId: true,
  author: true,
  date: true,
  description: true,
  status: true,
  content: true,
  url: true,
  voteYes: true,
  voteNo: true,
  votePresent: true
});

export type BillVersion = typeof billVersions.$inferSelect;
export type InsertBillVersion = z.infer<typeof insertBillVersionSchema>;

export type BillAmendment = typeof billAmendments.$inferSelect;
export type InsertBillAmendment = z.infer<typeof insertBillAmendmentSchema>;