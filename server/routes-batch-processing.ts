import express from 'express';
import { Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './auth';
import {
  batchProcessBillSummaries,
  batchProcessBillComparisons,
  batchProcessLegislativeImpacts,
  batchProcessDocumentIngestion,
  getBatchOperationStatus,
  getBatchOperationResults
} from './services/batch-processing-service';
import { createLogger } from "./logger";
const log = createLogger("routes-batch-processing");


const router = express.Router();

// Schema for batch bill summary request
const batchBillSummarySchema = z.object({
  bills: z.array(z.object({
    billText: z.string().min(50),
    billId: z.string()
  })).min(1).max(100),
  batchId: z.string().optional()
});

// Schema for batch bill comparison request
const batchBillComparisonSchema = z.object({
  comparisons: z.array(z.object({
    bill1Text: z.string().min(50),
    bill1Id: z.string(),
    bill2Text: z.string().min(50),
    bill2Id: z.string()
  })).min(1).max(50),
  batchId: z.string().optional()
});

// Schema for batch legislative impact request
const batchLegislativeImpactSchema = z.object({
  bills: z.array(z.object({
    billText: z.string().min(50),
    billId: z.string()
  })).min(1).max(100),
  batchId: z.string().optional()
});

// Schema for batch document ingestion request
const documentSchema = z.object({
  id: z.string(),
  text: z.string().min(10),
  metadata: z.record(z.any()).optional()
});

const batchDocumentIngestionSchema = z.object({
  documents: z.array(documentSchema).min(1).max(200),
  batchId: z.string().optional()
});

// Schema for batch operation status request
const batchOperationStatusSchema = z.object({
  batchId: z.string()
});

/**
 * Process batch bill summaries
 */
router.post('/summaries', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bills, batchId } = batchBillSummarySchema.parse(req.body);
    
    const operationId = await batchProcessBillSummaries(bills, batchId);
    
    res.json({ 
      operationId,
      message: `Batch processing started for ${bills.length} bills`,
      status: 'in_progress'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error starting batch bill summary');
    res.status(400).json({ 
      error: 'Failed to start batch processing', 
      message: error.message || 'Unknown error' 
    });
  }
});

/**
 * Process batch bill comparisons
 */
router.post('/comparisons', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { comparisons, batchId } = batchBillComparisonSchema.parse(req.body);
    
    const operationId = await batchProcessBillComparisons(comparisons, batchId);
    
    res.json({ 
      operationId,
      message: `Batch processing started for ${comparisons.length} bill comparisons`,
      status: 'in_progress'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error starting batch bill comparison');
    res.status(400).json({ 
      error: 'Failed to start batch processing', 
      message: error.message || 'Unknown error' 
    });
  }
});

/**
 * Process batch legislative impacts
 */
router.post('/impacts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bills, batchId } = batchLegislativeImpactSchema.parse(req.body);
    
    const operationId = await batchProcessLegislativeImpacts(bills, batchId);
    
    res.json({ 
      operationId,
      message: `Batch processing started for ${bills.length} legislative impact analyses`,
      status: 'in_progress'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error starting batch legislative impact analysis');
    res.status(400).json({ 
      error: 'Failed to start batch processing', 
      message: error.message || 'Unknown error' 
    });
  }
});

/**
 * Process batch document ingestion
 */
router.post('/documents', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { documents, batchId } = batchDocumentIngestionSchema.parse(req.body);
    
    const operationId = await batchProcessDocumentIngestion(documents, batchId);
    
    res.json({ 
      operationId,
      message: `Batch processing started for ${documents.length} documents`,
      status: 'in_progress'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Error starting batch document ingestion');
    res.status(400).json({ 
      error: 'Failed to start batch processing', 
      message: error.message || 'Unknown error' 
    });
  }
});

/**
 * Get batch operation status
 */
router.get('/status/:batchId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    
    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }
    
    const status = getBatchOperationStatus(batchId);
    
    if (!status) {
      return res.status(404).json({ error: 'Batch operation not found' });
    }
    
    res.json(status);
  } catch (error: any) {
    log.error({ err: error }, 'Error getting batch operation status');
    res.status(500).json({ 
      error: 'Failed to get batch operation status', 
      message: error.message || 'Unknown error' 
    });
  }
});

/**
 * Get batch operation results
 */
router.get('/results/:batchId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    
    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }
    
    const results = getBatchOperationResults(batchId);
    
    if (!results) {
      return res.status(404).json({ 
        error: 'Batch operation not found or not completed',
        message: 'The batch operation may still be in progress or may have failed'
      });
    }
    
    res.json(results);
  } catch (error: any) {
    log.error({ err: error }, 'Error getting batch operation results');
    res.status(500).json({ 
      error: 'Failed to get batch operation results', 
      message: error.message || 'Unknown error' 
    });
  }
});

/**
 * Register the batch processing routes with the Express app
 */
export function registerBatchProcessingRoutes(app: express.Express) {
  app.use('/api/batch', router);
  log.info('Batch processing routes registered');
  return router;
}

export default router;