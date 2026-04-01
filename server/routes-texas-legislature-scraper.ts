// @ts-nocheck
import express from 'express';
import { Request, Response } from 'express';
import { texasLegislatureScraper } from './services/texas-legislature-scraper';
import { storage } from './storage';
import { createLogger } from "./logger";
const log = createLogger("routes-texas-legislature-scraper");


const router = express.Router();

/**
 * Texas Legislature Online Web Scraping API Routes
 * Authentic data collection from capitol.texas.gov
 */

// Perform one-time data collection from Texas Legislature Online
router.post('/api/texas-legislature/scrape', async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.body;
    
    log.info(`🚀 Starting Texas Legislature Online data collection (limit: ${limit})...`);
    
    // Perform the web scraping
    const bills = await texasLegislatureScraper.performOneTimeDataCollection(limit);
    
    res.json({
      success: true,
      message: 'Texas Legislature Online data collection completed successfully',
      data: {
        billsCollected: bills.length,
        bills: bills.map(bill => ({
          id: bill.id,
          title: bill.title,
          chamber: bill.chamber,
          sponsor: bill.sponsor,
          status: bill.status,
          introducedAt: bill.introducedAt,
          lastActionAt: bill.lastActionAt
        }))
      },
      collectedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error in Texas Legislature scraping');
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Texas Legislature Online',
      details: error.message,
      suggestion: 'The Texas Legislature website may have changed structure or be temporarily unavailable'
    });
  }
});

// Get current session information from Texas Legislature Online
router.get('/api/texas-legislature/session-info', async (req: Request, res: Response) => {
  try {
    log.info('📊 Fetching current Texas legislative session information...');
    
    const sessionInfo = await texasLegislatureScraper.getCurrentSessionNumber();
    
    res.json({
      success: true,
      sessionNumber: sessionInfo,
      sessionName: `${sessionInfo}th Texas Legislature`,
      source: 'capitol.texas.gov',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching session info');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session information',
      details: error.message
    });
  }
});

// Scrape specific bill by ID from Texas Legislature Online
router.get('/api/texas-legislature/bill/:billId', async (req: Request, res: Response) => {
  try {
    const { billId } = req.params;
    
    log.info(`🔍 Scraping specific bill ${billId} from TLO...`);
    
    const sessionNumber = await texasLegislatureScraper.getCurrentSessionNumber();
    const bill = await texasLegislatureScraper.scrapeBillDetails(billId, sessionNumber);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found',
        billId,
        message: `Bill ${billId} does not exist in the current Texas legislative session`
      });
    }
    
    res.json({
      success: true,
      bill,
      source: 'capitol.texas.gov',
      scrapedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, `❌ Error scraping bill ${req.params.billId}`);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape bill',
      details: error.message
    });
  }
});

// Get scraping status and statistics
router.get('/api/texas-legislature/status', async (req: Request, res: Response) => {
  try {
    log.info('📈 Checking Texas Legislature scraping status...');
    
    // Get statistics from database
    const totalBills = await storage.getBillCount();
    const recentBills = await storage.getRecentBills(10);
    
    res.json({
      success: true,
      statistics: {
        totalBillsInDatabase: totalBills,
        recentBillsCount: recentBills.length,
        lastScrapingTime: recentBills.length > 0 ? recentBills[0].lastUpdated : null
      },
      scrapingService: {
        status: 'Ready',
        targetSite: 'capitol.texas.gov',
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error checking scraping status');
    res.status(500).json({
      success: false,
      error: 'Failed to check scraping status',
      details: error.message
    });
  }
});

export function registerTexasLegislatureScraperRoutes(app: express.Application) {
  app.use(router);
  log.info('🏛️ Texas Legislature Online scraper routes registered successfully!');
}