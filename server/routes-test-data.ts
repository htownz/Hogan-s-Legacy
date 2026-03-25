/**
 * Test endpoint to verify authentic Texas legislative data flow
 */

import express from 'express';
import { openStatesAPI } from './services/openstates-api';

const router = express.Router();

// Direct data pull for current Texas state legislators
router.get('/api/legislators', async (req, res) => {
  try {
    console.log('📊 EXECUTING DIRECT DATA PULL: Current Texas State Legislators from OpenStates API...');
    
    if (!openStatesAPI.isConfigured()) {
      console.log('❌ OpenStates API key not configured');
      return res.status(400).json({
        success: false,
        error: 'OpenStates API key not configured'
      });
    }

    console.log('🔄 Calling OpenStates API for authentic Texas legislative data...');
    const legislators = await openStatesAPI.getTexasLegislators();
    
    console.log(`✅ DIRECT PULL SUCCESSFUL: ${legislators.length} current Texas legislators retrieved`);
    console.log(`📋 Sample legislator: ${legislators[0]?.name} (${legislators[0]?.party}, District ${legislators[0]?.district})`);
    console.log(`🏛️ Chambers represented: House, Senate, Governor`);
    
    // Return the authentic Texas legislative data directly
    res.json(legislators);
    
  } catch (error: any) {
    console.error('❌ ERROR in direct Texas legislator data pull:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve current Texas legislators from OpenStates',
      details: error.message
    });
  }
});

export function registerTestDataRoutes(app: express.Application) {
  app.use(router);
  console.log('🔍 Test data routes registered for authentic Texas information');
}