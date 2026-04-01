// @ts-nocheck
import { and, eq, desc, sql, inArray, isNull, or, not, asc } from "drizzle-orm";
import { db } from "./db";
import {
  userInterests,
  billRecommendations,
  interestInferences as interestInferenceData,
  InsertUserInterest as InsertUserInterests,
  InsertBillRecommendation,
  InsertInterestInference as InsertInterestInferenceData
} from "../shared/schema-recommendations";
import {
  userInterestHistory,
  InsertUserInterestHistory
} from "../shared/schema-user-interests";
import { bills } from "../shared/schema";
import { generatePersonalizedRecommendation, inferUserDemographics } from "./services/recommendation-service";
import { createLogger } from "./logger";
const log = createLogger("storage-recommendations");


// User interests management
export async function getUserInterests(userId: number) {
  return await db.select().from(userInterests).$dynamic().where(eq(userInterests.userId, userId));
}

export async function createUserInterests(data: InsertUserInterests) {
  return await db.insert(userInterests).values(data).returning();
}

export async function updateUserInterests(userId: number, data: Partial<InsertUserInterests>) {
  return await db
    .update(userInterests)
    .set(data)
    .where(eq(userInterests.userId, userId))
    .returning();
}

// Record user interest history
export async function recordUserInterestHistory(data: InsertUserInterestHistory) {
  return await db.insert(userInterestHistory).values(data).returning();
}

// Bill recommendations management
export async function getUserBillRecommendations(
  userId: number,
  options: {
    limit?: number;
    offset?: number;
    includeViewed?: boolean;
    includeDismissed?: boolean;
  } = {}
) {
  const { limit = 20, offset = 0, includeViewed = false, includeDismissed = false } = options;

  // Build conditions
  const conditions = [eq(billRecommendations.userId, userId)];
  
  // Apply filters based on options
  if (!includeViewed) {
    conditions.push(eq(billRecommendations.viewed, false));
  }

  if (!includeDismissed) {
    conditions.push(eq(billRecommendations.dismissed, false));
  }
  
  // Build the query with all conditions
  return await db
    .select({
      recommendation: billRecommendations,
      bill: bills
    })
    .from(billRecommendations)
    .leftJoin(bills, eq(billRecommendations.billId, bills.id))
    .where(and(...conditions))
    .orderBy(
      desc(billRecommendations.score),
      desc(billRecommendations.createdAt)
    )
    .limit(limit)
    .offset(offset);
}

// Update bill recommendation status (viewed, saved, dismissed)
export async function updateBillRecommendationStatus(
  userId: number,
  billId: string,
  data: {
    viewed?: boolean;
    saved?: boolean;
    dismissed?: boolean;
  }
) {
  const updateData: Partial<InsertBillRecommendation> = {
    ...data
  };
  
  return await db
    .update(billRecommendations)
    .set(updateData)
    .where(
      and(
        eq(billRecommendations.userId, userId),
        eq(billRecommendations.billId, billId)
      )
    )
    .returning();
}

// Record user interactions for interest inference
export async function recordUserInterestInference(data: InsertInterestInferenceData) {
  return await db.insert(interestInferenceData).values(data).returning();
}

// Algorithm to infer user interests based on their interactions
export async function inferUserInterests(userId: number) {
  // Get all user interactions
  const interactions = await db
    .select()
    .from(interestInferenceData).$dynamic()
    .where(eq(interestInferenceData.userId, userId))
    .orderBy(desc(interestInferenceData.createdAt));

  if (interactions.length === 0) {
    return null; // No data to infer from
  }

  // Extract and count topics from interactions
  const topicCounts = new Map<string, number>();
  const keywordSet = new Set<string>();
  const causeSet = new Set<string>();

  // Process interactions to build topic counts and keyword/cause sets
  for (const interaction of interactions) {
    if (interaction.topics && interaction.topics.length > 0) {
      for (const topic of interaction.topics) {
        const currentCount = topicCounts.get(topic) || 0;
        
        // Weight different actions differently
        let weight = 1;
        if (interaction.action === 'view') weight = 1;
        if (interaction.action === 'track') weight = 3;
        if (interaction.action === 'support') weight = 5;
        if (interaction.action === 'oppose') weight = 4;
        if (interaction.action === 'share') weight = 4;
        if (interaction.action === 'comment') weight = 2;
        
        topicCounts.set(topic, currentCount + weight);
        
        // Add to keyword set for search terms
        if (topic.includes(' ')) {
          // If it's a multi-word topic, add individual words as keywords
          const words = topic.split(' ').filter(word => word.length > 3);
          for (const word of words) {
            keywordSet.add(word.toLowerCase());
          }
        } else if (topic.length > 3) {
          // Single word topics are added directly
          keywordSet.add(topic.toLowerCase());
        }
        
        // Map topics to broader causes
        // This is a simplified example - in reality, would use a more sophisticated
        // topic-to-cause mapping potentially stored in the database
        if (topic.match(/education|school|student|teacher|learning|college|university/i)) {
          causeSet.add('Education');
        } else if (topic.match(/health|healthcare|medical|hospital|doctor|patient|medicare|medicaid/i)) {
          causeSet.add('Healthcare');
        } else if (topic.match(/environment|climate|pollution|conservation|energy|renewable|sustainability/i)) {
          causeSet.add('Environment');
        } else if (topic.match(/economy|economic|tax|budget|finance|fiscal|spending|debt/i)) {
          causeSet.add('Economy');
        } else if (topic.match(/immigration|immigrant|border|asylum|refugee/i)) {
          causeSet.add('Immigration');
        } else if (topic.match(/security|defense|military|veteran|war|terrorism|police|crime/i)) {
          causeSet.add('Security & Defense');
        } else if (topic.match(/civil right|voting|discrimination|equality|equity|justice/i)) {
          causeSet.add('Civil Rights');
        } else if (topic.match(/infrastructure|transportation|road|bridge|rail|transit/i)) {
          causeSet.add('Infrastructure');
        }
      }
    }
  }

  // Sort topics by count and take top 10
  const sortedTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);

  // Convert sets to arrays 
  const keywords = Array.from(keywordSet).slice(0, 20);
  const causes = Array.from(causeSet).slice(0, 5);

  // Check if user already has interests
  const existingInterests = await getUserInterests(userId);
  
  if (existingInterests.length > 0) {
    // Update existing interests
    return await updateUserInterests(userId, {
      topics: sortedTopics,
      keywords,
      causes
    });
  } else {
    // Create new interests
    return await createUserInterests({
      userId,
      topics: sortedTopics,
      keywords,
      causes
    });
  }
}

// Generate bill recommendations for a user based on their interests
export async function generateRecommendationsForUser(userId: number) {
  // Get user interests
  const userInterestsList = await getUserInterests(userId);
  
  if (userInterestsList.length === 0) {
    return []; // No interests to base recommendations on
  }
  
  const userInterestsData = userInterestsList[0];
  
  // Get active bills (not passed or failed)
  const activeBills = await db
    .select()
    .from(bills).$dynamic()
    .where(
      and(
        not(eq(bills.status, 'passed')),
        not(eq(bills.status, 'failed'))
      )
    )
    .orderBy(desc(bills.introducedAt));
  
  // Get bills user already has recommendations for
  const existingRecs = await db
    .select()
    .from(billRecommendations).$dynamic()
    .where(eq(billRecommendations.userId, userId));
  
  const existingBillIds = new Set(existingRecs.map(rec => rec.billId));
  
  // Get user interactions for demographics inference
  const interactions = await db
    .select()
    .from(interestInferenceData).$dynamic()
    .where(eq(interestInferenceData.userId, userId))
    .orderBy(desc(interestInferenceData.createdAt));
  
  // Infer user demographics from their interests and interactions
  const userDemographics = await inferUserDemographics(
    {
      topics: userInterestsData.topics ? [...userInterestsData.topics] : [],
      causes: userInterestsData.causes ? [...userInterestsData.causes] : [],
      keywords: userInterestsData.keywords ? [...userInterestsData.keywords] : []
    },
    interactions
  );
  
  // Process bills and generate personalized recommendations
  const recommendations = [];
  
  // We'll process a maximum of 30 bills to avoid overloading the OpenAI API
  const billsToProcess = activeBills
    .filter(bill => !existingBillIds.has(bill.id))
    .slice(0, 30);
  
  for (const bill of billsToProcess) {
    try {
      // Generate personalized recommendation with impact assessment
      const recommendation = await generatePersonalizedRecommendation(
        bill,
        {
          topics: userInterestsData.topics ? [...userInterestsData.topics] : [],
          causes: userInterestsData.causes ? [...userInterestsData.causes] : [],
          keywords: userInterestsData.keywords ? [...userInterestsData.keywords] : []
        },
        {
          location: userDemographics.location,
          occupation: userDemographics.occupation,
          demographics: userDemographics
        }
      );
      
      // Skip bills with very low relevance scores
      if (recommendation.score < 30) {
        continue;
      }
      
      // Create the recommendation record
      const newRec: InsertBillRecommendation = {
        userId,
        billId: bill.id,
        score: recommendation.score,
        reason: recommendation.reason,
        matchedInterests: recommendation.matchedInterests,
        personalImpact: recommendation.personalImpact,
        impactAreas: recommendation.impactAreas,
        familyImpact: recommendation.familyImpact,
        communityImpact: recommendation.communityImpact,
        viewed: false,
        saved: false,
        dismissed: false
      };
      
      const insertedRecs = await db
        .insert(billRecommendations)
        .values(newRec)
        .returning();
      
      recommendations.push(insertedRecs[0]);
    } catch (error: any) {
      log.error({ err: error }, `Error generating recommendation for bill ${bill.id}`);
      // Continue with next bill if one fails
    }
  }
  
  return recommendations;
}