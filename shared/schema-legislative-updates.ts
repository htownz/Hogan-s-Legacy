import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table for RSS legislative updates
export const rssLegislativeUpdates = pgTable("rss_legislative_updates", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  link: text("link").notNull(),
  sourceType: text("source_type").notNull().default("rss"),
  sourceName: text("source_name").notNull(),
  category: text("category").notNull(),
  billId: text("bill_id"),
  publicationDate: timestamp("publication_date").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => {
  return {
    categoryIdx: index("rss_updates_category_idx").on(table.category),
    billIdIdx: index("rss_updates_bill_id_idx").on(table.billId),
    pubDateIdx: index("rss_updates_pub_date_idx").on(table.publicationDate),
    isReadIdx: index("rss_updates_is_read_idx").on(table.isRead)
  };
});

// Insert schema for validation
export const insertLegislativeUpdateSchema = createInsertSchema(rssLegislativeUpdates);

// Types
export type LegislativeUpdate = typeof rssLegislativeUpdates.$inferSelect;
export type InsertLegislativeUpdate = z.infer<typeof insertLegislativeUpdateSchema>;

// Query schema for filtering, pagination, and sorting
export const legislativeUpdateQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  q: z.string().optional(),
  category: z.string().optional(),
  billId: z.string().optional(),
  unreadOnly: z.coerce.boolean().optional(),
  startDate: z.string().optional().transform(s => s ? new Date(s) : undefined),
  endDate: z.string().optional().transform(s => s ? new Date(s) : undefined),
  sortBy: z.enum(['publicationDate', 'title', 'category']).optional().default('publicationDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export type LegislativeUpdateQuery = z.infer<typeof legislativeUpdateQuerySchema>;