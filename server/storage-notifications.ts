import { eq, and, sql, desc, gt, lt, isNull, count } from "drizzle-orm";
import { db } from "./db";
import {
  notificationTypes,
  userNotificationPreferences,
  smartNotifications,
  notificationActions,
  type NotificationType,
  type InsertNotificationType,
  type UserNotificationPreference,
  type InsertUserNotificationPreference,
  type SmartNotification,
  type InsertSmartNotification,
  type NotificationAction,
  type InsertNotificationAction
} from "../shared/schema-notifications";

/**
 * Interface for notification storage service
 */
export interface INotificationStorage {
  // Notification Types
  getNotificationTypes(): Promise<NotificationType[]>;
  getNotificationTypeById(id: number): Promise<NotificationType | undefined>;
  createNotificationType(data: InsertNotificationType): Promise<NotificationType>;
  
  // User Notification Preferences
  getUserPreferences(userId: number): Promise<UserNotificationPreference[]>;
  getUserPreferenceById(id: number): Promise<UserNotificationPreference | undefined>;
  getUserPreferenceByTypeAndUser(userId: number, typeId: number): Promise<UserNotificationPreference | undefined>;
  createUserPreference(data: InsertUserNotificationPreference): Promise<UserNotificationPreference>;
  updateUserPreference(id: number, data: Partial<InsertUserNotificationPreference>): Promise<UserNotificationPreference | undefined>;
  
  // Smart Notifications
  getNotifications(
    userId: number, 
    options?: { 
      limit?: number; 
      offset?: number; 
      includeDismissed?: boolean;
      onlyUnread?: boolean;
      typeId?: number;
      priority?: number;
      sinceDate?: Date;
    }
  ): Promise<SmartNotification[]>;
  getNotificationById(id: number): Promise<SmartNotification | undefined>;
  getNotificationsByIds(ids: number[]): Promise<SmartNotification[]>;
  createNotification(data: InsertSmartNotification): Promise<SmartNotification>;
  markAsRead(notificationId: number): Promise<void>;
  markAllAsRead(userId: number): Promise<void>;
  dismissNotification(notificationId: number): Promise<void>;
  markAsExpired(notificationId: number): Promise<void>;
  
  // Notification Actions
  recordAction(data: InsertNotificationAction): Promise<NotificationAction>;
  getActionsByNotificationId(notificationId: number): Promise<NotificationAction[]>;
  
  // Analytics and Stats
  getNotificationCountsByType(userId: number): Promise<{type: string, count: number}[]>;
  getNotificationStats(userId: number): Promise<{
    totalCount: number;
    unreadCount: number;
    highPriorityCount: number;
    recentNotificationsCount: number;
  }>;
}

/**
 * Implementation of notification storage operations
 */
export class NotificationStorage implements INotificationStorage {
  // Notification Types
  async getNotificationTypes(): Promise<NotificationType[]> {
    return await db.select().from(notificationTypes);
  }
  
  async getNotificationTypeById(id: number): Promise<NotificationType | undefined> {
    const results = await db
      .select()
      .from(notificationTypes).$dynamic()
      .where(eq(notificationTypes.id, id));
    
    return results[0];
  }
  
  async createNotificationType(data: InsertNotificationType): Promise<NotificationType> {
    const result = await db
      .insert(notificationTypes)
      .values({
        ...data,
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  // User Notification Preferences
  async getUserPreferences(userId: number): Promise<UserNotificationPreference[]> {
    return await db
      .select()
      .from(userNotificationPreferences).$dynamic()
      .where(eq(userNotificationPreferences.userId, userId));
  }
  
  async getUserPreferenceById(id: number): Promise<UserNotificationPreference | undefined> {
    const results = await db
      .select()
      .from(userNotificationPreferences).$dynamic()
      .where(eq(userNotificationPreferences.id, id));
    
    return results[0];
  }
  
  async getUserPreferenceByTypeAndUser(userId: number, typeId: number): Promise<UserNotificationPreference | undefined> {
    const results = await db
      .select()
      .from(userNotificationPreferences).$dynamic()
      .where(
        and(
          eq(userNotificationPreferences.userId, userId),
          eq(userNotificationPreferences.notificationTypeId, typeId)
        )
      );
    
    return results[0];
  }
  
  async createUserPreference(data: InsertUserNotificationPreference): Promise<UserNotificationPreference> {
    const result = await db
      .insert(userNotificationPreferences)
      .values({
        ...data,
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async updateUserPreference(id: number, data: Partial<InsertUserNotificationPreference>): Promise<UserNotificationPreference | undefined> {
    const results = await db
      .update(userNotificationPreferences)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(userNotificationPreferences.id, id))
      .returning();
    
    return results[0];
  }
  
  // Smart Notifications
  async getNotifications(
    userId: number, 
    options: { 
      limit?: number; 
      offset?: number; 
      includeDismissed?: boolean;
      onlyUnread?: boolean;
      typeId?: number;
      priority?: number;
      sinceDate?: Date;
    } = {}
  ): Promise<SmartNotification[]> {
    const { 
      limit = 100, 
      offset = 0, 
      includeDismissed = false,
      onlyUnread = false,
      typeId,
      priority,
      sinceDate
    } = options;
    
    // Build conditions array for query
    const conditions = [eq(smartNotifications.userId, userId)];
    
    if (!includeDismissed) {
      conditions.push(eq(smartNotifications.dismissed, false));
    }
    
    if (onlyUnread) {
      conditions.push(eq(smartNotifications.read, false));
    }
    
    if (typeId) {
      conditions.push(eq(smartNotifications.notificationTypeId, typeId));
    }
    
    if (priority) {
      conditions.push(eq(smartNotifications.priority, priority));
    }
    
    if (sinceDate) {
      conditions.push(gt(smartNotifications.createdAt, sinceDate));
    }
    
    // Execute query with all conditions
    return await db
      .select()
      .from(smartNotifications).$dynamic()
      .where(and(...conditions))
      .orderBy(desc(smartNotifications.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async getNotificationById(id: number): Promise<SmartNotification | undefined> {
    const results = await db
      .select()
      .from(smartNotifications).$dynamic()
      .where(eq(smartNotifications.id, id));
    
    return results[0];
  }
  
  async getNotificationsByIds(ids: number[]): Promise<SmartNotification[]> {
    if (ids.length === 0) return [];
    
    return await db
      .select()
      .from(smartNotifications).$dynamic()
      .where(sql`${smartNotifications.id} IN (${ids.join(',')})`);
  }
  
  async createNotification(data: InsertSmartNotification): Promise<SmartNotification> {
    const result = await db
      .insert(smartNotifications)
      .values({
        ...data,
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async markAsRead(notificationId: number): Promise<void> {
    await db
      .update(smartNotifications)
      .set({
        read: true,
        updatedAt: new Date()
      })
      .where(eq(smartNotifications.id, notificationId));
  }
  
  async markAllAsRead(userId: number): Promise<void> {
    await db
      .update(smartNotifications)
      .set({
        read: true,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(smartNotifications.userId, userId),
          eq(smartNotifications.read, false),
          eq(smartNotifications.dismissed, false)
        )
      );
  }
  
  async dismissNotification(notificationId: number): Promise<void> {
    await db
      .update(smartNotifications)
      .set({
        dismissed: true,
        updatedAt: new Date()
      })
      .where(eq(smartNotifications.id, notificationId));
  }
  
  async markAsExpired(notificationId: number): Promise<void> {
    await db
      .update(smartNotifications)
      .set({
        dismissed: true,
        updatedAt: new Date()
      })
      .where(eq(smartNotifications.id, notificationId));
  }
  
  // Notification Actions
  async recordAction(data: InsertNotificationAction): Promise<NotificationAction> {
    const result = await db
      .insert(notificationActions)
      .values(data)
      .returning();
    
    return result[0];
  }
  
  async getActionsByNotificationId(notificationId: number): Promise<NotificationAction[]> {
    return await db
      .select()
      .from(notificationActions).$dynamic()
      .where(eq(notificationActions.notificationId, notificationId))
      .orderBy(desc(notificationActions.createdAt));
  }
  
  // Analytics and Stats
  async getNotificationCountsByType(userId: number): Promise<{type: string, count: number}[]> {
    const results = await db
      .select({
        type: notificationTypes.name,
        count: sql<number>`count(${smartNotifications.id})`
      })
      .from(smartNotifications)
      .leftJoin(
        notificationTypes,
        eq(smartNotifications.notificationTypeId, notificationTypes.id)
      )
      .where(
        and(
          eq(smartNotifications.userId, userId),
          eq(smartNotifications.dismissed, false)
        )
      )
      .groupBy(notificationTypes.name);
    
    // Cast the results to ensure type is always a string (not null)
    return results.map(item => ({
      type: item.type || 'unknown',
      count: item.count
    }));
  }
  
  async getNotificationStats(userId: number): Promise<{
    totalCount: number;
    unreadCount: number;
    highPriorityCount: number;
    recentNotificationsCount: number;
  }> {
    // Total count of active notifications
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartNotifications).$dynamic()
      .where(
        and(
          eq(smartNotifications.userId, userId),
          eq(smartNotifications.dismissed, false)
        )
      );
    
    // Unread count
    const unreadCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartNotifications).$dynamic()
      .where(
        and(
          eq(smartNotifications.userId, userId),
          eq(smartNotifications.read, false),
          eq(smartNotifications.dismissed, false)
        )
      );
    
    // High priority count (priority <= 2)
    const highPriorityCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartNotifications).$dynamic()
      .where(
        and(
          eq(smartNotifications.userId, userId),
          lt(smartNotifications.priority, 3),
          eq(smartNotifications.dismissed, false)
        )
      );
    
    // Recent notifications (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartNotifications).$dynamic()
      .where(
        and(
          eq(smartNotifications.userId, userId),
          eq(smartNotifications.dismissed, false),
          gt(smartNotifications.createdAt, oneDayAgo)
        )
      );
    
    return {
      totalCount: totalCountResult[0]?.count || 0,
      unreadCount: unreadCountResult[0]?.count || 0,
      highPriorityCount: highPriorityCountResult[0]?.count || 0,
      recentNotificationsCount: recentCountResult[0]?.count || 0
    };
  }
}

export const notificationStorage = new NotificationStorage();