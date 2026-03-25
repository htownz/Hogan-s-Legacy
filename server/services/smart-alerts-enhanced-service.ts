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
  alertType: 'status_change' | 'committee_action' | 'vote_scheduled' | 'amendment_added' | 'deadline_approaching' | 'passed' | 'failed';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: {
    whatHappened: string;
    whyItMatters: string;
    whatItMeans: string;
    nextSteps: string[];
    timelineImpact: string;
    citizenImpact: string;
  };
  actionButtons: {
    primary: {
      label: string;
      action: 'contact_representative' | 'share_alert' | 'learn_more' | 'track_bill' | 'join_action';
      url?: string;
      data?: any;
    };
    secondary?: {
      label: string;
      action: 'contact_representative' | 'share_alert' | 'learn_more' | 'track_bill' | 'join_action';
      url?: string;
      data?: any;
    };
  };
  timestamp: Date;
  readStatus: boolean;
  expiresAt?: Date;
}

export interface AlertSubscription {
  userId: number;
  billId: number;
  alertTypes: string[];
  urgencyThreshold: 'low' | 'medium' | 'high' | 'critical';
  deliveryMethod: 'push' | 'email' | 'sms' | 'all';
  isActive: boolean;
}

/**
 * Generate contextual smart alert for bill changes
 */
export async function generateSmartAlert(
  billId: number,
  changeType: string,
  changeDetails: any
): Promise<{ success: boolean; data?: SmartAlert; error?: string }> {
  try {
    console.log(`Generating smart alert for bill ${billId}, change: ${changeType}`);

    // Get current bill details
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      return {
        success: false,
        error: `Bill ${billId} not found in legislative database`
      };
    }

    // Use AI to generate contextual alert
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert civic engagement assistant who creates smart, contextual alerts for citizens tracking legislation. Your alerts help people understand exactly what happened, why it matters, and what they can do about it.

ALERT FRAMEWORK:
1. Clarity: Explain complex legislative processes in simple terms
2. Context: Connect changes to real-world impact on citizens
3. Action: Provide specific, actionable next steps
4. Urgency: Accurately assess the importance and timing
5. Empowerment: Help citizens feel they can make a difference

Focus on making legislative updates accessible and actionable for everyday citizens.`
        },
        {
          role: 'user',
          content: `Create a contextual smart alert for this bill change:

BILL DETAILS:
Title: ${billDetails.title}
Number: ${billDetails.bill_number}
Status: ${billDetails.status}
State: ${billDetails.state}
Description: ${billDetails.description || 'No description available'}

CHANGE DETAILS:
Type: ${changeType}
Details: ${JSON.stringify(changeDetails)}

Create a comprehensive alert with context, impact analysis, and actionable next steps.`
        }
      ],
      functions: [
        {
          name: 'generateSmartAlert',
          description: 'Generate contextual smart alert for bill changes',
          parameters: {
            type: 'object',
            properties: {
              alertType: {
                type: 'string',
                enum: ['status_change', 'committee_action', 'vote_scheduled', 'amendment_added', 'deadline_approaching', 'passed', 'failed'],
                description: 'Type of alert based on the change'
              },
              urgency: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'Urgency level of the alert'
              },
              message: {
                type: 'string',
                description: 'Clear, concise alert message'
              },
              context: {
                type: 'object',
                properties: {
                  whatHappened: { type: 'string', description: 'Plain English explanation of what changed' },
                  whyItMatters: { type: 'string', description: 'Why this change is significant' },
                  whatItMeans: { type: 'string', description: 'What this means for the bill\'s future' },
                  nextSteps: { 
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Expected next steps in the legislative process'
                  },
                  timelineImpact: { type: 'string', description: 'How this affects the bill\'s timeline' },
                  citizenImpact: { type: 'string', description: 'How this could affect citizens if enacted' }
                },
                required: ['whatHappened', 'whyItMatters', 'whatItMeans', 'nextSteps', 'timelineImpact', 'citizenImpact']
              },
              actionButtons: {
                type: 'object',
                properties: {
                  primary: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      action: {
                        type: 'string',
                        enum: ['contact_representative', 'share_alert', 'learn_more', 'track_bill', 'join_action']
                      },
                      url: { type: 'string' },
                      data: { type: 'object' }
                    },
                    required: ['label', 'action']
                  },
                  secondary: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      action: {
                        type: 'string',
                        enum: ['contact_representative', 'share_alert', 'learn_more', 'track_bill', 'join_action']
                      },
                      url: { type: 'string' },
                      data: { type: 'object' }
                    },
                    required: ['label', 'action']
                  }
                },
                required: ['primary']
              }
            },
            required: ['alertType', 'urgency', 'message', 'context', 'actionButtons']
          }
        }
      ],
      function_call: { name: 'generateSmartAlert' }
    });

    if (response.choices[0].message.function_call) {
      const alertData = JSON.parse(response.choices[0].message.function_call.arguments);
      
      const alert: SmartAlert = {
        id: `alert-${billId}-${Date.now()}`,
        billId: billId,
        billNumber: billDetails.bill_number,
        title: billDetails.title,
        alertType: alertData.alertType,
        urgency: alertData.urgency,
        message: alertData.message,
        context: alertData.context,
        actionButtons: alertData.actionButtons,
        timestamp: new Date(),
        readStatus: false,
        expiresAt: calculateExpirationDate(alertData.urgency)
      };

      console.log(`Smart alert generated successfully for bill ${billId}`);
      return {
        success: true,
        data: alert
      };
    }

    return {
      success: false,
      error: 'Failed to generate smart alert'
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
 * Process alert actions (contact representative, share, etc.)
 */
export async function processAlertAction(
  alertId: string,
  action: string,
  userId: number,
  data?: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    console.log(`Processing alert action: ${action} for alert ${alertId}`);

    switch (action) {
      case 'contact_representative':
        return await generateContactInfo(userId, data);
      
      case 'share_alert':
        return await generateShareableContent(alertId, data);
      
      case 'learn_more':
        return await generateEducationalContent(data);
      
      case 'track_bill':
        return await addToWatchList(userId, data.billId);
      
      case 'join_action':
        return await findActionOpportunities(data);
      
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  } catch (error: any) {
    console.error('Error processing alert action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate contact information for representatives
 */
async function generateContactInfo(userId: number, data: any): Promise<{ success: boolean; result?: any; error?: string }> {
  // This would integrate with representative contact databases
  return {
    success: true,
    result: {
      representatives: [
        {
          name: "Rep. Sample Name",
          office: "House District 45",
          phone: "(555) 123-4567",
          email: "rep.sample@legislature.gov",
          contactForm: "https://legislature.gov/contact/rep-sample"
        }
      ],
      suggestedMessage: "I am writing to express my views on [Bill Number]. As your constituent, I urge you to consider..."
    }
  };
}

/**
 * Generate shareable content for social media
 */
async function generateShareableContent(alertId: string, data: any): Promise<{ success: boolean; result?: any; error?: string }> {
  return {
    success: true,
    result: {
      text: `🏛️ ALERT: ${data.billNumber} just ${data.change}! This could impact [your community]. Stay informed and take action. #CivicEngagement #ActUp`,
      url: `https://actup.app/alerts/${alertId}`,
      hashtags: ["CivicEngagement", "ActUp", "Democracy"]
    }
  };
}

/**
 * Generate educational content about the bill
 */
async function generateEducationalContent(data: any): Promise<{ success: boolean; result?: any; error?: string }> {
  return {
    success: true,
    result: {
      explainerUrl: `/bills/${data.billId}/explainer`,
      resources: [
        "Understanding the Legislative Process",
        "How This Bill Affects You",
        "Key Players and Stakeholders"
      ]
    }
  };
}

/**
 * Add bill to user's watch list
 */
async function addToWatchList(userId: number, billId: number): Promise<{ success: boolean; result?: any; error?: string }> {
  // This would integrate with user preferences database
  return {
    success: true,
    result: {
      message: "Bill added to your watch list for real-time updates"
    }
  };
}

/**
 * Find action opportunities related to the bill
 */
async function findActionOpportunities(data: any): Promise<{ success: boolean; result?: any; error?: string }> {
  return {
    success: true,
    result: {
      opportunities: [
        {
          type: "petition",
          title: "Support/Oppose this bill",
          url: "/petitions/bill-" + data.billId
        },
        {
          type: "event",
          title: "Town Hall Discussion",
          date: "2025-01-30",
          location: "Community Center"
        }
      ]
    }
  };
}

/**
 * Calculate alert expiration based on urgency
 */
function calculateExpirationDate(urgency: string): Date {
  const now = new Date();
  switch (urgency) {
    case 'critical':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    case 'high':
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    case 'medium':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
    case 'low':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week default
  }
}

/**
 * Get alerts for a specific user
 */
export async function getUserAlerts(
  userId: number,
  filters?: {
    unreadOnly?: boolean;
    urgency?: string;
    alertType?: string;
  }
): Promise<{ success: boolean; data?: SmartAlert[]; error?: string }> {
  try {
    // This would query the database for user's alerts
    // For now, return empty array
    return {
      success: true,
      data: []
    };
  } catch (error: any) {
    console.error('Error getting user alerts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(
  alertId: string,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would update the alert in the database
    console.log(`Marking alert ${alertId} as read for user ${userId}`);
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error marking alert as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}