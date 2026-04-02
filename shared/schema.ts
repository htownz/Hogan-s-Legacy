import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export all recommendation system entities and types
export * from './schema-recommendations';

// Export all Capitol updates schema entities and types
export * from './schema-capitol';

// Export all state agencies schema entities and types
export * from './schema-state-agencies';

// Export all bill summaries schema entities and types
export * from './schema-bill-summaries';

// Export all bill versions and amendments
export * from './schema-bill-versions';
import { billVersions, billAmendments } from './schema-bill-versions';

// Export all committee video and analysis tables
export * from './schema-committee-videos';
export * from './schema-live-streams';

// Export all user activity tables
export {
  userActivities,
  userActionTracking,
  userAchievements,
  userActivityStreaks,
  userRoleBoosts,
  userActivitiesRelations
} from './schema-user-activity';

// Export all social sharing tables
export * from './schema-social';

// Export all smart alerts tables
export * from './schema-smart-alerts';

// Export all document management tables
export * from './schema-documents';

// Export all feedback tables
export * from './schema-feedback';

// Export all legislator tables
export * from './schema-legislators';

// Export all ethics transparency tables
export * from './schema-ethics';

// Export all community tables 
export * from './schema-community';

// Export all community bill suggestions tables
// Using direct import/export to avoid naming conflicts
// export * from './schema-community-suggestions';

// Export all campaign finance data tables
export * from './schema-campaign-finance';

// Export all TEC file upload related tables
export * from './schema-tec-uploads';

// Export all Scout Bot tables
export * from './schema-scout-bot';
export * from './schema-scout-bot-extended';
export * from './schema-scout-bot-network';
export * from './schema-scout-bot-analytics';

// We already imported these above

// ---- BILLS/LEGISLATION ----
export const bills = pgTable("bills", {
  id: text("id").notNull().primaryKey(), // String ID format like "HB1234" or "SB789"
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(), // introduced, in_committee, passed_house, passed_senate, signed, vetoed
  chamber: text("chamber").notNull(), // house, senate
  introducedAt: timestamp("introduced_at").notNull(),
  lastActionAt: timestamp("last_action_at").notNull(),
  lastAction: text("last_action"), // Description of last action taken on bill
  sponsors: text("sponsors").array().notNull(),
  cosponsors: text("cosponsors").array(), // Optional co-sponsors of the bill
  topics: text("topics").array().notNull(),
  fullTextUrl: text("full_text_url"),
  fullText: text("full_text"), // Complete bill text content
  session: text("session"), // Legislative session (e.g., "89R" for 89th Regular)
  impactSummary: text("impact_summary"), // AI-generated impact analysis
  sentimentScore: integer("sentiment_score"), // Sentiment score from -100 to 100 for emotional theming
  communityComments: integer("community_comments").default(0), // Count of community comments
  communitySupportPct: integer("community_support_pct"), // Percentage of community supporting bill
  keyVotingDate: timestamp("key_voting_date"), // Next important voting date
  
  // Difficulty indicators
  policyDifficulty: integer("policy_difficulty").default(1), // 1 = Easy, 2 = Moderate, 3 = Complex, 4 = Very Complex, 5 = Expert
  engagementDifficulty: integer("engagement_difficulty").default(1), // 1 = Easy, 2 = Moderate, 3 = Complex, 4 = Very Complex, 5 = Expert
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertBillSchema = createInsertSchema(bills).pick({
  id: true,
  title: true,
  description: true,
  status: true,
  chamber: true, 
  introducedAt: true,
  lastActionAt: true,
  lastAction: true,
  sponsors: true,
  cosponsors: true,
  topics: true,
  fullTextUrl: true,
  fullText: true,
  session: true,
  impactSummary: true,
  sentimentScore: true,
  communityComments: true,
  communitySupportPct: true,
  keyVotingDate: true,
  policyDifficulty: true,
  engagementDifficulty: true
});

// Define the bill relations
export const billsRelations = relations(bills, ({ many }) => ({
  pointsOfOrder: many(pointsOfOrder),
  historyEvents: many(billHistoryEvents),
  notes: many(billNotes),
  highlights: many(billHighlights),
  shares: many(billShares),
  tracking: many(userBillTracking),
  follows: many(billFollows),
  versions: many(billVersions),
  amendments: many(billAmendments)
}));

// ---- USER BILL TRACKING ----
export const userBillTracking = pgTable("user_bill_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBillTrackingRelations = relations(userBillTracking, ({ one }) => ({
  user: one(users, {
    fields: [userBillTracking.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [userBillTracking.billId],
    references: [bills.id],
  }),
}));

export const insertUserBillTrackingSchema = createInsertSchema(userBillTracking).pick({
  userId: true,
  billId: true,
});

// ---- BILL FOLLOWS ----
export const billFollows = pgTable("bill_follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const billFollowsRelations = relations(billFollows, ({ one }) => ({
  user: one(users, {
    fields: [billFollows.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [billFollows.billId],
    references: [bills.id],
  }),
}));

export const insertBillFollowSchema = createInsertSchema(billFollows).pick({
  userId: true,
  billId: true,
});

// ---- USERS ----
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  district: text("district"),
  profileImageUrl: text("profile_image_url"),
  avatarUrl: text("avatar_url"),
  // Theme preferences
  useEmotionTheming: boolean("use_emotion_theming").default(true),
  defaultTheme: text("default_theme").default("system"), // 'light', 'dark', 'system'
  themeColorOverride: text("theme_color_override"),
  emotionThemeIntensity: text("emotion_theme_intensity").default("moderate"), // 'subtle', 'moderate', 'strong'
  // Onboarding status
  onboardingCompleted: boolean("onboarding_completed").default(false),
  // OAuth
  oauthProvider: text("oauth_provider"), // 'google' | 'github' | null
  oauthId: text("oauth_id"),             // provider-specific user ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  trackedBills: many(userBillTracking),
  billFollows: many(billFollows)
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  displayName: true,
  district: true,
  profileImageUrl: true,
  avatarUrl: true,
  useEmotionTheming: true,
  defaultTheme: true,
  themeColorOverride: true,
  emotionThemeIntensity: true,
  onboardingCompleted: true,
  oauthProvider: true,
  oauthId: true,
});

// ---- SUPER USER ROLES & PROGRESSION ----
export const superUserRoles = pgTable("super_user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'catalyst', 'amplifier', 'convincer'
  level: integer("level").notNull().default(1), // 1: Advocate, 2: Influencer, 3: Super Spreader, 4: Movement Builder
  progressToNextLevel: integer("progress_to_next_level").notNull().default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSuperUserRoleSchema = createInsertSchema(superUserRoles).pick({
  userId: true,
  role: true,
  level: true,
  progressToNextLevel: true,
});

// ---- PROGRESSION MILESTONES ----
export const progressionMilestones = pgTable("progression_milestones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  targetLevel: integer("target_level").notNull(),
  milestone: text("milestone").notNull(),
  completed: boolean("completed").notNull().default(false),
  progress: integer("progress").notNull().default(0), // For milestones that need tracking
  total: integer("total").notNull().default(1), // Total needed to complete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgressionMilestoneSchema = createInsertSchema(progressionMilestones).pick({
  userId: true,
  role: true,
  targetLevel: true,
  milestone: true,
  completed: true,
  progress: true,
  total: true,
});

// ---- CHALLENGES ----
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  role: text("role").notNull(), // 'catalyst', 'amplifier', 'convincer', 'all'
  requiredLevel: integer("required_level").notNull().default(1),
  rewardPoints: integer("reward_points").notNull(),
  rewardBadges: jsonb("reward_badges").notNull().default([]),
  daysAvailable: integer("days_available").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertChallengeSchema = createInsertSchema(challenges).pick({
  title: true,
  description: true,
  role: true,
  requiredLevel: true,
  rewardPoints: true,
  rewardBadges: true,
  daysAvailable: true,
  isActive: true,
});

// ---- SUPER USER CHALLENGES ----
export const superUserChallenges = pgTable("super_user_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  role: text("role").notNull(), // 'catalyst', 'amplifier', 'convincer', 'all'
  requiredLevel: integer("required_level").notNull().default(1),
  rewardPoints: integer("reward_points").notNull(),
  rewardBadges: jsonb("reward_badges").notNull().default([]),
  daysAvailable: integer("days_available").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertSuperUserChallengeSchema = createInsertSchema(superUserChallenges).pick({
  title: true,
  description: true,
  role: true,
  requiredLevel: true,
  rewardPoints: true,
  rewardBadges: true,
  daysAvailable: true,
  isActive: true,
});

// ---- USER CHALLENGES ----
export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  progress: integer("progress").notNull().default(0),
  total: integer("total").notNull().default(100),
  completed: boolean("completed").notNull().default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).pick({
  userId: true,
  challengeId: true,
  progress: true,
  total: true,
  completed: true,
});

// ---- ACTION CIRCLES ----
export const actionCircles = pgTable("action_circles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  focusArea: text("focus_area"),
  isPublic: boolean("is_public").notNull().default(true),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const actionCirclesRelations = relations(actionCircles, ({ one, many }) => ({
  creator: one(users, {
    fields: [actionCircles.createdBy],
    references: [users.id],
  }),
  members: many(circleMembers),
  actions: many(circleActions),
}));

export const insertActionCircleSchema = createInsertSchema(actionCircles).pick({
  name: true,
  description: true,
  focusArea: true,
  isPublic: true,
  createdBy: true,
  isActive: true,
});

// ---- CIRCLE MEMBERS ----
export const circleMembers = pgTable("circle_members", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull().references(() => actionCircles.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // 'member', 'coordinator', 'leader'
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const circleMembersRelations = relations(circleMembers, ({ one }) => ({
  circle: one(actionCircles, {
    fields: [circleMembers.circleId],
    references: [actionCircles.id],
  }),
  user: one(users, {
    fields: [circleMembers.userId],
    references: [users.id],
  }),
}));

export const insertCircleMemberSchema = createInsertSchema(circleMembers).pick({
  circleId: true,
  userId: true,
  role: true,
  isActive: true,
});

// ---- CIRCLE ACTIONS ----
export const circleActions = pgTable("circle_actions", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull().references(() => actionCircles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const circleActionsRelations = relations(circleActions, ({ one, many }) => ({
  circle: one(actionCircles, {
    fields: [circleActions.circleId],
    references: [actionCircles.id],
  }),
  creator: one(users, {
    fields: [circleActions.createdBy],
    references: [users.id],
  }),
  participants: many(userCircleActions),
}));

export const insertCircleActionSchema = createInsertSchema(circleActions).pick({
  circleId: true,
  title: true,
  description: true,
  createdBy: true,
  deadline: true,
  isActive: true,
});

// ---- USER CIRCLE ACTIONS ----
export const userCircleActions = pgTable("user_circle_actions", {
  id: serial("id").primaryKey(),
  actionId: integer("action_id").notNull().references(() => circleActions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("assigned"), // 'assigned', 'in-progress', 'completed', 'blocked'
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const userCircleActionsRelations = relations(userCircleActions, ({ one }) => ({
  action: one(circleActions, {
    fields: [userCircleActions.actionId],
    references: [circleActions.id],
  }),
  user: one(users, {
    fields: [userCircleActions.userId],
    references: [users.id],
  }),
}));

export const insertUserCircleActionSchema = createInsertSchema(userCircleActions).pick({
  actionId: true,
  userId: true,
  status: true,
  completed: true,
});

// ---- REPRESENTATIVES ----
export const representatives = pgTable("representatives", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  party: text("party"),
  district: text("district"),
  imageUrl: text("image_url"),
  responseRate: integer("response_rate"), // percentage
  averageResponseTime: integer("average_response_time"), // in days
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRepresentativeSchema = createInsertSchema(representatives).pick({
  name: true,
  title: true,
  party: true,
  district: true,
  imageUrl: true,
  responseRate: true,
  averageResponseTime: true,
});

// ---- USER REPS TRACKING ----
export const userRepTracking = pgTable("user_rep_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  repId: integer("rep_id").notNull().references(() => representatives.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserRepTrackingSchema = createInsertSchema(userRepTracking).pick({
  userId: true,
  repId: true,
});

// ---- REP RESPONSES ----
export const repResponses = pgTable("rep_responses", {
  id: serial("id").primaryKey(),
  repId: integer("rep_id").notNull().references(() => representatives.id),
  topic: text("topic").notNull(),
  responseTime: integer("response_time").notNull(), // in days
  responseType: text("response_type").notNull(), // 'form_letter', 'detailed', 'position_statement', etc
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRepResponseSchema = createInsertSchema(repResponses).pick({
  repId: true,
  topic: true,
  responseTime: true,
  responseType: true,
});

// ---- TIPPING POINT METRICS ----
export const tippingPointMetrics = pgTable("tipping_point_metrics", {
  id: serial("id").primaryKey(),
  activeUsers: integer("active_users").notNull().default(0),
  superSpreaders: integer("super_spreaders").notNull().default(0), 
  actionsTaken: integer("actions_taken").notNull().default(0),
  policyImpacts: integer("policy_impacts").notNull().default(0),
  percentReached: integer("percent_reached").notNull().default(0), // 0-100
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertTippingPointMetricSchema = createInsertSchema(tippingPointMetrics).pick({
  activeUsers: true,
  superSpreaders: true,
  actionsTaken: true,
  policyImpacts: true,
  percentReached: true,
});

// ---- USER NETWORK IMPACT ----
export const userNetworkImpact = pgTable("user_network_impact", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  usersInvited: integer("users_invited").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  actionsInspired: integer("actions_inspired").notNull().default(0),
  totalReach: integer("total_reach").notNull().default(0),
  r0Value: integer("r0_value").notNull().default(0), // R0 value * 10 (for storing with 1 decimal place)
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserNetworkImpactSchema = createInsertSchema(userNetworkImpact).pick({
  userId: true,
  usersInvited: true,
  activeUsers: true,
  actionsInspired: true,
  totalReach: true,
  r0Value: true,
});

// ---- ROLE-SPECIFIC AI ASSISTANTS ----
export const aiAssistants = pgTable("ai_assistants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'catalyst', 'amplifier', 'convincer'
  lastConversationAt: timestamp("last_conversation_at").defaultNow(),
  conversationCount: integer("conversation_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  settings: jsonb("settings").default({}), // User-specific assistant settings
});

export const insertAiAssistantSchema = createInsertSchema(aiAssistants).pick({
  userId: true,
  role: true,
  settings: true,
});

export const aiAssistantConversations = pgTable("ai_assistant_conversations", {
  id: serial("id").primaryKey(),
  assistantId: integer("assistant_id").notNull().references(() => aiAssistants.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertAiAssistantConversationSchema = createInsertSchema(aiAssistantConversations).pick({
  assistantId: true,
  title: true,
  isActive: true,
});

export const aiAssistantMessages = pgTable("ai_assistant_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => aiAssistantConversations.id),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
});

export const insertAiAssistantMessageSchema = createInsertSchema(aiAssistantMessages).pick({
  conversationId: true,
  content: true,
  role: true,
  metadata: true,
});

// ---- USER ACTIVITIES ----
// Note: User activities have been moved to schema-user-activity.ts and imported at the top of this file

// Import and re-export the insert schema from schema-user-activity.ts
import { insertUserActivitySchema } from './schema-user-activity';

// ---- EXPORT TYPES ----
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type UserBillTracking = typeof userBillTracking.$inferSelect;
export type InsertUserBillTracking = z.infer<typeof insertUserBillTrackingSchema>;

export type BillFollow = typeof billFollows.$inferSelect;
export type InsertBillFollow = z.infer<typeof insertBillFollowSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SuperUserRole = typeof superUserRoles.$inferSelect;
export type InsertSuperUserRole = z.infer<typeof insertSuperUserRoleSchema>;

export type SuperUser = SuperUserRole;

export interface RecommendedAction {
  id: number;
  type: string;
  title: string;
  description: string;
  action: string;
}

export type ProgressionMilestone = typeof progressionMilestones.$inferSelect;
export type InsertProgressionMilestone = z.infer<typeof insertProgressionMilestoneSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type SuperUserChallenge = typeof superUserChallenges.$inferSelect;
export type InsertSuperUserChallenge = z.infer<typeof insertSuperUserChallengeSchema>;

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;

export type ActionCircle = typeof actionCircles.$inferSelect;
export type InsertActionCircle = z.infer<typeof insertActionCircleSchema>;

export type CircleMember = typeof circleMembers.$inferSelect;
export type InsertCircleMember = z.infer<typeof insertCircleMemberSchema>;

export type CircleAction = typeof circleActions.$inferSelect;
export type InsertCircleAction = z.infer<typeof insertCircleActionSchema>;

export type UserCircleAction = typeof userCircleActions.$inferSelect;
export type InsertUserCircleAction = z.infer<typeof insertUserCircleActionSchema>;

export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;

export type UserRepTracking = typeof userRepTracking.$inferSelect;
export type InsertUserRepTracking = z.infer<typeof insertUserRepTrackingSchema>;

export type RepResponse = typeof repResponses.$inferSelect;
export type InsertRepResponse = z.infer<typeof insertRepResponseSchema>;

export type TippingPointMetric = typeof tippingPointMetrics.$inferSelect;
export type InsertTippingPointMetric = z.infer<typeof insertTippingPointMetricSchema>;

export type UserNetworkImpact = typeof userNetworkImpact.$inferSelect;
export type InsertUserNetworkImpact = z.infer<typeof insertUserNetworkImpactSchema>;

// ---- WAR ROOM CAMPAIGNS ----
export const warRoomCampaigns = pgTable("war_room_campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  billId: text("bill_id").references(() => bills.id),
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high'
  status: text("status").notNull().default("active"), // 'draft', 'active', 'completed', 'archived'
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWarRoomCampaignSchema = createInsertSchema(warRoomCampaigns).pick({
  title: true,
  description: true,
  billId: true,
  priority: true,
  status: true,
  creatorId: true,
});

// ---- WAR ROOM DISCUSSIONS ----
export const warRoomDiscussions = pgTable("war_room_discussions", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => warRoomCampaigns.id),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWarRoomDiscussionSchema = createInsertSchema(warRoomDiscussions).pick({
  campaignId: true,
  userId: true,
  message: true,
});

// ---- WAR ROOM CAMPAIGN MEMBERS ----
export const warRoomCampaignMembers = pgTable("war_room_campaign_members", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => warRoomCampaigns.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // 'coordinator', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertWarRoomCampaignMemberSchema = createInsertSchema(warRoomCampaignMembers).pick({
  campaignId: true,
  userId: true,
  role: true,
});

// ---- WAR ROOM RESOURCES ----
export const warRoomResources = pgTable("war_room_resources", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => warRoomCampaigns.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'document', 'image', 'link', 'spreadsheet'
  url: text("url").notNull(),
  uploadedById: integer("uploaded_by_id").notNull().references(() => users.id),
  description: text("description"),
  downloads: integer("downloads").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWarRoomResourceSchema = createInsertSchema(warRoomResources).pick({
  campaignId: true,
  title: true,
  type: true,
  url: true,
  uploadedById: true,
  description: true,
});

// ---- WAR ROOM ACTION ITEMS ----
export const warRoomActionItems = pgTable("war_room_action_items", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => warRoomCampaigns.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("planned"), // 'planned', 'in-progress', 'completed', 'blocked'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high'
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWarRoomActionItemSchema = createInsertSchema(warRoomActionItems).pick({
  campaignId: true,
  title: true,
  description: true,
  dueDate: true,
  status: true,
  priority: true,
  createdById: true,
});

// ---- WAR ROOM ACTION ITEM ASSIGNMENTS ----
export const warRoomActionItemAssignments = pgTable("war_room_action_item_assignments", {
  id: serial("id").primaryKey(),
  actionItemId: integer("action_item_id").notNull().references(() => warRoomActionItems.id),
  userId: integer("user_id").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("assigned"), // 'assigned', 'in-progress', 'completed'
});

export const insertWarRoomActionItemAssignmentSchema = createInsertSchema(warRoomActionItemAssignments).pick({
  actionItemId: true,
  userId: true,
  status: true,
});

// ---- WAR ROOM REACTIONS ----
export const warRoomReactions = pgTable("war_room_reactions", {
  id: serial("id").primaryKey(),
  discussionId: integer("discussion_id").notNull().references(() => warRoomDiscussions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'thumbsUp', 'heart', 'clap', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWarRoomReactionSchema = createInsertSchema(warRoomReactions).pick({
  discussionId: true,
  userId: true,
  type: true,
});

export type WarRoomCampaign = typeof warRoomCampaigns.$inferSelect;
export type InsertWarRoomCampaign = z.infer<typeof insertWarRoomCampaignSchema>;

export type WarRoomDiscussion = typeof warRoomDiscussions.$inferSelect;
export type InsertWarRoomDiscussion = z.infer<typeof insertWarRoomDiscussionSchema>;

export type WarRoomCampaignMember = typeof warRoomCampaignMembers.$inferSelect;
export type InsertWarRoomCampaignMember = z.infer<typeof insertWarRoomCampaignMemberSchema>;

export type WarRoomResource = typeof warRoomResources.$inferSelect;
export type InsertWarRoomResource = z.infer<typeof insertWarRoomResourceSchema>;

export type WarRoomActionItem = typeof warRoomActionItems.$inferSelect;
export type InsertWarRoomActionItem = z.infer<typeof insertWarRoomActionItemSchema>;

export type WarRoomActionItemAssignment = typeof warRoomActionItemAssignments.$inferSelect;
export type InsertWarRoomActionItemAssignment = z.infer<typeof insertWarRoomActionItemAssignmentSchema>;

export type WarRoomReaction = typeof warRoomReactions.$inferSelect;
export type InsertWarRoomReaction = z.infer<typeof insertWarRoomReactionSchema>;

export type AiAssistant = typeof aiAssistants.$inferSelect;
export type InsertAiAssistant = z.infer<typeof insertAiAssistantSchema>;

export type AiAssistantConversation = typeof aiAssistantConversations.$inferSelect;
export type InsertAiAssistantConversation = z.infer<typeof insertAiAssistantConversationSchema>;

export type AiAssistantMessage = typeof aiAssistantMessages.$inferSelect;
export type InsertAiAssistantMessage = z.infer<typeof insertAiAssistantMessageSchema>;

// Import and re-export types from schema-user-activity.ts
import { UserActivity, InsertUserActivity } from './schema-user-activity';

// ---- TEXAS LEGISLATURE DATA ----

// ---- STATUTES ----
export const texasStatutes = pgTable("texas_statutes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull(), // e.g., "GOV", "EDU", "FAM"
  title: varchar("title", { length: 50 }).notNull(), // e.g., "Government Code", "Education Code"
  chapter: varchar("chapter", { length: 20 }).notNull(),
  section: varchar("section", { length: 20 }).notNull(),
  content: text("content").notNull(),
  url: text("url").notNull(),
  effectiveDate: timestamp("effective_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertTexasStatuteSchema = createInsertSchema(texasStatutes).pick({
  code: true,
  title: true,
  chapter: true,
  section: true,
  content: true,
  url: true,
  effectiveDate: true,
});

// ---- LEGISLATIVE RULES ----
export const legislativeRules = pgTable("legislative_rules", {
  id: serial("id").primaryKey(),
  chamber: varchar("chamber", { length: 20 }).notNull(), // "house" or "senate"
  section: varchar("section", { length: 50 }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  url: text("url"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertLegislativeRuleSchema = createInsertSchema(legislativeRules).pick({
  chamber: true,
  section: true,
  title: true,
  content: true,
  url: true,
});

// ---- POINTS OF ORDER ----
export const pointsOfOrder = pgTable("points_of_order", {
  id: text("id").notNull().primaryKey(), // Using cuid for IDs
  billId: text("bill_id").references(() => bills.id),
  type: varchar("type", { length: 100 }).notNull(), // e.g., "Germaneness", "Caption", "Fiscal Note"
  description: text("description").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"), // "low", "medium", "high"
  ruleReference: text("rule_reference"), // Reference to specific rule
  raisedAt: timestamp("raised_at"),
  status: varchar("status", { length: 20 }).notNull().default("potential"), // "potential", "raised", "sustained", "overruled"
  detectedBy: varchar("detected_by", { length: 20 }).notNull().default("ai"), // "ai", "user", "staff"
  // Enhanced point of order analysis fields
  ruleCitation: text("rule_citation"), // Specific citation to parliamentary rules
  textLocation: text("text_location"), // JSON string containing location in bill text
  precedents: text("precedents"), // JSON string of historical precedents
  suggestedFix: text("suggested_fix"), // Suggested language change to fix issue
  resolution: text("resolution"), // How the point of order was resolved
  // AI-specific fields
  aiDetected: boolean("ai_detected").default(false), // Whether detected by AI
  validationStatus: varchar("validation_status", { length: 20 }).default("pending"), // "pending", "validated", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPointOfOrderSchema = createInsertSchema(pointsOfOrder).pick({
  id: true,
  billId: true,
  type: true,
  description: true,
  severity: true,
  ruleReference: true,
  raisedAt: true,
  status: true,
  detectedBy: true,
  ruleCitation: true,
  textLocation: true,
  precedents: true,
  suggestedFix: true,
  resolution: true,
  aiDetected: true,
  validationStatus: true,
});

// Define the points of order relations
export const pointsOfOrderRelations = relations(pointsOfOrder, ({ one }) => ({
  bill: one(bills, { fields: [pointsOfOrder.billId], references: [bills.id] }),
}));

// ---- LEGISLATIVE SESSION INFO ----
export const legislativeSessions = pgTable("legislative_sessions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // e.g., "87th Legislature, Regular Session"
  type: varchar("type", { length: 20 }).notNull(), // "regular", "special"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isCurrent: boolean("is_current").notNull().default(false),
  billFilingDeadline: timestamp("bill_filing_deadline"),
  sinedie: timestamp("sine_die"), // Final adjournment date
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLegislativeSessionSchema = createInsertSchema(legislativeSessions).pick({
  name: true,
  type: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  billFilingDeadline: true,
  sinedie: true,
});

// ---- BILL UPDATES/HISTORY ----
// ---- COMMITTEES ----
export const committees = pgTable("committees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  chamber: varchar("chamber", { length: 20 }).notNull(), // "house", "senate", "joint"
  description: text("description"),
  chair: text("chair"), // Name of committee chair
  viceChair: text("vice_chair"), // Name of committee vice chair
  members: text("members").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommitteeSchema = createInsertSchema(committees).pick({
  name: true,
  chamber: true,
  description: true,
  chair: true,
  viceChair: true,
  members: true,
});

// ---- COMMITTEE MEETINGS ----
export const committeeMeetings = pgTable("committee_meetings", {
  id: serial("id").primaryKey(),
  committeeId: integer("committee_id").notNull().references(() => committees.id),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  agenda: text("agenda"),
  billsDiscussed: text("bills_discussed").array(),
  status: varchar("status", { length: 30 }).notNull().default("scheduled"), // "scheduled", "in_progress", "completed", "cancelled", "rescheduled"
  videoUrl: text("video_url"),
  transcriptUrl: text("transcript_url"),
  // Summary data fields
  summaryJson: text("summary_json"), // Complete JSON summary data (all fields as one JSON document)
  summarySummary: text("summary_summary"), // Executive summary of the meeting
  summaryTranscript: text("summary_transcript"), // Full AI-generated transcript
  summaryKeyPoints: jsonb("summary_key_points"), // Key points extracted from the meeting
  summaryBillDiscussions: jsonb("summary_bill_discussions"), // Details about bill discussions
  summaryPublicTestimonies: jsonb("summary_public_testimonies"), // Details about public testimonies
  // Processing status fields
  processingStatus: varchar("processing_status", { length: 30 }), // "pending", "processing", "completed", "failed"
  lastUpdated: timestamp("last_updated"), // When the processing status was last updated
  summaryStatus: varchar("summary_status", { length: 30 }), // "pending", "processing", "completed", "failed" (deprecated, use processingStatus)
  summaryLastUpdated: timestamp("summary_last_updated"), // (deprecated, use lastUpdated)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommitteeMeetingSchema = createInsertSchema(committeeMeetings).pick({
  committeeId: true,
  date: true,
  location: true,
  agenda: true,
  billsDiscussed: true,
  status: true,
  videoUrl: true,
  transcriptUrl: true,
  // Summary data fields
  summaryJson: true,
  summarySummary: true,
  summaryTranscript: true,
  summaryKeyPoints: true,
  summaryBillDiscussions: true,
  summaryPublicTestimonies: true,
  // Processing status fields
  processingStatus: true,
  lastUpdated: true,
  summaryStatus: true,
  summaryLastUpdated: true,
});

export const billHistoryEvents = pgTable("bill_history_events", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  eventDate: timestamp("event_date").notNull(),
  action: text("action").notNull(),
  chamber: varchar("chamber", { length: 20 }).notNull(), // "house", "senate", "governor"
  committeeId: integer("committee_id").references(() => committees.id), // Optional reference to committee
  voteData: jsonb("vote_data"), // Optional vote information
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBillHistoryEventSchema = createInsertSchema(billHistoryEvents).pick({
  billId: true,
  eventDate: true,
  action: true,
  chamber: true,
  committeeId: true,
  voteData: true,
});

// ---- EXPORT TYPES FOR NEW TABLES ----
export type TexasStatute = typeof texasStatutes.$inferSelect;
export type InsertTexasStatute = z.infer<typeof insertTexasStatuteSchema>;

export type LegislativeRule = typeof legislativeRules.$inferSelect;
export type InsertLegislativeRule = z.infer<typeof insertLegislativeRuleSchema>;

export type PointOfOrder = typeof pointsOfOrder.$inferSelect;
export type InsertPointOfOrder = z.infer<typeof insertPointOfOrderSchema>;

export type LegislativeSession = typeof legislativeSessions.$inferSelect;
export type InsertLegislativeSession = z.infer<typeof insertLegislativeSessionSchema>;

export type BillHistoryEvent = typeof billHistoryEvents.$inferSelect;
export type InsertBillHistoryEvent = z.infer<typeof insertBillHistoryEventSchema>;

export type Committee = typeof committees.$inferSelect;
export type InsertCommittee = z.infer<typeof insertCommitteeSchema>;

export type CommitteeMeeting = typeof committeeMeetings.$inferSelect;
export type InsertCommitteeMeeting = z.infer<typeof insertCommitteeMeetingSchema>;

// ---- BILL NOTES ----
export const billNotes = pgTable("bill_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBillNoteSchema = createInsertSchema(billNotes).pick({
  userId: true,
  billId: true,
  content: true,
  isPrivate: true,
});

// ---- BILL HIGHLIGHTS ----
export const billHighlights = pgTable("bill_highlights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  textContent: text("text_content").notNull(), // The actual highlighted text
  textPosition: jsonb("text_position").notNull(), // JSON with startIndex, endIndex, section
  comment: text("comment"), // Optional user comment on the highlight
  color: varchar("color", { length: 20 }).notNull().default("yellow"), // Highlight color
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBillHighlightSchema = createInsertSchema(billHighlights).pick({
  userId: true,
  billId: true,
  textContent: true,
  textPosition: true,
  comment: true,
  color: true,
  isPrivate: true,
});

// ---- BILL SHARES ----
export const billShares = pgTable("bill_shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  shareType: varchar("share_type", { length: 20 }).notNull(), // "social", "email", "link", "embed"
  platform: varchar("platform", { length: 30 }), // For social shares: "twitter", "facebook", etc.
  recipientEmails: text("recipient_emails").array(), // For email shares
  customMessage: text("custom_message"), // Optional message to include
  includeNotes: boolean("include_notes").default(false), // Whether to include user's notes
  includeHighlights: boolean("include_highlights").default(false), // Whether to include user's highlights
  accessCode: text("access_code"), // Optional access code for restricted shares
  expiresAt: timestamp("expires_at"), // Optional expiration for the share
  createdAt: timestamp("created_at").defaultNow(),
  clickCount: integer("click_count").default(0), // Track engagement
});

export const insertBillShareSchema = createInsertSchema(billShares).pick({
  userId: true,
  billId: true,
  shareType: true,
  platform: true,
  recipientEmails: true,
  customMessage: true,
  includeNotes: true,
  includeHighlights: true,
  accessCode: true,
  expiresAt: true,
});

// Add relations for the new tables
// Committee relations
export const committeesRelations = relations(committees, ({ many }) => ({
  meetings: many(committeeMeetings),
  historyEvents: many(billHistoryEvents),
}));

export const committeeMeetingsRelations = relations(committeeMeetings, ({ one }) => ({
  committee: one(committees, { fields: [committeeMeetings.committeeId], references: [committees.id] }),
}));

export const billHistoryEventsRelations = relations(billHistoryEvents, ({ one }) => ({
  bill: one(bills, { fields: [billHistoryEvents.billId], references: [bills.id] }),
  committee: one(committees, { fields: [billHistoryEvents.committeeId], references: [committees.id] }),
}));

export const billNotesRelations = relations(billNotes, ({ one }) => ({
  user: one(users, { fields: [billNotes.userId], references: [users.id] }),
  bill: one(bills, { fields: [billNotes.billId], references: [bills.id] }),
}));

export const billHighlightsRelations = relations(billHighlights, ({ one }) => ({
  user: one(users, { fields: [billHighlights.userId], references: [users.id] }),
  bill: one(bills, { fields: [billHighlights.billId], references: [bills.id] }),
}));

export const billSharesRelations = relations(billShares, ({ one }) => ({
  user: one(users, { fields: [billShares.userId], references: [users.id] }),
  bill: one(bills, { fields: [billShares.billId], references: [bills.id] }),
}));

// Export types for the new tables
export type BillNote = typeof billNotes.$inferSelect;
export type InsertBillNote = z.infer<typeof insertBillNoteSchema>;

export type BillHighlight = typeof billHighlights.$inferSelect;
export type InsertBillHighlight = z.infer<typeof insertBillHighlightSchema>;

export type BillShare = typeof billShares.$inferSelect;
export type InsertBillShare = z.infer<typeof insertBillShareSchema>;

// ---- SOCIAL NETWORK RELATED TABLES ----

// User Invitations
export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  inviterId: integer("inviter_id").notNull().references(() => users.id),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  invitationCode: varchar("invitation_code", { length: 32 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, used, expired
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  registeredAt: timestamp("registered_at"),
  expiresAt: timestamp("expires_at"),
});

export const insertUserInvitationSchema = createInsertSchema(userInvitations).pick({
  inviterId: true,
  email: true,
  name: true,
  invitationCode: true,
  status: true,
  message: true,
  createdAt: true,
  expiresAt: true
});

// User Connections (bidirectional)
export const userConnections = pgTable("user_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  connectedUserId: integer("connected_user_id").notNull().references(() => users.id),
  connectionType: varchar("connection_type", { length: 20 }).notNull(), // invited, invited_by, followed, followed_by, etc.
  createdAt: timestamp("created_at").defaultNow(),
  strength: integer("strength").default(1), // Measure of connection strength (interactions)
});

export const insertUserConnectionSchema = createInsertSchema(userConnections).pick({
  userId: true,
  connectedUserId: true,
  connectionType: true,
  createdAt: true,
  strength: true
});

// User Connection Activities (interactions between connected users)
export const connectionActivities = pgTable("connection_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  connectedUserId: integer("connected_user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // shared_bill, commented, joined_circle, etc.
  referenceType: varchar("reference_type", { length: 50 }), // bill, comment, circle, etc.
  referenceId: varchar("reference_id", { length: 100 }), // ID of the referenced item
  createdAt: timestamp("created_at").defaultNow(),
  data: jsonb("data"), // Additional activity data
});

export const insertConnectionActivitySchema = createInsertSchema(connectionActivities).pick({
  userId: true,
  connectedUserId: true,
  activityType: true,
  referenceType: true,
  referenceId: true,
  createdAt: true,
  data: true
});

// Network Share Tracking (for network impact analysis)
export const networkShares = pgTable("network_shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  shareType: varchar("share_type", { length: 30 }).notNull(), // bill, action, representative, etc.
  shareId: varchar("share_id", { length: 100 }).notNull(), // ID of the shared item
  platform: varchar("platform", { length: 30 }), // facebook, twitter, email, etc.
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0), // Number of users who signed up from this share
  createdAt: timestamp("created_at").defaultNow(),
  data: jsonb("data"), // Additional share data
});

export const insertNetworkShareSchema = createInsertSchema(networkShares).pick({
  userId: true,
  shareType: true,
  shareId: true,
  platform: true,
  createdAt: true,
  data: true
});

// Share Click Events (detailed tracking of share engagement)
export const shareClickEvents = pgTable("share_click_events", {
  id: serial("id").primaryKey(),
  shareId: integer("share_id").notNull().references(() => networkShares.id),
  ipHash: varchar("ip_hash", { length: 64 }), // Hashed IP for privacy
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  clickedAt: timestamp("clicked_at").defaultNow(),
  conversionType: varchar("conversion_type", { length: 30 }), // signup, action, view, etc.
  newUserId: integer("new_user_id").references(() => users.id), // If conversion resulted in signup
});

export const insertShareClickEventSchema = createInsertSchema(shareClickEvents).pick({
  shareId: true,
  ipHash: true,
  userAgent: true,
  referrer: true,
  clickedAt: true,
  conversionType: true,
  newUserId: true
});

// Define relations
export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  inviter: one(users, { fields: [userInvitations.inviterId], references: [users.id] })
}));

export const userConnectionsRelations = relations(userConnections, ({ one }) => ({
  user: one(users, { fields: [userConnections.userId], references: [users.id] }),
  connectedUser: one(users, { fields: [userConnections.connectedUserId], references: [users.id] })
}));

export const connectionActivitiesRelations = relations(connectionActivities, ({ one }) => ({
  user: one(users, { fields: [connectionActivities.userId], references: [users.id] }),
  connectedUser: one(users, { fields: [connectionActivities.connectedUserId], references: [users.id] })
}));

export const networkSharesRelations = relations(networkShares, ({ one }) => ({
  user: one(users, { fields: [networkShares.userId], references: [users.id] })
}));

export const shareClickEventsRelations = relations(shareClickEvents, ({ one }) => ({
  share: one(networkShares, { fields: [shareClickEvents.shareId], references: [networkShares.id] }),
  newUser: one(users, { fields: [shareClickEvents.newUserId], references: [users.id] })
}));

// AI Assistant relations
export const aiAssistantsRelations = relations(aiAssistants, ({ one, many }) => ({
  user: one(users, { fields: [aiAssistants.userId], references: [users.id] }),
  conversations: many(aiAssistantConversations)
}));

export const aiAssistantConversationsRelations = relations(aiAssistantConversations, ({ one, many }) => ({
  assistant: one(aiAssistants, { fields: [aiAssistantConversations.assistantId], references: [aiAssistants.id] }),
  messages: many(aiAssistantMessages)
}));

export const aiAssistantMessagesRelations = relations(aiAssistantMessages, ({ one }) => ({
  conversation: one(aiAssistantConversations, { fields: [aiAssistantMessages.conversationId], references: [aiAssistantConversations.id] })
}));

// User Activities relations are imported from schema-user-activity.ts

// Export types
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;

export type UserConnection = typeof userConnections.$inferSelect;
export type InsertUserConnection = z.infer<typeof insertUserConnectionSchema>;

export type ConnectionActivity = typeof connectionActivities.$inferSelect;
export type InsertConnectionActivity = z.infer<typeof insertConnectionActivitySchema>;

export type NetworkShare = typeof networkShares.$inferSelect;
export type InsertNetworkShare = z.infer<typeof insertNetworkShareSchema>;

export type ShareClickEvent = typeof shareClickEvents.$inferSelect;
export type InsertShareClickEvent = z.infer<typeof insertShareClickEventSchema>;

// ---- LEGISLATIVE VERIFICATION SYSTEM ----

// Legislative Update - track specific updates that need verification
export const legislativeUpdates = pgTable("legislative_updates", {
  id: serial("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updateType: text("update_type").notNull(), // 'status_change', 'text_change', 'sponsor_change', 'scheduled_action', etc.
  sourceUrl: text("source_url"),
  sourceType: text("source_type").notNull(), // 'official', 'news', 'community'
  submittedBy: integer("submitted_by").notNull().references(() => users.id),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  verificationStatus: text("verification_status").notNull().default("pending"), // 'pending', 'verified', 'rejected', 'needs_more_sources'
  verificationCount: integer("verification_count").notNull().default(0), // Count of verifications
  verificationThreshold: integer("verification_threshold").notNull().default(3), // Threshold needed for verification
  isProminent: boolean("is_prominent").notNull().default(false), // Flag for prominent/important updates
});

export const insertLegislativeUpdateSchema = createInsertSchema(legislativeUpdates).pick({
  billId: true,
  title: true,
  content: true,
  updateType: true,
  sourceUrl: true,
  sourceType: true,
  submittedBy: true,
  isProminent: true,
  verificationThreshold: true,
});

// Verification - track individual verifications by users
export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  updateId: integer("update_id").notNull().references(() => legislativeUpdates.id),
  userId: integer("user_id").notNull().references(() => users.id),
  verificationStatus: text("verification_status").notNull(), // 'verified', 'rejected', 'needs_more_sources'
  verificationMethod: text("verification_method").notNull(), // 'source_check', 'official_document', 'expert_verification', 'community_consensus'
  verificationNotes: text("verification_notes"),
  additionalSources: jsonb("additional_sources").default([]), // Array of URLs to supporting documents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verifications).pick({
  updateId: true,
  userId: true,
  verificationStatus: true,
  verificationMethod: true,
  verificationNotes: true,
  additionalSources: true,
});

// Verification rules/thresholds - allows for configurable verification rules
export const verificationRules = pgTable("verification_rules", {
  id: serial("id").primaryKey(),
  updateType: text("update_type").notNull().unique(), // 'status_change', 'text_change', etc.
  requiredVerifications: integer("required_verifications").notNull().default(3),
  requiredSuperUserLevel: integer("required_super_user_level").notNull().default(0), // Minimum level of super user required for verification
  weight: integer("weight").notNull().default(1), // Weight of a verification (higher for trusted users)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertVerificationRuleSchema = createInsertSchema(verificationRules).pick({
  updateType: true,
  requiredVerifications: true,
  requiredSuperUserLevel: true,
  weight: true,
  isActive: true,
});

// Verification sources - track trusted sources for verification
export const verificationSources = pgTable("verification_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull(), // 'government', 'news', 'research', 'nonprofit'
  trustLevel: integer("trust_level").notNull().default(5), // 1-10 scale of source reliability
  addedBy: integer("added_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertVerificationSourceSchema = createInsertSchema(verificationSources).pick({
  name: true,
  url: true,
  sourceType: true,
  trustLevel: true,
  addedBy: true,
  isActive: true,
});

// User verification badges/credentials - track user verification expertise
export const userVerificationCredentials = pgTable("user_verification_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  credentialType: text("credential_type").notNull(), // 'legal_expert', 'journalist', 'researcher', 'fact_checker', 'community_verified'
  verificationLevel: integer("verification_level").notNull().default(1), // 1-5 scale, higher means more trusted
  verificationCount: integer("verification_count").notNull().default(0), // Number of verifications contributed
  accuracyRate: integer("accuracy_rate").notNull().default(100), // 0-100 percentage of accurate verifications
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertUserVerificationCredentialSchema = createInsertSchema(userVerificationCredentials).pick({
  userId: true,
  credentialType: true,
  verificationLevel: true,
  verificationCount: true,
  accuracyRate: true,
  isActive: true,
});

// Define relations
export const legislativeUpdatesRelations = relations(legislativeUpdates, ({ one, many }) => ({
  bill: one(bills, { fields: [legislativeUpdates.billId], references: [bills.id] }),
  submitter: one(users, { fields: [legislativeUpdates.submittedBy], references: [users.id] }),
  verifications: many(verifications)
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  update: one(legislativeUpdates, { fields: [verifications.updateId], references: [legislativeUpdates.id] }),
  user: one(users, { fields: [verifications.userId], references: [users.id] })
}));

export const verificationSourcesRelations = relations(verificationSources, ({ one }) => ({
  user: one(users, { fields: [verificationSources.addedBy], references: [users.id] })
}));

export const userVerificationCredentialsRelations = relations(userVerificationCredentials, ({ one }) => ({
  user: one(users, { fields: [userVerificationCredentials.userId], references: [users.id] })
}));

// Export types
export type LegislativeUpdate = typeof legislativeUpdates.$inferSelect;
export type InsertLegislativeUpdate = z.infer<typeof insertLegislativeUpdateSchema>;

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = z.infer<typeof insertVerificationSchema>;

export type VerificationRule = typeof verificationRules.$inferSelect;
export type InsertVerificationRule = z.infer<typeof insertVerificationRuleSchema>;

export type VerificationSource = typeof verificationSources.$inferSelect;
export type InsertVerificationSource = z.infer<typeof insertVerificationSourceSchema>;

export type UserVerificationCredential = typeof userVerificationCredentials.$inferSelect;
export type InsertUserVerificationCredential = z.infer<typeof insertUserVerificationCredentialSchema>;

// ---- PERSONAL IMPACT ASSESSMENTS ----
export const personalImpactAssessments = pgTable("personal_impact_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  billId: text("bill_id").notNull().references(() => bills.id),
  personalImpact: text("personal_impact").notNull(), // AI-generated personalized impact assessment
  familyImpact: text("family_impact"), // AI-generated assessment of impact on family
  communityImpact: text("community_impact"), // AI-generated assessment of impact on community
  userContext: jsonb("user_context").notNull(), // User's demographic and preference data used for generating the assessment
  relevanceScore: integer("relevance_score").notNull().default(50), // 0-100 score of how relevant this bill is to this user
  sentiment: text("sentiment").notNull().default("neutral"), // positive, negative, neutral, mixed
  impactAreas: text("impact_areas").array().notNull().default([]), // Areas of life this bill impacts for this user
  generatedAt: timestamp("generated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPersonalImpactAssessmentSchema = createInsertSchema(personalImpactAssessments).pick({
  userId: true,
  billId: true,
  personalImpact: true,
  familyImpact: true,
  communityImpact: true,
  userContext: true,
  relevanceScore: true,
  sentiment: true,
  impactAreas: true,
});

// ---- PERSONAL IMPACT RELATIONS ----
export const personalImpactAssessmentsRelations = relations(personalImpactAssessments, ({ one }) => ({
  user: one(users, { fields: [personalImpactAssessments.userId], references: [users.id] }),
  bill: one(bills, { fields: [personalImpactAssessments.billId], references: [bills.id] }),
}));

// Export types for Personal Impact Assessments
export type PersonalImpactAssessment = typeof personalImpactAssessments.$inferSelect;
export type InsertPersonalImpactAssessment = z.infer<typeof insertPersonalImpactAssessmentSchema>;

/* Live Stream Segments and Quotes */

// Table to store segments from live committee meeting streams
export const liveStreamSegments = pgTable('live_stream_segments', {
  id: serial('id').primaryKey(),
  committeeMeetingId: integer('committee_meeting_id')
    .notNull()
    .references(() => committeeMeetings.id, { onDelete: 'cascade' }),
  committeeId: integer('committee_id').notNull(),
  description: text('description').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  // Enhanced tagging fields
  billIds: text('bill_ids'), // Comma-separated bill IDs discussed in this segment
  billsDiscussed: text('bills_discussed'), // Text containing bill references for searching
  speakerName: text('speaker_name'), // Name of the current speaker (elected official, witness, etc.)
  speakerRole: text('speaker_role'), // Role: 'elected_official', 'witness', 'resource_witness', etc.
  keyWords: text('key_words').array(), // Key words or topics mentioned in this segment
  startTimestamp: text('start_timestamp'), // Start timestamp in HH:MM:SS format
  endTimestamp: text('end_timestamp'), // End timestamp in HH:MM:SS format
  summary: text('summary'),
  sentimentScore: integer('sentiment_score'), // Sentiment score from -100 to 100
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Table to store notable quotes from live committee meeting streams
export const liveStreamQuotes = pgTable('live_stream_quotes', {
  id: serial('id').primaryKey(),
  committeeMeetingId: integer('committee_meeting_id')
    .notNull()
    .references(() => committeeMeetings.id, { onDelete: 'cascade' }),
  speaker: text('speaker').notNull(),
  quote: text('quote').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  billId: text('bill_id'),
  sentiment: integer('sentiment'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Relations for live stream data
export const liveStreamSegmentsRelations = relations(liveStreamSegments, ({ one }) => ({
  committeeMeeting: one(committeeMeetings, {
    fields: [liveStreamSegments.committeeMeetingId],
    references: [committeeMeetings.id],
  }),
}));

export const liveStreamQuotesRelations = relations(liveStreamQuotes, ({ one }) => ({
  committeeMeeting: one(committeeMeetings, {
    fields: [liveStreamQuotes.committeeMeetingId],
    references: [committeeMeetings.id],
  }),
}));

export type LiveStreamSegment = typeof liveStreamSegments.$inferSelect;
export type InsertLiveStreamSegment = typeof liveStreamSegments.$inferInsert;

export type LiveStreamQuote = typeof liveStreamQuotes.$inferSelect;
export type InsertLiveStreamQuote = typeof liveStreamQuotes.$inferInsert;

export const insertLiveStreamSegmentSchema = createInsertSchema(liveStreamSegments).pick({
  committeeMeetingId: true,
  committeeId: true,
  description: true,
  timestamp: true,
  billIds: true,
  billsDiscussed: true,
  speakerName: true,
  speakerRole: true,
  keyWords: true,
  startTimestamp: true,
  endTimestamp: true,
  summary: true,
  sentimentScore: true,
});

export const insertLiveStreamQuoteSchema = createInsertSchema(liveStreamQuotes).pick({
  committeeMeetingId: true,
  speaker: true,
  quote: true,
  timestamp: true,
  billId: true,
  sentiment: true,
});

// Import schema additions for bill movement notifications and bill history
export * from './schema-additions';

// Import schema additions for policy annotations and civic actions
export * from './schema-features';

// Import schema for sentiment visualization features
export * from './schema-sentiment';

// Import schema for recommendation engine features
export * from './schema-recommendations';

// Import schema for enhanced committee videos and tagged segments
export * from './schema-committee-videos';

// Import schema for shareable infographics generator
export * from './schema-infographics';

// Import schema for legislative impact analysis
export * from './schema-legislative-impact';

// Import schema for collaborative bill editing is managed separately
// Do not export schema-collaborative from here to avoid name conflicts
// Export all collaborative annotations schema entities and types
export * from './schema-collaborative-annotations';

// Community suggestions schema is imported separately to avoid conflicts
// Import from schema-community-suggestions.ts directly in components that need it
