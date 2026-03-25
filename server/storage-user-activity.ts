import { db } from './db';
import { eq, and, gt, lt, desc, asc, isNull, sql } from 'drizzle-orm';
import { 
  userActivities, 
  insertUserActivitySchema,
  userActionTracking,
  insertUserActionTrackingSchema,
  userAchievements,
  insertUserAchievementSchema,
  userActivityStreaks,
  insertUserActivityStreakSchema,
  userRoleBoosts,
  insertUserRoleBoostSchema
} from '@shared/schema-user-activity';
import { superUserRoles } from '@shared/schema';
import { InsertUserActivity, UserActivity } from '@shared/schema-user-activity';

/**
 * Interface for User Activity Storage
 */
export interface IUserActivityStorage {
  // User Activities
  createActivity(data: InsertUserActivity): Promise<UserActivity>;
  getUserActivities(userId: number, limit?: number): Promise<UserActivity[]>;
  getUserActivitiesByType(userId: number, activityType: string): Promise<UserActivity[]>;
  getUserActivitiesByRole(userId: number, role: string): Promise<UserActivity[]>;
  getUserActivityCount(userId: number, activityType?: string): Promise<number>;
  getRecentUserActivities(userId: number, days: number): Promise<UserActivity[]>;
  
  // Action Tracking
  createActionTracking(data: any): Promise<any>;
  getUserActions(userId: number, limit?: number): Promise<any[]>;
  getUserActionsByType(userId: number, actionType: string): Promise<any[]>;
  getUserActionsByImpact(userId: number, impact: string): Promise<any[]>;
  getUserActionCount(userId: number, actionType?: string): Promise<number>;
  
  // Achievements
  createAchievement(data: any): Promise<any>;
  getUserAchievements(userId: number): Promise<any[]>;
  getUserAchievementsByRole(userId: number, role: string): Promise<any[]>;
  
  // Activity Streaks
  getOrCreateUserStreak(userId: number, streakType: string): Promise<any>;
  updateUserStreak(id: number, data: any): Promise<any>;
  
  // Role Boosts
  createRoleBoost(data: any): Promise<any>;
  getUserRoleBoosts(userId: number, roleId: number): Promise<any[]>;
  
  // Super User Role Progress
  updateSuperUserRoleProgress(userId: number, role: string, pointsToAdd: number): Promise<boolean>;
  
  // Activity Analytics
  getMostActiveUsers(limit?: number): Promise<any[]>;
  getMostPopularActivities(limit?: number): Promise<any[]>;
  getUserActivityByTimeOfDay(userId: number): Promise<any[]>;
}

/**
 * Concrete implementation of User Activity Storage
 */
export class UserActivityStorage implements IUserActivityStorage {
  
  /**
   * Create a new user activity
   */
  async createActivity(data: InsertUserActivity): Promise<UserActivity> {
    // Validate the data using the schema
    const validatedData = insertUserActivitySchema.parse(data);
    
    const [activity] = await db.insert(userActivities).values(validatedData).returning();
    
    // If this activity is role-related, update role progress
    if (validatedData.relatedRole) {
      await this.updateSuperUserRoleProgress(
        validatedData.userId, 
        validatedData.relatedRole, 
        validatedData.points || 1
      );
      
      // Check if we need to update any streak
      await this.updateUserStreakFromActivity(validatedData);
    }
    
    return activity;
  }
  
  /**
   * Get user activities with optional limit
   */
  async getUserActivities(userId: number, limit?: number): Promise<UserActivity[]> {
    const query = db.select()
      .from(userActivities).$dynamic()
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt));
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }
  
  /**
   * Get user activities by type
   */
  async getUserActivitiesByType(userId: number, activityType: string): Promise<UserActivity[]> {
    return await db.select()
      .from(userActivities).$dynamic()
      .where(and(
        eq(userActivities.userId, userId),
        eq(userActivities.activityType, activityType)
      ))
      .orderBy(desc(userActivities.createdAt));
  }
  
  /**
   * Get user activities by super user role
   */
  async getUserActivitiesByRole(userId: number, role: string): Promise<UserActivity[]> {
    return await db.select()
      .from(userActivities).$dynamic()
      .where(and(
        eq(userActivities.userId, userId),
        eq(userActivities.relatedRole, role)
      ))
      .orderBy(desc(userActivities.createdAt));
  }
  
  /**
   * Count user activities with optional type filter
   */
  async getUserActivityCount(userId: number, activityType?: string): Promise<number> {
    let conditions = [eq(userActivities.userId, userId)];
    
    if (activityType) {
      conditions.push(eq(userActivities.activityType, activityType));
    }
    
    const result = await db
      .select({ count: sql`COUNT(*)` })
      .from(userActivities).$dynamic()
      .where(and(...conditions));
    
    return Number(result[0]?.count || 0);
  }
  
  /**
   * Get recent user activities within a number of days
   */
  async getRecentUserActivities(userId: number, days: number): Promise<UserActivity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await db.select()
      .from(userActivities).$dynamic()
      .where(and(
        eq(userActivities.userId, userId),
        gt(userActivities.createdAt, cutoffDate)
      ))
      .orderBy(desc(userActivities.createdAt));
  }
  
  /**
   * Create a new action tracking record
   */
  async createActionTracking(data: any): Promise<any> {
    const validatedData = insertUserActionTrackingSchema.parse(data);
    
    const [action] = await db.insert(userActionTracking).values(validatedData).returning();
    
    // If action is completed, create an activity record as well
    if (validatedData.status === 'completed' || validatedData.status === 'verified') {
      await this.createActivity({
        userId: validatedData.userId,
        activityType: `action_${validatedData.actionType}`,
        activityCategory: 'advocacy',
        points: validatedData.impactScore || 5, // Higher points for completed actions
        metadata: {
          actionId: action.id,
          impact: validatedData.impact,
          billId: validatedData.billId
        }
      });
    }
    
    return action;
  }
  
  /**
   * Get user actions with optional limit
   */
  async getUserActions(userId: number, limit?: number): Promise<any[]> {
    const query = db.select()
      .from(userActionTracking).$dynamic()
      .where(eq(userActionTracking.userId, userId))
      .orderBy(desc(userActionTracking.createdAt));
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }
  
  /**
   * Get user actions by type
   */
  async getUserActionsByType(userId: number, actionType: string): Promise<any[]> {
    return await db.select()
      .from(userActionTracking).$dynamic()
      .where(and(
        eq(userActionTracking.userId, userId),
        eq(userActionTracking.actionType, actionType)
      ))
      .orderBy(desc(userActionTracking.createdAt));
  }
  
  /**
   * Get user actions by impact level
   */
  async getUserActionsByImpact(userId: number, impact: string): Promise<any[]> {
    return await db.select()
      .from(userActionTracking).$dynamic()
      .where(and(
        eq(userActionTracking.userId, userId),
        eq(userActionTracking.impact, impact)
      ))
      .orderBy(desc(userActionTracking.createdAt));
  }
  
  /**
   * Count user actions with optional type filter
   */
  async getUserActionCount(userId: number, actionType?: string): Promise<number> {
    let conditions = [eq(userActionTracking.userId, userId)];
    
    if (actionType) {
      conditions.push(eq(userActionTracking.actionType, actionType));
    }
    
    const result = await db
      .select({ count: sql`COUNT(*)` })
      .from(userActionTracking).$dynamic()
      .where(and(...conditions));
    
    return Number(result[0]?.count || 0);
  }
  
  /**
   * Create a new user achievement
   */
  async createAchievement(data: any): Promise<any> {
    const validatedData = insertUserAchievementSchema.parse(data);
    
    const [achievement] = await db.insert(userAchievements).values(validatedData).returning();
    
    // Create an activity for earning the achievement
    await this.createActivity({
      userId: validatedData.userId,
      activityType: 'earn_achievement',
      activityCategory: 'achievement',
      relatedRole: validatedData.relatedRole,
      points: 10, // Achievements are worth more points
      metadata: {
        achievementId: achievement.id,
        achievementType: validatedData.achievementType,
        title: validatedData.title
      }
    });
    
    // If achievement is role-related, add a role boost
    if (validatedData.relatedRole) {
      // Find the role ID
      const userRole = await db.select()
        .from(superUserRoles).$dynamic()
        .where(and(
          eq(superUserRoles.userId, validatedData.userId),
          eq(superUserRoles.role, validatedData.relatedRole)
        ))
        .limit(1);
      
      if (userRole.length > 0) {
        await this.createRoleBoost({
          userId: validatedData.userId,
          roleId: userRole[0].id,
          boostSource: 'achievement',
          boostAmount: 5 * (validatedData.level || 1), // More points for higher level achievements
          boostReason: `Earned the "${validatedData.title}" achievement`,
          metadata: {
            achievementId: achievement.id
          }
        });
      }
    }
    
    return achievement;
  }
  
  /**
   * Get user achievements
   */
  async getUserAchievements(userId: number): Promise<any[]> {
    return await db.select()
      .from(userAchievements).$dynamic()
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }
  
  /**
   * Get user achievements by role
   */
  async getUserAchievementsByRole(userId: number, role: string): Promise<any[]> {
    return await db.select()
      .from(userAchievements).$dynamic()
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.relatedRole, role)
      ))
      .orderBy(desc(userAchievements.earnedAt));
  }
  
  /**
   * Get or create a user streak
   */
  async getOrCreateUserStreak(userId: number, streakType: string): Promise<any> {
    const existingStreak = await db.select()
      .from(userActivityStreaks).$dynamic()
      .where(and(
        eq(userActivityStreaks.userId, userId),
        eq(userActivityStreaks.streakType, streakType)
      ))
      .limit(1);
    
    if (existingStreak.length > 0) {
      return existingStreak[0];
    }
    
    // Create a new streak
    const [newStreak] = await db.insert(userActivityStreaks)
      .values({
        userId,
        streakType,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        nextRequiredActivityDate: this.calculateNextRequiredActivityDate(streakType)
      })
      .returning();
    
    return newStreak;
  }
  
  /**
   * Update a user streak record
   */
  async updateUserStreak(id: number, data: any): Promise<any> {
    const validatedData = insertUserActivityStreakSchema.omit({ userId: true }).parse(data);
    
    const [updatedStreak] = await db.update(userActivityStreaks)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(userActivityStreaks.id, id))
      .returning();
    
    return updatedStreak;
  }
  
  /**
   * Create a new role boost
   */
  async createRoleBoost(data: any): Promise<any> {
    const validatedData = insertUserRoleBoostSchema.parse(data);
    
    const [boost] = await db.insert(userRoleBoosts).values(validatedData).returning();
    
    // Update role progress
    const role = await db.select()
      .from(superUserRoles).$dynamic()
      .where(eq(superUserRoles.id, validatedData.roleId))
      .limit(1);
    
    if (role.length > 0) {
      await this.updateSuperUserRoleProgress(
        validatedData.userId,
        role[0].role,
        validatedData.boostAmount
      );
    }
    
    return boost;
  }
  
  /**
   * Get role boosts for a user and role
   */
  async getUserRoleBoosts(userId: number, roleId: number): Promise<any[]> {
    return await db.select()
      .from(userRoleBoosts).$dynamic()
      .where(and(
        eq(userRoleBoosts.userId, userId),
        eq(userRoleBoosts.roleId, roleId)
      ))
      .orderBy(desc(userRoleBoosts.createdAt));
  }
  
  /**
   * Update a user's super user role progress
   */
  async updateSuperUserRoleProgress(userId: number, role: string, pointsToAdd: number): Promise<boolean> {
    // Find the user's role
    const userRole = await db.select()
      .from(superUserRoles).$dynamic()
      .where(and(
        eq(superUserRoles.userId, userId),
        eq(superUserRoles.role, role)
      ))
      .limit(1);
    
    if (userRole.length === 0) {
      // Create the role if it doesn't exist
      await db.insert(superUserRoles)
        .values({
          userId,
          role,
          level: 1,
          progressToNextLevel: pointsToAdd > 100 ? 100 : pointsToAdd
        });
      
      return true;
    }
    
    const currentRole = userRole[0];
    let newProgress = currentRole.progressToNextLevel + pointsToAdd;
    let newLevel = currentRole.level;
    
    // Check for level up
    if (newProgress >= 100) {
      newLevel += 1;
      newProgress = newProgress - 100;
    }
    
    // Ensure progress doesn't exceed 100
    if (newProgress > 100) {
      newProgress = 100;
    }
    
    // Update the role
    await db.update(superUserRoles)
      .set({
        level: newLevel,
        progressToNextLevel: newProgress,
        updatedAt: new Date()
      })
      .where(eq(superUserRoles.id, currentRole.id));
    
    return true;
  }
  
  /**
   * Update user streak based on an activity
   */
  private async updateUserStreakFromActivity(activity: InsertUserActivity): Promise<void> {
    // Determine the streak type based on activity
    let streakType: string | null = null;
    
    if (activity.activityCategory === 'engagement') {
      streakType = 'daily_engagement';
    } else if (activity.activityCategory === 'advocacy') {
      streakType = 'advocacy_action';
    } else if (activity.relatedRole) {
      streakType = `${activity.relatedRole}_role`;
    }
    
    if (!streakType) return;
    
    // Get or create the streak
    const streak = await this.getOrCreateUserStreak(activity.userId, streakType);
    
    // Check if activity is within the streak period
    const now = new Date();
    const lastActivityDate = streak.lastActivityDate;
    const nextRequired = streak.nextRequiredActivityDate || now;
    
    // If this is a daily streak, check if it's the same calendar day
    if (streakType === 'daily_engagement') {
      const isNewDay = !this.isSameCalendarDay(lastActivityDate, now);
      const isConsecutiveDay = this.isConsecutiveDay(lastActivityDate, now);
      
      if (isNewDay) {
        if (isConsecutiveDay) {
          // Increment streak
          await this.updateUserStreak(streak.id, {
            currentStreak: streak.currentStreak + 1,
            longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
            lastActivityDate: now,
            nextRequiredActivityDate: this.calculateNextRequiredActivityDate(streakType)
          });
          
          // Check for streak milestone achievements
          this.checkForStreakAchievements(activity.userId, streakType, streak.currentStreak + 1);
        } else {
          // Streak broken
          await this.updateUserStreak(streak.id, {
            currentStreak: 1, // Reset to 1 for today's activity
            streakBrokenCount: streak.streakBrokenCount + 1,
            lastActivityDate: now,
            nextRequiredActivityDate: this.calculateNextRequiredActivityDate(streakType)
          });
        }
      } else {
        // Same day, just update the activity date
        await this.updateUserStreak(streak.id, {
          lastActivityDate: now,
          nextRequiredActivityDate: streak.nextRequiredActivityDate
        });
      }
    } 
    // For other streak types, just increment if within the required period
    else if (now <= nextRequired) {
      await this.updateUserStreak(streak.id, {
        currentStreak: streak.currentStreak + 1,
        longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
        lastActivityDate: now,
        nextRequiredActivityDate: this.calculateNextRequiredActivityDate(streakType)
      });
      
      this.checkForStreakAchievements(activity.userId, streakType, streak.currentStreak + 1);
    } else {
      // Streak broken, reset
      await this.updateUserStreak(streak.id, {
        currentStreak: 1,
        streakBrokenCount: streak.streakBrokenCount + 1,
        lastActivityDate: now,
        nextRequiredActivityDate: this.calculateNextRequiredActivityDate(streakType)
      });
    }
  }
  
  /**
   * Calculate the next required activity date based on streak type
   */
  private calculateNextRequiredActivityDate(streakType: string): Date {
    const now = new Date();
    const nextDate = new Date(now);
    
    if (streakType === 'daily_engagement') {
      // Next day at midnight
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(23, 59, 59, 999);
    } else if (streakType === 'advocacy_action') {
      // Within 3 days
      nextDate.setDate(nextDate.getDate() + 3);
    } else if (streakType.includes('_role')) {
      // Within 2 days for role-specific streaks
      nextDate.setDate(nextDate.getDate() + 2);
    } else {
      // Default to 1 day
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    return nextDate;
  }
  
  /**
   * Check if two dates are the same calendar day
   */
  private isSameCalendarDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  
  /**
   * Check if date2 is the consecutive day after date1
   */
  private isConsecutiveDay(date1: Date, date2: Date): boolean {
    const day1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const day2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    
    // Calculate the difference in days
    const diffTime = Math.abs(day2.getTime() - day1.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  }
  
  /**
   * Check for streak-based achievements
   */
  private async checkForStreakAchievements(userId: number, streakType: string, currentStreak: number): Promise<void> {
    const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
    
    // If current streak matches a milestone, create an achievement
    if (milestones.includes(currentStreak)) {
      let role: string | null = null;
      if (streakType.includes('_role')) {
        role = streakType.split('_')[0];
      }
      
      let achievementType, title, description;
      
      if (streakType === 'daily_engagement') {
        achievementType = `daily_streak_${currentStreak}`;
        title = `${currentStreak}-Day Engagement Streak`;
        description = `Engaged with Act Up for ${currentStreak} consecutive days.`;
      } else if (streakType === 'advocacy_action') {
        achievementType = `advocacy_streak_${currentStreak}`;
        title = `${currentStreak} Advocacy Actions`;
        description = `Completed ${currentStreak} advocacy actions on Act Up.`;
      } else if (role) {
        achievementType = `${role}_streak_${currentStreak}`;
        title = `${currentStreak}-Day ${this.capitalizeRole(role)} Streak`;
        description = `Completed ${role}-related activities for ${currentStreak} consecutive days.`;
      }
      
      if (achievementType && title && description) {
        await this.createAchievement({
          userId,
          achievementType,
          title,
          description,
          relatedRole: role,
          level: this.getStreakAchievementLevel(currentStreak)
        });
      }
    }
  }
  
  /**
   * Get the achievement level based on streak length
   */
  private getStreakAchievementLevel(streak: number): number {
    if (streak >= 180) return 4;
    if (streak >= 30) return 3;
    if (streak >= 7) return 2;
    return 1;
  }
  
  /**
   * Capitalize a role name
   */
  private capitalizeRole(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
  
  /**
   * Get most active users
   */
  async getMostActiveUsers(limit: number = 10): Promise<any[]> {
    // Get counts of activities per user
    const activityCounts = await db
      .select({
        userId: userActivities.userId,
        activityCount: sql`COUNT(${userActivities.id})`.as('activityCount')
      })
      .from(userActivities)
      .groupBy(userActivities.userId)
      .orderBy(sql`activityCount DESC`)
      .limit(limit);
    
    return activityCounts;
  }
  
  /**
   * Get most popular activities
   */
  async getMostPopularActivities(limit: number = 10): Promise<any[]> {
    return await db
      .select({
        activityType: userActivities.activityType,
        count: sql`COUNT(${userActivities.id})`.as('count')
      })
      .from(userActivities)
      .groupBy(userActivities.activityType)
      .orderBy(sql`count DESC`)
      .limit(limit);
  }
  
  /**
   * Get user activity by time of day
   */
  async getUserActivityByTimeOfDay(userId: number): Promise<any[]> {
    // PostgreSQL example extracting hour from timestamp
    return await db
      .select({
        hour: sql`EXTRACT(HOUR FROM ${userActivities.createdAt})`.as('hour'),
        count: sql`COUNT(${userActivities.id})`.as('count')
      })
      .from(userActivities).$dynamic()
      .where(eq(userActivities.userId, userId))
      .groupBy(sql`hour`)
      .orderBy(sql`hour`);
  }
}

// Singleton instance
export const userActivityStorage = new UserActivityStorage();