import { db } from "../db";
import { bills, legislativeRules, pointsOfOrder } from "@shared/schema";
import { eq, desc, and, or } from "drizzle-orm";
import OpenAI from "openai";
import { SERVER_CONFIG } from "../config";
import { createId } from "@paralleldrive/cuid2";
import { createLogger } from "../logger";
const log = createLogger("bill-point-of-order-analyzer");


// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Service to analyze bills for potential points of order using historical data and legislative rules
 */
export class BillPointOfOrderAnalyzer {
  /**
   * Initialize the analyzer
   */
  constructor() {
    log.info("Bill Point of Order Analyzer initialized");
  }

  /**
   * Get historical points of order data for context and pattern recognition
   */
  async getHistoricalPointsOfOrderData() {
    try {
      // Get a representative sample of points of order that have been sustained
      const historicalPOOs = await db.query.pointsOfOrder.findMany({
        where: eq(pointsOfOrder.status, "sustained"),
        limit: 10,
        orderBy: [desc(pointsOfOrder.createdAt)],
      });

      return historicalPOOs;
    } catch (error: any) {
      log.error({ err: error }, "Error fetching historical points of order data");
      return [];
    }
  }

  /**
   * Get legislative rules data for analysis context
   */
  async getLegislativeRules() {
    try {
      // Get all legislative rules
      const rules = await db.query.legislativeRules.findMany({
        orderBy: [eq(legislativeRules.chamber, "house")], // Prioritize House rules
        limit: 15,
      });

      return rules;
    } catch (error: any) {
      log.error({ err: error }, "Error fetching legislative rules");
      return [];
    }
  }

  /**
   * Analyze a bill for potential points of order
   * @param billId The ID of the bill to analyze
   */
  async analyzeBill(billId: string) {
    try {
      // Get the bill
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });

      if (!bill) {
        return {
          billId,
          analysis: [{
            error: "Bill not found"
          }]
        };
      }

      // Get legislative rules and historical points of order for context
      const rules = await this.getLegislativeRules();
      const historicalPOOs = await this.getHistoricalPointsOfOrderData();

      // Format rules for context
      const rulesContext = rules.map(rule => 
        `Rule: ${rule.title}\nSection: ${rule.section}\nContent: ${rule.content}`
      ).join("\n\n");

      // Format historical POOs for context
      const historicalPOOContext = historicalPOOs.map(poo => 
        `Type: ${poo.type}\nRule Reference: ${poo.ruleReference}\nDescription: ${poo.description}\nStatus: ${poo.status}\nSeverity: ${poo.severity}`
      ).join("\n\n");

      // Check if the bill has a full text to analyze
      const fullText = bill.fullText;
      if (!fullText) {
        return {
          billId,
          analysis: [{
            error: "Bill doesn't have full text available for analysis"
          }]
        };
      }

      // Prepare for OpenAI analysis
      // Note that we're checking for rules violations, not analyzing policy impact
      const prompt = `
You are a Texas legislative expert specializing in parliamentary procedure and points of order.

CONTEXT:
1. Texas Legislative Rules:
${rulesContext}

2. Historical Points of Order that were Sustained:
${historicalPOOContext}

TASK:
Analyze the following bill for potential points of order based on Texas legislative rules and procedures. 
Focus specifically on:
- Germaneness issues (does the bill contain provisions outside its scope?)
- Analysis issues (does the bill include incorrect analyses or fiscal notes?)
- Notice issues (was proper notice given for the bill's contents?)
- Layout issues (does the bill follow required formatting and structure?)
- Caption issues (does the caption accurately reflect the bill's contents?)
- Committee issues (were proper committee procedures followed?)

BILL INFORMATION:
Bill ID: ${bill.id}
Title: ${bill.title}
Chamber: ${bill.chamber}
Description: ${bill.description}

BILL TEXT:
${fullText.substring(0, 8000)} // Limit text to avoid token limits

OUTPUT INSTRUCTIONS:
Return a JSON array of potential points of order, with each object containing:
- type: The type of point of order ("germaneness", "analysis", "notice", "layout", "caption", "committee", etc.)
- description: A detailed description of the potential violation
- ruleReference: The specific rule number or section that may be violated
- textLocation: Where in the bill text the issue appears (section, page, line, etc.)
- severity: How severe the issue is ("high", "medium", "low") based on likelihood of sustaining
- suggestedFix: A suggestion for how to fix the issue

If no potential points of order are identified, return an empty array.
`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are a Texas legislative expert specializing in parliamentary procedure and points of order analysis." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more precise analysis
      });

      // Parse the response
      try {
        const responseText = completion.choices[0].message.content || "{}";
        const analysisResults = JSON.parse(responseText);

        return {
          billId,
          analysis: analysisResults.points || analysisResults // Handle different response formats
        };
      } catch (error: any) {
        log.error({ err: error }, "Error parsing OpenAI response");
        return {
          billId,
          analysis: [{
            error: "Failed to parse analysis results"
          }]
        };
      }
    } catch (error: any) {
      log.error({ err: error }, `Error analyzing bill ${billId} for points of order`);
      return {
        billId,
        analysis: [{
          error: "Analysis failed due to an internal error"
        }]
      };
    }
  }

  /**
   * Store analysis results in the database as potential points of order
   * @param analysisResults Results from the analyzeBill method
   */
  async storePointsOfOrderResults(analysisResults: any) {
    try {
      const { billId, analysis } = analysisResults;

      // Skip if no valid analysis or billId
      if (!billId || !analysis || !Array.isArray(analysis) || analysis.length === 0) {
        return { success: false, message: "No valid analysis results to store" };
      }

      // Store each point of order
      for (const point of analysis) {
        // Skip if there's an error in the point
        if (point.error) continue;

        await db.insert(pointsOfOrder).values({
          id: createId(),
          billId: billId,
          type: point.type || "unknown",
          description: point.description,
          severity: point.severity || "medium",
          status: "pending", // Default status for AI-detected issues
          ruleReference: point.ruleReference || "unknown",
          ruleCitation: point.ruleCitation || point.ruleReference || null,
          textLocation: point.textLocation || null,
          precedents: JSON.stringify(point.precedents || []),
          suggestedFix: point.suggestedFix || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Set AI-detected flag to true
          aiDetected: true,
          // Mark as needing validation
          validationStatus: "pending"
        });
      }

      return { success: true, message: `Stored ${analysis.length} potential points of order` };
    } catch (error: any) {
      log.error({ err: error }, "Error storing points of order results");
      return { success: false, message: "Failed to store analysis results" };
    }
  }

  /**
   * Run analysis on multiple bills in batch
   * @param billIds Array of bill IDs to analyze
   * @param storeResults Whether to store results in the database
   */
  async analyzeBillBatch(billIds: string[], storeResults = true) {
    try {
      const results = [];

      // Analyze each bill sequentially to avoid rate limits
      for (const billId of billIds) {
        log.info(`Analyzing bill ${billId} for points of order...`);
        
        const analysis = await this.analyzeBill(billId);
        
        if (storeResults && analysis.analysis && 
            Array.isArray(analysis.analysis) && 
            analysis.analysis.length > 0 &&
            !analysis.analysis[0].error) {
          await this.storePointsOfOrderResults(analysis);
        }
        
        results.push(analysis);
        
        // Add a small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return results;
    } catch (error: any) {
      log.error({ err: error }, "Error in batch analysis");
      return billIds.map(id => ({ 
        billId: id, 
        analysis: [{ error: "Batch analysis failed" }] 
      }));
    }
  }

  /**
   * Analyze an amendment for potential points of order
   * @param billId The bill ID
   * @param amendmentText The amendment text
   */
  async analyzeAmendment(billId: string, amendmentText: string) {
    try {
      // Get the bill
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });

      if (!bill) {
        return [{
          error: "Bill not found"
        }];
      }

      // Get legislative rules for context
      const rules = await this.getLegislativeRules();

      // Format rules for context
      const rulesContext = rules.map(rule => 
        `Rule: ${rule.title}\nSection: ${rule.section}\nContent: ${rule.content}`
      ).join("\n\n");

      // Prepare for OpenAI analysis
      const prompt = `
You are a Texas legislative expert specializing in parliamentary procedure and points of order.

CONTEXT:
Texas Legislative Rules:
${rulesContext}

TASK:
Analyze the following amendment to bill ${bill.id} for potential points of order, focusing on:
- Germaneness issues (is the amendment germane to the bill's subject?)
- Layout issues (does the amendment follow required formatting?)
- Scope issues (does the amendment expand the scope of the original bill?)

BILL INFORMATION:
Bill ID: ${bill.id}
Title: ${bill.title}
Chamber: ${bill.chamber}
Description: ${bill.description}

AMENDMENT TEXT:
${amendmentText}

OUTPUT INSTRUCTIONS:
Return a JSON array of potential points of order, with each object containing:
- type: The type of point of order
- description: A detailed description of the potential violation
- ruleReference: The specific rule that may be violated
- severity: How severe the issue is ("high", "medium", "low")
- suggestedFix: A suggestion for how to fix the issue

If no potential points of order are identified, return an empty array.
`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are a Texas legislative expert specializing in parliamentary procedure and points of order analysis." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      // Parse the response
      try {
        const responseText = completion.choices[0].message.content || "{}";
        const analysisResults = JSON.parse(responseText);

        return analysisResults.points || analysisResults;
      } catch (error: any) {
        log.error({ err: error }, "Error parsing OpenAI response for amendment analysis");
        return [{
          error: "Failed to parse analysis results"
        }];
      }
    } catch (error: any) {
      log.error({ err: error }, `Error analyzing amendment for bill ${billId}`);
      return [{
        error: "Analysis failed due to an internal error"
      }];
    }
  }
}

export const billPOOAnalyzer = new BillPointOfOrderAnalyzer();