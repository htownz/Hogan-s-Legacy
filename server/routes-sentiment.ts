import { Express, Request, Response } from 'express';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { sentimentStorage } from './storage-sentiment';
import { 
  insertBillSentimentSnapshotSchema,
  insertDemographicSentimentBreakdownSchema,
  insertSentimentTriggerSchema,
  insertUserSentimentVoteSchema
} from '../shared/schema-sentiment';
import { z } from 'zod';

/**
 * Register sentiment visualization API routes
 */
export function registerSentimentRoutes(app: Express): void {
  /**
   * Get bill sentiment snapshots
   */
  app.get('/api/sentiment/bills/:billId/snapshots', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Parse date parameters if provided
      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
      
      const snapshots = await sentimentStorage.getBillSentimentSnapshots(
        billId,
        parsedStartDate,
        parsedEndDate
      );
      
      res.json(snapshots);
    } catch (error: any) {
      console.error('Error fetching bill sentiment snapshots:', error);
      res.status(500).json({ error: 'Failed to fetch sentiment snapshots' });
    }
  });

  /**
   * Get a specific bill sentiment snapshot
   */
  app.get('/api/sentiment/snapshots/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const snapshot = await sentimentStorage.getBillSentimentSnapshotById(Number(id));
      
      if (!snapshot) {
        return res.status(404).json({ error: 'Sentiment snapshot not found' });
      }
      
      res.json(snapshot);
    } catch (error: any) {
      console.error('Error fetching sentiment snapshot:', error);
      res.status(500).json({ error: 'Failed to fetch sentiment snapshot' });
    }
  });

  /**
   * Create a bill sentiment snapshot (admin only)
   */
  app.post('/api/sentiment/bills/:billId/snapshots', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // TODO: Add admin-only check

      const { billId } = req.params;
      const validatedData = insertBillSentimentSnapshotSchema.parse({
        ...req.body,
        billId
      });
      
      const snapshot = await sentimentStorage.createBillSentimentSnapshot(validatedData);
      res.status(201).json(snapshot);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating sentiment snapshot:', error);
      res.status(500).json({ error: 'Failed to create sentiment snapshot' });
    }
  });

  /**
   * Get demographic sentiment breakdowns for a bill
   */
  app.get('/api/sentiment/bills/:billId/demographics', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { date } = req.query;
      
      // Parse date parameter if provided
      const parsedDate = date ? new Date(date as string) : undefined;
      
      const breakdowns = await sentimentStorage.getDemographicSentimentBreakdowns(billId, parsedDate);
      res.json(breakdowns);
    } catch (error: any) {
      console.error('Error fetching demographic sentiment breakdowns:', error);
      res.status(500).json({ error: 'Failed to fetch demographic sentiment breakdowns' });
    }
  });

  /**
   * Create a demographic sentiment breakdown (admin only)
   */
  app.post('/api/sentiment/bills/:billId/demographics', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // TODO: Add admin-only check

      const { billId } = req.params;
      const validatedData = insertDemographicSentimentBreakdownSchema.parse({
        ...req.body,
        billId
      });
      
      const breakdown = await sentimentStorage.createDemographicSentimentBreakdown(validatedData);
      res.status(201).json(breakdown);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating demographic sentiment breakdown:', error);
      res.status(500).json({ error: 'Failed to create demographic sentiment breakdown' });
    }
  });

  /**
   * Get sentiment triggers for a bill
   */
  app.get('/api/sentiment/bills/:billId/triggers', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Parse date parameters if provided
      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
      
      const triggers = await sentimentStorage.getSentimentTriggers(
        billId,
        parsedStartDate,
        parsedEndDate
      );
      
      res.json(triggers);
    } catch (error: any) {
      console.error('Error fetching sentiment triggers:', error);
      res.status(500).json({ error: 'Failed to fetch sentiment triggers' });
    }
  });

  /**
   * Create a sentiment trigger (admin only)
   */
  app.post('/api/sentiment/bills/:billId/triggers', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      // TODO: Add admin-only check

      const { billId } = req.params;
      const validatedData = insertSentimentTriggerSchema.parse({
        ...req.body,
        billId
      });
      
      const trigger = await sentimentStorage.createSentimentTrigger(validatedData);
      res.status(201).json(trigger);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating sentiment trigger:', error);
      res.status(500).json({ error: 'Failed to create sentiment trigger' });
    }
  });

  /**
   * Get user sentiment votes for a bill
   */
  app.get('/api/sentiment/bills/:billId/votes', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { userId } = req.query;
      
      // Parse userId parameter if provided
      const parsedUserId = userId ? Number(userId) : undefined;
      
      const votes = await sentimentStorage.getUserSentimentVotes(billId, parsedUserId);
      res.json(votes);
    } catch (error: any) {
      console.error('Error fetching user sentiment votes:', error);
      res.status(500).json({ error: 'Failed to fetch user sentiment votes' });
    }
  });

  /**
   * Submit a user sentiment vote
   */
  app.post('/api/sentiment/bills/:billId/votes', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      const userId = req.user.id;
      
      const validatedData = insertUserSentimentVoteSchema.parse({
        ...req.body,
        billId,
        userId
      });
      
      const vote = await sentimentStorage.createUserSentimentVote(validatedData);
      res.status(201).json(vote);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error submitting user sentiment vote:', error);
      res.status(500).json({ error: 'Failed to submit user sentiment vote' });
    }
  });

  /**
   * Update a user sentiment vote
   */
  app.patch('/api/sentiment/votes/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if vote belongs to user
      const existingVote = await sentimentStorage.getUserSentimentVoteById(Number(id));
      
      if (!existingVote) {
        return res.status(404).json({ error: 'Sentiment vote not found' });
      }
      
      if (existingVote.userId !== userId) {
        return res.status(403).json({ error: 'You can only update your own votes' });
      }
      
      // Only allow updating sentiment and comment
      const validatedData = z.object({
        sentiment: z.number(),
        comment: z.string().optional()
      }).parse(req.body);
      
      const updatedVote = await sentimentStorage.updateUserSentimentVote(Number(id), validatedData);
      
      if (!updatedVote) {
        return res.status(404).json({ error: 'Failed to update sentiment vote' });
      }
      
      res.json(updatedVote);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error updating sentiment vote:', error);
      res.status(500).json({ error: 'Failed to update sentiment vote' });
    }
  });

  /**
   * Get bill sentiment analytics over time
   */
  app.get('/api/sentiment/bills/:billId/analytics/over-time', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const data = await sentimentStorage.getBillSentimentOverTime(billId);
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching sentiment over time:', error);
      res.status(500).json({ error: 'Failed to fetch sentiment analytics' });
    }
  });

  /**
   * Get demographic sentiment comparisons for a bill
   */
  app.get('/api/sentiment/bills/:billId/analytics/demographics', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { date } = req.query;
      
      // Parse date parameter if provided
      const parsedDate = date ? new Date(date as string) : undefined;
      
      const data = await sentimentStorage.getDemographicSentimentComparison(billId, parsedDate);
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching demographic sentiment comparison:', error);
      res.status(500).json({ error: 'Failed to fetch demographic sentiment analytics' });
    }
  });

  /**
   * Get sentiment correlations for a bill
   */
  app.get('/api/sentiment/bills/:billId/analytics/correlations', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const data = await sentimentStorage.getSentimentCorrelations(billId);
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching sentiment correlations:', error);
      res.status(500).json({ error: 'Failed to fetch sentiment correlation analytics' });
    }
  });
}