import express from 'express';
import { Request, Response } from 'express';
import { comprehensiveTexasScraper } from './services/comprehensive-texas-scraper';
import { createLogger } from "./logger";
const log = createLogger("routes-comprehensive-texas-scraper");


const router = express.Router();

/**
 * Comprehensive Texas Legislature Scraper Routes
 * Zero-cost alternative to expensive APIs with authentic Texas data
 */

// Start comprehensive data collection
router.post('/api/texas-scraper/collect-all', async (req: Request, res: Response) => {
  try {
    log.info('🚀 Starting comprehensive Texas Legislature data collection...');
    
    const result = await comprehensiveTexasScraper.performComprehensiveCollection();
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Comprehensive Texas legislative data collection completed successfully'
        : 'Collection completed with some errors',
      data: {
        billsCollected: result.billsCollected,
        legislatorsCollected: result.legislatorsCollected,
        committeesCollected: result.committeesCollected,
        eventsCollected: result.eventsCollected,
        // Return preview of collected data
        bills: result.data.bills.slice(0, 5),
        legislators: result.data.legislators.slice(0, 10),
        committees: result.data.committees.slice(0, 5),
        events: result.data.events.slice(0, 5)
      },
      totals: {
        bills: result.billsCollected,
        legislators: result.legislatorsCollected,
        committees: result.committeesCollected,
        events: result.eventsCollected
      },
      errors: result.errors,
      collectedAt: new Date().toISOString(),
      source: 'Texas Legislature Online (capitol.texas.gov)',
      cost: '$0 - Free scraping solution'
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error in comprehensive collection');
    res.status(500).json({
      success: false,
      error: 'Failed to collect comprehensive Texas legislative data',
      details: error.message,
      suggestion: 'Check internet connection and try again'
    });
  }
});

// Get scraper status and capabilities
router.get('/api/texas-scraper/status', async (req: Request, res: Response) => {
  try {
    log.info('📊 Checking comprehensive Texas scraper status...');
    
    res.json({
      success: true,
      service: {
        name: 'Comprehensive Texas Legislature Scraper',
        status: 'Ready',
        source: 'capitol.texas.gov',
        cost: '$0 per month',
        authentication: 'None required'
      },
      capabilities: {
        bills: 'All current session bills with full text, status, and voting records',
        legislators: 'Complete profiles for all 181 House and Senate members',
        committees: 'Committee rosters, leadership, and meeting schedules',
        events: 'Upcoming hearings, committee meetings, and floor sessions',
        realTime: 'On-demand collection with respectful rate limiting'
      },
      dataCollection: {
        billsPerSession: '~8,000+ bills and resolutions',
        legislators: '150 House + 31 Senate members',
        committees: '~200+ House, Senate, and Joint committees',
        events: 'All publicly scheduled legislative events',
        updateFrequency: 'On-demand or scheduled collection'
      },
      advantages: [
        'Zero ongoing costs',
        'Complete control over data format',
        'Texas-specific optimization',
        'No API rate limits or quotas',
        'Authentic data from official source'
      ],
      endpoints: {
        comprehensiveCollection: '/api/texas-scraper/collect-all',
        status: '/api/texas-scraper/status'
      },
      lastChecked: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error checking scraper status');
    res.status(500).json({
      success: false,
      error: 'Failed to check scraper status',
      details: error.message
    });
  }
});

export function registerComprehensiveTexasScraperRoutes(app: express.Application) {
  app.use(router);
  log.info('🏛️ Comprehensive Texas Legislature Scraper routes registered successfully!');
}