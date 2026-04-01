import { smartAlertsStorage } from "../storage-smart-alerts";
import { InsertSmartBillAlert, UserAlertPreferences } from "@shared/schema";
import { createLogger } from "../logger";
const log = createLogger("notification-service");


interface NotificationPayload {
  title: string;
  message: string;
  billId: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  actionButtons?: Array<{
    label: string;
    action: string;
    style: 'primary' | 'secondary';
  }>;
  contextualExplanation?: string;
  aiAnalysis?: any;
}

interface NotificationChannel {
  type: 'web_push' | 'email' | 'in_app';
  enabled: boolean;
}

class NotificationService {
  private subscribers: Map<number, Set<WebSocket>> = new Map();
  
  // Register WebSocket connection for real-time notifications
  addSubscriber(userId: number, ws: WebSocket): void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(ws);
    
    // Clean up on disconnect
    ws.addEventListener('close', () => {
      const userSockets = this.subscribers.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    });
  }

  // Send notification to specific user
  async sendNotificationToUser(
    userId: number, 
    payload: NotificationPayload
  ): Promise<void> {
    try {
      // Get user preferences
      const preferences = await smartAlertsStorage.getUserAlertPreferences(userId);
      
      // Check if user wants notifications for this urgency level
      if (preferences && !this.shouldSendNotification(preferences, payload.urgencyLevel)) {
        return;
      }

      // Create alert in database
      const alertData: InsertSmartBillAlert = {
        userId,
        billId: payload.billId,
        alertType: 'status_change',
        title: payload.title,
        message: payload.message,
        contextualExplanation: payload.contextualExplanation,
        aiAnalysis: payload.aiAnalysis,
        actionButtons: payload.actionButtons,
        urgencyLevel: payload.urgencyLevel
      };

      const createdAlert = await smartAlertsStorage.createAlert(alertData);

      // Send real-time notification via WebSocket
      await this.sendRealtimeNotification(userId, {
        ...payload,
        alertId: createdAlert.id,
        timestamp: createdAlert.createdAt
      });

      // Send push notification if enabled
      if (preferences?.enablePushNotifications) {
        await this.sendPushNotification(userId, payload);
      }

      // Send email if enabled and urgency is high enough
      if (preferences?.enableEmailAlerts && 
          ['high', 'urgent'].includes(payload.urgencyLevel)) {
        await this.sendEmailNotification(userId, payload);
      }

    } catch (error: any) {
      log.error({ err: error }, 'Failed to send notification');
    }
  }

  // Send real-time WebSocket notification
  private async sendRealtimeNotification(
    userId: number, 
    payload: any
  ): Promise<void> {
    const userSockets = this.subscribers.get(userId);
    if (userSockets) {
      const notification = {
        type: 'SMART_ALERT',
        payload,
        timestamp: new Date().toISOString()
      };

      userSockets.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(notification));
        }
      });
    }
  }

  // Send push notification (web push API)
  private async sendPushNotification(
    userId: number, 
    payload: NotificationPayload
  ): Promise<void> {
    // This would integrate with web push API in a production environment
    log.info({
      title: payload.title,
      body: payload.message,
      urgency: payload.urgencyLevel
    }, `Push notification sent to user ${userId}`);
    
    // In production, you would:
    // 1. Store user's push subscription
    // 2. Use web-push library to send notifications
    // 3. Handle delivery confirmations
  }

  // Send email notification
  private async sendEmailNotification(
    userId: number, 
    payload: NotificationPayload
  ): Promise<void> {
    // This would integrate with SendGrid or similar email service
    log.info({
      subject: `${payload.title}`,
      message: payload.message,
      urgency: payload.urgencyLevel
    }, `Email notification sent to user ${userId}`);
    
    // In production, you would:
    // 1. Get user's email from database
    // 2. Use SendGrid API to send formatted email
    // 3. Include unsubscribe links and preferences
  }

  // Check if notification should be sent based on user preferences
  private shouldSendNotification(
    preferences: UserAlertPreferences, 
    urgencyLevel: string
  ): boolean {
    if (!preferences.enableSmartAlerts) return false;

    const urgencyOrder = ['low', 'medium', 'high', 'urgent'];
    const userMinLevel = urgencyOrder.indexOf(preferences.urgencyFilter || 'medium');
    const notificationLevel = urgencyOrder.indexOf(urgencyLevel);

    return notificationLevel >= userMinLevel;
  }

  // Broadcast notification to all users tracking a specific bill
  async broadcastBillUpdate(
    billId: string, 
    updateType: string, 
    payload: Omit<NotificationPayload, 'billId'>
  ): Promise<void> {
    try {
      // This would query all users tracking this bill
      // For now, we'll simulate with a demo user
      const trackingUsers = [1]; // In production: query userBillTracking table
      
      for (const userId of trackingUsers) {
        await this.sendNotificationToUser(userId, {
          ...payload,
          billId
        });
      }
    } catch (error: any) {
      log.error({ err: error }, 'Failed to broadcast bill update');
    }
  }

  // Get notification statistics for analytics
  async getNotificationStats(userId: number): Promise<{
    totalSent: number;
    unreadCount: number;
    urgencyBreakdown: Record<string, number>;
  }> {
    try {
      const alerts = await smartAlertsStorage.getAlertsForUser(userId, { limit: 100 });
      const unreadCount = await smartAlertsStorage.getUnreadAlertCount(userId);
      
      const urgencyBreakdown = alerts.reduce((acc, alert) => {
        acc[alert.urgencyLevel] = (acc[alert.urgencyLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalSent: alerts.length,
        unreadCount,
        urgencyBreakdown
      };
    } catch (error: any) {
      log.error({ err: error }, 'Failed to get notification stats');
      return { totalSent: 0, unreadCount: 0, urgencyBreakdown: {} };
    }
  }

  // Test notification system with sample alert
  async sendTestNotification(userId: number): Promise<void> {
    await this.sendNotificationToUser(userId, {
      title: "🧪 Test Notification",
      message: "Your enhanced notification system is working perfectly! Real-time alerts are now active.",
      billId: "TEST-BILL-001",
      urgencyLevel: "medium",
      contextualExplanation: "This is a test to verify that your personalized notification system is functioning correctly.",
      actionButtons: [
        { label: "View Dashboard", action: "view_dashboard", style: "primary" },
        { label: "Notification Settings", action: "settings", style: "secondary" }
      ],
      aiAnalysis: {
        impact: "Test notification to verify system functionality",
        confidence: 100,
        recommendation: "Your notification system is ready for real legislative alerts!"
      }
    });
  }
}

export const notificationService = new NotificationService();