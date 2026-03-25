// @ts-nocheck
import express from 'express';
import { Request, Response } from 'express';
import { texasLegislatorsScraper } from './services/texas-legislators-scraper';
import { storage } from './storage';

const router = express.Router();

/**
 * Texas Legislators Web Scraping API Routes
 * Comprehensive data collection from house.texas.gov and senate.texas.gov
 */

// Scrape all Texas legislators (House + Senate)
router.post('/api/texas-legislators/scrape', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Starting comprehensive Texas legislators data collection...');
    
    // Perform the web scraping for all legislators
    const legislators = await texasLegislatorsScraper.performLegislatorsDataCollection();
    
    res.json({
      success: true,
      message: 'Texas legislators data collection completed successfully',
      data: {
        legislatorsCollected: legislators.length,
        houseMembers: legislators.filter(l => l.chamber === 'House').length,
        senateMembers: legislators.filter(l => l.chamber === 'Senate').length,
        legislators: legislators.map(legislator => ({
          id: legislator.id,
          name: legislator.name,
          party: legislator.party,
          chamber: legislator.chamber,
          district: legislator.district,
          email: legislator.email,
          phone: legislator.phone,
          office: legislator.office,
          committees: legislator.committees?.length || 0,
          counties: legislator.counties?.length || 0
        }))
      },
      collectedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in Texas legislators scraping:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Texas legislators',
      details: error.message,
      suggestion: 'The Texas Legislature websites may have changed structure or be temporarily unavailable'
    });
  }
});

// Scrape only House Representatives
router.post('/api/texas-legislators/scrape-house', async (req: Request, res: Response) => {
  try {
    console.log('🏠 Starting Texas House Representatives data collection...');
    
    const houseMembers = await texasLegislatorsScraper.scrapeHouseRepresentatives();
    
    res.json({
      success: true,
      message: 'Texas House Representatives data collection completed',
      data: {
        representativesCollected: houseMembers.length,
        representatives: houseMembers.map(rep => ({
          id: rep.id,
          name: rep.name,
          party: rep.party,
          district: rep.district,
          email: rep.email,
          phone: rep.phone
        }))
      },
      collectedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error scraping House representatives:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape House representatives',
      details: error.message
    });
  }
});

// Scrape only Senate Members
router.post('/api/texas-legislators/scrape-senate', async (req: Request, res: Response) => {
  try {
    console.log('🏛️ Starting Texas Senate Members data collection...');
    
    const senateMembers = await texasLegislatorsScraper.scrapeSenateMembers();
    
    res.json({
      success: true,
      message: 'Texas Senate Members data collection completed',
      data: {
        senatorsCollected: senateMembers.length,
        senators: senateMembers.map(senator => ({
          id: senator.id,
          name: senator.name,
          party: senator.party,
          district: senator.district,
          email: senator.email,
          phone: senator.phone
        }))
      },
      collectedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error scraping Senate members:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Senate members',
      details: error.message
    });
  }
});

// Get legislators scraping status and statistics
router.get('/api/texas-legislators/status', async (req: Request, res: Response) => {
  try {
    console.log('📊 Checking Texas legislators data status...');
    
    // Get current legislators count from database
    const totalLegislators = await storage.getLegislatorsCount();
    const recentLegislators = await storage.getRecentLegislators(10);
    
    res.json({
      success: true,
      statistics: {
        totalLegislatorsInDatabase: totalLegislators,
        recentLegislatorsCount: recentLegislators.length,
        lastScrapingTime: recentLegislators.length > 0 ? recentLegislators[0].lastUpdated : null,
        expectedCounts: {
          houseRepresentatives: 150,
          senateMembers: 31,
          total: 181
        }
      },
      scrapingService: {
        status: 'Ready',
        targetSites: ['house.texas.gov', 'senate.texas.gov'],
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error checking legislators status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to check legislators status',
      details: error.message
    });
  }
});

// Get detailed legislator profile by ID
router.get('/api/texas-legislators/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`👤 Fetching detailed profile for legislator ${id}...`);
    
    const legislator = await storage.getLegislatorById(id);
    
    if (!legislator) {
      return res.status(404).json({
        success: false,
        error: 'Legislator not found',
        legislatorId: id
      });
    }
    
    res.json({
      success: true,
      legislator,
      source: 'Scraped from official Texas Legislature websites',
      lastUpdated: legislator.lastUpdated
    });

  } catch (error: any) {
    console.error(`❌ Error fetching legislator ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch legislator',
      details: error.message
    });
  }
});

// Search legislators by various criteria
router.get('/api/texas-legislators/search', async (req: Request, res: Response) => {
  try {
    const { name, party, chamber, district, county } = req.query;
    
    console.log('🔍 Searching Texas legislators with criteria:', { name, party, chamber, district, county });
    
    const searchResults = await storage.searchLegislators({
      name: name as string,
      party: party as string,
      chamber: chamber as string,
      district: district as string,
      county: county as string
    });
    
    res.json({
      success: true,
      results: searchResults,
      count: searchResults.length,
      searchCriteria: { name, party, chamber, district, county },
      searchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error searching legislators:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search legislators',
      details: error.message
    });
  }
});

export function registerTexasLegislatorsScraperRoutes(app: express.Application) {
  app.use(router);
  console.log('👥 Texas Legislators scraper routes registered successfully!');
}