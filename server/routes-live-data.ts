import { Router } from 'express';
import { liveDataIntegrationService } from './services/live-data-integration-service';
import { createLogger } from "./logger";
const log = createLogger("routes-live-data");


const router = Router();

// Get status of all data sources
router.get('/sources/status', async (req, res) => {
  try {
    const status = await liveDataIntegrationService.getDataSourcesStatus();
    res.json({
      sources: status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    log.error({ err: error }, 'Data sources status error');
    res.status(500).json({ error: 'Failed to get data sources status' });
  }
});

// Validate API key configuration
router.get('/api-keys/validate', async (req, res) => {
  try {
    const validation = await liveDataIntegrationService.validateApiKeys();
    res.json(validation);
  } catch (error: any) {
    log.error({ err: error }, 'API keys validation error');
    res.status(500).json({ error: 'Failed to validate API keys' });
  }
});

// Sync LegiScan data
router.post('/sync/legiscan', async (req, res) => {
  try {
    const result = await liveDataIntegrationService.syncLegiScanData();
    res.json({
      success: true,
      result,
      message: 'LegiScan data synced successfully'
    });
  } catch (error: any) {
    log.error({ err: error }, 'LegiScan sync error');
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to sync LegiScan data'
    });
  }
});

// Sync FEC campaign finance data
router.post('/sync/fec', async (req, res) => {
  try {
    const result = await liveDataIntegrationService.syncFECData();
    res.json({
      success: true,
      result,
      message: 'FEC campaign finance data synced successfully'
    });
  } catch (error: any) {
    log.error({ err: error }, 'FEC sync error');
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to sync FEC data'
    });
  }
});

// Sync Congress.gov data
router.post('/sync/congress', async (req, res) => {
  try {
    const result = await liveDataIntegrationService.syncCongressData();
    res.json({
      success: true,
      result,
      message: 'Congress.gov data synced successfully'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Congress.gov sync error');
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to sync Congress.gov data'
    });
  }
});

// Sync Texas Legislature Online data
router.post('/sync/texas-legislature', async (req, res) => {
  try {
    const result = await liveDataIntegrationService.syncTexasLegislatureData();
    res.json({
      success: true,
      result,
      message: 'Texas Legislature Online data synced successfully'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Texas Legislature sync error');
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to sync Texas Legislature data'
    });
  }
});

// Sync Texas Ethics Commission data
router.post('/sync/ethics', async (req, res) => {
  try {
    const result = await liveDataIntegrationService.syncTexasEthicsData();
    res.json({
      success: true,
      result,
      message: 'Texas Ethics Commission data synced successfully'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Texas Ethics sync error');
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to sync Texas Ethics data'
    });
  }
});

// Sync all data sources
router.post('/sync/all', async (req, res) => {
  try {
    const results = await liveDataIntegrationService.syncAllSources();
    res.json({
      success: results.failed.length === 0,
      results,
      message: `Synced ${results.successful.length} sources successfully, ${results.failed.length} failed`
    });
  } catch (error: any) {
    log.error({ err: error }, 'All sources sync error');
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Failed to sync data sources'
    });
  }
});

// Get system status
router.get('/status', async (req, res) => {
  try {
    const sources = await liveDataIntegrationService.getDataSourcesStatus();
    const apiValidation = await liveDataIntegrationService.validateApiKeys();
    
    res.json({
      status: 'Live data system ready',
      sources,
      apiKeys: apiValidation,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    log.error({ err: error }, 'Status error');
    res.status(500).json({ 
      status: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export function registerLiveDataRoutes(app: any) {
  app.use('/api/live-data', router);
  log.info('📊 Live data integration routes registered successfully!');
}