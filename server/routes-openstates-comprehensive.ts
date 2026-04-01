import express from 'express';
import { Request, Response } from 'express';
import { openStatesComprehensiveAPI } from './services/openstates-comprehensive-api';
import { createLogger } from "./logger";
const log = createLogger("routes-openstates-comprehensive");


const router = express.Router();

/**
 * OpenStates Comprehensive Legislative Infrastructure Routes
 * Complete coverage: committees, events, people, jurisdictions
 */

// Collect comprehensive legislative infrastructure data
router.post('/api/openstates-comprehensive/collect', async (req: Request, res: Response) => {
  try {
    log.info('🚀 Starting comprehensive Texas legislative infrastructure collection...');
    
    const result = await openStatesComprehensiveAPI.performComprehensiveDataCollection();
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Comprehensive legislative infrastructure collection completed successfully'
        : 'Collection completed with some errors',
      data: {
        committeesCollected: result.committeesCollected,
        eventsCollected: result.eventsCollected,
        jurisdictionCollected: result.jurisdictionData ? 1 : 0,
        committees: result.data.committees.slice(0, 5), // Preview first 5
        events: result.data.events.slice(0, 5), // Preview first 5
        jurisdiction: result.data.jurisdiction
      },
      totals: {
        committees: result.committeesCollected,
        events: result.eventsCollected,
        jurisdiction: result.jurisdictionData ? 1 : 0
      },
      errors: result.errors,
      collectedAt: new Date().toISOString(),
      source: 'OpenStates API v3'
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error in comprehensive collection');
    res.status(500).json({
      success: false,
      error: 'Failed to collect comprehensive legislative infrastructure',
      details: error.message,
      suggestion: 'Check OPENSTATES_API_KEY and internet connection'
    });
  }
});

// Get Texas committees with member details
router.get('/api/openstates-committees', async (req: Request, res: Response) => {
  try {
    const { page = 1, per_page = 25 } = req.query;
    
    log.info(`🏛️ Fetching Texas committees (page ${page})...`);
    
    const result = await openStatesComprehensiveAPI.fetchTexasCommittees(
      parseInt(page as string), 
      parseInt(per_page as string)
    );
    
    res.json({
      success: true,
      data: {
        committees: result.committees,
        pagination: result.pagination
      },
      count: result.committees.length,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching committees');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas committees',
      details: error.message
    });
  }
});

// Get specific committee details with full membership
router.get('/api/openstates-committees/:committeeId', async (req: Request, res: Response) => {
  try {
    const { committeeId } = req.params;
    
    log.info(`🏛️ Fetching committee details for: ${committeeId}`);
    
    const committee = await openStatesComprehensiveAPI.fetchCommitteeDetails(committeeId);
    
    if (!committee) {
      return res.status(404).json({
        success: false,
        error: 'Committee not found',
        committeeId
      });
    }
    
    res.json({
      success: true,
      committee,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, `❌ Error fetching committee ${req.params.committeeId}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch committee details',
      details: error.message
    });
  }
});

// Get upcoming legislative events
router.get('/api/openstates-events/upcoming', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    
    log.info(`📅 Fetching upcoming Texas events (next ${days} days)...`);
    
    const events = await openStatesComprehensiveAPI.fetchUpcomingEvents(parseInt(days as string));
    
    res.json({
      success: true,
      events,
      count: events.length,
      period: `Next ${days} days`,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching upcoming events');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming events',
      details: error.message
    });
  }
});

// Get all legislative events with pagination
router.get('/api/openstates-events', async (req: Request, res: Response) => {
  try {
    const { page = 1, per_page = 25 } = req.query;
    
    log.info(`📅 Fetching Texas events (page ${page})...`);
    
    const result = await openStatesComprehensiveAPI.fetchTexasEvents(
      parseInt(page as string), 
      parseInt(per_page as string)
    );
    
    res.json({
      success: true,
      data: {
        events: result.events,
        pagination: result.pagination
      },
      count: result.events.length,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching events');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas events',
      details: error.message
    });
  }
});

// Get detailed person information
router.get('/api/openstates-people/:personId', async (req: Request, res: Response) => {
  try {
    const { personId } = req.params;
    
    log.info(`👤 Fetching person details for: ${personId}`);
    
    const person = await openStatesComprehensiveAPI.fetchPersonDetails(personId);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found',
        personId
      });
    }
    
    res.json({
      success: true,
      person,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, `❌ Error fetching person ${req.params.personId}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch person details',
      details: error.message
    });
  }
});

// Search people by name or role
router.get('/api/openstates-people/search/:query', async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const { page = 1 } = req.query;
    
    log.info(`🔍 Searching for people: "${query}"`);
    
    const result = await openStatesComprehensiveAPI.searchPeople(query, parseInt(page as string));
    
    res.json({
      success: true,
      query,
      data: {
        people: result.people,
        pagination: result.pagination
      },
      count: result.people.length,
      source: 'OpenStates API v3',
      searchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error searching people');
    res.status(500).json({
      success: false,
      error: 'Failed to search people',
      details: error.message
    });
  }
});

// Get Texas jurisdiction information
router.get('/api/openstates-jurisdiction', async (req: Request, res: Response) => {
  try {
    log.info('🗺️ Fetching Texas jurisdiction information...');
    
    const jurisdiction = await openStatesComprehensiveAPI.fetchTexasJurisdiction();
    
    if (!jurisdiction) {
      return res.status(404).json({
        success: false,
        error: 'Texas jurisdiction not found'
      });
    }
    
    res.json({
      success: true,
      jurisdiction,
      source: 'OpenStates API v3',
      fetchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error fetching jurisdiction');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Texas jurisdiction',
      details: error.message
    });
  }
});

// Get comprehensive API status and capabilities
router.get('/api/openstates-comprehensive/status', async (req: Request, res: Response) => {
  try {
    log.info('📊 Checking comprehensive OpenStates API status...');
    
    res.json({
      success: true,
      service: {
        name: 'OpenStates Comprehensive Legislative API',
        version: 'v3',
        status: 'Ready',
        apiEndpoint: 'https://v3.openstates.org',
        hasApiKey: !!process.env.OPENSTATES_API_KEY
      },
      capabilities: {
        committees: 'All Texas committees with member rosters and leadership roles',
        events: 'Legislative hearings, committee meetings, floor sessions',
        people: 'Detailed legislator profiles with contact info and biography',
        jurisdictions: 'Texas state information with sessions and organizations',
        realTime: 'Live updates for events and committee changes'
      },
      endpoints: {
        committees: '/api/openstates-committees',
        events: '/api/openstates-events',
        upcomingEvents: '/api/openstates-events/upcoming',
        people: '/api/openstates-people/:personId',
        searchPeople: '/api/openstates-people/search/:query',
        jurisdiction: '/api/openstates-jurisdiction',
        comprehensiveCollection: '/api/openstates-comprehensive/collect'
      },
      expectedData: {
        committees: '~200+ committees (House, Senate, Joint)',
        events: '~500+ annual legislative events',
        people: '~181 current legislators + historical records',
        jurisdiction: 'Complete Texas state legislative structure'
      },
      lastChecked: new Date().toISOString()
    });

  } catch (error: any) {
    log.error({ err: error.message }, '❌ Error checking status');
    res.status(500).json({
      success: false,
      error: 'Failed to check status',
      details: error.message
    });
  }
});

export function registerOpenStatesComprehensiveRoutes(app: express.Application) {
  app.use(router);
  log.info('🏛️ OpenStates Comprehensive Legislative Infrastructure routes registered successfully!');
}