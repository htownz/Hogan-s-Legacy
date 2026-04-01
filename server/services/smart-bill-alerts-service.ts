// @ts-nocheck
import OpenAI from 'openai';
import { legiscanService } from './legiscan-service';
import { db } from '../db';
import { users, bills } from '../../shared/schema';
import { smartBillAlerts as billAlerts } from '../../shared/schema-smart-alerts';
import { eq, and } from 'drizzle-orm';
import { createLogger } from "../logger";
const log = createLogger("smart-bill-alerts-service");


// Temporary bill alerts interface until schema is updated
interface BillAlertsTable {
  id: number;
  userId: number;
  billId: number;
  alertType: string;
  isActive: boolean;
  contextPreferences: string | object;
  lastNotificationSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface BillAlert {
  id: number;
  userId: number;
  billId: number;
  alertType: 'status_change' | 'committee_action' | 'vote_scheduled' | 'amendment_added' | 'all';
  isActive: boolean;
  lastNotificationSent?: Date;
  contextPreferences: {
    includeImpactAnalysis: boolean;
    includePoliticalContext: boolean;
    includeStakeholderReactions: boolean;
    notificationMethod: 'push' | 'email' | 'sms' | 'all';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface SmartAlertNotification {
  alertId: number;
  billId: number;
  billNumber: string;
  changeType: string;
  previousStatus: string;
  newStatus: string;
  contextualExplanation: string;
  impactAnalysis?: string;
  actionButtons: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

/**
 * Creates a new bill alert for a user
 */
export async function createBillAlert(
  userId: number,
  billId: number,
  alertType: BillAlert['alertType'],
  contextPreferences: BillAlert['contextPreferences']
): Promise<any> {
  try {
    // Check if alert already exists
    const existingAlert = await db
      .select()
      .from(billAlerts).$dynamic()
      .where(and(eq(billAlerts.userId, userId), eq(billAlerts.billId, billId)))
      .limit(1);

    if (existingAlert.length > 0) {
      // Update existing alert
      const [updatedAlert] = await db
        .update(billAlerts)
        .set({
          alertType,
          contextPreferences: JSON.stringify(contextPreferences),
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(billAlerts.id, existingAlert[0].id))
        .returning();

      return {
        success: true,
        data: updatedAlert
      };
    } else {
      // Create new alert
      const [newAlert] = await db
        .insert(billAlerts)
        .values({
          userId,
          billId,
          alertType,
          contextPreferences: JSON.stringify(contextPreferences),
          isActive: true
        })
        .returning();

      return {
        success: true,
        data: newAlert
      };
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error creating bill alert');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generates contextual explanation for a bill status change
 */
export async function generateContextualExplanation(
  billId: number,
  changeType: string,
  previousStatus: string,
  newStatus: string,
  contextPreferences: BillAlert['contextPreferences']
): Promise<any> {
  try {
    // Get bill details
    const billDetails = await legiscanService.getBill(billId);
    if (!billDetails) {
      throw new Error(`Bill ${billId} not found`);
    }

    // Prepare context based on user preferences
    let contextPrompt = `A bill "${billDetails.title}" (${billDetails.bill_number}) has changed from "${previousStatus}" to "${newStatus}".`;
    
    if (contextPreferences.includeImpactAnalysis) {
      contextPrompt += ' Include analysis of what this change means for the bill\'s chances of passage and potential real-world impact.';
    }
    
    if (contextPreferences.includePoliticalContext) {
      contextPrompt += ' Include relevant political context and stakeholder positions.';
    }

    // Use function calling for structured response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a legislative expert who explains bill changes in simple, clear language. Focus on what the change means practically and what actions citizens might take.'
        },
        {
          role: 'user',
          content: contextPrompt
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
                    },
                    description: {
                      type: 'string',
                      description: 'Brief description of the action'
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

    // Parse and return the function call results
    if (response.choices[0].message.function_call) {
      const functionCall = response.choices[0].message.function_call;
      const alertData = JSON.parse(functionCall.arguments);
      
      return {
        success: true,
        data: {
          ...alertData,
          billInfo: {
            billId,
            billNumber: billDetails.bill_number,
            title: billDetails.title,
            state: billDetails.state
          }
        }
      };
    } else {
      // Fallback if function calling fails
      return {
        success: true,
        data: {
          contextualExplanation: response.choices[0].message.content,
          urgencyLevel: 'medium',
          billInfo: {
            billId,
            billNumber: billDetails.bill_number,
            title: billDetails.title,
            state: billDetails.state
          }
        }
      };
    }
  } catch (error: any) {
    log.error({ err: error }, 'Error generating contextual explanation');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Checks for bill status changes and triggers alerts
 */
export async function checkBillStatusChanges(): Promise<any> {
  try {
    log.info('Checking for bill status changes...');
    
    // For MVP demo, we'll simulate active alerts
    // In production, this would query the actual billAlerts table
    const activeAlerts: any[] = [];

    const notifications: SmartAlertNotification[] = [];

    for (const alertRecord of activeAlerts) {
      const alert = alertRecord.alert;
      const bill = alertRecord.bill;
      
      if (!bill) continue;

      try {
        // Get current bill status from LegiScan
        const currentBillData = await legiscanService.getBill(bill.legiscanId);
        if (!currentBillData) continue;

        const currentStatus = currentBillData.status?.text || currentBillData.status || 'Unknown';
        const lastKnownStatus = bill.status || 'Unknown';

        // Check if status has changed
        if (currentStatus !== lastKnownStatus) {
          log.info(`Status change detected for bill ${bill.legiscanId}: ${lastKnownStatus} -> ${currentStatus}`);

          // Generate contextual explanation
          const contextPreferences = typeof alert.contextPreferences === 'string' 
            ? JSON.parse(alert.contextPreferences) 
            : alert.contextPreferences;

          const explanation = await generateContextualExplanation(
            bill.legiscanId,
            'status_change',
            lastKnownStatus,
            currentStatus,
            contextPreferences
          );

          if (explanation.success) {
            // Create notification
            const notification: SmartAlertNotification = {
              alertId: alert.id,
              billId: bill.legiscanId,
              billNumber: explanation.data.billInfo.billNumber,
              changeType: 'status_change',
              previousStatus: lastKnownStatus,
              newStatus: currentStatus,
              contextualExplanation: explanation.data.contextualExplanation,
              impactAnalysis: explanation.data.impactAnalysis,
              actionButtons: (explanation.data.suggestedActions || []).map((action: any) => ({
                label: action.label,
                action: action.action,
                url: action.action === 'read' ? `/bills/${bill.legiscanId}` : undefined
              })),
              urgencyLevel: explanation.data.urgencyLevel,
              timestamp: new Date()
            };

            notifications.push(notification);

            // Update bill status in database
            await db
              .update(bills)
              .set({
                status: currentStatus,
                updatedAt: new Date()
              })
              .where(eq(bills.id, bill.id));

            // Update last notification sent
            await db
              .update(billAlerts)
              .set({
                lastNotificationSent: new Date()
              })
              .where(eq(billAlerts.id, alert.id));
          }
        }
      } catch (billError: any) {
        log.error({ err: billError }, `Error checking bill ${bill.legiscanId}`);
        continue;
      }
    }

    return {
      success: true,
      data: {
        notifications,
        checkedAlerts: activeAlerts.length,
        changesDetected: notifications.length
      }
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error checking bill status changes');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Gets user's active bill alerts
 */
export async function getUserBillAlerts(userId: number): Promise<any> {
  try {
    const userAlerts = await db
      .select({
        alert: billAlerts,
        bill: bills
      })
      .from(billAlerts)
      .leftJoin(bills, eq(billAlerts.billId, bills.id))
      .where(and(eq(billAlerts.userId, userId), eq(billAlerts.isActive, true)));

    return {
      success: true,
      data: userAlerts
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error getting user bill alerts');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Deactivates a bill alert
 */
export async function deactivateBillAlert(alertId: number, userId: number): Promise<any> {
  try {
    const [updatedAlert] = await db
      .update(billAlerts)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(eq(billAlerts.id, alertId), eq(billAlerts.userId, userId)))
      .returning();

    return {
      success: true,
      data: updatedAlert
    };
  } catch (error: any) {
    log.error({ err: error }, 'Error deactivating bill alert');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}