// @ts-nocheck
/**
 * User Goals Management Storage Implementation
 */

import { db } from "./db";
import { 
  userGoals, 
  goalMilestones, 
  goalBills, 
  teamGoals,
  teamGoalMilestones,
  teamGoalAssignments,
  lobbyingActivities,
  type UserGoal,
  type InsertUserGoal,
  type GoalMilestone,
  type InsertGoalMilestone,
  type GoalBill,
  type InsertGoalBill,
  type TeamGoal,
  type InsertTeamGoal,
  type TeamGoalMilestone,
  type InsertTeamGoalMilestone,
  type TeamGoalAssignment,
  type InsertTeamGoalAssignment,
  type LobbyingActivity,
  type InsertLobbyingActivity,
} from "@shared/schema-goals";
import { eq, and, sql, or, desc, asc, like, isNull, isNotNull, lt, gt, inArray } from "drizzle-orm";
import { bills, users, actionCircles } from "@shared/schema";

export interface IGoalsStorage {
  // User personal goals
  getUserGoals(userId: number): Promise<UserGoal[]>;
  getUserGoalById(id: number, userId: number): Promise<UserGoal | undefined>;
  getPublicGoals(limit?: number): Promise<UserGoal[]>;
  createUserGoal(goal: InsertUserGoal): Promise<UserGoal>;
  updateUserGoal(id: number, userId: number, goal: Partial<InsertUserGoal>): Promise<UserGoal | undefined>;
  deleteUserGoal(id: number, userId: number): Promise<void>;
  getGoalProgress(id: number): Promise<number>;
  updateGoalProgress(id: number, progress: number): Promise<UserGoal | undefined>;
  
  // Goal milestones
  getGoalMilestones(goalId: number): Promise<GoalMilestone[]>;
  getGoalMilestoneById(id: number): Promise<GoalMilestone | undefined>;
  createGoalMilestone(milestone: InsertGoalMilestone): Promise<GoalMilestone>;
  updateGoalMilestone(id: number, milestone: Partial<InsertGoalMilestone>): Promise<GoalMilestone | undefined>;
  deleteGoalMilestone(id: number): Promise<void>;
  completeGoalMilestone(id: number): Promise<GoalMilestone | undefined>;
  
  // Goal bills
  getGoalBills(goalId: number): Promise<(GoalBill & { bill: { id: string, title: string, description: string | null } })[]>;
  createGoalBill(goalBill: InsertGoalBill): Promise<GoalBill>;
  updateGoalBill(id: number, goalBill: Partial<InsertGoalBill>): Promise<GoalBill | undefined>;
  deleteGoalBill(id: number): Promise<void>;
  
  // Team goals
  getTeamGoalsByCircleId(circleId: number): Promise<TeamGoal[]>;
  getTeamGoalById(id: number): Promise<TeamGoal | undefined>;
  createTeamGoal(goal: InsertTeamGoal): Promise<TeamGoal>;
  updateTeamGoal(id: number, circleId: number, goal: Partial<InsertTeamGoal>): Promise<TeamGoal | undefined>;
  deleteTeamGoal(id: number, circleId: number): Promise<void>;
  
  // Team goal milestones
  getTeamGoalMilestones(teamGoalId: number): Promise<TeamGoalMilestone[]>;
  createTeamGoalMilestone(milestone: InsertTeamGoalMilestone): Promise<TeamGoalMilestone>;
  updateTeamGoalMilestone(id: number, milestone: Partial<InsertTeamGoalMilestone>): Promise<TeamGoalMilestone | undefined>;
  deleteTeamGoalMilestone(id: number): Promise<void>;
  
  // Team goal assignments
  getTeamGoalAssignments(teamGoalId: number): Promise<(TeamGoalAssignment & { user: { id: number, username: string, displayName: string | null } })[]>;
  getUserAssignments(userId: number): Promise<(TeamGoalAssignment & { teamGoal: { id: number, title: string, circleId: number } })[]>;
  createTeamGoalAssignment(assignment: InsertTeamGoalAssignment): Promise<TeamGoalAssignment>;
  updateTeamGoalAssignment(id: number, assignment: Partial<InsertTeamGoalAssignment>): Promise<TeamGoalAssignment | undefined>;
  deleteTeamGoalAssignment(id: number): Promise<void>;
  
  // Lobbying activities
  getLobbyingActivities(teamGoalId?: number, userId?: number): Promise<LobbyingActivity[]>;
  getLobbyingActivityById(id: number): Promise<LobbyingActivity | undefined>;
  createLobbyingActivity(activity: InsertLobbyingActivity): Promise<LobbyingActivity>;
  updateLobbyingActivity(id: number, activity: Partial<InsertLobbyingActivity>): Promise<LobbyingActivity | undefined>;
  deleteLobbyingActivity(id: number, userId: number): Promise<void>;
  
  // Analytics and statistics
  getGoalStatsByUserId(userId: number): Promise<any>; // Custom stats object
  getTeamGoalStatsByCircleId(circleId: number): Promise<any>; // Custom stats object
  getLobbyingStatsByUserId(userId: number): Promise<any>; // Custom lobbying stats
}

export class GoalsStorage implements IGoalsStorage {
  // User personal goals
  async getUserGoals(userId: number): Promise<UserGoal[]> {
    return db.select().from(userGoals).$dynamic().where(eq(userGoals.userId, userId)).orderBy(desc(userGoals.createdAt));
  }

  async getUserGoalById(id: number, userId: number): Promise<UserGoal | undefined> {
    const [goal] = await db
      .select()
      .from(userGoals).$dynamic()
      .where(
        and(
          eq(userGoals.id, id),
          eq(userGoals.userId, userId)
        )
      );
    return goal;
  }

  async getPublicGoals(limit: number = 10): Promise<UserGoal[]> {
    return db
      .select()
      .from(userGoals).$dynamic()
      .where(eq(userGoals.isPublic, true))
      .orderBy(desc(userGoals.createdAt))
      .limit(limit);
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const [newGoal] = await db
      .insert(userGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateUserGoal(id: number, userId: number, goal: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const [updated] = await db
      .update(userGoals)
      .set({ ...goal, updatedAt: new Date() })
      .where(
        and(
          eq(userGoals.id, id),
          eq(userGoals.userId, userId)
        )
      )
      .returning();
    return updated;
  }

  async deleteUserGoal(id: number, userId: number): Promise<void> {
    await db
      .delete(userGoals)
      .where(
        and(
          eq(userGoals.id, id),
          eq(userGoals.userId, userId)
        )
      );
  }

  async getGoalProgress(id: number): Promise<number> {
    const [goal] = await db
      .select({ progress: userGoals.progress })
      .from(userGoals).$dynamic()
      .where(eq(userGoals.id, id));
    
    return goal?.progress || 0;
  }

  async updateGoalProgress(id: number, progress: number): Promise<UserGoal | undefined> {
    const [updated] = await db
      .update(userGoals)
      .set({ 
        progress: progress, 
        updatedAt: new Date(),
        status: progress >= 100 ? 'completed' : 'active'
      })
      .where(eq(userGoals.id, id))
      .returning();
    
    return updated;
  }

  // Goal milestones
  async getGoalMilestones(goalId: number): Promise<GoalMilestone[]> {
    return db
      .select()
      .from(goalMilestones).$dynamic()
      .where(eq(goalMilestones.goalId, goalId))
      .orderBy(asc(goalMilestones.order));
  }

  async getGoalMilestoneById(id: number): Promise<GoalMilestone | undefined> {
    const [milestone] = await db
      .select()
      .from(goalMilestones).$dynamic()
      .where(eq(goalMilestones.id, id));
    
    return milestone;
  }

  async createGoalMilestone(milestone: InsertGoalMilestone): Promise<GoalMilestone> {
    const [newMilestone] = await db
      .insert(goalMilestones)
      .values(milestone)
      .returning();
    
    return newMilestone;
  }

  async updateGoalMilestone(id: number, milestone: Partial<InsertGoalMilestone>): Promise<GoalMilestone | undefined> {
    const [updated] = await db
      .update(goalMilestones)
      .set({ ...milestone, updatedAt: new Date() })
      .where(eq(goalMilestones.id, id))
      .returning();
    
    return updated;
  }

  async deleteGoalMilestone(id: number): Promise<void> {
    await db
      .delete(goalMilestones)
      .where(eq(goalMilestones.id, id));
  }

  async completeGoalMilestone(id: number): Promise<GoalMilestone | undefined> {
    const [updated] = await db
      .update(goalMilestones)
      .set({ 
        status: 'completed', 
        completedDate: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(goalMilestones.id, id))
      .returning();
    
    // Recalculate overall goal progress
    if (updated) {
      const allMilestones = await this.getGoalMilestones(updated.goalId);
      const completedCount = allMilestones.filter(m => m.status === 'completed').length;
      const totalCount = allMilestones.length;
      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      
      await this.updateGoalProgress(updated.goalId, progress);
    }
    
    return updated;
  }

  // Goal bills
  async getGoalBills(goalId: number): Promise<(GoalBill & { bill: { id: string, title: string, description: string | null } })[]> {
    return db
      .select({
        ...goalBills,
        bill: {
          id: bills.id,
          title: bills.title,
          description: bills.description
        }
      })
      .from(goalBills)
      .innerJoin(bills, eq(goalBills.billId, bills.id))
      .where(eq(goalBills.goalId, goalId))
      .orderBy(desc(goalBills.importance));
  }

  async createGoalBill(goalBill: InsertGoalBill): Promise<GoalBill> {
    const [newGoalBill] = await db
      .insert(goalBills)
      .values(goalBill)
      .returning();
    
    return newGoalBill;
  }

  async updateGoalBill(id: number, goalBill: Partial<InsertGoalBill>): Promise<GoalBill | undefined> {
    const [updated] = await db
      .update(goalBills)
      .set(goalBill)
      .where(eq(goalBills.id, id))
      .returning();
    
    return updated;
  }

  async deleteGoalBill(id: number): Promise<void> {
    await db
      .delete(goalBills)
      .where(eq(goalBills.id, id));
  }

  // Team goals
  async getTeamGoalsByCircleId(circleId: number): Promise<TeamGoal[]> {
    return db
      .select()
      .from(teamGoals).$dynamic()
      .where(eq(teamGoals.circleId, circleId))
      .orderBy(desc(teamGoals.createdAt));
  }

  async getTeamGoalById(id: number): Promise<TeamGoal | undefined> {
    const [teamGoal] = await db
      .select()
      .from(teamGoals).$dynamic()
      .where(eq(teamGoals.id, id));
    
    return teamGoal;
  }

  async createTeamGoal(goal: InsertTeamGoal): Promise<TeamGoal> {
    const [newTeamGoal] = await db
      .insert(teamGoals)
      .values(goal)
      .returning();
    
    return newTeamGoal;
  }

  async updateTeamGoal(id: number, circleId: number, goal: Partial<InsertTeamGoal>): Promise<TeamGoal | undefined> {
    const [updated] = await db
      .update(teamGoals)
      .set({ ...goal, updatedAt: new Date() })
      .where(
        and(
          eq(teamGoals.id, id),
          eq(teamGoals.circleId, circleId)
        )
      )
      .returning();
    
    return updated;
  }

  async deleteTeamGoal(id: number, circleId: number): Promise<void> {
    await db
      .delete(teamGoals)
      .where(
        and(
          eq(teamGoals.id, id),
          eq(teamGoals.circleId, circleId)
        )
      );
  }

  // Team goal milestones
  async getTeamGoalMilestones(teamGoalId: number): Promise<TeamGoalMilestone[]> {
    return db
      .select()
      .from(teamGoalMilestones).$dynamic()
      .where(eq(teamGoalMilestones.teamGoalId, teamGoalId))
      .orderBy(asc(teamGoalMilestones.order));
  }

  async createTeamGoalMilestone(milestone: InsertTeamGoalMilestone): Promise<TeamGoalMilestone> {
    const [newMilestone] = await db
      .insert(teamGoalMilestones)
      .values(milestone)
      .returning();
    
    return newMilestone;
  }

  async updateTeamGoalMilestone(id: number, milestone: Partial<InsertTeamGoalMilestone>): Promise<TeamGoalMilestone | undefined> {
    const [updated] = await db
      .update(teamGoalMilestones)
      .set({ ...milestone, updatedAt: new Date() })
      .where(eq(teamGoalMilestones.id, id))
      .returning();
    
    return updated;
  }

  async deleteTeamGoalMilestone(id: number): Promise<void> {
    await db
      .delete(teamGoalMilestones)
      .where(eq(teamGoalMilestones.id, id));
  }

  // Team goal assignments
  async getTeamGoalAssignments(teamGoalId: number): Promise<(TeamGoalAssignment & { user: { id: number, username: string, displayName: string | null } })[]> {
    return db
      .select({
        ...teamGoalAssignments,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName
        }
      })
      .from(teamGoalAssignments)
      .innerJoin(users, eq(teamGoalAssignments.userId, users.id))
      .where(eq(teamGoalAssignments.teamGoalId, teamGoalId));
  }

  async getUserAssignments(userId: number): Promise<(TeamGoalAssignment & { teamGoal: { id: number, title: string, circleId: number } })[]> {
    return db
      .select({
        ...teamGoalAssignments,
        teamGoal: {
          id: teamGoals.id,
          title: teamGoals.title,
          circleId: teamGoals.circleId
        }
      })
      .from(teamGoalAssignments)
      .innerJoin(teamGoals, eq(teamGoalAssignments.teamGoalId, teamGoals.id))
      .where(eq(teamGoalAssignments.userId, userId));
  }

  async createTeamGoalAssignment(assignment: InsertTeamGoalAssignment): Promise<TeamGoalAssignment> {
    const [newAssignment] = await db
      .insert(teamGoalAssignments)
      .values(assignment)
      .returning();
    
    return newAssignment;
  }

  async updateTeamGoalAssignment(id: number, assignment: Partial<InsertTeamGoalAssignment>): Promise<TeamGoalAssignment | undefined> {
    const [updated] = await db
      .update(teamGoalAssignments)
      .set(assignment)
      .where(eq(teamGoalAssignments.id, id))
      .returning();
    
    return updated;
  }

  async deleteTeamGoalAssignment(id: number): Promise<void> {
    await db
      .delete(teamGoalAssignments)
      .where(eq(teamGoalAssignments.id, id));
  }

  // Lobbying activities
  async getLobbyingActivities(teamGoalId?: number, userId?: number): Promise<LobbyingActivity[]> {
    let query = db.select().from(lobbyingActivities).$dynamic();
    
    if (teamGoalId) {
      query = query.where(eq(lobbyingActivities.teamGoalId, teamGoalId));
    }
    
    if (userId) {
      query = query.where(eq(lobbyingActivities.userId, userId));
    }
    
    return query.orderBy(desc(lobbyingActivities.activityDate));
  }

  async getLobbyingActivityById(id: number): Promise<LobbyingActivity | undefined> {
    const [activity] = await db
      .select()
      .from(lobbyingActivities).$dynamic()
      .where(eq(lobbyingActivities.id, id));
    
    return activity;
  }

  async createLobbyingActivity(activity: InsertLobbyingActivity): Promise<LobbyingActivity> {
    const [newActivity] = await db
      .insert(lobbyingActivities)
      .values(activity)
      .returning();
    
    return newActivity;
  }

  async updateLobbyingActivity(id: number, activity: Partial<InsertLobbyingActivity>): Promise<LobbyingActivity | undefined> {
    const [updated] = await db
      .update(lobbyingActivities)
      .set(activity)
      .where(eq(lobbyingActivities.id, id))
      .returning();
    
    return updated;
  }

  async deleteLobbyingActivity(id: number, userId: number): Promise<void> {
    await db
      .delete(lobbyingActivities)
      .where(
        and(
          eq(lobbyingActivities.id, id),
          eq(lobbyingActivities.userId, userId)
        )
      );
  }

  // Analytics and statistics
  async getGoalStatsByUserId(userId: number): Promise<any> {
    // User goals stats
    const goals = await this.getUserGoals(userId);
    const completedGoals = goals.filter(g => g.status === 'completed');
    const activeGoals = goals.filter(g => g.status === 'active');
    
    // Calculate average completion time
    let avgCompletionDays = 0;
    if (completedGoals.length > 0) {
      const completionTimes = completedGoals.map(g => {
        const createdDate = new Date(g.createdAt);
        const updatedDate = new Date(g.updatedAt);
        return (updatedDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24); // days
      });
      
      avgCompletionDays = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    }
    
    // Calculate active goals progress
    const avgProgress = activeGoals.length > 0 
      ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length 
      : 0;
    
    // Get categories distribution
    const categoryDistribution: Record<string, number> = {};
    goals.forEach(goal => {
      const category = goal.category;
      if (categoryDistribution[category]) {
        categoryDistribution[category]++;
      } else {
        categoryDistribution[category] = 1;
      }
    });
    
    return {
      totalGoals: goals.length,
      completedGoals: completedGoals.length,
      activeGoals: activeGoals.length,
      avgCompletionDays,
      avgProgress,
      categoryDistribution
    };
  }

  async getTeamGoalStatsByCircleId(circleId: number): Promise<any> {
    // Team goals stats
    const goals = await this.getTeamGoalsByCircleId(circleId);
    const completedGoals = goals.filter(g => g.status === 'completed');
    const activeGoals = goals.filter(g => g.status === 'active');
    
    // Calculate average completion time
    let avgCompletionDays = 0;
    if (completedGoals.length > 0) {
      const completionTimes = completedGoals.map(g => {
        const createdDate = new Date(g.createdAt);
        const updatedDate = new Date(g.updatedAt);
        return (updatedDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24); // days
      });
      
      avgCompletionDays = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    }
    
    // Calculate active goals progress
    const avgProgress = activeGoals.length > 0 
      ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length 
      : 0;
    
    // Count assigned members
    const assignmentCounts = await db
      .select({
        goalId: teamGoalAssignments.teamGoalId,
        count: sql<number>`count(*)`,
      })
      .from(teamGoalAssignments).$dynamic()
      .where(inArray(
        teamGoalAssignments.teamGoalId, 
        goals.map(g => g.id)
      ))
      .groupBy(teamGoalAssignments.teamGoalId);
    
    // Calculate engagement metrics
    const totalAssignments = assignmentCounts.reduce((sum, item) => sum + item.count, 0);
    const avgAssignmentsPerGoal = goals.length > 0 ? totalAssignments / goals.length : 0;
    
    return {
      totalGoals: goals.length,
      completedGoals: completedGoals.length,
      activeGoals: activeGoals.length,
      avgCompletionDays,
      avgProgress,
      totalAssignments,
      avgAssignmentsPerGoal
    };
  }

  async getLobbyingStatsByUserId(userId: number): Promise<any> {
    // Get all lobbying activities for user
    const activities = await this.getLobbyingActivities(undefined, userId);
    
    // Activity type distribution
    const activityTypeDistribution: Record<string, number> = {};
    activities.forEach(activity => {
      const type = activity.activityType;
      if (activityTypeDistribution[type]) {
        activityTypeDistribution[type]++;
      } else {
        activityTypeDistribution[type] = 1;
      }
    });
    
    // Follow-up stats
    const activitiesNeedingFollowUp = activities.filter(a => a.followUpNeeded);
    const pendingFollowUps = activitiesNeedingFollowUp.filter(a => {
      if (!a.followUpDate) return false;
      return new Date(a.followUpDate) > new Date();
    });
    
    // Activity over time (by month)
    const activityByMonth: Record<string, number> = {};
    activities.forEach(activity => {
      const date = new Date(activity.activityDate);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (activityByMonth[monthYear]) {
        activityByMonth[monthYear]++;
      } else {
        activityByMonth[monthYear] = 1;
      }
    });
    
    return {
      totalActivities: activities.length,
      activityTypeDistribution,
      followUpsNeeded: activitiesNeedingFollowUp.length,
      pendingFollowUps: pendingFollowUps.length,
      activityByMonth
    };
  }
}

// Export a single instance
export const goalsStorage = new GoalsStorage();