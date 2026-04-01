import { Express, Response } from "express";
import { onboardingStorage } from "./storage-onboarding";
import { isAuthenticated } from "./middleware/auth-middleware";
import { 
  insertOnboardingProgressSchema, 
  insertCivicInterestsSchema,
  insertEngagementPreferencesSchema,
  insertTutorialProgressSchema
} from "@shared/schema-onboarding";
import { AuthRequest } from "./types/request-types";
import { createLogger } from "./logger";
const log = createLogger("routes-onboarding");


export function registerOnboardingRoutes(app: Express): void {
  /**
   * Get all onboarding progress for the current user
   */
  app.get('/api/onboarding/progress', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const progress = await onboardingStorage.getOnboardingProgress(userId);
      res.json(progress);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching onboarding progress');
      res.status(500).json({ error: 'Failed to fetch onboarding progress' });
    }
  });

  /**
   * Get a specific onboarding step for the current user
   */
  app.get('/api/onboarding/progress/:step', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const step = req.params.step;
      const progress = await onboardingStorage.getOnboardingStep(userId, step);
      
      if (!progress) {
        return res.status(404).json({ error: 'Onboarding step not found' });
      }
      
      res.json(progress);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching onboarding step');
      res.status(500).json({ error: 'Failed to fetch onboarding step' });
    }
  });

  /**
   * Update or create an onboarding step
   */
  app.post('/api/onboarding/progress', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validationResult = insertOnboardingProgressSchema.safeParse({
        ...req.body,
        userId
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data provided',
          details: validationResult.error.errors 
        });
      }

      const progress = await onboardingStorage.upsertOnboardingStep(validationResult.data);
      res.status(201).json(progress);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating onboarding progress');
      res.status(500).json({ error: 'Failed to update onboarding progress' });
    }
  });

  /**
   * Mark an onboarding step as completed
   */
  app.post('/api/onboarding/progress/:step/complete', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const step = req.params.step;
      const updated = await onboardingStorage.completeOnboardingStep(userId, step);
      
      if (!updated) {
        return res.status(404).json({ error: 'Onboarding step not found' });
      }
      
      res.json(updated);
    } catch (error: any) {
      log.error({ err: error }, 'Error completing onboarding step');
      res.status(500).json({ error: 'Failed to complete onboarding step' });
    }
  });

  /**
   * Get all civic interests for the current user
   */
  app.get('/api/onboarding/interests', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const interests = await onboardingStorage.getCivicInterests(userId);
      res.json(interests);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching civic interests');
      res.status(500).json({ error: 'Failed to fetch civic interests' });
    }
  });

  /**
   * Add a new civic interest
   */
  app.post('/api/onboarding/interests', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validationResult = insertCivicInterestsSchema.safeParse({
        ...req.body,
        userId
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data provided',
          details: validationResult.error.errors 
        });
      }

      const interest = await onboardingStorage.addCivicInterest(validationResult.data);
      res.status(201).json(interest);
    } catch (error: any) {
      log.error({ err: error }, 'Error adding civic interest');
      res.status(500).json({ error: 'Failed to add civic interest' });
    }
  });

  /**
   * Update a civic interest
   */
  app.put('/api/onboarding/interests/:id', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const interestId = parseInt(req.params.id);
      if (isNaN(interestId)) {
        return res.status(400).json({ error: 'Invalid interest ID' });
      }

      const updated = await onboardingStorage.updateCivicInterest(interestId, req.body);
      
      if (!updated) {
        return res.status(404).json({ error: 'Civic interest not found' });
      }
      
      res.json(updated);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating civic interest');
      res.status(500).json({ error: 'Failed to update civic interest' });
    }
  });

  /**
   * Delete a civic interest
   */
  app.delete('/api/onboarding/interests/:id', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const interestId = parseInt(req.params.id);
      if (isNaN(interestId)) {
        return res.status(400).json({ error: 'Invalid interest ID' });
      }

      const success = await onboardingStorage.deleteCivicInterest(interestId);
      res.json({ success });
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting civic interest');
      res.status(500).json({ error: 'Failed to delete civic interest' });
    }
  });

  /**
   * Get engagement preferences for the current user
   */
  app.get('/api/onboarding/preferences', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const preferences = await onboardingStorage.getEngagementPreferences(userId);
      
      if (!preferences) {
        // Return default preferences if none are set
        return res.json({
          userId,
          notificationsEnabled: true,
          emailFrequency: 'weekly',
          pushNotificationsEnabled: true,
          smsEnabled: false,
          locationSharingEnabled: false
        });
      }
      
      res.json(preferences);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching engagement preferences');
      res.status(500).json({ error: 'Failed to fetch engagement preferences' });
    }
  });

  /**
   * Update engagement preferences
   */
  app.post('/api/onboarding/preferences', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validationResult = insertEngagementPreferencesSchema.safeParse({
        ...req.body,
        userId
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data provided',
          details: validationResult.error.errors 
        });
      }

      const preferences = await onboardingStorage.upsertEngagementPreferences(validationResult.data);
      res.json(preferences);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating engagement preferences');
      res.status(500).json({ error: 'Failed to update engagement preferences' });
    }
  });

  /**
   * Get all tutorial progress for the current user
   */
  app.get('/api/onboarding/tutorial', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const progress = await onboardingStorage.getTutorialProgress(userId);
      res.json(progress);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching tutorial progress');
      res.status(500).json({ error: 'Failed to fetch tutorial progress' });
    }
  });

  /**
   * Get a specific tutorial step for the current user
   */
  app.get('/api/onboarding/tutorial/:tutorialId', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tutorialId = req.params.tutorialId;
      const progress = await onboardingStorage.getTutorialStep(userId, tutorialId);
      
      if (!progress) {
        return res.status(404).json({ error: 'Tutorial step not found' });
      }
      
      res.json(progress);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching tutorial step');
      res.status(500).json({ error: 'Failed to fetch tutorial step' });
    }
  });

  /**
   * Update or create a tutorial step
   */
  app.post('/api/onboarding/tutorial', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validationResult = insertTutorialProgressSchema.safeParse({
        ...req.body,
        userId
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data provided',
          details: validationResult.error.errors 
        });
      }

      const progress = await onboardingStorage.upsertTutorialStep(validationResult.data);
      res.status(201).json(progress);
    } catch (error: any) {
      log.error({ err: error }, 'Error updating tutorial progress');
      res.status(500).json({ error: 'Failed to update tutorial progress' });
    }
  });

  /**
   * Mark a tutorial step as completed
   */
  app.post('/api/onboarding/tutorial/:tutorialId/complete', isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tutorialId = req.params.tutorialId;
      const updated = await onboardingStorage.completeTutorialStep(userId, tutorialId);
      
      if (!updated) {
        return res.status(404).json({ error: 'Tutorial step not found' });
      }
      
      res.json(updated);
    } catch (error: any) {
      log.error({ err: error }, 'Error completing tutorial step');
      res.status(500).json({ error: 'Failed to complete tutorial step' });
    }
  });
}