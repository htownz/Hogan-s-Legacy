/**
 * Texas Capitol Website Updates API Routes
 * 
 * These routes provide access to live updates from the Texas Legislature's
 * official website (https://capitol.texas.gov/).
 */

import { Express, Request, Response } from "express";
import { isAuthenticated } from "./auth";
import { db } from "./db";
import { 
  capitolUpdates, 
  capitolNotices, 
  committeeSchedules,
  bills
} from "@shared/schema";
import { 
  eq, 
  and, 
  like, 
  or, 
  desc, 
  asc, 
  gte, 
  lte, 
  inArray, 
  sql 
} from "drizzle-orm";
import { z } from "zod";
import { createLogger } from "./logger";
const log = createLogger("routes-capitol-updates");


/**
 * Register Capitol updates API routes
 */
export function registerCapitolUpdatesRoutes(app: Express): void {
  /**
   * Get all Capitol updates, with filtering options
   */
  app.get("/api/capitol/updates", async (req: Request, res: Response) => {
    try {
      const { 
        source,
        billId,
        chamber,
        committee, 
        limit = '20', 
        offset = '0',
        fromDate,
        toDate,
        sort = 'date',
        order = 'desc' 
      } = req.query;
      
      // Build the query with filters
      let query = db.select().from(capitolUpdates).$dynamic();
      
      if (source) {
        query = query.where(eq(capitolUpdates.source, source as string));
      }
      
      if (billId) {
        query = query.where(eq(capitolUpdates.billId, billId as string));
      }
      
      if (chamber) {
        query = query.where(eq(capitolUpdates.chamber, chamber as string));
      }
      
      if (committee) {
        query = query.where(eq(capitolUpdates.committee, committee as string));
      }
      
      if (fromDate) {
        query = query.where(gte(capitolUpdates.publishDate, new Date(fromDate as string)));
      }
      
      if (toDate) {
        query = query.where(lte(capitolUpdates.publishDate, new Date(toDate as string)));
      }
      
      // Apply sorting
      if (sort === 'date') {
        if (order === 'asc') {
          query = query.orderBy(asc(capitolUpdates.publishDate));
        } else {
          query = query.orderBy(desc(capitolUpdates.publishDate));
        }
      } else if (sort === 'title') {
        if (order === 'asc') {
          query = query.orderBy(asc(capitolUpdates.title));
        } else {
          query = query.orderBy(desc(capitolUpdates.title));
        }
      }
      
      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string));
      
      const updates = await query;
      
      // Get the total count for pagination
      const countQuery = db.select({ count: sql`count(*)` }).from(capitolUpdates);
      if (source) {
        countQuery.where(eq(capitolUpdates.source, source as string));
      }
      if (billId) {
        countQuery.where(eq(capitolUpdates.billId, billId as string));
      }
      if (chamber) {
        countQuery.where(eq(capitolUpdates.chamber, chamber as string));
      }
      if (committee) {
        countQuery.where(eq(capitolUpdates.committee, committee as string));
      }
      if (fromDate) {
        countQuery.where(gte(capitolUpdates.publishDate, new Date(fromDate as string)));
      }
      if (toDate) {
        countQuery.where(lte(capitolUpdates.publishDate, new Date(toDate as string)));
      }
      
      const [countResult] = await countQuery;
      const totalCount = Number(countResult?.count || 0);
      
      // If bill IDs are present, fetch bill information
      const updatesWithDetails = await Promise.all(
        updates.map(async (update) => {
          if (update.billId) {
            const bill = await db.query.bills.findFirst({
              where: eq(bills.id, update.billId)
            });
            
            return {
              ...update,
              bill: bill ? {
                id: bill.id,
                title: bill.title,
                description: bill.description
              } : null
            };
          }
          
          return update;
        })
      );
      
      res.json({
        updates: updatesWithDetails,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching Capitol updates");
      res.status(500).json({ message: "Error fetching Capitol updates" });
    }
  });

  /**
   * Get a specific Capitol update by ID
   */
  app.get("/api/capitol/updates/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const update = await db.query.capitolUpdates.findFirst({
        where: eq(capitolUpdates.id, parseInt(id))
      });
      
      if (!update) {
        return res.status(404).json({ message: "Capitol update not found" });
      }
      
      // If there's a bill ID, fetch bill information
      if (update.billId) {
        const bill = await db.query.bills.findFirst({
          where: eq(bills.id, update.billId)
        });
        
        return res.json({
          ...update,
          bill: bill ? {
            id: bill.id,
            title: bill.title,
            description: bill.description
          } : null
        });
      }
      
      res.json(update);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching Capitol update ${req.params.id}`);
      res.status(500).json({ message: "Error fetching Capitol update" });
    }
  });

  /**
   * Get all Capitol notices, with filtering options
   */
  app.get("/api/capitol/notices", async (req: Request, res: Response) => {
    try {
      const { 
        category,
        limit = '20', 
        offset = '0',
        fromDate,
        toDate 
      } = req.query;
      
      // Build the query with filters
      let query = db.select().from(capitolNotices).$dynamic();
      
      if (category) {
        query = query.where(eq(capitolNotices.category, category as string));
      }
      
      if (fromDate) {
        query = query.where(gte(capitolNotices.publishDate, new Date(fromDate as string)));
      }
      
      if (toDate) {
        query = query.where(lte(capitolNotices.publishDate, new Date(toDate as string)));
      }
      
      // Always sort by publish date descending
      query = query.orderBy(desc(capitolNotices.publishDate));
      
      // Apply pagination
      query = query.limit(parseInt(limit as string)).offset(parseInt(offset as string));
      
      const notices = await query;
      
      // Get the total count for pagination
      const countQuery = db.select({ count: sql`count(*)` }).from(capitolNotices);
      if (category) {
        countQuery.where(eq(capitolNotices.category, category as string));
      }
      if (fromDate) {
        countQuery.where(gte(capitolNotices.publishDate, new Date(fromDate as string)));
      }
      if (toDate) {
        countQuery.where(lte(capitolNotices.publishDate, new Date(toDate as string)));
      }
      
      const [countResult] = await countQuery;
      const totalCount = Number(countResult?.count || 0);
      
      res.json({
        notices,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching Capitol notices");
      res.status(500).json({ message: "Error fetching Capitol notices" });
    }
  });

  /**
   * Get a specific Capitol notice by ID
   */
  app.get("/api/capitol/notices/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const notice = await db.query.capitolNotices.findFirst({
        where: eq(capitolNotices.id, parseInt(id))
      });
      
      if (!notice) {
        return res.status(404).json({ message: "Capitol notice not found" });
      }
      
      res.json(notice);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching Capitol notice ${req.params.id}`);
      res.status(500).json({ message: "Error fetching Capitol notice" });
    }
  });

  /**
   * Get committee meeting schedules
   */
  app.get("/api/capitol/committee-schedule", async (req: Request, res: Response) => {
    try {
      const { 
        committee,
        chamber,
        status,
        fromDate,
        toDate,
        limit = '50'
      } = req.query;
      
      // Build the query with filters
      let query = db.select().from(committeeSchedules).$dynamic();
      
      if (committee) {
        query = query.where(eq(committeeSchedules.committee, committee as string));
      }
      
      if (chamber) {
        query = query.where(eq(committeeSchedules.chamber, chamber as string));
      }
      
      if (status) {
        query = query.where(eq(committeeSchedules.status, status as string));
      }
      
      if (fromDate) {
        query = query.where(gte(committeeSchedules.scheduledDate, new Date(fromDate as string)));
      }
      
      if (toDate) {
        query = query.where(lte(committeeSchedules.scheduledDate, new Date(toDate as string)));
      }
      
      // Sort by scheduled date ascending (upcoming first)
      query = query.orderBy(asc(committeeSchedules.scheduledDate));
      
      // Apply limit
      query = query.limit(parseInt(limit as string));
      
      const meetings = await query;
      
      res.json(meetings);
    } catch (error: any) {
      log.error({ err: error }, "Error fetching committee schedules");
      res.status(500).json({ message: "Error fetching committee schedules" });
    }
  });

  /**
   * Get updates for a specific bill
   */
  app.get("/api/capitol/bills/:billId/updates", async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      // Find bill first to confirm it exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId)
      });
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      // Get updates for this bill
      const updates = await db.query.capitolUpdates.findMany({
        where: eq(capitolUpdates.billId, billId),
        orderBy: [desc(capitolUpdates.publishDate)]
      });
      
      res.json(updates);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching Capitol updates for bill ${req.params.billId}`);
      res.status(500).json({ message: "Error fetching Capitol updates for bill" });
    }
  });

  /**
   * Search Capitol updates
   */
  app.get("/api/capitol/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Search updates
      const updates = await db.query.capitolUpdates.findMany({
        where: or(
          like(capitolUpdates.title, `%${query}%`),
          like(capitolUpdates.content, `%${query}%`)
        ),
        orderBy: [desc(capitolUpdates.publishDate)],
        limit: 50
      });
      
      // Search notices
      const notices = await db.query.capitolNotices.findMany({
        where: or(
          like(capitolNotices.title, `%${query}%`),
          like(capitolNotices.content, `%${query}%`)
        ),
        orderBy: [desc(capitolNotices.publishDate)],
        limit: 20
      });
      
      // Return combined results
      res.json({
        updates,
        notices
      });
    } catch (error: any) {
      log.error({ err: error }, `Error searching Capitol updates`);
      res.status(500).json({ message: "Error searching Capitol updates" });
    }
  });

  /**
   * Get statistics about Capitol updates
   */
  app.get("/api/capitol/stats", async (_req: Request, res: Response) => {
    try {
      // Get counts of different update types in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Count updates by source
      const updateCountsBySource = await db.select({
        source: capitolUpdates.source,
        count: sql`count(*)`.mapWith(Number)
      })
      .from(capitolUpdates).$dynamic()
      .where(gte(capitolUpdates.publishDate, thirtyDaysAgo))
      .groupBy(capitolUpdates.source);
      
      // Count notices by category
      const noticeCountsByCategory = await db.select({
        category: capitolNotices.category,
        count: sql`count(*)`.mapWith(Number)
      })
      .from(capitolNotices).$dynamic()
      .where(gte(capitolNotices.publishDate, thirtyDaysAgo))
      .groupBy(capitolNotices.category);
      
      // Count total updates in last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const [dailyUpdateCount] = await db.select({
        count: sql`count(*)`.mapWith(Number)
      })
      .from(capitolUpdates).$dynamic()
      .where(gte(capitolUpdates.publishDate, twentyFourHoursAgo));
      
      // Count upcoming committee meetings
      const now = new Date();
      const [upcomingMeetingsCount] = await db.select({
        count: sql`count(*)`.mapWith(Number)
      })
      .from(committeeSchedules).$dynamic()
      .where(and(
        gte(committeeSchedules.scheduledDate, now),
        eq(committeeSchedules.status, 'scheduled')
      ));
      
      res.json({
        updateCountsBySource,
        noticeCountsByCategory,
        dailyUpdateCount: dailyUpdateCount.count,
        upcomingMeetingsCount: upcomingMeetingsCount.count
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching Capitol stats");
      res.status(500).json({ message: "Error fetching Capitol stats" });
    }
  });
}