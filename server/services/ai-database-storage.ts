// @ts-nocheck
import { db } from "../db";
import { 
  aiAlertEnhancements,
  legislativeSentimentAnalysis,
  legislativePredictions,
  alertClusters,
  userAlertPreferences,
  legislativeActivityMetrics,
  aiModelPerformance
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { createLogger } from "../logger";
const log = createLogger("ai-database-storage");


/**
 * AI Database Storage Service
 * Manages intelligent data storage for the AI-powered alert system
 */

export class AIDatabaseStorage {

  // AI Alert Enhancement Operations
  async saveAlertEnhancement(alertData: any) {
    log.info("💾 Saving AI alert enhancement to database...");
    
    try {
      const [enhancement] = await db
        .insert(aiAlertEnhancements)
        .values({
          alertId: alertData.id,
          impactScore: alertData.impactScore,
          personalRelevance: alertData.personalRelevance,
          actionPriority: alertData.actionPriority,
          smartSummary: alertData.smartSummary,
          suggestedActions: alertData.suggestedActions,
          relatedTopics: alertData.relatedTopics,
          aiConfidence: alertData.aiConfidence || 0.8
        })
        .returning();
      
      return enhancement;
    } catch (error: any) {
      log.error({ err: error }, 'Error saving alert enhancement');
      throw error;
    }
  }

  async getAlertEnhancement(alertId: string) {
    try {
      const [enhancement] = await db
        .select()
        .from(aiAlertEnhancements).$dynamic()
        .where(eq(aiAlertEnhancements.alertId, alertId))
        .limit(1);
      
      return enhancement;
    } catch (error: any) {
      log.error({ err: error }, 'Error retrieving alert enhancement');
      return null;
    }
  }

  // Sentiment Analysis Operations
  async saveSentimentAnalysis(sentimentData: any) {
    log.info("😊 Saving sentiment analysis to database...");
    
    try {
      const [sentiment] = await db
        .insert(legislativeSentimentAnalysis)
        .values({
          analysisDate: new Date(),
          overallSentiment: sentimentData.overallSentiment,
          sentimentScore: sentimentData.sentimentScore,
          publicMood: sentimentData.publicMood,
          engagementLevel: sentimentData.engagementLevel,
          urgencyLevel: sentimentData.urgencyLevel,
          democraticHealth: sentimentData.democraticHealth,
          recommendations: sentimentData.recommendations,
          dataSources: ['Texas Legislature Online', 'AI Analysis']
        })
        .returning();
      
      return sentiment;
    } catch (error: any) {
      log.error({ err: error }, 'Error saving sentiment analysis');
      throw error;
    }
  }

  async getLatestSentimentAnalysis() {
    try {
      const [sentiment] = await db
        .select()
        .from(legislativeSentimentAnalysis)
        .orderBy(desc(legislativeSentimentAnalysis.analysisDate))
        .limit(1);
      
      return sentiment;
    } catch (error: any) {
      log.error({ err: error }, 'Error retrieving sentiment analysis');
      return null;
    }
  }

  // Predictive Analysis Operations
  async savePredictiveAnalysis(predictionData: any) {
    log.info("🔮 Saving predictive analysis to database...");
    
    try {
      const [prediction] = await db
        .insert(legislativePredictions)
        .values({
          predictionDate: new Date(),
          predictions: predictionData.predictions,
          hotCommittees: predictionData.hotCommittees,
          advancingBills: predictionData.advancingBills,
          emergingPriorities: predictionData.emergingPriorities,
          engagementOpportunities: predictionData.engagementOpportunities,
          confidenceLevel: predictionData.confidence,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
        })
        .returning();
      
      return prediction;
    } catch (error: any) {
      log.error({ err: error }, 'Error saving predictive analysis');
      throw error;
    }
  }

  async getLatestPredictions() {
    try {
      const [prediction] = await db
        .select()
        .from(legislativePredictions)
        .orderBy(desc(legislativePredictions.predictionDate))
        .limit(1);
      
      return prediction;
    } catch (error: any) {
      log.error({ err: error }, 'Error retrieving predictions');
      return null;
    }
  }

  // Alert Clustering Operations
  async saveAlertClusters(clusterData: any) {
    log.info("🧩 Saving alert clusters to database...");
    
    try {
      const clusters = [];
      
      for (const cluster of clusterData.clusters) {
        const [savedCluster] = await db
          .insert(alertClusters)
          .values({
            clusterName: cluster.name,
            theme: cluster.theme,
            urgency: cluster.urgency,
            summary: cluster.summary,
            actionItems: cluster.actionItems,
            alertIds: cluster.alertIds,
            clusterDate: new Date()
          })
          .returning();
        
        clusters.push(savedCluster);
      }
      
      return clusters;
    } catch (error: any) {
      log.error({ err: error }, 'Error saving alert clusters');
      throw error;
    }
  }

  // Activity Metrics Operations
  async saveActivityMetrics(metricsData: any) {
    log.info("📊 Saving legislative activity metrics...");
    
    try {
      const [metrics] = await db
        .insert(legislativeActivityMetrics)
        .values({
          metricDate: new Date(),
          totalAlerts: metricsData.totalAlerts || 0,
          committeeMeetings: metricsData.committeeMeetings || 0,
          billUpdates: metricsData.billUpdates || 0,
          votingActivities: metricsData.votingActivities || 0,
          emergencyAlerts: metricsData.emergencyAlerts || 0,
          averageImpactScore: metricsData.averageImpactScore,
          mostActiveCommittees: metricsData.mostActiveCommittees,
          trendingTopics: metricsData.trendingTopics
        })
        .returning();
      
      return metrics;
    } catch (error: any) {
      log.error({ err: error }, 'Error saving activity metrics');
      throw error;
    }
  }

  // User Preferences Operations
  async saveUserPreferences(userId: string, preferences: any) {
    log.info("🎯 Saving user alert preferences...");
    
    try {
      const [userPrefs] = await db
        .insert(userAlertPreferences)
        .values({
          userId,
          interests: preferences.interests,
          priorityTopics: preferences.priorityTopics,
          location: preferences.location,
          notificationFrequency: preferences.notificationFrequency,
          impactThreshold: preferences.impactThreshold || 5
        })
        .onConflictDoUpdate({
          target: userAlertPreferences.userId,
          set: {
            interests: preferences.interests,
            priorityTopics: preferences.priorityTopics,
            location: preferences.location,
            notificationFrequency: preferences.notificationFrequency,
            impactThreshold: preferences.impactThreshold,
            updatedAt: new Date()
          }
        })
        .returning();
      
      return userPrefs;
    } catch (error: any) {
      log.error({ err: error }, 'Error saving user preferences');
      throw error;
    }
  }

  async getUserPreferences(userId: string) {
    try {
      const [preferences] = await db
        .select()
        .from(userAlertPreferences).$dynamic()
        .where(eq(userAlertPreferences.userId, userId))
        .limit(1);
      
      return preferences;
    } catch (error: any) {
      log.error({ err: error }, 'Error retrieving user preferences');
      return null;
    }
  }

  // AI Model Performance Tracking
  async trackModelPerformance(modelType: string, performanceData: any) {
    log.info(`🧠 Tracking AI model performance for ${modelType}...`);
    
    try {
      const [performance] = await db
        .insert(aiModelPerformance)
        .values({
          modelType,
          accuracyScore: performanceData.accuracyScore,
          processingTimeMs: performanceData.processingTimeMs,
          inputSize: performanceData.inputSize,
          successRate: performanceData.successRate,
          errorDetails: performanceData.errorDetails,
          modelVersion: performanceData.modelVersion || 'claude-3-7-sonnet-20250219',
          testDate: new Date()
        })
        .returning();
      
      return performance;
    } catch (error: any) {
      log.error({ err: error }, 'Error tracking model performance');
      throw error;
    }
  }

  // Analytics and Insights
  async getAIDashboardSummary() {
    log.info("📈 Generating AI dashboard summary...");
    
    try {
      // Get recent activity metrics
      const recentAlerts = await db
        .select()
        .from(aiAlertEnhancements).$dynamic()
        .where(gte(aiAlertEnhancements.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
        .limit(100);

      const latestSentiment = await this.getLatestSentimentAnalysis();
      const latestPredictions = await this.getLatestPredictions();

      const summary = {
        alertsLastWeek: recentAlerts.length,
        averageImpactScore: recentAlerts.length > 0 
          ? recentAlerts.reduce((sum, alert) => sum + (alert.impactScore || 0), 0) / recentAlerts.length
          : 0,
        currentSentiment: latestSentiment?.overallSentiment || 'neutral',
        latestPredictionConfidence: latestPredictions?.confidenceLevel || 'medium',
        aiEnhancedAlerts: recentAlerts.filter(alert => alert.aiConfidence && alert.aiConfidence > 0.7).length
      };

      return summary;
    } catch (error: any) {
      log.error({ err: error }, 'Error generating dashboard summary');
      return {
        alertsLastWeek: 0,
        averageImpactScore: 0,
        currentSentiment: 'neutral',
        latestPredictionConfidence: 'medium',
        aiEnhancedAlerts: 0
      };
    }
  }
}

export const aiDatabaseStorage = new AIDatabaseStorage();