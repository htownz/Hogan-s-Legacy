import { Express, Response } from "express";
import { db } from "../db";
import { eq, sql, desc, count } from "drizzle-orm";
import { bills, userBillTracking } from "@shared/schema";

export async function registerTrendingBillsRoutes(app: Express): Promise<void> {
  // Get most watched bills (no authentication required)
  app.get('/api/trending/most-watched', async (_, res: Response) => {
    try {
      // Get bills with the count of users tracking them, ordered by most tracked
      const result = await db
        .select({
          bill: bills,
          trackCount: count(userBillTracking.userId).as('track_count'),
        })
        .from(bills)
        .leftJoin(userBillTracking, eq(bills.id, userBillTracking.billId))
        .groupBy(bills.id)
        .orderBy(desc(sql`track_count`))
        .limit(5);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching most watched bills:', error);
      res.status(500).json({ message: 'Failed to fetch most watched bills' });
    }
  });

  // Get most contentious bills (highest standard deviation in sentiment)
  app.get('/api/trending/most-contentious', async (_, res: Response) => {
    try {
      // This query calculates standard deviation of sentiment scores
      // Higher standard deviation means more divided opinions
      const result = await db.execute(sql`
        SELECT b.*, 
               STDDEV(p.sentiment_score) as contention_score,
               COUNT(p.id) as assessment_count
        FROM ${bills} b
        JOIN personal_impact_assessments p ON b.id = p.bill_id
        GROUP BY b.id
        HAVING COUNT(p.id) >= 3
        ORDER BY contention_score DESC
        LIMIT 5
      `);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching most contentious bills:', error);
      res.status(500).json({ message: 'Failed to fetch most contentious bills' });
    }
  });

  // Get bills with recent activity
  app.get('/api/trending/recent-activity', async (_, res: Response) => {
    try {
      const result = await db
        .select()
        .from(bills)
        .orderBy(desc(bills.lastActionAt))
        .limit(5);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching recent activity bills:', error);
      res.status(500).json({ message: 'Failed to fetch bills with recent activity' });
    }
  });
}