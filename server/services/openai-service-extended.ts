import OpenAI from "openai";
import { db } from "../db";
import { billSummaries } from "@shared/schema-bill-summaries";
import { bills } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize OpenAI client (The newest OpenAI model is "gpt-4o" which was released May 13, 2024)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * User demographics type for personalized impact assessment
 */
export interface UserDemographics {
  location?: string;
  occupation?: string;
  interests?: string[];
  concerns?: string[];
  age?: number;
  familySize?: number;
  income?: string;
  politicalLeaning?: string;
  impactPreference?: string; // Preference for what kind of impacts to highlight
}

/**
 * Generate a personalized impact assessment for a bill based on user demographics
 * @param bill The bill to analyze
 * @param demographics User demographic information
 * @returns Personalized impact assessment
 */
export async function generatePersonalImpactAssessment(
  bill: any,
  demographics: UserDemographics
): Promise<{
  personalImpact: string | null;
  familyImpact?: string;
  communityImpact?: string;
  relevanceScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  impactAreas: string[];
}> {
  try {
    const prompt = `
    You are an expert legislative analyst. Analyze how the following bill might impact a person with these demographics:
    
    BILL INFORMATION:
    Title: ${bill.title || 'Untitled'}
    Description: ${bill.description || 'No description provided'}
    Status: ${bill.status || 'Unknown'}
    Topics: ${bill.topics?.join(', ') || 'No topics specified'}
    
    USER DEMOGRAPHICS:
    Location: ${demographics.location || 'Texas'}
    ${demographics.occupation ? `Occupation: ${demographics.occupation}` : ''}
    ${demographics.interests?.length ? `Interests: ${demographics.interests.join(', ')}` : ''}
    ${demographics.concerns?.length ? `Concerns: ${demographics.concerns.join(', ')}` : ''}
    ${demographics.age ? `Age: ${demographics.age}` : ''}
    ${demographics.familySize ? `Family size: ${demographics.familySize}` : ''}
    ${demographics.income ? `Income level: ${demographics.income}` : ''}
    ${demographics.politicalLeaning ? `Political perspective: ${demographics.politicalLeaning}` : ''}
    
    Provide a personalized impact assessment in JSON format:
    {
      "personalImpact": "How this bill might personally impact this individual based on their demographics",
      "familyImpact": "How this bill might impact their family (if applicable)",
      "communityImpact": "How this bill might impact their broader community",
      "relevanceScore": A number from 0-100 representing how relevant this bill is to this person,
      "sentiment": "positive" | "negative" | "neutral" - The likely sentiment of this person toward this bill,
      "impactAreas": ["area1", "area2"] - List of specific areas of life this bill might impact for this person
    }
    
    Focus only on the concrete, likely impacts. Be objective and factual.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert legislative analyst providing objective impact assessments of legislation." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const jsonResponse = JSON.parse(content);
    
    return {
      personalImpact: jsonResponse.personalImpact || null,
      familyImpact: jsonResponse.familyImpact || undefined,
      communityImpact: jsonResponse.communityImpact || undefined,
      relevanceScore: parseInt(jsonResponse.relevanceScore, 10) || 0,
      sentiment: jsonResponse.sentiment || 'neutral',
      impactAreas: jsonResponse.impactAreas || []
    };
  } catch (error: any) {
    console.error("Error generating impact assessment:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate impact assessment: ${errorMessage}`);
  }
}

/**
 * Generate a comparison between two bills
 * @param bill1 First bill to compare
 * @param summary1 First bill's summary
 * @param bill2 Second bill to compare
 * @param summary2 Second bill's summary
 * @returns Comparison analysis
 */
export async function generateBillComparison(
  bill1: any,
  summary1: any,
  bill2: any,
  summary2: any
): Promise<{
  similarities: string[];
  differences: string[];
  alignmentScore: number;
  keyIssues: {
    issue: string;
    bill1Approach: string;
    bill2Approach: string;
  }[];
  recommendation: string;
  comparisonDate: Date;
}> {
  try {
    const prompt = `
    Analyze and compare the following two bills:
    
    BILL 1:
    ID: ${bill1.id}
    Title: ${bill1.title || 'Untitled'}
    Description: ${bill1.description || 'No description provided'}
    Status: ${bill1.status || 'Unknown'}
    Topics: ${bill1.topics?.join(', ') || 'No topics specified'}
    
    Bill 1 Summary:
    ${summary1.executiveSummary || 'No executive summary available'}
    
    Key Points: ${Array.isArray(summary1.keyPoints) ? summary1.keyPoints.join(', ') : 'None provided'}
    
    BILL 2:
    ID: ${bill2.id}
    Title: ${bill2.title || 'Untitled'}
    Description: ${bill2.description || 'No description provided'}
    Status: ${bill2.status || 'Unknown'}
    Topics: ${bill2.topics?.join(', ') || 'No topics specified'}
    
    Bill 2 Summary:
    ${summary2.executiveSummary || 'No executive summary available'}
    
    Key Points: ${Array.isArray(summary2.keyPoints) ? summary2.keyPoints.join(', ') : 'None provided'}
    
    Provide a detailed comparison in JSON format:
    {
      "similarities": ["similarity1", "similarity2", ...] - List the major similarities between the bills,
      "differences": ["difference1", "difference2", ...] - List the major differences between the bills,
      "alignmentScore": A number from 0-100 representing how closely aligned these bills are in their approach and objectives,
      "keyIssues": [
        {
          "issue": "Issue name",
          "bill1Approach": "How bill 1 addresses this issue",
          "bill2Approach": "How bill 2 addresses this issue"
        },
        ...
      ],
      "recommendation": "For citizens interested in these topics, here's a comparison recommendation"
    }
    
    Be objective, factual, and thorough in your analysis.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert legislative analyst specializing in comparative analysis of legislation." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const jsonResponse = JSON.parse(content);
    
    return {
      similarities: jsonResponse.similarities || [],
      differences: jsonResponse.differences || [],
      alignmentScore: parseInt(jsonResponse.alignmentScore, 10) || 0,
      keyIssues: jsonResponse.keyIssues || [],
      recommendation: jsonResponse.recommendation || "No recommendation available",
      comparisonDate: new Date()
    };
  } catch (error: any) {
    console.error("Error generating bill comparison:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate bill comparison: ${errorMessage}`);
  }
}