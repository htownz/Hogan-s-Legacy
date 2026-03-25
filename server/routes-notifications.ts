// @ts-nocheck
import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from './auth';
import { notificationService } from './services/notification-service';
import { 
  insertSmartNotificationSchema, 
  insertNotificationActionSchema,
  insertUserNotificationPreferenceSchema
} from '../shared/schema-notifications';
import { CustomRequest } from './types';

/**
 * Register notification API routes
 */
export function registerNotificationRoutes(app: Express): void {
  // Notification service is ready to use
  console.log("📧 Enhanced notification system registered successfully!");
  
  /**
   * Get user notification preferences
   */
  app.get('/api/notifications/preferences', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const preferences = await notificationService.getUserPreferences(userId);
      return res.json(preferences);
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      return res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
  });
  
  /**
   * Update a notification preference
   */
  app.patch('/api/notifications/preferences/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const prefId = parseInt(req.params.id);
      if (isNaN(prefId)) {
        return res.status(400).json({ error: 'Invalid preference ID' });
      }
      
      const updateSchema = z.object({
        enabled: z.boolean().optional(),
        priority: z.number().min(1).max(5).optional(),
        inAppEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional()
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: validationResult.error.format() 
        });
      }
      
      const updatedPreference = await notificationService.updateUserPreference(
        prefId, 
        validationResult.data
      );
      
      if (!updatedPreference) {
        return res.status(404).json({ error: 'Preference not found' });
      }
      
      return res.json(updatedPreference);
    } catch (error: any) {
      console.error('Error updating notification preference:', error);
      return res.status(500).json({ error: 'Failed to update notification preference' });
    }
  });
  
  /**
   * Get all notification types
   */
  app.get('/api/notifications/types', async (_req: Request, res: Response) => {
    try {
      const types = await notificationService.getNotificationTypes();
      return res.json(types);
    } catch (error: any) {
      console.error('Error fetching notification types:', error);
      return res.status(500).json({ error: 'Failed to fetch notification types' });
    }
  });
  
  /**
   * Get user notifications
   */
  app.get('/api/notifications', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Parse query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const typeId = req.query.typeId ? parseInt(req.query.typeId as string) : undefined;
      const includeDismissed = req.query.includeDismissed === 'true';
      
      const notifications = await notificationService.getNotificationsForUser(
        userId,
        {
          limit,
          offset,
          typeId,
          includeDismissed
        }
      );
      
      return res.json(notifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });
  
  /**
   * Get a single notification by ID
   */
  app.get('/api/notifications/:id', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }
      
      const notification = await notificationService['storage'].getNotificationById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this notification' });
      }
      
      return res.json(notification);
    } catch (error: any) {
      console.error('Error fetching notification:', error);
      return res.status(500).json({ error: 'Failed to fetch notification' });
    }
  });
  
  /**
   * Create a notification (for testing and admin purposes)
   */
  app.post('/api/notifications', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Create schema with required userId
      const createSchema = insertSmartNotificationSchema.extend({
        // Override userId to ensure it's always the authenticated user
        userId: z.number().default(userId)
      });
      
      const validationResult = createSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: validationResult.error.format() 
        });
      }
      
      const notification = await notificationService.createNotification(validationResult.data);
      return res.status(201).json(notification);
    } catch (error: any) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ error: 'Failed to create notification' });
    }
  });
  
  /**
   * Record a notification action (read, dismissed, clicked, etc.)
   */
  app.post('/api/notifications/:id/actions', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }
      
      // Schema for action
      const actionSchema = z.object({
        action: z.string().min(1),
        metadata: z.record(z.any()).optional()
      });
      
      const validationResult = actionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: validationResult.error.format() 
        });
      }
      
      // Verify notification belongs to user
      const notification = await notificationService['storage'].getNotificationById(notificationId);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to modify this notification' });
      }
      
      const { action, metadata = {} } = validationResult.data;
      
      await notificationService.recordAction(
        notificationId,
        userId,
        action,
        metadata
      );
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error recording notification action:', error);
      return res.status(500).json({ error: 'Failed to record notification action' });
    }
  });
  
  /**
   * Mark notifications as read
   */
  app.post('/api/notifications/mark-read', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // If specific notification IDs are provided, mark only those
      const { ids } = req.body;
      
      if (Array.isArray(ids) && ids.length > 0) {
        // Verify all notifications belong to user
        const notifications = await notificationService['storage'].getNotificationsByIds(ids);
        
        // Filter to only include those that belong to the user
        const userNotificationIds = notifications
          .filter((n: any) => n.userId === userId)
          .map((n: any) => n.id);
        
        // Mark each as read
        for (const id of userNotificationIds) {
          await notificationService['storage'].markAsRead(id);
        }
        
        return res.status(200).json({ 
          success: true, 
          count: userNotificationIds.length 
        });
      } else {
        // Mark all as read
        await notificationService.markAllAsRead(userId);
        return res.status(200).json({ success: true });
      }
    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
      return res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  });
  
  /**
   * Get notification statistics for current user
   */
  app.get('/api/notifications/stats', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const stats = await notificationService.getNotificationStats(userId);
      return res.json(stats);
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
      return res.status(500).json({ error: 'Failed to fetch notification statistics' });
    }
  });
  
  /**
   * Get notification type distribution (for analytics)
   */
  app.get('/api/notifications/analytics/distribution', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const distribution = await notificationService.getNotificationTypeDistribution(userId);
      return res.json(distribution);
    } catch (error: any) {
      console.error('Error fetching notification distribution:', error);
      return res.status(500).json({ error: 'Failed to fetch notification distribution' });
    }
  });
}