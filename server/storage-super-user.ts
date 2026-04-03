// @ts-nocheck
import { db } from "./db";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import {
  SuperUserRole,
  InsertSuperUserRole,
  superUserRoles,
  ProgressionMilestone,
  InsertProgressionMilestone,
  progressionMilestones,
  userActivities,
  UserActivity,
  InsertUserActivity,
  userNetworkImpact,
  UserNetworkImpact,
  InsertUserNetworkImpact,
  InsertSuperUserChallenge,
  InsertUserChallenge,
  UserChallenge,
  SuperUserChallenge,
  superUserChallenges,
  userChallenges,
  challenges,
  Challenge
} from "@shared/schema";

/**
 * Interface for Super User Dashboard storage operations
 */
export interface ISuperUserStorage {
  // Super User Role methods
  getSuperUserRoleByUserId(userId: number, role: string): Promise<SuperUserRole | undefined>;
  getSuperUserRolesByUserId(userId: number): Promise<SuperUserRole[]>;
  createSuperUserRole(role: InsertSuperUserRole): Promise<SuperUserRole>;
  updateSuperUserRole(id: number, role: Partial<InsertSuperUserRole>): Promise<SuperUserRole | undefined>;
  upgradeSuperUserRole(userId: number, role: string): Promise<SuperUserRole | undefined>;

  // Progression Milestone methods
  getProgressionMilestoneById(id: number): Promise<ProgressionMilestone | undefined>;
  getProgressionMilestonesByUserId(userId: number): Promise<ProgressionMilestone[]>;
  getProgressionMilestonesByUserIdAndRole(userId: number, role: string): Promise<ProgressionMilestone[]>;
  createProgressionMilestone(milestone: InsertProgressionMilestone): Promise<ProgressionMilestone>;
  updateProgressionMilestone(id: number, milestone: Partial<InsertProgressionMilestone>): Promise<ProgressionMilestone | undefined>;
  
  // User Activity methods
  getUserActivitiesByUserId(userId: number): Promise<UserActivity[]>;
  getUserActivitiesByUserIdAndRole(userId: number, roleType: string): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  
  // Network Impact methods
  getUserNetworkImpact(userId: number): Promise<UserNetworkImpact | undefined>;
  createUserNetworkImpact(impact: InsertUserNetworkImpact): Promise<UserNetworkImpact>;
  updateUserNetworkImpact(userId: number, impact: Partial<InsertUserNetworkImpact>): Promise<UserNetworkImpact | undefined>;
  getTopNetworkInfluencers(limit: number): Promise<UserNetworkImpact[]>;
  
  // Challenge methods
  getAllChallenges(): Promise<Challenge[]>;
  getChallengesByRole(role: string): Promise<Challenge[]>;
  getChallengeById(id: number): Promise<Challenge | undefined>;
  createSuperUserChallenge(challenge: InsertSuperUserChallenge): Promise<SuperUserChallenge>;
  getUserChallengeByIds(userId: number, challengeId: number): Promise<UserChallenge | undefined>;
  getUserChallengeByChallengeId(challengeId: number): Promise<UserChallenge[]>;
  getUserChallengesByUserId(userId: number): Promise<UserChallenge[]>;
  createUserChallenge(userChallenge: InsertUserChallenge): Promise<UserChallenge>;
  updateUserChallenge(userId: number, challengeId: number, userChallenge: Partial<InsertUserChallenge>): Promise<UserChallenge | undefined>;
  
  // Analytics methods
  getRoleDistribution(): Promise<{role: string, count: number}[]>;
  getActivitiesByType(): Promise<{activityType: string, count: number}[]>;
  getUserProgression(): Promise<{level: number, count: number}[]>;
}

/**
 * Implementation of Super User Dashboard storage operations
 */
export class DatabaseSuperUserStorage implements ISuperUserStorage {
  // Super User Role methods
  async getSuperUserRoleByUserId(userId: number, role: string): Promise<SuperUserRole | undefined> {
    const [superUserRole] = await db
      .select()
      .from(superUserRoles).$dynamic()
      .where(and(eq(superUserRoles.userId, userId), eq(superUserRoles.role, role)));
    
    return superUserRole;
  }

  async getSuperUserRolesByUserId(userId: number): Promise<SuperUserRole[]> {
    return db
      .select()
      .from(superUserRoles).$dynamic()
      .where(eq(superUserRoles.userId, userId));
  }

  async createSuperUserRole(role: InsertSuperUserRole): Promise<SuperUserRole> {
    const [newRole] = await db
      .insert(superUserRoles)
      .values(role)
      .returning();
    
    return newRole;
  }

  async updateSuperUserRole(id: number, role: Partial<InsertSuperUserRole>): Promise<SuperUserRole | undefined> {
    const [updatedRole] = await db
      .update(superUserRoles)
      .set({
        ...role,
        updatedAt: new Date()
      })
      .where(eq(superUserRoles.id, id))
      .returning();
    
    return updatedRole;
  }

  async upgradeSuperUserRole(userId: number, role: string): Promise<SuperUserRole | undefined> {
    const [superUserRole] = await db
      .select()
      .from(superUserRoles).$dynamic()
      .where(and(eq(superUserRoles.userId, userId), eq(superUserRoles.role, role)));
    
    if (!superUserRole) {
      return undefined;
    }
    
    // Check if eligible for upgrade (progress to next level is at 100%)
    if (superUserRole.progressToNextLevel >= 100) {
      const [updatedRole] = await db
        .update(superUserRoles)
        .set({
          level: superUserRole.level + 1,
          progressToNextLevel: 0,
          updatedAt: new Date()
        })
        .where(eq(superUserRoles.id, superUserRole.id))
        .returning();
      
      return updatedRole;
    }
    
    return superUserRole;
  }

  // Progression Milestone methods
  async getProgressionMilestoneById(id: number): Promise<ProgressionMilestone | undefined> {
    const [milestone] = await db
      .select()
      .from(progressionMilestones).$dynamic()
      .where(eq(progressionMilestones.id, id));
    
    return milestone;
  }

  async getProgressionMilestonesByUserId(userId: number): Promise<ProgressionMilestone[]> {
    return db
      .select()
      .from(progressionMilestones).$dynamic()
      .where(eq(progressionMilestones.userId, userId));
  }

  async getProgressionMilestonesByUserIdAndRole(userId: number, role: string): Promise<ProgressionMilestone[]> {
    return db
      .select()
      .from(progressionMilestones).$dynamic()
      .where(and(
        eq(progressionMilestones.userId, userId),
        eq(progressionMilestones.role, role)
      ));
  }

  async createProgressionMilestone(milestone: InsertProgressionMilestone): Promise<ProgressionMilestone> {
    const [newMilestone] = await db
      .insert(progressionMilestones)
      .values(milestone)
      .returning();
    
    return newMilestone;
  }

  async updateProgressionMilestone(id: number, milestone: Partial<InsertProgressionMilestone>): Promise<ProgressionMilestone | undefined> {
    const [updatedMilestone] = await db
      .update(progressionMilestones)
      .set({
        ...milestone,
        updatedAt: new Date()
      })
      .where(eq(progressionMilestones.id, id))
      .returning();
    
    return updatedMilestone;
  }
  
  // User Activity methods
  async getUserActivitiesByUserId(userId: number): Promise<UserActivity[]> {
    return db
      .select()
      .from(userActivities).$dynamic()
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt));
  }

  async getUserActivitiesByUserIdAndRole(userId: number, roleType: string): Promise<UserActivity[]> {
    return db
      .select()
      .from(userActivities).$dynamic()
      .where(and(
        eq(userActivities.userId, userId),
        eq(userActivities.roleType, roleType)
      ))
      .orderBy(desc(userActivities.createdAt));
  }

  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db
      .insert(userActivities)
      .values(activity)
      .returning();
    
    return newActivity;
  }
  
  // Network Impact methods
  async getUserNetworkImpact(userId: number): Promise<UserNetworkImpact | undefined> {
    const [impact] = await db
      .select()
      .from(userNetworkImpact).$dynamic()
      .where(eq(userNetworkImpact.userId, userId));
    
    return impact;
  }

  async createUserNetworkImpact(impact: InsertUserNetworkImpact): Promise<UserNetworkImpact> {
    const [newImpact] = await db
      .insert(userNetworkImpact)
      .values(impact)
      .returning();
    
    return newImpact;
  }

  async updateUserNetworkImpact(userId: number, impact: Partial<InsertUserNetworkImpact>): Promise<UserNetworkImpact | undefined> {
    const [updatedImpact] = await db
      .update(userNetworkImpact)
      .set({
        ...impact,
        lastUpdated: new Date()
      })
      .where(eq(userNetworkImpact.userId, userId))
      .returning();
    
    return updatedImpact;
  }

  async getTopNetworkInfluencers(limit: number): Promise<UserNetworkImpact[]> {
    return db
      .select()
      .from(userNetworkImpact)
      .orderBy(desc(userNetworkImpact.r0Value))
      .limit(limit);
  }
  
  // Challenge methods
  async getAllChallenges(): Promise<Challenge[]> {
    return db
      .select()
      .from(challenges).$dynamic()
      .where(eq(challenges.isActive, true));
  }

  async getChallengesByRole(role: string): Promise<Challenge[]> {
    return db
      .select()
      .from(challenges).$dynamic()
      .where(and(
        eq(challenges.isActive, true),
        eq(challenges.role, role)
      ));
  }

  async getChallengeById(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db
      .select()
      .from(challenges).$dynamic()
      .where(eq(challenges.id, id));
    
    return challenge;
  }

  async createSuperUserChallenge(challenge: InsertSuperUserChallenge): Promise<SuperUserChallenge> {
    const [newChallenge] = await db
      .insert(superUserChallenges)
      .values(challenge)
      .returning();
    
    return newChallenge;
  }

  async getUserChallengeByIds(userId: number, challengeId: number): Promise<UserChallenge | undefined> {
    const [userChallenge] = await db
      .select()
      .from(userChallenges).$dynamic()
      .where(and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.challengeId, challengeId)
      ));
    
    return userChallenge;
  }

  async getUserChallengeByChallengeId(challengeId: number): Promise<UserChallenge[]> {
    return db
      .select()
      .from(userChallenges).$dynamic()
      .where(eq(userChallenges.challengeId, challengeId));
  }

  async getUserChallengesByUserId(userId: number): Promise<UserChallenge[]> {
    return db
      .select()
      .from(userChallenges).$dynamic()
      .where(eq(userChallenges.userId, userId));
  }

  async createUserChallenge(userChallenge: InsertUserChallenge): Promise<UserChallenge> {
    const [newUserChallenge] = await db
      .insert(userChallenges)
      .values(userChallenge)
      .returning();
    
    return newUserChallenge;
  }

  async updateUserChallenge(userId: number, challengeId: number, userChallenge: Partial<InsertUserChallenge>): Promise<UserChallenge | undefined> {
    const [updatedUserChallenge] = await db
      .update(userChallenges)
      .set(userChallenge)
      .where(and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.challengeId, challengeId)
      ))
      .returning();
    
    return updatedUserChallenge;
  }
  
  // Analytics methods
  async getRoleDistribution(): Promise<{role: string, count: number}[]> {
    const result = await db
      .select({
        role: superUserRoles.role,
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(superUserRoles)
      .groupBy(superUserRoles.role);
    
    return result;
  }

  async getActivitiesByType(): Promise<{activityType: string, count: number}[]> {
    const result = await db
      .select({
        activityType: userActivities.activityType,
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(userActivities)
      .groupBy(userActivities.activityType);
    
    return result;
  }

  async getUserProgression(): Promise<{level: number, count: number}[]> {
    const result = await db
      .select({
        level: superUserRoles.level,
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(superUserRoles)
      .groupBy(superUserRoles.level)
      .orderBy(asc(superUserRoles.level));
    
    return result;
  }
}

export const superUserStorage = new DatabaseSuperUserStorage();