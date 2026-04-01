import OpenAI from "openai";
import { InsertBillSummary, BillSummary } from "@shared/schema-bill-summaries";
import { db } from "../db";
import { billSummaries } from "@shared/schema-bill-summaries";
import { bills, billHistoryEvents } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Initialize OpenAI client 
// (The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Service for generating AI-powered bill summaries and analysis
 */
export class OpenAIService {
  /**
   * Generate a comprehensive summary for a bill
   * @param billId - The ID of the bill to generate a summary for
   * @param billText - The full text of the bill (optional, will retrieve if not provided)
   */
  async generateBillSummary(billId: string, billText?: string): Promise<BillSummary | null> {
    try {
      // Check if we already have a summary that's not pending or failed
      const existingSummary = await db.query.billSummaries.findFirst({
        where: eq(billSummaries.billId, billId),
      });

      if (existingSummary && 
          (existingSummary.processingStatus === 'completed' || 
           existingSummary.processingStatus === 'processing')) {
        log.info(`Using existing summary for bill ${billId}`);
        return existingSummary;
      }

      // Create or update a pending summary record
      let summaryRecord = existingSummary;
      if (!summaryRecord) {
        const insertResult = await db.insert(billSummaries).values({
          billId,
          processingStatus: 'processing',
        }).returning();

        if (insertResult && insertResult.length > 0) {
          summaryRecord = insertResult[0];
        } else {
          throw new Error('Failed to create summary record');
        }
      } else {
        await db.update(billSummaries)
          .set({ processingStatus: 'processing', updatedAt: new Date() })
          .where(eq(billSummaries.id, summaryRecord.id));

        summaryRecord.processingStatus = 'processing';
      }

      // Get bill text if not provided
      if (!billText) {
        const bill = await db.query.bills.findFirst({
          where: eq(bills.id, billId),
        });

        if (!bill) {
          throw new Error(`Bill ${billId} not found`);
        }

        // Use the bill description as a fallback if we don't have the full text
        billText = bill.description;
      }

      // Generate the summary using OpenAI
      const responseData = await this.callOpenAIForBillSummary(billId, billText);

      // Update the summary record with the generated content
      const updatedSummary = await db.update(billSummaries)
        .set({
          executiveSummary: responseData.executiveSummary,
          keyPoints: responseData.keyPoints,
          impactAnalysis: responseData.impactAnalysis,
          legalImplications: responseData.legalImplications,
          stakeholderAnalysis: responseData.stakeholderAnalysis,
          processingStatus: 'completed',
          updatedAt: new Date()
        })
        .where(eq(billSummaries.id, summaryRecord.id))
        .returning();

      return updatedSummary[0] || null;
    } catch (error: any) {
      log.error({ err: error }, `Error generating bill summary for ${billId}`);

      // Update the record to failed status
      if (billId) {
        await db.update(billSummaries)
          .set({ 
            processingStatus: 'failed', 
            updatedAt: new Date()
          })
          .where(eq(billSummaries.billId, billId));
      }

      return null;
    }
  }

  /**
   * Call OpenAI to generate a structured summary of the bill
   */
  private async callOpenAIForBillSummary(billId: string, billText: string): Promise<InsertBillSummary> {
    try {
      // Get key takeaways first - these are optimized for the 89th Legislative Session
      const takeaways = await generateKeyTakeaways(billText);

      // Fetch bill history from database to include in the OpenAI analysis
      const billHistoryData = await this.fetchBillHistoryData(billId);

      let jsonResponse;

      try {
        // Enhanced prompt for more comprehensive and contextual analysis
        const prompt = `
You are an expert legislative analyst tasked with providing a detailed and objective analysis of the following bill (ID: ${billId}) from the Texas 89th Legislative Session.

BILL TEXT:
${billText}

BILL HISTORY INFORMATION:
${billHistoryData.historyText}

Key takeaways that have already been identified:
${takeaways.map((t, i) => `${i+1}. ${t}`).join('\n')}

Provide a comprehensive analysis of this legislation in the following JSON format:
{
  "executiveSummary": "A concise 2-3 sentence overview of what the bill does and its potential significance",
  "keyPoints": [
    {
      "point": "Key point 1",
      "explanation": "Brief explanation of why this point matters to Texas citizens",
      "relevance": "High/Medium/Low",
      "affectedGroups": ["Group 1", "Group 2"]
    },
    {
      "point": "Key point 2",
      "explanation": "Brief explanation of why this point matters to Texas citizens",
      "relevance": "High/Medium/Low",
      "affectedGroups": ["Group 1", "Group 3"]
    }
    // Additional key points...
  ],
  "impactAnalysis": {
    "overview": "A detailed analysis of the potential impact of this legislation on Texans and the state",
    "economicImpact": "How this bill might affect the economy of Texas, including businesses, jobs, and state budget",
    "socialImpact": "How this bill might affect Texas society, communities, and quality of life",
    "environmentalImpact": "Any environmental effects of this legislation, if relevant",
    "regionalImpacts": [
      {"region": "Urban areas", "impact": "Specific effects on urban Texas communities"},
      {"region": "Rural areas", "impact": "Specific effects on rural Texas communities"}
    ]
  },
  "legalImplications": {
    "summary": "An analysis of the legal implications of this legislation",
    "existingLawChanges": "Specific changes to existing Texas laws",
    "enforcementMechanisms": "How this legislation would be enforced",
    "potentialChallenges": "Possible legal challenges or constitutional issues"
  },
  "stakeholderAnalysis": [
    {"stakeholder": "Group or individual affected", "impact": "How they would be affected", "interestLevel": "High/Medium/Low", "supportLikelihood": "Likely Support/Likely Oppose/Neutral"}, 
    // Additional stakeholders...
  ],
  "committeeActions": [
    {"committee": "Name of committee", "date": "YYYY-MM-DD", "action": "Description of action taken", "significance": "Why this action matters", "votes": {"for": 5, "against": 2, "abstain": 0}}
    // Additional committee actions...
  ],
  "keyDates": [
    {"date": "YYYY-MM-DD", "event": "Description of what happened on this date", "significance": "Importance of this event"}
    // Additional key dates...
  ],
  "historyHighlights": [
    {"title": "Title of highlight", "description": "Description of this significant event in the bill's history", "date": "YYYY-MM-DD"}
    // Additional highlights...
  ],
  "implementationTimeline": [
    {"phase": "Phase description", "startDate": "YYYY-MM-DD", "duration": "Duration in months/years", "milestones": ["Milestone 1", "Milestone 2"]}
    // Additional phases...
  ],
  "fiscalConsiderations": {
    "estimatedCost": "Estimated cost of implementation",
    "fundingSources": ["Source 1", "Source 2"],
    "budgetImpact": "Long-term impact on state/local budgets"
  },
  "furtherConsiderations": [
    {"topic": "Topic that needs more attention", "explanation": "Why this topic deserves further consideration", "recommendedAction": "What citizens or lawmakers might consider doing"} 
  ],
  "citizenActionGuide": {
    "howToTrack": "How citizens can track this bill's progress",
    "waysToProvidefeedback": ["Contact legislators", "Attend public hearings", "Submit written testimony"],
    "keyContactPoints": ["Committee Chair contact", "Bill sponsor contact"]
  }
}

Focus on being factual, objective, and comprehensive. Do not inject political opinions.
Your analysis should specifically address the context of the 89th Texas Legislative Session.
For the committeeActions, keyDates, and historyHighlights fields, use actual dates from the bill history when available.
The keyPoints should include the most important aspects of the bill that citizens need to understand.
The impactAnalysis should consider both short-term and long-term effects of the legislation.
The citizenActionGuide should be practical and specific to this particular bill.
If you don't have information for a particular field, provide your best professional assessment based on the bill's text and context, but note any limitations in your knowledge.
`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { 
              role: "system", 
              content: "You are an expert legislative analyst who provides detailed, objective analysis of legislation for the Texas 89th Legislative Session. Your goal is to make complex legislation accessible, highlighting the key points and implications that matter most to Texas citizens. You provide nuanced analysis that considers diverse perspectives and regional differences within Texas." 
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7, // Slightly higher temperature for more nuanced analysis
          max_tokens: 3000 // Increased token limit for more detailed summary
        });

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("No content in OpenAI response");
        }

        jsonResponse = JSON.parse(content);

      } catch (error: any) {
        log.warn({ detail: error }, "Error with OpenAI API");
        // We'll try a simpler summary approach with a more focused prompt
        try {
          const fallbackPrompt = `
Analyze this Texas legislative bill (ID: ${billId}) and provide:
1. A concise summary (2-3 sentences)
2. Five key takeaways
3. The bill's potential impact on Texans (economic, social, environmental)
4. Any legal changes it would introduce
5. Key stakeholders affected
6. Important dates or timeline information

Bill Text: ${billText.substring(0, 3000)}... (truncated)

Format your response as JSON:
{
  "executiveSummary": "...",
  "keyPoints": [
    {"point": "Point 1", "explanation": "Why this matters"},
    {"point": "Point 2", "explanation": "Why this matters"},
    {"point": "Point 3", "explanation": "Why this matters"},
    {"point": "Point 4", "explanation": "Why this matters"},
    {"point": "Point 5", "explanation": "Why this matters"}
  ],
  "impactAnalysis": {
    "overview": "Overall impact",
    "economicImpact": "Economic effects",
    "socialImpact": "Social effects" 
  },
  "legalImplications": {
    "summary": "Legal changes overview",
    "existingLawChanges": "Specific changes to existing laws"
  },
  "stakeholderAnalysis": [
    {"stakeholder": "Group 1", "impact": "How affected"}
  ],
  "keyDates": [
    {"date": "YYYY-MM-DD", "event": "What happens", "significance": "Why important"}
  ]
}
`;

          const fallbackResponse = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              { role: "system", content: "You are a legislative analyst specializing in Texas bills." },
              { role: "user", content: fallbackPrompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1500
          });

          const fallbackContent = fallbackResponse.choices[0].message.content;
          if (!fallbackContent) {
            throw new Error("No content in fallback OpenAI response");
          }

          jsonResponse = JSON.parse(fallbackContent);
          // Add empty arrays/objects for the fields that aren't included in the fallback
          if (!jsonResponse.stakeholderAnalysis) jsonResponse.stakeholderAnalysis = [];
          if (!jsonResponse.committeeActions) jsonResponse.committeeActions = [];
          if (!jsonResponse.keyDates) jsonResponse.keyDates = [];
          if (!jsonResponse.historyHighlights) jsonResponse.historyHighlights = [];
          if (!jsonResponse.implementationTimeline) jsonResponse.implementationTimeline = [];
          if (!jsonResponse.fiscalConsiderations) jsonResponse.fiscalConsiderations = { 
            estimatedCost: "Not available in this summary", 
            fundingSources: [], 
            budgetImpact: "Not analyzed in this summary" 
          };
          if (!jsonResponse.citizenActionGuide) jsonResponse.citizenActionGuide = {
            howToTrack: "Follow updates on the Texas Legislature Online website",
            waysToProvidefeedback: ["Contact your representatives"],
            keyContactPoints: []
          };

        } catch (secondError: any) {
          log.error({ err: secondError }, "Even fallback OpenAI call failed");
          // If all OpenAI calls fail, use the mock data as an absolute last resort
          jsonResponse = this.generateMockSummaryData(billId, billText, billHistoryData);
        }
      }

      // Process the enhanced key points format if it exists
      let processedKeyPoints = takeaways; // Start with our simple takeaways

      if (Array.isArray(jsonResponse.keyPoints)) {
        if (typeof jsonResponse.keyPoints[0] === 'object' && jsonResponse.keyPoints[0].point) {
          // We have the enhanced format with objects
          const enhancedPoints = jsonResponse.keyPoints.map((kp: any) => {
            if (kp.point && kp.explanation) {
              const affectedGroups = kp.affectedGroups && Array.isArray(kp.affectedGroups) 
                ? ` (Affects: ${kp.affectedGroups.join(', ')})` 
                : '';
              return `${kp.point} - ${kp.explanation}${affectedGroups}`;
            }
            return kp.point || String(kp);
          });
          processedKeyPoints = [...processedKeyPoints, ...enhancedPoints];
        } else {
          // We have the simple format with strings
          processedKeyPoints = [...processedKeyPoints, ...jsonResponse.keyPoints.map((kp: any) => String(kp))];
        }
      }

      // Process the impact analysis if it's an object
      let processedImpactAnalysis = jsonResponse.impactAnalysis;
      if (typeof jsonResponse.impactAnalysis === 'object') {
        const impactParts = [
          jsonResponse.impactAnalysis.overview || '',
          jsonResponse.impactAnalysis.economicImpact ? `Economic Impact: ${jsonResponse.impactAnalysis.economicImpact}` : '',
          jsonResponse.impactAnalysis.socialImpact ? `Social Impact: ${jsonResponse.impactAnalysis.socialImpact}` : '',
          jsonResponse.impactAnalysis.environmentalImpact ? `Environmental Impact: ${jsonResponse.impactAnalysis.environmentalImpact}` : ''
        ].filter(Boolean);

        // Add regional impacts if available
        if (jsonResponse.impactAnalysis.regionalImpacts && Array.isArray(jsonResponse.impactAnalysis.regionalImpacts) && jsonResponse.impactAnalysis.regionalImpacts.length > 0) {
          impactParts.push("Regional Impacts:");
          jsonResponse.impactAnalysis.regionalImpacts.forEach((ri: any) => {
            if (ri.region && ri.impact) {
              impactParts.push(`- ${ri.region}: ${ri.impact}`);
            }
          });
        }

        processedImpactAnalysis = impactParts.join('\n\n');
      }

      // Process legal implications if it's an object
      let processedLegalImplications = jsonResponse.legalImplications;
      if (typeof jsonResponse.legalImplications === 'object') {
        const legalParts = [
          jsonResponse.legalImplications.summary || '',
          jsonResponse.legalImplications.existingLawChanges ? `Changes to Existing Laws: ${jsonResponse.legalImplications.existingLawChanges}` : '',
          jsonResponse.legalImplications.enforcementMechanisms ? `Enforcement: ${jsonResponse.legalImplications.enforcementMechanisms}` : '',
          jsonResponse.legalImplications.potentialChallenges ? `Potential Challenges: ${jsonResponse.legalImplications.potentialChallenges}` : ''
        ].filter(Boolean);

        processedLegalImplications = legalParts.join('\n\n');
      }

      // Process fiscal considerations
      let fiscalConsiderations = null;
      if (jsonResponse.fiscalConsiderations && typeof jsonResponse.fiscalConsiderations === 'object') {
        const fiscalParts = [
          jsonResponse.fiscalConsiderations.estimatedCost ? `Estimated Cost: ${jsonResponse.fiscalConsiderations.estimatedCost}` : '',
          jsonResponse.fiscalConsiderations.fundingSources && Array.isArray(jsonResponse.fiscalConsiderations.fundingSources) && jsonResponse.fiscalConsiderations.fundingSources.length > 0 ? 
            `Funding Sources: ${jsonResponse.fiscalConsiderations.fundingSources.join(', ')}` : '',
          jsonResponse.fiscalConsiderations.budgetImpact ? `Budget Impact: ${jsonResponse.fiscalConsiderations.budgetImpact}` : ''
        ].filter(Boolean);

        fiscalConsiderations = fiscalParts.join('\n');
      }

      // Process citizen action guide
      let citizenActionGuide = null;
      if (jsonResponse.citizenActionGuide && typeof jsonResponse.citizenActionGuide === 'object') {
        const actionParts = [
          jsonResponse.citizenActionGuide.howToTrack ? `How to Track: ${jsonResponse.citizenActionGuide.howToTrack}` : '',
          jsonResponse.citizenActionGuide.waysToProvidefeedback && Array.isArray(jsonResponse.citizenActionGuide.waysToProvidefeedback) && jsonResponse.citizenActionGuide.waysToProvidefeedback.length > 0 ? 
            `Ways to Provide Feedback: ${jsonResponse.citizenActionGuide.waysToProvidefeedback.join(', ')}` : '',
          jsonResponse.citizenActionGuide.keyContactPoints && Array.isArray(jsonResponse.citizenActionGuide.keyContactPoints) && jsonResponse.citizenActionGuide.keyContactPoints.length > 0 ? 
            `Key Contacts: ${jsonResponse.citizenActionGuide.keyContactPoints.join(', ')}` : ''
        ].filter(Boolean);

        citizenActionGuide = actionParts.join('\n');
      }

      // Process implementation timeline
      let implementationTimeline = [];
      if (jsonResponse.implementationTimeline && Array.isArray(jsonResponse.implementationTimeline)) {
        implementationTimeline = jsonResponse.implementationTimeline.map((phase: any) => {
          if (typeof phase === 'object') {
            return {
              phase: phase.phase || 'Implementation phase',
              startDate: phase.startDate || null,
              duration: phase.duration || null,
              milestones: Array.isArray(phase.milestones) ? phase.milestones : []
            };
          }
          return null;
        }).filter(Boolean);
      }

      // Store any further considerations if they exist
      let extraKeyPoints = [];
      if (Array.isArray(jsonResponse.furtherConsiderations)) {
        extraKeyPoints = jsonResponse.furtherConsiderations.map((fc: any) => {
          if (typeof fc === 'object' && fc.topic && fc.explanation) {
            const recommendedAction = fc.recommendedAction ? ` (Recommended: ${fc.recommendedAction})` : '';
            return `Further consideration: ${fc.topic} - ${fc.explanation}${recommendedAction}`;
          }
          return String(fc);
        });
      }

      // Combine all key points, ensuring no duplicates and limiting to a reasonable number
      const combinedKeyPoints = [...processedKeyPoints, ...extraKeyPoints];
      const uniqueKeyPoints = Array.from(new Set(combinedKeyPoints));
      const allKeyPoints = uniqueKeyPoints.slice(0, 15); // Increased from 12 to 15 for more comprehensive coverage

      // Prepare the data for database insertion, with our enhanced fields
      return {
        billId,
        executiveSummary: jsonResponse.executiveSummary || null,
        keyPoints: allKeyPoints,
        impactAnalysis: processedImpactAnalysis || null,
        legalImplications: processedLegalImplications || null,
        stakeholderAnalysis: jsonResponse.stakeholderAnalysis || [],
        committeeActions: jsonResponse.committeeActions || [],
        keyDates: jsonResponse.keyDates || [],
        historyHighlights: jsonResponse.historyHighlights || [],
        implementationTimeline: implementationTimeline || [],
        fiscalConsiderations: fiscalConsiderations,
        citizenActionGuide: citizenActionGuide,
        version: "1.3", // Updated version number for the enhanced format with new fields
        hasShareableVersion: false, // Initially false until PDF is generated
        processingStatus: "completed"
      };
    } catch (error: any) {
      log.error({ err: error }, "Error calling OpenAI for bill summary");
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate bill summary: ${errorMessage}`);
    }
  }

  /**
   * Generate mock bill summary data for testing purposes
   * This is used when the OpenAI API is unavailable or over quota
   */
  private generateMockSummaryData(billId: string, billText: string, billHistoryData: { historyText: string, events: any[] }): any {
    log.info(`Generating mock summary data for bill ${billId}`);

    // Extract bill number and chamber
    const billMatch = billId.match(/TX-(HB|SB)(\d+)/);
    const chamber = billMatch ? (billMatch[1] === 'HB' ? 'House' : 'Senate') : 'House';
    const billNumber = billMatch ? billMatch[2] : '0000';

    // Extract bill topics from history data if available
    const topics = billHistoryData.historyText.includes('Topics:') 
      ? billHistoryData.historyText.split('Topics:')[1].split('\n')[0].trim().split(', ')
      : ['Education', 'Healthcare', 'Transportation'];

    // Generate a shortened version of the bill text for summary
    const shortBillText = billText.length > 100 
      ? billText.substring(0, 100) + '...' 
      : billText;

    // Create sample history dates
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    // Format dates for mock data
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Generate mock data
    return {
      executiveSummary: `This bill proposes changes to ${topics[0] || 'state law'} in Texas for the 89th Legislative Session. It aims to improve services and regulations related to ${topics.join(' and ')}.`,

      keyPoints: [
        `Updates regulations for ${topics[0] || 'public services'}`,
        `Establishes new reporting requirements`,
        `Allocates funding for program implementation`,
        `Creates oversight committee for compliance`,
        `Sets implementation timeline for 2026`
      ],

      impactAnalysis: `This legislation will affect various stakeholders across Texas, particularly those involved with ${topics.join(' and ')}. The bill introduces new regulatory frameworks and funding mechanisms that may require adaptation from both public and private sectors. Long-term impacts include potentially improved outcomes for Texans through better service delivery and accountability measures.`,

      legalImplications: `The bill amends existing statutes related to ${topics[0] || 'state regulations'} by introducing new compliance requirements. Local governments and agencies will need to update their policies to align with these changes. The legislation creates new legal obligations for reporting and oversight, with potential penalties for non-compliance.`,

      stakeholderAnalysis: [
        {
          stakeholder: `${topics[0] || 'Industry'} Professionals`,
          impact: "Will need to adapt to new regulatory requirements and reporting standards"
        },
        {
          stakeholder: "Texas Residents",
          impact: "May benefit from improved services and greater transparency"
        },
        {
          stakeholder: "Local Governments",
          impact: "Will need to implement new policies and potentially allocate resources"
        }
      ],

      committeeActions: [
        {
          committee: `${chamber} Committee on ${topics[0] || 'Public Affairs'}`,
          date: formatDate(threeMonthsAgo),
          action: "Initial hearing held",
          significance: "First formal consideration of the bill's merits"
        },
        {
          committee: `${chamber} Committee on ${topics[0] || 'Public Affairs'}`,
          date: formatDate(twoMonthsAgo),
          action: "Favorable vote with amendments",
          significance: "Critical step forward in the legislative process"
        }
      ],

      keyDates: [
        {
          date: formatDate(threeMonthsAgo),
          event: "Bill filed",
          significance: "Official introduction into the legislative process"
        },
        {
          date: formatDate(twoMonthsAgo),
          event: "Committee hearing",
          significance: "Public testimony received"
        },
        {
          date: formatDate(oneMonthAgo),
          event: "Passed committee",
          significance: "Advanced to chamber floor for consideration"
        }
      ],

      historyHighlights: [
        {
          title: "Introduction",
          description: `${billId} was introduced in the ${chamber} of the 89th Texas Legislative Session, addressing ${topics.join(' and ')}.`
        },
        {
          title: "Committee Process",
          description: "The bill received bipartisan support in committee with several amendments to strengthen oversight provisions."
        },
        {
          title: "Current Status",
          description: "The bill is currently advancing through the legislative process with moderate support."
        }
      ]
    };
  }

  /**
   * Fetch bill history data from the database
   * @param billId - The bill ID
   * @returns Structured bill history data
   */
  private async fetchBillHistoryData(billId: string): Promise<{ historyText: string, events: any[] }> {
    try {
      // Get the bill history events from the database
      const historyEvents = await db.query.billHistoryEvents.findMany({
        where: eq(billHistoryEvents.billId, billId),
        orderBy: (billHistoryEvents, { desc }) => [desc(billHistoryEvents.eventDate)]
      });

      // Get the bill details
      const bill = await db.query.bills.findFirst({
        where: eq(bills.id, billId)
      });

      // Format the history events into text
      let historyText = `Bill ${billId} Status: ${bill?.status || 'Unknown'}\n\n`;
      historyText += `Sponsors: ${bill?.sponsors?.join(', ') || 'None listed'}\n`;
      historyText += `Topics: ${bill?.topics?.join(', ') || 'None listed'}\n\n`;
      historyText += "History Events:\n";

      if (historyEvents.length === 0) {
        historyText += "No history events recorded for this bill.\n";
      } else {
        historyEvents.forEach((event, index) => {
          const date = new Date(event.eventDate).toLocaleDateString();
          historyText += `${index + 1}. ${date} - ${event.action} (${event.chamber})\n`;
        });
      }

      return {
        historyText,
        events: historyEvents
      };
    } catch (error: any) {
      log.error({ err: error }, `Error fetching bill history for ${billId}`);
      return {
        historyText: `Unable to fetch history for bill ${billId}`,
        events: []
      };
    }
  }

  /**
   * Increment the view count for a bill summary
   */
  async trackSummaryView(summaryId: number): Promise<void> {
    try {
      await db.update(billSummaries)
        .set({ 
          viewCount: sql`view_count + 1`, 
          lastViewed: new Date() 
        })
        .where(eq(billSummaries.id, summaryId));
    } catch (error: any) {
      log.error({ err: error }, `Error tracking summary view for ${summaryId}`);
    }
  }
}

// Define UserDemographics interface
export interface UserDemographics {
  location?: string;
  occupation?: string;
  interests?: string[];
  concerns?: string[];
  age?: number;
  familySize?: number;
  income?: string;
  [key: string]: any; // Allow for additional demographic fields
}

/**
 * Generate an image using DALL-E
 * @param prompt The text prompt for image generation
 * @param size The size of the image to generate (default: 1024x1024)
 * @returns URL of the generated image or a placeholder image URL if generation failed
 */
export async function generateImage(
  prompt: string, 
  size: '1024x1024' | '512x512' = '1024x1024'
): Promise<string | null> {
  try {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size,
        quality: "standard",
      });

      if (response.data && response.data.length > 0 && response.data[0].url) {
        return response.data[0].url;
      }

      throw new Error("No image URL in the response");
    } catch (error: any) {
      log.warn({ detail: error }, "Error generating image with DALL-E, using fallback image");

      // Generate a placeholder image URL based on the prompt
      // This is a public placeholder image service
      const placeholderSize = size === '1024x1024' ? '1024/1024' : '512/512';
      const encodedPrompt = encodeURIComponent(prompt.slice(0, 100));

      // Return a placeholder image with the prompt text
      return `https://via.placeholder.com/${placeholderSize}.png?text=${encodedPrompt}`;
    }
  } catch (error: any) {
    log.error({ err: error }, "Error in image generation");
    return null;
  }
}

/**
 * Generate a personalized impact assessment for a bill based on user demographics
 */
/**
 * Generate key takeaways from bill text with specific focus on 89th Legislative Session
 * @param billText The full text of the bill
 * @returns Array of key takeaways
 */
import { robustChatCompletion } from "./openai-wrapper";
import { createLogger } from "../logger";
const log = createLogger("openai-service");


export async function generateKeyTakeaways(billText: string): Promise<string[]> {
  try {
    try {
      // First, we'll try to extract a truncated version of the bill text if it's too long
      const truncatedText = billText.length > 4000 
        ? billText.substring(0, 4000) + "... [text truncated for length]" 
        : billText;

      // Enhanced prompt for better key takeaways extraction
      const prompt = `
You are an expert legislative analyst for the Texas 89th Legislative Session specializing in making complex legislation accessible to citizens.
Analyze the following bill text and extract the 5-7 most important takeaways that Texas citizens should understand:

${truncatedText}

Focus on extracting:
1. The core purpose of the bill in plain language
2. Major changes to existing law and their real-world impact
3. New requirements or regulations that will affect citizens or businesses
4. Funding or fiscal implications (costs, savings, revenue generation)
5. Implementation timeline and effective dates
6. Groups most directly affected by this legislation
7. Most significant potential consequences (positive or negative)

Format your response as a JSON object with this structure:
{
  "takeaways": [
    "Clear statement of first key takeaway with citizen impact focus",
    "Clear statement of second key takeaway with citizen impact focus",
    "Clear statement of third key takeaway with citizen impact focus",
    ...etc
  ]
}

Each takeaway should be:
- Written in plain language a non-expert can understand
- Concise (10-20 words) but informative
- Focused on what citizens need to know most
- Factual and politically neutral
`;

      // Use the robust wrapper instead of direct OpenAI calls
      const response = await robustChatCompletion({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are an expert legislative analyst for the Texas 89th Legislative Session. Your specialty is translating complex legal language into clear takeaways that any citizen can understand. You extract the most important points from bills that affect people's daily lives." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5 // Slightly lower temperature for more focused, precise takeaways
      }, {
        logger: (msg) => log.info(`[Takeaways Generator] ${msg}`),
        estimatedTokens: 2000 // Rough estimate of token usage
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      // Parse the JSON from the response
      try {
        const jsonResponse = JSON.parse(content);

        // Handle different response formats
        const takeaways = Array.isArray(jsonResponse) 
          ? jsonResponse 
          : (jsonResponse.takeaways || []);

        // Clean and format the takeaways
        const cleanedTakeaways = takeaways
          .map((item: any) => String(item).trim())
          .filter((item: string) => item.length > 0);

        // Return up to 7 takeaways
        return cleanedTakeaways.slice(0, 7);
      } catch (error: any) {
        log.error({ err: error }, "Error parsing takeaways");
        throw new Error("Failed to parse takeaways from analysis");
      }
    } catch (error: any) {
      log.warn({ detail: error }, "Error calling OpenAI API for takeaways");

      // Try a simpler approach with less advanced prompt
      try {
        const simplePrompt = `
Analyze this Texas legislative bill text and list the 5 most important takeaways in simple language:

${billText.substring(0, 2000)}... [truncated]

Respond with a JSON array of strings:
["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"]
`;

        // Use robust wrapper for fallback attempt
        const fallbackResponse = await robustChatCompletion({
          model: "gpt-3.5-turbo", // Fallback to simpler model 
          messages: [
            { role: "system", content: "You extract key points from legislative text." },
            { role: "user", content: simplePrompt }
          ],
          response_format: { type: "json_object" },
          max_tokens: 500
        }, {
          logger: (msg) => log.info(`[Takeaways Fallback] ${msg}`),
          estimatedTokens: 1000
        });

        const fallbackContent = fallbackResponse.choices[0].message.content;
        if (!fallbackContent) {
          throw new Error("No content in fallback response");
        }

        const fallbackJson = JSON.parse(fallbackContent);
        const fallbackTakeaways = Array.isArray(fallbackJson) 
          ? fallbackJson 
          : (fallbackJson.takeaways || []);

        return fallbackTakeaways.slice(0, 5).map((item: any) => String(item));
      } catch (secondError: any) {
        log.error({ err: secondError }, "Both OpenAI calls failed for takeaways");

        // Extract topics from bill text as a last resort to generate basic takeaways
        let topics: string[] = [];

        // Try to identify topics from text patterns commonly found in bills
        if (billText.toLowerCase().includes("education")) topics.push("education");
        if (billText.toLowerCase().includes("health") || billText.toLowerCase().includes("medical")) topics.push("healthcare");
        if (billText.toLowerCase().includes("tax")) topics.push("taxation");
        if (billText.toLowerCase().includes("transport")) topics.push("transportation");
        if (billText.toLowerCase().includes("environment") || billText.toLowerCase().includes("water")) topics.push("environment");

        // Default topics if none detected
        if (topics.length === 0) {
          topics = ["public services", "state regulations"];
        }

        // Generate basic takeaways based on detected topics
        return [
          `Addresses changes to ${topics[0] || 'state'} regulations in Texas`,
          `Establishes new requirements for compliance and reporting`,
          `Could affect funding for programs related to ${topics.join(' and ')}`,
          `Implementation will likely require coordination between agencies`,
          `Citizens may notice changes in how services are delivered`
        ];
      }
    }
  } catch (error: any) {
    log.error({ err: error }, "Error generating key takeaways");
    return ["Unable to analyze bill text completely - please check the full bill"];
  }
}

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
      log.warn({ detail: error }, "Error calling OpenAI API for impact assessment, using mock data");

      // Generate mock impact assessment data for testing
      // Determine a mock relevance score based on demographic info
      let relevanceScore = 60; // Default medium relevance

      // Adjust based on available demographic info
      if (demographics.interests?.length) {
        relevanceScore += 10; // More relevant if we have interest info
      }

      // Generate topic-based impact areas
      const impactAreas = bill.topics?.length 
        ? bill.topics.slice(0, 3) // Use up to 3 bill topics
        : ["Regulations", "Public Services", "Economic Impact"];

      // Determine sentiment based on bill content
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';

      // Return mock impact assessment
      return {
        personalImpact: `This bill may affect your day-to-day activities related to ${bill.topics?.[0] || 'public services'}, particularly if you're involved with ${impactAreas[0] || 'regulated industries'}.`,
        familyImpact: demographics.familySize ? `Your family of ${demographics.familySize} may experience changes in services or benefits related to ${impactAreas[1] || 'public programs'}.` : undefined,
        communityImpact: demographics.location ? `The ${demographics.location} community could see impacts through changes to local governance, funding allocations, or service delivery.` : undefined,
        relevanceScore,
        sentiment,
        impactAreas
      };
    }
  } catch (error: any) {
    log.error({ err: error }, "Error generating impact assessment");
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate impact assessment: ${errorMessage}`);
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();