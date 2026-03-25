import { Router } from "express";
import { z } from "zod";
import { smartAlertsStorage } from "./storage-smart-alerts";
import { insertSmartBillAlertSchema } from "@shared/schema";

const router = Router();

// Test route to create a sample smart alert in the database
router.post("/api/persistence/test-alert", async (req, res) => {
  try {
    // Create a test alert to verify database persistence
    const testAlert = {
      userId: 1, // Default test user
      billId: "TX-2025-HB001",
      alertType: "status_change" as const,
      title: "Database Persistence Test",
      message: "This alert was created to test database storage!",
      contextualExplanation: "Testing our new persistent storage system for smart bill alerts.",
      urgencyLevel: "medium" as const,
      aiAnalysis: {
        impact: "This demonstrates that our database persistence is working correctly.",
        confidence: 95,
        timeline: "Immediate verification"
      },
      actionButtons: [
        { label: "View Details", action: "view_bill", style: "primary" },
        { label: "Share", action: "share", style: "secondary" }
      ]
    };

    const createdAlert = await smartAlertsStorage.createAlert(testAlert);
    
    res.json({
      success: true,
      message: "Database persistence test successful!",
      alert: createdAlert
    });
  } catch (error: any) {
    console.error("Database persistence test failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test database persistence",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get all alerts for a user (testing retrieval)
router.get("/api/persistence/alerts/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const alerts = await smartAlertsStorage.getAlertsForUser(userId, {
      limit: 10
    });

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error: any) {
    console.error("Failed to retrieve alerts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve alerts",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test bill tracking persistence
router.post("/api/persistence/track-bill", async (req, res) => {
  try {
    const { userId, billId } = req.body;
    
    await smartAlertsStorage.trackBillForUser(userId, billId);
    
    res.json({
      success: true,
      message: `User ${userId} is now tracking bill ${billId}`
    });
  } catch (error: any) {
    console.error("Failed to track bill:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track bill",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get tracked bills for a user
router.get("/api/persistence/tracked-bills/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const trackedBills = await smartAlertsStorage.getTrackedBillsForUser(userId);

    res.json({
      success: true,
      userId,
      trackedBills,
      count: trackedBills.length
    });
  } catch (error: any) {
    console.error("Failed to get tracked bills:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get tracked bills",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;