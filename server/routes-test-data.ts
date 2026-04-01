/**
 * Test endpoint to verify authentic Texas legislative data flow
 */

import express from 'express';
import { openStatesAPI } from './services/openstates-api';
import { createLogger } from "./logger";
const log = createLogger("routes-test-data");


const router = express.Router();

// Direct data pull for current Texas state legislators
router.get('/api/legislators', async (req, res) => {
  try {
    log.info('📊 EXECUTING DIRECT DATA PULL: Current Texas State Legislators from OpenStates API...');
    
    if (!openStatesAPI.isConfigured()) {
      log.info('❌ OpenStates API key not configured');
      return res.status(400).json({
        success: false,
        error: 'OpenStates API key not configured'
      });
    }

    log.info('🔄 Calling OpenStates API for authentic Texas legislative data...');
    const legislators = await openStatesAPI.getTexasLegislators();
    
    log.info(`✅ DIRECT PULL SUCCESSFUL: ${legislators.length} current Texas legislators retrieved`);
    log.info(`📋 Sample legislator: ${legislators[0]?.name} (${legislators[0]?.party}, District ${legislators[0]?.district})`);
    log.info(`🏛️ Chambers represented: House, Senate, Governor`);
    
    // Return the authentic Texas legislative data directly
    res.json(legislators);
    
  } catch (error: any) {
    log.error({ err: error.message }, '❌ ERROR in direct Texas legislator data pull');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve current Texas legislators from OpenStates',
      details: error.message
    });
  }
});

export function registerTestDataRoutes(app: express.Application) {
  app.use(router);
  log.info('🔍 Test data routes registered for authentic Texas information');
}