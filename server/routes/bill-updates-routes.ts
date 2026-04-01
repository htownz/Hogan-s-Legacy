// @ts-nocheck
import { Express, Request, Response } from 'express';
import { db } from '../db';
import { billMovementNotifications, bills } from '@shared/schema-additions';
import { eq, and, desc } from 'drizzle-orm';
import { isAuthenticated, CustomRequest } from '../auth';
import { createLogger } from "../logger";
const log = createLogger("bill-updates-routes");


export async function registerBillUpdateRoutes(app: Express): Promise<void> {
  // Get notification for the logged-in user
  app.get('/api/notifications', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Get unread notifications first, then read ones, all sorted by creation date (newest first)
      const notifications = await db.select({
        id: billMovementNotifications.id,
        billId: billMovementNotifications.billId,
        message: billMovementNotifications.message,
        read: billMovementNotifications.read,
        createdAt: billMovementNotifications.createdAt,
        billTitle: bills.title,
      })
      .from(billMovementNotifications)
      .leftJoin(bills, eq(billMovementNotifications.billId, bills.id))
      .where(eq(billMovementNotifications.userId, userId))
      .orderBy(billMovementNotifications.read, desc(billMovementNotifications.createdAt))
      .limit(50);
      
      return res.status(200).json(notifications);
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching notifications');
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });
  
  // Mark notification as read
  app.put('/api/notifications/:id/read', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      // Update the notification read status
      await db.update(billMovementNotifications)
        .set({ read: true })
        .where(
          and(
            eq(billMovementNotifications.id, notificationId),
            eq(billMovementNotifications.userId, userId)
          )
        );
      
      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error: any) {
      log.error({ err: error }, 'Error marking notification as read');
      return res.status(500).json({ message: 'Failed to update notification' });
    }
  });
  
  // Mark all notifications as read
  app.put('/api/notifications/read-all', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Update all user's notifications to read status
      await db.update(billMovementNotifications)
        .set({ read: true })
        .where(
          and(
            eq(billMovementNotifications.userId, userId),
            eq(billMovementNotifications.read, false)
          )
        );
      
      return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      log.error({ err: error }, 'Error marking all notifications as read');
      return res.status(500).json({ message: 'Failed to update notifications' });
    }
  });
  
  // Get unread notification count
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Count unread notifications
      const result = await db.select({
        count: db.fn.count(billMovementNotifications.id)
      })
      .from(billMovementNotifications).$dynamic()
      .where(
        and(
          eq(billMovementNotifications.userId, userId),
          eq(billMovementNotifications.read, false)
        )
      );
      
      const unreadCount = parseInt(result[0].count.toString());
      
      return res.status(200).json({ unreadCount });
    } catch (error: any) {
      log.error({ err: error }, 'Error counting unread notifications');
      return res.status(500).json({ message: 'Failed to count unread notifications' });
    }
  });
}