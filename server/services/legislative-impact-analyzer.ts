// @ts-nocheck
import OpenAI from "openai";
import { Bill } from "../../shared/schema";
import { createLogger } from "../logger";
const log = createLogger("legislative-impact-analyzer");


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Generate a comprehensive legislative impact analysis for a bill
 * @param bill The bill to analyze
 * @returns A detailed impact analysis
 */
export async function generateLegislativeImpactAnalysis(bill: Bill): Promise<any> {
  try {
    if (!bill.fullText) {
      log.warn(`Bill ${bill.id} is missing full text for analysis`);
      // We'll provide a basic analysis without the full text
      return generateBasicAnalysis(bill);
    }

    // Build a prompt for the OpenAI model
    const prompt = buildAnalysisPrompt(bill);

    // Call OpenAI API to generate the analysis
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a legislative analyst expert specializing in Texas state legislation. 
          You provide detailed, objective, and comprehensive analyses of bills, focusing on their
          practical impacts across multiple dimensions including economic, social, environmental, 
          legal, and governance aspects. Your analysis should be fact-based, nuanced, and consider 
          various stakeholder perspectives. Avoid political bias or partisan language.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const analysisText = response.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    return analysis;
  } catch (error: any) {
    log.error({ err: error }, "Error generating legislative impact analysis");
    // Fall back to basic analysis if OpenAI call fails
    return generateBasicAnalysis(bill);
  }
}

/**
 * Build an analysis prompt for the OpenAI model
 * @param bill The bill to analyze
 * @returns A prompt for the OpenAI model
 */
function buildAnalysisPrompt(bill: Bill): string {
  return `
I need a detailed legislative impact analysis for Texas Bill ${bill.id}: "${bill.title}".

${bill.fullText ? `Here is the full text of the bill: ${bill.fullText}` : `Here is a summary of the bill: ${bill.summary || bill.title}`}

Please provide a comprehensive legislative impact analysis in JSON format with the following structure:
{
  "billId": "string",
  "title": "string",
  "executiveSummary": "string",
  "impactScores": {
    "overall": number (1-10),
    "economic": number (1-10),
    "social": number (1-10),
    "environmental": number (1-10),
    "legal": number (1-10),
    "governance": number (1-10)
  },
  "keyStakeholders": {
    "beneficiaries": ["string"],
    "adverselyAffected": ["string"],
    "neutralParties": ["string"]
  },
  "regionalImpacts": [
    {
      "region": "string",
      "impact": "string",
      "severityScore": number (1-10)
    }
  ],
  "implementationAnalysis": {
    "timeframe": "string",
    "feasibility": number (1-10),
    "resourceRequirements": "string",
    "potentialChallenges": ["string"]
  },
  "complianceRequirements": ["string"],
  "budgetaryImplications": {
    "estimatedCost": "string",
    "fundingSources": ["string"],
    "fiscalImpact": "string"
  },
  "comparativeContext": {
    "similarLegislation": ["string"],
    "historicalContext": "string"
  },
  "recommendations": ["string"],
  "technicalDetails": {
    "aiConfidence": number (1-10),
    "dataSourcesUsed": ["string"],
    "analysisDate": "string (current date)"
  }
}

Make sure to provide detailed, specific analysis based on the bill's content. If the bill text is limited, provide the most reasonable analysis based on the available information, noting any limitations in your confidence score.

Consider impacts on various demographic groups, geographic regions, economic sectors, and potential unintended consequences. Refer to the Texas Legislative Budget Board and similar authoritative sources as appropriate.
`;
}

/**
 * Generate a basic analysis when full bill text is not available
 * @param bill The bill to analyze
 * @returns A basic impact analysis
 */
function generateBasicAnalysis(bill: Bill): any {
  const today = new Date().toISOString().split('T')[0];
  
  // Extract category from bill metadata if available
  const category = bill.category || "Uncategorized";
  
  // Create a basic analysis based on the bill's title and summary
  return {
    billId: bill.id,
    title: bill.title,
    executiveSummary: `This is a preliminary analysis of ${bill.id}: "${bill.title}". A comprehensive analysis would require the full text of the bill.`,
    impactScores: {
      overall: 5,
      economic: 5,
      social: 5,
      environmental: 5,
      legal: 5,
      governance: 5
    },
    keyStakeholders: {
      beneficiaries: ["Texas residents", "Specific stakeholders would be identified with full bill text"],
      adverselyAffected: ["Potentially impacted groups would be identified with full bill text"],
      neutralParties: ["General public"]
    },
    regionalImpacts: [
      {
        region: "Statewide",
        impact: "General impact across Texas, with specific regional effects to be determined",
        severityScore: 5
      }
    ],
    implementationAnalysis: {
      timeframe: "To be determined based on bill specifics",
      feasibility: 5,
      resourceRequirements: "Resource requirements would be determined with full bill text",
      potentialChallenges: ["Implementation challenges would be identified with full bill text"]
    },
    complianceRequirements: ["Specific compliance requirements would be determined with full bill text"],
    budgetaryImplications: {
      estimatedCost: "Cost estimates would require full bill text and fiscal note analysis",
      fundingSources: ["Potential funding sources would be identified with full bill text"],
      fiscalImpact: "Fiscal impact assessment would require full bill analysis"
    },
    comparativeContext: {
      similarLegislation: ["Similar legislation would be identified with full bill context"],
      historicalContext: "Historical context would be provided with complete bill analysis"
    },
    recommendations: [
      "Obtain full bill text for comprehensive analysis",
      "Review Legislative Budget Board fiscal note when available",
      "Monitor bill progress through the legislative process"
    ],
    technicalDetails: {
      aiConfidence: 3,
      dataSourcesUsed: ["Limited bill metadata", "Texas Legislature Online basic information"],
      analysisDate: today
    }
  };
}

/**
 * Generate a personalized impact assessment based on user demographics and bill analysis
 * @param billAnalysis The bill's impact analysis
 * @param demographics User demographics
 * @returns A personalized impact assessment
 */
export async function generatePersonalizedImpact(billAnalysis: any, demographics: any): Promise<any> {
  try {
    // Build the prompt for personalized impact
    const prompt = `
I need a personalized impact assessment for a Texas bill based on specific user demographics.

Bill Analysis:
${JSON.stringify(billAnalysis, null, 2)}

User Demographics:
${JSON.stringify(demographics, null, 2)}

Please provide a personalized impact assessment in JSON format with the following structure:
{
  "personalSummary": "string",
  "relevanceScore": number (0-100),
  "keyImpacts": [
    {
      "area": "string",
      "description": "string",
      "severity": number (1-10),
      "timeline": "string"
    }
  ],
  "householdImpact": "string",
  "financialImpact": {
    "description": "string",
    "estimatedChange": "string"
  },
  "recommendedActions": [
    {
      "action": "string",
      "benefit": "string"
    }
  ],
  "sentiment": "positive" | "negative" | "neutral" | "mixed"
}

Focus on how this specific bill would impact this individual based on their demographics, location, occupation, property ownership status, income level, etc. Provide specific, actionable insights.
`;

    // Call OpenAI API to generate the personalized impact assessment
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a legislative impact analyst specializing in personalizing the impacts 
          of Texas legislation for individual citizens. You translate complex legislative analyses 
          into practical, relevant implications for specific individuals based on their demographic 
          information. Your assessments are factual, specific, and tailored to the individual's 
          circumstances.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const personalizedText = response.choices[0].message.content;
    const personalizedImpact = JSON.parse(personalizedText);

    return personalizedImpact;
  } catch (error: any) {
    log.error({ err: error }, "Error generating personalized impact");
    throw error;
  }
}

/**
 * Generate a comparison between two bills
 * @param analysis1 First bill's impact analysis
 * @param analysis2 Second bill's impact analysis
 * @returns A comparative analysis of the two bills
 */
export async function generateBillComparison(analysis1: any, analysis2: any): Promise<any> {
  try {
    // Build the prompt for bill comparison
    const prompt = `
I need a comparative analysis of two Texas bills based on their legislative impact analyses.

First Bill Analysis:
${JSON.stringify(analysis1, null, 2)}

Second Bill Analysis:
${JSON.stringify(analysis2, null, 2)}

Please provide a comparative analysis in JSON format with the following structure:
{
  "comparisonSummary": "string",
  "impactScoreComparison": {
    "overall": {
      "difference": number,
      "analysis": "string"
    },
    "economic": {
      "difference": number,
      "analysis": "string"
    },
    "social": {
      "difference": number,
      "analysis": "string"
    },
    "environmental": {
      "difference": number,
      "analysis": "string"
    },
    "legal": {
      "difference": number,
      "analysis": "string"
    },
    "governance": {
      "difference": number,
      "analysis": "string"
    }
  },
  "stakeholderComparison": {
    "commonBeneficiaries": ["string"],
    "commonAdverselyAffected": ["string"],
    "divergentImpacts": "string"
  },
  "implementationComparison": {
    "timeframeComparison": "string",
    "feasibilityComparison": "string",
    "resourceComparison": "string"
  },
  "budgetaryComparison": {
    "costDifference": "string",
    "fiscalImpactComparison": "string"
  },
  "recommendationSynthesis": ["string"],
  "conclusionStatement": "string"
}

Highlight key similarities and differences, trade-offs between the bills, and provide objective analysis of which bill might be more effective or preferable in different scenarios.
`;

    // Call OpenAI API to generate the bill comparison
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a comparative policy analyst specializing in Texas legislation. 
          You excel at objectively analyzing and comparing different bills addressing similar 
          issues. Your comparisons highlight key similarities, differences, trade-offs, and 
          relative strengths and weaknesses of different legislative approaches. Your analyses 
          are balanced, factual, and avoid political bias.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const comparisonText = response.choices[0].message.content;
    const comparison = JSON.parse(comparisonText);

    return comparison;
  } catch (error: any) {
    log.error({ err: error }, "Error generating bill comparison");
    throw error;
  }
}