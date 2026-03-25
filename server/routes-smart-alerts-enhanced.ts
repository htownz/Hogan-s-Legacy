import { Router } from 'express';
import { generateSmartAlert, processAlertAction, getUserAlerts, markAlertAsRead } from './services/smart-alerts-enhanced-service';

const router = Router();

/**
 * Generate smart alert for bill change
 * POST /api/smart-alerts/generate
 * Body: { billId: number, changeType: string, changeDetails: any }
 */
router.post('/generate', async (req, res) => {
  try {
    const { billId, changeType, changeDetails } = req.body;

    if (!billId || !changeType) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID and change type are required'
      });
    }

    const result = await generateSmartAlert(billId, changeType, changeDetails || {});
    return res.json(result);
  } catch (error: any) {
    console.error('Error in smart alert generation endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Process alert action (contact rep, share, etc.)
 * POST /api/smart-alerts/:alertId/action
 * Body: { action: string, data?: any }
 */
router.post('/:alertId/action', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { action, data } = req.body;
    const userId = req.user?.id || 1; // Default user for demo

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }

    const result = await processAlertAction(alertId, action, userId, data);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in alert action endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get user's alerts
 * GET /api/smart-alerts/user
 * Query params: unreadOnly, urgency, alertType
 */
router.get('/user', async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Default user for demo
    
    const filters = {
      unreadOnly: req.query.unreadOnly === 'true',
      urgency: req.query.urgency as string,
      alertType: req.query.alertType as string
    };

    const result = await getUserAlerts(userId, filters);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in get user alerts endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Mark alert as read
 * POST /api/smart-alerts/:alertId/read
 */
router.post('/:alertId/read', async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user?.id || 1; // Default user for demo

    const result = await markAlertAsRead(alertId, userId);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in mark alert as read endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Simulate alert for testing (demo purposes)
 * POST /api/smart-alerts/simulate
 * Body: { billId: number, scenario: string }
 */
router.post('/simulate', async (req, res) => {
  try {
    const { billId, scenario } = req.body;

    if (!billId || !scenario) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID and scenario are required'
      });
    }

    // Simulate different alert scenarios
    const scenarios = {
      'committee_vote': {
        changeType: 'committee_action',
        changeDetails: {
          committee: 'House Education Committee',
          action: 'Scheduled for vote',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          outcome: 'pending'
        }
      },
      'passed_house': {
        changeType: 'status_change',
        changeDetails: {
          from: 'In Committee',
          to: 'Passed House',
          voteCount: { yes: 85, no: 45, abstain: 5 },
          nextStep: 'Senate Review'
        }
      },
      'amendment_added': {
        changeType: 'amendment_added',
        changeDetails: {
          amendmentNumber: 'A-127',
          sponsor: 'Rep. Johnson',
          summary: 'Increases funding allocation by 15%',
          impact: 'Strengthens bill provisions'
        }
      },
      'deadline_approaching': {
        changeType: 'deadline_approaching',
        changeDetails: {
          deadline: 'End of Session',
          daysRemaining: 14,
          currentStatus: 'In Senate Committee',
          riskLevel: 'high'
        }
      }
    };

    const scenarioData = scenarios[scenario as keyof typeof scenarios];
    if (!scenarioData) {
      return res.status(400).json({
        success: false,
        error: `Unknown scenario: ${scenario}`
      });
    }

    const result = await generateSmartAlert(billId, scenarioData.changeType, scenarioData.changeDetails);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in simulate alert endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get alert statistics for dashboard
 * GET /api/smart-alerts/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Default user for demo
    
    // This would query real statistics from the database
    const stats = {
      totalAlerts: 0,
      unreadAlerts: 0,
      criticalAlerts: 0,
      alertsByType: {
        status_change: 0,
        committee_action: 0,
        vote_scheduled: 0,
        amendment_added: 0,
        deadline_approaching: 0
      },
      responseRate: 0
    };

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error in alert stats endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export function registerSmartAlertsEnhancedRoutes(app: any) {
  app.use('/api/smart-alerts', router);
  console.log('Enhanced smart alerts routes registered');
}

export default router;