import { Router } from "express";
import { z } from "zod";
import { notificationService } from "./services/notification-service";
import { smartAlertsStorage } from "./storage-smart-alerts";

const router = Router();

// Test real-time notification system
router.post("/api/notifications/test", async (req, res) => {
  try {
    const { userId = 1 } = req.body;
    
    await notificationService.sendTestNotification(userId);
    
    res.json({
      success: true,
      message: "Test notification sent successfully! Check your real-time alerts.",
      userId
    });
  } catch (error: any) {
    console.error("Failed to send test notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send test notification"
    });
  }
});

// Send custom notification to user
router.post("/api/notifications/send", async (req, res) => {
  try {
    const notificationSchema = z.object({
      userId: z.number(),
      title: z.string(),
      message: z.string(),
      billId: z.string(),
      urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
      contextualExplanation: z.string().optional(),
      actionButtons: z.array(z.object({
        label: z.string(),
        action: z.string(),
        style: z.enum(['primary', 'secondary'])
      })).optional(),
      aiAnalysis: z.any().optional()
    });

    const payload = notificationSchema.parse(req.body);
    
    await notificationService.sendNotificationToUser(payload.userId, payload);
    
    res.json({
      success: true,
      message: "Notification sent successfully!",
      payload
    });
  } catch (error: any) {
    console.error("Failed to send notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send notification"
    });
  }
});

// Broadcast bill status update to all tracking users
router.post("/api/notifications/broadcast/:billId", async (req, res) => {
  try {
    const { billId } = req.params;
    const broadcastSchema = z.object({
      updateType: z.string(),
      title: z.string(),
      message: z.string(),
      urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
      contextualExplanation: z.string().optional(),
      actionButtons: z.array(z.object({
        label: z.string(),
        action: z.string(),
        style: z.enum(['primary', 'secondary'])
      })).optional(),
      aiAnalysis: z.any().optional()
    });

    const payload = broadcastSchema.parse(req.body);
    
    await notificationService.broadcastBillUpdate(billId, payload.updateType, payload);
    
    res.json({
      success: true,
      message: `Broadcast sent for bill ${billId}`,
      billId,
      updateType: payload.updateType
    });
  } catch (error: any) {
    console.error("Failed to broadcast bill update:", error);
    res.status(500).json({
      success: false,
      error: "Failed to broadcast bill update"
    });
  }
});

// Get notification statistics for user
router.get("/api/notifications/stats/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const stats = await notificationService.getNotificationStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error("Failed to get notification stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get notification stats"
    });
  }
});

// Get user's alert preferences
router.get("/api/notifications/preferences/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const preferences = await smartAlertsStorage.getUserAlertPreferences(userId);
    
    res.json({
      success: true,
      preferences: preferences || {
        enableSmartAlerts: true,
        enablePushNotifications: false,
        enableEmailAlerts: true,
        alertFrequency: 'immediate',
        urgencyFilter: 'medium'
      }
    });
  } catch (error: any) {
    console.error("Failed to get alert preferences:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get alert preferences"
    });
  }
});

// Update user's alert preferences
router.put("/api/notifications/preferences/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const preferencesSchema = z.object({
      enableSmartAlerts: z.boolean().optional(),
      enablePushNotifications: z.boolean().optional(),
      enableEmailAlerts: z.boolean().optional(),
      alertFrequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
      urgencyFilter: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      topicFilters: z.array(z.string()).optional()
    });

    const preferences = preferencesSchema.parse(req.body);
    
    const updated = await smartAlertsStorage.createOrUpdateAlertPreferences(userId, preferences);
    
    res.json({
      success: true,
      message: "Alert preferences updated successfully!",
      preferences: updated
    });
  } catch (error: any) {
    console.error("Failed to update alert preferences:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update alert preferences"
    });
  }
});

// Mark notification as read
router.put("/api/notifications/read/:alertId", async (req, res) => {
  try {
    const alertId = parseInt(req.params.alertId);
    
    await smartAlertsStorage.markAlertAsRead(alertId);
    
    res.json({
      success: true,
      message: "Alert marked as read"
    });
  } catch (error: any) {
    console.error("Failed to mark alert as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark alert as read"
    });
  }
});

// Get unread notification count
router.get("/api/notifications/unread/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const count = await smartAlertsStorage.getUnreadAlertCount(userId);
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error: any) {
    console.error("Failed to get unread count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get unread count"
    });
  }
});

// Simulate real legislative update for demo
router.post("/api/notifications/simulate-update", async (req, res) => {
  try {
    const updateTypes = [
      {
        type: "committee_hearing",
        title: "🏛️ Committee Hearing Scheduled",
        message: "HB 2156 (Healthcare Access) has been scheduled for committee hearing tomorrow at 2 PM",
        urgency: "high" as const,
        explanation: "This bill directly affects healthcare accessibility in your district. The committee will hear public testimony and may vote to advance the bill."
      },
      {
        type: "floor_vote",
        title: "🗳️ Floor Vote Imminent", 
        message: "SB 891 (Education Funding) is scheduled for a floor vote within 48 hours",
        urgency: "urgent" as const,
        explanation: "This critical education funding bill could impact school districts statewide. Your representative will vote soon."
      },
      {
        type: "governor_action",
        title: "📝 Bill Signed Into Law",
        message: "HB 1023 (Environmental Protection) has been signed by the Governor",
        urgency: "medium" as const,
        explanation: "This environmental protection measure is now law and will take effect in 90 days, affecting air quality standards."
      }
    ];

    const randomUpdate = updateTypes[Math.floor(Math.random() * updateTypes.length)];
    
    await notificationService.sendNotificationToUser(1, {
      title: randomUpdate.title,
      message: randomUpdate.message,
      billId: `TX-2025-DEMO-${Date.now()}`,
      urgencyLevel: randomUpdate.urgency,
      contextualExplanation: randomUpdate.explanation,
      actionButtons: [
        { label: "View Bill Details", action: "view_bill", style: "primary" },
        { label: "Contact Representative", action: "contact_rep", style: "secondary" }
      ],
      aiAnalysis: {
        impact: "High - This legislation could significantly affect your community",
        confidence: 92,
        recommendation: "Consider taking action by contacting your representative"
      }
    });
    
    res.json({
      success: true,
      message: "Legislative update simulated successfully!",
      updateType: randomUpdate.type
    });
  } catch (error: any) {
    console.error("Failed to simulate update:", error);
    res.status(500).json({
      success: false,
      error: "Failed to simulate update"
    });
  }
});

export default router;