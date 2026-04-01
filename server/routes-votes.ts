// @ts-nocheck
/**
 * Vote Visualization and Analysis API Routes
 * 
 * These routes provide access to vote data for bills in the Texas Legislature,
 * allowing for detailed analysis and visualization of voting patterns.
 */

import { Request, Response, Express } from 'express';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { db } from './db';
import { bills, billHistoryEvents } from '@shared/schema';
import { eq, desc, sql, and, like } from 'drizzle-orm';
import { createLogger } from "./logger";
const log = createLogger("routes-votes");


/**
 * Register vote data API routes
 */
export function registerVoteRoutes(app: Express): void {
  /**
   * Get vote data for all bills with filtering options
   */
  app.get('/api/bills/vote-data', async (req: Request, res: Response) => {
    try {
      const chamber = req.query.chamber as string | undefined;
      const billId = req.query.billId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = parseInt(req.query.limit as string || '100');
      const offset = parseInt(req.query.offset as string || '0');
      
      // Build query conditions
      let conditions = [];
      
      if (chamber) {
        conditions.push(eq(billHistoryEvents.chamber, chamber));
      }
      
      if (billId) {
        conditions.push(eq(billHistoryEvents.billId, billId));
      }
      
      if (startDate) {
        conditions.push(sql`${billHistoryEvents.eventDate} >= ${startDate}`);
      }
      
      if (endDate) {
        conditions.push(sql`${billHistoryEvents.eventDate} <= ${endDate}`);
      }
      
      // Get bill history events with vote data
      const query = db.select({
        id: billHistoryEvents.id,
        billId: billHistoryEvents.billId,
        eventDate: billHistoryEvents.eventDate,
        action: billHistoryEvents.action,
        chamber: billHistoryEvents.chamber,
        voteData: billHistoryEvents.voteData,
        createdAt: billHistoryEvents.createdAt,
        billNumber: bills.billNumber,
        billTitle: bills.title
      })
      .from(billHistoryEvents)
      .innerJoin(bills, eq(billHistoryEvents.billId, bills.id))
      .$dynamic()
      .where(and(
        // Only include events with vote data
        sql`${billHistoryEvents.voteData} IS NOT NULL`,
        // Add additional conditions if they exist
        ...conditions
      ))
      .orderBy(desc(billHistoryEvents.eventDate))
      .limit(limit)
      .offset(offset);
      
      // Add search condition if provided
      if (search) {
        const searchPattern = `%${search}%`;
        query.where(
          or(
            like(bills.id, searchPattern),
            like(bills.billNumber, searchPattern),
            like(bills.title, searchPattern),
            like(billHistoryEvents.action, searchPattern)
          )
        );
      }
      
      const results = await query;
      
      // Format the results for the frontend
      const formattedResults = results.map(result => {
        // Extract vote data from the JSON field
        const voteInfo = result.voteData as any || { 
          yes: 0, 
          no: 0, 
          present: 0, 
          absent: 0 
        };
        
        return {
          id: result.id.toString(),
          billId: result.billId,
          billNumber: result.billNumber,
          billTitle: result.billTitle,
          chamberName: result.chamber,
          voteDate: result.eventDate.toISOString(),
          voteType: determineVoteType(result.action),
          voteData: {
            yes: voteInfo.yes || 0,
            no: voteInfo.no || 0,
            present: voteInfo.present || 0,
            absent: voteInfo.absent || 0,
            chamber: result.chamber,
            billId: result.billId,
            date: result.eventDate.toISOString(),
            action: result.action,
            committeeInfo: voteInfo.committeeInfo
          },
          lastUpdated: result.createdAt.toISOString()
        };
      });
      
      res.json(formattedResults);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching vote data');
      res.status(500).json({ error: 'Failed to fetch vote data' });
    }
  });

  /**
   * Get vote data for a specific bill
   */
  app.get('/api/bills/:billId/vote-data', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      
      const billData = await db.select()
        .from(bills).$dynamic()
        .where(eq(bills.id, billId))
        .limit(1);
        
      if (billData.length === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      
      const voteEvents = await db.select()
        .from(billHistoryEvents).$dynamic()
        .where(and(
          eq(billHistoryEvents.billId, billId),
          sql`${billHistoryEvents.voteData} IS NOT NULL`
        ))
        .orderBy(desc(billHistoryEvents.eventDate));
      
      // Format the results for the frontend
      const formattedResults = voteEvents.map(event => {
        // Extract vote data from the JSON field
        const voteInfo = event.voteData as any || { 
          yes: 0, 
          no: 0, 
          present: 0, 
          absent: 0 
        };
        
        return {
          id: event.id.toString(),
          billId: event.billId,
          billNumber: billData[0].billNumber,
          billTitle: billData[0].title,
          chamberName: event.chamber,
          voteDate: event.eventDate.toISOString(),
          voteType: determineVoteType(event.action),
          voteData: {
            yes: voteInfo.yes || 0,
            no: voteInfo.no || 0,
            present: voteInfo.present || 0,
            absent: voteInfo.absent || 0,
            chamber: event.chamber,
            billId: event.billId,
            date: event.eventDate.toISOString(),
            action: event.action,
            committeeInfo: voteInfo.committeeInfo
          },
          lastUpdated: event.createdAt.toISOString()
        };
      });
      
      res.json(formattedResults);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching vote data for bill ${req.params.billId}`);
      res.status(500).json({ error: 'Failed to fetch vote data for this bill' });
    }
  });

  /**
   * Get vote statistics
   */
  app.get('/api/votes/statistics', async (_req: Request, res: Response) => {
    try {
      // Get all vote events
      const voteEvents = await db.select()
        .from(billHistoryEvents).$dynamic()
        .where(sql`${billHistoryEvents.voteData} IS NOT NULL`);
      
      // Initialize statistics
      const stats = {
        totalVotes: voteEvents.length,
        chambers: {
          house: 0,
          senate: 0,
          governor: 0
        },
        outcomes: {
          passed: 0,
          failed: 0,
          tied: 0
        },
        participation: {
          total: 0,
          average: 0
        }
      };
      
      // Calculate statistics
      voteEvents.forEach(event => {
        // Count by chamber
        if (event.chamber) {
          stats.chambers[event.chamber as keyof typeof stats.chambers]++;
        }
        
        // Count outcomes
        const voteInfo = event.voteData as any || { yes: 0, no: 0 };
        if (voteInfo.yes > voteInfo.no) {
          stats.outcomes.passed++;
        } else if (voteInfo.yes < voteInfo.no) {
          stats.outcomes.failed++;
        } else {
          stats.outcomes.tied++;
        }
        
        // Calculate participation
        const total = (voteInfo.yes || 0) + (voteInfo.no || 0) + 
                      (voteInfo.present || 0) + (voteInfo.absent || 0);
        const participation = total > 0 
          ? ((total - (voteInfo.absent || 0)) / total) * 100 
          : 0;
        
        stats.participation.total += participation;
      });
      
      // Calculate average participation
      stats.participation.average = stats.participation.total / 
        (voteEvents.length || 1);
      
      res.json(stats);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching vote statistics');
      res.status(500).json({ error: 'Failed to fetch vote statistics' });
    }
  });

  /**
   * Get vote trends over time
   */
  app.get('/api/votes/trends', async (req: Request, res: Response) => {
    try {
      const timeframe = (req.query.timeframe as string) || 'monthly';
      const chamber = req.query.chamber as string | undefined;
      
      let timeFormat;
      switch (timeframe) {
        case 'daily':
          timeFormat = '%Y-%m-%d';
          break;
        case 'weekly':
          timeFormat = '%Y-%U'; // Year and week number
          break;
        case 'monthly':
        default:
          timeFormat = '%Y-%m';
          break;
      }
      
      // Build query conditions
      let conditions = [sql`${billHistoryEvents.voteData} IS NOT NULL`];
      
      if (chamber) {
        conditions.push(eq(billHistoryEvents.chamber, chamber));
      }
      
      // Get aggregated vote data over time
      const results = await db.execute(sql`
        SELECT 
          TO_CHAR(${billHistoryEvents.eventDate}, ${timeFormat}) as time_period,
          COUNT(*) as vote_count,
          SUM(CASE WHEN (${billHistoryEvents.voteData}->>'yes')::int > (${billHistoryEvents.voteData}->>'no')::int THEN 1 ELSE 0 END) as passed_count,
          SUM(CASE WHEN (${billHistoryEvents.voteData}->>'yes')::int < (${billHistoryEvents.voteData}->>'no')::int THEN 1 ELSE 0 END) as failed_count,
          SUM(CASE WHEN (${billHistoryEvents.voteData}->>'yes')::int = (${billHistoryEvents.voteData}->>'no')::int THEN 1 ELSE 0 END) as tied_count
        FROM ${billHistoryEvents}
        WHERE ${and(...conditions)}
        GROUP BY time_period
        ORDER BY time_period
      `);
      
      res.json(results.rows);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching vote trends');
      res.status(500).json({ error: 'Failed to fetch vote trends' });
    }
  });

  /**
   * Get chamber voting comparison
   */
  app.get('/api/votes/chamber-comparison', async (_req: Request, res: Response) => {
    try {
      // Get aggregated vote data by chamber
      const results = await db.execute(sql`
        SELECT 
          ${billHistoryEvents.chamber} as chamber,
          COUNT(*) as vote_count,
          SUM(CASE WHEN (${billHistoryEvents.voteData}->>'yes')::int > (${billHistoryEvents.voteData}->>'no')::int THEN 1 ELSE 0 END) as passed_count,
          SUM(CASE WHEN (${billHistoryEvents.voteData}->>'yes')::int < (${billHistoryEvents.voteData}->>'no')::int THEN 1 ELSE 0 END) as failed_count,
          SUM(CASE WHEN (${billHistoryEvents.voteData}->>'yes')::int = (${billHistoryEvents.voteData}->>'no')::int THEN 1 ELSE 0 END) as tied_count,
          AVG(((${billHistoryEvents.voteData}->>'yes')::int + (${billHistoryEvents.voteData}->>'no')::int + (${billHistoryEvents.voteData}->>'present')::int) / 
              NULLIF(((${billHistoryEvents.voteData}->>'yes')::int + (${billHistoryEvents.voteData}->>'no')::int + (${billHistoryEvents.voteData}->>'present')::int + (${billHistoryEvents.voteData}->>'absent')::int), 0)) * 100 as avg_participation
        FROM ${billHistoryEvents}
        WHERE ${billHistoryEvents.voteData} IS NOT NULL
        GROUP BY chamber
      `);
      
      res.json(results.rows);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching chamber comparison');
      res.status(500).json({ error: 'Failed to fetch chamber comparison' });
    }
  });
}

/**
 * Determine the type of vote based on the action text
 */
function determineVoteType(action: string): string {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('committee')) {
    return 'committee';
  } else if (actionLower.includes('third reading') || actionLower.includes('3rd reading')) {
    return 'third_reading';
  } else if (actionLower.includes('second reading') || actionLower.includes('2nd reading')) {
    return 'second_reading';
  } else if (actionLower.includes('first reading') || actionLower.includes('1st reading')) {
    return 'first_reading';
  } else if (actionLower.includes('amendment')) {
    return 'amendment';
  } else if (actionLower.includes('passage')) {
    return 'passage';
  } else if (actionLower.includes('conference')) {
    return 'conference';
  } else {
    return 'other';
  }
}

// Drizzle OR function (since we're using multiple conditions)
function or(...conditions: any[]) {
  return sql`(${sql.join(conditions, sql` OR `)})`;
}