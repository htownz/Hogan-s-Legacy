/**
 * LegiScan API Routes
 * 
 * This file contains the routes for integrating with LegiScan API
 * to provide legislative data for bills, legislators, and more.
 */

import express from 'express';
import { legiscanService } from './services/legiscan-service';
import { apiRateLimiter } from './middleware/api-rate-limiter';
import { createLogger } from "./logger";
const log = createLogger("routes-legiscan");


// Apply rate limiting to all LegiScan routes
const legiscanRateLimiter = apiRateLimiter.getMiddleware('legiscan');

const router = express.Router();

// Get session list
router.get('/api/legiscan/sessions', legiscanRateLimiter, async (req, res) => {
  try {
    const sessions = await legiscanService.getSessionList();
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    log.error({ err: error }, 'Error fetching session list');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch session list',
      details: error.message 
    });
  }
});

// Get master list of bills for a session
router.get('/api/legiscan/bills/:sessionId', legiscanRateLimiter, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const bills = await legiscanService.getMasterList(sessionId);
    res.json({ success: true, data: bills });
  } catch (error: any) {
    log.error({ err: error }, 'Error fetching master list');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bills',
      details: error.message 
    });
  }
});

// Get detailed information for a specific bill
router.get('/api/legiscan/bill/:billId', legiscanRateLimiter, async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await legiscanService.getBill(parseInt(billId, 10));
    res.json({ success: true, data: bill });
  } catch (error: any) {
    log.error({ err: error }, 'Error fetching bill details');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bill details',
      details: error.message 
    });
  }
});

// Get legislator details
router.get('/api/legiscan/legislator/:personId', legiscanRateLimiter, async (req, res) => {
  try {
    const { personId } = req.params;
    const person = await legiscanService.getPerson(parseInt(personId, 10));
    res.json({ success: true, data: person });
  } catch (error: any) {
    log.error({ err: error }, 'Error fetching legislator details');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch legislator details',
      details: error.message 
    });
  }
});

// Search for bills
router.get('/api/legiscan/search', legiscanRateLimiter, async (req, res) => {
  try {
    const { query, year } = req.query;
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter is required' 
      });
    }
    
    const searchResults = await legiscanService.searchBills(
      query as string, 
      year ? parseInt(year as string, 10) : undefined
    );
    
    res.json({ success: true, data: searchResults });
  } catch (error: any) {
    log.error({ err: error }, 'Error searching bills');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search bills',
      details: error.message 
    });
  }
});

// Import legislators into our database
router.post('/api/legiscan/import/legislators', legiscanRateLimiter, async (req, res) => {
  try {
    const count = await legiscanService.importLegislators();
    res.json({ 
      success: true, 
      message: `Successfully imported ${count} legislators` 
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error importing legislators');
    res.status(500).json({ 
      success: false, 
      error: 'Failed to import legislators',
      details: error.message 
    });
  }
});

export default router;