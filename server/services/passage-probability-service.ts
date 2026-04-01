// Service to calculate bill passage probabilities
import { db } from '../db';
import { eq, desc, count } from 'drizzle-orm';
import { bills, billHistoryEvents } from '@shared/schema';
import { InsertBillPassageProbability } from '@shared/schema-trending';
import { createLogger } from "../logger";
const log = createLogger("passage-probability-service");


/**
 * Calculate passage probability for a bill based on various factors
 * @param billId The ID of the bill to analyze
 * @returns A probability data object or null if bill not found
 */
export async function computePassageProbability(billId: string): Promise<InsertBillPassageProbability | null> {
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

    // Get bill history events
    const historyEvents = await db
      .select()
      .from(billHistoryEvents).$dynamic()
      .where(eq(billHistoryEvents.billId, billId))
      .orderBy(desc(billHistoryEvents.eventDate));

    // Get committee information (could be from a separate table)
    const committeeInfo: any[] = []; // Placeholder

    // Calculate base probability based on stage in legislative process
    let passageProbability = calculateStageProbability(bill, historyEvents);
    
    // Adjust probability based on committee influence
    const committeeFactor = calculateCommitteeFactor(committeeInfo);
    passageProbability = (passageProbability * 0.7) + (committeeFactor * 0.3);
    
    // Adjust probability based on sponsor influence
    const sponsorFactor = calculateSponsorFactor(bill);
    passageProbability = (passageProbability * 0.8) + (sponsorFactor * 0.2);
    
    // Adjust probability based on topic trends
    const topicFactor = calculateTopicFactor(bill);
    passageProbability = (passageProbability * 0.9) + (topicFactor * 0.1);
    
    // Calculate momentum (rate of change)
    const momentum = calculateMomentum(bill, historyEvents, committeeInfo);
    
    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(bill, historyEvents);
    
    // Calculate stage-by-stage odds
    const stageOdds = calculateStageOdds(bill, historyEvents, passageProbability);
    
    // Prepare reasoning factors
    const reasoningFactors = {
      stageProgress: {
        factor: "Legislative Stage",
        description: describeStageProgress(bill, historyEvents),
        influence: "high"
      },
      committeeInfluence: {
        factor: "Committee Consideration",
        description: describeCommitteeInfluence(committeeInfo),
        influence: "medium"
      },
      sponsorInfluence: {
        factor: "Bill Sponsors",
        description: describeSponsorInfluence(bill),
        influence: "medium"
      },
      topicTrends: {
        factor: "Topic Trends",
        description: describeTopicTrends(bill),
        influence: "low"
      }
    };

    // Return the calculated probability data
    return {
      billId,
      passageProbability: passageProbability.toString(),
      stageOdds,
      reasoningFactors,
      momentum,
      confidenceScore,
      similarBillsData: computeSimilarBillsData(bill)
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error computing passage probability');
    return null;
  }
}

/**
 * Calculate the probability based on the bill's stage in the legislative process
 */
function calculateStageProbability(bill: any, historyEvents: any[]): number {
  // Simplified estimation model based on legislative stages
  const totalStages = 10; // From introduction to becoming law
  let currentStage = 1; // Default to introduction
  
  // Legislative process stages approximately ordered
  const stageKeywords = [
    'introduced', 'referred to committee', 'scheduled for hearing',
    'reported from committee', 'placed on calendar', 'passed first chamber',
    'referred to second chamber', 'reported from second committee',
    'passed second chamber', 'sent to governor', 'signed into law'
  ];
  
  // Determine the current stage based on history events
  for (const event of historyEvents) {
    for (let i = 0; i < stageKeywords.length; i++) {
      const keyword = stageKeywords[i];
      if (event.action.toLowerCase().includes(keyword)) {
        currentStage = Math.max(currentStage, i + 1);
      }
    }
  }
  
  // Calculate probability based on historical success rates at each stage
  const stageSuccessRates = [
    90, // Bills get introduced (nearly 100%)
    70, // Referred to committee
    50, // Scheduled for hearing
    40, // Reported from committee
    35, // Placed on calendar
    30, // Passed first chamber
    25, // Referred to second chamber
    20, // Reported from second committee
    15, // Passed second chamber
    10, // Sent to governor
    5   // Signed into law (roughly 5% of bills become law)
  ];
  
  // Use the success rate of the current stage
  const stageProbability = stageSuccessRates[Math.min(currentStage - 1, stageSuccessRates.length - 1)];
  
  return stageProbability;
}

/**
 * Calculate the committee influence factor
 */
function calculateCommitteeFactor(committeeInfo: any[]): number {
  // Default factor if no committee info is available
  if (!committeeInfo || committeeInfo.length === 0) {
    return 50; // Neutral factor
  }
  
  // In a full implementation, this would analyze committee power, past bill success rates, etc.
  // For now, return a baseline factor
  return 50;
}

/**
 * Calculate the sponsor influence factor
 */
function calculateSponsorFactor(bill: any): number {
  // Default factor if no sponsors or simplified implementation
  if (!bill.sponsors || bill.sponsors.length === 0) {
    return 50; // Neutral factor
  }
  
  // In a full implementation, this would analyze sponsor influence, seniority, etc.
  // For now, use the number of sponsors as a simple measure
  const sponsorCount = bill.sponsors.length;
  const sponsorFactor = Math.min(75, 40 + sponsorCount * 5);
  
  return sponsorFactor;
}

/**
 * Calculate topic-based passage factor
 */
function calculateTopicFactor(bill: any): number {
  // Default factor if no topics or simplified implementation
  if (!bill.topics || bill.topics.length === 0) {
    return 50; // Neutral factor
  }
  
  // In a full implementation, this would analyze topic-specific success rates
  // For now, return a neutral factor
  return 50;
}

/**
 * Calculate odds for passing each legislative stage
 */
function calculateStageOdds(bill: any, historyEvents: any[], overallProbability: number): any {
  // Legislative stages with decreasing probability
  const stages = [
    { name: "Committee", probability: 0 },
    { name: "House Floor", probability: 0 },
    { name: "Senate Committee", probability: 0 },
    { name: "Senate Floor", probability: 0 },
    { name: "Governor's Desk", probability: 0 }
  ];
  
  // Adjust probabilities based on bill's progress
  let clearedStages = 0;
  let inCommittee = false;
  let inHouse = true; // Default to House first
  let inSenate = false;
  let onGovernorsDesk = false;
  
  // Parse history to determine current stage
  for (const event of historyEvents) {
    const action = event.action.toLowerCase();
    
    if (action.includes('referred to committee')) {
      inCommittee = true;
    } else if (action.includes('reported from committee')) {
      inCommittee = false;
      clearedStages++;
    } else if (action.includes('passed house') || action.includes('passed first chamber')) {
      inHouse = false;
      inSenate = true;
      clearedStages++;
    } else if (action.includes('passed senate') || action.includes('passed second chamber')) {
      inSenate = false;
      onGovernorsDesk = true;
      clearedStages++;
    } else if (action.includes('signed') || action.includes('enacted')) {
      onGovernorsDesk = false;
      clearedStages++;
    }
  }
  
  // Distribute probability among remaining stages
  // The further along in the process, the higher the probability
  for (let i = 0; i < stages.length; i++) {
    if (i < clearedStages) {
      stages[i].probability = 100; // Completed stages have 100% probability
    } else {
      // Decrease probability for each subsequent stage
      const remainingStages = stages.length - clearedStages;
      if (remainingStages > 0) {
        const baseProb = overallProbability * 1.5; // Boost base probability for conversion to odds
        stages[i].probability = Math.max(1, Math.min(99, baseProb * (1 - (0.15 * (i - clearedStages)))));
      }
    }
  }
  
  // Convert probabilities to odds representation (e.g. "3:1")
  const stageOdds = stages.map(stage => {
    const prob = stage.probability;
    if (prob >= 99) return { stage: stage.name, odds: "Passed", probability: 100 };
    if (prob <= 1) return { stage: stage.name, odds: "100:1", probability: 1 };
    
    // Calculate odds against (e.g., 75% = 1:3 odds against)
    const oddsAgainst = Math.round((100 - prob) / prob * 10) / 10;
    // Format as "X:1" or "1:X"
    const oddsString = oddsAgainst >= 1 ? 
      `${oddsAgainst}:1` : 
      `1:${Math.round(1/oddsAgainst * 10) / 10}`;
    
    return { stage: stage.name, odds: oddsString, probability: prob };
  });
  
  return stageOdds;
}

/**
 * Calculate momentum (direction of probability change)
 * Returns a value from -100 to 100 indicating momentum
 */
function calculateMomentum(bill: any, historyEvents: any[], committeeInfo: any[]): number {
  // Default neutral momentum
  let momentum = 0;
  
  // If no recent activity, reduce momentum
  if (!bill.lastActionAt) return -20;
  
  const lastActionDate = new Date(bill.lastActionAt);
  const daysSinceLastAction = Math.floor((Date.now() - lastActionDate.getTime()) / (1000 * 3600 * 24));
  
  // Recent activity boosts momentum
  if (daysSinceLastAction < 7) {
    momentum += 30;
  } else if (daysSinceLastAction < 30) {
    momentum += 10;
  } else if (daysSinceLastAction > 60) {
    momentum -= 30; // Significant time without action reduces momentum
  }
  
  // Significant progress in legislative process boosts momentum
  if (historyEvents.length > 0) {
    const recentEvents = historyEvents.filter(e => {
      const eventDate = new Date(e.eventDate);
      return (Date.now() - eventDate.getTime()) < (30 * 24 * 3600 * 1000); // Last 30 days
    });
    
    momentum += recentEvents.length * 10; // Each recent event adds momentum
    
    // Check for key positive events
    for (const event of recentEvents) {
      const action = event.action.toLowerCase();
      if (action.includes('passed') || action.includes('approved') || action.includes('reported favorably')) {
        momentum += 15;
      } else if (action.includes('postponed') || action.includes('delayed')) {
        momentum -= 15;
      }
    }
  }
  
  // Limit momentum to -100 to 100 range
  return Math.max(-100, Math.min(100, momentum));
}

/**
 * Calculate confidence score in the prediction (0-100)
 */
function calculateConfidenceScore(bill: any, historyEvents: any[]): number {
  // More events generally means more data to work with, increasing confidence
  const eventCount = historyEvents.length;
  let confidenceScore = Math.min(100, 40 + eventCount * 5);
  
  // Reduce confidence for bills without much progress
  if (eventCount < 3) {
    confidenceScore = Math.max(30, confidenceScore - 20);
  }
  
  // More recent bills have more relevant data
  if (bill.introducedAt) {
    const introducedDate = new Date(bill.introducedAt);
    const monthsActive = Math.floor((Date.now() - introducedDate.getTime()) / (1000 * 3600 * 24 * 30));
    
    if (monthsActive > 24) {
      confidenceScore = Math.max(20, confidenceScore - 30); // Very old bills have less predictable patterns
    } else if (monthsActive < 1) {
      confidenceScore = Math.max(20, confidenceScore - 20); // Very new bills have little history
    }
  }
  
  return Math.max(0, Math.min(100, confidenceScore));
}

/**
 * Get data for similar bills for comparison
 */
function computeSimilarBillsData(bill: any): any {
  // This would ideally fetch similar bills and their outcomes
  // For now, return a placeholder for the structure
  return {
    similarBillCount: 0,
    passageRate: 0,
    averageTimeToPassage: 0,
    examples: []
  };
}

// Description functions for the reasoning factors

function describeStageProgress(bill: any, historyEvents: any[]): string {
  if (historyEvents.length === 0) {
    return "Bill has been introduced but has not progressed through any legislative stages yet.";
  }
  
  // Get the most recent event
  const latestEvent = historyEvents[historyEvents.length - 1];
  return `Bill is currently at the "${latestEvent.action}" stage in the ${latestEvent.chamber} chamber.`;
}

function describeCommitteeInfluence(committeeInfo: any[]): string {
  if (!committeeInfo || committeeInfo.length === 0) {
    return "No committee data available for analysis.";
  }
  
  return `Bill has been considered by ${committeeInfo.length} committee(s).`;
}

function describeSponsorInfluence(bill: any): string {
  if (!bill.sponsors || bill.sponsors.length === 0) {
    return "No sponsor data available for analysis.";
  }
  
  return `Bill has ${bill.sponsors.length} sponsor(s), which provides some positive influence on passage.`;
}

function describeTopicTrends(bill: any): string {
  if (!bill.topics || bill.topics.length === 0) {
    return "No topic data available for analysis.";
  }
  
  return `Bill's topics (${bill.topics.join(', ')}) have a moderate passage rate historically.`;
}