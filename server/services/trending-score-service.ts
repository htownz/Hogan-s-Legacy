// Service to calculate bill trending scores
import { db } from '../db';
import { eq, sql, desc, and, gt, count, gte, lte } from 'drizzle-orm';
import { 
  bills, 
  userBillTracking, 
  personalImpactAssessments, 
  billHistoryEvents
} from '@shared/schema';
import { billAnnotations } from '@shared/schema-annotations';
import { InsertTrendingBillMetric, trendingBillMetrics } from '@shared/schema-trending';
import { createLogger } from "../logger";
const log = createLogger("trending-score-service");


/**
 * Calculate trending score for a bill based on various engagement metrics
 * @param billId The ID of the bill to analyze
 * @returns A trending data object or null if bill not found
 */
export async function calculateTrendingScore(billId: string): Promise<InsertTrendingBillMetric | null> {
  try {
    // Get the bill info
    const [bill] = await db
      .select()
      .from(bills).$dynamic()
      .where(eq(bills.id, billId))
      .limit(1);

    if (!bill) {
      log.error(`Bill ${billId} not found`);
      return null;
    }

    // Get current tracking count
    const [trackingData] = await db
      .select({ count: count() })
      .from(userBillTracking).$dynamic()
      .where(eq(userBillTracking.billId, billId));
    
    const currentTrackingCount = trackingData?.count || 0;

    // Get tracking count from 7 days ago (approximation for now)
    // In a complete implementation, this would use historical tracking data
    const previousTrackingCount = Math.floor(currentTrackingCount * 0.8); // Assume 20% growth as a placeholder
    
    // Calculate weekly view change percentage
    const weeklyViewChange = previousTrackingCount > 0 ? 
      Math.floor(((currentTrackingCount - previousTrackingCount) / previousTrackingCount) * 100) : 
      100; // If no previous data, assume 100% growth

    // Get recent annotations count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [annotationsData] = await db
      .select({ count: count() })
      .from(billAnnotations).$dynamic()
      .where(and(
        eq(billAnnotations.billId, billId),
        gte(billAnnotations.createdAt, sevenDaysAgo)
      ));
    
    const newAnnotations = annotationsData?.count || 0;

    // Get recent impact assessments as a proxy for engagement
    const [assessmentsData] = await db
      .select({ count: count() })
      .from(personalImpactAssessments).$dynamic()
      .where(and(
        eq(personalImpactAssessments.billId, billId),
        gte(personalImpactAssessments.generatedAt, sevenDaysAgo)
      ));
    
    const recentAssessments = assessmentsData?.count || 0;

    // Calculate the trending score
    let trendingScore = calculateScore(
      currentTrackingCount,
      weeklyViewChange,
      newAnnotations,
      recentAssessments
    );

    // Get the historical scores (or create a new historical record)
    const historicalScores = await getHistoricalScores(billId, trendingScore);

    // Return the trending data
    return {
      billId,
      trendingScore,
      weeklyViewChange,
      socialMentions: 0, // No social media data available yet
      newAnnotations,
      historicalScores
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error calculating trending score');
    return null;
  }
}

/**
 * Calculate a trending score from the various metrics
 */
function calculateScore(
  trackingCount: number,
  weeklyViewChange: number,
  newAnnotations: number,
  recentAssessments: number
): number {
  // Weights for different factors
  const TRACKING_WEIGHT = 0.3;
  const CHANGE_WEIGHT = 0.3;
  const ANNOTATION_WEIGHT = 0.25;
  const ASSESSMENT_WEIGHT = 0.15;
  
  // Normalize tracking count (0-100)
  const normalizedTracking = Math.min(100, trackingCount);
  
  // Normalize weekly change (0-100)
  const normalizedChange = Math.min(100, Math.max(0, weeklyViewChange + 50));
  
  // Normalize annotations (0-100)
  const normalizedAnnotations = Math.min(100, newAnnotations * 10);
  
  // Normalize assessments (0-100)
  const normalizedAssessments = Math.min(100, recentAssessments * 10);
  
  // Calculate weighted score
  const score = Math.round(
    normalizedTracking * TRACKING_WEIGHT +
    normalizedChange * CHANGE_WEIGHT +
    normalizedAnnotations * ANNOTATION_WEIGHT +
    normalizedAssessments * ASSESSMENT_WEIGHT
  );
  
  return score;
}

/**
 * Get or create historical trending scores
 */
async function getHistoricalScores(billId: string, currentScore: number): Promise<any> {
  // This is where we would typically fetch historical data from a time-series table
  // For now, we'll simulate historical data for demonstration
  
  // Get existing trending metrics if available
  const existingMetrics = await db
    .select()
    .from(trendingBillMetrics).$dynamic()
    .where(eq(trendingBillMetrics.billId, billId))
    .limit(1);
  
  if (existingMetrics.length > 0 && existingMetrics[0].historicalScores) {
    // Update existing historical scores by adding the current score
    const history = existingMetrics[0].historicalScores as any[];
    
    // Add new data point with current date and score
    history.push({
      date: new Date().toISOString(),
      score: currentScore
    });
    
    // Keep only the last 30 data points
    if (history.length > 30) {
      history.shift();
    }
    
    return history;
  } else {
    // Create new historical scores with the current score as the first data point
    return [{
      date: new Date().toISOString(),
      score: currentScore
    }];
  }
}