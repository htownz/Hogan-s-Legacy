import { Express, Request, Response } from 'express';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { db } from './db';
import { committeeMeetings, committees } from '@shared/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import historicalVideoScraper from './services/historical-committee-video-scraper';
import { createLogger } from "./logger";
const log = createLogger("routes-historical-committee-videos");


/**
 * Register historical committee video API routes
 */
export function registerHistoricalCommitteeVideoRoutes(app: Express): void {
  /**
   * Initialize the historical committee video scraper
   * (Admin-only endpoint)
   */
  app.post('/api/historical-committee-videos/init', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // In a production app, we would check for admin role here
      await historicalVideoScraper.initHistoricalCommitteeVideoScraper();
      
      return res.json({
        success: true,
        message: 'Historical committee video scraper initialized'
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error initializing historical committee video scraper');
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize historical committee video scraper',
        message: error.message
      });
    }
  });

  /**
   * Start scraping House 89th Regular Session committee videos
   * (Admin-only endpoint)
   */
  app.post('/api/historical-committee-videos/house/89r', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Start the scraping process asynchronously
      // In a production app, this would be handled by a queue or a background job
      const scrapePromise = historicalVideoScraper.scrapeHouse89RegularSessionVideos()
        .then(() => {
          log.info('Successfully scraped House 89th Regular Session committee videos');
        })
        .catch((error) => {
          log.error({ err: error }, 'Error scraping House 89th Regular Session committee videos');
        });
      
      // Return immediate response to the client
      return res.status(202).json({
        success: true,
        message: 'Started scraping House 89th Regular Session committee videos'
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error starting House 89th Regular Session scraper');
      return res.status(500).json({
        success: false,
        error: 'Failed to start House 89th Regular Session scraper',
        message: error.message
      });
    }
  });

  /**
   * Start scraping Senate 89th Regular Session committee videos
   * (Admin-only endpoint)
   */
  app.post('/api/historical-committee-videos/senate/89r', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // Start the scraping process asynchronously
      // In a production app, this would be handled by a queue or a background job
      const scrapePromise = historicalVideoScraper.scrapeSenate89RegularSessionVideos()
        .then(() => {
          log.info('Successfully scraped Senate 89th Regular Session committee videos');
        })
        .catch((error) => {
          log.error({ err: error }, 'Error scraping Senate 89th Regular Session committee videos');
        });
      
      // Return immediate response to the client
      return res.status(202).json({
        success: true,
        message: 'Started scraping Senate 89th Regular Session committee videos'
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error starting Senate 89th Regular Session scraper');
      return res.status(500).json({
        success: false,
        error: 'Failed to start Senate 89th Regular Session scraper',
        message: error.message
      });
    }
  });

  /**
   * Schedule AI analysis for historical meetings
   * (Admin-only endpoint)
   */
  app.post('/api/historical-committee-videos/analyze', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { limit = 5 } = req.body;
      
      // Validate limit
      if (isNaN(parseInt(limit)) || parseInt(limit) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit. Must be a positive integer.'
        });
      }
      
      // Start the analysis process asynchronously
      // In a production app, this would be handled by a queue or a background job
      const analysisPromise = historicalVideoScraper.scheduleHistoricalMeetingAnalysis(parseInt(limit))
        .then(() => {
          log.info(`Successfully scheduled analysis for up to ${limit} historical meetings`);
        })
        .catch((error) => {
          log.error({ err: error }, 'Error scheduling historical meeting analysis');
        });
      
      // Return immediate response to the client
      return res.status(202).json({
        success: true,
        message: `Scheduled analysis for up to ${limit} historical meetings`
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error scheduling historical meeting analysis');
      return res.status(500).json({
        success: false,
        error: 'Failed to schedule historical meeting analysis',
        message: error.message
      });
    }
  });

  /**
   * Get historical committee meetings by legislative session
   */
  app.get('/api/historical-committee-videos/session/:session', async (req: Request, res: Response) => {
    try {
      const { session } = req.params;
      const { committee, chamber } = req.query;
      
      // Validate session
      if (!session.match(/^\d{2}[RS]\d*$/)) { // Format: 89R, 89S1, etc.
        return res.status(400).json({
          success: false,
          error: 'Invalid session format. Expected format: 89R, 89S1, etc.'
        });
      }
      
      // Define filters array
      const filters = [
        eq(committeeMeetings.status, 'completed'),
        like(committeeMeetings.agenda, `%${session}%`)
      ];
      
      // Add committee filter if provided
      if (committee) {
        filters.push(like(committees.name, `%${committee as string}%`));
      }
      
      // Add chamber filter if provided
      if (chamber) {
        filters.push(eq(committees.chamber, chamber as string));
      }
      
      // Build the final query
      const meetings = await db.select({
        id: committeeMeetings.id,
        committeeId: committeeMeetings.committeeId,
        committeeName: committees.name,
        chamber: committees.chamber,
        date: committeeMeetings.date,
        location: committeeMeetings.location,
        agenda: committeeMeetings.agenda,
        videoUrl: committeeMeetings.videoUrl,
        processingStatus: committeeMeetings.processingStatus,
      })
      .from(committeeMeetings)
      .innerJoin(committees, eq(committeeMeetings.committeeId, committees.id))
      .where(and(...filters))
      .orderBy(desc(committeeMeetings.date));
      
      return res.json({
        success: true,
        data: meetings
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching historical committee meetings');
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch historical committee meetings',
        message: error.message
      });
    }
  });

  /**
   * Get video statistics by legislative session
   */
  app.get('/api/historical-committee-videos/stats/:session', async (req: Request, res: Response) => {
    try {
      const { session } = req.params;
      
      // Validate session
      if (!session.match(/^\d{2}[RS]\d*$/)) { // Format: 89R, 89S1, etc.
        return res.status(400).json({
          success: false,
          error: 'Invalid session format. Expected format: 89R, 89S1, etc.'
        });
      }
      
      // Get committee counts
      const houseCounts = await db.select({ count: sql`count(*)` })
        .from(committeeMeetings)
        .innerJoin(committees, eq(committeeMeetings.committeeId, committees.id))
        .where(
          and(
            eq(committees.chamber, 'house'),
            like(committeeMeetings.agenda, `%${session}%`)
          )
        );
      
      const senateCounts = await db.select({ count: sql`count(*)` })
        .from(committeeMeetings)
        .innerJoin(committees, eq(committeeMeetings.committeeId, committees.id))
        .where(
          and(
            eq(committees.chamber, 'senate'),
            like(committeeMeetings.agenda, `%${session}%`)
          )
        );
      
      // Get processing status counts
      const processingStatusCounts = await db.select({
          status: committeeMeetings.processingStatus,
          count: sql`count(*)`
        })
        .from(committeeMeetings)
        .innerJoin(committees, eq(committeeMeetings.committeeId, committees.id))
        .where(like(committeeMeetings.agenda, `%${session}%`))
        .groupBy(committeeMeetings.processingStatus);
      
      return res.json({
        success: true,
        data: {
          houseCommitteeMeetings: parseInt(houseCounts[0]?.count?.toString() || '0'),
          senateCommitteeMeetings: parseInt(senateCounts[0]?.count?.toString() || '0'),
          totalMeetings: parseInt(houseCounts[0]?.count?.toString() || '0') + parseInt(senateCounts[0]?.count?.toString() || '0'),
          processingStatus: processingStatusCounts.reduce((acc, curr) => {
            const countValue = typeof curr.count === 'number' ? curr.count : parseInt(String(curr.count) || '0');
            acc[curr.status || 'unknown'] = countValue;
            return acc;
          }, {} as Record<string, number>)
        }
      });
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching historical committee video stats');
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch historical committee video stats',
        message: error.message
      });
    }
  });
}