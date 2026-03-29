import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("policy_intel_source_type", [
  "federal_legislation",
  "federal_regulation",
  "federal_lobbying",
  "federal_nonprofit",
  "texas_legislation",
  "texas_regulation",
  "texas_ethics",
  "texas_local",
  "manual",
]);

export const alertStatusEnum = pgEnum("policy_intel_alert_status", [
  "pending_review",
  "ready",
  "sent",
  "suppressed",
]);

export const briefStatusEnum = pgEnum("policy_intel_brief_status", [
  "draft",
  "review",
  "published",
]);

export const deliverableTypeEnum = pgEnum("policy_intel_deliverable_type", [
  "issue_brief",
  "hearing_memo",
  "client_alert",
  "weekly_digest",
]);

export const matterStatusEnum = pgEnum("policy_intel_matter_status", [
  "active",
  "watching",
  "closed",
  "archived",
]);

export const activityTypeEnum = pgEnum("policy_intel_activity_type", [
  "alert_received",
  "brief_drafted",
  "note_added",
  "task_assigned",
  "status_changed",
  "document_linked",
  "review_completed",
]);

export const issueRoomStatusEnum = pgEnum("policy_intel_issue_room_status", [
  "active",
  "watching",
  "resolved",
  "archived",
]);

export const issueRoomRelationshipTypeEnum = pgEnum("policy_intel_issue_room_relationship_type", [
  "primary_authority",
  "background",
  "opposition_signal",
  "funding_context",
  "stakeholder_signal",
  "timeline_event",
]);

export const issueRoomUpdateTypeEnum = pgEnum("policy_intel_issue_room_update_type", [
  "analysis",
  "status",
  "political",
  "legal",
  "funding",
  "meeting_note",
]);

export const issueRoomTaskStatusEnum = pgEnum("policy_intel_issue_room_task_status", [
  "todo",
  "in_progress",
  "blocked",
  "done",
]);

export const issueRoomTaskPriorityEnum = pgEnum("policy_intel_issue_room_task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const workspaces = pgTable("policy_intel_workspaces", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  jurisdictionScope: varchar("jurisdiction_scope", { length: 64 })
    .notNull()
    .default("us_federal_texas"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const watchlists = pgTable(
  "policy_intel_watchlists",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    topic: varchar("topic", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    rulesJson: jsonb("rules_json").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceActiveIdx: index("policy_intel_watchlists_workspace_active_idx").on(
      table.workspaceId,
      table.isActive,
    ),
    workspaceNameUnique: uniqueIndex("policy_intel_watchlists_workspace_name_idx").on(
      table.workspaceId,
      table.name,
    ),
  }),
);

export const sourceDocuments = pgTable(
  "policy_intel_source_documents",
  {
    id: serial("id").primaryKey(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    publisher: varchar("publisher", { length: 255 }).notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: varchar("external_id", { length: 255 }),
    title: text("title").notNull(),
    summary: text("summary"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    checksum: varchar("checksum", { length: 128 }),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull().default({}),
    normalizedText: text("normalized_text"),
    tagsJson: jsonb("tags_json").$type<string[]>().notNull().default([]),
  },
  (table) => ({
    checksumUniqueIdx: uniqueIndex("policy_intel_source_documents_checksum_idx").on(table.checksum),
    externalIdIdx: index("policy_intel_source_documents_external_id_idx").on(table.externalId),
    sourceTypePublishedIdx: index("policy_intel_source_documents_source_type_published_idx").on(
      table.sourceType,
      table.publishedAt,
    ),
  }),
);

export const alerts = pgTable(
  "policy_intel_alerts",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    watchlistId: integer("watchlist_id").references(() => watchlists.id, { onDelete: "set null" }),
    sourceDocumentId: integer("source_document_id").references(() => sourceDocuments.id, { onDelete: "set null" }),
    issueRoomId: integer("issue_room_id"),
    title: text("title").notNull(),
    summary: text("summary"),
    whyItMatters: text("why_it_matters"),
    status: alertStatusEnum("status").notNull().default("pending_review"),
    relevanceScore: integer("relevance_score").notNull().default(0),
    confidenceScore: integer("confidence_score").notNull().default(0),
    reasonsJson: jsonb("reasons_json").$type<Record<string, unknown>[]>().notNull().default([]),
    reviewerNote: text("reviewer_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => ({
    sourceWatchlistUniqueIdx: uniqueIndex("policy_intel_alerts_source_watchlist_idx").on(
      table.sourceDocumentId,
      table.watchlistId,
    ),
    cooldownLookupIdx: index("policy_intel_alerts_watchlist_workspace_title_created_idx").on(
      table.watchlistId,
      table.workspaceId,
      table.title,
      table.createdAt,
    ),
    statusCreatedIdx: index("policy_intel_alerts_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
  }),
);

export const briefs = pgTable("policy_intel_briefs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  watchlistId: integer("watchlist_id").references(() => watchlists.id, { onDelete: "set null" }),
  issueRoomId: integer("issue_room_id"),
  title: text("title").notNull(),
  status: briefStatusEnum("status").notNull().default("draft"),
  briefText: text("brief_text"),
  sourcePackJson: jsonb("source_pack_json").$type<Record<string, unknown>[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const monitoringJobs = pgTable("policy_intel_monitoring_jobs", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  jobType: varchar("job_type", { length: 128 }).notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  schedule: varchar("schedule", { length: 64 }).notNull().default("manual"),
  enabled: boolean("enabled").notNull().default(true),
  configJson: jsonb("config_json").$type<Record<string, unknown>>().notNull().default({}),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Phase 3: Matters + Activities ───────────────────────────────────────────

export const matters = pgTable("policy_intel_matters", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 150 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  clientName: varchar("client_name", { length: 255 }),
  practiceArea: varchar("practice_area", { length: 128 }),
  jurisdictionScope: varchar("jurisdiction_scope", { length: 64 }).notNull().default("texas"),
  status: matterStatusEnum("status").notNull().default("active"),
  ownerUserId: integer("owner_user_id"),
  description: text("description"),
  tagsJson: jsonb("tags_json").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const matterWatchlists = pgTable(
  "policy_intel_matter_watchlists",
  {
    id: serial("id").primaryKey(),
    matterId: integer("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
    watchlistId: integer("watchlist_id").notNull().references(() => watchlists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    matterWatchlistUnique: uniqueIndex("policy_intel_matter_watchlists_unique_idx").on(
      table.matterId,
      table.watchlistId,
    ),
  }),
);

export const issueRooms = pgTable(
  "policy_intel_issue_rooms",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
    slug: varchar("slug", { length: 150 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    issueType: varchar("issue_type", { length: 128 }),
    jurisdiction: varchar("jurisdiction", { length: 64 }).notNull().default("texas"),
    status: issueRoomStatusEnum("status").notNull().default("active"),
    summary: text("summary"),
    recommendedPath: text("recommended_path"),
    ownerUserId: integer("owner_user_id"),
    relatedBillIds: jsonb("related_bill_ids").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceSlugUnique: uniqueIndex("policy_intel_issue_rooms_workspace_slug_idx").on(
      table.workspaceId,
      table.slug,
    ),
  }),
);

export const issueRoomSourceDocuments = pgTable(
  "policy_intel_issue_room_source_documents",
  {
    id: serial("id").primaryKey(),
    issueRoomId: integer("issue_room_id").notNull().references(() => issueRooms.id, { onDelete: "cascade" }),
    sourceDocumentId: integer("source_document_id").notNull().references(() => sourceDocuments.id, { onDelete: "cascade" }),
    relationshipType: issueRoomRelationshipTypeEnum("relationship_type").notNull().default("background"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    issueRoomSourceUnique: uniqueIndex("policy_intel_issue_room_source_documents_unique_idx").on(
      table.issueRoomId,
      table.sourceDocumentId,
    ),
  }),
);

export const issueRoomUpdates = pgTable("policy_intel_issue_room_updates", {
  id: serial("id").primaryKey(),
  issueRoomId: integer("issue_room_id").notNull().references(() => issueRooms.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  updateType: issueRoomUpdateTypeEnum("update_type").notNull().default("analysis"),
  sourcePackJson: jsonb("source_pack_json").$type<Record<string, unknown>[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const issueRoomStrategyOptions = pgTable("policy_intel_issue_room_strategy_options", {
  id: serial("id").primaryKey(),
  issueRoomId: integer("issue_room_id").notNull().references(() => issueRooms.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  prosJson: jsonb("pros_json").$type<string[]>().notNull().default([]),
  consJson: jsonb("cons_json").$type<string[]>().notNull().default([]),
  politicalFeasibility: varchar("political_feasibility", { length: 32 }).default("unknown"),
  legalDurability: varchar("legal_durability", { length: 32 }).default("unknown"),
  implementationComplexity: varchar("implementation_complexity", { length: 32 }).default("unknown"),
  recommendationRank: integer("recommendation_rank").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const issueRoomTasks = pgTable("policy_intel_issue_room_tasks", {
  id: serial("id").primaryKey(),
  issueRoomId: integer("issue_room_id").notNull().references(() => issueRooms.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: issueRoomTaskStatusEnum("status").notNull().default("todo"),
  priority: issueRoomTaskPriorityEnum("priority").notNull().default("medium"),
  assignee: varchar("assignee", { length: 255 }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activities = pgTable("policy_intel_activities", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  matterId: integer("matter_id").references(() => matters.id, { onDelete: "cascade" }),
  issueRoomId: integer("issue_room_id").references(() => issueRooms.id, { onDelete: "cascade" }),
  alertId: integer("alert_id").references(() => alerts.id, { onDelete: "set null" }),
  type: activityTypeEnum("type").notNull(),
  ownerUserId: integer("owner_user_id"),
  summary: text("summary").notNull(),
  detailText: text("detail_text"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Phase 4: Deliverables ───────────────────────────────────────────────────

export const deliverables = pgTable("policy_intel_deliverables", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  briefId: integer("brief_id").references(() => briefs.id, { onDelete: "set null" }),
  matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
  type: deliverableTypeEnum("type").notNull().default("issue_brief"),
  title: text("title").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  sourceDocumentIds: jsonb("source_document_ids").$type<number[]>().notNull().default([]),
  citationsJson: jsonb("citations_json").$type<Record<string, unknown>[]>().notNull().default([]),
  generatedBy: varchar("generated_by", { length: 64 }).notNull().default("template"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Phase 5: Stakeholders ───────────────────────────────────────────────────

export const stakeholderTypeEnum = pgEnum("policy_intel_stakeholder_type", [
  "legislator",
  "lobbyist",
  "agency_official",
  "pac",
  "organization",
  "individual",
]);

export const stakeholders = pgTable("policy_intel_stakeholders", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  issueRoomId: integer("issue_room_id").references(() => issueRooms.id, { onDelete: "set null" }),
  type: stakeholderTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  organization: varchar("organization", { length: 255 }),
  jurisdiction: varchar("jurisdiction", { length: 64 }),
  tagsJson: jsonb("tags_json").$type<string[]>().notNull().default([]),
  sourceSummary: text("source_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stakeholderObservations = pgTable("policy_intel_stakeholder_observations", {
  id: serial("id").primaryKey(),
  stakeholderId: integer("stakeholder_id").notNull().references(() => stakeholders.id, { onDelete: "cascade" }),
  sourceDocumentId: integer("source_document_id").references(() => sourceDocuments.id, { onDelete: "set null" }),
  matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
  observationText: text("observation_text").notNull(),
  confidence: varchar("confidence", { length: 32 }).notNull().default("medium"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PolicyIntelWorkspace = typeof workspaces.$inferSelect;
export type InsertPolicyIntelWorkspace = typeof workspaces.$inferInsert;
export type PolicyIntelWatchlist = typeof watchlists.$inferSelect;
export type InsertPolicyIntelWatchlist = typeof watchlists.$inferInsert;
export type PolicyIntelSourceDocument = typeof sourceDocuments.$inferSelect;
export type InsertPolicyIntelSourceDocument = typeof sourceDocuments.$inferInsert;
export type PolicyIntelAlert = typeof alerts.$inferSelect;
export type InsertPolicyIntelAlert = typeof alerts.$inferInsert;
export type PolicyIntelBrief = typeof briefs.$inferSelect;
export type InsertPolicyIntelBrief = typeof briefs.$inferInsert;
export type PolicyIntelMonitoringJob = typeof monitoringJobs.$inferSelect;
export type InsertPolicyIntelMonitoringJob = typeof monitoringJobs.$inferInsert;
export type PolicyIntelMatter = typeof matters.$inferSelect;
export type InsertPolicyIntelMatter = typeof matters.$inferInsert;
export type PolicyIntelMatterWatchlist = typeof matterWatchlists.$inferSelect;
export type InsertPolicyIntelMatterWatchlist = typeof matterWatchlists.$inferInsert;
export type PolicyIntelIssueRoom = typeof issueRooms.$inferSelect;
export type InsertPolicyIntelIssueRoom = typeof issueRooms.$inferInsert;
export type PolicyIntelIssueRoomSourceDocument = typeof issueRoomSourceDocuments.$inferSelect;
export type InsertPolicyIntelIssueRoomSourceDocument = typeof issueRoomSourceDocuments.$inferInsert;
export type PolicyIntelIssueRoomUpdate = typeof issueRoomUpdates.$inferSelect;
export type InsertPolicyIntelIssueRoomUpdate = typeof issueRoomUpdates.$inferInsert;
export type PolicyIntelIssueRoomStrategyOption = typeof issueRoomStrategyOptions.$inferSelect;
export type InsertPolicyIntelIssueRoomStrategyOption = typeof issueRoomStrategyOptions.$inferInsert;
export type PolicyIntelIssueRoomTask = typeof issueRoomTasks.$inferSelect;
export type InsertPolicyIntelIssueRoomTask = typeof issueRoomTasks.$inferInsert;
export type PolicyIntelActivity = typeof activities.$inferSelect;
export type InsertPolicyIntelActivity = typeof activities.$inferInsert;
export type PolicyIntelDeliverable = typeof deliverables.$inferSelect;
export type InsertPolicyIntelDeliverable = typeof deliverables.$inferInsert;
export type PolicyIntelStakeholder = typeof stakeholders.$inferSelect;
export type InsertPolicyIntelStakeholder = typeof stakeholders.$inferInsert;
export type PolicyIntelStakeholderObservation = typeof stakeholderObservations.$inferSelect;
export type InsertPolicyIntelStakeholderObservation = typeof stakeholderObservations.$inferInsert;
