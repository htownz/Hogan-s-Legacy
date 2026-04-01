// @ts-nocheck
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { bills } from "../../shared/schema";
import { createLogger } from "../logger";
const log = createLogger("enhanced-point-of-order-analyzer");


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

/**
 * Common types of Points of Order in the Texas Legislature
 */
const COMMON_POINT_OF_ORDER_TYPES = [
  "Germaneness",
  "Caption",
  "Analysis",
  "Fiscal Note",
  "Committee Report",
  "Notice",
  "Constitutional Provision",
  "One-Subject Rule",
  "Consideration",
  "Procedural Compliance",
  "Quorum",
  "Amendment" 
];

/**
 * Interface for Point of Order data
 */
interface PointOfOrderAnalysis {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  ruleReference?: string;
  ruleCitation?: string;
  textLocation?: {
    startIndex: number;
    endIndex: number;
    excerptText: string;
  };
  precedents?: {
    year: number;
    bill: string;
    ruling: string;
    outcome: 'sustained' | 'overruled';
  }[];
  suggestedFix?: string;
}

/**
 * Analyzes bill text for potential points of order
 * 
 * @param billId The ID of the bill to analyze
 * @param billText The text content of the bill
 * @returns An array of potential points of order
 */
export async function analyzePointOfOrder(
  billId: string, 
  billText: string
): Promise<PointOfOrderAnalysis[]> {
  try {
    // Get bill metadata to provide context
    const [bill] = await db
      .select()
      .from(bills).$dynamic()
      .where(eq(bills.id, billId));
    
    if (!bill) {
      throw new Error(`Bill ${billId} not found`);
    }

    // Prepare prompt for OpenAI
    const prompt = `
You are an expert parliamentary analyst specializing in Texas legislative procedure.

Analyze the following bill text from ${billId} to identify potential points of order that could be raised against it based on Texas legislative rules.

For each potential point of order, provide:
1. Type (from the list: ${COMMON_POINT_OF_ORDER_TYPES.join(", ")}, or suggest a new type if none fit)
2. Description of the issue
3. Severity (low, medium, high)
4. Specific rule reference where possible
5. Exact rule citation when available
6. Location in the text (provide excerpt and position)
7. Any relevant precedents
8. Suggested fix

Bill Title: ${bill.title || "Not available"}
Bill Caption: ${bill.caption || "Not available"}

Bill Text:
${billText.substring(0, 10000)} ${billText.length > 10000 ? "[truncated for length]" : ""}

Analyze this bill thoroughly for potential procedural issues that could be raised as points of order. 
Focus on germaneness, caption accuracy, bill analysis correctness, fiscal note requirements, and other procedural requirements.

Return your findings as a JSON array of objects, each representing a potential point of order. 
If you don't find any potential points of order, return an empty array.

Format:
[
  {
    "type": "Caption",
    "description": "The caption fails to give reasonable notice of...",
    "severity": "medium",
    "ruleReference": "Rule 8, Section 1(b)",
    "ruleCitation": "Each bill... shall include a caption that gives the legislature and the public reasonable notice of the subject of the proposed measure.",
    "textLocation": {
      "startIndex": 0,
      "endIndex": 150,
      "excerptText": "The caption text that has the issue"
    },
    "precedents": [
      {
        "year": 2019,
        "bill": "HB 1234",
        "ruling": "Point of order sustained because caption did not give reasonable notice...",
        "outcome": "sustained"
      }
    ],
    "suggestedFix": "Revise the caption to include..."
  }
]
`;

    // Call OpenAI for analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }

    try {
      const parsedResponse = JSON.parse(content);
      
      // If the response is directly an array
      if (Array.isArray(parsedResponse)) {
        return parsedResponse;
      }
      
      // If the response is wrapped in a data/result/points field
      if (parsedResponse.data) return parsedResponse.data;
      if (parsedResponse.result) return parsedResponse.result;
      if (parsedResponse.points) return parsedResponse.points;
      if (parsedResponse.pointsOfOrder) return parsedResponse.pointsOfOrder;
      
      // Default fallback - empty array if we can't find the data
      return [];
      
    } catch (error: any) {
      log.error({ err: error }, "Error parsing OpenAI response");
      return [];
    }
  } catch (error: any) {
    log.error({ err: error }, "Error analyzing bill for points of order");
    return [];
  }
}

/**
 * Analyzes a specific point of order for more details and precedents
 * 
 * @param pointOfOrderId The ID of the point of order to analyze
 * @param billText The text content of the bill
 * @param pointOfOrderType The type of point of order
 * @param description A description of the point of order
 * @returns Enhanced analysis data for the point of order
 */
export async function enhancePointOfOrderAnalysis(
  pointOfOrderId: number,
  billText: string,
  pointOfOrderType: string,
  description: string
): Promise<Partial<PointOfOrderAnalysis>> {
  try {
    // Prepare prompt for OpenAI
    const prompt = `
You are an expert parliamentary analyst specializing in Texas legislative procedure.

I need a detailed analysis of a specific point of order that has been identified:

Point of Order ID: ${pointOfOrderId}
Type: ${pointOfOrderType}
Description: ${description}

Please analyze this point of order in detail, providing:
1. The specific rule citation that applies
2. The exact location in the bill text where the issue occurs
3. Historical precedents for similar points of order
4. A suggested fix for the issue

Bill Text:
${billText.substring(0, 10000)} ${billText.length > 10000 ? "[truncated for length]" : ""}

Return your findings as a JSON object with the following fields:
- ruleCitation: The specific rule or statute that applies
- textLocation: Object with startIndex, endIndex, and excerptText showing where the issue occurs
- precedents: Array of relevant historical precedents
- suggestedFix: Detailed suggestion for how to fix the issue

Format:
{
  "ruleCitation": "Rule 8, Section 1(b): Each bill... shall include a caption that gives the legislature and the public reasonable notice of the subject of the proposed measure.",
  "textLocation": {
    "startIndex": 0,
    "endIndex": 150,
    "excerptText": "The specific text that has the issue"
  },
  "precedents": [
    {
      "year": 2019,
      "bill": "HB 1234",
      "ruling": "Point of order sustained because caption did not give reasonable notice...",
      "outcome": "sustained"
    }
  ],
  "suggestedFix": "Revise the caption to include..."
}
`;

    // Call OpenAI for enhanced analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return {};
    }

    try {
      const parsedResponse = JSON.parse(content);
      return parsedResponse;
    } catch (error: any) {
      log.error({ err: error }, "Error parsing OpenAI response for enhanced analysis");
      return {};
    }
  } catch (error: any) {
    log.error({ err: error }, "Error enhancing point of order analysis");
    return {};
  }
}

/**
 * Generates a comparative analysis between two points of order
 * 
 * @param pointOfOrderA The first point of order to compare
 * @param pointOfOrderB The second point of order to compare
 * @returns Comparative analysis between the two points of order
 */
export async function comparePointsOfOrder(
  pointOfOrderA: any,
  pointOfOrderB: any
): Promise<string> {
  try {
    // Prepare prompt for OpenAI
    const prompt = `
You are an expert parliamentary analyst specializing in Texas legislative procedure.

Compare the following two points of order and provide a detailed analysis of their similarities, differences, and legal implications:

POINT OF ORDER A:
Type: ${pointOfOrderA.type}
Description: ${pointOfOrderA.description}
Rule Reference: ${pointOfOrderA.ruleReference || "Not specified"}
Status: ${pointOfOrderA.status}
${pointOfOrderA.ruleCitation ? `Rule Citation: ${pointOfOrderA.ruleCitation}` : ""}
${pointOfOrderA.resolution ? `Resolution: ${pointOfOrderA.resolution}` : ""}

POINT OF ORDER B:
Type: ${pointOfOrderB.type}
Description: ${pointOfOrderB.description}
Rule Reference: ${pointOfOrderB.ruleReference || "Not specified"}
Status: ${pointOfOrderB.status}
${pointOfOrderB.ruleCitation ? `Rule Citation: ${pointOfOrderB.ruleCitation}` : ""}
${pointOfOrderB.resolution ? `Resolution: ${pointOfOrderB.resolution}` : ""}

In your comparative analysis, address:
1. Key similarities in the parliamentary issues raised
2. Significant differences in the nature or severity of the issues
3. Comparison of the rules or parliamentary procedures involved
4. Differences in how they were or would likely be resolved
5. Implications for legislative practice and procedure

Provide a thorough, objective analysis suitable for legal and parliamentary experts.
`;

    // Call OpenAI for comparative analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Analysis could not be generated.";
  } catch (error: any) {
    log.error({ err: error }, "Error comparing points of order");
    return "Error generating comparative analysis.";
  }
}