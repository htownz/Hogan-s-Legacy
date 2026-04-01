import OpenAI from 'openai';
import { legiscanService } from './legiscan-service';
import { createLogger } from "../logger";
const log = createLogger("real-time-timeline-service");


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  stage: 'introduced' | 'committee' | 'floor_vote' | 'passed_chamber' | 'other_chamber' | 'governor' | 'enacted' | 'vetoed' | 'failed';
  importance: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  actors?: string[];
  voteCount?: {
    yes: number;
    no: number;
    abstain: number;
  };
  amendments?: string[];
  nextExpectedAction?: {
    action: string;
    estimatedDate: string;
    probability: number;
  };
}

export interface RealTimeTimeline {
  billId: number;
  billNumber: string;
  title: string;
  currentStage: string;
  status: string;
  progressPercentage: number;
  lastUpdated: Date;
  events: TimelineEvent[];
  predictions: {
    nextAction: string;
    probability: number;
    estimatedDate: string;
    reasoning: string;
  };
  keyMilestones: {
    milestone: string;
    completed: boolean;
    date?: string;
    estimatedDate?: string;
  }[];
}

/**
 * Generate a real-time timeline for a specific bill
 */
export async function generateRealTimeTimeline(
  billId: number
): Promise<{ success: boolean; data?: RealTimeTimeline; error?: string }> {
  try {
    log.info(`Generating real-time timeline for bill ${billId}`);

    // Get bill details from LegiScan
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      return {
        success: false,
        error: `Bill ${billId} not found in legislative database`
      };
    }

    // Get bill history for timeline events
    const billHistory = billDetails.history || [];

    // Use AI to analyze and enhance the timeline data
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert legislative analyst who creates detailed, real-time timelines for bills. Your analysis helps citizens understand exactly where a bill stands in the legislative process and what comes next.

TIMELINE FRAMEWORK:
1. Process Mapping: Map each legislative action to the appropriate stage
2. Importance Assessment: Evaluate the significance of each event
3. Progress Calculation: Calculate how far through the process the bill has moved
4. Prediction Analysis: Forecast likely next steps and timeline
5. Citizen Context: Explain what each stage means in practical terms

Focus on making the legislative process transparent and understandable for everyday citizens.`
        },
        {
          role: 'user',
          content: `Create a comprehensive real-time timeline for this bill:

BILL DETAILS:
Title: ${billDetails.title}
Number: ${billDetails.bill_number}
Status: ${billDetails.status}
State: ${billDetails.state}
Description: ${billDetails.description || 'No description available'}

BILL HISTORY:
${billHistory.map((event: any, index: number) => 
  `${index + 1}. Date: ${event.date}, Action: ${event.action}`
).join('\n')}

Create a detailed timeline with stage progression, importance levels, and predictions for next steps.`
        }
      ],
      functions: [
        {
          name: 'generateTimelineAnalysis',
          description: 'Generate comprehensive timeline analysis for a bill',
          parameters: {
            type: 'object',
            properties: {
              currentStage: {
                type: 'string',
                description: 'Current stage of the bill in the legislative process'
              },
              progressPercentage: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Percentage of legislative process completed'
              },
              events: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    stage: {
                      type: 'string',
                      enum: ['introduced', 'committee', 'floor_vote', 'passed_chamber', 'other_chamber', 'governor', 'enacted', 'vetoed', 'failed']
                    },
                    importance: {
                      type: 'string',
                      enum: ['low', 'medium', 'high', 'critical']
                    },
                    details: { type: 'string' },
                    actors: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  },
                  required: ['date', 'title', 'description', 'stage', 'importance']
                }
              },
              predictions: {
                type: 'object',
                properties: {
                  nextAction: { type: 'string' },
                  probability: { type: 'number', minimum: 0, maximum: 100 },
                  estimatedDate: { type: 'string' },
                  reasoning: { type: 'string' }
                },
                required: ['nextAction', 'probability', 'estimatedDate', 'reasoning']
              },
              keyMilestones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    milestone: { type: 'string' },
                    completed: { type: 'boolean' },
                    date: { type: 'string' },
                    estimatedDate: { type: 'string' }
                  },
                  required: ['milestone', 'completed']
                }
              }
            },
            required: ['currentStage', 'progressPercentage', 'events', 'predictions', 'keyMilestones']
          }
        }
      ],
      function_call: { name: 'generateTimelineAnalysis' }
    });

    if (response.choices[0].message.function_call) {
      const analysisData = JSON.parse(response.choices[0].message.function_call.arguments);
      
      // Generate unique IDs for events
      const eventsWithIds = analysisData.events.map((event: any, index: number) => ({
        ...event,
        id: `event-${billId}-${index + 1}`
      }));

      const timeline: RealTimeTimeline = {
        billId: billId,
        billNumber: billDetails.bill_number,
        title: billDetails.title,
        currentStage: analysisData.currentStage,
        status: billDetails.status?.toString() || 'Unknown',
        progressPercentage: analysisData.progressPercentage,
        lastUpdated: new Date(),
        events: eventsWithIds,
        predictions: analysisData.predictions,
        keyMilestones: analysisData.keyMilestones
      };

      log.info(`Real-time timeline generated successfully for bill ${billId}`);
      return {
        success: true,
        data: timeline
      };
    }

    return {
      success: false,
      error: 'Failed to generate timeline analysis'
    };

  } catch (error: any) {
    log.error({ err: error }, 'Error generating real-time timeline');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get timeline updates for multiple bills
 */
export async function getBatchTimelineUpdates(
  billIds: number[]
): Promise<{ success: boolean; data?: RealTimeTimeline[]; error?: string }> {
  try {
    log.info(`Generating batch timeline updates for ${billIds.length} bills`);
    
    const timelinePromises = billIds.map(billId => generateRealTimeTimeline(billId));
    const results = await Promise.all(timelinePromises);
    
    const successfulTimelines = results
      .filter(result => result.success && result.data)
      .map(result => result.data!);
    
    return {
      success: true,
      data: successfulTimelines
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error generating batch timeline updates');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Calculate the stage progression for visualization
 */
export function calculateStageProgression(stage: string): {
  currentStep: number;
  totalSteps: number;
  stageName: string;
} {
  const stages = [
    { key: 'introduced', name: 'Introduced', step: 1 },
    { key: 'committee', name: 'Committee Review', step: 2 },
    { key: 'floor_vote', name: 'Floor Vote', step: 3 },
    { key: 'passed_chamber', name: 'Passed Chamber', step: 4 },
    { key: 'other_chamber', name: 'Other Chamber', step: 5 },
    { key: 'governor', name: 'Governor Review', step: 6 },
    { key: 'enacted', name: 'Enacted', step: 7 }
  ];

  const currentStage = stages.find(s => s.key === stage) || stages[0];
  
  return {
    currentStep: currentStage.step,
    totalSteps: stages.length,
    stageName: currentStage.name
  };
}

/**
 * Get priority events for dashboard display
 */
export function getPriorityEvents(timeline: RealTimeTimeline): TimelineEvent[] {
  return timeline.events
    .filter(event => event.importance === 'high' || event.importance === 'critical')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}