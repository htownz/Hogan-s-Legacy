import { Router } from 'express';
import { compareBills, getUserComparisons } from './services/bill-comparison-service';

const router = Router();

/**
 * Compare two bills
 * POST /api/bill-comparison/compare
 * Body: { billId1: number, billId2: number }
 */
router.post('/compare', async (req, res) => {
  try {
    const { billId1, billId2 } = req.body;

    if (!billId1 || !billId2 || isNaN(parseInt(billId1)) || isNaN(parseInt(billId2))) {
      return res.status(400).json({
        success: false,
        error: 'Valid bill IDs are required for both bills'
      });
    }

    if (billId1 === billId2) {
      return res.status(400).json({
        success: false,
        error: 'Cannot compare a bill with itself'
      });
    }

    const result = await compareBills(parseInt(billId1), parseInt(billId2));
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error in bill comparison endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get user's saved bill comparisons
 * GET /api/bill-comparison/user
 */
router.get('/user', async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Default user for demo

    const result = await getUserComparisons(userId);
    return res.json(result);
  } catch (error: any) {
    console.error('Error getting user comparisons:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export function registerBillComparisonEnhancedRoutes(app: any) {
  app.use('/api/bill-comparison', router);
  console.log('Enhanced bill comparison routes registered');
}

export default router;