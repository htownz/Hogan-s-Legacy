import { Express, Request, Response } from 'express';
import { db } from './db';
import { pointsOfOrder, bills } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from './auth';
import type { CustomRequest } from './types';
import { enhancedBillPOOAnalyzer } from './services/enhanced-bill-poo-analyzer';
import { v4 as uuidv4 } from 'uuid';

/**
 * Register routes for enhanced point of order analysis
 */
export function registerEnhancedPointOfOrderRoutes(app: Express): void {
  // Initialize the enhanced analyzer
  enhancedBillPOOAnalyzer.initialize();
  
  /**
   * Analyze a bill for potential points of order using enhanced detection
   */
  app.post('/api/bills/:billId/enhanced-analysis', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      
      // Check if bill exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      if (!bill) {
        return res.status(404).json({
          success: false,
          error: "Bill not found"
        });
      }
      
      // Run the enhanced analysis
      const analysisResults = await enhancedBillPOOAnalyzer.analyzeBill(billId);
      
      // Store detected points of order in the database
      if (analysisResults.analysis && analysisResults.analysis.length > 0) {
        for (const issue of analysisResults.analysis) {
          // Skip issues with error type
          if (issue.type === 'error') continue;
          
          // Check if a similar point of order already exists
          const existingPOO = await db.query.pointsOfOrder.findFirst({
            where: eq(pointsOfOrder.billId, billId),
            // Add more specific conditions if needed
          });
          
          if (!existingPOO) {
            // Create a new point of order record
            await db.insert(pointsOfOrder).values({
              id: uuidv4(),
              billId,
              type: issue.type,
              description: issue.description,
              ruleReference: issue.ruleReference,
              severity: issue.severity as 'low' | 'medium' | 'high',
              textLocation: issue.textLocation,
              ruleCitation: issue.ruleCitation,
              suggestedFix: issue.suggestedFix,
              precedents: issue.precedents,
              aiDetected: true,
              validationStatus: 'pending',
              detectedBy: 'enhanced-analyzer',
              status: 'pending',
            });
          }
        }
      }
      
      return res.json({
        success: true,
        results: analysisResults
      });
    } catch (error: any) {
      console.error("Error in enhanced point of order analysis:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during analysis"
      });
    }
  });
  
  /**
   * Analyze an amendment for potential points of order
   */
  app.post('/api/bills/:billId/enhanced-amendment-analysis', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      const { amendmentText } = req.body;
      
      if (!amendmentText) {
        return res.status(400).json({
          success: false,
          error: "Amendment text is required"
        });
      }
      
      // Check if bill exists
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });
      
      if (!bill) {
        return res.status(404).json({
          success: false,
          error: "Bill not found"
        });
      }
      
      // Run the amendment analysis
      const analysisResults = await enhancedBillPOOAnalyzer.analyzeAmendment(billId, amendmentText);
      
      return res.json({
        success: true,
        results: analysisResults
      });
    } catch (error: any) {
      console.error("Error in amendment analysis:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during analysis"
      });
    }
  });
  
  /**
   * Get patterns and trends in points of order
   */
  app.get('/api/points-of-order/patterns', async (_req: Request, res: Response) => {
    try {
      const patterns = await enhancedBillPOOAnalyzer.getPointsOfOrderPatterns();
      
      return res.json({
        success: true,
        data: patterns
      });
    } catch (error: any) {
      console.error("Error getting points of order patterns:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error retrieving patterns"
      });
    }
  });
  
  /**
   * Batch analyze multiple bills for points of order
   */
  app.post('/api/bills/batch-enhanced-analysis', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billIds } = req.body;
      
      if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Valid bill IDs array is required"
        });
      }
      
      // Start the analysis process in the background
      res.json({
        success: true,
        message: `Analysis started for ${billIds.length} bills. Results will be stored in the database.`,
        jobId: uuidv4() // Return a job ID for tracking
      });
      
      // Process in the background after response is sent
      processBillBatch(billIds);
      
    } catch (error: any) {
      console.error("Error in batch analysis:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during batch analysis"
      });
    }
  });
}

/**
 * Process a batch of bills for point of order analysis
 * This runs in the background after the API response
 * @param billIds Array of bill IDs to analyze
 */
async function processBillBatch(billIds: string[]) {
  try {
    console.log(`Starting background analysis of ${billIds.length} bills for points of order`);
    
    // Process bills one at a time
    for (const billId of billIds) {
      try {
        console.log(`Analyzing bill ${billId}...`);
        
        // Run the enhanced analysis
        const analysisResults = await enhancedBillPOOAnalyzer.analyzeBill(billId);
        
        // Store detected points of order in the database
        if (analysisResults.analysis && analysisResults.analysis.length > 0) {
          for (const issue of analysisResults.analysis) {
            // Skip issues with error type
            if (issue.type === 'error') continue;
            
            // Create a new point of order record
            await db.insert(pointsOfOrder).values({
              id: uuidv4(),
              billId,
              type: issue.type,
              description: issue.description,
              ruleReference: issue.ruleReference,
              severity: issue.severity as 'low' | 'medium' | 'high',
              textLocation: issue.textLocation,
              ruleCitation: issue.ruleCitation,
              suggestedFix: issue.suggestedFix,
              precedents: issue.precedents,
              aiDetected: true,
              validationStatus: 'pending',
              detectedBy: 'batch-enhanced-analyzer',
              status: 'pending',
            });
          }
          
          console.log(`Stored ${analysisResults.analysis.length} potential points of order for bill ${billId}`);
        } else {
          console.log(`No points of order detected for bill ${billId}`);
        }
      } catch (error: any) {
        console.error(`Error processing bill ${billId}:`, error);
        // Continue with the next bill
      }
    }
    
    console.log(`Completed batch analysis of ${billIds.length} bills`);
  } catch (error: any) {
    console.error("Error in background bill batch processing:", error);
  }
}