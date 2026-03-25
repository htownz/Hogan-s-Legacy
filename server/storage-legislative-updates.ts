import { count, eq, and, desc, asc, sql, ilike, or, between, isNotNull, isNull } from "drizzle-orm";
import { db } from "./db";
import { 
  rssLegislativeUpdates, 
  type LegislativeUpdate, 
  type InsertLegislativeUpdate,
  type LegislativeUpdateQuery
} from "@shared/schema-legislative-updates";

// Interface for legislative updates storage
export interface ILegislativeUpdatesStorage {
  // Query operations
  getLegislativeUpdates(query: LegislativeUpdateQuery): Promise<{
    data: LegislativeUpdate[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    filterOptions: {
      categories: string[];
    };
  }>;
  
  getLegislativeUpdateById(id: string): Promise<LegislativeUpdate | undefined>;
  
  getStats(): Promise<{
    unreadCount: number;
    categoryStats: {
      category: string;
      count: number;
      unreadCount: number;
    }[];
    billStats: {
      billId: string;
      count: number;
    }[];
  }>;
  
  // Mutation operations
  createLegislativeUpdate(update: InsertLegislativeUpdate): Promise<LegislativeUpdate>;
  markAsRead(id: string): Promise<boolean>;
  markAllAsRead(category?: string): Promise<number>;
}

// Implementation using PostgreSQL
export class DatabaseLegislativeUpdatesStorage implements ILegislativeUpdatesStorage {
  async getLegislativeUpdates(query: LegislativeUpdateQuery) {
    const { 
      page = 1, 
      limit = 20, 
      q, 
      category, 
      billId, 
      unreadOnly,
      startDate,
      endDate,
      sortBy = "publicationDate",
      sortOrder = "desc"
    } = query;
    
    // Build where conditions
    let whereConditions = [];
    
    if (q) {
      whereConditions.push(
        or(
          ilike(rssLegislativeUpdates.title, `%${q}%`),
          ilike(rssLegislativeUpdates.description, `%${q}%`),
          ilike(rssLegislativeUpdates.billId || '', `%${q}%`)
        )
      );
    }
    
    if (category) {
      whereConditions.push(eq(rssLegislativeUpdates.category, category));
    }
    
    if (billId) {
      whereConditions.push(eq(rssLegislativeUpdates.billId || '', billId));
    }
    
    if (unreadOnly) {
      whereConditions.push(eq(rssLegislativeUpdates.isRead, false));
    }
    
    if (startDate && endDate) {
      whereConditions.push(
        between(rssLegislativeUpdates.publicationDate, startDate, endDate)
      );
    } else if (startDate) {
      whereConditions.push(sql`${rssLegislativeUpdates.publicationDate} >= ${startDate}`);
    } else if (endDate) {
      whereConditions.push(sql`${rssLegislativeUpdates.publicationDate} <= ${endDate}`);
    }
    
    // Create combined where condition
    const whereCondition = whereConditions.length > 0
      ? and(...whereConditions)
      : undefined;
    
    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(rssLegislativeUpdates).$dynamic()
      .where(whereCondition || sql`1=1`);
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    
    // Build order by
    const orderByColumn = (() => {
      switch (sortBy) {
        case "publicationDate":
          return rssLegislativeUpdates.publicationDate;
        case "title":
          return rssLegislativeUpdates.title;
        case "category":
          return rssLegislativeUpdates.category;
        default:
          return rssLegislativeUpdates.publicationDate;
      }
    })();
    
    const orderByFn = sortOrder === 'asc' ? asc : desc;
    
    // Get data with pagination
    const data = await db
      .select()
      .from(rssLegislativeUpdates).$dynamic()
      .where(whereCondition || sql`1=1`)
      .orderBy(orderByFn(orderByColumn))
      .limit(limit)
      .offset(offset);
    
    // Get categories for filter options
    const categories = await db
      .select({ category: rssLegislativeUpdates.category })
      .from(rssLegislativeUpdates)
      .groupBy(rssLegislativeUpdates.category);
    
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      filterOptions: {
        categories: categories.map(c => c.category),
      },
    };
  }
  
  async getLegislativeUpdateById(id: string) {
    const [update] = await db
      .select()
      .from(rssLegislativeUpdates).$dynamic()
      .where(eq(rssLegislativeUpdates.id, id));
      
    return update;
  }
  
  async getStats() {
    // Get unread count
    const [{ value: unreadCount }] = await db
      .select({ value: count() })
      .from(rssLegislativeUpdates).$dynamic()
      .where(eq(rssLegislativeUpdates.isRead, false));
    
    // Get category stats - use conditional count for unread items
    const categoryStats = await db
      .select({
        category: rssLegislativeUpdates.category,
        count: count(),
        unreadCount: sql`SUM(CASE WHEN ${rssLegislativeUpdates.isRead} = false THEN 1 ELSE 0 END)`,
      })
      .from(rssLegislativeUpdates)
      .groupBy(rssLegislativeUpdates.category);
    
    // Get bill stats (only for bills with IDs)
    const billStats = await db
      .select({
        billId: rssLegislativeUpdates.billId,
        count: count(),
      })
      .from(rssLegislativeUpdates).$dynamic()
      .where(isNotNull(rssLegislativeUpdates.billId))
      .groupBy(rssLegislativeUpdates.billId);
      
    return {
      unreadCount,
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        count: Number(stat.count) || 0,
        unreadCount: Number(stat.unreadCount) || 0
      })),
      billStats: billStats.map(stats => ({
        billId: stats.billId || '',
        count: Number(stats.count) || 0,
      })),
    };
  }
  
  async createLegislativeUpdate(update: InsertLegislativeUpdate) {
    const [newUpdate] = await db
      .insert(rssLegislativeUpdates)
      .values({
        ...update,
        createdAt: new Date(),
      })
      .returning();
      
    return newUpdate;
  }
  
  async markAsRead(id: string) {
    const [updatedUpdate] = await db
      .update(rssLegislativeUpdates)
      .set({ isRead: true })
      .where(eq(rssLegislativeUpdates.id, id))
      .returning();
      
    return !!updatedUpdate;
  }
  
  async markAllAsRead(category?: string) {
    const whereCondition = category
      ? eq(rssLegislativeUpdates.category, category)
      : eq(rssLegislativeUpdates.isRead, false);
      
    const result = await db
      .update(rssLegislativeUpdates)
      .set({ isRead: true })
      .where(whereCondition);
      
    return result.rowCount || 0;
  }
}

// Export storage instance
export const legislativeUpdatesStorage = new DatabaseLegislativeUpdatesStorage();