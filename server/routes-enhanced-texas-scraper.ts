import express from 'express';
import { Request, Response } from 'express';
import { enhancedTexasScraper } from './services/enhanced-texas-scraper';

const router = express.Router();

/**
 * Enhanced Texas Legislature Scraper Routes
 * Zero-cost authentic legislative data collection
 */

// Start enhanced legislative data collection
router.post('/api/enhanced-texas-scraper/collect', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Starting enhanced Texas legislative data collection...');
    
    const result = await enhancedTexasScraper.performEnhancedCollection();
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Enhanced Texas legislative data collection completed successfully'
        : 'Collection completed with some errors',
      data: {
        billsCollected: result.billsCollected,
        legislatorsCollected: result.legislatorsCollected,
        bills: result.data.bills,
        legislators: result.data.legislators
      },
      totals: {
        bills: result.billsCollected,
        legislators: result.legislatorsCollected
      },
      errors: result.errors,
      collectedAt: new Date().toISOString(),
      source: 'Texas Legislature Online (capitol.texas.gov)',
      cost: '$0 - Free enhanced scraping solution',
      features: [
        'Authentic Texas legislative data',
        'Zero ongoing costs',
        'Complete data control',
        'Respectful rate limiting',
        'Multiple collection paths'
      ]
    });

  } catch (error: any) {
    console.error('❌ Error in enhanced collection:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to collect enhanced Texas legislative data',
      details: error.message,
      suggestion: 'Check internet connection and try again'
    });
  }
});

// Get enhanced scraper status
router.get('/api/enhanced-texas-scraper/status', async (req: Request, res: Response) => {
  try {
    console.log('📊 Checking enhanced Texas scraper status...');
    
    res.json({
      success: true,
      service: {
        name: 'Enhanced Texas Legislature Scraper',
        status: 'Ready',
        source: 'capitol.texas.gov',
        cost: '$0 per month',
        authentication: 'None required'
      },
      capabilities: {
        bills: 'Current session bills with full text and metadata',
        legislators: 'Complete member profiles with contact information',
        adaptiveNavigation: 'Multiple path discovery for robust data collection',
        respectfulScraping: 'Rate-limited requests to protect state servers',
        errorRecovery: 'Graceful handling of unavailable paths'
      },
      advantages: [
        'Zero ongoing costs vs $800/month APIs',
        'Complete control over data format',
        'Texas-specific optimization',
        'No API rate limits or quotas',
        'Authentic data from official source',
        'Adaptive to website changes'
      ],
      dataExpected: {
        bills: 'Sample of current session bills with full content',
        legislators: 'Active House and Senate members',
        updateMethod: 'On-demand collection'
      },
      endpoints: {
        enhancedCollection: '/api/enhanced-texas-scraper/collect',
        status: '/api/enhanced-texas-scraper/status'
      },
      lastChecked: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error checking enhanced scraper status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to check enhanced scraper status',
      details: error.message
    });
  }
});

export function registerEnhancedTexasScraperRoutes(app: express.Application) {
  app.use(router);
  console.log('🏛️ Enhanced Texas Legislature Scraper routes registered successfully!');
}