// @ts-nocheck
import OpenAI from "openai";
import { storage } from "../storage";
import { Bill } from "@shared/schema";
import { createLogger } from "../logger";
const log = createLogger("bill-recommendation-service");


export interface UserProfile {
  userId: number;
  interests: string[];
  location?: string;
  occupation?: string;
  age?: string;
  familyStatus?: string;
  income?: string;
  education?: string;
}

// Initialize OpenAI client
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Inference user interests from tracked bills and other activity
 */
export async function inferUserInterestsFromBills(bills: Bill[]): Promise<string[]> {
  try {
    // Don't proceed if no bills provided
    if (!bills.length) {
      return [];
    }

    // Extract relevant information from bills
    const billData = bills.map(bill => ({
      id: bill.id,
      title: bill.title,
      description: bill.description,
      status: bill.status,
      topics: bill.topics || []
    }));

    // Use OpenAI to extract topics of interest
    const prompt = `
      You are an expert legislative analyst. Based on the following bills a user is tracking, 
      identify 5-10 policy topics or interests that appear to be important to this user.
      
      Tracked Bills:
      ${JSON.stringify(billData, null, 2)}
      
      Return ONLY an array of strings representing policy topics/interests. For example:
      ["Education", "Healthcare", "Environment", "Criminal Justice"]
      
      Please identify specific policy areas, not just generic categories. 
      Be precise rather than broad in your analysis.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Parse the OpenAI response
    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }

    try {
      const parsedContent = JSON.parse(content);
      return Array.isArray(parsedContent.topics) ? parsedContent.topics : [];
    } catch (error: any) {
      log.error({ err: error }, "Error parsing OpenAI response");
      return [];
    }
  } catch (error: any) {
    log.error({ err: error }, "Error inferring user interests");
    return [];
  }
}

/**
 * Generate personalized bill recommendations for a user based on their interests
 */
export async function generateBillRecommendations(
  userId: number, 
  userInterests: { topics: string[], causes: string[], keywords: string[] }, 
  limit: number = 5
): Promise<any[]> {
  try {
    // Get all bills from storage
    const allBills = await storage.getAllBills({ limit: 100 });
    
    // Get user's already tracked bills to avoid duplicates
    const trackedBills = await storage.getUserTrackedBills(userId);
    const trackedBillIds = new Set(trackedBills.map((bill: any) => bill.id));
    
    // Filter out bills the user is already tracking
    const candidateBills = allBills.filter(bill => !trackedBillIds.has(bill.id));
    
    if (candidateBills.length === 0) {
      return [];
    }

    // Prepare data for OpenAI
    const billsData = candidateBills.map(bill => ({
      id: bill.id,
      title: bill.title,
      description: bill.description || "",
      status: bill.status,
      chamber: bill.chamber,
      introducedAt: bill.introducedAt,
      topics: bill.topics || []
    }));

    const interests = {
      topics: userInterests.topics || [],
      causes: userInterests.causes || [],
      keywords: userInterests.keywords || []
    };

    // Define prompt for OpenAI
    const prompt = `
      As an expert legislative analyst, recommend the most relevant bills for a user with the following interests.
      
      User Interests:
      ${JSON.stringify(interests, null, 2)}
      
      Available Bills:
      ${JSON.stringify(billsData, null, 2)}
      
      For each recommended bill, provide:
      1. The bill ID
      2. A relevance score (0.0-1.0) based on how well it matches the user's interests
      3. A brief explanation of why this bill would be relevant to the user
      4. Which specific interests it matches from the user's profile
      5. An assessment of the personal impact this bill could have on the user
      6. Up to 3 areas of life this bill might impact (e.g., "healthcare", "education", "taxes")
      7. A brief description of potential family impact (optional)
      8. A brief description of potential community impact (optional)
      
      Return your recommendations as a JSON array with ${limit} bills maximum. Format each recommendation as:
      {
        "billId": "TX-HB123",
        "score": 0.85,
        "reason": "This bill directly addresses healthcare accessibility which matches your interest in healthcare reform.",
        "matchedInterests": ["Healthcare", "Insurance"],
        "personalImpact": "This could reduce your prescription costs by expanding coverage requirements for insurers.",
        "impactAreas": ["Healthcare", "Insurance", "Consumer Protection"],
        "familyImpact": "Families with children could see expanded coverage for pediatric services.",
        "communityImpact": "Rural communities would gain better access to telehealth services."
      }
      
      Return recommendations ONLY in JSON format, with no additional text.
    `;

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }

    try {
      const parsedContent = JSON.parse(content);
      return Array.isArray(parsedContent.recommendations) 
        ? parsedContent.recommendations 
        : [];
    } catch (error: any) {
      log.error({ err: error }, "Error parsing OpenAI recommendations response");
      return [];
    }
  } catch (error: any) {
    log.error({ err: error }, "Error generating bill recommendations");
    return [];
  }
}

/**
 * Process and store generated recommendations in the database
 */
export async function processAndStoreRecommendations(
  userId: number, 
  recommendations: any[]
): Promise<any[]> {
  try {
    // Validation
    if (!recommendations.length) {
      return [];
    }

    const storedRecommendations = [];
    
    // Store each recommendation
    for (const rec of recommendations) {
      // Get the full bill object
      const bill = await storage.getBillById(rec.billId);
      if (!bill) {
        log.warn(`Bill ${rec.billId} not found, skipping recommendation`);
        continue;
      }
      
      // Store in database
      const storedRec = await storage.createBillRecommendation({
        userId,
        billId: rec.billId,
        score: rec.score,
        reason: rec.reason,
        matchedInterests: Array.isArray(rec.matchedInterests) ? rec.matchedInterests : [],
        personalImpact: rec.personalImpact || "",
        impactAreas: Array.isArray(rec.impactAreas) ? rec.impactAreas : [],
        familyImpact: rec.familyImpact || null,
        communityImpact: rec.communityImpact || null,
        viewed: false,
        saved: false,
        dismissed: false,
        createdAt: new Date().toISOString()
      });
      
      if (storedRec) {
        storedRecommendations.push(storedRec);
      }
    }
    
    return storedRecommendations;
  } catch (error: any) {
    log.error({ err: error }, "Error storing recommendations");
    return [];
  }
}