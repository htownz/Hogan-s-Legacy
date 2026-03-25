import { db } from '../db';
import { billSummaries } from '../../shared/schema-bill-summaries';
import { bills } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get a bill summary by bill ID
 */
export async function getBillSummaryById(billId: string): Promise<any> {
  if (!billId) {
    throw new Error('Bill ID is required');
  }
  
  try {
    // First, check if we already have a summary for this bill
    const existingSummary = await db
      .select()
      .from(billSummaries).$dynamic()
      .where(eq(billSummaries.billId, billId))
      .limit(1);
    
    if (existingSummary.length > 0) {
      return existingSummary[0];
    }
    
    // If no existing summary, get bill data to generate one
    const billData = await db
      .select()
      .from(bills).$dynamic()
      .where(eq(bills.id, billId))
      .limit(1);
    
    if (billData.length === 0) {
      throw new Error(`Bill not found: ${billId}`);
    }
    
    // Generate a new summary for the bill
    return await generateBillSummary(billData[0]);
  } catch (error: any) {
    console.error('Error retrieving bill summary:', error);
    throw error;
  }
}

/**
 * Generate a bill summary using OpenAI
 */
async function generateBillSummary(bill: any): Promise<any> {
  try {
    const fullText = bill.fullText || bill.description;
    
    if (!fullText || fullText.length < 50) {
      throw new Error('Bill text is too short or not available for summarization');
    }
    
    // Use OpenAI to generate a comprehensive summary
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional legislative analyst and policy expert specializing in Texas legislation.
          Analyze the provided bill text and generate a comprehensive, objective summary with the following sections:
          1. Executive Summary (a brief overview of the bill's purpose and key provisions)
          2. Key Points (bullet points of the most important aspects)
          3. Impact Analysis (who would be affected and how)
          4. Legal Implications (key legal changes or challenges)
          5. Stakeholder Analysis (who supports/opposes and why)
          
          Format your response as a JSON object with these sections as keys.
          Keep the analysis factual, balanced, and politically neutral.`
        },
        {
          role: "user",
          content: `Please analyze this bill text for ${bill.id}: ${fullText.substring(0, 8000)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 1500
    });
    
    const summaryData = JSON.parse(response.choices[0].message.content || '{}');
    
    // Store the generated summary in the database
    const newSummary = {
      billId: bill.id,
      executiveSummary: summaryData.Executive_Summary || summaryData["Executive Summary"],
      keyPoints: summaryData.Key_Points || summaryData["Key Points"],
      impactAnalysis: summaryData.Impact_Analysis || summaryData["Impact Analysis"],
      legalImplications: summaryData.Legal_Implications || summaryData["Legal Implications"],
      stakeholderAnalysis: summaryData.Stakeholder_Analysis || summaryData["Stakeholder Analysis"],
      generatedDate: new Date(),
      lastUpdated: new Date(),
      viewCount: 0,
      shareCount: 0,
      aiModel: "gpt-4o"
    };
    
    await db.insert(billSummaries).values(newSummary);
    
    return newSummary;
  } catch (error: any) {
    console.error('Error generating bill summary:', error);
    throw error;
  }
}

/**
 * Generate a personalized bill summary tailored to specific user demographics
 */
export async function generatePersonalizedBillSummary(billId: string, demographics: any): Promise<any> {
  try {
    // Get the bill data
    const billData = await db
      .select()
      .from(bills).$dynamic()
      .where(eq(bills.id, billId))
      .limit(1);
    
    if (billData.length === 0) {
      throw new Error(`Bill not found: ${billId}`);
    }
    
    const bill = billData[0];
    const fullText = bill.fullText || bill.description;
    
    if (!fullText || fullText.length < 50) {
      throw new Error('Bill text is too short or not available for personalization');
    }
    
    // Use OpenAI to generate a personalized analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a professional legislative analyst specializing in Texas legislation.
          Analyze the provided bill text and generate a personalized impact analysis for an individual
          with the following demographics:
          
          Age group: ${demographics.ageGroup || 'Adult'}
          Occupation: ${demographics.occupation || 'Not specified'}
          Location: ${demographics.location || 'Texas'}
          Income level: ${demographics.incomeLevel || 'Not specified'}
          
          Explain how this bill might specifically affect someone with these characteristics.
          Keep your analysis factual, practical, and politically neutral.
          Do not make assumptions beyond what's in the bill text.`
        },
        {
          role: "user",
          content: `Please provide a personalized analysis of this bill (${bill.id}) for someone matching the demographics above: ${fullText.substring(0, 8000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    return {
      billId: bill.id,
      personalizedSummary: response.choices[0].message.content || 'No personalized summary available.',
      demographics: demographics
    };
  } catch (error: any) {
    console.error('Error generating personalized bill summary:', error);
    throw error;
  }
}