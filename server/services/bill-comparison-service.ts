// @ts-nocheck
import OpenAI from 'openai';
import { legiscanService } from './legiscan-service';
import { createLogger } from "../logger";
const log = createLogger("bill-comparison-service");


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface BillComparison {
  id: string;
  bill1: {
    id: number;
    number: string;
    title: string;
    status: string;
    summary: string;
    keyProvisions: string[];
    sponsors: string[];
    lastAction: string;
  };
  bill2: {
    id: number;
    number: string;
    title: string;
    status: string;
    summary: string;
    keyProvisions: string[];
    sponsors: string[];
    lastAction: string;
  };
  comparison: {
    similarities: string[];
    differences: string[];
    conflictAreas: string[];
    complementaryAspects: string[];
    overallRelationship: 'competing' | 'complementary' | 'unrelated' | 'conflicting';
    impactAnalysis: {
      if_bill1_passes: string;
      if_bill2_passes: string;
      if_both_pass: string;
      citizen_action_needed: string[];
    };
  };
  visualData: {
    categories: Array<{
      name: string;
      bill1Score: number;
      bill2Score: number;
      description: string;
    }>;
    timeline: Array<{
      date: string;
      bill1Event?: string;
      bill2Event?: string;
    }>;
  };
  createdAt: Date;
}

/**
 * Compares two bills and generates comprehensive analysis
 */
export async function compareBills(
  billId1: number,
  billId2: number
): Promise<{ success: boolean; data?: BillComparison; error?: string }> {
  try {
    log.info(`Generating comparison between bills ${billId1} and ${billId2}`);

    // Get bill details from LegiScan
    const [bill1Details, bill2Details] = await Promise.all([
      legiscanService.getBill(billId1),
      legiscanService.getBill(billId2)
    ]);

    if (!bill1Details) {
      return {
        success: false,
        error: `Bill ${billId1} not found in legislative database`
      };
    }

    if (!bill2Details) {
      return {
        success: false,
        error: `Bill ${billId2} not found in legislative database`
      };
    }

    // Use AI to analyze and compare the bills
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert legislative analyst who specializes in comparing bills and identifying their relationships, conflicts, and complementary aspects. Your analysis helps citizens understand how different pieces of legislation interact and what they mean when taken together.

ANALYSIS FRAMEWORK:
1. Content Analysis: Compare the actual substance and provisions
2. Impact Assessment: How each bill affects citizens differently
3. Political Dynamics: Competing vs complementary legislation
4. Implementation: How bills would work together or conflict
5. Citizen Action: What voters need to know about each scenario

Focus on practical implications for everyday citizens while maintaining analytical rigor.`
        },
        {
          role: 'user',
          content: `Compare these two bills and provide comprehensive analysis:

BILL 1:
Title: ${bill1Details.title}
Number: ${bill1Details.bill_number}
Status: ${bill1Details.status}
Description: ${bill1Details.description || 'No description available'}
State: ${bill1Details.state}

BILL 2:
Title: ${bill2Details.title}
Number: ${bill2Details.bill_number}
Status: ${bill2Details.status}
Description: ${bill2Details.description || 'No description available'}
State: ${bill2Details.state}

Provide detailed comparison analysis focusing on how these bills relate to each other and their combined impact on citizens.`
        }
      ],
      functions: [
        {
          name: 'analyzeBillComparison',
          description: 'Generate comprehensive bill comparison analysis',
          parameters: {
            type: 'object',
            properties: {
              similarities: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key similarities between the bills'
              },
              differences: {
                type: 'array',
                items: { type: 'string' },
                description: 'Major differences between the bills'
              },
              conflictAreas: {
                type: 'array',
                items: { type: 'string' },
                description: 'Areas where the bills conflict or contradict'
              },
              complementaryAspects: {
                type: 'array',
                items: { type: 'string' },
                description: 'Ways the bills complement or strengthen each other'
              },
              overallRelationship: {
                type: 'string',
                enum: ['competing', 'complementary', 'unrelated', 'conflicting'],
                description: 'Overall relationship between the bills'
              },
              impactAnalysis: {
                type: 'object',
                properties: {
                  if_bill1_passes: { type: 'string' },
                  if_bill2_passes: { type: 'string' },
                  if_both_pass: { type: 'string' },
                  citizen_action_needed: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                description: 'Analysis of different passage scenarios'
              },
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    bill1Score: { type: 'number', minimum: 0, maximum: 100 },
                    bill2Score: { type: 'number', minimum: 0, maximum: 100 },
                    description: { type: 'string' }
                  }
                },
                description: 'Comparison categories with scores for visual representation'
              }
            },
            required: ['similarities', 'differences', 'overallRelationship', 'impactAnalysis', 'categories']
          }
        }
      ],
      function_call: { name: 'analyzeBillComparison' }
    });

    if (response.choices[0].message.function_call) {
      const analysisData = JSON.parse(response.choices[0].message.function_call.arguments);
      
      const comparison: BillComparison = {
        id: `comparison-${billId1}-${billId2}-${Date.now()}`,
        bill1: {
          id: billId1,
          number: bill1Details.bill_number,
          title: bill1Details.title,
          status: bill1Details.status?.toString() || 'Unknown',
          summary: bill1Details.description || 'No summary available',
          keyProvisions: [], // Would be extracted from full text in production
          sponsors: [], // Would be extracted from bill data
          lastAction: bill1Details.history?.[0]?.action || 'No recent action'
        },
        bill2: {
          id: billId2,
          number: bill2Details.bill_number,
          title: bill2Details.title,
          status: bill2Details.status?.toString() || 'Unknown',
          summary: bill2Details.description || 'No summary available',
          keyProvisions: [], // Would be extracted from full text in production
          sponsors: [], // Would be extracted from bill data
          lastAction: bill2Details.history?.[0]?.action || 'No recent action'
        },
        comparison: {
          similarities: analysisData.similarities || [],
          differences: analysisData.differences || [],
          conflictAreas: analysisData.conflictAreas || [],
          complementaryAspects: analysisData.complementaryAspects || [],
          overallRelationship: analysisData.overallRelationship || 'unrelated',
          impactAnalysis: analysisData.impactAnalysis
        },
        visualData: {
          categories: analysisData.categories || [],
          timeline: generateTimeline(bill1Details, bill2Details)
        },
        createdAt: new Date()
      };

      log.info(`Bill comparison generated successfully for ${billId1} vs ${billId2}`);
      return {
        success: true,
        data: comparison
      };
    }

    return {
      success: false,
      error: 'Failed to generate comparison analysis'
    };

  } catch (error: any) {
    log.error({ err: error }, 'Error comparing bills');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate timeline data for bill comparison
 */
function generateTimeline(bill1: any, bill2: any): BillComparison['visualData']['timeline'] {
  const timeline: BillComparison['visualData']['timeline'] = [];
  
  // Combine and sort events from both bills
  const bill1Events = (bill1.history || []).map((event: any) => ({
    date: event.date,
    bill1Event: event.action,
    billNumber: bill1.bill_number
  }));
  
  const bill2Events = (bill2.history || []).map((event: any) => ({
    date: event.date,
    bill2Event: event.action,
    billNumber: bill2.bill_number
  }));
  
  // Merge events by date
  const allEvents = [...bill1Events, ...bill2Events];
  const eventsByDate = allEvents.reduce((acc: any, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = { date };
    }
    if (event.bill1Event) {
      acc[date].bill1Event = event.bill1Event;
    }
    if (event.bill2Event) {
      acc[date].bill2Event = event.bill2Event;
    }
    return acc;
  }, {});
  
  return Object.values(eventsByDate)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Limit to 10 most recent events
}

/**
 * Get saved comparisons for a user
 */
export async function getUserComparisons(userId: number): Promise<{ success: boolean; data?: BillComparison[]; error?: string }> {
  try {
    // In production, this would query the database for saved comparisons
    // For now, return empty array
    return {
      success: true,
      data: []
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error getting user comparisons');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}