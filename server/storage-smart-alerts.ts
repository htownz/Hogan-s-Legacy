import { db } from "./db";
import { 
  smartBillAlerts, 
  billTimelineEvents, 
  userAlertPreferences,
  userBillTracking,
  type SmartBillAlert,
  type InsertSmartBillAlert,
  type BillTimelineEvent,
  type InsertBillTimelineEvent,
  type UserAlertPreferences,
  type InsertUserAlertPreferences
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export class SmartAlertsStorage {
  // ---- SMART BILL ALERTS ----
  
  async createAlert(alert: InsertSmartBillAlert): Promise<SmartBillAlert> {
    const [newAlert] = await db
      .insert(smartBillAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getAlertsForUser(userId: number, options: {
    isRead?: boolean;
    isArchived?: boolean;
    limit?: number;
  } = {}): Promise<SmartBillAlert[]> {
    const conditions = [eq(smartBillAlerts.userId, userId)];

    if (options.isRead !== undefined) {
      conditions.push(eq(smartBillAlerts.isRead, options.isRead));
    }

    if (options.isArchived !== undefined) {
      conditions.push(eq(smartBillAlerts.isArchived, options.isArchived));
    }

    let query = db
      .select()
      .from(smartBillAlerts).$dynamic()
      .where(and(...conditions))
      .orderBy(desc(smartBillAlerts.createdAt));

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const result = await query;
    return result;
  }

  async markAlertAsRead(alertId: number): Promise<void> {
    await db
      .update(smartBillAlerts)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(eq(smartBillAlerts.id, alertId));
  }

  async archiveAlert(alertId: number): Promise<void> {
    await db
      .update(smartBillAlerts)
      .set({ isArchived: true })
      .where(eq(smartBillAlerts.id, alertId));
  }

  async getUnreadAlertCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: smartBillAlerts.id })
      .from(smartBillAlerts).$dynamic()
      .where(and(
        eq(smartBillAlerts.userId, userId),
        eq(smartBillAlerts.isRead, false),
        eq(smartBillAlerts.isArchived, false)
      ));
    
    return result.length;
  }

  // ---- BILL TIMELINE EVENTS ----

  async createTimelineEvent(event: InsertBillTimelineEvent): Promise<BillTimelineEvent> {
    const [newEvent] = await db
      .insert(billTimelineEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async getTimelineForBill(billId: string): Promise<BillTimelineEvent[]> {
    return await db
      .select()
      .from(billTimelineEvents).$dynamic()
      .where(eq(billTimelineEvents.billId, billId))
      .orderBy(asc(billTimelineEvents.date));
  }

  async updateTimelineEvent(eventId: number, updates: Partial<BillTimelineEvent>): Promise<void> {
    await db
      .update(billTimelineEvents)
      .set(updates)
      .where(eq(billTimelineEvents.id, eventId));
  }

  async getUpcomingEvents(billId: string): Promise<BillTimelineEvent[]> {
    const now = new Date();
    return await db
      .select()
      .from(billTimelineEvents).$dynamic()
      .where(and(
        eq(billTimelineEvents.billId, billId),
        eq(billTimelineEvents.isCompleted, false)
      ))
      .orderBy(asc(billTimelineEvents.date));
  }

  // ---- USER ALERT PREFERENCES ----

  async getUserAlertPreferences(userId: number): Promise<UserAlertPreferences | null> {
    const [preferences] = await db
      .select()
      .from(userAlertPreferences).$dynamic()
      .where(eq(userAlertPreferences.userId, userId))
      .limit(1);
    
    return preferences || null;
  }

  async createOrUpdateAlertPreferences(
    userId: number, 
    preferences: Partial<InsertUserAlertPreferences>
  ): Promise<UserAlertPreferences> {
    const existing = await this.getUserAlertPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userAlertPreferences)
        .set({ 
          ...preferences, 
          updatedAt: new Date() 
        })
        .where(eq(userAlertPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userAlertPreferences)
        .values({ 
          userId, 
          ...preferences 
        })
        .returning();
      return created;
    }
  }

  // ---- USER BILL TRACKING ----

  async trackBillForUser(userId: number, billId: string): Promise<void> {
    // Check if already tracking
    const existing = await db
      .select()
      .from(userBillTracking).$dynamic()
      .where(and(
        eq(userBillTracking.userId, userId),
        eq(userBillTracking.billId, billId)
      ))
      .limit(1);

    if (existing.length === 0) {
      await db
        .insert(userBillTracking)
        .values({ userId, billId });
    }
  }

  async untrackBillForUser(userId: number, billId: string): Promise<void> {
    await db
      .delete(userBillTracking)
      .where(and(
        eq(userBillTracking.userId, userId),
        eq(userBillTracking.billId, billId)
      ));
  }

  async getTrackedBillsForUser(userId: number): Promise<string[]> {
    const result = await db
      .select({ billId: userBillTracking.billId })
      .from(userBillTracking).$dynamic()
      .where(eq(userBillTracking.userId, userId));
    
    return result.map(r => r.billId);
  }

  async isUserTrackingBill(userId: number, billId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(userBillTracking).$dynamic()
      .where(and(
        eq(userBillTracking.userId, userId),
        eq(userBillTracking.billId, billId)
      ))
      .limit(1);
    
    return result.length > 0;
  }
}

export const smartAlertsStorage = new SmartAlertsStorage();