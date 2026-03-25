// Routes for bill trending and passage probability
import { Express, Request, Response } from 'express';
import { trendingStorage } from './storage-trending';
import { z } from 'zod';
import { insertBillPassageProbabilitySchema, insertTrendingBillMetricsSchema } from '@shared/schema-trending';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { computePassageProbability } from './services/passage-probability-service';
import { calculateTrendingScore } from './services/trending-score-service';

// Route validation schemas
const billIdParamSchema = z.object({
  billId: z.string()
});

const limitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(5)
});

const billIdsQuerySchema = z.object({
  billIds: z.string().transform(ids => ids.split(','))
});

/**
 * Register trending and passage probability routes
 */
export function registerTrendingRoutes(app: Express): void {
  /**
   * Get a bill's passage probability information
   */
  app.get('/api/trending/passage-probability/:billId', async (req: Request, res: Response) => {
    try {
      const { billId } = billIdParamSchema.parse(req.params);
      const probability = await trendingStorage.getBillPassageProbability(billId);
      
      if (!probability) {
        return res.status(404).json({ message: 'Passage probability not found for this bill' });
      }
      
      res.json(probability);
    } catch (error: any) {
      console.error('Error getting bill passage probability:', error);
      res.status(500).json({ message: 'Failed to fetch passage probability' });
    }
  });

  /**
   * Get passage probabilities for multiple bills
   */
  app.get('/api/trending/passage-probabilities', async (req: Request, res: Response) => {
    try {
      const { billIds } = billIdsQuerySchema.parse(req.query);
      const probabilities = await trendingStorage.getMultipleBillsPassageProbabilities(billIds);
      
      res.json(probabilities);
    } catch (error: any) {
      console.error('Error getting passage probabilities for multiple bills:', error);
      res.status(500).json({ message: 'Failed to fetch passage probabilities' });
    }
  });
  
  /**
   * Create or update passage probability for a bill (authenticated)
   */
  app.post('/api/trending/passage-probability', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const data = insertBillPassageProbabilitySchema.parse(req.body);
      const result = await trendingStorage.createOrUpdateBillPassageProbability(data);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error creating/updating passage probability:', error);
      res.status(500).json({ message: 'Failed to create/update passage probability' });
    }
  });

  /**
   * Generate passage probability for a bill automatically (authenticated)
   */
  app.post('/api/trending/generate-passage-probability/:billId', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = billIdParamSchema.parse(req.params);
      const probabilityData = await computePassageProbability(billId);
      
      if (!probabilityData) {
        return res.status(404).json({ message: 'Could not generate passage probability for this bill' });
      }
      
      const result = await trendingStorage.createOrUpdateBillPassageProbability(probabilityData);
      res.json(result);
    } catch (error: any) {
      console.error('Error generating passage probability:', error);
      res.status(500).json({ message: 'Failed to generate passage probability' });
    }
  });

  /**
   * Get trending metrics for a bill
   */
  app.get('/api/trending/metrics/:billId', async (req: Request, res: Response) => {
    try {
      const { billId } = billIdParamSchema.parse(req.params);
      const metrics = await trendingStorage.getBillTrendingMetrics(billId);
      
      if (!metrics) {
        return res.status(404).json({ message: 'Trending metrics not found for this bill' });
      }
      
      res.json(metrics);
    } catch (error: any) {
      console.error('Error getting bill trending metrics:', error);
      res.status(500).json({ message: 'Failed to fetch trending metrics' });
    }
  });

  /**
   * Get trending metrics for multiple bills
   */
  app.get('/api/trending/multi-metrics', async (req: Request, res: Response) => {
    try {
      const { billIds } = billIdsQuerySchema.parse(req.query);
      const metrics = await trendingStorage.getMultipleBillsTrendingMetrics(billIds);
      
      res.json(metrics);
    } catch (error: any) {
      console.error('Error getting trending metrics for multiple bills:', error);
      res.status(500).json({ message: 'Failed to fetch trending metrics' });
    }
  });

  /**
   * Create or update trending metrics for a bill (authenticated)
   */
  app.post('/api/trending/metrics', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const data = insertTrendingBillMetricsSchema.parse(req.body);
      const result = await trendingStorage.createOrUpdateBillTrendingMetrics(data);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error creating/updating trending metrics:', error);
      res.status(500).json({ message: 'Failed to create/update trending metrics' });
    }
  });

  /**
   * Generate trending metrics for a bill automatically (authenticated)
   */
  app.post('/api/trending/generate-metrics/:billId', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = billIdParamSchema.parse(req.params);
      const trendingData = await calculateTrendingScore(billId);
      
      if (!trendingData) {
        return res.status(404).json({ message: 'Could not generate trending metrics for this bill' });
      }
      
      const result = await trendingStorage.createOrUpdateBillTrendingMetrics(trendingData);
      res.json(result);
    } catch (error: any) {
      console.error('Error generating trending metrics:', error);
      res.status(500).json({ message: 'Failed to generate trending metrics' });
    }
  });

  /**
   * Get bills most likely to pass
   */
  app.get('/api/trending/most-likely-to-pass', async (req: Request, res: Response) => {
    try {
      const { limit } = limitQuerySchema.parse(req.query);
      const bills = await trendingStorage.getMostLikelyToPassBills(limit);
      
      res.json(bills);
    } catch (error: any) {
      console.error('Error fetching most likely to pass bills:', error);
      res.status(500).json({ message: 'Failed to fetch most likely to pass bills' });
    }
  });

  /**
   * Get bills least likely to pass
   */
  app.get('/api/trending/least-likely-to-pass', async (req: Request, res: Response) => {
    try {
      const { limit } = limitQuerySchema.parse(req.query);
      const bills = await trendingStorage.getLeastLikelyToPassBills(limit);
      
      res.json(bills);
    } catch (error: any) {
      console.error('Error fetching least likely to pass bills:', error);
      res.status(500).json({ message: 'Failed to fetch least likely to pass bills' });
    }
  });

  /**
   * Get bills with rising momentum
   */
  app.get('/api/trending/rising-momentum', async (req: Request, res: Response) => {
    try {
      const { limit } = limitQuerySchema.parse(req.query);
      const bills = await trendingStorage.getRisingMomentumBills(limit);
      
      res.json(bills);
    } catch (error: any) {
      console.error('Error fetching bills with rising momentum:', error);
      res.status(500).json({ message: 'Failed to fetch bills with rising momentum' });
    }
  });

  /**
   * Get top trending bills
   */
  app.get('/api/trending/top-trending', async (req: Request, res: Response) => {
    try {
      const { limit } = limitQuerySchema.parse(req.query);
      const bills = await trendingStorage.getTopTrendingBills(limit);
      
      res.json(bills);
    } catch (error: any) {
      console.error('Error fetching top trending bills:', error);
      res.status(500).json({ message: 'Failed to fetch top trending bills' });
    }
  });
}