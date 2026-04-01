import { Express, Request, Response } from 'express';
import { civicActionStorage } from './storage-civic-actions';
import { insertCivicActionSchema, insertCivicActionTypeSchema, insertQuickActionShortcutSchema, insertQuickActionInteractionSchema } from '../shared/schema-civic-actions';
import { z } from 'zod';
import { isAuthenticated } from './auth';
import { CustomRequest } from './types';
import { createLogger } from "./logger";
const log = createLogger("routes-civic-actions");


/**
 * Register civic action API routes
 */
export function registerCivicActionRoutes(app: Express): void {
  /**
   * Get available civic action types
   */
  app.get('/api/civic-actions/types', async (_req: Request, res: Response) => {
    try {
      const actionTypes = await civicActionStorage.getCivicActionTypes();
      res.status(200).json(actionTypes);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching civic action types');
      res.status(500).json({ message: 'Failed to fetch civic action types' });
    }
  });

  /**
   * Get civic action types by category
   */
  app.get('/api/civic-actions/types/category/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const actionTypes = await civicActionStorage.getCivicActionTypesByCategory(category);
      res.status(200).json(actionTypes);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching civic action types for category ${req.params.category}`);
      res.status(500).json({ message: 'Failed to fetch civic action types by category' });
    }
  });
  
  /**
   * Get civic action type by ID
   */
  app.get('/api/civic-actions/types/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const actionType = await civicActionStorage.getCivicActionTypeById(id);
      if (!actionType) {
        return res.status(404).json({ message: 'Civic action type not found' });
      }
      
      res.status(200).json(actionType);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching civic action type with ID ${req.params.id}`);
      res.status(500).json({ message: 'Failed to fetch civic action type' });
    }
  });

  /**
   * Create a new civic action type (admin only in the future)
   */
  app.post('/api/civic-actions/types', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const actionTypeData = insertCivicActionTypeSchema.parse(req.body);
      const newActionType = await civicActionStorage.createCivicActionType(actionTypeData);
      res.status(201).json(newActionType);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating civic action type');
      res.status(500).json({ message: 'Failed to create civic action type' });
    }
  });

  /**
   * Get user's civic actions
   */
  app.get('/api/civic-actions', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const options = {
        actionTypeId: req.query.actionTypeId ? Number(req.query.actionTypeId) : undefined,
        billId: req.query.billId ? String(req.query.billId) : undefined,
        completed: req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };

      const actions = await civicActionStorage.getCivicActions(userId, options);
      res.status(200).json(actions);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching user civic actions');
      res.status(500).json({ message: 'Failed to fetch civic actions' });
    }
  });

  /**
   * Create a new civic action for the user
   */
  app.post('/api/civic-actions', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const actionData = {
        ...req.body,
        userId
      };

      const validatedData = insertCivicActionSchema.parse(actionData);
      const newAction = await civicActionStorage.createCivicAction(validatedData);
      res.status(201).json(newAction);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating civic action');
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create civic action' });
    }
  });

  /**
   * Complete a civic action
   */
  app.post('/api/civic-actions/:id/complete', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const actionId = Number(req.params.id);
      const { result } = req.body;

      if (!result || typeof result !== 'string') {
        return res.status(400).json({ message: 'Result is required' });
      }

      // Verify the action belongs to this user
      const action = await civicActionStorage.getCivicActionById(actionId);
      if (!action) {
        return res.status(404).json({ message: 'Civic action not found' });
      }

      if (action.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to complete this action' });
      }

      const updatedAction = await civicActionStorage.completeCivicAction(actionId, result);
      res.status(200).json(updatedAction);
    } catch (error: any) {
      log.error({ err: error }, `Error completing civic action ${req.params.id}`);
      res.status(500).json({ message: 'Failed to complete civic action' });
    }
  });

  /**
   * Get quick action shortcuts for a specific location
   */
  app.get('/api/civic-actions/shortcuts/:location', async (req: Request, res: Response) => {
    try {
      const { location } = req.params;
      const shortcuts = await civicActionStorage.getQuickActionShortcuts(location);
      res.status(200).json(shortcuts);
    } catch (error: any) {
      log.error({ err: error }, `Error fetching shortcuts for location ${req.params.location}`);
      res.status(500).json({ message: 'Failed to fetch quick action shortcuts' });
    }
  });

  /**
   * Create a new quick action shortcut (admin only in the future)
   */
  app.post('/api/civic-actions/shortcuts', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const shortcutData = insertQuickActionShortcutSchema.parse(req.body);
      const newShortcut = await civicActionStorage.createQuickActionShortcut(shortcutData);
      res.status(201).json(newShortcut);
    } catch (error: any) {
      log.error({ err: error }, 'Error creating quick action shortcut');
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create quick action shortcut' });
    }
  });

  /**
   * Record a quick action interaction
   */
  app.post('/api/civic-actions/shortcuts/interaction', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const interactionData = {
        ...req.body,
        userId
      };

      const validatedData = insertQuickActionInteractionSchema.parse(interactionData);
      const interaction = await civicActionStorage.recordQuickActionInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error: any) {
      log.error({ err: error }, 'Error recording quick action interaction');
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to record quick action interaction' });
    }
  });

  /**
   * Get civic action statistics for the current user
   */
  app.get('/api/civic-actions/stats', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const stats = await civicActionStorage.getUserActionStats(userId);
      res.status(200).json(stats);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching civic action stats');
      res.status(500).json({ message: 'Failed to fetch civic action statistics' });
    }
  });

  /**
   * Get popular civic actions (for analytics)
   */
  app.get('/api/civic-actions/analytics/popular', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const popularActions = await civicActionStorage.getPopularActions(limit);
      res.status(200).json(popularActions);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching popular civic actions');
      res.status(500).json({ message: 'Failed to fetch popular actions' });
    }
  });

  /**
   * Get civic action completion rates by type (for analytics)
   */
  app.get('/api/civic-actions/analytics/completion-rates', async (_req: Request, res: Response) => {
    try {
      const completionRates = await civicActionStorage.getActionCompletionRateByType();
      res.status(200).json(completionRates);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching civic action completion rates');
      res.status(500).json({ message: 'Failed to fetch action completion rates' });
    }
  });
}