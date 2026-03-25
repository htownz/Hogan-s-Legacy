import express from 'express';
import { Request, Response } from 'express';
import { openStatesLegislatorsAPI } from './services/openstates-legislators-api';

const router = express.Router();

/**
 * OpenStates Texas Legislators API Routes
 * Comprehensive member profiles from OpenStates API
 */

// Collect all Texas legislators from OpenStates API
router.post('/api/openstates-legislators/collect', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Starting OpenStates Texas legislators collection...');
    
    const result = await openStatesLegislatorsAPI.performLegislatorsDataCollection();
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Texas legislators collection completed successfully'
        : 'Texas legislators collection encountered errors',
      data: {
        legislatorsCollected: result.legislatorsCollected,
        houseMembers: result.houseMembers,
        senateMembers: result.senateMembers,
        legislators: result.legislators
      },
      errors: result.errors,
      collectedAt: new Date().toISOString(),
      source: 'OpenStates API'
    });

  } catch (error: any) {
    console.error('❌ Error in OpenStates legislators collection:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to collect Texas legislators from OpenStates',
      details: error.message,
      suggestion: 'Check OPENSTATES_API_KEY environment variable'
    });
  }
});

// Get collection status
router.get('/api/openstates-legislators/status', async (req: Request, res: Response) => {
  try {
    console.log('📊 Checking OpenStates legislators collection status...');
    
    res.json({
      success: true,
      service: {
        name: 'OpenStates Legislators API',
        status: 'Ready',
        apiEndpoint: 'https://v3.openstates.org/people',
        hasApiKey: !!process.env.OPENSTATES_API_KEY
      },
      expectedData: {
        totalLegislators: '~181 (150 House + 31 Senate)',
        dataFields: [
          'Name, Party, Chamber, District',
          'Email, Phone, Office Address',
          'Biography, Photo, Website',
          'Committee Assignments'
        ]
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

// Get specific legislator details
router.get('/api/openstates-legislators/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`👤 Fetching legislator details for ID: ${id}`);
    
    const legislator = await openStatesLegislatorsAPI.fetchLegislatorDetails(id);
    
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
      source: 'OpenStates API',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error(`❌ Error fetching legislator ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch legislator details',
      details: error.message
    });
  }
});

export function registerOpenStatesLegislatorsRoutes(app: express.Application) {
  app.use(router);
  console.log('🏛️ OpenStates Legislators API routes registered successfully!');
}