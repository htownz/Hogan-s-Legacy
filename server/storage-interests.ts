// @ts-nocheck
import { db } from "./db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { 
  userInterests, 
  UserInterests,
  InsertUserInterests,
  billRecommendations,
  BillRecommendation,
  InsertBillRecommendation,
  userInterestHistory,
  UserInterestHistory,
  InsertUserInterestHistory
} from "@shared/schema-recommendations";
import { Bill, bills } from "@shared/schema";
import { generateBillRecommendations, UserProfile } from "./services/bill-recommendation-service";
import { storage } from "./storage";

/**
 * Get user interests
 * @param userId The user ID
 * @returns Array of user interests or empty array if none exist
 */
export async function getUserInterests(userId: number): Promise<UserInterests[]> {
  try {
    return await db.select().from(userInterests).$dynamic().where(eq(userInterests.userId, userId));
  } catch (error: any) {
    console.error("Error getting user interests:", error);
    return [];
  }
}

/**
 * Create user interests
 * @param data The user interests data to insert
 * @returns The created user interests record
 */
export async function createUserInterests(data: InsertUserInterests): Promise<UserInterests[]> {
  try {
    // Convert settings to JSON string if it's an object
    let dataToInsert = { ...data };
    if (typeof dataToInsert.settings === 'object' && dataToInsert.settings !== null) {
      dataToInsert.settings = JSON.stringify(dataToInsert.settings);
    }
    
    return await db.insert(userInterests).values(dataToInsert).returning();
  } catch (error: any) {
    console.error("Error creating user interests:", error);
    return [];
  }
}

/**
 * Update user interests
 * @param userId The user ID
 * @param data The updated interests data
 * @returns The updated user interests record
 */
export async function updateUserInterests(userId: number, data: Partial<InsertUserInterests>): Promise<UserInterests[]> {
  try {
    // Convert settings to JSON string if it's an object
    let dataToUpdate = { ...data };
    if (typeof dataToUpdate.settings === 'object' && dataToUpdate.settings !== null) {
      dataToUpdate.settings = JSON.stringify(dataToUpdate.settings);
    }
    
    return await db
      .update(userInterests)
      .set({
        ...dataToUpdate,
        updatedAt: new Date()
      })
      .where(eq(userInterests.userId, userId))
      .returning();
  } catch (error: any) {
    console.error("Error updating user interests:", error);
    return [];
  }
}

/**
 * Delete user interests
 * @param userId The user ID
 * @returns True if successful, false otherwise
 */
export async function deleteUserInterests(userId: number): Promise<boolean> {
  try {
    const result = await db
      .delete(userInterests)
      .where(eq(userInterests.userId, userId));
    
    return true;
  } catch (error: any) {
    console.error("Error deleting user interests:", error);
    return false;
  }
}

interface RecommendationOptions {
  limit?: number;
  offset?: number;
  includeViewed?: boolean;
  includeDismissed?: boolean;
  minScore?: number;
}

/**
 * Get bill recommendations for a user
 * @param userId The user ID
 * @param options Optional query parameters
 * @returns Array of bill recommendations
 */
export async function getUserBillRecommendations(
  userId: number,
  options: RecommendationOptions = {}
): Promise<BillRecommendation[]> {
  try {
    const { 
      limit = 10, 
      offset = 0,
      includeViewed = false,
      includeDismissed = false,
      minScore = 0
    } = options;
    
    // Build conditions array
    const conditions = [eq(billRecommendations.userId, userId)];
    
    // Add filter conditions
    if (!includeViewed) {
      conditions.push(eq(billRecommendations.viewed, false));
    }
    
    if (!includeDismissed) {
      conditions.push(eq(billRecommendations.dismissed, false));
    }
    
    if (minScore > 0) {
      conditions.push(gte(billRecommendations.score, minScore));
    }
    
    // Execute query with all conditions
    const query = db.select()
      .from(billRecommendations).$dynamic()
      .where(and(...conditions))
      .orderBy(desc(billRecommendations.score))
      .limit(limit)
      .offset(offset);
    
    return await query;
  } catch (error: any) {
    console.error("Error getting bill recommendations:", error);
    return [];
  }
}

/**
 * Get a specific bill recommendation
 * @param id The recommendation ID
 * @returns The bill recommendation or null if not found
 */
export async function getBillRecommendation(id: number): Promise<BillRecommendation | null> {
  try {
    const results = await db
      .select()
      .from(billRecommendations).$dynamic()
      .where(eq(billRecommendations.id, id))
      .limit(1);
    
    return results.length > 0 ? results[0] : null;
  } catch (error: any) {
    console.error("Error getting bill recommendation:", error);
    return null;
  }
}

/**
 * Create a bill recommendation
 * @param data The recommendation data
 * @returns The created recommendation
 */
export async function createBillRecommendation(data: InsertBillRecommendation): Promise<BillRecommendation[]> {
  try {
    return await db.insert(billRecommendations).values(data).returning();
  } catch (error: any) {
    console.error("Error creating bill recommendation:", error);
    return [];
  }
}

/**
 * Update a bill recommendation's status (viewed, saved, dismissed)
 * @param id The recommendation ID
 * @param status The status fields to update
 * @returns The updated recommendation
 */
export async function updateBillRecommendationStatus(
  id: number,
  status: { viewed?: boolean; saved?: boolean; dismissed?: boolean }
): Promise<BillRecommendation[]> {
  try {
    return await db
      .update(billRecommendations)
      .set({
        ...status,
        updatedAt: new Date()
      })
      .where(eq(billRecommendations.id, id))
      .returning();
  } catch (error: any) {
    console.error("Error updating bill recommendation status:", error);
    return [];
  }
}

/**
 * Generate recommendations for a user based on their interests
 * @param userId The user ID
 * @param limit Maximum number of recommendations to generate
 * @returns Array of created recommendation records
 */
export async function generateRecommendationsForUser(
  userId: number,
  limit: number = 5
): Promise<BillRecommendation[]> {
  try {
    // Get user interests
    const userInterestsData = await getUserInterests(userId);
    
    if (userInterestsData.length === 0) {
      return [];
    }
    
    const interests = userInterestsData[0];
    
    // Get all bills
    const allBills = await storage.getAllBills(); // Get bills from main storage
    
    // Create user profile from interests
    const userProfile: UserProfile = {
      userId,
      interests: [...(interests.topics || []), ...(interests.causes || []), ...(interests.keywords || [])]
    };
    
    // If settings is stored as a JSON string, parse it
    try {
      if (interests.settings && typeof interests.settings === 'string') {
        const settings = JSON.parse(interests.settings);
        
        // Add demographic data from settings if available
        if (settings.location) userProfile.location = settings.location;
        if (settings.occupation) userProfile.occupation = settings.occupation;
        if (settings.age) userProfile.age = settings.age;
        if (settings.familyStatus) userProfile.familyStatus = settings.familyStatus;
        if (settings.income) userProfile.income = settings.income;
        if (settings.education) userProfile.education = settings.education;
      }
    } catch (e: any) {
      console.error("Error parsing user interests settings:", e);
    }
    
    // Generate recommendations using OpenAI
    const recommendations = await generateBillRecommendations(userProfile, allBills, limit);
    
    // Store recommendations in database
    const createdRecommendations: BillRecommendation[] = [];
    
    for (const rec of recommendations) {
      // Check if this recommendation already exists
      const existingRecs = await db
        .select()
        .from(billRecommendations).$dynamic()
        .where(
          and(
            eq(billRecommendations.userId, userId),
            eq(billRecommendations.billId, rec.billId)
          )
        );
      
      // Skip if already recommended
      if (existingRecs.length > 0) {
        continue;
      }
      
      // Create new recommendation
      const insertData: InsertBillRecommendation = {
        userId,
        billId: rec.billId,
        score: rec.relevanceScore,
        reason: rec.reason,
        matchedInterests: rec.matchedInterests || [],
        personalImpact: rec.personalImpact,
        impactAreas: rec.impactAreas || [],
        familyImpact: rec.familyImpact,
        communityImpact: rec.communityImpact,
        viewed: false,
        saved: false,
        dismissed: false
      };
      
      const created = await createBillRecommendation(insertData);
      if (created.length > 0) {
        createdRecommendations.push(created[0]);
      }
    }
    
    return createdRecommendations;
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}

/**
 * Get recommended bills with full bill details
 * @param userId The user ID
 * @param options Optional query parameters
 * @returns Array of recommendations with bill details
 */
export async function getRecommendedBillsWithDetails(
  userId: number,
  options: RecommendationOptions = {}
): Promise<(BillRecommendation & { bill: Bill })[]> {
  try {
    const { 
      limit = 10, 
      offset = 0,
      includeViewed = false,
      includeDismissed = false,
      minScore = 0
    } = options;
    
    // Use a JOIN query to get recommendations with bill details
    const results = await db
      .select({
        id: billRecommendations.id,
        userId: billRecommendations.userId,
        billId: billRecommendations.billId,
        score: billRecommendations.score,
        reason: billRecommendations.reason,
        matchedInterests: billRecommendations.matchedInterests,
        personalImpact: billRecommendations.personalImpact,
        impactAreas: billRecommendations.impactAreas,
        familyImpact: billRecommendations.familyImpact,
        communityImpact: billRecommendations.communityImpact,
        viewed: billRecommendations.viewed,
        saved: billRecommendations.saved,
        dismissed: billRecommendations.dismissed,
        createdAt: billRecommendations.createdAt,
        updatedAt: billRecommendations.updatedAt,
        bill: sql<Bill>`json_build_object(
          'id', ${bills.id},
          'title', ${bills.title},
          'description', ${bills.description},
          'status', ${bills.status},
          'introducedAt', ${bills.introducedAt},
          'lastActionAt', ${bills.lastActionAt},
          'sponsors', ${bills.sponsors},
          'topics', ${bills.topics}
        )`
      })
      .from(billRecommendations)
      .innerJoin(bills, eq(billRecommendations.billId, bills.id))
      .where(eq(billRecommendations.userId, userId));
    
    // Add filters
    const filtered = results.filter(rec => {
      if (!includeViewed && rec.viewed) return false;
      if (!includeDismissed && rec.dismissed) return false;
      if (minScore > 0 && rec.score < minScore) return false;
      return true;
    });
    
    // Sort by score and apply pagination
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(offset, offset + limit);
  } catch (error: any) {
    console.error("Error getting recommendations with details:", error);
    return [];
  }
}