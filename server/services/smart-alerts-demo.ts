import OpenAI from 'openai';
import { legiscanService } from './legiscan-service';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface SmartAlert {
  id: string;
  billId: number;
  billNumber: string;
  title: string;
  changeType: string;
  previousStatus: string;
  newStatus: string;
  contextualExplanation: string;
  impactAnalysis?: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  actionButtons: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  timestamp: Date;
}

/**
 * Generates a contextual explanation for bill changes with action recommendations
 */
export async function generateSmartAlert(
  billId: number,
  changeType: string,
  previousStatus: string,
  newStatus: string
): Promise<any> {
  try {
    // Get bill details from LegiScan
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      throw new Error(`Bill ${billId} not found`);
    }

    // Use OpenAI to generate contextual explanation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a legislative expert who explains bill changes in simple, clear language. Focus on what the change means practically and what actions citizens might take. Always provide specific, actionable recommendations.'
        },
        {
          role: 'user',
          content: `A bill "${billDetails.title}" (${billDetails.bill_number}) has changed from "${previousStatus}" to "${newStatus}". Explain what this means and suggest specific actions citizens can take.`
        }
      ],
      functions: [
        {
          name: 'generateSmartAlert',
          description: 'Generate a smart alert explanation for a bill status change',
          parameters: {
            type: 'object',
            properties: {
              contextualExplanation: {
                type: 'string',
                description: 'Clear, simple explanation of what the status change means'
              },
              impactAnalysis: {
                type: 'string',
                description: 'Analysis of what this change means for the bill and its impact'
              },
              urgencyLevel: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'How urgent this change is for citizen action'
              },
              suggestedActions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: {
                      type: 'string',
                      description: 'Action button label'
                    },
                    action: {
                      type: 'string',
                      description: 'Type of action (contact, share, read, etc.)'
                    }
                  }
                },
                description: 'Suggested actions the user can take'
              },
              keyTimeline: {
                type: 'string',
                description: 'What happens next and when'
              }
            },
            required: ['contextualExplanation', 'urgencyLevel']
          }
        }
      ],
      function_call: { name: 'generateSmartAlert' }
    });

    // Parse function call results
    if (response.choices[0].message.function_call) {
      const functionCall = response.choices[0].message.function_call;
      const alertData = JSON.parse(functionCall.arguments);
      
      const smartAlert: SmartAlert = {
        id: `alert-${billId}-${Date.now()}`,
        billId,
        billNumber: billDetails.bill_number,
        title: billDetails.title,
        changeType,
        previousStatus,
        newStatus,
        contextualExplanation: alertData.contextualExplanation,
        impactAnalysis: alertData.impactAnalysis,
        urgencyLevel: alertData.urgencyLevel,
        actionButtons: (alertData.suggestedActions || []).map((action: any) => ({
          label: action.label,
          action: action.action,
          url: action.action === 'read' ? `/bills/${billId}` : undefined
        })),
        timestamp: new Date()
      };

      return {
        success: true,
        data: smartAlert
      };
    }

    return {
      success: false,
      error: 'Failed to generate alert explanation'
    };
  } catch (error: any) {
    console.error('Error generating smart alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Creates demo alerts for testing the Smart Bill Alerts feature
 */
export async function generateDemoAlerts(): Promise<SmartAlert[]> {
  const demoAlerts: SmartAlert[] = [
    {
      id: 'demo-1',
      billId: 1234567,
      billNumber: 'HB 2024',
      title: 'Texas Education Funding Reform Act',
      changeType: 'status_change',
      previousStatus: 'In Committee',
      newStatus: 'Scheduled for Floor Vote',
      contextualExplanation: 'This education funding bill has cleared committee and is now scheduled for a full House vote. This is a major milestone that significantly increases its chances of becoming law.',
      impactAnalysis: 'If passed, this bill would increase per-pupil funding by 15% statewide and provide additional resources for rural school districts.',
      urgencyLevel: 'high',
      actionButtons: [
        { label: 'Contact Your Rep', action: 'contact' },
        { label: 'Read Full Bill', action: 'read', url: '/bills/1234567' },
        { label: 'Share Alert', action: 'share' }
      ],
      timestamp: new Date()
    },
    {
      id: 'demo-2',
      billId: 2345678,
      billNumber: 'SB 891',
      title: 'Clean Energy Infrastructure Act',
      changeType: 'amendment_added',
      previousStatus: 'Under Review',
      newStatus: 'Amended - Under Review',
      contextualExplanation: 'A significant amendment was added that removes the solar panel installation tax credits but strengthens wind energy incentives.',
      impactAnalysis: 'This change could affect homeowners planning solar installations but benefits large-scale renewable energy projects.',
      urgencyLevel: 'medium',
      actionButtons: [
        { label: 'View Amendment', action: 'read', url: '/bills/2345678' },
        { label: 'Contact Senator', action: 'contact' },
        { label: 'Share Update', action: 'share' }
      ],
      timestamp: new Date(Date.now() - 3600000) // 1 hour ago
    }
  ];

  return demoAlerts;
}