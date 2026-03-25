import { Router } from 'express';
import { generateSmartAlert, generateDemoAlerts } from './services/smart-alerts-demo';

const router = Router();

/**
 * Generate a smart alert for bill changes (demo endpoint)
 * POST /api/smart-alerts/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { billId, changeType, previousStatus, newStatus } = req.body;

    if (!billId || !changeType || !previousStatus || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID, change type, previous status, and new status are required'
      });
    }

    const result = await generateSmartAlert(billId, changeType, previousStatus, newStatus);
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating smart alert:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get demo alerts for testing
 * GET /api/smart-alerts/demo
 */
router.get('/demo', async (req, res) => {
  try {
    const alerts = await generateDemoAlerts();
    return res.json({
      success: true,
      data: {
        notifications: alerts,
        total: alerts.length
      }
    });
  } catch (error: any) {
    console.error('Error getting demo alerts:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get user alerts (demo - returns empty for now)
 * GET /api/smart-alerts/user
 */
router.get('/user', async (req, res) => {
  try {
    // For demo purposes, return empty alerts
    return res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    console.error('Error getting user alerts:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export function registerSmartAlertsRoutes(app: any) {
  app.use('/api/smart-alerts', router);
  console.log('Smart Bill Alerts demo routes registered');
}

export default router;