// @ts-nocheck
import { db } from "./db";
import { eq, and, asc, desc, sql, inArray, like } from "drizzle-orm";
import {
  actionCircles,
  circleMembers,
  circleActions,
  userCircleActions,
  users,
  policyAnnotations,
  type ActionCircle,
  type CircleMember,
  type CircleAction,
  type UserCircleAction,
  type InsertActionCircle,
  type InsertCircleMember,
  type InsertCircleAction,
  type InsertUserCircleAction,
} from "@shared/schema";
import { IActionCircleStorage } from "./storage-interface";
import { createLogger } from "./logger";
const log = createLogger("storage-action-circle");


export class ActionCircleStorage implements IActionCircleStorage {
  // Action Circle methods
  async getActionCircles(userId?: number): Promise<ActionCircle[]> {
    if (userId) {
      // Get circles where the user is a member
      const userCircles = await db
        .select({ circleId: circleMembers.circleId })
        .from(circleMembers).$dynamic()
        .where(and(eq(circleMembers.userId, userId), eq(circleMembers.isActive, true)));
      
      const circleIds = userCircles.map(c => c.circleId);
      
      if (circleIds.length === 0) {
        return [];
      }
      
      return db
        .select()
        .from(actionCircles).$dynamic()
        .where(and(
          inArray(actionCircles.id, circleIds),
          eq(actionCircles.isActive, true)
        ))
        .orderBy(desc(actionCircles.createdAt));
    }
    
    // Get all public circles
    return db
      .select()
      .from(actionCircles).$dynamic()
      .where(and(
        eq(actionCircles.isPublic, true),
        eq(actionCircles.isActive, true)
      ))
      .orderBy(desc(actionCircles.createdAt));
  }
  
  /**
   * Get circles for a specific user (where they are a member)
   */
  async getUserCircles(userId: number): Promise<ActionCircle[]> {
    // Get circles where the user is a member
    const userCircles = await db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers).$dynamic()
      .where(and(eq(circleMembers.userId, userId), eq(circleMembers.isActive, true)));
    
    const circleIds = userCircles.map(c => c.circleId);
    
    if (circleIds.length === 0) {
      return [];
    }
    
    return db
      .select()
      .from(actionCircles).$dynamic()
      .where(and(
        inArray(actionCircles.id, circleIds),
        eq(actionCircles.isActive, true)
      ))
      .orderBy(desc(actionCircles.createdAt));
  }
  
  /**
   * Get all public action circles
   */
  async getPublicCircles(): Promise<ActionCircle[]> {
    return db
      .select()
      .from(actionCircles).$dynamic()
      .where(and(
        eq(actionCircles.isPublic, true),
        eq(actionCircles.isActive, true)
      ))
      .orderBy(desc(actionCircles.createdAt));
  }

  async getActionCircleById(id: number): Promise<ActionCircle | undefined> {
    const [circle] = await db
      .select()
      .from(actionCircles).$dynamic()
      .where(eq(actionCircles.id, id));
    
    return circle;
  }

  async createActionCircle(data: InsertActionCircle): Promise<ActionCircle> {
    const [newCircle] = await db.insert(actionCircles).values(data).returning();
    return newCircle;
  }

  async updateActionCircle(id: number, data: Partial<InsertActionCircle>): Promise<ActionCircle> {
    const [updatedCircle] = await db
      .update(actionCircles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(actionCircles.id, id))
      .returning();
    
    return updatedCircle;
  }

  async deleteActionCircle(id: number): Promise<void> {
    // Mark the circle as inactive instead of deleting it
    await db
      .update(actionCircles)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(actionCircles.id, id));
  }

  // Circle Member methods
  async getCircleMembers(circleId: number): Promise<CircleMember[]> {
    return db
      .select()
      .from(circleMembers).$dynamic()
      .where(and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.isActive, true)
      ))
      .orderBy(asc(circleMembers.joinedAt));
  }

  async getCircleMembersWithUserDetails(circleId: number): Promise<(CircleMember & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]> {
    return db
      .select({
        id: circleMembers.id,
        circleId: circleMembers.circleId,
        userId: circleMembers.userId,
        role: circleMembers.role,
        joinedAt: circleMembers.joinedAt,
        isActive: circleMembers.isActive,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        }
      })
      .from(circleMembers)
      .innerJoin(users, eq(circleMembers.userId, users.id))
      .where(and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.isActive, true)
      ))
      .orderBy(asc(circleMembers.joinedAt));
  }

  async getCircleMember(circleId: number, userId: number): Promise<CircleMember | undefined> {
    const [member] = await db
      .select()
      .from(circleMembers).$dynamic()
      .where(and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.userId, userId),
        eq(circleMembers.isActive, true)
      ));
    
    return member;
  }

  async addCircleMember(data: InsertCircleMember): Promise<CircleMember> {
    const [newMember] = await db.insert(circleMembers).values(data).returning();
    return newMember;
  }

  async updateCircleMember(circleId: number, userId: number, data: Partial<InsertCircleMember>): Promise<CircleMember> {
    const [updatedMember] = await db
      .update(circleMembers)
      .set(data)
      .where(and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.userId, userId)
      ))
      .returning();
    
    return updatedMember;
  }

  async removeCircleMember(circleId: number, userId: number): Promise<void> {
    // Mark the member as inactive instead of deleting them
    await db
      .update(circleMembers)
      .set({
        isActive: false,
      })
      .where(and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.userId, userId)
      ));
  }

  // Circle Action methods
  async getCircleActions(circleId: number): Promise<CircleAction[]> {
    return db
      .select()
      .from(circleActions).$dynamic()
      .where(and(
        eq(circleActions.circleId, circleId),
        eq(circleActions.isActive, true)
      ))
      .orderBy(desc(circleActions.createdAt));
  }

  async getCircleActionById(id: number): Promise<CircleAction | undefined> {
    const [action] = await db
      .select()
      .from(circleActions).$dynamic()
      .where(eq(circleActions.id, id));
    
    return action;
  }

  async createCircleAction(data: InsertCircleAction): Promise<CircleAction> {
    const [newAction] = await db.insert(circleActions).values(data).returning();
    return newAction;
  }

  async updateCircleAction(id: number, data: Partial<InsertCircleAction>): Promise<CircleAction> {
    const [updatedAction] = await db
      .update(circleActions)
      .set(data)
      .where(eq(circleActions.id, id))
      .returning();
    
    return updatedAction;
  }

  async deleteCircleAction(id: number): Promise<void> {
    // Mark the action as inactive instead of deleting it
    await db
      .update(circleActions)
      .set({
        isActive: false,
      })
      .where(eq(circleActions.id, id));
  }

  // User Circle Action methods
  async getUserCircleActions(userId: number, actionId?: number): Promise<UserCircleAction[]> {
    if (actionId) {
      return db
        .select()
        .from(userCircleActions).$dynamic()
        .where(and(
          eq(userCircleActions.userId, userId),
          eq(userCircleActions.actionId, actionId)
        ));
    }
    
    return db
      .select()
      .from(userCircleActions).$dynamic()
      .where(eq(userCircleActions.userId, userId))
      .orderBy(desc(sql`CASE WHEN ${userCircleActions.completedAt} IS NULL THEN 1 ELSE 0 END`), asc(userCircleActions.completedAt));
  }

  async getActionParticipants(actionId: number): Promise<(UserCircleAction & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]> {
    return db
      .select({
        id: userCircleActions.id,
        actionId: userCircleActions.actionId,
        userId: userCircleActions.userId,
        status: userCircleActions.status,
        completed: userCircleActions.completed,
        completedAt: userCircleActions.completedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        }
      })
      .from(userCircleActions)
      .innerJoin(users, eq(userCircleActions.userId, users.id))
      .where(eq(userCircleActions.actionId, actionId))
      .orderBy(asc(userCircleActions.completedAt));
  }

  async assignActionToUser(data: InsertUserCircleAction): Promise<UserCircleAction> {
    const [userAction] = await db.insert(userCircleActions).values(data).returning();
    return userAction;
  }

  async updateUserCircleAction(userId: number, actionId: number, data: Partial<InsertUserCircleAction>): Promise<UserCircleAction> {
    const updateData: any = { ...data };
    
    // If marking as completed, update completedAt
    if (data.completed === true) {
      updateData.completedAt = new Date();
    } else if (data.completed === false) {
      updateData.completedAt = null;
    }
    
    const [updatedUserAction] = await db
      .update(userCircleActions)
      .set(updateData)
      .where(and(
        eq(userCircleActions.userId, userId),
        eq(userCircleActions.actionId, actionId)
      ))
      .returning();
    
    return updatedUserAction;
  }

  /**
   * Get annotations for a specific circle, optionally filtered by bill ID
   */
  async getCircleAnnotations(circleId: number, billId?: string): Promise<any[]> {
    try {
      let queryBuilder = db
        .select({
          annotation: policyAnnotations,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(policyAnnotations).$dynamic()
        .innerJoin(users, eq(policyAnnotations.userId, users.id))
        .where(
          and(
            eq(policyAnnotations.visibility, "circle"),
            eq(policyAnnotations.circleId, circleId)
          )
        );
      
      if (billId) {
        // Create a new query with the additional bill ID filter
        queryBuilder = db
          .select({
            annotation: policyAnnotations,
            user: {
              id: users.id,
              username: users.username,
              displayName: users.displayName,
              avatarUrl: users.avatarUrl,
            },
          })
          .from(policyAnnotations)
          .innerJoin(users, eq(policyAnnotations.userId, users.id))
          .where(
            and(
              eq(policyAnnotations.visibility, "circle"),
              eq(policyAnnotations.circleId, circleId),
              eq(policyAnnotations.billId, billId)
            )
          );
      }
      
      const results = await queryBuilder.orderBy(desc(policyAnnotations.createdAt));
      
      return results.map(r => ({
        ...r.annotation,
        author: r.user,
      }));
    } catch (error: any) {
      log.error({ err: error }, "Error in getCircleAnnotations");
      return [];
    }
  }

  // Analytics methods
  async getCircleActionStats(circleId: number): Promise<{
    totalMembers: number;
    totalActions: number;
    completedActions: number;
    activeMembers: number;
    avgCompletionRate: number;
  }> {
    // Total members
    const [{ count: totalMembers }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(circleMembers).$dynamic()
      .where(and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.isActive, true)
      ));

    // Total actions
    const [{ count: totalActions }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(circleActions).$dynamic()
      .where(and(
        eq(circleActions.circleId, circleId),
        eq(circleActions.isActive, true)
      ));

    // Get all user actions for this circle's actions
    const circleActionIds = await db
      .select({ id: circleActions.id })
      .from(circleActions).$dynamic()
      .where(and(
        eq(circleActions.circleId, circleId),
        eq(circleActions.isActive, true)
      ));
    
    const actionIds = circleActionIds.map(a => a.id);
    
    if (actionIds.length === 0) {
      return {
        totalMembers,
        totalActions,
        completedActions: 0,
        activeMembers: 0,
        avgCompletionRate: 0,
      };
    }

    // Completed actions
    const [{ count: completedActions }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userCircleActions).$dynamic()
      .where(and(
        inArray(userCircleActions.actionId, actionIds),
        eq(userCircleActions.completed, true)
      ));

    // Active members (members who have taken at least one action)
    const [{ count: activeMembers }] = await db
      .select({ count: sql<number>`count(distinct ${userCircleActions.userId})` })
      .from(userCircleActions).$dynamic()
      .where(inArray(userCircleActions.actionId, actionIds));

    // Average completion rate
    let avgCompletionRate = 0;
    if (totalActions > 0 && activeMembers > 0) {
      avgCompletionRate = Math.round((completedActions / (totalActions * activeMembers)) * 100);
    }

    return {
      totalMembers,
      totalActions,
      completedActions,
      activeMembers,
      avgCompletionRate,
    };
  }
}

export const actionCircleStorage = new ActionCircleStorage();