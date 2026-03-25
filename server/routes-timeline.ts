import { Request, Response } from 'express';
import { timelineStorage } from './storage-timeline';
import { isAuthenticated } from './auth';
import { Express } from 'express';
import { CustomRequest } from './types';

export function registerTimelineRoutes(app: Express) {
  /**
   * Get the complete timeline for a bill
   */
  app.get('/api/bills/:billId/timeline', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const includePrivate = req.query.includePrivate === 'true';
      const userId = (req as CustomRequest).session.userId;
      
      const timeline = await timelineStorage.getCompleteBillTimeline(billId, includePrivate, userId);
      
      res.json(timeline);
    } catch (error: any) {
      console.error('Error fetching timeline:', error);
      res.status(500).json({ error: 'Failed to fetch timeline' });
    }
  });
  
  /**
   * Add a new stage to the timeline
   */
  app.post('/api/bills/:billId/timeline/stages', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      const stageData = { ...req.body, billId };
      
      const newStage = await timelineStorage.createTimelineStage(stageData);
      
      res.status(201).json(newStage);
    } catch (error: any) {
      console.error('Error creating timeline stage:', error);
      res.status(500).json({ error: 'Failed to create timeline stage' });
    }
  });
  
  /**
   * Update a timeline stage
   */
  app.patch('/api/bills/:billId/timeline/stages/:stageId', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { stageId } = req.params;
      const stageData = req.body;
      
      const updatedStage = await timelineStorage.updateTimelineStage(Number(stageId), stageData);
      
      if (!updatedStage) {
        return res.status(404).json({ error: 'Timeline stage not found' });
      }
      
      res.json(updatedStage);
    } catch (error: any) {
      console.error('Error updating timeline stage:', error);
      res.status(500).json({ error: 'Failed to update timeline stage' });
    }
  });
  
  /**
   * Delete a timeline stage
   */
  app.delete('/api/bills/:billId/timeline/stages/:stageId', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { stageId } = req.params;
      
      const deleted = await timelineStorage.deleteTimelineStage(Number(stageId));
      
      if (!deleted) {
        return res.status(404).json({ error: 'Timeline stage not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      console.error('Error deleting timeline stage:', error);
      res.status(500).json({ error: 'Failed to delete timeline stage' });
    }
  });
  
  /**
   * Add a new event to the timeline
   */
  app.post('/api/bills/:billId/timeline/events', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      const userId = req.session.userId;
      const eventData = { 
        ...req.body, 
        billId,
        userId: userId || undefined
      };
      
      const newEvent = await timelineStorage.createTimelineEvent(eventData);
      
      res.status(201).json(newEvent);
    } catch (error: any) {
      console.error('Error creating timeline event:', error);
      res.status(500).json({ error: 'Failed to create timeline event' });
    }
  });
  
  /**
   * Update a timeline event
   */
  app.patch('/api/bills/:billId/timeline/events/:eventId', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const userId = req.session.userId;
      const eventData = req.body;
      
      // Get the event to check ownership
      const event = await timelineStorage.getTimelineEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ error: 'Timeline event not found' });
      }
      
      // Check if user owns this event if it's private
      if (!event.isPublic && event.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to edit this event' });
      }
      
      const updatedEvent = await timelineStorage.updateTimelineEvent(eventId, eventData);
      
      res.json(updatedEvent);
    } catch (error: any) {
      console.error('Error updating timeline event:', error);
      res.status(500).json({ error: 'Failed to update timeline event' });
    }
  });
  
  /**
   * Delete a timeline event
   */
  app.delete('/api/bills/:billId/timeline/events/:eventId', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const userId = req.session.userId;
      
      // Get the event to check ownership
      const event = await timelineStorage.getTimelineEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ error: 'Timeline event not found' });
      }
      
      // Check if user owns this event if it's private
      if (!event.isPublic && event.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this event' });
      }
      
      const deleted = await timelineStorage.deleteTimelineEvent(eventId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Timeline event not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      console.error('Error deleting timeline event:', error);
      res.status(500).json({ error: 'Failed to delete timeline event' });
    }
  });
  
  /**
   * Get a specific timeline stage
   */
  app.get('/api/timeline/stages/:stageId', async (req: Request, res: Response) => {
    try {
      const { stageId } = req.params;
      
      const stage = await timelineStorage.getTimelineStageById(Number(stageId));
      
      if (!stage) {
        return res.status(404).json({ error: 'Timeline stage not found' });
      }
      
      res.json(stage);
    } catch (error: any) {
      console.error('Error fetching timeline stage:', error);
      res.status(500).json({ error: 'Failed to fetch timeline stage' });
    }
  });
  
  /**
   * Get a specific timeline event
   */
  app.get('/api/timeline/events/:eventId', async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const userId = (req as CustomRequest).session.userId;
      
      const event = await timelineStorage.getTimelineEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ error: 'Timeline event not found' });
      }
      
      // Check if user can access this event if it's private
      if (!event.isPublic && event.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to view this event' });
      }
      
      res.json(event);
    } catch (error: any) {
      console.error('Error fetching timeline event:', error);
      res.status(500).json({ error: 'Failed to fetch timeline event' });
    }
  });
  
  /**
   * Populate initial timeline stages for a bill
   */
  app.post('/api/bills/:billId/timeline/populate', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const { billId } = req.params;
      
      // First check if stages already exist for this bill
      const existingStages = await timelineStorage.getTimelineStagesByBillId(billId);
      
      if (existingStages.length > 0) {
        return res.status(409).json({ 
          error: 'Timeline stages already exist for this bill',
          count: existingStages.length
        });
      }
      
      // Define some basic stages for a bill
      const defaultStages = [
        {
          billId,
          stageType: 'introduced',
          stageTitle: 'Bill Filed',
          stageDescription: 'The bill was officially filed in the legislature.',
          stageOrder: 1,
          stageDate: new Date(2023, 0, 10) // January 10, 2023
        },
        {
          billId,
          stageType: 'committee_assigned',
          stageTitle: 'Referred to Committee',
          stageDescription: 'The bill was assigned to the relevant committee for review.',
          stageOrder: 2,
          stageDate: new Date(2023, 0, 20) // January 20, 2023
        },
        {
          billId,
          stageType: 'committee_hearing',
          stageTitle: 'Committee Hearing',
          stageDescription: 'The committee held a public hearing on the bill.',
          stageOrder: 3,
          stageDate: new Date(2023, 2, 15) // March 15, 2023
        }
      ];
      
      // Create the stages in order
      const createdStages = [];
      for (const stage of defaultStages) {
        const newStage = await timelineStorage.createTimelineStage(stage);
        createdStages.push(newStage);
      }
      
      res.status(201).json({
        message: 'Default timeline stages created successfully',
        stages: createdStages
      });
    } catch (error: any) {
      console.error('Error populating timeline stages:', error);
      res.status(500).json({ error: 'Failed to populate timeline stages' });
    }
  });
}