import { Router } from 'express';
import { mobileOptimizationService } from './services/mobile-optimization-service';
import { createLogger } from "./logger";
const log = createLogger("routes-mobile-optimization");


const router = Router();

// Get critical bill data optimized for mobile
router.get('/api/mobile/critical-bills', async (req, res) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const criticalData = await mobileOptimizationService.getCriticalBillData();
    const optimizedData = await mobileOptimizationService.optimizeDataForMobile(
      { bills: criticalData }, 
      userAgent
    );
    
    res.json(optimizedData);
  } catch (error: any) {
    log.error({ err: error }, 'Mobile critical bills error');
    res.status(500).json({ error: 'Failed to load critical bills' });
  }
});

// Track mobile performance metrics
router.post('/api/mobile/metrics', async (req, res) => {
  try {
    const { pageLoadTime, interactionDelay, dataUsage, cacheHitRate, offlineCapability } = req.body;
    const userId = (req as any).user?.id;
    
    await mobileOptimizationService.trackMobileMetrics({
      pageLoadTime,
      interactionDelay,
      dataUsage,
      cacheHitRate,
      offlineCapability
    }, userId);
    
    res.json({ success: true });
  } catch (error: any) {
    log.error({ err: error }, 'Mobile metrics tracking error');
    res.status(500).json({ error: 'Failed to track metrics' });
  }
});

// Get mobile performance insights
router.get('/api/mobile/performance', async (req, res) => {
  try {
    const insights = await mobileOptimizationService.getMobilePerformanceInsights();
    res.json(insights);
  } catch (error: any) {
    log.error({ err: error }, 'Mobile performance insights error');
    res.status(500).json({ error: 'Failed to get performance insights' });
  }
});

// Get optimized bill for mobile
router.get('/api/mobile/bills/:id', async (req, res) => {
  try {
    const billId = parseInt(req.params.id);
    const optimizedBill = await mobileOptimizationService.optimizeBillForMobile(billId);
    
    if (!optimizedBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(optimizedBill);
  } catch (error: any) {
    log.error({ err: error }, 'Mobile bill optimization error');
    res.status(500).json({ error: 'Failed to optimize bill' });
  }
});

// Get adaptive content based on connection speed
router.post('/api/mobile/adaptive-content', async (req, res) => {
  try {
    const { dataUsage, loadTime } = req.body;
    const connectionSpeed = mobileOptimizationService.estimateConnectionSpeed(dataUsage, loadTime);
    const adaptiveContent = await mobileOptimizationService.getAdaptiveContent(connectionSpeed);
    
    res.json({
      connectionSpeed,
      content: adaptiveContent
    });
  } catch (error: any) {
    log.error({ err: error }, 'Adaptive content error');
    res.status(500).json({ error: 'Failed to get adaptive content' });
  }
});

// Get offline cache manifest
router.get('/api/mobile/cache-manifest', async (req, res) => {
  try {
    const manifest = await mobileOptimizationService.generateOfflineCacheManifest();
    res.json({ resources: manifest });
  } catch (error: any) {
    log.error({ err: error }, 'Cache manifest error');
    res.status(500).json({ error: 'Failed to generate cache manifest' });
  }
});

export function registerMobileOptimizationRoutes(app: any) {
  app.use(router);
  log.info('📱 Mobile optimization routes registered successfully!');
}