import { Router } from 'express';
import { generateRealTimeTimeline, getBatchTimelineUpdates, calculateStageProgression, getPriorityEvents } from './services/real-time-timeline-service';
import { createLogger } from "./logger";
const log = createLogger("routes-real-time-timeline");


const router = Router();

/**
 * Generate real-time timeline for a specific bill
 * GET /api/timeline/bill/:billId
 */
router.get('/bill/:billId', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId);
    
    if (isNaN(billId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid bill ID is required'
      });
    }

    const result = await generateRealTimeTimeline(billId);
    return res.json(result);
  } catch (error: any) {
    log.error({ err: error }, 'Error in timeline generation endpoint');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get batch timeline updates for multiple bills
 * POST /api/timeline/batch
 * Body: { billIds: number[] }
 */
router.post('/batch', async (req, res) => {
  try {
    const { billIds } = req.body;
    
    if (!Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of bill IDs is required'
      });
    }

    // Validate all IDs are numbers
    const validBillIds = billIds.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
    
    if (validBillIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one valid bill ID is required'
      });
    }

    const result = await getBatchTimelineUpdates(validBillIds);
    return res.json(result);
  } catch (error: any) {
    log.error({ err: error }, 'Error in batch timeline endpoint');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get stage progression information
 * GET /api/timeline/stage/:stage
 */
router.get('/stage/:stage', async (req, res) => {
  try {
    const stage = req.params.stage;
    const progression = calculateStageProgression(stage);
    
    return res.json({
      success: true,
      data: progression
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error in stage progression endpoint');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get priority events from a timeline
 * POST /api/timeline/priority-events
 * Body: { timeline: RealTimeTimeline }
 */
router.post('/priority-events', async (req, res) => {
  try {
    const { timeline } = req.body;
    
    if (!timeline || !timeline.events) {
      return res.status(400).json({
        success: false,
        error: 'Valid timeline object with events is required'
      });
    }

    const priorityEvents = getPriorityEvents(timeline);
    
    return res.json({
      success: true,
      data: priorityEvents
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error in priority events endpoint');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get timeline updates with live refresh capability
 * GET /api/timeline/live/:billId
 */
router.get('/live/:billId', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId);
    
    if (isNaN(billId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid bill ID is required'
      });
    }

    // Check for real-time updates flag
    const includeRealTime = req.query.realtime === 'true';
    
    const result = await generateRealTimeTimeline(billId);
    
    if (result.success && result.data) {
      // Add real-time metadata
      result.data.lastUpdated = new Date();
      
      if (includeRealTime) {
        // Add live update information
        const response = {
          ...result,
          meta: {
            isLive: true,
            refreshInterval: 300000, // 5 minutes
            lastCheck: new Date(),
            nextUpdate: new Date(Date.now() + 300000)
          }
        };
        return res.json(response);
      }
    }
    
    return res.json(result);
  } catch (error: any) {
    log.error({ err: error }, 'Error in live timeline endpoint');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export function registerRealTimeTimelineRoutes(app: any) {
  app.use('/api/timeline', router);
  log.info('Real-time timeline routes registered');
}

export default router;