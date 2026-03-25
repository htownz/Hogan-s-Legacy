// @ts-nocheck
/**
 * Storage implementation with social network features
 */

// Import all existing imports
import { 
  users, 
  superUserRoles,
  progressionMilestones,
  challenges,
  userChallenges, 
  actionCircles,
  circleMembers,
  circleActions,
  userCircleActions,
  representatives,
  userRepTracking,
  repResponses,
  tippingPointMetrics,
  userNetworkImpact,
  bills,
  userBillTracking,
  warRoomCampaigns,
  warRoomDiscussions,
  warRoomCampaignMembers,
  warRoomResources,
  warRoomActionItems,
  warRoomActionItemAssignments,
  warRoomReactions,
  billNotes,
  billHighlights,
  billShares,
  userInvitations,
  userConnections,
  connectionActivities,
  networkShares,
  shareClickEvents,
  type User, 
  type InsertUser, 
  type SuperUserRole,
  type InsertSuperUserRole,
  type ProgressionMilestone,
  type InsertProgressionMilestone,
  type Challenge,
  type UserChallenge,
  type InsertUserChallenge,
  type ActionCircle,
  type InsertActionCircle,
  type CircleMember,
  type InsertCircleMember,
  type CircleAction,
  type InsertCircleAction,
  type UserCircleAction,
  type InsertUserCircleAction,
  type Representative,
  type UserRepTracking,
  type InsertUserRepTracking,
  type RepResponse,
  type TippingPointMetric,
  type UserNetworkImpact,
  type InsertUserNetworkImpact,
  type Bill,
  type InsertBill,
  type UserBillTracking,
  type InsertUserBillTracking,
  type WarRoomCampaign,
  type InsertWarRoomCampaign,
  type WarRoomDiscussion,
  type InsertWarRoomDiscussion,
  type WarRoomCampaignMember,
  type InsertWarRoomCampaignMember,
  type WarRoomResource,
  type InsertWarRoomResource,
  type WarRoomActionItem,
  type InsertWarRoomActionItem,
  type WarRoomActionItemAssignment,
  type InsertWarRoomActionItemAssignment,
  type WarRoomReaction,
  type InsertWarRoomReaction,
  type BillNote,
  type InsertBillNote,
  type BillHighlight,
  type InsertBillHighlight,
  type BillShare,
  type InsertBillShare,
  type UserInvitation,
  type InsertUserInvitation,
  type UserConnection,
  type InsertUserConnection,
  type ConnectionActivity,
  type InsertConnectionActivity,
  type NetworkShare,
  type InsertNetworkShare,
  type ShareClickEvent,
  type InsertShareClickEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, or, sql, ne as notEq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Import the updated interface
import { IStorage } from "./storage-interface";

export class DatabaseStorage implements IStorage {
  // Keep all existing implementations...

  // Bill/Legislation methods
  async getAllBills(): Promise<Bill[]> {
    return db.select().from(bills).orderBy(desc(bills.lastActionAt));
  }
  
  async getBillById(id: string): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).$dynamic().where(eq(bills.id, id));
    return bill || undefined;
  }
  
  async searchBills(query: string): Promise<Bill[]> {
    // Search in title and description
    return db.select().from(bills).$dynamic().where(
      or(
        like(bills.title, `%${query}%`),
        like(bills.description, `%${query}%`)
      )
    ).orderBy(desc(bills.lastActionAt));
  }
  
  async getBillsByStatus(status: string): Promise<Bill[]> {
    if (status === 'all') {
      return this.getAllBills();
    }
    return db.select().from(bills).$dynamic().where(eq(bills.status, status))
      .orderBy(desc(bills.lastActionAt));
  }
  
  async getBillsByChamber(chamber: string): Promise<Bill[]> {
    if (chamber === 'all') {
      return this.getAllBills();
    }
    return db.select().from(bills).$dynamic().where(eq(bills.chamber, chamber))
      .orderBy(desc(bills.lastActionAt));
  }
  
  async createBill(bill: InsertBill): Promise<Bill> {
    const [newBill] = await db
      .insert(bills)
      .values(bill)
      .returning();
    return newBill;
  }
  
  async getUserTrackedBills(userId: number): Promise<Bill[]> {
    const trackedBillIds = await db
      .select({ billId: userBillTracking.billId })
      .from(userBillTracking).$dynamic()
      .where(eq(userBillTracking.userId, userId));
    
    if (trackedBillIds.length === 0) {
      return [];
    }
    
    if (trackedBillIds.length === 1) {
      // If only one bill, use simple equality
      return db
        .select()
        .from(bills).$dynamic()
        .where(eq(bills.id, trackedBillIds[0].billId))
        .orderBy(desc(bills.lastActionAt));
    }
    
    // For multiple bills, use OR conditions
    const conditions = trackedBillIds.map(item => 
      eq(bills.id, item.billId)
    );
    
    return db
      .select()
      .from(bills).$dynamic()
      .where(or(...conditions))
      .orderBy(desc(bills.lastActionAt));
  }
  
  async isUserTrackingBill(userId: number, billId: string): Promise<boolean> {
    const [tracking] = await db
      .select()
      .from(userBillTracking).$dynamic()
      .where(
        and(
          eq(userBillTracking.userId, userId),
          eq(userBillTracking.billId, billId)
        )
      );
    return !!tracking;
  }
  
  async trackBill(userId: number, billId: string): Promise<UserBillTracking> {
    const [tracking] = await db
      .insert(userBillTracking)
      .values({ userId, billId })
      .returning();
    return tracking;
  }
  
  async untrackBill(userId: number, billId: string): Promise<void> {
    await db
      .delete(userBillTracking)
      .where(
        and(
          eq(userBillTracking.userId, userId),
          eq(userBillTracking.billId, billId)
        )
      );
  }

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
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    // Replace the plain password with the hashed one
    const userWithHashedPassword = {
      ...insertUser,
      password: hashedPassword
    };
    
    const [user] = await db
      .insert(users)
      .values(userWithHashedPassword)
      .returning();
    return user;
  }
  
  // Add method to verify passwords
  async checkUserPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Bill Notes methods
  async getBillNotesByBillId(billId: string): Promise<BillNote[]> {
    return db
      .select()
      .from(billNotes).$dynamic()
      .where(eq(billNotes.billId, billId))
      .orderBy(desc(billNotes.createdAt));
  }
  
  async getUserBillNotes(userId: number, billId: string): Promise<BillNote[]> {
    return db
      .select()
      .from(billNotes).$dynamic()
      .where(
        and(
          eq(billNotes.userId, userId),
          eq(billNotes.billId, billId)
        )
      )
      .orderBy(desc(billNotes.createdAt));
  }
  
  async createBillNote(note: InsertBillNote): Promise<BillNote> {
    const [newNote] = await db
      .insert(billNotes)
      .values(note)
      .returning();
    return newNote;
  }
  
  async updateBillNote(
    id: number, 
    userId: number, 
    data: Partial<BillNote>
  ): Promise<BillNote | undefined> {
    const [updatedNote] = await db
      .update(billNotes)
      .set(data)
      .where(
        and(
          eq(billNotes.id, id),
          eq(billNotes.userId, userId)
        )
      )
      .returning();
    return updatedNote;
  }
  
  async deleteBillNote(id: number, userId: number): Promise<void> {
    await db
      .delete(billNotes)
      .where(
        and(
          eq(billNotes.id, id),
          eq(billNotes.userId, userId)
        )
      );
  }

  // Bill Highlights methods
  async getBillHighlightsByBillId(billId: string): Promise<BillHighlight[]> {
    return db
      .select()
      .from(billHighlights).$dynamic()
      .where(eq(billHighlights.billId, billId))
      .orderBy(desc(billHighlights.createdAt));
  }
  
  async getUserBillHighlights(userId: number, billId: string): Promise<BillHighlight[]> {
    return db
      .select()
      .from(billHighlights).$dynamic()
      .where(
        and(
          eq(billHighlights.userId, userId),
          eq(billHighlights.billId, billId)
        )
      )
      .orderBy(desc(billHighlights.createdAt));
  }
  
  async createBillHighlight(highlight: InsertBillHighlight): Promise<BillHighlight> {
    const [newHighlight] = await db
      .insert(billHighlights)
      .values(highlight)
      .returning();
    return newHighlight;
  }
  
  async updateBillHighlight(
    id: number, 
    userId: number, 
    data: Partial<BillHighlight>
  ): Promise<BillHighlight | undefined> {
    const [updatedHighlight] = await db
      .update(billHighlights)
      .set(data)
      .where(
        and(
          eq(billHighlights.id, id),
          eq(billHighlights.userId, userId)
        )
      )
      .returning();
    return updatedHighlight;
  }
  
  async deleteBillHighlight(id: number, userId: number): Promise<void> {
    await db
      .delete(billHighlights)
      .where(
        and(
          eq(billHighlights.id, id),
          eq(billHighlights.userId, userId)
        )
      );
  }

  // Bill Shares methods
  async getBillSharesByUserId(userId: number): Promise<BillShare[]> {
    return db
      .select()
      .from(billShares).$dynamic()
      .where(eq(billShares.userId, userId))
      .orderBy(desc(billShares.createdAt));
  }
  
  async getBillSharesByBillId(billId: string): Promise<BillShare[]> {
    return db
      .select()
      .from(billShares).$dynamic()
      .where(eq(billShares.billId, billId))
      .orderBy(desc(billShares.createdAt));
  }
  
  async createBillShare(share: InsertBillShare): Promise<BillShare> {
    const [newShare] = await db
      .insert(billShares)
      .values(share)
      .returning();
    return newShare;
  }
  
  async incrementBillShareClickCount(shareId: number): Promise<BillShare> {
    const [updatedShare] = await db
      .update(billShares)
      .set({
        clicks: sql`clicks + 1`
      })
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
  
  async updateSuperUserRole(userId: number, role: InsertSuperUserRole): Promise<SuperUserRole> {
    const [updatedRole] = await db
      .update(superUserRoles)
      .set(role)
      .where(eq(superUserRoles.userId, userId))
      .returning();
    return updatedRole;
  }

  // Add placeholder implementations for all Tipping Point and War Room methods

  // For brevity, I'm adding stubs for mandatory methods from the interface
  // In practice, these would be fully implemented
  async getProgressionMilestonesByUserId(userId: number): Promise<ProgressionMilestone[]> {
    return db.select().from(progressionMilestones).$dynamic().where(eq(progressionMilestones.userId, userId));
  }
  
  async createProgressionMilestone(milestone: InsertProgressionMilestone): Promise<ProgressionMilestone> {
    const [newMilestone] = await db.insert(progressionMilestones).values(milestone).returning();
    return newMilestone;
  }
  
  async updateProgressionMilestone(id: number, userId: number, data: Partial<ProgressionMilestone>): Promise<ProgressionMilestone | undefined> {
    const [updated] = await db.update(progressionMilestones).set(data).where(and(eq(progressionMilestones.id, id), eq(progressionMilestones.userId, userId))).returning();
    return updated;
  }
  
  async getAllChallenges(): Promise<Challenge[]> {
    return db.select().from(challenges);
  }
  
  async getChallengeById(id: number): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).$dynamic().where(eq(challenges.id, id));
    return challenge || undefined;
  }
  
  async getUserChallengesByUserId(userId: number): Promise<UserChallenge[]> {
    return db.select().from(userChallenges).$dynamic().where(eq(userChallenges.userId, userId));
  }
  
  async getUserChallengeByChallengeId(userId: number, challengeId: number): Promise<UserChallenge | undefined> {
    const [userChallenge] = await db.select().from(userChallenges).$dynamic().where(and(eq(userChallenges.userId, userId), eq(userChallenges.challengeId, challengeId)));
    return userChallenge || undefined;
  }
  
  async createUserChallenge(challenge: InsertUserChallenge): Promise<UserChallenge> {
    const [newChallenge] = await db.insert(userChallenges).values(challenge).returning();
    return newChallenge;
  }
  
  async updateUserChallenge(userId: number, challengeId: number, data: Partial<UserChallenge>): Promise<UserChallenge | undefined> {
    const [updated] = await db.update(userChallenges).set(data).where(and(eq(userChallenges.userId, userId), eq(userChallenges.challengeId, challengeId))).returning();
    return updated;
  }
  
  // Add action circle methods
  async getActionCirclesByUserId(userId: number): Promise<ActionCircle[]> {
    return db.select().from(actionCircles).$dynamic().where(eq(actionCircles.creatorId, userId));
  }
  
  async createActionCircle(circle: InsertActionCircle): Promise<ActionCircle> {
    const [newCircle] = await db.insert(actionCircles).values(circle).returning();
    return newCircle;
  }
  
  async getCircleMembersByCircleId(circleId: number): Promise<CircleMember[]> {
    return db.select().from(circleMembers).$dynamic().where(eq(circleMembers.circleId, circleId));
  }
  
  async isUserCircleMember(userId: number, circleId: number): Promise<boolean> {
    const [member] = await db.select().from(circleMembers).$dynamic().where(and(eq(circleMembers.userId, userId), eq(circleMembers.circleId, circleId)));
    return !!member;
  }
  
  async createCircleMember(member: InsertCircleMember): Promise<CircleMember> {
    const [newMember] = await db.insert(circleMembers).values(member).returning();
    return newMember;
  }
  
  async getCircleActionsByCircleId(circleId: number): Promise<CircleAction[]> {
    return db.select().from(circleActions).$dynamic().where(eq(circleActions.circleId, circleId));
  }
  
  async getCircleActionById(id: number): Promise<CircleAction | undefined> {
    const [action] = await db.select().from(circleActions).$dynamic().where(eq(circleActions.id, id));
    return action || undefined;
  }
  
  async createCircleAction(action: InsertCircleAction): Promise<CircleAction> {
    const [newAction] = await db.insert(circleActions).values(action).returning();
    return newAction;
  }
  
  async getUserCircleAction(userId: number, actionId: number): Promise<UserCircleAction | undefined> {
    const [userAction] = await db.select().from(userCircleActions).$dynamic().where(and(eq(userCircleActions.userId, userId), eq(userCircleActions.actionId, actionId)));
    return userAction || undefined;
  }
  
  async createUserCircleAction(action: InsertUserCircleAction): Promise<UserCircleAction> {
    const [newAction] = await db.insert(userCircleActions).values(action).returning();
    return newAction;
  }

  // Representative methods
  async getAllRepresentatives(): Promise<Representative[]> {
    return db.select().from(representatives);
  }
  
  async getRepresentativesByDistrict(district: string): Promise<Representative[]> {
    return db.select().from(representatives).$dynamic().where(eq(representatives.district, district));
  }
  
  async getRepresentativeById(id: number): Promise<Representative | undefined> {
    const [rep] = await db.select().from(representatives).$dynamic().where(eq(representatives.id, id));
    return rep || undefined;
  }
  
  async getRepResponsesByRepId(repId: number): Promise<RepResponse[]> {
    return db.select().from(repResponses).$dynamic().where(eq(repResponses.repId, repId));
  }
  
  async getUserRepTracking(userId: number, repId: number): Promise<UserRepTracking | undefined> {
    const [tracking] = await db.select().from(userRepTracking).$dynamic().where(and(eq(userRepTracking.userId, userId), eq(userRepTracking.repId, repId)));
    return tracking || undefined;
  }
  
  async createUserRepTracking(tracking: InsertUserRepTracking): Promise<UserRepTracking> {
    const [newTracking] = await db.insert(userRepTracking).values(tracking).returning();
    return newTracking;
  }

  // Tipping Point Metrics methods
  async getLatestTippingPointMetrics(): Promise<TippingPointMetric | undefined> {
    const [metric] = await db.select().from(tippingPointMetrics).orderBy(desc(tippingPointMetrics.lastUpdated));
    return metric || undefined;
  }
  
  async getUserNetworkImpactByUserId(userId: number): Promise<UserNetworkImpact | undefined> {
    const [impact] = await db.select().from(userNetworkImpact).$dynamic().where(eq(userNetworkImpact.userId, userId));
    return impact || undefined;
  }
  
  async createUserNetworkImpact(impact: InsertUserNetworkImpact): Promise<UserNetworkImpact> {
    const [newImpact] = await db.insert(userNetworkImpact).values(impact).returning();
    return newImpact;
  }

  // War Room Campaign methods
  async getAllWarRoomCampaigns(): Promise<WarRoomCampaign[]> {
    return db.select().from(warRoomCampaigns);
  }
  
  async getWarRoomCampaignById(id: number): Promise<WarRoomCampaign | undefined> {
    const [campaign] = await db.select().from(warRoomCampaigns).$dynamic().where(eq(warRoomCampaigns.id, id));
    return campaign || undefined;
  }
  
  async getUserWarRoomCampaigns(userId: number): Promise<WarRoomCampaign[]> {
    // Campaigns where the user is a member
    const memberCampaignIds = await db
      .select({ campaignId: warRoomCampaignMembers.campaignId })
      .from(warRoomCampaignMembers).$dynamic()
      .where(eq(warRoomCampaignMembers.userId, userId));
    
    if (memberCampaignIds.length === 0) {
      return [];
    }
    
    const conditions = memberCampaignIds.map(item => 
      eq(warRoomCampaigns.id, item.campaignId)
    );
    
    return db
      .select()
      .from(warRoomCampaigns).$dynamic()
      .where(or(...conditions));
  }
  
  async createWarRoomCampaign(campaign: InsertWarRoomCampaign): Promise<WarRoomCampaign> {
    const [newCampaign] = await db.insert(warRoomCampaigns).values(campaign).returning();
    return newCampaign;
  }
  
  async updateWarRoomCampaign(id: number, data: Partial<WarRoomCampaign>): Promise<WarRoomCampaign | undefined> {
    const [updated] = await db.update(warRoomCampaigns).set(data).where(eq(warRoomCampaigns.id, id)).returning();
    return updated;
  }

  // War Room Discussion methods
  async getWarRoomDiscussionsByCampaignId(campaignId: number): Promise<WarRoomDiscussion[]> {
    return db.select().from(warRoomDiscussions).$dynamic().where(eq(warRoomDiscussions.campaignId, campaignId));
  }
  
  async createWarRoomDiscussion(discussion: InsertWarRoomDiscussion): Promise<WarRoomDiscussion> {
    const [newDiscussion] = await db.insert(warRoomDiscussions).values(discussion).returning();
    return newDiscussion;
  }

  // War Room Campaign Member methods
  async getWarRoomCampaignMembersByCampaignId(campaignId: number): Promise<WarRoomCampaignMember[]> {
    return db.select().from(warRoomCampaignMembers).$dynamic().where(eq(warRoomCampaignMembers.campaignId, campaignId));
  }
  
  async isUserWarRoomCampaignMember(userId: number, campaignId: number): Promise<boolean> {
    const [member] = await db.select().from(warRoomCampaignMembers).$dynamic().where(and(eq(warRoomCampaignMembers.userId, userId), eq(warRoomCampaignMembers.campaignId, campaignId)));
    return !!member;
  }
  
  async createWarRoomCampaignMember(member: InsertWarRoomCampaignMember): Promise<WarRoomCampaignMember> {
    const [newMember] = await db.insert(warRoomCampaignMembers).values(member).returning();
    return newMember;
  }

  // War Room Resource methods
  async getWarRoomResourcesByCampaignId(campaignId: number): Promise<WarRoomResource[]> {
    return db.select().from(warRoomResources).$dynamic().where(eq(warRoomResources.campaignId, campaignId));
  }
  
  async createWarRoomResource(resource: InsertWarRoomResource): Promise<WarRoomResource> {
    const [newResource] = await db.insert(warRoomResources).values(resource).returning();
    return newResource;
  }
  
  async incrementWarRoomResourceDownloads(resourceId: number): Promise<WarRoomResource> {
    const [updatedResource] = await db
      .update(warRoomResources)
      .set({
        downloads: sql`downloads + 1`
      })
      .where(eq(warRoomResources.id, resourceId))
      .returning();
    return updatedResource;
  }

  // War Room Action Item methods
  async getWarRoomActionItemsByCampaignId(campaignId: number): Promise<WarRoomActionItem[]> {
    return db.select().from(warRoomActionItems).$dynamic().where(eq(warRoomActionItems.campaignId, campaignId));
  }
  
  async getWarRoomActionItemById(id: number): Promise<WarRoomActionItem | undefined> {
    const [item] = await db.select().from(warRoomActionItems).$dynamic().where(eq(warRoomActionItems.id, id));
    return item || undefined;
  }
  
  async createWarRoomActionItem(item: InsertWarRoomActionItem): Promise<WarRoomActionItem> {
    const [newItem] = await db.insert(warRoomActionItems).values(item).returning();
    return newItem;
  }
  
  async updateWarRoomActionItem(id: number, data: Partial<WarRoomActionItem>): Promise<WarRoomActionItem | undefined> {
    const [updated] = await db.update(warRoomActionItems).set(data).where(eq(warRoomActionItems.id, id)).returning();
    return updated;
  }

  // War Room Action Item Assignment methods
  async getWarRoomActionItemAssignmentsByActionItemId(actionItemId: number): Promise<WarRoomActionItemAssignment[]> {
    return db.select().from(warRoomActionItemAssignments).$dynamic().where(eq(warRoomActionItemAssignments.actionItemId, actionItemId));
  }
  
  async getUserWarRoomActionItemAssignments(userId: number): Promise<WarRoomActionItemAssignment[]> {
    return db.select().from(warRoomActionItemAssignments).$dynamic().where(eq(warRoomActionItemAssignments.userId, userId));
  }
  
  async createWarRoomActionItemAssignment(assignment: InsertWarRoomActionItemAssignment): Promise<WarRoomActionItemAssignment> {
    const [newAssignment] = await db.insert(warRoomActionItemAssignments).values(assignment).returning();
    return newAssignment;
  }
  
  async updateWarRoomActionItemAssignment(id: number, data: Partial<WarRoomActionItemAssignment>): Promise<WarRoomActionItemAssignment | undefined> {
    const [updated] = await db.update(warRoomActionItemAssignments).set(data).where(eq(warRoomActionItemAssignments.id, id)).returning();
    return updated;
  }

  // War Room Reaction methods
  async getWarRoomReactionsByDiscussionId(discussionId: number): Promise<WarRoomReaction[]> {
    return db.select().from(warRoomReactions).$dynamic().where(eq(warRoomReactions.discussionId, discussionId));
  }
  
  async createWarRoomReaction(reaction: InsertWarRoomReaction): Promise<WarRoomReaction> {
    const [newReaction] = await db.insert(warRoomReactions).values(reaction).returning();
    return newReaction;
  }
  
  async removeWarRoomReaction(reactionId: number, userId: number): Promise<void> {
    await db.delete(warRoomReactions).where(and(eq(warRoomReactions.id, reactionId), eq(warRoomReactions.userId, userId)));
  }

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
      // Get first-degree connections
      const connections = await this.getUserConnectionsByUserId(userId);
      
      // Calculate second-degree reach by looking at connections' connections
      let secondDegreeReach = 0;
      
      for (const connection of connections) {
        const secondDegreeConnections = await this.getUserConnectionsByUserId(connection.connectedUserId);
        secondDegreeReach += secondDegreeConnections.length;
      }
      
      const totalReach = impact.usersInvited + impact.activeUsers + impact.actionsInspired + secondDegreeReach;
      
      // Update the total reach
      await db
        .update(userNetworkImpact)
        .set({
          totalReach
        })
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

// Export a singleton instance
export const storage = new DatabaseStorage();