import { Express, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import { CustomRequest } from "../types";
import { db } from "../db";
import { and, desc, eq, sql } from "drizzle-orm";
import { 
  users, 
  bills,
  userBillTracking,
  userChallenges,
  superUserRoles,
  userNetworkImpact,
  personalImpactAssessments
} from "@shared/schema";
import { createLogger } from "../logger";
const log = createLogger("civic-engagement-routes");


/**
 * Register routes for civic engagement metrics and visualizations
 */
export function registerCivicEngagementRoutes(app: Express) {
  
  // Get user's civic engagement metrics
  app.get("/api/civic-engagement/metrics", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // 1. Get bills tracked count
      const trackedBillsCount = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(userBillTracking).$dynamic()
        .where(eq(userBillTracking.userId, userId));
      
      // 2. Get comments count from bill discussions (if we have that table)
      // This is a placeholder for now
      const commentsCount = 0;
      
      // 3. Get actions taken count from user challenges
      const actionsTakenCount = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(userChallenges).$dynamic()
        .where(and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.completed, true)
        ));
      
      // 4. Get shares count from user's network impact
      const networkImpact = await db
        .select()
        .from(userNetworkImpact).$dynamic()
        .where(eq(userNetworkImpact.userId, userId));
      
      const sharesCount = networkImpact.length > 0 ? networkImpact[0].actionsInspired : 0;
      
      // 5. Get user's personal impact assessments for bills
      const personalImpacts = await db
        .select({
          bill: bills,
          assessment: personalImpactAssessments
        })
        .from(personalImpactAssessments)
        .innerJoin(bills, eq(personalImpactAssessments.billId, bills.id))
        .where(eq(personalImpactAssessments.userId, userId))
        .orderBy(desc(personalImpactAssessments.relevanceScore))
        .limit(5);

      // Create dummy data for metrics that we don't have real data for yet
      // In a real implementation, we would calculate these from actual user interactions
      const billsTrackedChange = 5; 
      const commentsChange = 0;
      const actionsChange = 10;
      const sharesChange = 15;
      
      // Format bill impact data for the frontend
      const personalBillImpacts = personalImpacts.map(item => ({
        id: item.bill.id,
        title: item.bill.title,
        relevance: item.assessment.relevanceScore,
        sentiment: item.assessment.sentiment,
        impactAreas: item.assessment.impactAreas,
        actions: {
          tracked: true,
          commented: Math.random() > 0.5,  // Placeholder
          shared: Math.random() > 0.7      // Placeholder
        }
      }));
      
      // Activity breakdown
      const activityBreakdown = [
        { name: "Bills Tracked", value: trackedBillsCount[0]?.count || 0, color: "#8884d8" },
        { name: "Comments", value: commentsCount, color: "#82ca9d" },
        { name: "Actions", value: actionsTakenCount[0]?.count || 0, color: "#ffc658" },
        { name: "Shares", value: sharesCount, color: "#ff8042" }
      ];
      
      // Impact areas - derived from personal impact assessments
      const impactAreas = Array.from(
        new Set(
          personalImpacts.flatMap(item => item.assessment.impactAreas)
        )
      ).map(area => ({
        name: area,
        score: personalImpacts.filter(item => 
          item.assessment.impactAreas.includes(area)
        ).length
      }));
      
      // Bill engagement by category
      // In a real implementation, we would categorize bills and count user interactions
      const billEngagement = [
        { category: "Education", tracked: 3, commented: 2, shared: 1 },
        { category: "Healthcare", tracked: 5, commented: 1, shared: 2 },
        { category: "Environment", tracked: 2, commented: 0, shared: 1 },
        { category: "Economy", tracked: 4, commented: 3, shared: 0 }
      ];
      
      res.json({
        billsTracked: trackedBillsCount[0]?.count || 0,
        billsTrackedChange,
        commentsPosted: commentsCount,
        commentsChange,
        actionsTaken: actionsTakenCount[0]?.count || 0,
        actionsChange,
        sharesCount,
        sharesChange,
        activityBreakdown,
        impactAreas,
        billEngagement,
        personalBillImpacts
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching civic engagement metrics");
      res.status(500).json({ error: "Failed to fetch civic engagement metrics" });
    }
  });

  // Get community impact comparison data
  app.get("/api/civic-engagement/community-impact", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await db.select().from(users).$dynamic().where(eq(users.id, userId));
      
      if (!user.length) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userDistrict = user[0].district;
      
      // In a real implementation, we would calculate real community comparisons
      // This is placeholder data for the visualization
      const comparisonData = [
        {
          name: "Bills Tracked",
          user: 12,        // Your count
          average: 8,      // Platform average
          district: 10     // District average
        },
        {
          name: "Comments Posted",
          user: 5,
          average: 3,
          district: 4
        },
        {
          name: "Actions Taken",
          user: 15,
          average: 7,
          district: 9
        },
        {
          name: "Shares",
          user: 8,
          average: 5,
          district: 7
        },
        {
          name: "Points of Order",
          user: 3,
          average: 1,
          district: 2
        }
      ];
      
      // Get network impact metrics
      const networkImpact = await db
        .select()
        .from(userNetworkImpact).$dynamic()
        .where(eq(userNetworkImpact.userId, userId));
      
      // Time series data for actions inspired by this user
      const actionsInspired = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11 + i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1  // Placeholder data
        };
      });
      
      // Time series data for community reach
      const reach = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11 + i);
        
        // Create an exponential growth curve
        const baseReach = networkImpact.length > 0 ? networkImpact[0].totalReach / 12 : 10;
        const growthFactor = 1.2;
        const reachValue = Math.floor(baseReach * Math.pow(growthFactor, i));
        
        return {
          date: date.toISOString().split('T')[0],
          reach: reachValue
        };
      });
      
      res.json({
        comparisons: comparisonData,
        totalInfluenced: networkImpact.length > 0 ? networkImpact[0].totalReach : 0,
        actionsInspired,
        reach
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching community impact data");
      res.status(500).json({ error: "Failed to fetch community impact data" });
    }
  });

  // Get personal engagement history/timeline 
  app.get("/api/civic-engagement/history", isAuthenticated, async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // In a real implementation, we would pull data from user activity logs
      // For now, we'll generate a time series of the last 12 months
      
      const today = new Date();
      const timeSeries = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(today.getMonth() - 11 + i);
        
        // Generate scores that trend upward with some randomness
        const baseScore = 20 + (i * 5);       // Base value that increases each month
        const randomFactor = Math.random() * 15 - 5;  // Random variation between -5 and +10
        const score = Math.max(5, Math.floor(baseScore + randomFactor));
        
        // Add some associated metrics
        const actions = Math.floor(score / 5);
        const comments = Math.floor(score / 8);
        const shares = Math.floor(score / 10);
        
        return {
          date: date.toISOString().split('T')[0],
          score,
          actions,
          comments,
          shares
        };
      });
      
      res.json({
        timeSeries,
        currentScore: timeSeries[timeSeries.length - 1].score,
        averageScore: Math.floor(
          timeSeries.reduce((sum, item) => sum + item.score, 0) / timeSeries.length
        ),
        trend: "increasing"  // could be "increasing", "decreasing", or "stable"
      });
    } catch (error: any) {
      log.error({ err: error }, "Error fetching engagement history");
      res.status(500).json({ error: "Failed to fetch engagement history" });
    }
  });
}