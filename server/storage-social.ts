// @ts-nocheck
/**
 * Social Network and Viral Spread Mechanics Implementation for Act Up
 */

import { 
  userInvitations,
  userConnections,
  connectionActivities,
  networkShares,
  shareClickEvents,
  userNetworkImpact,
  type UserInvitation,
  type InsertUserInvitation,
  type UserConnection,
  type InsertUserConnection,
  type ConnectionActivity,
  type InsertConnectionActivity,
  type NetworkShare,
  type InsertNetworkShare,
  type ShareClickEvent,
  type InsertShareClickEvent,
  users,
  type User,
  type InsertUser,
  bills,
  type Bill,
  type InsertBill,
  representatives,
  type Representative,
  type InsertRepresentative,
  superUserRoles,
  type SuperUserRole,
  type InsertSuperUserRole,
  superUserChallenges,
  type SuperUserChallenge,
  type InsertSuperUserChallenge,
  userChallenges,
  type UserChallenge,
  type InsertUserChallenge,
  actionCircles,
  type ActionCircle,
  type InsertActionCircle,
  circleMembers,
  type CircleMember,
  type InsertCircleMember,
  circleActions,
  type CircleAction,
  type InsertCircleAction,
  userCircleActions,
  type UserCircleAction,
  type InsertUserCircleAction,
  billFollows,
  type BillFollow,
  type InsertBillFollow,
  billShares,
  type BillShare,
  type InsertBillShare
} from "@shared/schema";
import { eq, and, sql, or } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage-interface";

// Base database storage class 
export class SocialNetworkStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).$dynamic().where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).$dynamic().where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Bill methods
  async getAllBills(): Promise<Bill[]> {
    return db.select().from(bills);
  }

  async getBillById(id: string): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).$dynamic().where(eq(bills.id, id));
    return bill || undefined;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const [newBill] = await db
      .insert(bills)
      .values(bill)
      .returning();
    return newBill;
  }

  // Bill Follows methods
  async getBillFollowsByUserId(userId: number): Promise<BillFollow[]> {
    return db.select().from(billFollows).$dynamic().where(eq(billFollows.userId, userId));
  }

  async getBillFollowByUserAndBill(userId: number, billId: string): Promise<BillFollow | undefined> {
    const [follow] = await db.select().from(billFollows).$dynamic().where(
      and(
        eq(billFollows.userId, userId),
        eq(billFollows.billId, billId)
      )
    );
    return follow || undefined;
  }

  async createBillFollow(follow: InsertBillFollow): Promise<BillFollow> {
    const [newFollow] = await db
      .insert(billFollows)
      .values(follow)
      .returning();
    return newFollow;
  }

  async deleteBillFollow(userId: number, billId: string): Promise<void> {
    await db
      .delete(billFollows)
      .where(
        and(
          eq(billFollows.userId, userId),
          eq(billFollows.billId, billId)
        )
      );
  }

  // Bill Shares methods
  async getBillSharesByUserId(userId: number): Promise<BillShare[]> {
    return db.select().from(billShares).$dynamic().where(eq(billShares.userId, userId));
  }

  async getBillShareById(id: number): Promise<BillShare | undefined> {
    const [share] = await db.select().from(billShares).$dynamic().where(eq(billShares.id, id));
    return share || undefined;
  }

  async createBillShare(share: InsertBillShare): Promise<BillShare> {
    const [newShare] = await db
      .insert(billShares)
      .values(share)
      .returning();
    return newShare;
  }

  async incrementBillShareClicks(shareId: number): Promise<BillShare> {
    const [share] = await db
      .select()
      .from(billShares).$dynamic()
      .where(eq(billShares.id, shareId));
      
    const [updatedShare] = await db
      .update(billShares)
      .set({ clickCount: (share?.clickCount || 0) + 1 })
      .where(eq(billShares.id, shareId))
      .returning();
    
    return updatedShare;
  }
  
  async deleteBillShare(id: number, userId: number): Promise<void> {
    await db
      .delete(billShares)
      .where(
        and(
          eq(billShares.id, id),
          eq(billShares.userId, userId)
        )
      );
  }

  // Super User Role methods
  async getSuperUserRoleByUserId(userId: number): Promise<SuperUserRole | undefined> {
    const [role] = await db.select().from(superUserRoles).$dynamic().where(eq(superUserRoles.userId, userId));
    return role || undefined;
  }

  async createSuperUserRole(role: InsertSuperUserRole): Promise<SuperUserRole> {
    const [newRole] = await db
      .insert(superUserRoles)
      .values(role)
      .returning();
    return newRole;
  }

  async upgradeSuperUserRole(userId: number, newLevel: number): Promise<SuperUserRole> {
    const [upgradedRole] = await db
      .update(superUserRoles)
      .set({ level: newLevel })
      .where(eq(superUserRoles.userId, userId))
      .returning();
    return upgradedRole;
  }

  // Super User Challenges methods
  async getAllSuperUserChallenges(): Promise<SuperUserChallenge[]> {
    return db.select().from(superUserChallenges);
  }

  async getSuperUserChallengesByRole(role: string): Promise<SuperUserChallenge[]> {
    return db.select().from(superUserChallenges).$dynamic().where(eq(superUserChallenges.role, role));
  }

  async getSuperUserChallengeById(id: number): Promise<SuperUserChallenge | undefined> {
    const [challenge] = await db.select().from(superUserChallenges).$dynamic().where(eq(superUserChallenges.id, id));
    return challenge || undefined;
  }

  async createSuperUserChallenge(challenge: InsertSuperUserChallenge): Promise<SuperUserChallenge> {
    const [newChallenge] = await db
      .insert(superUserChallenges)
      .values(challenge)
      .returning();
    return newChallenge;
  }

  // User Challenge methods
  async getUserChallengesByUserId(userId: number): Promise<UserChallenge[]> {
    return db.select().from(userChallenges).$dynamic().where(eq(userChallenges.userId, userId));
  }

  async getUserChallengeByIds(userId: number, challengeId: number): Promise<UserChallenge | undefined> {
    const [userChallenge] = await db.select().from(userChallenges).$dynamic().where(
      and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.challengeId, challengeId)
      )
    );
    return userChallenge || undefined;
  }

  async createUserChallenge(userChallenge: InsertUserChallenge): Promise<UserChallenge> {
    const [newUserChallenge] = await db
      .insert(userChallenges)
      .values(userChallenge)
      .returning();
    return newUserChallenge;
  }

  async updateUserChallengeProgress(userId: number, challengeId: number, progress: number): Promise<UserChallenge> {
    const [updatedChallenge] = await db
      .update(userChallenges)
      .set({ progress })
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.challengeId, challengeId)
        )
      )
      .returning();
    return updatedChallenge;
  }

  async completeUserChallenge(userId: number, challengeId: number): Promise<UserChallenge> {
    const [completedChallenge] = await db
      .update(userChallenges)
      .set({ 
        completed: true, 
        completedAt: new Date() 
      })
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.challengeId, challengeId)
        )
      )
      .returning();
    return completedChallenge;
  }

  // Action Circles methods
  async getAllActionCircles(): Promise<ActionCircle[]> {
    return db.select().from(actionCircles);
  }

  async getActionCircleById(id: number): Promise<ActionCircle | undefined> {
    const [circle] = await db.select().from(actionCircles).$dynamic().where(eq(actionCircles.id, id));
    return circle || undefined;
  }

  async getActionCirclesByUserId(userId: number): Promise<ActionCircle[]> {
    // First get all circle IDs that the user is a member of
    const memberCircleIds = await db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers).$dynamic()
      .where(eq(circleMembers.userId, userId));
    
    if (memberCircleIds.length === 0) {
      return [];
    }
    
    if (memberCircleIds.length === 1) {
      // If only one circle, use simple equality
      return db
        .select()
        .from(actionCircles).$dynamic()
        .where(eq(actionCircles.id, memberCircleIds[0].circleId));
    }
    
    // For multiple circles, use OR conditions
    const conditions = memberCircleIds.map(item => 
      eq(actionCircles.id, item.circleId)
    );
    
    return db
      .select()
      .from(actionCircles).$dynamic()
      .where(or(...conditions));
  }

  // Now add the social network features
  // User Invitation methods
  async createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const [newInvitation] = await db
      .insert(userInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async getUserInvitationById(id: number): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations).$dynamic()
      .where(eq(userInvitations.id, id));
    return invitation || undefined;
  }

  async getUserInvitationByCode(code: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations).$dynamic()
      .where(eq(userInvitations.invitationCode, code));
    return invitation || undefined;
  }

  async getUserInvitationsByInviterId(inviterId: number): Promise<UserInvitation[]> {
    return db
      .select()
      .from(userInvitations).$dynamic()
      .where(eq(userInvitations.inviterId, inviterId));
  }

  async updateUserInvitation(id: number, data: Partial<UserInvitation>): Promise<UserInvitation> {
    const [updatedInvitation] = await db
      .update(userInvitations)
      .set(data)
      .where(eq(userInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async deleteUserInvitation(id: number): Promise<void> {
    await db
      .delete(userInvitations)
      .where(eq(userInvitations.id, id));
  }

  // User Connection methods
  async createUserConnection(connection: InsertUserConnection): Promise<UserConnection> {
    const [newConnection] = await db
      .insert(userConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async getUserConnectionById(id: number): Promise<UserConnection | undefined> {
    const [connection] = await db
      .select()
      .from(userConnections).$dynamic()
      .where(eq(userConnections.id, id));
    return connection || undefined;
  }

  async getUserConnectionsByUserId(userId: number): Promise<UserConnection[]> {
    return db
      .select()
      .from(userConnections).$dynamic()
      .where(eq(userConnections.userId, userId));
  }

  async deleteUserConnection(id: number): Promise<void> {
    await db
      .delete(userConnections)
      .where(eq(userConnections.id, id));
  }

  async updateUserConnectionStrength(userId: number, connectedUserId: number, increment: number): Promise<void> {
    await db
      .update(userConnections)
      .set({
        strength: sql`strength + ${increment}`
      })
      .where(
        and(
          eq(userConnections.userId, userId),
          eq(userConnections.connectedUserId, connectedUserId)
        )
      );
  }

  // Connection Activity methods
  async createConnectionActivity(activity: InsertConnectionActivity): Promise<ConnectionActivity> {
    const [newActivity] = await db
      .insert(connectionActivities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getConnectionActivitiesByUserId(userId: number): Promise<ConnectionActivity[]> {
    return db
      .select()
      .from(connectionActivities).$dynamic()
      .where(eq(connectionActivities.userId, userId));
  }

  // Network Share methods
  async createNetworkShare(share: InsertNetworkShare): Promise<NetworkShare> {
    const [newShare] = await db
      .insert(networkShares)
      .values(share)
      .returning();
    return newShare;
  }

  async getNetworkSharesByUserId(userId: number): Promise<NetworkShare[]> {
    return db
      .select()
      .from(networkShares).$dynamic()
      .where(eq(networkShares.userId, userId));
  }

  async incrementNetworkShareClicks(shareId: number): Promise<NetworkShare> {
    const [updatedShare] = await db
      .update(networkShares)
      .set({
        clicks: sql`clicks + 1`
      })
      .where(eq(networkShares.id, shareId))
      .returning();
    return updatedShare;
  }

  async incrementNetworkShareConversions(shareId: number): Promise<NetworkShare> {
    const [updatedShare] = await db
      .update(networkShares)
      .set({
        conversions: sql`conversions + 1`
      })
      .where(eq(networkShares.id, shareId))
      .returning();
    return updatedShare;
  }

  // Share Click Event methods
  async createShareClickEvent(event: InsertShareClickEvent): Promise<ShareClickEvent> {
    const [newEvent] = await db
      .insert(shareClickEvents)
      .values(event)
      .returning();
    
    // Increment the clicks counter for the share
    await this.incrementNetworkShareClicks(event.shareId);
    
    return newEvent;
  }

  async getShareClickEventsByShareId(shareId: number): Promise<ShareClickEvent[]> {
    return db
      .select()
      .from(shareClickEvents).$dynamic()
      .where(eq(shareClickEvents.shareId, shareId));
  }

  // User Network Impact methods
  async getUserNetworkImpactByUserId(userId: number): Promise<any | undefined> {
    const [impact] = await db
      .select()
      .from(userNetworkImpact).$dynamic()
      .where(eq(userNetworkImpact.userId, userId));
    return impact || undefined;
  }
  
  async incrementUserInvitationCount(userId: number): Promise<void> {
    // Get the existing network impact record or create if it doesn't exist
    const impact = await this.getUserNetworkImpactByUserId(userId);
    
    if (impact) {
      // Update existing record
      await db
        .update(userNetworkImpact)
        .set({
          usersInvited: sql`users_invited + 1`
        })
        .where(eq(userNetworkImpact.userId, userId));
    } else {
      // Create a new record
      await db
        .insert(userNetworkImpact)
        .values({
          userId,
          usersInvited: 1,
          activeUsers: 0,
          actionsInspired: 0,
          totalReach: 1,
          r0Value: 0
        });
    }
  }

  async decrementUserInvitationCount(userId: number): Promise<void> {
    await db
      .update(userNetworkImpact)
      .set({
        usersInvited: sql`GREATEST(users_invited - 1, 0)`,
        totalReach: sql`GREATEST(total_reach - 1, 0)`
      })
      .where(eq(userNetworkImpact.userId, userId));
  }

  async incrementUserActiveCount(userId: number): Promise<void> {
    // Get the existing network impact record or create if it doesn't exist
    const impact = await this.getUserNetworkImpactByUserId(userId);
    
    if (impact) {
      // Update existing record
      await db
        .update(userNetworkImpact)
        .set({
          activeUsers: sql`active_users + 1`
        })
        .where(eq(userNetworkImpact.userId, userId));
      
      // Update the R0 value
      await this.calculateAndUpdateR0Value(userId);
    } else {
      // Create a new record
      await db
        .insert(userNetworkImpact)
        .values({
          userId,
          usersInvited: 0,
          activeUsers: 1,
          actionsInspired: 0,
          totalReach: 1,
          r0Value: 0
        });
    }
  }

  async incrementUserActionsInspired(userId: number, count: number = 1): Promise<void> {
    // Get the existing network impact record or create if it doesn't exist
    const impact = await this.getUserNetworkImpactByUserId(userId);
    
    if (impact) {
      // Update existing record
      await db
        .update(userNetworkImpact)
        .set({
          actionsInspired: sql`actions_inspired + ${count}`
        })
        .where(eq(userNetworkImpact.userId, userId));
    } else {
      // Create a new record
      await db
        .insert(userNetworkImpact)
        .values({
          userId,
          usersInvited: 0,
          activeUsers: 0,
          actionsInspired: count,
          totalReach: count,
          r0Value: 0
        });
    }
  }

  async updateUserNetworkImpactReach(userId: number): Promise<void> {
    // Calculate the total reach as the sum of:
    // 1. Users invited
    // 2. Active users
    // 3. Actions inspired
    // 4. Second-degree connections (connections of connections)
    
    const impact = await this.getUserNetworkImpactByUserId(userId);
    
    if (impact) {
      // Get all connections in a single query
      const connections = await this.getUserConnectionsByUserId(userId);
      
      // If there are no connections, update with just the direct metrics
      if (connections.length === 0) {
        const totalReach = impact.usersInvited + impact.activeUsers + impact.actionsInspired;
        await db
          .update(userNetworkImpact)
          .set({ totalReach })
          .where(eq(userNetworkImpact.userId, userId));
          
        return;
      }
      
      // Use a single efficient query to count all second-degree connections
      // This replaces the N+1 query pattern with a single aggregated query
      const connectedUserIds = connections.map(conn => conn.connectedUserId);
      
      // Count all connections for each of our first-degree connections in one query
      const secondDegreeCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userConnections).$dynamic()
        .where(sql`${userConnections.userId} IN (${connectedUserIds.join(',')})`);
      
      const secondDegreeReach = secondDegreeCountResult[0]?.count || 0;
      const totalReach = impact.usersInvited + impact.activeUsers + impact.actionsInspired + secondDegreeReach;
      
      // Update the total reach
      await db
        .update(userNetworkImpact)
        .set({ totalReach })
        .where(eq(userNetworkImpact.userId, userId));
    }
  }

  async calculateUserR0Value(userId: number): Promise<number> {
    // R0 is a viral coefficient - the average number of new users
    // that an existing user can convert
    // We calculate it as: activeUsers / usersInvited
    
    const impact = await this.getUserNetworkImpactByUserId(userId);
    
    if (impact && impact.usersInvited > 0) {
      return impact.activeUsers / impact.usersInvited;
    }
    
    return 0;
  }
  
  private async calculateAndUpdateR0Value(userId: number): Promise<void> {
    const r0Value = await this.calculateUserR0Value(userId);
    
    await db
      .update(userNetworkImpact)
      .set({
        r0Value
      })
      .where(eq(userNetworkImpact.userId, userId));
  }
}

// Export the enhanced storage 
export const storage = new SocialNetworkStorage();