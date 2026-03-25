import OpenAI from "openai";
import { Bill } from "@shared/schema";
import { generatePersonalImpactAssessment, UserDemographics } from "./openai-service";
import { insertBillRecommendationSchema } from "@shared/schema-recommendations";
import { z } from "zod";

/**
 * Generate personalized bill recommendation reason with impact assessment
 */
export async function generatePersonalizedRecommendation(
  bill: Bill,
  userInterests: {
    topics?: string[],
    causes?: string[],
    keywords?: string[]
  },
  userData?: {
    location?: string,
    occupation?: string,
    demographics?: any
  }
): Promise<{
  reason: string,
  score: number,
  matchedInterests: string[],
  personalImpact?: string,
  impactAreas?: string[],
  communityImpact?: string,
  familyImpact?: string
}> {
  try {
    // Combine user data into demographics object for impact assessment
    const userDemographics: UserDemographics = {
      location: userData?.location || "Texas",
      occupation: userData?.occupation,
      interests: userInterests.topics || [],
      concerns: userInterests.causes || [],
      ...userData?.demographics
    };

    // Call OpenAI to get personalized impact assessment
    let impactAssessment;
    try {
      impactAssessment = await generatePersonalImpactAssessment(bill, userDemographics);
    } catch (error: any) {
      console.error("Error generating impact assessment:", error);
      impactAssessment = {
        personalImpact: null,
        relevanceScore: 0,
        sentiment: "neutral",
        impactAreas: []
      };
    }

    // Determine which interests match this bill
    const matchedInterests: string[] = [];
    
    // Match topics
    if (userInterests.topics && bill.topics) {
      for (const topic of userInterests.topics) {
        if (bill.topics.includes(topic)) {
          matchedInterests.push(topic);
        }
      }
    }
    
    // Match keywords in title and description
    if (userInterests.keywords) {
      for (const keyword of userInterests.keywords) {
        // Check title
        if (bill.title && bill.title.toLowerCase().includes(keyword.toLowerCase())) {
          if (!matchedInterests.includes(keyword)) {
            matchedInterests.push(keyword);
          }
        }
        
        // Check description
        if (bill.description && bill.description.toLowerCase().includes(keyword.toLowerCase())) {
          if (!matchedInterests.includes(keyword)) {
            matchedInterests.push(keyword);
          }
        }
      }
    }

    // Calculate base relevance score (0-100)
    let score = impactAssessment.relevanceScore || 0;
    
    // Add points for direct interest matches
    score += Math.min(matchedInterests.length * 10, 30);

    // Add points for bill recency
    if (bill.introducedAt) {
      const now = new Date();
      const introduced = new Date(bill.introducedAt);
      const daysSinceIntroduction = Math.floor((now.getTime() - introduced.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceIntroduction < 30) {
        score += 10; // Bonus for very recent bills
      } else if (daysSinceIntroduction < 90) {
        score += 5; // Smaller bonus for somewhat recent bills
      }
    }

    // Add points for bill status/progress
    if (bill.status === "committee") {
      score += 5; // Bill in committee is gaining momentum
    } else if (bill.status === "passed_first_chamber") {
      score += 10; // Bill passed first chamber is making good progress
    } else if (bill.status === "passed_second_chamber") {
      score += 15; // Bill passed both chambers is very relevant
    }

    // Cap the score at 100
    score = Math.min(Math.round(score), 100);

    // Generate a tailored explanation based on matched interests and impact
    let reason: string;
    
    if (impactAssessment.personalImpact) {
      // Use the AI-generated personal impact if available
      reason = `This bill relates to ${matchedInterests.slice(0, 3).join(", ")} and could impact your daily life. ${impactAssessment.personalImpact.substring(0, 150)}...`;
    } else {
      // Fallback to a more generic reason based on matched interests
      reason = `This bill matches your interests in ${matchedInterests.slice(0, 3).join(", ")} and is currently ${bill.status.replace("_", " ")}.`;
      
      if (bill.topics && bill.topics.length > 0) {
        reason += ` It addresses ${bill.topics.slice(0, 3).join(", ")}.`;
      }
    }

    // Generate specialized impact areas if available from the assessment
    const result = {
      reason,
      score,
      matchedInterests: matchedInterests.slice(0, 5),
      personalImpact: impactAssessment.personalImpact || undefined,
      familyImpact: impactAssessment.familyImpact || undefined,
      communityImpact: impactAssessment.communityImpact || undefined,
      impactAreas: impactAssessment.impactAreas || undefined
    };

    return result;
  } catch (error: any) {
    console.error("Error generating personalized recommendation:", error);
    
    // Return a basic recommendation if something goes wrong
    return {
      reason: `This bill matches one or more of your interests and is currently ${bill.status.replace("_", " ")}.`,
      score: 50,
      matchedInterests: userInterests.topics?.slice(0, 3) || []
    };
  }
}

/**
 * Infer user demographics from their interests and interactions
 */
export async function inferUserDemographics(
  interests: {
    topics?: string[],
    causes?: string[],
    keywords?: string[]
  },
  interactions: any[] // User's past interactions
): Promise<UserDemographics> {
  // Start with basic demographics
  const demographics: UserDemographics = {
    location: "Texas", // Default to Texas
    interests: interests.topics || [],
    concerns: interests.causes || []
  };

  // Infer occupation based on interests/interactions
  // This is a simple inference - in a real app, you might use more sophisticated models
  if (interests.topics?.includes("Education") || interests.causes?.includes("Teacher Pay")) {
    demographics.occupation = "Educator";
  } else if (interests.topics?.includes("Healthcare") || interests.causes?.includes("Medicare Expansion")) {
    demographics.occupation = "Healthcare professional";
  } else if (interests.topics?.includes("Small Business") || interests.causes?.includes("Economic Development")) {
    demographics.occupation = "Business owner";
  }

  // Infer family size based on interests
  if (interests.topics?.includes("Education") || interests.keywords?.some(k => k.toLowerCase().includes("school"))) {
    demographics.familySize = 3; // Assume may have children
  }

  return demographics;
}