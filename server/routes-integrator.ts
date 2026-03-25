/**
 * API Integrator Routes
 * 
 * These routes provide enhanced legislative data by combining information
 * from multiple sources into a more comprehensive view.
 */

import express from 'express';
import { apiIntegrator } from './services/api-integrator';
import { apiRateLimiter } from './middleware/api-rate-limiter';

// Apply rate limiting to all integrator routes
const integratorRateLimiter = apiRateLimiter.getMiddleware('default');

const router = express.Router();

// Get enhanced bill data with related bills, news, and committee information
router.get('/api/integrator/bill/:billId', integratorRateLimiter, async (req, res) => {
  try {
    const { billId } = req.params;
    
    if (!billId || isNaN(parseInt(billId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Valid bill ID is required'
      });
    }
    
    const enhancedBill = await apiIntegrator.getEnhancedBill(parseInt(billId, 10));
    
    res.json({
      success: true,
      data: enhancedBill
    });
  } catch (error: any) {
    console.error('Error fetching enhanced bill data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced bill data',
      details: error.message
    });
  }
});

// Get enhanced legislator data with sponsored bills and more
router.get('/api/integrator/legislator/:personId', integratorRateLimiter, async (req, res) => {
  try {
    const { personId } = req.params;
    
    if (!personId || isNaN(parseInt(personId, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Valid person ID is required'
      });
    }
    
    const enhancedLegislator = await apiIntegrator.getEnhancedLegislator(parseInt(personId, 10));
    
    res.json({
      success: true,
      data: enhancedLegislator
    });
  } catch (error: any) {
    console.error('Error fetching enhanced legislator data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced legislator data',
      details: error.message
    });
  }
});

export default router;