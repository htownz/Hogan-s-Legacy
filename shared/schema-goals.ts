// User goals management schema
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { users, bills, actionCircles } from './schema';

// User advocacy goals table
export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'legislation', 'education', 'community', 'civic_action'
  status: text("status").notNull().default("active"), // 'active', 'completed', 'abandoned'
  progress: real("progress").notNull().default(0), // 0 to 100 percentage
  targetDate: timestamp("target_date"),
  isPrivate: boolean("is_private").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(true),
  metrics: jsonb("metrics").default({}), // For storing custom metrics related to goal
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserGoalSchema = createInsertSchema(userGoals).pick({
  userId: true,
  title: true,
  description: true,
  category: true,
  status: true,
  progress: true,
  targetDate: true,
  isPrivate: true,
  isPublic: true,
  metrics: true,
});

export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = typeof userGoals.$inferInsert;

export const userGoalsRelations = relations(userGoals, ({ one, many }) => ({
  user: one(users, {
    fields: [userGoals.userId],
    references: [users.id],
  }),
  milestones: many(goalMilestones),
  relatedBills: many(goalBills),
  teamGoals: many(teamGoals)
}));

// Goal milestones table - for breaking down goals into steps
export const goalMilestones = pgTable("goal_milestones", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => userGoals.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  order: integer("order").notNull().default(0), // For ordering milestones
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGoalMilestoneSchema = createInsertSchema(goalMilestones).pick({
  goalId: true,
  title: true,
  description: true,
  status: true,
  dueDate: true,
  completedDate: true,
  order: true,
});

export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type InsertGoalMilestone = typeof goalMilestones.$inferInsert;

export const goalMilestonesRelations = relations(goalMilestones, ({ one }) => ({
  goal: one(userGoals, {
    fields: [goalMilestones.goalId],
    references: [userGoals.id],
  }),
}));

// Related bills for goals
export const goalBills = pgTable("goal_bills", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => userGoals.id, { onDelete: 'cascade' }),
  billId: text("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  relationshipType: text("relationship_type").notNull().default("tracking"), // 'tracking', 'supporting', 'opposing', 'monitoring'
  importance: integer("importance").notNull().default(1), // 1-5 scale of importance to the goal
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoalBillSchema = createInsertSchema(goalBills).pick({
  goalId: true,
  billId: true,
  relationshipType: true,
  importance: true,
  notes: true,
});

export type GoalBill = typeof goalBills.$inferSelect;
export type InsertGoalBill = typeof goalBills.$inferInsert;

export const goalBillsRelations = relations(goalBills, ({ one }) => ({
  goal: one(userGoals, {
    fields: [goalBills.goalId],
    references: [userGoals.id],
  }),
  bill: one(bills, {
    fields: [goalBills.billId],
    references: [bills.id],
  }),
}));

// Team goals for collaborative work - links to Action Circles
export const teamGoals = pgTable("team_goals", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull().references(() => actionCircles.id, { onDelete: 'cascade' }),
  parentGoalId: integer("parent_goal_id").references(() => userGoals.id), // Optional reference to personal goal
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'legislation', 'education', 'lobbying', 'outreach'
  status: text("status").notNull().default("active"), // 'active', 'completed', 'abandoned'
  progress: real("progress").notNull().default(0), // 0 to 100 percentage
  targetDate: timestamp("target_date"),
  metrics: jsonb("metrics").default({}),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTeamGoalSchema = createInsertSchema(teamGoals).pick({
  circleId: true,
  parentGoalId: true,
  title: true,
  description: true,
  category: true,
  status: true,
  progress: true,
  targetDate: true,
  metrics: true,
  createdById: true,
});

export type TeamGoal = typeof teamGoals.$inferSelect;
export type InsertTeamGoal = typeof teamGoals.$inferInsert;

export const teamGoalsRelations = relations(teamGoals, ({ one, many }) => ({
  circle: one(actionCircles, {
    fields: [teamGoals.circleId],
    references: [actionCircles.id],
  }),
  parentGoal: one(userGoals, {
    fields: [teamGoals.parentGoalId],
    references: [userGoals.id],
  }),
  creator: one(users, {
    fields: [teamGoals.createdById],
    references: [users.id],
  }),
  milestones: many(teamGoalMilestones),
  assignments: many(teamGoalAssignments),
}));

// Team goal milestones
export const teamGoalMilestones = pgTable("team_goal_milestones", {
  id: serial("id").primaryKey(),
  teamGoalId: integer("team_goal_id").notNull().references(() => teamGoals.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTeamGoalMilestoneSchema = createInsertSchema(teamGoalMilestones).pick({
  teamGoalId: true,
  title: true,
  description: true,
  status: true,
  dueDate: true,
  completedDate: true,
  order: true,
});

export type TeamGoalMilestone = typeof teamGoalMilestones.$inferSelect;
export type InsertTeamGoalMilestone = typeof teamGoalMilestones.$inferInsert;

export const teamGoalMilestonesRelations = relations(teamGoalMilestones, ({ one }) => ({
  teamGoal: one(teamGoals, {
    fields: [teamGoalMilestones.teamGoalId],
    references: [teamGoals.id],
  }),
}));

// Team goal assignments - for individuals within the circle
export const teamGoalAssignments = pgTable("team_goal_assignments", {
  id: serial("id").primaryKey(),
  teamGoalId: integer("team_goal_id").notNull().references(() => teamGoals.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text("role").notNull().default("contributor"), // 'contributor', 'lead', 'coordinator'
  status: text("status").notNull().default("assigned"), // 'assigned', 'in_progress', 'completed', 'blocked'
  notes: text("notes"),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertTeamGoalAssignmentSchema = createInsertSchema(teamGoalAssignments).pick({
  teamGoalId: true,
  userId: true,
  role: true,
  status: true,
  notes: true,
  completedAt: true,
});

export type TeamGoalAssignment = typeof teamGoalAssignments.$inferSelect;
export type InsertTeamGoalAssignment = typeof teamGoalAssignments.$inferInsert;

export const teamGoalAssignmentsRelations = relations(teamGoalAssignments, ({ one }) => ({
  teamGoal: one(teamGoals, {
    fields: [teamGoalAssignments.teamGoalId],
    references: [teamGoals.id],
  }),
  user: one(users, {
    fields: [teamGoalAssignments.userId],
    references: [users.id],
  }),
}));

// Lobbying activity records - for tracking lobbying efforts
export const lobbyingActivities = pgTable("lobbying_activities", {
  id: serial("id").primaryKey(),
  teamGoalId: integer("team_goal_id").references(() => teamGoals.id),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // 'meeting', 'phone_call', 'email', 'presentation', 'testimony'
  targetName: text("target_name").notNull(), // Name of legislator/official contacted
  targetPosition: text("target_position"), // Position/title of the person
  billId: text("bill_id").references(() => bills.id), // Optional bill reference
  description: text("description").notNull(),
  outcome: text("outcome"), // Results of the activity
  followUpNeeded: boolean("follow_up_needed").notNull().default(false),
  followUpNotes: text("follow_up_notes"),
  followUpDate: timestamp("follow_up_date"),
  activityDate: timestamp("activity_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLobbyingActivitySchema = createInsertSchema(lobbyingActivities).pick({
  teamGoalId: true,
  userId: true,
  activityType: true,
  targetName: true,
  targetPosition: true,
  billId: true,
  description: true,
  outcome: true,
  followUpNeeded: true,
  followUpNotes: true,
  followUpDate: true,
  activityDate: true,
});

export type LobbyingActivity = typeof lobbyingActivities.$inferSelect;
export type InsertLobbyingActivity = typeof lobbyingActivities.$inferInsert;

export const lobbyingActivitiesRelations = relations(lobbyingActivities, ({ one }) => ({
  teamGoal: one(teamGoals, {
    fields: [lobbyingActivities.teamGoalId],
    references: [teamGoals.id],
  }),
  user: one(users, {
    fields: [lobbyingActivities.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [lobbyingActivities.billId],
    references: [bills.id],
  }),
}));