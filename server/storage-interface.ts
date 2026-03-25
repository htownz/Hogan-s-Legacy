/**
 * Updated IStorage interface to include social network and action circle functionality
 */

import {
  User, InsertUser,
  SuperUserRole, InsertSuperUserRole,
  ProgressionMilestone, InsertProgressionMilestone,
  Challenge, UserChallenge, InsertUserChallenge,
  ActionCircle, InsertActionCircle,
  CircleMember, InsertCircleMember,
  CircleAction, InsertCircleAction,
  UserCircleAction, InsertUserCircleAction,
  Representative, UserRepTracking, InsertUserRepTracking, RepResponse,
  TippingPointMetric, UserNetworkImpact, InsertUserNetworkImpact,
  Bill, InsertBill, UserBillTracking, InsertUserBillTracking,
  WarRoomCampaign, InsertWarRoomCampaign,
  WarRoomDiscussion, InsertWarRoomDiscussion,
  WarRoomCampaignMember, InsertWarRoomCampaignMember,
  WarRoomResource, InsertWarRoomResource,
  WarRoomActionItem, InsertWarRoomActionItem,
  WarRoomActionItemAssignment, InsertWarRoomActionItemAssignment,
  WarRoomReaction, InsertWarRoomReaction,
  BillNote, InsertBillNote,
  BillHighlight, InsertBillHighlight,
  BillShare, InsertBillShare,
  UserInvitation, InsertUserInvitation,
  UserConnection, InsertUserConnection,
  ConnectionActivity, InsertConnectionActivity,
  NetworkShare, InsertNetworkShare,
  ShareClickEvent, InsertShareClickEvent,
  LegislativeUpdate, InsertLegislativeUpdate,
  Verification, InsertVerification,
  VerificationRule, InsertVerificationRule,
  VerificationSource, InsertVerificationSource,
  UserVerificationCredential, InsertUserVerificationCredential
} from "@shared/schema";

export interface IActionCircleStorage {
  // Action Circle methods
  getActionCircles(userId?: number): Promise<ActionCircle[]>;
  getUserCircles(userId: number): Promise<ActionCircle[]>;
  getPublicCircles(): Promise<ActionCircle[]>;
  getActionCircleById(id: number): Promise<ActionCircle | undefined>;
  createActionCircle(data: InsertActionCircle): Promise<ActionCircle>;
  updateActionCircle(id: number, data: Partial<InsertActionCircle>): Promise<ActionCircle>;
  deleteActionCircle(id: number): Promise<void>;
  
  // Circle Member methods
  getCircleMembers(circleId: number): Promise<CircleMember[]>;
  getCircleMembersWithUserDetails(circleId: number): Promise<(CircleMember & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]>;
  getCircleMember(circleId: number, userId: number): Promise<CircleMember | undefined>;
  addCircleMember(data: InsertCircleMember): Promise<CircleMember>;
  updateCircleMember(circleId: number, userId: number, data: Partial<InsertCircleMember>): Promise<CircleMember>;
  removeCircleMember(circleId: number, userId: number): Promise<void>;
  
  // Circle Action methods
  getCircleActions(circleId: number): Promise<CircleAction[]>;
  getCircleActionById(id: number): Promise<CircleAction | undefined>;
  createCircleAction(data: InsertCircleAction): Promise<CircleAction>;
  updateCircleAction(id: number, data: Partial<InsertCircleAction>): Promise<CircleAction>;
  deleteCircleAction(id: number): Promise<void>;
  
  // User Circle Action methods
  getUserCircleActions(userId: number, actionId?: number): Promise<UserCircleAction[]>;
  getActionParticipants(actionId: number): Promise<(UserCircleAction & { user: { id: number; username: string; displayName: string | null; avatarUrl: string | null } })[]>;
  assignActionToUser(data: InsertUserCircleAction): Promise<UserCircleAction>;
  updateUserCircleAction(userId: number, actionId: number, data: Partial<InsertUserCircleAction>): Promise<UserCircleAction>;
  
  // Circle Annotations methods
  getCircleAnnotations(circleId: number, billId?: string): Promise<any[]>;
  
  // Analytics methods
  getCircleActionStats(circleId: number): Promise<{
    totalMembers: number;
    totalActions: number;
    completedActions: number;
    activeMembers: number;
    avgCompletionRate: number;
  }>;
}

export interface IStorage {
  // Bill/Legislation methods
  getAllBills(): Promise<Bill[]>;
  getBillById(id: string): Promise<Bill | undefined>;
  searchBills(query: string): Promise<Bill[]>;
  getBillsByStatus(status: string): Promise<Bill[]>;
  getBillsByChamber(chamber: string): Promise<Bill[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  getUserTrackedBills(userId: number): Promise<Bill[]>;
  isUserTrackingBill(userId: number, billId: string): Promise<boolean>;
  trackBill(userId: number, billId: string): Promise<UserBillTracking>;
  untrackBill(userId: number, billId: string): Promise<void>;
  
  // Bill Notes methods
  getBillNotesByBillId(billId: string): Promise<BillNote[]>;
  getUserBillNotes(userId: number, billId: string): Promise<BillNote[]>;
  createBillNote(note: InsertBillNote): Promise<BillNote>;
  updateBillNote(id: number, userId: number, data: Partial<BillNote>): Promise<BillNote | undefined>;
  deleteBillNote(id: number, userId: number): Promise<void>;
  
  // Bill Highlights methods
  getBillHighlightsByBillId(billId: string): Promise<BillHighlight[]>;
  getUserBillHighlights(userId: number, billId: string): Promise<BillHighlight[]>;
  createBillHighlight(highlight: InsertBillHighlight): Promise<BillHighlight>;
  updateBillHighlight(id: number, userId: number, data: Partial<BillHighlight>): Promise<BillHighlight | undefined>;
  deleteBillHighlight(id: number, userId: number): Promise<void>;
  
  // Bill Shares methods
  getBillSharesByUserId(userId: number): Promise<BillShare[]>;
  getBillSharesByBillId(billId: string): Promise<BillShare[]>;
  createBillShare(share: InsertBillShare): Promise<BillShare>;
  incrementBillShareClickCount(shareId: number): Promise<BillShare>;
  deleteBillShare(id: number, userId: number): Promise<void>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  checkUserPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  // Super User Role methods
  getSuperUserRoleByUserId(userId: number): Promise<SuperUserRole | undefined>;
  createSuperUserRole(role: InsertSuperUserRole): Promise<SuperUserRole>;
  updateSuperUserRole(userId: number, role: InsertSuperUserRole): Promise<SuperUserRole>;
  
  // Progression Milestone methods
  getProgressionMilestonesByUserId(userId: number): Promise<ProgressionMilestone[]>;
  createProgressionMilestone(milestone: InsertProgressionMilestone): Promise<ProgressionMilestone>;
  updateProgressionMilestone(id: number, userId: number, data: Partial<ProgressionMilestone>): Promise<ProgressionMilestone | undefined>;
  
  // Challenge methods
  getAllChallenges(): Promise<Challenge[]>;
  getChallengeById(id: number): Promise<Challenge | undefined>;
  getUserChallengesByUserId(userId: number): Promise<UserChallenge[]>;
  getUserChallengeByChallengeId(userId: number, challengeId: number): Promise<UserChallenge | undefined>;
  createUserChallenge(challenge: InsertUserChallenge): Promise<UserChallenge>;
  updateUserChallenge(userId: number, challengeId: number, userChallenge: Partial<InsertUserChallenge>): Promise<UserChallenge | undefined>;
  
  // Action Circle methods
  getActionCirclesByUserId(userId: number): Promise<ActionCircle[]>;
  createActionCircle(circle: InsertActionCircle): Promise<ActionCircle>;
  getCircleMembersByCircleId(circleId: number): Promise<CircleMember[]>;
  isUserCircleMember(userId: number, circleId: number): Promise<boolean>;
  createCircleMember(member: InsertCircleMember): Promise<CircleMember>;
  getCircleActionsByCircleId(circleId: number): Promise<CircleAction[]>;
  getCircleActionById(id: number): Promise<CircleAction | undefined>;
  createCircleAction(action: InsertCircleAction): Promise<CircleAction>;
  getUserCircleAction(userId: number, actionId: number): Promise<UserCircleAction | undefined>;
  createUserCircleAction(action: InsertUserCircleAction): Promise<UserCircleAction>;
  
  // Representative methods
  getAllRepresentatives(): Promise<Representative[]>;
  getRepresentativesByDistrict(district: string): Promise<Representative[]>;
  getRepresentativeById(id: number): Promise<Representative | undefined>;
  getRepResponsesByRepId(repId: number): Promise<RepResponse[]>;
  getUserRepTracking(userId: number, repId: number): Promise<UserRepTracking | undefined>;
  createUserRepTracking(tracking: InsertUserRepTracking): Promise<UserRepTracking>;
  
  // Tipping Point Metrics methods
  getLatestTippingPointMetrics(): Promise<TippingPointMetric | undefined>;
  getUserNetworkImpactByUserId(userId: number): Promise<UserNetworkImpact | undefined>;
  createUserNetworkImpact(impact: InsertUserNetworkImpact): Promise<UserNetworkImpact>;
  
  // War Room Campaign methods
  getAllWarRoomCampaigns(): Promise<WarRoomCampaign[]>;
  getWarRoomCampaignById(id: number): Promise<WarRoomCampaign | undefined>;
  getUserWarRoomCampaigns(userId: number): Promise<WarRoomCampaign[]>;
  createWarRoomCampaign(campaign: InsertWarRoomCampaign): Promise<WarRoomCampaign>;
  updateWarRoomCampaign(id: number, data: Partial<WarRoomCampaign>): Promise<WarRoomCampaign | undefined>;
  
  // War Room Discussion methods
  getWarRoomDiscussionsByCampaignId(campaignId: number): Promise<WarRoomDiscussion[]>;
  createWarRoomDiscussion(discussion: InsertWarRoomDiscussion): Promise<WarRoomDiscussion>;
  
  // War Room Campaign Member methods
  getWarRoomCampaignMembersByCampaignId(campaignId: number): Promise<WarRoomCampaignMember[]>;
  isUserWarRoomCampaignMember(userId: number, campaignId: number): Promise<boolean>;
  createWarRoomCampaignMember(member: InsertWarRoomCampaignMember): Promise<WarRoomCampaignMember>;
  
  // War Room Resource methods
  getWarRoomResourcesByCampaignId(campaignId: number): Promise<WarRoomResource[]>;
  createWarRoomResource(resource: InsertWarRoomResource): Promise<WarRoomResource>;
  incrementWarRoomResourceDownloads(resourceId: number): Promise<WarRoomResource>;
  
  // War Room Action Item methods
  getWarRoomActionItemsByCampaignId(campaignId: number): Promise<WarRoomActionItem[]>;
  getWarRoomActionItemById(id: number): Promise<WarRoomActionItem | undefined>;
  createWarRoomActionItem(item: InsertWarRoomActionItem): Promise<WarRoomActionItem>;
  updateWarRoomActionItem(id: number, data: Partial<WarRoomActionItem>): Promise<WarRoomActionItem | undefined>;
  
  // War Room Action Item Assignment methods
  getWarRoomActionItemAssignmentsByActionItemId(actionItemId: number): Promise<WarRoomActionItemAssignment[]>;
  getUserWarRoomActionItemAssignments(userId: number): Promise<WarRoomActionItemAssignment[]>;
  createWarRoomActionItemAssignment(assignment: InsertWarRoomActionItemAssignment): Promise<WarRoomActionItemAssignment>;
  updateWarRoomActionItemAssignment(id: number, data: Partial<WarRoomActionItemAssignment>): Promise<WarRoomActionItemAssignment | undefined>;
  
  // War Room Reaction methods
  getWarRoomReactionsByDiscussionId(discussionId: number): Promise<WarRoomReaction[]>;
  createWarRoomReaction(reaction: InsertWarRoomReaction): Promise<WarRoomReaction>;
  removeWarRoomReaction(reactionId: number, userId: number): Promise<void>;
  
  // User Invitation methods
  createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getUserInvitationById(id: number): Promise<UserInvitation | undefined>;
  getUserInvitationByCode(code: string): Promise<UserInvitation | undefined>;
  getUserInvitationsByInviterId(inviterId: number): Promise<UserInvitation[]>;
  updateUserInvitation(id: number, data: Partial<UserInvitation>): Promise<UserInvitation>;
  deleteUserInvitation(id: number): Promise<void>;
  
  // User Connection methods
  createUserConnection(connection: InsertUserConnection): Promise<UserConnection>;
  getUserConnectionById(id: number): Promise<UserConnection | undefined>;
  getUserConnectionsByUserId(userId: number): Promise<UserConnection[]>;
  deleteUserConnection(id: number): Promise<void>;
  updateUserConnectionStrength(userId: number, connectedUserId: number, increment: number): Promise<void>;
  
  // Connection Activity methods
  createConnectionActivity(activity: InsertConnectionActivity): Promise<ConnectionActivity>;
  getConnectionActivitiesByUserId(userId: number): Promise<ConnectionActivity[]>;
  
  // Network Share methods
  createNetworkShare(share: InsertNetworkShare): Promise<NetworkShare>;
  getNetworkSharesByUserId(userId: number): Promise<NetworkShare[]>;
  incrementNetworkShareClicks(shareId: number): Promise<NetworkShare>;
  incrementNetworkShareConversions(shareId: number): Promise<NetworkShare>;
  
  // Share Click Event methods
  createShareClickEvent(event: InsertShareClickEvent): Promise<ShareClickEvent>;
  getShareClickEventsByShareId(shareId: number): Promise<ShareClickEvent[]>;
  
  // User Network Impact methods
  incrementUserInvitationCount(userId: number): Promise<void>;
  decrementUserInvitationCount(userId: number): Promise<void>;
  incrementUserActiveCount(userId: number): Promise<void>;
  incrementUserActionsInspired(userId: number, count?: number): Promise<void>;
  updateUserNetworkImpactReach(userId: number): Promise<void>;
  calculateUserR0Value(userId: number): Promise<number>;
  
  // Legislative Update Verification methods
  getLegislativeUpdatesByBillId(billId: string): Promise<LegislativeUpdate[]>;
  getLegislativeUpdateById(id: number): Promise<LegislativeUpdate | undefined>;
  getRecentLegislativeUpdates(limit?: number): Promise<LegislativeUpdate[]>;
  getPendingLegislativeUpdates(limit?: number): Promise<LegislativeUpdate[]>;
  getVerifiedLegislativeUpdates(limit?: number): Promise<LegislativeUpdate[]>;
  createLegislativeUpdate(update: InsertLegislativeUpdate): Promise<LegislativeUpdate>;
  updateLegislativeUpdateStatus(id: number, status: string): Promise<LegislativeUpdate | undefined>;
  incrementVerificationCount(updateId: number): Promise<LegislativeUpdate | undefined>;
  
  // Verification methods
  getVerificationsByUpdateId(updateId: number): Promise<Verification[]>;
  getUserVerificationsByUpdateId(userId: number, updateId: number): Promise<Verification | undefined>;
  createVerification(verification: InsertVerification): Promise<Verification>;
  
  // Verification Rule methods
  getAllVerificationRules(): Promise<VerificationRule[]>;
  getVerificationRuleByType(updateType: string): Promise<VerificationRule | undefined>;
  createVerificationRule(rule: InsertVerificationRule): Promise<VerificationRule>;
  updateVerificationRule(id: number, data: Partial<VerificationRule>): Promise<VerificationRule | undefined>;
  
  // Verification Source methods
  getAllVerificationSources(): Promise<VerificationSource[]>;
  getVerificationSourceById(id: number): Promise<VerificationSource | undefined>;
  getVerificationSourcesByType(sourceType: string): Promise<VerificationSource[]>;
  createVerificationSource(source: InsertVerificationSource): Promise<VerificationSource>;
  updateVerificationSource(id: number, data: Partial<VerificationSource>): Promise<VerificationSource | undefined>;
  
  // User Verification Credential methods
  getUserVerificationCredentialsByUserId(userId: number): Promise<UserVerificationCredential[]>;
  createUserVerificationCredential(credential: InsertUserVerificationCredential): Promise<UserVerificationCredential>;
  updateUserVerificationCredential(userId: number, credentialType: string, data: Partial<UserVerificationCredential>): Promise<UserVerificationCredential | undefined>;
  incrementUserVerificationCount(userId: number, credentialType: string): Promise<UserVerificationCredential | undefined>;
  updateUserVerificationAccuracy(userId: number, credentialType: string, isAccurate: boolean): Promise<UserVerificationCredential | undefined>;
}