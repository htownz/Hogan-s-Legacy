import { Router } from 'express';
import { 
  createBillAlert,
  getUserBillAlerts,
  deactivateBillAlert,
  generateContextualExplanation,
  checkBillStatusChanges
} from './services/smart-bill-alerts-service';

const router = Router();

/**
 * Create a new bill alert
 * POST /api/alerts/create
 * Body: { billId: number, alertType: string, contextPreferences: object }
 */
router.post('/create', async (req, res) => {
  try {
    const { billId, alertType, contextPreferences } = req.body;
    const userId = req.user?.id || 1; // Default user for demo

    if (!billId || !alertType) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID and alert type are required'
      });
    }

    const validAlertTypes = ['status_change', 'committee_action', 'vote_scheduled', 'amendment_added', 'all'];
    if (!validAlertTypes.includes(alertType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert type'
      });
    }

    const defaultContextPreferences = {
      includeImpactAnalysis: true,
      includePoliticalContext: true,
      includeStakeholderReactions: false,
      notificationMethod: 'push',
      urgencyLevel: 'medium'
    };

    const result = await createBillAlert(
      userId,
      billId,
      alertType,
      contextPreferences || defaultContextPreferences
    );

    return res.json(result);
  } catch (error: any) {
    console.error('Error in create alert endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get user's active bill alerts
 * GET /api/alerts/user
 */
router.get('/user', async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Default user for demo

    const result = await getUserBillAlerts(userId);
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
 * Deactivate a bill alert
 * DELETE /api/alerts/:alertId
 */
router.delete('/:alertId', async (req, res) => {
  try {
    const alertId = parseInt(req.params.alertId, 10);
    const userId = req.user?.id || 1; // Default user for demo

    if (isNaN(alertId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert ID'
      });
    }

    const result = await deactivateBillAlert(alertId, userId);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in deactivate alert endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Generate contextual explanation for a bill change (for testing)
 * POST /api/alerts/explain
 * Body: { billId: number, changeType: string, previousStatus: string, newStatus: string, contextPreferences?: object }
 */
router.post('/explain', async (req, res) => {
  try {
    const { billId, changeType, previousStatus, newStatus, contextPreferences } = req.body;

    if (!billId || !changeType || !previousStatus || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Bill ID, change type, previous status, and new status are required'
      });
    }

    const defaultContextPreferences = {
      includeImpactAnalysis: true,
      includePoliticalContext: true,
      includeStakeholderReactions: false,
      notificationMethod: 'push',
      urgencyLevel: 'medium'
    };

    const result = await generateContextualExplanation(
      billId,
      changeType,
      previousStatus,
      newStatus,
      contextPreferences || defaultContextPreferences
    );

    return res.json(result);
  } catch (error: any) {
    console.error('Error in explain endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Manually trigger bill status check (for testing/admin)
 * POST /api/alerts/check-status
 */
router.post('/check-status', async (req, res) => {
  try {
    const result = await checkBillStatusChanges();
    return res.json(result);
  } catch (error: any) {
    console.error('Error in check status endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get alert notifications for a user
 * GET /api/alerts/notifications
 */
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Default user for demo
    const limit = parseInt(req.query.limit as string) || 10;

    // For now, we'll return recent notifications from the status check
    // In a production system, these would be stored in a notifications table
    const statusCheckResult = await checkBillStatusChanges();
    
    if (statusCheckResult.success) {
      const notifications = statusCheckResult.data.notifications.slice(0, limit);
      return res.json({
        success: true,
        data: {
          notifications,
          total: notifications.length,
          hasMore: false
        }
      });
    } else {
      return res.json({
        success: true,
        data: {
          notifications: [],
          total: 0,
          hasMore: false
        }
      });
    }
  } catch (error: any) {
    console.error('Error in get notifications endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export function registerSmartBillAlertsRoutes(app: any) {
  app.use('/api/alerts', router);
  console.log('Smart Bill Alerts routes registered');
}

export default router;