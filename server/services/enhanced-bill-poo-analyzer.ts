// @ts-nocheck
import OpenAI from "openai";
import { db } from "../db";
import { bills, legislativeRules, pointsOfOrder } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { createLogger } from "../logger";
const log = createLogger("enhanced-bill-poo-analyzer");


// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RulePattern {
  pattern: string;
  rule: string;
  section: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface PotentialPOO {
  type: string;
  description: string;
  ruleReference: string;
  textLocation: string;
  severity: 'high' | 'medium' | 'low';
  ruleCitation?: string;
  precedents?: string;
  suggestedFix?: string;
  confidence?: number;
}

interface BillAnalysisResponse {
  billId: string;
  analysis: PotentialPOO[];
}

/**
 * Enhanced service to analyze bills for potential points of order
 * with more sophisticated rule-based detection
 */
export class EnhancedBillPOOAnalyzer {
  private rulePatterns: RulePattern[] = [];
  private initialized = false;

  /**
   * Initialize the analyzer with rule patterns
   */
  async initialize() {
    try {
      // Initialize rule patterns
      await this.loadRulePatterns();
      this.initialized = true;
      log.info("Enhanced Bill Point of Order Analyzer initialized with rule patterns.");
    } catch (error: any) {
      log.error({ err: error }, "Error initializing Enhanced Bill Point of Order Analyzer");
    }
  }

  /**
   * Load rule patterns from database and OpenAI processing
   */
  private async loadRulePatterns() {
    try {
      // Get legislative rules
      const rules = await db.query.legislativeRules.findMany();
      
      // Get historical points of order
      const historicalPOOs = await db.query.pointsOfOrder.findMany({
        where: eq(pointsOfOrder.status, "sustained"),
        limit: 20,
        orderBy: [desc(pointsOfOrder.createdAt)],
      });
      
      // Format rule data for pattern extraction
      const ruleData = rules.map(rule => 
        `Rule: ${rule.ruleNumber}\nTitle: ${rule.title}\nSection: ${rule.section}\nContent: ${rule.content}`
      ).join("\n\n");
      
      // Format historical POO data for pattern extraction
      const historicalData = historicalPOOs.map(poo => 
        `Type: ${poo.type}\nRule Reference: ${poo.ruleReference}\nDescription: ${poo.description}\nStatus: ${poo.status}\nSeverity: ${poo.severity}`
      ).join("\n\n");
      
      // Use OpenAI to extract patterns
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a Texas legislative rule expert specializing in points of order detection patterns."
          },
          {
            role: "user",
            content: `Analyze the following legislative rules and historical points of order data to identify common patterns that indicate potential points of order.

For each pattern, provide:
1. A pattern description that can be used to detect similar issues
2. The specific rule reference
3. The section within the rule
4. A description of why this is a potential issue
5. The severity level (high, medium, low) based on historical precedent

Legislative Rules:
${ruleData}

Historical Points of Order Data:
${historicalData}

Return the results as a JSON array of patterns in this format:
[
  {
    "pattern": "text pattern to detect",
    "rule": "rule number",
    "section": "section reference",
    "description": "description of the issue",
    "severity": "high|medium|low"
  }
]
`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      
      // Parse and store the patterns
      const responseText = response.choices[0].message.content || "{}";
      const extractedPatterns = JSON.parse(responseText);
      
      if (Array.isArray(extractedPatterns.patterns)) {
        this.rulePatterns = extractedPatterns.patterns;
        log.info(`Loaded ${this.rulePatterns.length} rule patterns for analysis.`);
      } else {
        // Add some default patterns if extraction failed
        this.rulePatterns = [
          {
            pattern: "unrelated subject matter",
            rule: "8",
            section: "3",
            description: "Bill contains unrelated subject matter that violates germaneness requirements",
            severity: "high"
          },
          {
            pattern: "caption does not match content",
            rule: "8",
            section: "1",
            description: "Bill caption does not accurately reflect the content of the bill",
            severity: "medium"
          },
          {
            pattern: "exceeds single subject requirement",
            rule: "8",
            section: "3",
            description: "Bill contains more than one subject, violating single subject rule",
            severity: "high"
          }
        ];
      }
    } catch (error: any) {
      log.error({ err: error }, "Error loading rule patterns");
      
      // Use default patterns as fallback
      this.rulePatterns = [
        {
          pattern: "unrelated subject matter",
          rule: "8",
          section: "3",
          description: "Bill contains unrelated subject matter that violates germaneness requirements",
          severity: "high"
        },
        {
          pattern: "caption does not match content",
          rule: "8",
          section: "1",
          description: "Bill caption does not accurately reflect the content of the bill",
          severity: "medium"
        },
        {
          pattern: "exceeds single subject requirement",
          rule: "8",
          section: "3",
          description: "Bill contains more than one subject, violating single subject rule",
          severity: "high"
        }
      ];
    }
  }

  /**
   * Analyze a bill for potential points of order using improved detection
   * @param billId The ID of the bill to analyze
   */
  async analyzeBill(billId: string): Promise<BillAnalysisResponse> {
    try {
      // Ensure analyzer is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get the bill
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });

      if (!bill) {
        return {
          billId,
          analysis: []
        };
      }

      // Check if the bill has a full text to analyze
      const fullText = bill.fullText;
      if (!fullText) {
        return {
          billId,
          analysis: [{
            type: "error",
            description: "Bill doesn't have full text available for analysis",
            ruleReference: "N/A",
            textLocation: "N/A",
            severity: "low"
          }]
        };
      }
      
      // Get legislative rules for context
      const rules = await db.query.legislativeRules.findMany({
        orderBy: [eq(legislativeRules.chamber, "house")], // Prioritize House rules
        limit: 15,
      });

      // Format rules for context
      const rulesContext = rules.map(rule => 
        `Rule ${rule.ruleNumber}: ${rule.title}\nSection: ${rule.section}\nContent: ${rule.content}`
      ).join("\n\n");
      
      // Create a prompt that includes our rule patterns
      const rulePatternContext = this.rulePatterns.map(pattern => 
        `Pattern: "${pattern.pattern}"\nRule: ${pattern.rule}\nSection: ${pattern.section}\nDescription: ${pattern.description}\nSeverity: ${pattern.severity}`
      ).join("\n\n");

      // Prepare the prompt for OpenAI
      const prompt = `
Analyze the following bill text for potential points of order (parliamentary procedure violations) using Texas House and Senate rules.

BILL INFORMATION:
Bill ID: ${bill.id}
Title: ${bill.title}
Caption: ${bill.caption || 'Not provided'}

RELEVANT RULE PATTERNS TO CHECK FOR:
${rulePatternContext}

DETAILED LEGISLATIVE RULES:
${rulesContext}

BILL TEXT TO ANALYZE:
${fullText.slice(0, 10000)}${fullText.length > 10000 ? '... [text truncated for length]' : ''}

ANALYSIS INSTRUCTIONS:
1. Analyze the bill text for any potential violations of legislative rules or procedure
2. For each potential point of order, provide:
   - The type of issue (e.g., germaneness, caption, analysis requirement, etc.)
   - A detailed description of the potential violation
   - The specific rule reference (rule number and section)
   - The location in the text where the issue appears
   - The severity (high, medium, low) based on likelihood of success
   - A suggested fix for the issue
   - Confidence level (0-1 scale) in the detection
3. Include specific citations from the rule that applies
4. Reference any relevant historical precedents

OUTPUT FORMAT:
Return a JSON array of potential points of order, with each object containing:
- type: The type of point of order
- description: A detailed description of the potential violation
- ruleReference: The specific rule number and section
- textLocation: Where in the bill text the issue appears
- severity: How severe the issue is ("high", "medium", "low")
- ruleCitation: The relevant text from the rule being violated
- precedents: Any historical precedents for similar points of order
- suggestedFix: A suggestion for how to fix the issue
- confidence: Confidence level (0-1) in this detection

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
        temperature: 0.2, // Lower temperature for more precise analysis
      });

      // Parse the response
      try {
        const responseText = completion.choices[0].message.content || "{}";
        const analysisResults = JSON.parse(responseText);
        
        if (Array.isArray(analysisResults.potentialPointsOfOrder)) {
          return {
            billId,
            analysis: analysisResults.potentialPointsOfOrder.map((poo: any) => ({
              type: poo.type,
              description: poo.description,
              ruleReference: poo.ruleReference,
              textLocation: poo.textLocation,
              severity: poo.severity,
              ruleCitation: poo.ruleCitation,
              precedents: poo.precedents,
              suggestedFix: poo.suggestedFix,
              confidence: poo.confidence
            }))
          };
        } else if (Array.isArray(analysisResults)) {
          return {
            billId,
            analysis: analysisResults
          };
        } else {
          return {
            billId,
            analysis: []
          };
        }
      } catch (error: any) {
        log.error({ err: error }, "Error parsing OpenAI response for bill analysis");
        return {
          billId,
          analysis: [{
            type: "error",
            description: "Failed to parse analysis results",
            ruleReference: "N/A",
            textLocation: "N/A",
            severity: "low"
          }]
        };
      }
    } catch (error: any) {
      log.error({ err: error }, `Error analyzing bill ${billId}`);
      return {
        billId,
        analysis: [{
          type: "error",
          description: `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ruleReference: "N/A",
          textLocation: "N/A",
          severity: "low"
        }]
      };
    }
  }

  /**
   * Analyze an amendment for points of order by comparing it to the original bill
   * @param billId The ID of the bill being amended
   * @param amendmentText The text of the amendment
   */
  async analyzeAmendment(billId: string, amendmentText: string): Promise<any> {
    try {
      // Ensure analyzer is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Get the bill
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId),
      });

      if (!bill || !bill.fullText) {
        return {
          success: false,
          error: "Bill or bill text not found"
        };
      }

      // Format rules for context
      const rules = await db.query.legislativeRules.findMany({
        limit: 10,
      });
      
      const rulesContext = rules.map(rule => 
        `Rule ${rule.ruleNumber}: ${rule.title}\nSection: ${rule.section}\nContent: ${rule.content}`
      ).join("\n\n");

      // Prepare the prompt for OpenAI
      const prompt = `
Analyze the following amendment to determine if it raises any potential points of order when applied to the bill.

BILL INFORMATION:
Bill ID: ${bill.id}
Title: ${bill.title}
Caption: ${bill.caption || 'Not provided'}

AMENDMENT TEXT:
${amendmentText}

ORIGINAL BILL TEXT:
${bill.fullText.slice(0, 5000)}${bill.fullText.length > 5000 ? '... [text truncated for length]' : ''}

RELEVANT RULES:
${rulesContext}

ANALYSIS INSTRUCTIONS:
1. Analyze whether the amendment:
   - Is germane to the original bill's subject
   - Complies with the one-subject rule
   - Is properly formatted
   - Follows proper amendment procedure
   - Would change the original intent of the bill improperly
   - Violates any legislative rules

2. For each potential point of order, provide:
   - The type of issue
   - A detailed description of the potential violation
   - The specific rule reference
   - The severity (high, medium, low)
   - A suggested fix
   - Confidence level (0-1)

OUTPUT FORMAT:
Return a JSON object with:
- germaneness: Boolean indicating if the amendment is germane to the bill
- potentialIssues: Array of potential points of order
- analysis: Summary of the analysis
- recommendations: Suggestions for improving the amendment

If no potential points of order are identified, the potentialIssues array should be empty.
`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are a Texas legislative expert specializing in parliamentary procedure and amendment analysis." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const responseText = completion.choices[0].message.content || "{}";
      return JSON.parse(responseText);
    } catch (error: any) {
      log.error({ err: error }, `Error analyzing amendment for bill ${billId}`);
      return {
        success: false,
        error: `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get trends and patterns in points of order from historical data
   */
  async getPointsOfOrderPatterns() {
    try {
      // Get all points of order with status
      const pointsOfOrderData = await db.query.pointsOfOrder.findMany({
        orderBy: [desc(pointsOfOrder.createdAt)],
      });
      
      // Get counts by type
      const typeCounts = await db.execute(sql`
        SELECT type, COUNT(*) as count
        FROM points_of_order
        GROUP BY type
        ORDER BY count DESC
      `);
      
      // Get success rates by type
      const typeSuccessRates = await db.execute(sql`
        SELECT 
          type, 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sustained' THEN 1 ELSE 0 END) as sustained,
          ROUND(SUM(CASE WHEN status = 'sustained' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
        FROM points_of_order
        GROUP BY type
        ORDER BY success_rate DESC
      `);
      
      return {
        total: pointsOfOrderData.length,
        byType: typeCounts.rows,
        successRates: typeSuccessRates.rows,
        recentTrends: pointsOfOrderData.slice(0, 10)
      };
    } catch (error: any) {
      log.error({ err: error }, "Error getting points of order patterns");
      return {
        error: "Failed to retrieve points of order patterns"
      };
    }
  }
}

// Create a singleton instance
export const enhancedBillPOOAnalyzer = new EnhancedBillPOOAnalyzer();