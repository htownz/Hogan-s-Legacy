import express from 'express';
import { Request, Response } from 'express';
import { openStatesBillsAPI } from './services/openstates-bills-api';

const router = express.Router();

/**
 * OpenStates Bills & Voting Records API Routes
 * Comprehensive legislative tracking with authentic Texas data
 */

// Collect all Texas bills and voting records
router.post('/api/openstates-bills/collect', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Starting comprehensive Texas bills and voting records collection...');
    
    const result = await openStatesBillsAPI.performBillDataCollection();
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Texas bills and voting records collection completed successfully'
        : 'Bills collection encountered some errors',
      data: {
        billsCollected: result.billsCollected,
        votesCollected: result.votesCollected,
        bills: result.bills.slice(0, 10) // Return first 10 for preview
      },
      totalBills: result.billsCollected,
      totalVotes: result.votesCollected,
      errors: result.errors,
      collectedAt: new Date().toISOString(),
      source: 'OpenStates API v3'
    });

  } catch (error: any) {
    console.error('❌ Error in bills collection:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to collect Texas bills and voting records',
      details: error.message,
      suggestion: 'Check OPENSTATES_API_KEY and internet connection'
    });
  }
});

// Search bills by keyword
router.get('/api/openstates-bills/search', async (req: Request, res: Response) => {
  try {
    const { q: query, page = 1 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query parameter "q" is required'
      });
    }

    console.log(`🔍 Searching Texas bills for: "${query}"`);
    
    const result = await openStatesBillsAPI.searchBills(query, parseInt(page as string));
    
    res.json({
      success: true,
      query,
      data: {
        bills: result.bills,
        pagination: result.pagination
      },
      count: result.bills.length,
      searchedAt: new Date().toISOString(),
      source: 'OpenStates API v3'
    });

  } catch (error: any) {
    console.error('❌ Error searching bills:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search bills',
      details: error.message
    });
  }
});

// Get bills by status (introduced, passed, failed, etc.)
router.get('/api/openstates-bills/status/:status', async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const { page = 1 } = req.query;
    
    const statusArray = status.split(',').map(s => s.trim());
    
    console.log(`📊 Fetching Texas bills by status: ${statusArray.join(', ')}`);
    
    const result = await openStatesBillsAPI.getBillsByStatus(statusArray, parseInt(page as string));
    
    res.json({
      success: true,
      status: statusArray,
      data: {
        bills: result.bills,
        pagination: result.pagination
      },
      count: result.bills.length,
      fetchedAt: new Date().toISOString(),
      source: 'OpenStates API v3'
    });

  } catch (error: any) {
    console.error('❌ Error fetching bills by status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bills by status',
      details: error.message
    });
  }
});

// Get specific bill details
router.get('/api/openstates-bills/:billId', async (req: Request, res: Response) => {
  try {
    const { billId } = req.params;
    
    console.log(`📋 Fetching bill details for: ${billId}`);
    
    const bill = await openStatesBillsAPI.fetchBillDetails(billId);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill not found',
        billId
      });
    }
    
    res.json({
      success: true,
      bill,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Error fetching bill ${req.params.billId}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bill details',
      details: error.message
    });
  }
});

// Get voting records for a specific bill
router.get('/api/openstates-bills/:billId/votes', async (req: Request, res: Response) => {
  try {
    const { billId } = req.params;
    
    console.log(`🗳️ Fetching voting records for bill: ${billId}`);
    
    const votes = await openStatesBillsAPI.fetchBillVotes(billId);
    
    res.json({
      success: true,
      billId,
      votes,
      voteCount: votes.length,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Error fetching votes for bill ${req.params.billId}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bill voting records',
      details: error.message
    });
  }
});

// Get voting records for a specific legislator
router.get('/api/openstates-legislators/:legislatorId/votes', async (req: Request, res: Response) => {
  try {
    const { legislatorId } = req.params;
    const { page = 1 } = req.query;
    
    console.log(`🗳️ Fetching voting records for legislator: ${legislatorId}`);
    
    const result = await openStatesBillsAPI.fetchLegislatorVotes(legislatorId, parseInt(page as string));
    
    res.json({
      success: true,
      legislatorId,
      data: {
        votes: result.votes,
        pagination: result.pagination
      },
      voteCount: result.votes.length,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Error fetching votes for legislator ${req.params.legislatorId}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch legislator voting records',
      details: error.message
    });
  }
});

// Get collection status and API health
router.get('/api/openstates-bills/status', async (req: Request, res: Response) => {
  try {
    console.log('📊 Checking OpenStates bills API status...');
    
    res.json({
      success: true,
      service: {
        name: 'OpenStates Bills & Voting Records API',
        version: 'v3',
        status: 'Ready',
        apiEndpoint: 'https://v3.openstates.org',
        hasApiKey: !!process.env.OPENSTATES_API_KEY
      },
      capabilities: {
        billTracking: 'Full text, status, actions, amendments',
        votingRecords: 'Individual votes, vote counts, motion details',
        searchFeatures: 'Keyword search, status filtering, subject classification',
        realTimeUpdates: 'Latest legislative actions and status changes'
      },
      expectedData: {
        totalBills: '~8,000+ per session',
        totalVotes: '~5,000+ recorded votes',
        updateFrequency: 'Daily'
      },
      lastChecked: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error checking status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to check status',
      details: error.message
    });
  }
});

export function registerOpenStatesBillsRoutes(app: express.Application) {
  app.use(router);
  console.log('📋 OpenStates Bills & Voting Records API routes registered successfully!');
}