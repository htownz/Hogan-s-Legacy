var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema-policy-intel.ts
var schema_policy_intel_exports = {};
__export(schema_policy_intel_exports, {
  activities: () => activities,
  activityTypeEnum: () => activityTypeEnum,
  alertStatusEnum: () => alertStatusEnum,
  alerts: () => alerts,
  anomalyHistory: () => anomalyHistory,
  billOutcomeEnum: () => billOutcomeEnum,
  billOutcomeSnapshots: () => billOutcomeSnapshots,
  briefStatusEnum: () => briefStatusEnum,
  briefs: () => briefs,
  championSnapshots: () => championSnapshots,
  clientActionStatusEnum: () => clientActionStatusEnum,
  clientActionTypeEnum: () => clientActionTypeEnum,
  clientActions: () => clientActions,
  clientProfiles: () => clientProfiles,
  committeeIntelAutoIngestStatusEnum: () => committeeIntelAutoIngestStatusEnum,
  committeeIntelEntityTypeEnum: () => committeeIntelEntityTypeEnum,
  committeeIntelPositionEnum: () => committeeIntelPositionEnum,
  committeeIntelSegments: () => committeeIntelSegments,
  committeeIntelSessionStatusEnum: () => committeeIntelSessionStatusEnum,
  committeeIntelSessions: () => committeeIntelSessions,
  committeeIntelSignals: () => committeeIntelSignals,
  committeeIntelSpeakerRoleEnum: () => committeeIntelSpeakerRoleEnum,
  committeeIntelTranscriptSourceTypeEnum: () => committeeIntelTranscriptSourceTypeEnum,
  committeeMembers: () => committeeMembers,
  committeeRoleEnum: () => committeeRoleEnum,
  deliverableTypeEnum: () => deliverableTypeEnum,
  deliverables: () => deliverables,
  feedbackLog: () => feedbackLog,
  feedbackOutcomeEnum: () => feedbackOutcomeEnum,
  forecastSnapshots: () => forecastSnapshots,
  hearingEvents: () => hearingEvents,
  hearingStatusEnum: () => hearingStatusEnum,
  issueRoomRelationshipTypeEnum: () => issueRoomRelationshipTypeEnum,
  issueRoomSourceDocuments: () => issueRoomSourceDocuments,
  issueRoomStatusEnum: () => issueRoomStatusEnum,
  issueRoomStrategyOptions: () => issueRoomStrategyOptions,
  issueRoomTaskPriorityEnum: () => issueRoomTaskPriorityEnum,
  issueRoomTaskStatusEnum: () => issueRoomTaskStatusEnum,
  issueRoomTasks: () => issueRoomTasks,
  issueRoomUpdateTypeEnum: () => issueRoomUpdateTypeEnum,
  issueRoomUpdates: () => issueRoomUpdates,
  issueRooms: () => issueRooms,
  learningMetrics: () => learningMetrics,
  legislativeSessions: () => legislativeSessions,
  matterStatusEnum: () => matterStatusEnum,
  matterWatchlists: () => matterWatchlists,
  matters: () => matters,
  meetingNotes: () => meetingNotes,
  monitoringJobs: () => monitoringJobs,
  passagePredictionEnum: () => passagePredictionEnum,
  passagePredictions: () => passagePredictions,
  relationshipTypeEnum: () => relationshipTypeEnum,
  relationships: () => relationships,
  replayChunkStatusEnum: () => replayChunkStatusEnum,
  replayChunks: () => replayChunks,
  replayRunStatusEnum: () => replayRunStatusEnum,
  replayRuns: () => replayRuns,
  reportTemplates: () => reportTemplates,
  schedulerRuns: () => schedulerRuns,
  sessionMilestoneStatusEnum: () => sessionMilestoneStatusEnum,
  sessionMilestones: () => sessionMilestones,
  sessionPhaseEnum: () => sessionPhaseEnum,
  sourceDocuments: () => sourceDocuments,
  sourceTypeEnum: () => sourceTypeEnum,
  stakeholderObservations: () => stakeholderObservations,
  stakeholderTypeEnum: () => stakeholderTypeEnum,
  stakeholders: () => stakeholders,
  velocitySnapshots: () => velocitySnapshots,
  watchlists: () => watchlists,
  workspaces: () => workspaces
});
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from "drizzle-orm/pg-core";
var sourceTypeEnum, alertStatusEnum, briefStatusEnum, deliverableTypeEnum, matterStatusEnum, activityTypeEnum, issueRoomStatusEnum, issueRoomRelationshipTypeEnum, issueRoomUpdateTypeEnum, issueRoomTaskStatusEnum, issueRoomTaskPriorityEnum, workspaces, watchlists, sourceDocuments, alerts, briefs, monitoringJobs, replayRunStatusEnum, replayChunkStatusEnum, replayRuns, replayChunks, matters, matterWatchlists, issueRooms, issueRoomSourceDocuments, issueRoomUpdates, issueRoomStrategyOptions, issueRoomTasks, activities, deliverables, stakeholderTypeEnum, stakeholders, stakeholderObservations, hearingStatusEnum, committeeIntelSessionStatusEnum, committeeIntelSpeakerRoleEnum, committeeIntelPositionEnum, committeeIntelEntityTypeEnum, committeeIntelTranscriptSourceTypeEnum, committeeIntelAutoIngestStatusEnum, hearingEvents, committeeRoleEnum, committeeMembers, meetingNotes, committeeIntelSessions, committeeIntelSegments, committeeIntelSignals, feedbackOutcomeEnum, feedbackLog, championSnapshots, forecastSnapshots, billOutcomeEnum, billOutcomeSnapshots, anomalyHistory, velocitySnapshots, learningMetrics, schedulerRuns, clientProfiles, passagePredictionEnum, passagePredictions, relationshipTypeEnum, relationships, sessionPhaseEnum, sessionMilestoneStatusEnum, legislativeSessions, sessionMilestones, reportTemplates, clientActionStatusEnum, clientActionTypeEnum, clientActions;
var init_schema_policy_intel = __esm({
  "shared/schema-policy-intel.ts"() {
    "use strict";
    sourceTypeEnum = pgEnum("policy_intel_source_type", [
      "federal_legislation",
      "federal_regulation",
      "federal_lobbying",
      "federal_nonprofit",
      "texas_legislation",
      "texas_regulation",
      "texas_ethics",
      "texas_local",
      "manual"
    ]);
    alertStatusEnum = pgEnum("policy_intel_alert_status", [
      "pending_review",
      "ready",
      "sent",
      "suppressed"
    ]);
    briefStatusEnum = pgEnum("policy_intel_brief_status", [
      "draft",
      "review",
      "published"
    ]);
    deliverableTypeEnum = pgEnum("policy_intel_deliverable_type", [
      "issue_brief",
      "hearing_memo",
      "client_alert",
      "weekly_digest"
    ]);
    matterStatusEnum = pgEnum("policy_intel_matter_status", [
      "active",
      "watching",
      "closed",
      "archived"
    ]);
    activityTypeEnum = pgEnum("policy_intel_activity_type", [
      "alert_received",
      "brief_drafted",
      "note_added",
      "task_assigned",
      "status_changed",
      "document_linked",
      "review_completed"
    ]);
    issueRoomStatusEnum = pgEnum("policy_intel_issue_room_status", [
      "active",
      "watching",
      "resolved",
      "archived"
    ]);
    issueRoomRelationshipTypeEnum = pgEnum("policy_intel_issue_room_relationship_type", [
      "primary_authority",
      "background",
      "opposition_signal",
      "funding_context",
      "stakeholder_signal",
      "timeline_event"
    ]);
    issueRoomUpdateTypeEnum = pgEnum("policy_intel_issue_room_update_type", [
      "analysis",
      "status",
      "political",
      "legal",
      "funding",
      "meeting_note"
    ]);
    issueRoomTaskStatusEnum = pgEnum("policy_intel_issue_room_task_status", [
      "todo",
      "in_progress",
      "blocked",
      "done"
    ]);
    issueRoomTaskPriorityEnum = pgEnum("policy_intel_issue_room_task_priority", [
      "low",
      "medium",
      "high",
      "critical"
    ]);
    workspaces = pgTable("policy_intel_workspaces", {
      id: serial("id").primaryKey(),
      slug: varchar("slug", { length: 100 }).notNull().unique(),
      name: varchar("name", { length: 255 }).notNull(),
      jurisdictionScope: varchar("jurisdiction_scope", { length: 64 }).notNull().default("us_federal_texas"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    });
    watchlists = pgTable(
      "policy_intel_watchlists",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        topic: varchar("topic", { length: 255 }),
        isActive: boolean("is_active").notNull().default(true),
        rulesJson: jsonb("rules_json").$type().notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceActiveIdx: index("policy_intel_watchlists_workspace_active_idx").on(
          table.workspaceId,
          table.isActive
        ),
        workspaceNameUnique: uniqueIndex("policy_intel_watchlists_workspace_name_idx").on(
          table.workspaceId,
          table.name
        )
      })
    );
    sourceDocuments = pgTable(
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
        rawPayload: jsonb("raw_payload").$type().notNull().default({}),
        normalizedText: text("normalized_text"),
        tagsJson: jsonb("tags_json").$type().notNull().default([])
      },
      (table) => ({
        checksumUniqueIdx: uniqueIndex("policy_intel_source_documents_checksum_idx").on(table.checksum),
        externalIdIdx: index("policy_intel_source_documents_external_id_idx").on(table.externalId),
        sourceTypePublishedIdx: index("policy_intel_source_documents_source_type_published_idx").on(
          table.sourceType,
          table.publishedAt
        )
      })
    );
    alerts = pgTable(
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
        reasonsJson: jsonb("reasons_json").$type().notNull().default([]),
        reviewerNote: text("reviewer_note"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      },
      (table) => ({
        sourceWatchlistUniqueIdx: uniqueIndex("policy_intel_alerts_source_watchlist_idx").on(
          table.sourceDocumentId,
          table.watchlistId
        ),
        issueRoomIdx: index("policy_intel_alerts_issue_room_idx").on(table.issueRoomId),
        sourceDocumentIdx: index("policy_intel_alerts_source_document_idx").on(table.sourceDocumentId),
        cooldownLookupIdx: index("policy_intel_alerts_watchlist_workspace_title_created_idx").on(
          table.watchlistId,
          table.workspaceId,
          table.title,
          table.createdAt
        ),
        statusCreatedIdx: index("policy_intel_alerts_status_created_idx").on(
          table.status,
          table.createdAt
        )
      })
    );
    briefs = pgTable("policy_intel_briefs", {
      id: serial("id").primaryKey(),
      workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      watchlistId: integer("watchlist_id").references(() => watchlists.id, { onDelete: "set null" }),
      issueRoomId: integer("issue_room_id"),
      title: text("title").notNull(),
      status: briefStatusEnum("status").notNull().default("draft"),
      briefText: text("brief_text"),
      sourcePackJson: jsonb("source_pack_json").$type().notNull().default([]),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    });
    monitoringJobs = pgTable("policy_intel_monitoring_jobs", {
      id: serial("id").primaryKey(),
      workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
      jobType: varchar("job_type", { length: 128 }).notNull(),
      sourceType: sourceTypeEnum("source_type").notNull(),
      schedule: varchar("schedule", { length: 64 }).notNull().default("manual"),
      enabled: boolean("enabled").notNull().default(true),
      configJson: jsonb("config_json").$type().notNull().default({}),
      lastRunAt: timestamp("last_run_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
    });
    replayRunStatusEnum = pgEnum("policy_intel_replay_run_status", [
      "planned",
      "running",
      "paused",
      "completed",
      "failed"
    ]);
    replayChunkStatusEnum = pgEnum("policy_intel_replay_chunk_status", [
      "pending",
      "running",
      "success",
      "error",
      "skipped"
    ]);
    replayRuns = pgTable(
      "policy_intel_replay_runs",
      {
        id: serial("id").primaryKey(),
        source: varchar("source", { length: 64 }).notNull().default("legiscan"),
        sessionId: integer("session_id").notNull(),
        mode: varchar("mode", { length: 16 }).notNull().default("full"),
        orderBy: varchar("order_by", { length: 32 }).notNull().default("bill_id_asc"),
        chunkSize: integer("chunk_size").notNull().default(250),
        nextOffset: integer("next_offset").notNull().default(0),
        totalCandidates: integer("total_candidates"),
        processedCandidates: integer("processed_candidates").notNull().default(0),
        status: replayRunStatusEnum("status").notNull().default("planned"),
        requestedBy: varchar("requested_by", { length: 255 }),
        optionsJson: jsonb("options_json").$type().notNull().default({}),
        lastError: text("last_error"),
        startedAt: timestamp("started_at", { withTimezone: true }),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        statusCreatedIdx: index("policy_intel_replay_runs_status_created_idx").on(table.status, table.createdAt),
        sourceSessionIdx: index("policy_intel_replay_runs_source_session_idx").on(table.source, table.sessionId)
      })
    );
    replayChunks = pgTable(
      "policy_intel_replay_chunks",
      {
        id: serial("id").primaryKey(),
        replayRunId: integer("replay_run_id").notNull().references(() => replayRuns.id, { onDelete: "cascade" }),
        chunkIndex: integer("chunk_index").notNull(),
        offset: integer("offset").notNull(),
        limit: integer("limit").notNull(),
        status: replayChunkStatusEnum("status").notNull().default("pending"),
        startedAt: timestamp("started_at", { withTimezone: true }),
        finishedAt: timestamp("finished_at", { withTimezone: true }),
        fetched: integer("fetched").notNull().default(0),
        inserted: integer("inserted").notNull().default(0),
        skipped: integer("skipped").notNull().default(0),
        alertsCreated: integer("alerts_created").notNull().default(0),
        fetchErrors: integer("fetch_errors").notNull().default(0),
        upsertErrors: integer("upsert_errors").notNull().default(0),
        error: text("error"),
        resultJson: jsonb("result_json").$type().notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        runChunkUnique: uniqueIndex("policy_intel_replay_chunks_run_chunk_idx").on(table.replayRunId, table.chunkIndex),
        runCreatedIdx: index("policy_intel_replay_chunks_run_created_idx").on(table.replayRunId, table.createdAt)
      })
    );
    matters = pgTable("policy_intel_matters", {
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
      tagsJson: jsonb("tags_json").$type().notNull().default([]),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    });
    matterWatchlists = pgTable(
      "policy_intel_matter_watchlists",
      {
        id: serial("id").primaryKey(),
        matterId: integer("matter_id").notNull().references(() => matters.id, { onDelete: "cascade" }),
        watchlistId: integer("watchlist_id").notNull().references(() => watchlists.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        matterWatchlistUnique: uniqueIndex("policy_intel_matter_watchlists_unique_idx").on(
          table.matterId,
          table.watchlistId
        )
      })
    );
    issueRooms = pgTable(
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
        relatedBillIds: jsonb("related_bill_ids").$type().notNull().default([]),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceSlugUnique: uniqueIndex("policy_intel_issue_rooms_workspace_slug_idx").on(
          table.workspaceId,
          table.slug
        )
      })
    );
    issueRoomSourceDocuments = pgTable(
      "policy_intel_issue_room_source_documents",
      {
        id: serial("id").primaryKey(),
        issueRoomId: integer("issue_room_id").notNull().references(() => issueRooms.id, { onDelete: "cascade" }),
        sourceDocumentId: integer("source_document_id").notNull().references(() => sourceDocuments.id, { onDelete: "cascade" }),
        relationshipType: issueRoomRelationshipTypeEnum("relationship_type").notNull().default("background"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        issueRoomSourceUnique: uniqueIndex("policy_intel_issue_room_source_documents_unique_idx").on(
          table.issueRoomId,
          table.sourceDocumentId
        )
      })
    );
    issueRoomUpdates = pgTable("policy_intel_issue_room_updates", {
      id: serial("id").primaryKey(),
      issueRoomId: integer("issue_room_id").notNull().references(() => issueRooms.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 255 }).notNull(),
      body: text("body").notNull(),
      updateType: issueRoomUpdateTypeEnum("update_type").notNull().default("analysis"),
      sourcePackJson: jsonb("source_pack_json").$type().notNull().default([]),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    });
    issueRoomStrategyOptions = pgTable("policy_intel_issue_room_strategy_options", {
      id: serial("id").primaryKey(),
      issueRoomId: integer("issue_room_id").notNull().references(() => issueRooms.id, { onDelete: "cascade" }),
      label: varchar("label", { length: 255 }).notNull(),
      description: text("description"),
      prosJson: jsonb("pros_json").$type().notNull().default([]),
      consJson: jsonb("cons_json").$type().notNull().default([]),
      politicalFeasibility: varchar("political_feasibility", { length: 32 }).default("unknown"),
      legalDurability: varchar("legal_durability", { length: 32 }).default("unknown"),
      implementationComplexity: varchar("implementation_complexity", { length: 32 }).default("unknown"),
      recommendationRank: integer("recommendation_rank").notNull().default(0),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    });
    issueRoomTasks = pgTable("policy_intel_issue_room_tasks", {
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
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    });
    activities = pgTable("policy_intel_activities", {
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
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
    });
    deliverables = pgTable("policy_intel_deliverables", {
      id: serial("id").primaryKey(),
      workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      briefId: integer("brief_id").references(() => briefs.id, { onDelete: "set null" }),
      matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
      type: deliverableTypeEnum("type").notNull().default("issue_brief"),
      title: text("title").notNull(),
      bodyMarkdown: text("body_markdown").notNull(),
      sourceDocumentIds: jsonb("source_document_ids").$type().notNull().default([]),
      citationsJson: jsonb("citations_json").$type().notNull().default([]),
      generatedBy: varchar("generated_by", { length: 64 }).notNull().default("template"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    });
    stakeholderTypeEnum = pgEnum("policy_intel_stakeholder_type", [
      "legislator",
      "lobbyist",
      "agency_official",
      "pac",
      "organization",
      "individual"
    ]);
    stakeholders = pgTable(
      "policy_intel_stakeholders",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        issueRoomId: integer("issue_room_id").references(() => issueRooms.id, { onDelete: "set null" }),
        type: stakeholderTypeEnum("type").notNull(),
        name: varchar("name", { length: 255 }).notNull(),
        title: varchar("title", { length: 255 }),
        organization: varchar("organization", { length: 255 }),
        jurisdiction: varchar("jurisdiction", { length: 64 }),
        tagsJson: jsonb("tags_json").$type().notNull().default([]),
        sourceSummary: text("source_summary"),
        // Extended fields for legislators
        legiscanPeopleId: integer("legiscan_people_id"),
        party: varchar("party", { length: 16 }),
        chamber: varchar("chamber", { length: 32 }),
        district: varchar("district", { length: 32 }),
        email: varchar("email", { length: 255 }),
        phone: varchar("phone", { length: 64 }),
        officeAddress: text("office_address"),
        photoUrl: varchar("photo_url", { length: 500 }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceNameTypeUnique: uniqueIndex("policy_intel_stakeholders_workspace_name_type_idx").on(
          table.workspaceId,
          table.name,
          table.type
        ),
        issueRoomIdx: index("policy_intel_stakeholders_issue_room_idx").on(table.issueRoomId)
      })
    );
    stakeholderObservations = pgTable("policy_intel_stakeholder_observations", {
      id: serial("id").primaryKey(),
      stakeholderId: integer("stakeholder_id").notNull().references(() => stakeholders.id, { onDelete: "cascade" }),
      sourceDocumentId: integer("source_document_id").references(() => sourceDocuments.id, { onDelete: "set null" }),
      matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
      observationText: text("observation_text").notNull(),
      confidence: varchar("confidence", { length: 32 }).notNull().default("medium"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
    });
    hearingStatusEnum = pgEnum("policy_intel_hearing_status", [
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
      "postponed"
    ]);
    committeeIntelSessionStatusEnum = pgEnum("policy_intel_committee_intel_session_status", [
      "planned",
      "monitoring",
      "paused",
      "completed"
    ]);
    committeeIntelSpeakerRoleEnum = pgEnum("policy_intel_committee_intel_speaker_role", [
      "chair",
      "member",
      "staff",
      "agency",
      "invited_witness",
      "public_witness",
      "moderator",
      "unknown"
    ]);
    committeeIntelPositionEnum = pgEnum("policy_intel_committee_intel_position", [
      "support",
      "oppose",
      "questioning",
      "neutral",
      "monitoring",
      "unknown"
    ]);
    committeeIntelEntityTypeEnum = pgEnum("policy_intel_committee_intel_entity_type", [
      "legislator",
      "agency",
      "organization",
      "witness",
      "staff",
      "committee",
      "unknown"
    ]);
    committeeIntelTranscriptSourceTypeEnum = pgEnum("policy_intel_committee_intel_transcript_source_type", [
      "manual",
      "official",
      "webvtt",
      "json",
      "text"
    ]);
    committeeIntelAutoIngestStatusEnum = pgEnum("policy_intel_committee_intel_auto_ingest_status", [
      "idle",
      "ready",
      "syncing",
      "error"
    ]);
    hearingEvents = pgTable("policy_intel_hearing_events", {
      id: serial("id").primaryKey(),
      workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      sourceDocumentId: integer("source_document_id").references(() => sourceDocuments.id, { onDelete: "set null" }),
      committee: varchar("committee", { length: 255 }).notNull(),
      chamber: varchar("chamber", { length: 32 }).notNull(),
      // House, Senate, Joint
      hearingDate: timestamp("hearing_date", { withTimezone: true }).notNull(),
      timeDescription: varchar("time_description", { length: 128 }),
      location: varchar("location", { length: 255 }),
      description: text("description"),
      relatedBillIds: jsonb("related_bill_ids").$type().notNull().default([]),
      status: hearingStatusEnum("status").notNull().default("scheduled"),
      externalId: varchar("external_id", { length: 255 }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    });
    committeeRoleEnum = pgEnum("policy_intel_committee_role", [
      "chair",
      "vice_chair",
      "member"
    ]);
    committeeMembers = pgTable("policy_intel_committee_members", {
      id: serial("id").primaryKey(),
      stakeholderId: integer("stakeholder_id").notNull().references(() => stakeholders.id, { onDelete: "cascade" }),
      committeeName: varchar("committee_name", { length: 255 }).notNull(),
      chamber: varchar("chamber", { length: 32 }).notNull(),
      role: committeeRoleEnum("role").notNull().default("member"),
      sessionId: integer("session_id"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
    });
    meetingNotes = pgTable("policy_intel_meeting_notes", {
      id: serial("id").primaryKey(),
      stakeholderId: integer("stakeholder_id").notNull().references(() => stakeholders.id, { onDelete: "cascade" }),
      matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
      noteText: text("note_text").notNull(),
      meetingDate: timestamp("meeting_date", { withTimezone: true }),
      contactMethod: varchar("contact_method", { length: 64 }),
      // in-person, phone, email, testimony
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
    });
    committeeIntelSessions = pgTable(
      "policy_intel_committee_intel_sessions",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        hearingId: integer("hearing_id").references(() => hearingEvents.id, { onDelete: "cascade" }),
        title: varchar("title", { length: 255 }).notNull(),
        committee: varchar("committee", { length: 255 }).notNull(),
        chamber: varchar("chamber", { length: 32 }).notNull(),
        hearingDate: timestamp("hearing_date", { withTimezone: true }).notNull(),
        status: committeeIntelSessionStatusEnum("status").notNull().default("planned"),
        agendaUrl: text("agenda_url"),
        videoUrl: text("video_url"),
        transcriptSourceType: committeeIntelTranscriptSourceTypeEnum("transcript_source_type").notNull().default("manual"),
        transcriptSourceUrl: text("transcript_source_url"),
        autoIngestEnabled: boolean("auto_ingest_enabled").notNull().default(false),
        autoIngestIntervalSeconds: integer("auto_ingest_interval_seconds").notNull().default(120),
        autoIngestStatus: committeeIntelAutoIngestStatusEnum("auto_ingest_status").notNull().default("idle"),
        autoIngestError: text("auto_ingest_error"),
        lastAutoIngestedAt: timestamp("last_auto_ingested_at", { withTimezone: true }),
        lastAutoIngestCursor: text("last_auto_ingest_cursor"),
        focusTopicsJson: jsonb("focus_topics_json").$type().notNull().default([]),
        interimChargesJson: jsonb("interim_charges_json").$type().notNull().default([]),
        clientContext: text("client_context"),
        monitoringNotes: text("monitoring_notes"),
        liveSummary: text("live_summary"),
        analyticsJson: jsonb("analytics_json").$type().notNull().default({}),
        lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceHearingIdx: uniqueIndex("policy_intel_committee_intel_session_workspace_hearing_idx").on(table.workspaceId, table.hearingId),
        committeeDateIdx: index("policy_intel_committee_intel_session_committee_date_idx").on(table.committee, table.hearingDate),
        statusIdx: index("policy_intel_committee_intel_session_status_idx").on(table.status),
        autoIngestIdx: index("policy_intel_committee_intel_session_auto_ingest_idx").on(table.autoIngestEnabled, table.autoIngestStatus)
      })
    );
    committeeIntelSegments = pgTable(
      "policy_intel_committee_intel_segments",
      {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id").notNull().references(() => committeeIntelSessions.id, { onDelete: "cascade" }),
        segmentIndex: integer("segment_index").notNull().default(0),
        capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
        startedAtSecond: integer("started_at_second"),
        endedAtSecond: integer("ended_at_second"),
        speakerName: varchar("speaker_name", { length: 255 }),
        speakerRole: committeeIntelSpeakerRoleEnum("speaker_role").notNull().default("unknown"),
        affiliation: varchar("affiliation", { length: 255 }),
        transcriptText: text("transcript_text").notNull(),
        summary: text("summary"),
        issueTagsJson: jsonb("issue_tags_json").$type().notNull().default([]),
        position: committeeIntelPositionEnum("position").notNull().default("unknown"),
        importance: integer("importance").notNull().default(0),
        invited: boolean("invited").notNull().default(false),
        metadataJson: jsonb("metadata_json").$type().notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        sessionCapturedIdx: index("policy_intel_committee_intel_segment_session_captured_idx").on(table.sessionId, table.capturedAt),
        sessionImportanceIdx: index("policy_intel_committee_intel_segment_session_importance_idx").on(table.sessionId, table.importance),
        speakerIdx: index("policy_intel_committee_intel_segment_speaker_idx").on(table.speakerName)
      })
    );
    committeeIntelSignals = pgTable(
      "policy_intel_committee_intel_signals",
      {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id").notNull().references(() => committeeIntelSessions.id, { onDelete: "cascade" }),
        segmentId: integer("segment_id").references(() => committeeIntelSegments.id, { onDelete: "set null" }),
        stakeholderId: integer("stakeholder_id").references(() => stakeholders.id, { onDelete: "set null" }),
        entityName: varchar("entity_name", { length: 255 }).notNull(),
        entityType: committeeIntelEntityTypeEnum("entity_type").notNull().default("unknown"),
        affiliation: varchar("affiliation", { length: 255 }),
        issueTag: varchar("issue_tag", { length: 128 }).notNull(),
        position: committeeIntelPositionEnum("position").notNull().default("unknown"),
        confidence: doublePrecision("confidence").notNull().default(0),
        evidenceQuote: text("evidence_quote"),
        sourceKind: varchar("source_kind", { length: 64 }).notNull().default("transcript"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        sessionIssueIdx: index("policy_intel_committee_intel_signal_session_issue_idx").on(table.sessionId, table.issueTag),
        entityIdx: index("policy_intel_committee_intel_signal_entity_idx").on(table.entityName, table.issueTag),
        stakeholderIdx: index("policy_intel_committee_intel_signal_stakeholder_idx").on(table.stakeholderId)
      })
    );
    feedbackOutcomeEnum = pgEnum("policy_intel_feedback_outcome", [
      "promoted",
      "suppressed",
      "strong_positive"
    ]);
    feedbackLog = pgTable(
      "policy_intel_feedback_log",
      {
        id: serial("id").primaryKey(),
        alertId: integer("alert_id").notNull().references(() => alerts.id, { onDelete: "cascade" }),
        outcome: feedbackOutcomeEnum("outcome").notNull(),
        originalScore: integer("original_score").notNull(),
        originalConfidence: doublePrecision("original_confidence").notNull().default(0),
        agentScoresJson: jsonb("agent_scores_json").$type().notNull().default([]),
        weightsJson: jsonb("weights_json").$type().notNull().default({}),
        regime: varchar("regime", { length: 32 }).notNull().default("interim"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        alertIdx: index("policy_intel_feedback_log_alert_idx").on(table.alertId),
        outcomeIdx: index("policy_intel_feedback_log_outcome_idx").on(table.outcome),
        createdIdx: index("policy_intel_feedback_log_created_idx").on(table.createdAt)
      })
    );
    championSnapshots = pgTable(
      "policy_intel_champion_snapshots",
      {
        id: serial("id").primaryKey(),
        generation: integer("generation").notNull().default(1),
        weightsJson: jsonb("weights_json").$type().notNull(),
        escalateThreshold: integer("escalate_threshold").notNull().default(60),
        archiveThreshold: integer("archive_threshold").notNull().default(20),
        accuracy: doublePrecision("accuracy").notNull().default(0),
        feedbackCount: integer("feedback_count").notNull().default(0),
        promotedAt: timestamp("promoted_at", { withTimezone: true }).defaultNow().notNull(),
        metadataJson: jsonb("metadata_json").$type().default({})
      }
    );
    forecastSnapshots = pgTable(
      "policy_intel_forecast_snapshots",
      {
        id: serial("id").primaryKey(),
        snapshotId: varchar("snapshot_id", { length: 64 }).notNull(),
        capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
        predictionsJson: jsonb("predictions_json").$type().notNull().default([]),
        regime: varchar("regime", { length: 32 }).notNull().default("interim"),
        totalInsights: integer("total_insights").notNull().default(0),
        criticalRiskCount: integer("critical_risk_count").notNull().default(0),
        anomalyCount: integer("anomaly_count").notNull().default(0)
      },
      (table) => ({
        snapshotIdx: uniqueIndex("policy_intel_forecast_snap_sid_idx").on(table.snapshotId),
        capturedIdx: index("policy_intel_forecast_snap_captured_idx").on(table.capturedAt)
      })
    );
    billOutcomeEnum = pgEnum("policy_intel_bill_outcome", [
      "active",
      "passed",
      "failed",
      "stalled",
      "amended",
      "unknown"
    ]);
    billOutcomeSnapshots = pgTable(
      "policy_intel_bill_outcome_snapshots",
      {
        id: serial("id").primaryKey(),
        snapshotKey: varchar("snapshot_key", { length: 16 }).notNull(),
        capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
        billId: varchar("bill_id", { length: 64 }).notNull(),
        stage: varchar("stage", { length: 64 }).notNull().default("unknown"),
        outcome: billOutcomeEnum("outcome").notNull().default("unknown"),
        statusText: text("status_text"),
        sourceDocumentId: integer("source_document_id").references(() => sourceDocuments.id, { onDelete: "set null" }),
        publishedAt: timestamp("published_at", { withTimezone: true }),
        metadataJson: jsonb("metadata_json").$type().notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        snapshotBillUnique: uniqueIndex("policy_intel_bill_outcome_snapshot_bill_idx").on(table.snapshotKey, table.billId),
        snapshotIdx: index("policy_intel_bill_outcome_snapshot_idx").on(table.snapshotKey, table.capturedAt),
        outcomeIdx: index("policy_intel_bill_outcome_outcome_idx").on(table.outcome)
      })
    );
    anomalyHistory = pgTable(
      "policy_intel_anomaly_history",
      {
        id: serial("id").primaryKey(),
        type: varchar("type", { length: 64 }).notNull(),
        severity: varchar("severity", { length: 16 }).notNull(),
        subject: varchar("subject", { length: 256 }).notNull(),
        deviation: doublePrecision("deviation").notNull().default(0),
        baseline: doublePrecision("baseline").notNull().default(0),
        observed: doublePrecision("observed").notNull().default(0),
        detectedAt: timestamp("detected_at", { withTimezone: true }).defaultNow().notNull(),
        regime: varchar("regime", { length: 32 }).notNull().default("interim"),
        wasActioned: boolean("was_actioned").notNull().default(false),
        metadataJson: jsonb("metadata_json").$type().default({})
      },
      (table) => ({
        typeIdx: index("policy_intel_anomaly_hist_type_idx").on(table.type),
        detectedIdx: index("policy_intel_anomaly_hist_detected_idx").on(table.detectedAt),
        severityIdx: index("policy_intel_anomaly_hist_severity_idx").on(table.severity)
      })
    );
    velocitySnapshots = pgTable(
      "policy_intel_velocity_snapshots",
      {
        id: serial("id").primaryKey(),
        capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
        regime: varchar("regime", { length: 32 }).notNull().default("interim"),
        vectorsJson: jsonb("vectors_json").$type().notNull().default([]),
        topMoversJson: jsonb("top_movers_json").$type().notNull().default([]),
        totalVectors: integer("total_vectors").notNull().default(0),
        surgingCount: integer("surging_count").notNull().default(0),
        stalledCount: integer("stalled_count").notNull().default(0)
      },
      (table) => ({
        capturedIdx: index("policy_intel_velocity_snap_captured_idx").on(table.capturedAt)
      })
    );
    learningMetrics = pgTable(
      "policy_intel_learning_metrics",
      {
        id: serial("id").primaryKey(),
        metricType: varchar("metric_type", { length: 64 }).notNull(),
        capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
        regime: varchar("regime", { length: 32 }).notNull().default("interim"),
        valuesJson: jsonb("values_json").$type().notNull().default({})
      },
      (table) => ({
        typeIdx: index("policy_intel_learning_metrics_type_idx").on(table.metricType),
        capturedIdx: index("policy_intel_learning_metrics_captured_idx").on(table.capturedAt)
      })
    );
    schedulerRuns = pgTable(
      "policy_intel_scheduler_runs",
      {
        id: serial("id").primaryKey(),
        jobName: varchar("job_name", { length: 128 }).notNull(),
        startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
        finishedAt: timestamp("finished_at", { withTimezone: true }).notNull(),
        durationMs: integer("duration_ms").notNull(),
        status: varchar("status", { length: 16 }).notNull(),
        summaryJson: jsonb("summary_json").$type().notNull().default({}),
        error: text("error"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        finishedIdx: index("policy_intel_scheduler_runs_finished_idx").on(table.finishedAt),
        jobFinishedIdx: index("policy_intel_scheduler_runs_job_finished_idx").on(table.jobName, table.finishedAt)
      })
    );
    clientProfiles = pgTable(
      "policy_intel_client_profiles",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        firmName: varchar("firm_name", { length: 255 }).notNull(),
        contactName: varchar("contact_name", { length: 255 }),
        contactEmail: varchar("contact_email", { length: 255 }),
        contactPhone: varchar("contact_phone", { length: 64 }),
        industry: varchar("industry", { length: 128 }),
        priorityTopics: jsonb("priority_topics").$type().notNull().default([]),
        jurisdictions: jsonb("jurisdictions").$type().notNull().default(["texas"]),
        reportingPreferences: jsonb("reporting_preferences").$type().notNull().default({
          frequency: "weekly",
          deliverableTypes: ["client_alert", "weekly_digest"],
          includePassageProbability: true,
          includeStakeholderIntel: true
        }),
        scoringWeights: jsonb("scoring_weights").$type(),
        notificationChannels: jsonb("notification_channels").$type().notNull().default({}),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceIdx: index("policy_intel_client_profiles_workspace_idx").on(table.workspaceId)
      })
    );
    passagePredictionEnum = pgEnum("policy_intel_passage_prediction", [
      "likely_pass",
      "lean_pass",
      "toss_up",
      "lean_fail",
      "likely_fail",
      "dead"
    ]);
    passagePredictions = pgTable(
      "policy_intel_passage_predictions",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        billId: varchar("bill_id", { length: 64 }).notNull(),
        billTitle: text("bill_title"),
        prediction: passagePredictionEnum("prediction").notNull().default("toss_up"),
        probability: doublePrecision("probability").notNull().default(0.5),
        confidence: doublePrecision("confidence").notNull().default(0),
        regime: varchar("regime", { length: 32 }).notNull().default("interim"),
        currentStage: varchar("current_stage", { length: 128 }),
        nextMilestone: varchar("next_milestone", { length: 255 }),
        nextMilestoneDate: timestamp("next_milestone_date", { withTimezone: true }),
        riskFactors: jsonb("risk_factors").$type().notNull().default([]),
        supportSignals: jsonb("support_signals").$type().notNull().default([]),
        oppositionSignals: jsonb("opposition_signals").$type().notNull().default([]),
        historicalComps: jsonb("historical_comps").$type().notNull().default([]),
        sponsorStrength: doublePrecision("sponsor_strength").default(0),
        committeeAlignment: doublePrecision("committee_alignment").default(0),
        previousProbability: doublePrecision("previous_probability"),
        probabilityDelta: doublePrecision("probability_delta"),
        lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceBillUnique: uniqueIndex("policy_intel_passage_predictions_ws_bill_idx").on(
          table.workspaceId,
          table.billId
        ),
        predictionIdx: index("policy_intel_passage_predictions_prediction_idx").on(table.prediction),
        probabilityIdx: index("policy_intel_passage_predictions_probability_idx").on(table.probability)
      })
    );
    relationshipTypeEnum = pgEnum("policy_intel_relationship_type", [
      "funds",
      "lobbies_for",
      "opposes",
      "co_sponsors",
      "staff_of",
      "committee_together",
      "testified_before",
      "client_of",
      "ally",
      "adversary"
    ]);
    relationships = pgTable(
      "policy_intel_relationships",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        fromStakeholderId: integer("from_stakeholder_id").notNull().references(() => stakeholders.id, { onDelete: "cascade" }),
        toStakeholderId: integer("to_stakeholder_id").notNull().references(() => stakeholders.id, { onDelete: "cascade" }),
        relationshipType: relationshipTypeEnum("relationship_type").notNull(),
        strength: doublePrecision("strength").notNull().default(0.5),
        evidenceSummary: text("evidence_summary"),
        sourceDocumentIds: jsonb("source_document_ids").$type().notNull().default([]),
        metadata: jsonb("metadata").$type().notNull().default({}),
        lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        fromToUnique: uniqueIndex("policy_intel_relationships_from_to_type_idx").on(
          table.fromStakeholderId,
          table.toStakeholderId,
          table.relationshipType
        ),
        workspaceIdx: index("policy_intel_relationships_workspace_idx").on(table.workspaceId),
        toIdx: index("policy_intel_relationships_to_idx").on(table.toStakeholderId)
      })
    );
    sessionPhaseEnum = pgEnum("policy_intel_session_phase", [
      "interim",
      "pre_filing",
      "filing_period",
      "committee_hearings",
      "floor_action",
      "conference",
      "enrollment",
      "post_session",
      "special_session"
    ]);
    sessionMilestoneStatusEnum = pgEnum("policy_intel_session_milestone_status", [
      "upcoming",
      "in_progress",
      "completed",
      "missed",
      "cancelled"
    ]);
    legislativeSessions = pgTable(
      "policy_intel_legislative_sessions",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        sessionNumber: integer("session_number").notNull(),
        sessionType: varchar("session_type", { length: 32 }).notNull().default("regular"),
        startDate: timestamp("start_date", { withTimezone: true }).notNull(),
        endDate: timestamp("end_date", { withTimezone: true }),
        currentPhase: sessionPhaseEnum("current_phase").notNull().default("interim"),
        isActive: boolean("is_active").notNull().default(true),
        configJson: jsonb("config_json").$type().notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceSessionUnique: uniqueIndex("policy_intel_leg_sessions_ws_num_idx").on(
          table.workspaceId,
          table.sessionNumber
        )
      })
    );
    sessionMilestones = pgTable(
      "policy_intel_session_milestones",
      {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id").notNull().references(() => legislativeSessions.id, { onDelete: "cascade" }),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description"),
        phase: sessionPhaseEnum("phase").notNull(),
        dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
        status: sessionMilestoneStatusEnum("status").notNull().default("upcoming"),
        assignee: varchar("assignee", { length: 255 }),
        matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        notesJson: jsonb("notes_json").$type().notNull().default([]),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        sessionPhaseIdx: index("policy_intel_session_milestones_session_phase_idx").on(
          table.sessionId,
          table.phase
        ),
        dueDateIdx: index("policy_intel_session_milestones_due_date_idx").on(table.dueDate)
      })
    );
    reportTemplates = pgTable(
      "policy_intel_report_templates",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        type: deliverableTypeEnum("type").notNull(),
        templateMarkdown: text("template_markdown").notNull(),
        headerHtml: text("header_html"),
        footerHtml: text("footer_html"),
        brandConfig: jsonb("brand_config").$type().notNull().default({
          primaryColor: "#1a365d",
          accentColor: "#c53030",
          firmName: "Grace & McEwan Consulting LLC"
        }),
        isDefault: boolean("is_default").notNull().default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceTypeIdx: index("policy_intel_report_templates_ws_type_idx").on(
          table.workspaceId,
          table.type
        )
      })
    );
    clientActionStatusEnum = pgEnum("policy_intel_client_action_status", [
      "pending",
      "in_progress",
      "completed",
      "deferred",
      "cancelled"
    ]);
    clientActionTypeEnum = pgEnum("policy_intel_client_action_type", [
      "testimony_prep",
      "legislator_meeting",
      "position_letter",
      "coalition_outreach",
      "media_response",
      "amendment_draft",
      "fiscal_note_review",
      "witness_coordination",
      "client_briefing",
      "strategy_pivot",
      "opposition_research",
      "grassroots_activation"
    ]);
    clientActions = pgTable(
      "policy_intel_client_actions",
      {
        id: serial("id").primaryKey(),
        workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
        matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
        issueRoomId: integer("issue_room_id").references(() => issueRooms.id, { onDelete: "set null" }),
        alertId: integer("alert_id").references(() => alerts.id, { onDelete: "set null" }),
        actionType: clientActionTypeEnum("action_type").notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description"),
        status: clientActionStatusEnum("status").notNull().default("pending"),
        priority: issueRoomTaskPriorityEnum("priority").notNull().default("medium"),
        assignee: varchar("assignee", { length: 255 }),
        dueDate: timestamp("due_date", { withTimezone: true }),
        relatedBillIds: jsonb("related_bill_ids").$type().notNull().default([]),
        stakeholderIds: jsonb("stakeholder_ids").$type().notNull().default([]),
        outcome: text("outcome"),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => ({
        workspaceStatusIdx: index("policy_intel_client_actions_ws_status_idx").on(
          table.workspaceId,
          table.status
        ),
        dueDateIdx: index("policy_intel_client_actions_due_date_idx").on(table.dueDate),
        matterIdx: index("policy_intel_client_actions_matter_idx").on(table.matterId)
      })
    );
  }
});

// server/policy-intel/logger.ts
import pino from "pino";
function createLogger(module) {
  return logger.child({ module });
}
var logger;
var init_logger = __esm({
  "server/policy-intel/logger.ts"() {
    "use strict";
    logger = pino({
      level: process.env.LOG_LEVEL || "info",
      ...process.env.NODE_ENV !== "production" ? { transport: { target: "pino/file", options: { destination: 1 } } } : {}
    });
  }
});

// server/policy-intel/db.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function ensureDatabaseConnection() {
  for (let attempt = 1; attempt <= CONNECT_RETRY_ATTEMPTS; attempt++) {
    try {
      await queryClient`select 1`;
      if (attempt > 1) {
        log.info({ attempt }, "database connection established");
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= CONNECT_RETRY_ATTEMPTS) {
        throw new Error(`[policy-intel] database connection failed after ${attempt} attempts: ${message}`);
      }
      log.warn(
        { attempt, total: CONNECT_RETRY_ATTEMPTS, err: message },
        "database connection attempt failed"
      );
      await sleep(CONNECT_RETRY_DELAY_MS);
    }
  }
}
var log, queryClient, CONNECT_RETRY_ATTEMPTS, CONNECT_RETRY_DELAY_MS, policyIntelDb;
var init_db = __esm({
  "server/policy-intel/db.ts"() {
    "use strict";
    init_schema_policy_intel();
    init_logger();
    log = createLogger("db");
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for policy-intel service");
    }
    queryClient = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
    CONNECT_RETRY_ATTEMPTS = Number(process.env.DB_CONNECT_RETRY_ATTEMPTS || 10);
    CONNECT_RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 3e3);
    policyIntelDb = drizzle(queryClient, { schema: schema_policy_intel_exports });
  }
});

// shared/schema-power-network.ts
import {
  boolean as boolean2,
  doublePrecision as doublePrecision2,
  integer as integer2,
  jsonb as jsonb2,
  pgEnum as pgEnum2,
  pgTable as pgTable2,
  serial as serial2,
  text as text2,
  timestamp as timestamp2
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var powerCenterRoleEnum, predictionStatusEnum, powerCenters, votingBlocs, votingBlocMembers, legislationPredictions, leadershipPriorities, powerCentersRelations, votingBlocsRelations, votingBlocMembersRelations, insertPowerCenterSchema, insertVotingBlocSchema, insertVotingBlocMemberSchema, insertLegislationPredictionSchema, insertLeadershipPrioritySchema;
var init_schema_power_network = __esm({
  "shared/schema-power-network.ts"() {
    "use strict";
    init_schema_policy_intel();
    powerCenterRoleEnum = pgEnum2("power_center_role", [
      "governor",
      "lieutenant_governor",
      "speaker",
      "pro_tempore",
      "majority_leader",
      "minority_leader",
      "whip",
      "caucus_chair",
      "committee_chair",
      "appropriations_chair",
      "rules_chair"
    ]);
    predictionStatusEnum = pgEnum2("prediction_status", [
      "predicted",
      "filed",
      "confirmed",
      "missed",
      "partially_correct"
    ]);
    powerCenters = pgTable2("power_centers", {
      id: serial2("id").primaryKey(),
      role: powerCenterRoleEnum("role").notNull(),
      name: text2("name").notNull(),
      stakeholderId: integer2("stakeholder_id").references(() => stakeholders.id),
      chamber: text2("chamber"),
      // house, senate, executive
      party: text2("party"),
      session: text2("session").notNull(),
      // "89R", "88R"
      /** Key policy priorities for this leader */
      priorities: jsonb2("priorities").$type().default([]),
      /** Influence score 0-100 */
      influenceScore: integer2("influence_score").default(0),
      /** Network stats */
      stats: jsonb2("stats").$type(),
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow()
    });
    votingBlocs = pgTable2("voting_blocs", {
      id: serial2("id").primaryKey(),
      name: text2("name").notNull(),
      session: text2("session").notNull(),
      chamber: text2("chamber").notNull(),
      /** How the bloc was detected */
      detectionMethod: text2("detection_method").default("co-voting-analysis"),
      /** Cohesion score — how consistently members vote together (0-1) */
      cohesion: doublePrecision2("cohesion").default(0),
      /** Number of members */
      memberCount: integer2("member_count").default(0),
      /** Key issues this bloc votes together on */
      issueAreas: jsonb2("issue_areas").$type().default([]),
      /** Which power center this bloc aligns with */
      alignedPowerCenter: text2("aligned_power_center"),
      /** How many votes analyzed */
      votesAnalyzed: integer2("votes_analyzed").default(0),
      /** Is this bloc cross-party? */
      bipartisan: boolean2("bipartisan").default(false),
      /** Narrative description */
      narrative: text2("narrative"),
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow()
    });
    votingBlocMembers = pgTable2("voting_bloc_members", {
      id: serial2("id").primaryKey(),
      blocId: integer2("bloc_id").notNull().references(() => votingBlocs.id, { onDelete: "cascade" }),
      stakeholderId: integer2("stakeholder_id").notNull().references(() => stakeholders.id),
      /** Loyalty score — how often this member votes with the bloc (0-1) */
      loyalty: doublePrecision2("loyalty").default(0),
      /** Is this member a leader of the bloc? */
      isLeader: boolean2("is_leader").default(false),
      /** Join date approximation */
      joinedSession: text2("joined_session"),
      createdAt: timestamp2("created_at").defaultNow()
    });
    legislationPredictions = pgTable2("legislation_predictions", {
      id: serial2("id").primaryKey(),
      session: text2("session").notNull(),
      /** Predicted topic/title */
      predictedTopic: text2("predicted_topic").notNull(),
      /** Predicted bill type */
      predictedBillType: text2("predicted_bill_type"),
      // HB, SB, HJR, SJR
      /** Which chamber is expected to originate */
      predictedChamber: text2("predicted_chamber"),
      /** Predicted sponsor(s) */
      predictedSponsors: jsonb2("predicted_sponsors").$type().default([]),
      /** Who will prioritize it */
      predictedChampion: jsonb2("predicted_champion").$type(),
      /** Confidence score 0-1 */
      confidence: doublePrecision2("confidence").default(0),
      /** Prediction reasoning */
      reasoning: text2("reasoning"),
      /** Evidence sources */
      evidenceSources: jsonb2("evidence_sources").$type().default([]),
      /** Predicted passage probability */
      passageProbability: doublePrecision2("passage_probability"),
      /** Which power center is likely to push/block */
      powerCenterDynamic: jsonb2("power_center_dynamic").$type(),
      /** Actual outcome for verification */
      status: predictionStatusEnum("status").default("predicted"),
      actualBillId: text2("actual_bill_id"),
      actualSponsor: text2("actual_sponsor"),
      /** Meta */
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow()
    });
    leadershipPriorities = pgTable2("leadership_priorities", {
      id: serial2("id").primaryKey(),
      powerCenterId: integer2("power_center_id").references(() => powerCenters.id),
      session: text2("session").notNull(),
      topic: text2("topic").notNull(),
      stance: text2("stance").notNull(),
      // champion, oppose, caution, negotiate
      /** Intensity 1-10 */
      intensity: integer2("intensity").default(5),
      /** Evidence: speech, press release, bill filing, committee assignment */
      evidenceType: text2("evidence_type"),
      evidenceDetail: text2("evidence_detail"),
      evidenceUrl: text2("evidence_url"),
      evidenceDate: timestamp2("evidence_date"),
      /** Has this been acted on? */
      acted: boolean2("acted").default(false),
      /** Status */
      billFiled: boolean2("bill_filed").default(false),
      billId: text2("bill_id"),
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow()
    });
    powerCentersRelations = relations(powerCenters, ({ one }) => ({
      stakeholder: one(stakeholders, {
        fields: [powerCenters.stakeholderId],
        references: [stakeholders.id]
      })
    }));
    votingBlocsRelations = relations(votingBlocs, ({ many }) => ({
      members: many(votingBlocMembers)
    }));
    votingBlocMembersRelations = relations(votingBlocMembers, ({ one }) => ({
      bloc: one(votingBlocs, {
        fields: [votingBlocMembers.blocId],
        references: [votingBlocs.id]
      }),
      stakeholder: one(stakeholders, {
        fields: [votingBlocMembers.stakeholderId],
        references: [stakeholders.id]
      })
    }));
    insertPowerCenterSchema = createInsertSchema(powerCenters).omit({ id: true, createdAt: true, updatedAt: true });
    insertVotingBlocSchema = createInsertSchema(votingBlocs).omit({ id: true, createdAt: true, updatedAt: true });
    insertVotingBlocMemberSchema = createInsertSchema(votingBlocMembers).omit({ id: true, createdAt: true });
    insertLegislationPredictionSchema = createInsertSchema(legislationPredictions).omit({ id: true, createdAt: true, updatedAt: true });
    insertLeadershipPrioritySchema = createInsertSchema(leadershipPriorities).omit({ id: true, createdAt: true, updatedAt: true });
  }
});

// server/policy-intel/engine/intelligence/power-network-analyzer.ts
var power_network_analyzer_exports = {};
__export(power_network_analyzer_exports, {
  analyzeNetworkPower: () => analyzeNetworkPower
});
import { eq as eq17, desc as desc11, count as count9 } from "drizzle-orm";
async function analyzeNetworkPower(force = false) {
  if (!force && cachedReport && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedReport;
  }
  const allStakeholders = await policyIntelDb.select().from(stakeholders);
  const allCommittees = await policyIntelDb.select().from(committeeMembers);
  const legislators = allStakeholders.filter((s) => s.type === "legislator");
  const houseMembers = legislators.filter((l) => l.chamber?.toLowerCase() === "house");
  const senateMembers = legislators.filter((l) => l.chamber?.toLowerCase() === "senate");
  const stakeholderCommittees = /* @__PURE__ */ new Map();
  for (const cm of allCommittees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }
  const chairs = allCommittees.filter((cm) => cm.role === "chair");
  const viceChairs = allCommittees.filter((cm) => cm.role === "vice_chair");
  const houseChairs = chairs.filter((cm) => cm.chamber?.toLowerCase() === "house");
  const senateChairs = chairs.filter((cm) => cm.chamber?.toLowerCase() === "senate");
  const savedCenters = await policyIntelDb.select().from(powerCenters).where(eq17(powerCenters.session, CURRENT_SESSION));
  const savedByRole = new Map(savedCenters.map((pc) => [pc.role, pc]));
  const resolveStakeholderId2 = (name) => {
    const match = allStakeholders.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    return match?.id ?? 0;
  };
  const bigThree = [];
  const savedGov = savedByRole.get("governor");
  const govName = savedGov?.name ?? "Greg Abbott";
  const govPriorities = await detectGovernorPriorities();
  const govAllies = findGovernorAllies(legislators, chairs, allCommittees);
  bigThree.push({
    name: govName,
    role: "governor",
    chamber: "executive",
    party: savedGov?.party ?? "R",
    priorities: govPriorities,
    committeeChairs: [],
    // Governor doesn't appoint committee chairs
    allies: govAllies,
    metrics: {
      committeeChairsControlled: 0,
      billsPrioritized: govPriorities.length,
      chamberControl: 100
      // executive authority
    }
  });
  const savedLtGov = savedByRole.get("lieutenant_governor");
  const ltGovName = savedLtGov?.name ?? "Dan Patrick";
  const ltGovPriorities = await detectChamberPriorities("senate");
  const ltGovAllies = findAllies(senateMembers, senateChairs, allCommittees, "senate");
  bigThree.push({
    name: ltGovName,
    role: "lieutenant_governor",
    chamber: "senate",
    party: savedLtGov?.party ?? "R",
    priorities: ltGovPriorities,
    committeeChairs: senateChairs.map((ch) => {
      const leg = legislators.find((l) => l.id === ch.stakeholderId);
      return {
        name: leg?.name ?? "Unknown",
        committee: ch.committeeName,
        chamber: "senate",
        party: leg?.party ?? "",
        stakeholderId: ch.stakeholderId
      };
    }),
    allies: ltGovAllies,
    metrics: {
      committeeChairsControlled: senateChairs.length,
      billsPrioritized: ltGovPriorities.length,
      chamberControl: 85
      // Lt Gov controls Senate floor & committee assignments
    }
  });
  const savedSpeaker = savedByRole.get("speaker");
  const speakerName = savedSpeaker?.name ?? findSpeaker(houseMembers, houseChairs) ?? "Dustin Burrows";
  const speakerPriorities = await detectChamberPriorities("house");
  const speakerAllies = findAllies(houseMembers, houseChairs, allCommittees, "house");
  bigThree.push({
    name: speakerName,
    role: "speaker",
    chamber: "house",
    party: savedSpeaker?.party ?? "R",
    priorities: speakerPriorities,
    committeeChairs: houseChairs.map((ch) => {
      const leg = legislators.find((l) => l.id === ch.stakeholderId);
      return {
        name: leg?.name ?? "Unknown",
        committee: ch.committeeName,
        chamber: "house",
        party: leg?.party ?? "",
        stakeholderId: ch.stakeholderId
      };
    }),
    allies: speakerAllies,
    metrics: {
      committeeChairsControlled: houseChairs.length,
      billsPrioritized: speakerPriorities.length,
      chamberControl: 80
    }
  });
  const votingBlocs2 = detectVotingBlocs(legislators, allCommittees, chairs);
  const powerFlows = buildPowerFlows(bigThree, chairs, viceChairs, legislators, allCommittees);
  const keyFindings = generateKeyFindings(bigThree, votingBlocs2, powerFlows, legislators, chairs);
  const partyR = legislators.filter((l) => l.party === "R").length;
  const partyD = legislators.filter((l) => l.party === "D").length;
  const report = {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    bigThree,
    votingBlocs: votingBlocs2,
    powerFlows,
    keyFindings,
    stats: {
      totalStakeholders: allStakeholders.length,
      totalCommitteeMembers: allCommittees.length,
      totalChairs: chairs.length,
      totalViceChairs: viceChairs.length,
      chamberBreakdown: { house: houseMembers.length, senate: senateMembers.length },
      partyBreakdown: { R: partyR, D: partyD, other: legislators.length - partyR - partyD },
      blocsDetected: votingBlocs2.length,
      bipartisanBlocs: votingBlocs2.filter((b) => b.bipartisan).length
    }
  };
  seedPowerCenters(bigThree).catch(
    (err) => log4.error({ err: err.message }, "failed to seed power centers")
  );
  seedVotingBlocs(votingBlocs2).catch(
    (err) => log4.error({ err: err.message }, "failed to seed voting blocs")
  );
  cachedReport = report;
  cachedAt = Date.now();
  return report;
}
async function detectGovernorPriorities() {
  const priorities = [];
  const knownPriorities = [
    { topic: "Border Security", stance: "champion", intensity: 10, evidence: "Operation Lone Star, multiple executive orders, emergency declarations" },
    { topic: "Property Tax Reform", stance: "champion", intensity: 9, evidence: "Called special sessions for property tax relief, signed HB 2/SB 2" },
    { topic: "School Choice / Education", stance: "champion", intensity: 8, evidence: "Education savings accounts, school voucher advocacy" },
    { topic: "Grid Reliability / Energy", stance: "champion", intensity: 7, evidence: "Post-Uri grid reforms, ERCOT oversight" },
    { topic: "AI & Tech Regulation", stance: "cautious", intensity: 5, evidence: "Texas AI Council creation, balanced approach" },
    { topic: "Gun Rights", stance: "champion", intensity: 7, evidence: "Constitutional carry, Second Amendment sanctuary" },
    { topic: "DEI Bans", stance: "champion", intensity: 8, evidence: "Signed SB 17 banning DEI offices at public universities" }
  ];
  const topAlertTopics = await policyIntelDb.select({
    title: alerts.title,
    cnt: count9()
  }).from(alerts).groupBy(alerts.title).orderBy(desc11(count9())).limit(20);
  for (const kp of knownPriorities) {
    const matchingAlerts = topAlertTopics.filter(
      (a) => a.title.toLowerCase().includes(kp.topic.toLowerCase().split(" ")[0].toLowerCase())
    );
    const adjustedIntensity = matchingAlerts.length > 0 ? Math.min(kp.intensity + 1, 10) : kp.intensity;
    priorities.push({ ...kp, intensity: adjustedIntensity });
  }
  return priorities;
}
async function detectChamberPriorities(chamber) {
  const priorities = [];
  const topCommitteeAlerts = await policyIntelDb.select({
    title: alerts.title,
    cnt: count9()
  }).from(alerts).groupBy(alerts.title).orderBy(desc11(count9())).limit(10);
  const topicMap = {
    "tax": "Tax Policy",
    "education": "Education",
    "border": "Border Security",
    "energy": "Energy Policy",
    "health": "Healthcare",
    "gun": "Gun Policy",
    "water": "Water Resources",
    "transport": "Transportation",
    "criminal": "Criminal Justice",
    "business": "Business & Commerce"
  };
  for (const alert of topCommitteeAlerts) {
    const title = alert.title.toLowerCase();
    for (const [keyword, topic] of Object.entries(topicMap)) {
      if (title.includes(keyword)) {
        const existing = priorities.find((p) => p.topic === topic);
        if (!existing) {
          priorities.push({
            topic,
            stance: "champion",
            intensity: Math.min(Math.ceil(Number(alert.cnt) / 100), 10),
            evidence: `${alert.cnt} alerts related to ${topic} in ${chamber} pipeline`
          });
        }
        break;
      }
    }
  }
  return priorities.slice(0, 8);
}
function findSpeaker(houseMembers, houseChairs) {
  const chairCount = /* @__PURE__ */ new Map();
  for (const ch of houseChairs) {
    const leg = houseMembers.find((m) => m.id === ch.stakeholderId);
    if (!leg) continue;
    let entry = chairCount.get(ch.stakeholderId);
    if (!entry) {
      entry = { name: leg.name, count: 0, committees: [] };
      chairCount.set(ch.stakeholderId, entry);
    }
    entry.count++;
    entry.committees.push(ch.committeeName);
  }
  for (const [, entry] of chairCount) {
    if (entry.committees.some((c) => c.toLowerCase().includes("calendars")) || entry.committees.some((c) => c.toLowerCase().includes("house administration"))) {
      return entry.name;
    }
  }
  let best = null;
  for (const [, entry] of chairCount) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best?.name ?? null;
}
function findGovernorAllies(legislators, chairs, allCommittees) {
  const allies = [];
  const govCommittees = [
    { keyword: "border", topic: "Border Security" },
    { keyword: "homeland", topic: "Homeland Security" },
    { keyword: "education", topic: "Education/School Choice" },
    { keyword: "ways", topic: "Property Tax Reform" },
    { keyword: "energy", topic: "Energy/Grid" },
    { keyword: "criminal", topic: "Criminal Justice" },
    { keyword: "state affairs", topic: "State Policy" },
    { keyword: "appropriations", topic: "Budget/Appropriations" },
    { keyword: "finance", topic: "Finance" }
  ];
  for (const { keyword, topic } of govCommittees) {
    const matchingChairs = chairs.filter(
      (c) => c.committeeName.toLowerCase().includes(keyword)
    );
    for (const ch of matchingChairs) {
      const leg = legislators.find((l) => l.id === ch.stakeholderId);
      if (leg && leg.party === "R" && !allies.find((a) => a.stakeholderId === leg.id)) {
        allies.push({
          name: leg.name,
          party: leg.party ?? "R",
          chamber: leg.chamber ?? "",
          stakeholderId: leg.id,
          reason: `Chair of ${ch.committeeName} \u2014 key to Governor's ${topic} agenda`
        });
      }
    }
  }
  return allies.slice(0, 15);
}
function findAllies(chamberMembers, chamberChairs, allCommittees, chamber) {
  const allies = [];
  const chairIds = new Set(chamberChairs.map((c) => c.stakeholderId));
  const powerCommittees = [
    "appropriations",
    "finance",
    "state affairs",
    "ways and means",
    "calendars",
    "rules",
    "judiciary",
    "criminal jurisprudence"
  ];
  for (const chair of chamberChairs) {
    const isKeyCommittee = powerCommittees.some(
      (pc) => chair.committeeName.toLowerCase().includes(pc)
    );
    if (isKeyCommittee) {
      const leg = chamberMembers.find((m) => m.id === chair.stakeholderId);
      if (leg) {
        allies.push({
          name: leg.name,
          party: leg.party ?? "R",
          chamber,
          stakeholderId: leg.id,
          reason: `Chair of ${chair.committeeName} \u2014 key power committee`
        });
      }
    }
  }
  const viceChairs = allCommittees.filter(
    (cm) => cm.role === "vice_chair" && cm.chamber === chamber
  );
  for (const vc of viceChairs.slice(0, 5)) {
    const leg = chamberMembers.find((m) => m.id === vc.stakeholderId);
    if (leg && !allies.find((a) => a.stakeholderId === leg.id)) {
      allies.push({
        name: leg.name,
        party: leg.party ?? "",
        chamber,
        stakeholderId: leg.id,
        reason: `Vice Chair of ${vc.committeeName}`
      });
    }
  }
  return allies.slice(0, 15);
}
function detectVotingBlocs(legislators, allCommittees, chairs) {
  const blocs = [];
  const committeeByName = /* @__PURE__ */ new Map();
  for (const cm of allCommittees) {
    const list = committeeByName.get(cm.committeeName) ?? [];
    list.push(cm.stakeholderId);
    committeeByName.set(cm.committeeName, list);
  }
  const pairCount = /* @__PURE__ */ new Map();
  for (const [, members] of committeeByName) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const key = [Math.min(members[i], members[j]), Math.max(members[i], members[j])].join("-");
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
      }
    }
  }
  const strongPairs = [...pairCount.entries()].filter(([, count12]) => count12 >= 2);
  const adjacency = /* @__PURE__ */ new Map();
  for (const [pair] of strongPairs) {
    const [a, b] = pair.split("-").map(Number);
    if (!adjacency.has(a)) adjacency.set(a, /* @__PURE__ */ new Set());
    if (!adjacency.has(b)) adjacency.set(b, /* @__PURE__ */ new Set());
    adjacency.get(a).add(b);
    adjacency.get(b).add(a);
  }
  const visited = /* @__PURE__ */ new Set();
  const chairSet = new Set(chairs.map((c) => c.stakeholderId));
  for (const [nodeId, neighbors] of adjacency) {
    if (visited.has(nodeId) || neighbors.size < 2) continue;
    const cluster = /* @__PURE__ */ new Set([nodeId]);
    const queue = [...neighbors];
    while (queue.length > 0 && cluster.size < 20) {
      const next = queue.shift();
      if (visited.has(next) || cluster.has(next)) continue;
      const sharedWithCluster = [...cluster].filter((c) => adjacency.get(next)?.has(c)).length;
      if (sharedWithCluster >= Math.max(1, cluster.size * 0.3)) {
        cluster.add(next);
        const nextNeighbors = adjacency.get(next);
        if (nextNeighbors) {
          for (const nn of nextNeighbors) {
            if (!cluster.has(nn) && !visited.has(nn)) queue.push(nn);
          }
        }
      }
    }
    if (cluster.size >= 3) {
      for (const id of cluster) visited.add(id);
      const members = [...cluster].map((id) => {
        const leg = legislators.find((l) => l.id === id);
        const connectionsInBloc = [...cluster].filter(
          (otherId) => otherId !== id && adjacency.get(id)?.has(otherId)
        ).length;
        return {
          stakeholderId: id,
          name: leg?.name ?? `Stakeholder #${id}`,
          party: leg?.party ?? "",
          district: leg?.district ?? void 0,
          loyalty: connectionsInBloc / (cluster.size - 1),
          isLeader: chairSet.has(id)
        };
      });
      const parties = new Set(members.map((m) => m.party).filter(Boolean));
      const bipartisan = parties.has("R") && parties.has("D");
      const chamber = legislators.find((l) => l.id === nodeId)?.chamber ?? "house";
      const memberIds = new Set(cluster);
      const sharedCommittees = [...committeeByName.entries()].filter(([, mems]) => mems.filter((m) => memberIds.has(m)).length >= 2).map(([name]) => name);
      const leader = members.find((m) => m.isLeader);
      const avgLoyalty = members.reduce((s, m) => s + m.loyalty, 0) / members.length;
      blocs.push({
        name: leader ? `${leader.name} Cohort` : `${chamber.charAt(0).toUpperCase() + chamber.slice(1)} Cohort ${blocs.length + 1}`,
        chamber,
        members: members.sort((a, b) => b.loyalty - a.loyalty),
        cohesion: avgLoyalty,
        issueAreas: sharedCommittees.slice(0, 5),
        alignedPowerCenter: chamber?.toLowerCase() === "senate" ? "Lieutenant Governor" : "Speaker",
        bipartisan,
        narrative: `${members.length}-member ${bipartisan ? "bipartisan " : ""}committee cohort in the ${chamber} centered around ${sharedCommittees.slice(0, 3).join(", ")} committee work. ${leader ? `Led by committee chair ${leader.name}.` : "No committee chair identified as leader."} Committee co-membership cohesion: ${(avgLoyalty * 100).toFixed(0)}%.`
      });
    }
  }
  return blocs.sort((a, b) => b.members.length - a.members.length);
}
function buildPowerFlows(bigThree, chairs, viceChairs, legislators, allCommittees) {
  const flows = [];
  const resolveId = (name, allSh) => {
    const match = allSh?.find?.((s) => s.name?.toLowerCase() === name?.toLowerCase());
    return match?.id ?? 0;
  };
  const gov = bigThree.find((b) => b.role === "governor");
  if (gov) {
    for (const ally of gov.allies.slice(0, 10)) {
      flows.push({
        sourceId: resolveId(gov.name, legislators),
        sourceName: gov.name,
        sourceRole: "governor",
        targetId: ally.stakeholderId,
        targetName: ally.name,
        targetRole: "ally",
        flowType: "allies_with",
        strength: 0.7,
        evidence: ally.reason
      });
    }
  }
  const ltGov = bigThree.find((b) => b.role === "lieutenant_governor");
  if (ltGov) {
    for (const ch of ltGov.committeeChairs) {
      flows.push({
        sourceId: resolveId(ltGov.name, legislators),
        sourceName: ltGov.name,
        sourceRole: "lieutenant_governor",
        targetId: ch.stakeholderId,
        targetName: ch.name,
        targetRole: `chair_${ch.committee}`,
        flowType: "appoints",
        strength: 0.9,
        evidence: `Lt Gov appoints all Senate committee chairs`
      });
    }
  }
  const speaker = bigThree.find((b) => b.role === "speaker");
  if (speaker) {
    for (const ch of speaker.committeeChairs) {
      flows.push({
        sourceId: resolveId(speaker.name, legislators),
        sourceName: speaker.name,
        sourceRole: "speaker",
        targetId: ch.stakeholderId,
        targetName: ch.name,
        targetRole: `chair_${ch.committee}`,
        flowType: "appoints",
        strength: 0.9,
        evidence: `Speaker appoints all House committee chairs`
      });
    }
  }
  for (const chair of chairs) {
    const vc = viceChairs.find(
      (v) => v.committeeName === chair.committeeName && v.chamber === chair.chamber
    );
    if (vc) {
      const chairLeg = legislators.find((l) => l.id === chair.stakeholderId);
      const vcLeg = legislators.find((l) => l.id === vc.stakeholderId);
      flows.push({
        sourceId: chair.stakeholderId,
        sourceName: chairLeg?.name ?? "Unknown",
        sourceRole: `chair`,
        targetId: vc.stakeholderId,
        targetName: vcLeg?.name ?? "Unknown",
        targetRole: `vice_chair`,
        flowType: "allies_with",
        strength: 0.7,
        evidence: `Chair and Vice Chair of ${chair.committeeName}`
      });
    }
  }
  const powerCommitteeKeywords = ["appropriations", "finance", "state affairs", "ways and means", "calendars", "rules"];
  for (const chair of chairs) {
    const isPowerCommittee = powerCommitteeKeywords.some(
      (kw) => chair.committeeName.toLowerCase().includes(kw)
    );
    if (!isPowerCommittee) continue;
    const chairLeg = legislators.find((l) => l.id === chair.stakeholderId);
    if (!chairLeg) continue;
    const members = allCommittees.filter(
      (cm) => cm.committeeName === chair.committeeName && cm.chamber === chair.chamber && cm.role === "member" && cm.stakeholderId !== chair.stakeholderId
    );
    for (const mem of members.slice(0, 5)) {
      const memLeg = legislators.find((l) => l.id === mem.stakeholderId);
      if (!memLeg) continue;
      flows.push({
        sourceId: chair.stakeholderId,
        sourceName: chairLeg.name,
        sourceRole: "chair",
        targetId: mem.stakeholderId,
        targetName: memLeg.name,
        targetRole: "member",
        flowType: "controls",
        strength: 0.5,
        evidence: `Member of ${chair.committeeName} \u2014 chair controls agenda and hearing schedule`
      });
    }
  }
  return flows;
}
function generateKeyFindings(bigThree, votingBlocs2, powerFlows, legislators, chairs) {
  const findings = [];
  const ltGov = bigThree.find((b) => b.role === "lieutenant_governor");
  const speaker = bigThree.find((b) => b.role === "speaker");
  if (ltGov) {
    findings.push(
      `Lt. Gov. ${ltGov.name} controls ${ltGov.metrics.committeeChairsControlled} Senate committee chairs \u2014 all legislation must pass through chairs he appoints.`
    );
  }
  if (speaker) {
    findings.push(
      `Speaker ${speaker.name} controls ${speaker.metrics.committeeChairsControlled} House committee chairs \u2014 the single most powerful appointment in the House.`
    );
  }
  const houseR = legislators.filter((l) => l.chamber?.toLowerCase() === "house" && l.party === "R").length;
  const houseD = legislators.filter((l) => l.chamber?.toLowerCase() === "house" && l.party === "D").length;
  const senateR = legislators.filter((l) => l.chamber?.toLowerCase() === "senate" && l.party === "R").length;
  const senateD = legislators.filter((l) => l.chamber?.toLowerCase() === "senate" && l.party === "D").length;
  const houseTotal = houseR + houseD;
  const senateTotal = senateR + senateD;
  findings.push(
    `House composition: ${houseR}R / ${houseD}D (${houseTotal} total). Senate: ${senateR}R / ${senateD}D (${senateTotal} total). Republican supermajority in both chambers.`
  );
  if (houseTotal > 0) {
    const houseTwoThirds = Math.ceil(houseTotal * 2 / 3);
    const hasHouse23 = houseR >= houseTwoThirds;
    findings.push(
      `House 2/3 threshold: ${houseTwoThirds} votes needed. GOP has ${houseR} \u2014 ${hasHouse23 ? "CAN pass constitutional amendments and override vetoes without Democratic support." : `needs ${houseTwoThirds - houseR} Democratic votes for constitutional amendments and veto overrides.`}`
    );
  }
  if (senateTotal > 0) {
    const senateTwoThirds = Math.ceil(senateTotal * 2 / 3);
    const hasSenate23 = senateR >= senateTwoThirds;
    findings.push(
      `Senate 2/3 threshold: ${senateTwoThirds} votes needed. GOP has ${senateR} \u2014 ${hasSenate23 ? "CAN pass constitutional amendments without Democratic support." : `needs ${senateTwoThirds - senateR} Democratic votes for constitutional amendments.`}`
    );
  }
  const rChairs = chairs.filter((c) => {
    const leg = legislators.find((l) => l.id === c.stakeholderId);
    return leg?.party === "R";
  }).length;
  const dChairs = chairs.filter((c) => {
    const leg = legislators.find((l) => l.id === c.stakeholderId);
    return leg?.party === "D";
  }).length;
  if (chairs.length > 0) {
    const rPct = (rChairs / chairs.length * 100).toFixed(0);
    findings.push(
      `Committee chair party split: ${rChairs}R / ${dChairs}D of ${chairs.length} chairs (${rPct}% Republican). ${dChairs > 0 ? `${dChairs} Democrat chair(s) \u2014 signals bipartisan outreach on specific committees.` : "All chairs Republican \u2014 complete party control of committee agendas."}`
    );
  }
  const bipartisanBlocs = votingBlocs2.filter((b) => b.bipartisan);
  if (bipartisanBlocs.length > 0) {
    findings.push(
      `${bipartisanBlocs.length} bipartisan voting bloc(s) detected \u2014 cross-party coalitions on ${bipartisanBlocs.map((b) => b.issueAreas.slice(0, 2).join(", ")).join("; ")}. These could swing close votes.`
    );
  }
  const largeBlocs = votingBlocs2.filter((b) => b.members.length >= 5);
  if (largeBlocs.length > 0) {
    findings.push(
      `${largeBlocs.length} significant voting bloc(s) with 5+ members. Largest: ${largeBlocs[0].name} (${largeBlocs[0].members.length} members, ${(largeBlocs[0].cohesion * 100).toFixed(0)}% cohesion).`
    );
  }
  const gov = bigThree.find((b) => b.role === "governor");
  if (gov && gov.priorities.length > 0) {
    const top3 = [...gov.priorities].sort((a, b) => b.intensity - a.intensity).slice(0, 3);
    findings.push(
      `Governor ${gov.name}'s top priorities: ${top3.map((p) => `${p.topic} (${p.intensity}/10)`).join(", ")}. Bills aligned with these are most likely to receive signature.`
    );
  }
  const appointEdges = powerFlows.filter((f) => f.flowType === "appoints").length;
  const allyEdges = powerFlows.filter((f) => f.flowType === "allies_with").length;
  const controlEdges = powerFlows.filter((f) => f.flowType === "controls").length;
  findings.push(
    `Power network: ${powerFlows.length} connections mapped \u2014 ${appointEdges} appointments, ${allyEdges} alliances, ${controlEdges} control relationships.`
  );
  return findings;
}
async function seedPowerCenters(bigThree) {
  const session = CURRENT_SESSION;
  const existingCenters = await policyIntelDb.select().from(powerCenters).where(eq17(powerCenters.session, session));
  const centerByRole = new Map(existingCenters.map((c) => [c.role, c]));
  const allExistingPriorities = await policyIntelDb.select().from(leadershipPriorities).where(eq17(leadershipPriorities.session, session));
  for (const pc of bigThree) {
    const pcData = {
      role: pc.role,
      name: pc.name,
      chamber: pc.chamber,
      party: pc.party,
      session,
      priorities: pc.priorities,
      influenceScore: pc.metrics.chamberControl,
      stats: {
        loyalistCount: pc.allies.length,
        committeeChairsAppointed: pc.metrics.committeeChairsControlled,
        billsPrioritized: pc.metrics.billsPrioritized,
        passRate: 0,
        donorOverlap: 0
      },
      updatedAt: /* @__PURE__ */ new Date()
    };
    const existing = centerByRole.get(pc.role);
    let pcId;
    if (existing) {
      await policyIntelDb.update(powerCenters).set(pcData).where(eq17(powerCenters.id, existing.id));
      pcId = existing.id;
    } else {
      const [inserted] = await policyIntelDb.insert(powerCenters).values(pcData).returning({ id: powerCenters.id });
      pcId = inserted.id;
    }
    const existingPrisForCenter = allExistingPriorities.filter((p) => p.powerCenterId === pcId);
    const existingPriByTopic = new Map(existingPrisForCenter.map((p) => [p.topic, p]));
    const newPriorities = [];
    const updatePriorities = [];
    for (const pri of pc.priorities) {
      const ex = existingPriByTopic.get(pri.topic);
      if (!ex) {
        newPriorities.push({
          powerCenterId: pcId,
          session,
          topic: pri.topic,
          stance: pri.stance,
          intensity: pri.intensity,
          evidenceType: "analysis",
          evidenceDetail: pri.evidence
        });
      } else {
        updatePriorities.push(
          policyIntelDb.update(leadershipPriorities).set({ stance: pri.stance, intensity: pri.intensity, evidenceDetail: pri.evidence, updatedAt: /* @__PURE__ */ new Date() }).where(eq17(leadershipPriorities.id, ex.id))
        );
      }
    }
    if (newPriorities.length > 0) {
      await policyIntelDb.insert(leadershipPriorities).values(newPriorities);
    }
    if (updatePriorities.length > 0) {
      await Promise.all(updatePriorities);
    }
  }
  log4.info({ count: bigThree.length }, "seeded power centers with priorities");
}
async function seedVotingBlocs(blocs) {
  const session = CURRENT_SESSION;
  const existingBlocs = await policyIntelDb.select({ id: votingBlocs.id }).from(votingBlocs).where(eq17(votingBlocs.session, session));
  if (existingBlocs.length > 0) {
    for (const eb of existingBlocs) {
      await policyIntelDb.delete(votingBlocs).where(eq17(votingBlocs.id, eb.id));
    }
  }
  for (const bloc of blocs) {
    const [inserted] = await policyIntelDb.insert(votingBlocs).values({
      name: bloc.name,
      session,
      chamber: bloc.chamber,
      detectionMethod: "committee-co-membership",
      cohesion: bloc.cohesion,
      memberCount: bloc.members.length,
      issueAreas: bloc.issueAreas,
      alignedPowerCenter: bloc.alignedPowerCenter,
      bipartisan: bloc.bipartisan,
      narrative: bloc.narrative
    }).returning({ id: votingBlocs.id });
    if (bloc.members.length > 0) {
      await policyIntelDb.insert(votingBlocMembers).values(
        bloc.members.map((m) => ({
          blocId: inserted.id,
          stakeholderId: m.stakeholderId,
          loyalty: m.loyalty,
          isLeader: m.isLeader,
          joinedSession: session
        }))
      );
    }
  }
  log4.info({ blocs: blocs.length, members: blocs.reduce((s, b) => s + b.members.length, 0) }, "seeded committee cohorts");
}
var log4, CURRENT_SESSION, CACHE_TTL_MS, cachedReport, cachedAt;
var init_power_network_analyzer = __esm({
  "server/policy-intel/engine/intelligence/power-network-analyzer.ts"() {
    "use strict";
    init_db();
    init_schema_policy_intel();
    init_schema_power_network();
    init_logger();
    log4 = createLogger("power-network");
    CURRENT_SESSION = "89R";
    CACHE_TTL_MS = 15 * 60 * 1e3;
    cachedReport = null;
    cachedAt = 0;
  }
});

// server/policy-intel/engine/intelligence/legislation-predictor.ts
var legislation_predictor_exports = {};
__export(legislation_predictor_exports, {
  predictLegislation: () => predictLegislation
});
import { eq as eq18, desc as desc12, count as count10 } from "drizzle-orm";
async function predictLegislation(force = false) {
  if (!force && cachedReport2 && Date.now() - cachedAt2 < CACHE_TTL_MS2) {
    return cachedReport2;
  }
  const allStakeholders = await policyIntelDb.select().from(stakeholders);
  const allCommittees = await policyIntelDb.select().from(committeeMembers);
  const allWatchlists = await policyIntelDb.select().from(watchlists);
  const legislators = allStakeholders.filter((s) => s.type === "legislator");
  const chairs = allCommittees.filter((cm) => cm.role === "chair");
  const alertVelocity = await policyIntelDb.select({
    watchlistId: alerts.watchlistId,
    cnt: count10()
  }).from(alerts).groupBy(alerts.watchlistId).orderBy(desc12(count10()));
  const watchlistMap = new Map(allWatchlists.map((w) => [w.id, w]));
  const hotTopics = alertVelocity.filter((av) => av.watchlistId != null && watchlistMap.has(av.watchlistId)).map((av) => ({
    watchlistName: watchlistMap.get(av.watchlistId).name,
    alertCount: Number(av.cnt),
    rules: watchlistMap.get(av.watchlistId).rulesJson
  })).slice(0, 15);
  const docCounts = await policyIntelDb.select({
    sourceType: sourceDocuments.sourceType,
    cnt: count10()
  }).from(sourceDocuments).groupBy(sourceDocuments.sourceType).orderBy(desc12(count10()));
  const totalDocs = docCounts.reduce((s, d) => s + Number(d.cnt), 0);
  const legiscanDocs = Number(docCounts.find((d) => d.sourceType === "texas_legislation")?.cnt ?? 0);
  const titleKeywordCounts = await policyIntelDb.select({
    title: sourceDocuments.title
  }).from(sourceDocuments).limit(2e3);
  const topicSignalFromDocs = (keywordMatch) => {
    const kw = keywordMatch.toLowerCase();
    const matches = titleKeywordCounts.filter(
      (d) => d.title?.toLowerCase().includes(kw)
    ).length;
    return Math.min(matches / Math.max(totalDocs * 0.01, 1), 1);
  };
  const predictions = [];
  const legislativeAgenda = buildLegislativeAgenda(legislators, chairs, allCommittees, hotTopics);
  for (const agenda of legislativeAgenda) {
    const evidence = [];
    const matchingTopic = hotTopics.find(
      (ht) => ht.watchlistName.toLowerCase().includes(agenda.keywordMatch.toLowerCase())
    );
    if (matchingTopic) {
      evidence.push({
        type: "alert_velocity",
        detail: `${matchingTopic.alertCount} alerts matching "${matchingTopic.watchlistName}" watchlist`,
        weight: Math.min(matchingTopic.alertCount / Math.max(hotTopics[0]?.alertCount ?? 1e3, 100), 1)
      });
    }
    const docSignal = topicSignalFromDocs(agenda.keywordMatch);
    if (docSignal > 0.05) {
      evidence.push({
        type: "cross_session",
        detail: `${(docSignal * 100).toFixed(0)}% of source documents reference "${agenda.keywordMatch}"`,
        weight: docSignal
      });
    }
    const likelySponsor = findLikelySponsor(
      agenda.topic,
      agenda.likelyChamber,
      legislators,
      chairs,
      allCommittees
    );
    const powerDynamic = assessPowerCenterDynamics(agenda.topic);
    const baseConfidence = agenda.baseConfidence;
    const velocityBoost = matchingTopic ? 0.1 : 0;
    const sponsorBoost = likelySponsor ? 0.05 : 0;
    const docBoost = docSignal > 0.1 ? 0.05 : 0;
    const confidence = Math.min(baseConfidence + velocityBoost + sponsorBoost + docBoost, 0.95);
    let passageProb = 0.3;
    if (powerDynamic.governor === "support") passageProb += 0.2;
    if (powerDynamic.ltGov === "support") passageProb += 0.15;
    if (powerDynamic.speaker === "support") passageProb += 0.15;
    if (powerDynamic.governor === "oppose") passageProb -= 0.25;
    if ((likelySponsor?.confidence ?? 0) > 0.5) passageProb += 0.05;
    passageProb = Math.max(0.05, Math.min(passageProb, 0.95));
    evidence.push({
      type: "leadership_priority",
      detail: `Gov: ${powerDynamic.governor}, Lt Gov: ${powerDynamic.ltGov}, Speaker: ${powerDynamic.speaker}`,
      weight: 0.8
    });
    if (likelySponsor) {
      evidence.push({
        type: "sponsor_history",
        detail: `${likelySponsor.name} (${likelySponsor.party}-${likelySponsor.chamber}) \u2014 ${likelySponsor.reasoning}`,
        weight: likelySponsor.confidence
      });
    }
    evidence.push({
      type: "historical_pattern",
      detail: agenda.historicalEvidence,
      weight: 0.6
    });
    predictions.push({
      topic: agenda.topic,
      predictedBillType: agenda.billType,
      predictedChamber: agenda.likelyChamber,
      confidence,
      passageProbability: passageProb,
      likelySponsor,
      powerCenterDynamic: powerDynamic,
      likelyCommittee: agenda.likelyCommittee,
      evidenceSources: evidence,
      assessment: generateAssessment(agenda.topic, confidence, passageProb, powerDynamic)
    });
  }
  predictions.sort((a, b) => b.confidence - a.confidence);
  const chamberConflicts = detectChamberConflicts(predictions);
  const maxAlertCount = Math.max(hotTopics[0]?.alertCount ?? 1, 1);
  const signals = hotTopics.slice(0, 10).map((ht) => ({
    type: "alert_velocity",
    detail: `"${ht.watchlistName}" \u2014 ${ht.alertCount} alerts`,
    strength: Math.min(ht.alertCount / maxAlertCount, 1)
  }));
  const highConf = predictions.filter((p) => p.confidence >= 0.7).length;
  const medConf = predictions.filter((p) => p.confidence >= 0.4 && p.confidence < 0.7).length;
  const lowConf = predictions.filter((p) => p.confidence < 0.4).length;
  const avgPassage = predictions.length > 0 ? predictions.reduce((s, p) => s + p.passageProbability, 0) / predictions.length : 0;
  const report = {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    session: CURRENT_SESSION2,
    predictions,
    mostLikelyToPass: predictions.filter((p) => p.passageProbability >= 0.6).sort((a, b) => b.passageProbability - a.passageProbability).slice(0, 5),
    likelyBlocked: predictions.filter((p) => p.powerCenterDynamic.governor === "oppose" || p.passageProbability < 0.2).slice(0, 5),
    chamberConflicts,
    signals,
    stats: {
      totalPredictions: predictions.length,
      highConfidence: highConf,
      mediumConfidence: medConf,
      lowConfidence: lowConf,
      avgPassageProbability: avgPassage
    }
  };
  seedPredictions(predictions).catch(
    (err) => log5.error({ err: err.message }, "failed to seed predictions")
  );
  cachedReport2 = report;
  cachedAt2 = Date.now();
  return report;
}
function buildLegislativeAgenda(legislators, chairs, allCommittees, hotTopics) {
  return [
    {
      topic: "Border Security Enforcement Enhancement",
      keywordMatch: "border",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Border Security",
      baseConfidence: 0.85,
      historicalEvidence: "Filed in every session since 87R. Governor's #1 priority. Operation Lone Star funding."
    },
    {
      topic: "Property Tax Relief & Appraisal Reform",
      keywordMatch: "property tax",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Ways & Means",
      baseConfidence: 0.8,
      historicalEvidence: "Major legislation in 88R (HB 2/SB 2). Continuing reform expected."
    },
    {
      topic: "Education Savings Accounts / School Choice",
      keywordMatch: "education",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Education",
      baseConfidence: 0.8,
      historicalEvidence: "Lt Gov's top priority. Failed in 88R regular session, passed in 88R special. Expansion expected."
    },
    {
      topic: "ERCOT / Grid Reliability & Energy Policy",
      keywordMatch: "energy",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Business & Commerce",
      baseConfidence: 0.75,
      historicalEvidence: "Post-Winter Storm Uri reforms ongoing. Grid reliability mandates in every session since 87R."
    },
    {
      topic: "Artificial Intelligence Regulation",
      keywordMatch: "artificial intelligence",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Innovation & Technology",
      baseConfidence: 0.7,
      historicalEvidence: "Interim charges in both chambers. TX AI Council established. First major regulation cycle."
    },
    {
      topic: "Water Infrastructure & Conservation",
      keywordMatch: "water",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Water, Agriculture & Rural Affairs",
      baseConfidence: 0.7,
      historicalEvidence: "Recurring priority. Texas Water Development Board funding. Infrastructure investment."
    },
    {
      topic: "Fentanyl Trafficking Penalties Enhancement",
      keywordMatch: "fentanyl",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Criminal Jurisprudence",
      baseConfidence: 0.7,
      historicalEvidence: "Bipartisan priority. Enhanced penalties passed 88R, further expansion expected."
    },
    {
      topic: "Healthcare / Medicaid Managed Care Reform",
      keywordMatch: "health",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Health & Human Services",
      baseConfidence: 0.65,
      historicalEvidence: "Managed care contract scrutiny. Maternal mortality reforms. Perennial topic."
    },
    {
      topic: "Transportation Infrastructure Bonds",
      keywordMatch: "transport",
      billType: "HJR",
      likelyChamber: "house",
      likelyCommittee: "Transportation",
      baseConfidence: 0.6,
      historicalEvidence: "Constitutional amendment for highway funding. Prop 1/Prop 7 lineage."
    },
    {
      topic: "Social Media / Minor Protection Online",
      keywordMatch: "social media",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "State Affairs",
      baseConfidence: 0.65,
      historicalEvidence: "HB 18 (88R) parental notification for social media. Further restrictions expected."
    },
    {
      topic: "Eminent Domain Reform",
      keywordMatch: "eminent domain",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "State Affairs",
      baseConfidence: 0.55,
      historicalEvidence: "Perennial rural Republican priority. Landowner protections iteration."
    },
    {
      topic: "State Agency Sunset Reviews",
      keywordMatch: "sunset",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "State Affairs",
      baseConfidence: 0.9,
      historicalEvidence: "Mandatory sunset cycle. Multiple agencies up for review in 89R."
    },
    {
      topic: "Cannabis / Hemp Regulation",
      keywordMatch: "cannabis",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Public Health",
      baseConfidence: 0.5,
      historicalEvidence: "Delta-8 regulation. Medical cannabis expansion. Debated but not passed in 88R."
    },
    {
      topic: "Public Education Funding Formula",
      keywordMatch: "school funding",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Public Education",
      baseConfidence: 0.75,
      historicalEvidence: "Teacher pay raises, per-pupil funding increase. Filed every session. 88R included raises."
    },
    {
      topic: "Election Integrity / Voting Procedures",
      keywordMatch: "election",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "State Affairs",
      baseConfidence: 0.7,
      historicalEvidence: "SB 1 (87R special) major voting law overhaul. Continuing refinement expected."
    }
  ];
}
function findLikelySponsor(topic, chamber, legislators, chairs, allCommittees) {
  const topicLower = topic.toLowerCase();
  const chamberChairs = chairs.filter((c) => c.chamber?.toLowerCase() === chamber);
  const committeeKeywords = {
    "border": ["border", "homeland", "state affairs"],
    "property tax": ["ways", "means", "finance", "revenue"],
    "education": ["education", "public education"],
    "energy": ["energy", "business", "commerce", "natural resources"],
    "artificial intelligence": ["innovation", "technology", "state affairs"],
    "water": ["water", "agriculture", "natural resources"],
    "fentanyl": ["criminal", "jurisprudence", "judiciary"],
    "health": ["health", "human services"],
    "transport": ["transportation"],
    "social media": ["state affairs", "innovation"],
    "eminent domain": ["state affairs", "natural resources"],
    "sunset": ["state affairs"],
    "cannabis": ["health", "public health"],
    "school funding": ["education", "public education", "appropriations"],
    "election": ["state affairs", "elections"]
  };
  for (const [keyword, committeeNames] of Object.entries(committeeKeywords)) {
    if (topicLower.includes(keyword)) {
      for (const cn of committeeNames) {
        const matchingChair = chamberChairs.find(
          (c) => c.committeeName.toLowerCase().includes(cn)
        );
        if (matchingChair) {
          const leg = legislators.find((l) => l.id === matchingChair.stakeholderId);
          if (leg) {
            return {
              stakeholderId: leg.id,
              name: leg.name,
              party: leg.party ?? "R",
              chamber: leg.chamber ?? chamber,
              confidence: 0.6,
              reasoning: `Committee chair of ${matchingChair.committeeName} \u2014 chairs typically file major legislation in their jurisdiction`
            };
          }
        }
      }
    }
  }
  return null;
}
function assessPowerCenterDynamics(topic) {
  const topicLower = topic.toLowerCase();
  const positions = {
    "border": { governor: "support", ltGov: "support", speaker: "support" },
    "property tax": { governor: "support", ltGov: "support", speaker: "support" },
    "education savings": { governor: "support", ltGov: "support", speaker: "neutral" },
    "school choice": { governor: "support", ltGov: "support", speaker: "neutral" },
    "energy": { governor: "support", ltGov: "support", speaker: "support" },
    "artificial intelligence": { governor: "neutral", ltGov: "neutral", speaker: "neutral" },
    "water": { governor: "support", ltGov: "support", speaker: "support" },
    "fentanyl": { governor: "support", ltGov: "support", speaker: "support" },
    "healthcare": { governor: "neutral", ltGov: "neutral", speaker: "neutral" },
    "transport": { governor: "support", ltGov: "support", speaker: "support" },
    "social media": { governor: "support", ltGov: "support", speaker: "support" },
    "eminent domain": { governor: "neutral", ltGov: "support", speaker: "support" },
    "sunset": { governor: "neutral", ltGov: "support", speaker: "support" },
    "cannabis": { governor: "oppose", ltGov: "oppose", speaker: "neutral" },
    "school funding": { governor: "support", ltGov: "support", speaker: "support" },
    "election": { governor: "support", ltGov: "support", speaker: "support" },
    "gun": { governor: "support", ltGov: "support", speaker: "support" },
    "dei": { governor: "support", ltGov: "support", speaker: "support" }
  };
  for (const [keyword, dynamic] of Object.entries(positions)) {
    if (topicLower.includes(keyword)) return dynamic;
  }
  return { governor: "unknown", ltGov: "unknown", speaker: "unknown" };
}
function generateAssessment(topic, confidence, passageProb, powerDynamic) {
  const allSupport = powerDynamic.governor === "support" && powerDynamic.ltGov === "support" && powerDynamic.speaker === "support";
  const hasOpposition = powerDynamic.governor === "oppose" || powerDynamic.ltGov === "oppose" || powerDynamic.speaker === "oppose";
  if (allSupport && passageProb >= 0.7) {
    return `HIGH PROBABILITY: ${topic} has all three power centers aligned in support. Expect early filing and priority committee assignment. This is a "must-pass" for leadership.`;
  }
  if (allSupport && passageProb >= 0.5) {
    return `LIKELY TO PASS: ${topic} has Big Three alignment but faces implementation complexities. Watch for amendment battles in committee.`;
  }
  if (hasOpposition) {
    return `CONTESTED: ${topic} faces opposition from at least one power center. ${powerDynamic.governor === "oppose" ? "VETO RISK \u2014 Governor opposition is the ultimate blocker." : ""} May require negotiation or narrower scope.`;
  }
  if (confidence >= 0.7) {
    return `PROBABLE FILING: Strong signals suggest ${topic} will be filed with significant support, though Big Three dynamics are still developing.`;
  }
  return `MONITORING: ${topic} shows activity signals but Big Three positions are unclear. Track committee hearing assignments for confirmation.`;
}
function detectChamberConflicts(predictions) {
  const conflicts = [];
  const knownConflicts = [
    {
      topic: "School Choice / Vouchers",
      housePosition: "Split \u2014 rural Republicans and Democrats opposed in 88R",
      senatePosition: "Strong support \u2014 Lt Gov's #1 priority",
      narrative: "The school choice debate remains the most significant House-Senate divide. Lt Gov Patrick has made this his signature issue, while rural House Republicans fear funding diversion from public schools."
    },
    {
      topic: "Property Tax Approach",
      housePosition: "Prefers homestead exemption increases and rate compression",
      senatePosition: "Prefers appraisal caps and business tax relief",
      narrative: "Both chambers support property tax relief but differ on mechanism. The House favors direct homeowner relief while the Senate pushes broader structural reforms."
    },
    {
      topic: "Cannabis / Hemp Regulation",
      housePosition: "Some bipartisan support for limited medical expansion and delta-8 regulation",
      senatePosition: "Lt Gov Patrick strongly opposes \u2014 likely dead on arrival in Senate",
      narrative: "Hemp/cannabis bills may pass the House but face near-certain death in the Senate under Patrick's leadership. This has been the pattern for three sessions."
    }
  ];
  const housePreds = predictions.filter((p) => p.predictedChamber === "house");
  const senatePreds = predictions.filter((p) => p.predictedChamber === "senate");
  for (const hp of housePreds) {
    const related = senatePreds.find(
      (sp) => sp.topic.toLowerCase().split(" ").some(
        (word) => word.length > 4 && hp.topic.toLowerCase().includes(word)
      )
    );
    if (related && Math.abs(hp.passageProbability - related.passageProbability) > 0.15) {
      const existing = knownConflicts.find(
        (kc) => kc.topic.toLowerCase().includes(hp.topic.toLowerCase().split(" ")[0])
      );
      if (!existing) {
        conflicts.push({
          topic: `${hp.topic} vs ${related.topic}`,
          housePosition: `Passage probability: ${(hp.passageProbability * 100).toFixed(0)}% \u2014 ${hp.assessment.split(".")[0]}`,
          senatePosition: `Passage probability: ${(related.passageProbability * 100).toFixed(0)}% \u2014 ${related.assessment.split(".")[0]}`,
          narrative: `Significant divergence between chambers on this topic area. House and Senate may take different approaches requiring conference committee negotiation.`
        });
      }
    }
  }
  return [...knownConflicts, ...conflicts];
}
async function seedPredictions(predictions) {
  const session = CURRENT_SESSION2;
  const existing = await policyIntelDb.select().from(legislationPredictions).where(eq18(legislationPredictions.session, session));
  const existingByTopic = new Map(existing.map((e) => [e.predictedTopic, e]));
  const inserts = [];
  const updates = [];
  for (const pred of predictions) {
    const data = {
      session,
      predictedTopic: pred.topic,
      predictedBillType: pred.predictedBillType,
      predictedChamber: pred.predictedChamber,
      predictedSponsors: pred.likelySponsor ? [{
        stakeholderId: pred.likelySponsor.stakeholderId,
        name: pred.likelySponsor.name,
        confidence: pred.likelySponsor.confidence,
        reasoning: pred.likelySponsor.reasoning
      }] : [],
      confidence: pred.confidence,
      reasoning: pred.assessment,
      evidenceSources: pred.evidenceSources,
      passageProbability: pred.passageProbability,
      powerCenterDynamic: pred.powerCenterDynamic,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const ex = existingByTopic.get(pred.topic);
    if (ex) {
      updates.push({ id: ex.id, data });
    } else {
      inserts.push(data);
    }
  }
  if (inserts.length > 0) {
    await policyIntelDb.insert(legislationPredictions).values(inserts);
  }
  if (updates.length > 0) {
    await Promise.all(
      updates.map(
        (u) => policyIntelDb.update(legislationPredictions).set(u.data).where(eq18(legislationPredictions.id, u.id))
      )
    );
  }
  log5.info({ total: predictions.length, new: inserts.length, updated: updates.length }, "persisted predictions");
}
var log5, CURRENT_SESSION2, CACHE_TTL_MS2, cachedReport2, cachedAt2;
var init_legislation_predictor = __esm({
  "server/policy-intel/engine/intelligence/legislation-predictor.ts"() {
    "use strict";
    init_db();
    init_schema_policy_intel();
    init_schema_power_network();
    init_logger();
    log5 = createLogger("legislation-predictor");
    CURRENT_SESSION2 = "89R";
    CACHE_TTL_MS2 = 15 * 60 * 1e3;
    cachedReport2 = null;
    cachedAt2 = 0;
  }
});

// server/policy-intel/services/passage-predictor-service.ts
var passage_predictor_service_exports = {};
__export(passage_predictor_service_exports, {
  autoDiscoverAndPredict: () => autoDiscoverAndPredict,
  getPredictionDashboard: () => getPredictionDashboard,
  predictBillPassage: () => predictBillPassage,
  predictBillPassageBatch: () => predictBillPassageBatch
});
import { eq as eq22, and as and14, desc as desc16, sql as sql14 } from "drizzle-orm";
function detectRegime2() {
  const now = /* @__PURE__ */ new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (year % 2 === 1 && month >= 1 && month <= 6) return "session";
  if (year % 2 === 1 && month >= 6) return "post_session";
  return "interim";
}
function classifyPrediction(probability) {
  if (probability >= 0.75) return "likely_pass";
  if (probability >= 0.55) return "lean_pass";
  if (probability >= 0.45) return "toss_up";
  if (probability >= 0.25) return "lean_fail";
  if (probability >= 0.05) return "likely_fail";
  return "dead";
}
async function detectBillStage(workspaceId, billId) {
  const normalizedBill = billId.replace(/\./g, "").toUpperCase();
  const docs = await policyIntelDb.select().from(sourceDocuments).where(
    sql14`${sourceDocuments.title} ILIKE ${"%" + normalizedBill + "%"}`
  ).orderBy(desc16(sourceDocuments.publishedAt)).limit(5);
  let stage = "introduced";
  let hearingScheduled = false;
  let bipartisan = false;
  for (const doc of docs) {
    const status = (doc.summary ?? "").toLowerCase() + " " + (doc.title ?? "").toLowerCase();
    if (status.includes("enrolled") || status.includes("signed")) stage = "enrolled";
    else if (status.includes("conference")) stage = "conference";
    else if (status.includes("floor") || status.includes("third reading") || status.includes("passed")) stage = "floor";
    else if (status.includes("committee") || status.includes("reported") || status.includes("favorable")) stage = "committee_passed";
    else if (status.includes("hearing") || status.includes("testimony")) {
      stage = "committee_hearing";
      hearingScheduled = true;
    } else if (status.includes("referred")) stage = "referred";
    if (status.includes("bipartisan") || status.includes("joint author")) bipartisan = true;
  }
  const hearings = await policyIntelDb.select().from(hearingEvents).where(
    and14(
      eq22(hearingEvents.workspaceId, workspaceId),
      sql14`${hearingEvents.description} ILIKE ${"%" + normalizedBill + "%"}`
    )
  ).limit(3);
  if (hearings.length > 0) hearingScheduled = true;
  return { stage, hearingScheduled, bipartisan };
}
async function analyzeSponsorStrength(workspaceId, billId) {
  const signals = [];
  let strength = 0.3;
  const normalizedBill = billId.replace(/\./g, "").toUpperCase();
  const relatedAlerts = await policyIntelDb.select().from(alerts).where(
    and14(
      eq22(alerts.workspaceId, workspaceId),
      sql14`${alerts.title} ILIKE ${"%" + normalizedBill + "%"}`
    )
  ).limit(10);
  const committees = await policyIntelDb.select().from(committeeMembers).limit(200);
  const chairs = committees.filter(
    (m) => m.role === "chair" || m.role === "vice_chair"
  );
  if (chairs.length > 0) {
    signals.push({
      signal: `${chairs.length} committee leadership positions identified in workspace`,
      source: "committee_analysis",
      strength: Math.min(chairs.length * 0.1, 0.3)
    });
    strength += Math.min(chairs.length * 0.05, 0.15);
  }
  if (relatedAlerts.length > 0) {
    const highRelevance = relatedAlerts.filter(
      (a) => (a.relevanceScore ?? 0) >= 70
    ).length;
    if (highRelevance > 0) {
      signals.push({
        signal: `${highRelevance} high-relevance alerts indicate strong engagement`,
        source: "alert_analysis",
        strength: Math.min(highRelevance * 0.15, 0.3)
      });
      strength += Math.min(highRelevance * 0.1, 0.2);
    }
  }
  return { strength: Math.min(strength, 1), signals };
}
async function predictBillPassage(req) {
  const { workspaceId, billId, billTitle } = req;
  if (!req.forceRefresh) {
    const [existing] = await policyIntelDb.select().from(passagePredictions).where(
      and14(
        eq22(passagePredictions.workspaceId, workspaceId),
        eq22(passagePredictions.billId, billId)
      )
    );
    if (existing) {
      const age = Date.now() - new Date(existing.lastUpdatedAt).getTime();
      const ONE_HOUR = 60 * 60 * 1e3;
      if (age < ONE_HOUR) {
        return formatPrediction(existing);
      }
    }
  }
  const [stageInfo, sponsorInfo] = await Promise.all([
    detectBillStage(workspaceId, billId),
    analyzeSponsorStrength(workspaceId, billId)
  ]);
  const regime = detectRegime2();
  let probability = 0.5;
  const riskFactors = [];
  const oppositionSignals = [];
  const stageProbabilities = {
    introduced: -0.15,
    referred: -0.1,
    committee_hearing: 0.05,
    committee_passed: 0.15,
    floor: 0.25,
    conference: 0.1,
    enrolled: 0.4
  };
  const stageAdjust = stageProbabilities[stageInfo.stage] ?? 0;
  probability += stageAdjust;
  riskFactors.push({
    factor: "Legislative Stage",
    impact: stageAdjust >= 0 ? "positive" : "negative",
    weight: Math.abs(stageAdjust),
    detail: `Bill is at "${stageInfo.stage}" stage (${stageAdjust >= 0 ? "+" : ""}${(stageAdjust * 100).toFixed(0)}% adjustment)`
  });
  if (stageInfo.hearingScheduled) {
    probability += 0.1;
    riskFactors.push({
      factor: "Hearing Scheduled",
      impact: "positive",
      weight: 0.1,
      detail: "A hearing is scheduled, indicating active consideration by committee"
    });
  }
  if (stageInfo.bipartisan) {
    probability += 0.12;
    riskFactors.push({
      factor: "Bipartisan Support",
      impact: "positive",
      weight: 0.12,
      detail: "Bipartisan co-sponsorship detected \u2014 significantly increases passage odds"
    });
  }
  const regimeAdjust = {
    session: 0.05,
    post_session: -0.2,
    interim: -0.25
  };
  const rAdj = regimeAdjust[regime] ?? 0;
  probability += rAdj;
  riskFactors.push({
    factor: "Session Timing",
    impact: rAdj >= 0 ? "positive" : "negative",
    weight: Math.abs(rAdj),
    detail: `Current regime: ${regime}. ${regime === "interim" ? "No active session \u2014 prediction is speculative." : "Active session \u2014 bills are moving."}`
  });
  probability += (sponsorInfo.strength - 0.3) * 0.3;
  riskFactors.push({
    factor: "Sponsor Strength",
    impact: sponsorInfo.strength >= 0.5 ? "positive" : sponsorInfo.strength >= 0.3 ? "neutral" : "negative",
    weight: sponsorInfo.strength,
    detail: `Sponsor coalition strength: ${(sponsorInfo.strength * 100).toFixed(0)}%`
  });
  probability = Math.max(0.01, Math.min(0.99, probability));
  const dataPoints = [
    stageInfo.stage !== "introduced" ? 1 : 0,
    stageInfo.hearingScheduled ? 1 : 0,
    sponsorInfo.signals.length > 0 ? 1 : 0,
    regime === "session" ? 1 : 0
  ];
  const confidence = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;
  const milestones = {
    introduced: { next: "Committee Referral", estimatedDays: 14 },
    referred: { next: "Committee Hearing", estimatedDays: 30 },
    committee_hearing: { next: "Committee Vote", estimatedDays: 7 },
    committee_passed: { next: "Floor Calendar", estimatedDays: 14 },
    floor: { next: "Floor Vote", estimatedDays: 7 },
    conference: { next: "Conference Report", estimatedDays: 14 },
    enrolled: { next: "Governor's Desk", estimatedDays: 10 }
  };
  const ms = milestones[stageInfo.stage];
  const nextMilestoneDate = ms ? new Date(Date.now() + ms.estimatedDays * 864e5).toISOString() : null;
  const [prevPrediction] = await policyIntelDb.select().from(passagePredictions).where(
    and14(
      eq22(passagePredictions.workspaceId, workspaceId),
      eq22(passagePredictions.billId, billId)
    )
  );
  const previousProbability = prevPrediction?.probability ?? null;
  const probabilityDelta = previousProbability !== null ? probability - previousProbability : null;
  const predictionData = {
    workspaceId,
    billId,
    billTitle: billTitle ?? prevPrediction?.billTitle ?? null,
    prediction: classifyPrediction(probability),
    probability,
    confidence,
    regime,
    currentStage: stageInfo.stage,
    nextMilestone: ms?.next ?? null,
    nextMilestoneDate: nextMilestoneDate ? new Date(nextMilestoneDate) : null,
    riskFactors,
    supportSignals: sponsorInfo.signals,
    oppositionSignals,
    historicalComps: [],
    sponsorStrength: sponsorInfo.strength,
    committeeAlignment: stageInfo.hearingScheduled ? 0.6 : 0.3,
    previousProbability,
    probabilityDelta,
    lastUpdatedAt: /* @__PURE__ */ new Date()
  };
  let stored;
  if (prevPrediction) {
    [stored] = await policyIntelDb.update(passagePredictions).set(predictionData).where(eq22(passagePredictions.id, prevPrediction.id)).returning();
  } else {
    [stored] = await policyIntelDb.insert(passagePredictions).values(predictionData).returning();
  }
  log8.info(`Predicted ${billId}: ${(probability * 100).toFixed(1)}% (${classifyPrediction(probability)})`);
  return formatPrediction(stored);
}
async function predictBillPassageBatch(req) {
  const results = [];
  for (const billId of req.billIds) {
    const result = await predictBillPassage({
      workspaceId: req.workspaceId,
      billId
    });
    results.push(result);
  }
  return results;
}
async function getPredictionDashboard(workspaceId) {
  const all = await policyIntelDb.select().from(passagePredictions).where(eq22(passagePredictions.workspaceId, workspaceId)).orderBy(desc16(passagePredictions.probability));
  const breakdown = {
    likely_pass: 0,
    lean_pass: 0,
    toss_up: 0,
    lean_fail: 0,
    likely_fail: 0,
    dead: 0
  };
  for (const p of all) {
    const pred = p.prediction;
    if (pred in breakdown) breakdown[pred]++;
  }
  const topRisks = all.filter((p) => p.probability >= 0.5).slice(0, 5).map(formatPrediction);
  const topOpportunities = all.filter((p) => p.probability < 0.5 && p.prediction !== "dead").slice(0, 5).map(formatPrediction);
  const recentChanges = all.filter((p) => p.probabilityDelta !== null && Math.abs(p.probabilityDelta ?? 0) >= 0.05).sort((a, b) => Math.abs(b.probabilityDelta ?? 0) - Math.abs(a.probabilityDelta ?? 0)).slice(0, 10).map((p) => ({
    billId: p.billId,
    billTitle: p.billTitle,
    previousProbability: p.previousProbability ?? 0,
    currentProbability: p.probability,
    delta: p.probabilityDelta ?? 0,
    direction: (p.probabilityDelta ?? 0) > 0 ? "up" : "down"
  }));
  return {
    workspaceId,
    totalTracked: all.length,
    breakdown,
    topRisks,
    topOpportunities,
    recentChanges,
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function autoDiscoverAndPredict(workspaceId) {
  const billAlerts = await policyIntelDb.select({ title: alerts.title }).from(alerts).where(eq22(alerts.workspaceId, workspaceId)).orderBy(desc16(alerts.createdAt)).limit(200);
  const billPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const discoveredBills = /* @__PURE__ */ new Set();
  for (const alert of billAlerts) {
    const matches = (alert.title ?? "").matchAll(billPattern);
    for (const m of matches) {
      discoveredBills.add(`${m[1].replace(/\./g, "")} ${m[2]}`);
    }
  }
  let predicted = 0;
  for (const billId of discoveredBills) {
    await predictBillPassage({ workspaceId, billId });
    predicted++;
  }
  return { discovered: discoveredBills.size, predicted };
}
function formatPrediction(p) {
  return {
    billId: p.billId,
    billTitle: p.billTitle,
    prediction: p.prediction,
    probability: p.probability,
    confidence: p.confidence,
    regime: p.regime,
    currentStage: p.currentStage,
    nextMilestone: p.nextMilestone,
    nextMilestoneDate: p.nextMilestoneDate?.toISOString() ?? null,
    riskFactors: p.riskFactors ?? [],
    supportSignals: p.supportSignals ?? [],
    oppositionSignals: p.oppositionSignals ?? [],
    historicalComps: p.historicalComps ?? [],
    sponsorStrength: p.sponsorStrength ?? 0,
    committeeAlignment: p.committeeAlignment ?? 0,
    trend: p.probabilityDelta === null ? null : p.probabilityDelta > 0.05 ? "improving" : p.probabilityDelta < -0.05 ? "declining" : "stable",
    lastUpdatedAt: p.lastUpdatedAt.toISOString()
  };
}
var log8;
var init_passage_predictor_service = __esm({
  "server/policy-intel/services/passage-predictor-service.ts"() {
    "use strict";
    init_db();
    init_schema_policy_intel();
    init_logger();
    log8 = createLogger("passage-predictor");
  }
});

// server/policy-intel/services/client-reporting-service.ts
var client_reporting_service_exports = {};
__export(client_reporting_service_exports, {
  createClientProfile: () => createClientProfile,
  createReportTemplate: () => createReportTemplate,
  deleteReportTemplate: () => deleteReportTemplate,
  generateExecutiveReport: () => generateExecutiveReport,
  getClientProfile: () => getClientProfile,
  getReportTemplate: () => getReportTemplate,
  listClientProfiles: () => listClientProfiles,
  listReportTemplates: () => listReportTemplates,
  updateClientProfile: () => updateClientProfile,
  updateReportTemplate: () => updateReportTemplate
});
import { eq as eq23, and as and15, desc as desc17, gte as gte12 } from "drizzle-orm";
async function createReportTemplate(req) {
  if (req.isDefault) {
    await policyIntelDb.update(reportTemplates).set({ isDefault: false }).where(
      and15(
        eq23(reportTemplates.workspaceId, req.workspaceId),
        eq23(reportTemplates.type, req.type)
      )
    );
  }
  const [created] = await policyIntelDb.insert(reportTemplates).values({
    workspaceId: req.workspaceId,
    name: req.name,
    type: req.type,
    templateMarkdown: req.templateMarkdown,
    headerHtml: req.headerHtml ?? null,
    footerHtml: req.footerHtml ?? null,
    brandConfig: req.brandConfig ?? {
      primaryColor: "#1a365d",
      accentColor: "#c53030",
      firmName: "Grace & McEwan Consulting LLC"
    },
    isDefault: req.isDefault ?? false
  }).returning();
  return created;
}
async function listReportTemplates(workspaceId, type) {
  const conditions = [eq23(reportTemplates.workspaceId, workspaceId)];
  if (type) {
    conditions.push(eq23(reportTemplates.type, type));
  }
  return policyIntelDb.select().from(reportTemplates).where(and15(...conditions)).orderBy(desc17(reportTemplates.isDefault), reportTemplates.name);
}
async function getReportTemplate(id) {
  const [template] = await policyIntelDb.select().from(reportTemplates).where(eq23(reportTemplates.id, id));
  return template ?? null;
}
async function updateReportTemplate(id, updates) {
  const setData = { updatedAt: /* @__PURE__ */ new Date() };
  if (updates.name) setData.name = updates.name;
  if (updates.templateMarkdown) setData.templateMarkdown = updates.templateMarkdown;
  if (updates.headerHtml !== void 0) setData.headerHtml = updates.headerHtml;
  if (updates.footerHtml !== void 0) setData.footerHtml = updates.footerHtml;
  if (updates.brandConfig) setData.brandConfig = updates.brandConfig;
  const [updated] = await policyIntelDb.update(reportTemplates).set(setData).where(eq23(reportTemplates.id, id)).returning();
  if (!updated) throw new Error(`Template ${id} not found`);
  return updated;
}
async function deleteReportTemplate(id) {
  await policyIntelDb.delete(reportTemplates).where(eq23(reportTemplates.id, id));
}
async function createClientProfile(data) {
  const [created] = await policyIntelDb.insert(clientProfiles).values(data).returning();
  return created;
}
async function listClientProfiles(workspaceId) {
  return policyIntelDb.select().from(clientProfiles).where(
    and15(
      eq23(clientProfiles.workspaceId, workspaceId),
      eq23(clientProfiles.isActive, true)
    )
  ).orderBy(clientProfiles.firmName);
}
async function getClientProfile(id) {
  const [profile] = await policyIntelDb.select().from(clientProfiles).where(eq23(clientProfiles.id, id));
  return profile ?? null;
}
async function updateClientProfile(id, updates) {
  const [updated] = await policyIntelDb.update(clientProfiles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq23(clientProfiles.id, id)).returning();
  if (!updated) throw new Error(`Client profile ${id} not found`);
  return updated;
}
async function generateExecutiveReport(req) {
  let profile = null;
  if (req.clientProfileId) {
    profile = await getClientProfile(req.clientProfileId);
  }
  const [template] = await policyIntelDb.select().from(reportTemplates).where(
    and15(
      eq23(reportTemplates.workspaceId, req.workspaceId),
      eq23(reportTemplates.type, "weekly_digest"),
      eq23(reportTemplates.isDefault, true)
    )
  ).limit(1);
  const now = /* @__PURE__ */ new Date();
  let periodStart;
  let periodLabel;
  switch (req.period) {
    case "daily":
      periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
      periodLabel = now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });
      break;
    case "monthly":
      periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      break;
    default:
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
      periodLabel = `Week of ${periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  const [recentAlerts, predictions, activeRooms, recentActivities] = await Promise.all([
    policyIntelDb.select().from(alerts).where(
      and15(
        eq23(alerts.workspaceId, req.workspaceId),
        gte12(alerts.createdAt, periodStart)
      )
    ).orderBy(desc17(alerts.relevanceScore)).limit(50),
    req.includePredictions !== false ? policyIntelDb.select().from(passagePredictions).where(eq23(passagePredictions.workspaceId, req.workspaceId)).orderBy(desc17(passagePredictions.probability)) : Promise.resolve([]),
    policyIntelDb.select().from(issueRooms).where(
      and15(
        eq23(issueRooms.workspaceId, req.workspaceId),
        eq23(issueRooms.status, "active")
      )
    ),
    policyIntelDb.select().from(activities).where(
      and15(
        eq23(activities.workspaceId, req.workspaceId),
        gte12(activities.createdAt, periodStart)
      )
    ).orderBy(desc17(activities.createdAt)).limit(50)
  ]);
  const firmName = profile?.firmName ?? template?.brandConfig?.firmName ?? "Grace & McEwan Consulting LLC";
  const brandColor = template?.brandConfig?.primaryColor ?? "#1a365d";
  const confidentiality = template?.brandConfig?.confidentialityNotice ?? "CONFIDENTIAL \u2014 For client use only. Do not distribute.";
  const sections = [];
  sections.push(`# Executive Legislative Intelligence Report`);
  sections.push(`## ${periodLabel}
`);
  sections.push(`**Prepared by:** ${firmName}`);
  sections.push(`**Date:** ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  if (profile) {
    sections.push(`**Prepared for:** ${profile.contactName ?? profile.firmName}`);
  }
  sections.push(`
*${confidentiality}*
`);
  sections.push(`---
`);
  sections.push(`## Executive Summary
`);
  const highPriorityAlerts = recentAlerts.filter(
    (a) => (a.relevanceScore ?? 0) >= 70
  );
  const likelyPassBills = predictions.filter(
    (p) => p.probability >= 0.6
  );
  const atRiskBills = predictions.filter(
    (p) => p.probability >= 0.4 && p.probability < 0.6
  );
  sections.push(
    `This ${req.period} report covers **${recentAlerts.length}** legislative developments, **${predictions.length}** bills under prediction monitoring, and **${activeRooms.length}** active issue rooms requiring attention.
`
  );
  if (highPriorityAlerts.length > 0) {
    sections.push(
      `\u26A0\uFE0F **${highPriorityAlerts.length}** high-priority alerts require immediate attention.
`
    );
  }
  if (predictions.length > 0 && req.includePredictions !== false) {
    sections.push(`## Bill Passage Predictions
`);
    sections.push(`| Bill | Probability | Prediction | Stage | Trend |`);
    sections.push(`|------|------------|------------|-------|-------|`);
    for (const p of predictions.slice(0, 15)) {
      const trendIcon = (p.probabilityDelta ?? 0) > 0.05 ? "\u{1F4C8}" : (p.probabilityDelta ?? 0) < -0.05 ? "\u{1F4C9}" : "\u27A1\uFE0F";
      sections.push(
        `| ${p.billId} | ${(p.probability * 100).toFixed(0)}% | ${p.prediction} | ${p.currentStage ?? "-"} | ${trendIcon} ${p.probabilityDelta !== null ? `${p.probabilityDelta > 0 ? "+" : ""}${(p.probabilityDelta * 100).toFixed(0)}%` : ""} |`
      );
    }
    sections.push("");
    if (likelyPassBills.length > 0) {
      sections.push(`### Likely to Pass (\u226560% probability)
`);
      for (const b of likelyPassBills.slice(0, 5)) {
        sections.push(
          `- **${b.billId}** (${(b.probability * 100).toFixed(0)}%) \u2014 ${b.billTitle ?? "Title pending"} \u2014 Next: ${b.nextMilestone ?? "Unknown"}`
        );
      }
      sections.push("");
    }
    if (atRiskBills.length > 0) {
      sections.push(`### Toss-Up Bills (40-60% probability)
`);
      for (const b of atRiskBills.slice(0, 5)) {
        sections.push(
          `- **${b.billId}** (${(b.probability * 100).toFixed(0)}%) \u2014 ${b.billTitle ?? "Title pending"} \u2014 Stage: ${b.currentStage ?? "Unknown"}`
        );
      }
      sections.push("");
    }
  }
  if (highPriorityAlerts.length > 0) {
    sections.push(`## High-Priority Alerts
`);
    for (const a of highPriorityAlerts.slice(0, 10)) {
      sections.push(
        `### ${a.title} (Score: ${a.relevanceScore})
`
      );
      if (a.whyItMatters) {
        sections.push(a.whyItMatters.split("\n")[0].slice(0, 500) + "\n");
      }
    }
  }
  if (activeRooms.length > 0) {
    sections.push(`## Active Issue Rooms
`);
    sections.push(`| Issue | Status | Bills | Jurisdiction |`);
    sections.push(`|-------|--------|-------|-------------|`);
    for (const room of activeRooms.slice(0, 10)) {
      const bills = room.relatedBillIds ?? [];
      sections.push(
        `| ${room.title} | ${room.status} | ${bills.join(", ") || "\u2014"} | ${room.jurisdiction ?? "TX"} |`
      );
    }
    sections.push("");
  }
  if (profile?.priorityTopics && profile.priorityTopics.length > 0) {
    sections.push(`## Your Priority Topics
`);
    for (const topic of profile.priorityTopics) {
      const topicAlerts = recentAlerts.filter(
        (a) => (a.title ?? "").toLowerCase().includes(topic.toLowerCase()) || (a.whyItMatters ?? "").toLowerCase().includes(topic.toLowerCase())
      );
      sections.push(
        `- **${topic}**: ${topicAlerts.length} alert(s) this ${req.period}` + (topicAlerts.length > 0 ? ` \u2014 Latest: ${topicAlerts[0].title}` : " \u2014 No new activity")
      );
    }
    sections.push("");
  }
  sections.push(`---
`);
  sections.push(
    `*Report generated by Act Up Policy Intelligence Platform \u2014 ${firmName}*
`
  );
  sections.push(`*${confidentiality}*`);
  const bodyMarkdown = sections.join("\n");
  const title = `Executive Report \u2014 ${periodLabel}`;
  const [stored] = await policyIntelDb.insert(deliverables).values({
    workspaceId: req.workspaceId,
    type: "weekly_digest",
    title,
    bodyMarkdown,
    generatedBy: "client-reporting-service",
    matterId: null
  }).returning();
  log9.info(`Generated executive report: ${title} (${recentAlerts.length} alerts, ${predictions.length} predictions)`);
  return {
    deliverableId: stored.id,
    title,
    bodyMarkdown,
    clientProfile: profile,
    template: template ?? null,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    period: req.period,
    stats: {
      alertsProcessed: recentAlerts.length,
      billsTracked: predictions.length,
      predictionsGenerated: predictions.filter(
        (p) => p.probability > 0
      ).length,
      issueRoomsActive: activeRooms.length
    }
  };
}
var log9;
var init_client_reporting_service = __esm({
  "server/policy-intel/services/client-reporting-service.ts"() {
    "use strict";
    init_db();
    init_schema_policy_intel();
    init_logger();
    log9 = createLogger("client-reporting");
  }
});

// server/policy-intel/services/relationship-intelligence-service.ts
var relationship_intelligence_service_exports = {};
__export(relationship_intelligence_service_exports, {
  autoDiscoverRelationships: () => autoDiscoverRelationships,
  buildNetworkGraph: () => buildNetworkGraph,
  createRelationship: () => createRelationship,
  getStakeholderDossier: () => getStakeholderDossier,
  listRelationships: () => listRelationships
});
import { eq as eq24, and as and16, desc as desc18, sql as sql16, inArray as inArray7 } from "drizzle-orm";
async function createRelationship(data) {
  const [created] = await policyIntelDb.insert(relationships).values(data).onConflictDoNothing().returning();
  if (!created) {
    const [existing] = await policyIntelDb.select().from(relationships).where(
      and16(
        eq24(relationships.fromStakeholderId, data.fromStakeholderId),
        eq24(relationships.toStakeholderId, data.toStakeholderId),
        eq24(relationships.relationshipType, data.relationshipType)
      )
    );
    if (existing) {
      const [updated] = await policyIntelDb.update(relationships).set({
        strength: data.strength ?? existing.strength,
        evidenceSummary: data.evidenceSummary ?? existing.evidenceSummary,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq24(relationships.id, existing.id)).returning();
      return updated;
    }
    throw new Error("Failed to create or find relationship");
  }
  return created;
}
async function listRelationships(workspaceId, stakeholderId) {
  const conditions = [eq24(relationships.workspaceId, workspaceId)];
  if (stakeholderId) {
    return policyIntelDb.select().from(relationships).where(
      and16(
        eq24(relationships.workspaceId, workspaceId),
        sql16`(${relationships.fromStakeholderId} = ${stakeholderId} OR ${relationships.toStakeholderId} = ${stakeholderId})`
      )
    ).orderBy(desc18(relationships.strength));
  }
  return policyIntelDb.select().from(relationships).where(and16(...conditions)).orderBy(desc18(relationships.strength));
}
async function buildNetworkGraph(workspaceId, options) {
  let rels = await policyIntelDb.select().from(relationships).where(eq24(relationships.workspaceId, workspaceId));
  if (options?.relationshipTypes?.length) {
    rels = rels.filter(
      (r) => options.relationshipTypes.includes(r.relationshipType)
    );
  }
  if (options?.minStrength) {
    rels = rels.filter((r) => r.strength >= options.minStrength);
  }
  const stakeholderIds = /* @__PURE__ */ new Set();
  for (const r of rels) {
    stakeholderIds.add(r.fromStakeholderId);
    stakeholderIds.add(r.toStakeholderId);
  }
  if (stakeholderIds.size === 0) {
    return {
      nodes: [],
      edges: [],
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        avgConnections: 0,
        mostConnected: null,
        clusters: 0
      }
    };
  }
  const allStakeholders = await policyIntelDb.select().from(stakeholders).where(inArray7(stakeholders.id, Array.from(stakeholderIds)));
  const stakeholderMap = new Map(allStakeholders.map((s) => [s.id, s]));
  const connectionCounts = /* @__PURE__ */ new Map();
  for (const r of rels) {
    connectionCounts.set(
      r.fromStakeholderId,
      (connectionCounts.get(r.fromStakeholderId) ?? 0) + 1
    );
    connectionCounts.set(
      r.toStakeholderId,
      (connectionCounts.get(r.toStakeholderId) ?? 0) + 1
    );
  }
  const nodes = Array.from(stakeholderIds).map((id) => {
    const s = stakeholderMap.get(id);
    const connCount = connectionCounts.get(id) ?? 0;
    return {
      id,
      name: s?.name ?? `Stakeholder ${id}`,
      type: s?.type ?? "unknown",
      party: s?.party ?? void 0,
      chamber: s?.chamber ?? void 0,
      role: void 0,
      influence: Math.min(connCount * 10, 100),
      connectionCount: connCount
    };
  });
  const edges = rels.map((r) => ({
    id: r.id,
    fromId: r.fromStakeholderId,
    toId: r.toStakeholderId,
    relationshipType: r.relationshipType,
    strength: r.strength,
    evidence: r.evidenceSummary
  }));
  const maxConnNode = nodes.reduce(
    (max, n) => n.connectionCount > (max?.connectionCount ?? 0) ? n : max,
    null
  );
  const visited = /* @__PURE__ */ new Set();
  let clusters = 0;
  const adjacency = /* @__PURE__ */ new Map();
  for (const r of rels) {
    if (!adjacency.has(r.fromStakeholderId))
      adjacency.set(r.fromStakeholderId, []);
    if (!adjacency.has(r.toStakeholderId))
      adjacency.set(r.toStakeholderId, []);
    adjacency.get(r.fromStakeholderId).push(r.toStakeholderId);
    adjacency.get(r.toStakeholderId).push(r.fromStakeholderId);
  }
  for (const id of stakeholderIds) {
    if (visited.has(id)) continue;
    clusters++;
    const queue = [id];
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      const neighbors = adjacency.get(current) ?? [];
      for (const n of neighbors) {
        if (!visited.has(n)) queue.push(n);
      }
    }
  }
  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgConnections: nodes.length > 0 ? nodes.reduce((s, n) => s + n.connectionCount, 0) / nodes.length : 0,
      mostConnected: maxConnNode ? { name: maxConnNode.name, connections: maxConnNode.connectionCount } : null,
      clusters
    }
  };
}
async function getStakeholderDossier(workspaceId, stakeholderId) {
  const [s] = await policyIntelDb.select().from(stakeholders).where(eq24(stakeholders.id, stakeholderId));
  if (!s) throw new Error(`Stakeholder ${stakeholderId} not found`);
  const rels = await policyIntelDb.select().from(relationships).where(
    and16(
      eq24(relationships.workspaceId, workspaceId),
      sql16`(${relationships.fromStakeholderId} = ${stakeholderId} OR ${relationships.toStakeholderId} = ${stakeholderId})`
    )
  ).orderBy(desc18(relationships.strength));
  const relatedIds = /* @__PURE__ */ new Set();
  for (const r of rels) {
    relatedIds.add(
      r.fromStakeholderId === stakeholderId ? r.toStakeholderId : r.fromStakeholderId
    );
  }
  const relatedStakeholders = relatedIds.size > 0 ? await policyIntelDb.select().from(stakeholders).where(inArray7(stakeholders.id, Array.from(relatedIds))) : [];
  const relMap = new Map(relatedStakeholders.map((rs) => [rs.id, rs]));
  const observations = await policyIntelDb.select().from(stakeholderObservations).where(eq24(stakeholderObservations.stakeholderId, stakeholderId)).orderBy(desc18(stakeholderObservations.createdAt)).limit(20);
  const committees = await policyIntelDb.select().from(committeeMembers).where(
    eq24(committeeMembers.stakeholderId, stakeholderId)
  );
  const billAlerts = await policyIntelDb.select().from(alerts).where(
    and16(
      eq24(alerts.workspaceId, workspaceId),
      sql16`${alerts.title} ILIKE ${"%" + s.name + "%"}`
    )
  ).limit(20);
  const billPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?)\s*(\d+)\b/gi;
  const billConnections = [];
  const seenBills = /* @__PURE__ */ new Set();
  for (const a of billAlerts) {
    const matches = (a.title ?? "").matchAll(billPattern);
    for (const m of matches) {
      const bId = `${m[1].replace(/\./g, "")} ${m[2]}`;
      if (seenBills.has(bId)) continue;
      seenBills.add(bId);
      billConnections.push({
        billId: bId,
        role: "associated",
        alert: { title: a.title ?? "", score: a.relevanceScore ?? 0 }
      });
    }
  }
  const influenceScore = Math.min(
    100,
    rels.length * 5 + committees.filter((c) => c.role === "chair" || c.role === "vice_chair").length * 20 + committees.length * 3 + Math.min(observations.length, 10) * 2
  );
  return {
    stakeholder: {
      id: s.id,
      name: s.name,
      type: s.type,
      party: s.party ?? void 0,
      chamber: s.chamber ?? void 0,
      district: s.district ?? void 0,
      role: void 0
    },
    relationships: rels.map((r) => {
      const otherId = r.fromStakeholderId === stakeholderId ? r.toStakeholderId : r.fromStakeholderId;
      const other = relMap.get(otherId);
      return {
        relatedStakeholder: {
          id: otherId,
          name: other?.name ?? `Stakeholder ${otherId}`,
          type: other?.type ?? "unknown"
        },
        type: r.relationshipType,
        strength: r.strength,
        evidence: r.evidenceSummary
      };
    }),
    observations: observations.map((o) => ({
      type: o.confidence,
      summary: o.observationText,
      date: o.createdAt.toISOString()
    })),
    committees: committees.map((c) => ({
      committee: c.committeeName,
      role: c.role ?? "member",
      chamber: c.chamber
    })),
    billConnections,
    influenceScore,
    reachability: relatedIds.size
  };
}
async function autoDiscoverRelationships(workspaceId) {
  let created = 0;
  const allWorkspaceStakeholders = await policyIntelDb.select({ id: stakeholders.id }).from(stakeholders).where(eq24(stakeholders.workspaceId, workspaceId));
  const wsStakeholderIds = new Set(allWorkspaceStakeholders.map((s) => s.id));
  const members = (await policyIntelDb.select().from(committeeMembers)).filter((m) => wsStakeholderIds.has(m.stakeholderId));
  const committeeGroups = /* @__PURE__ */ new Map();
  for (const m of members) {
    if (!committeeGroups.has(m.committeeName))
      committeeGroups.set(m.committeeName, []);
    committeeGroups.get(m.committeeName).push(m.stakeholderId);
  }
  for (const [committee, memberIds] of committeeGroups) {
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        try {
          await createRelationship({
            workspaceId,
            fromStakeholderId: memberIds[i],
            toStakeholderId: memberIds[j],
            relationshipType: "committee_together",
            strength: 0.4,
            evidenceSummary: `Both serve on ${committee}`
          });
          created++;
        } catch {
        }
      }
    }
  }
  const allAlerts = await policyIntelDb.select().from(alerts).where(eq24(alerts.workspaceId, workspaceId)).limit(500);
  const allStakeholderNames = await policyIntelDb.select({ id: stakeholders.id, name: stakeholders.name }).from(stakeholders).where(eq24(stakeholders.workspaceId, workspaceId));
  const coOccurrences = /* @__PURE__ */ new Map();
  for (const alert of allAlerts) {
    const text3 = `${alert.title ?? ""} ${alert.whyItMatters ?? ""}`.toLowerCase();
    const mentioned = allStakeholderNames.filter(
      (s) => text3.includes(s.name.toLowerCase())
    );
    for (let i = 0; i < mentioned.length; i++) {
      for (let j = i + 1; j < mentioned.length; j++) {
        const key = [mentioned[i].id, mentioned[j].id].sort().join("-");
        coOccurrences.set(key, (coOccurrences.get(key) ?? 0) + 1);
      }
    }
  }
  for (const [key, count12] of coOccurrences) {
    if (count12 < 2) continue;
    const [fromId, toId] = key.split("-").map(Number);
    try {
      await createRelationship({
        workspaceId,
        fromStakeholderId: fromId,
        toStakeholderId: toId,
        relationshipType: "ally",
        strength: Math.min(count12 * 0.15, 0.9),
        evidenceSummary: `Co-mentioned in ${count12} legislative alerts`
      });
      created++;
    } catch {
    }
  }
  log10.info(`Auto-discovered relationships: ${created} created for workspace ${workspaceId}`);
  return { discovered: coOccurrences.size + committeeGroups.size, created };
}
var log10;
var init_relationship_intelligence_service = __esm({
  "server/policy-intel/services/relationship-intelligence-service.ts"() {
    "use strict";
    init_db();
    init_schema_policy_intel();
    init_logger();
    log10 = createLogger("relationship-intelligence");
  }
});

// server/policy-intel/services/session-lifecycle-service.ts
var session_lifecycle_service_exports = {};
__export(session_lifecycle_service_exports, {
  createClientAction: () => createClientAction,
  createMilestone: () => createMilestone,
  createSession: () => createSession,
  executePhaseTransition: () => executePhaseTransition,
  generatePhaseTransitionPlan: () => generatePhaseTransitionPlan,
  getActiveSession: () => getActiveSession,
  getSessionDashboard: () => getSessionDashboard,
  initializeTexasSession: () => initializeTexasSession,
  listClientActions: () => listClientActions,
  listMilestones: () => listMilestones,
  listSessions: () => listSessions,
  updateClientAction: () => updateClientAction,
  updateMilestoneStatus: () => updateMilestoneStatus,
  updateSessionPhase: () => updateSessionPhase
});
import { eq as eq25, and as and17, desc as desc19, lte as lte3 } from "drizzle-orm";
async function createSession(data) {
  const [created] = await policyIntelDb.insert(legislativeSessions).values(data).returning();
  return created;
}
async function getActiveSession(workspaceId) {
  const [session] = await policyIntelDb.select().from(legislativeSessions).where(
    and17(
      eq25(legislativeSessions.workspaceId, workspaceId),
      eq25(legislativeSessions.isActive, true)
    )
  ).orderBy(desc19(legislativeSessions.sessionNumber)).limit(1);
  return session ?? null;
}
async function listSessions(workspaceId) {
  return policyIntelDb.select().from(legislativeSessions).where(eq25(legislativeSessions.workspaceId, workspaceId)).orderBy(desc19(legislativeSessions.sessionNumber));
}
async function updateSessionPhase(sessionId, phase) {
  const [updated] = await policyIntelDb.update(legislativeSessions).set({ currentPhase: phase, updatedAt: /* @__PURE__ */ new Date() }).where(eq25(legislativeSessions.id, sessionId)).returning();
  if (!updated) throw new Error(`Session ${sessionId} not found`);
  log11.info(`Session ${sessionId} phase updated to: ${phase}`);
  return updated;
}
async function createMilestone(data) {
  const [created] = await policyIntelDb.insert(sessionMilestones).values(data).returning();
  return created;
}
async function listMilestones(sessionId, phase) {
  const conditions = [eq25(sessionMilestones.sessionId, sessionId)];
  if (phase) {
    conditions.push(eq25(sessionMilestones.phase, phase));
  }
  return policyIntelDb.select().from(sessionMilestones).where(and17(...conditions)).orderBy(sessionMilestones.dueDate);
}
async function updateMilestoneStatus(milestoneId, status) {
  const setData = {
    status,
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (status === "completed") {
    setData.completedAt = /* @__PURE__ */ new Date();
  }
  const [updated] = await policyIntelDb.update(sessionMilestones).set(setData).where(eq25(sessionMilestones.id, milestoneId)).returning();
  if (!updated) throw new Error(`Milestone ${milestoneId} not found`);
  return updated;
}
async function createClientAction(data) {
  const [created] = await policyIntelDb.insert(clientActions).values(data).returning();
  return created;
}
async function listClientActions(workspaceId, filters) {
  const conditions = [eq25(clientActions.workspaceId, workspaceId)];
  if (filters?.status) {
    conditions.push(eq25(clientActions.status, filters.status));
  }
  if (filters?.matterId) {
    conditions.push(eq25(clientActions.matterId, filters.matterId));
  }
  if (filters?.assignee) {
    conditions.push(eq25(clientActions.assignee, filters.assignee));
  }
  if (filters?.dueBefore) {
    conditions.push(lte3(clientActions.dueDate, filters.dueBefore));
  }
  return policyIntelDb.select().from(clientActions).where(and17(...conditions)).orderBy(clientActions.dueDate);
}
async function updateClientAction(actionId, updates) {
  const setData = { ...updates, updatedAt: /* @__PURE__ */ new Date() };
  if (updates.status === "completed") {
    setData.completedAt = /* @__PURE__ */ new Date();
  }
  const [updated] = await policyIntelDb.update(clientActions).set(setData).where(eq25(clientActions.id, actionId)).returning();
  if (!updated) throw new Error(`Client action ${actionId} not found`);
  return updated;
}
async function getSessionDashboard(workspaceId) {
  const session = await getActiveSession(workspaceId);
  if (!session) return null;
  const now = /* @__PURE__ */ new Date();
  const [milestones, actions] = await Promise.all([
    listMilestones(session.id),
    listClientActions(workspaceId)
  ]);
  const upcomingMilestones = milestones.filter(
    (m) => m.status === "upcoming" && new Date(m.dueDate) > now
  );
  const overdueMilestones = milestones.filter(
    (m) => (m.status === "upcoming" || m.status === "in_progress") && new Date(m.dueDate) < now
  );
  const activeActions = actions.filter(
    (a) => a.status === "pending" || a.status === "in_progress"
  );
  const daysRemaining = session.endDate ? Math.max(
    0,
    Math.ceil(
      (new Date(session.endDate).getTime() - now.getTime()) / (1e3 * 60 * 60 * 24)
    )
  ) : null;
  const phaseGuidance = generatePhaseGuidance(
    session.currentPhase,
    daysRemaining,
    overdueMilestones.length,
    activeActions.length
  );
  return {
    session,
    currentPhase: session.currentPhase,
    daysRemaining,
    milestones,
    upcomingMilestones,
    overdueMilestones,
    activeActions,
    phaseGuidance,
    stats: {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter((m) => m.status === "completed").length,
      totalActions: actions.length,
      completedActions: actions.filter((a) => a.status === "completed").length,
      pendingActions: activeActions.length
    }
  };
}
async function generatePhaseTransitionPlan(workspaceId, toPhase) {
  const session = await getActiveSession(workspaceId);
  if (!session) throw new Error("No active session");
  const fromPhase = session.currentPhase;
  const planTemplates = {
    pre_filing: {
      briefing: "**Pre-Filing Period** \u2014 Bill drafts are being prepared. This is the critical window for:\n- Identifying client priority issues and potential legislation\n- Building coalitions before bills are officially filed\n- Scheduling meetings with committee chairs and key sponsors\n- Preparing testimony and position papers\n",
      tasks: [
        { actionType: "client_briefing", title: "Client priority intake meeting", priority: "high" },
        { actionType: "coalition_outreach", title: "Pre-session coalition building", priority: "high" },
        { actionType: "legislator_meeting", title: "Key sponsor meetings", priority: "medium" },
        { actionType: "opposition_research", title: "Opposition landscape analysis", priority: "medium" }
      ],
      milestones: [
        { title: "Client priorities finalized", phase: "pre_filing" },
        { title: "Watchlists configured", phase: "pre_filing" },
        { title: "Key legislator meetings scheduled", phase: "pre_filing" }
      ]
    },
    filing_period: {
      briefing: "**Filing Period** \u2014 Bills are being officially filed. Critical activities:\n- Monitor every bill filing for client-relevant legislation\n- Run immediate passage probability analysis on new filings\n- Track companion bills (House/Senate versions)\n- Alert clients on high-priority new filings within 24 hours\n",
      tasks: [
        { actionType: "client_briefing", title: "Daily new filing briefings", priority: "critical" },
        { actionType: "opposition_research", title: "Track adverse filings", priority: "high" },
        { actionType: "amendment_draft", title: "Draft amendment language for priority bills", priority: "high" }
      ],
      milestones: [
        { title: "All priority bills identified and tracked", phase: "filing_period" },
        { title: "Passage predictions live for all tracked bills", phase: "filing_period" }
      ]
    },
    committee_hearings: {
      briefing: "**Committee Hearings** \u2014 Bills are being heard. Maximum engagement required:\n- Prepare testimony for every relevant hearing\n- Coordinate witnesses and stakeholders\n- Monitor committee substitutes and amendments\n- Real-time briefing from hearing outcomes\n",
      tasks: [
        { actionType: "testimony_prep", title: "Prepare hearing testimony", priority: "critical" },
        { actionType: "witness_coordination", title: "Coordinate hearing witnesses", priority: "high" },
        { actionType: "client_briefing", title: "Post-hearing client briefings", priority: "high" },
        { actionType: "amendment_draft", title: "Monitor committee substitutes", priority: "medium" }
      ],
      milestones: [
        { title: "All priority bill hearings attended", phase: "committee_hearings" },
        { title: "Committee vote tracking active", phase: "committee_hearings" }
      ]
    },
    floor_action: {
      briefing: "**Floor Action** \u2014 Bills are being debated and voted on. Fast-paced environment:\n- Real-time floor vote monitoring\n- Track amendments offered on the floor\n- Emergency client alerts for unexpected votes\n- Prepare conference committee contingencies\n",
      tasks: [
        { actionType: "client_briefing", title: "Real-time floor action updates", priority: "critical" },
        { actionType: "strategy_pivot", title: "Assess floor amendment impacts", priority: "high" },
        { actionType: "grassroots_activation", title: "Grassroots activation if needed", priority: "medium" }
      ],
      milestones: [
        { title: "Floor calendar monitoring active", phase: "floor_action" },
        { title: "Conference committee preparations ready", phase: "floor_action" }
      ]
    },
    post_session: {
      briefing: "**Post-Session** \u2014 Session has ended. Time for assessment and preparation:\n- Generate final session reports for clients\n- Track governor action on enrolled bills\n- Begin interim charge monitoring\n- Plan advocacy strategy for next session\n",
      tasks: [
        { actionType: "client_briefing", title: "Final session report for clients", priority: "high" },
        { actionType: "strategy_pivot", title: "Next session strategy planning", priority: "medium" },
        { actionType: "opposition_research", title: "Interim charge analysis", priority: "medium" }
      ],
      milestones: [
        { title: "Governor action tracking complete", phase: "post_session" },
        { title: "Client session reports delivered", phase: "post_session" },
        { title: "Interim charge monitoring started", phase: "post_session" }
      ]
    }
  };
  const plan = planTemplates[toPhase] ?? {
    briefing: `Transitioning to ${toPhase} phase.`,
    tasks: [],
    milestones: []
  };
  const now = /* @__PURE__ */ new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1e3);
  const generatedTasks = plan.tasks.map(
    (t) => ({
      workspaceId,
      actionType: t.actionType,
      title: t.title,
      status: "pending",
      priority: t.priority,
      dueDate: twoWeeks
    })
  );
  const generatedMilestones = plan.milestones.map((m) => ({
    sessionId: session.id,
    title: m.title,
    phase: m.phase,
    dueDate: twoWeeks,
    status: "upcoming"
  }));
  return {
    fromPhase,
    toPhase,
    generatedTasks,
    milestones: generatedMilestones,
    briefing: plan.briefing
  };
}
async function executePhaseTransition(workspaceId, toPhase) {
  const plan = await generatePhaseTransitionPlan(workspaceId, toPhase);
  const session = await getActiveSession(workspaceId);
  if (!session) throw new Error("No active session");
  const updatedSession = await updateSessionPhase(session.id, toPhase);
  let tasksCreated = 0;
  for (const task of plan.generatedTasks) {
    await createClientAction(task);
    tasksCreated++;
  }
  let milestonesCreated = 0;
  for (const milestone of plan.milestones) {
    await createMilestone(milestone);
    milestonesCreated++;
  }
  log11.info(
    `Phase transition: ${plan.fromPhase} \u2192 ${toPhase} | ${tasksCreated} tasks, ${milestonesCreated} milestones created`
  );
  return { session: updatedSession, tasksCreated, milestonesCreated };
}
function generatePhaseGuidance(currentPhase, daysRemaining, overdueCount, pendingActions) {
  const phaseDescriptions = {
    interim: "The Legislature is not in session. Focus on interim charge monitoring, relationship building, and preparing client advocacy strategies for the next session.",
    pre_filing: "Bill drafts are being prepared. This is the most strategic window \u2014 work with sponsors on bill language, build coalitions, and prepare clients.",
    filing_period: "Bills are being officially filed. Monitor every filing for client-relevant legislation and run immediate analysis on new filings.",
    committee_hearings: "Bills are being heard in committee. Prepare testimony, coordinate witnesses, and track committee substitutes and amendments.",
    floor_action: "Bills are being debated on the floor. Fast-paced environment requiring real-time monitoring, emergency alerts, and strategic response.",
    conference: "Conference committees are reconciling House and Senate versions. Track compromise language and assess impacts on client positions.",
    enrollment: "Bills are being enrolled and sent to the Governor. Track signing and veto dynamics.",
    post_session: "Session has ended. Generate final reports, track governor action, and begin planning for the next session.",
    special_session: "Special session is active. Limited agenda but high intensity. Focus on the Governor's call items."
  };
  const phaseOrder = [
    "interim",
    "pre_filing",
    "filing_period",
    "committee_hearings",
    "floor_action",
    "conference",
    "enrollment",
    "post_session"
  ];
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const nextPhase = currentIdx >= 0 && currentIdx < phaseOrder.length - 1 ? phaseOrder[currentIdx + 1] : null;
  const warnings = [];
  if (overdueCount > 0) {
    warnings.push(`${overdueCount} milestone(s) are overdue \u2014 immediate attention required`);
  }
  if (daysRemaining !== null && daysRemaining < 30) {
    warnings.push(`Only ${daysRemaining} days remaining in session`);
  }
  if (pendingActions > 10) {
    warnings.push(`${pendingActions} pending actions \u2014 consider prioritization review`);
  }
  const keyPriorities = [];
  switch (currentPhase) {
    case "interim":
      keyPriorities.push("Monitor interim charges");
      keyPriorities.push("Build legislator relationships");
      keyPriorities.push("Update client priority matrices");
      break;
    case "pre_filing":
      keyPriorities.push("Finalize client priorities");
      keyPriorities.push("Configure bill watchlists");
      keyPriorities.push("Schedule key legislator meetings");
      break;
    case "filing_period":
      keyPriorities.push("Track all new filings daily");
      keyPriorities.push("Run passage predictions on priority bills");
      keyPriorities.push("Alert clients on adverse filings within 24 hours");
      break;
    case "committee_hearings":
      keyPriorities.push("Prepare and deliver testimony");
      keyPriorities.push("Track committee votes and substitutes");
      keyPriorities.push("Brief clients after every key hearing");
      break;
    case "floor_action":
      keyPriorities.push("Monitor floor calendar daily");
      keyPriorities.push("Track floor amendments in real-time");
      keyPriorities.push("Emergency alerts for unexpected developments");
      break;
    default:
      keyPriorities.push("Review current phase objectives");
  }
  return {
    currentPhaseDescription: phaseDescriptions[currentPhase] ?? `Phase: ${currentPhase}`,
    nextPhase,
    nextPhaseDate: null,
    keyPriorities,
    warnings
  };
}
async function initializeTexasSession(workspaceId, sessionNumber = 89) {
  const existing = await getActiveSession(workspaceId);
  if (existing && existing.sessionNumber === sessionNumber) {
    const milestones = await listMilestones(existing.id);
    return { session: existing, milestones };
  }
  const session = await createSession({
    workspaceId,
    sessionNumber,
    sessionType: "regular",
    startDate: /* @__PURE__ */ new Date("2025-01-14"),
    // 89R start date
    endDate: /* @__PURE__ */ new Date("2025-06-02"),
    // sine die
    currentPhase: "committee_hearings",
    // current phase as of mid-2025
    isActive: true
  });
  const standardMilestones = [
    { title: "Session Convenes", phase: "filing_period", dueDate: /* @__PURE__ */ new Date("2025-01-14") },
    { title: "Bill Filing Deadline (60-day)", phase: "filing_period", dueDate: /* @__PURE__ */ new Date("2025-03-14") },
    { title: "Committee Hearing Deadline", phase: "committee_hearings", dueDate: /* @__PURE__ */ new Date("2025-04-30") },
    { title: "House Floor Deadline", phase: "floor_action", dueDate: /* @__PURE__ */ new Date("2025-05-09") },
    { title: "Senate Floor Deadline", phase: "floor_action", dueDate: /* @__PURE__ */ new Date("2025-05-16") },
    { title: "Conference Committee Deadline", phase: "conference", dueDate: /* @__PURE__ */ new Date("2025-05-26") },
    { title: "Sine Die", phase: "enrollment", dueDate: /* @__PURE__ */ new Date("2025-06-02") },
    { title: "Governor Signing Deadline", phase: "post_session", dueDate: /* @__PURE__ */ new Date("2025-06-22") }
  ];
  const createdMilestones = [];
  for (const m of standardMilestones) {
    const now = /* @__PURE__ */ new Date();
    const status = m.dueDate && m.dueDate < now ? "completed" : "upcoming";
    const created = await createMilestone({
      sessionId: session.id,
      title: m.title,
      phase: m.phase,
      dueDate: m.dueDate,
      status
    });
    createdMilestones.push(created);
  }
  log11.info(
    `Initialized Texas ${sessionNumber}R session with ${createdMilestones.length} milestones`
  );
  return { session, milestones: createdMilestones };
}
var log11;
var init_session_lifecycle_service = __esm({
  "server/policy-intel/services/session-lifecycle-service.ts"() {
    "use strict";
    init_db();
    init_schema_policy_intel();
    init_logger();
    log11 = createLogger("session-lifecycle");
  }
});

// server/policy-intel/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// server/policy-intel/routes.ts
init_db();
init_schema_policy_intel();
import { Router } from "express";
import { and as and18, count as count11, desc as desc20, eq as eq26, gt as gt2, gte as gte15, ilike as ilike6, inArray as inArray8, lt, or as or2, sql as sql18 } from "drizzle-orm";

// server/policy-intel/seed/grace-mcewan.ts
init_db();
init_schema_policy_intel();
import { and, eq } from "drizzle-orm";
async function seedGraceMcEwan() {
  let workspace;
  const existing = await policyIntelDb.select({ id: workspaces.id, slug: workspaces.slug }).from(workspaces).where(eq(workspaces.slug, "grace-mcewan"));
  if (existing.length > 0) {
    workspace = existing[0];
  } else {
    const [created] = await policyIntelDb.insert(workspaces).values({
      slug: "grace-mcewan",
      name: "Grace & McEwan LLC",
      jurisdictionScope: "texas_houston"
    }).returning({ id: workspaces.id, slug: workspaces.slug });
    workspace = created;
  }
  const watchlistDefs = [
    {
      name: "Transportation / Infrastructure / Mobility",
      topic: "transportation",
      description: "TxDOT, METRO, freight corridors, mobility projects, and road/transit procurement in Texas and Houston.",
      rulesJson: {
        keywords: [
          "TxDOT",
          "METRO",
          "freight",
          "mobility",
          "right-of-way",
          "procurement",
          "highway",
          "tollway",
          "transit",
          "infrastructure",
          "SH 288",
          "US 290",
          "Loop 610",
          "Beltway 8",
          "I-45",
          "corridor"
        ],
        committees: ["Transportation"],
        agencies: ["TxDOT", "METRO", "TTC"],
        jurisdictions: ["texas", "houston", "harris_county"],
        billPrefixes: ["HB", "SB"]
      }
    },
    {
      name: "Houston Local Government / Procurement",
      topic: "local_government",
      description: "Houston City Council, Harris County, METRO board, and local procurement actions relevant to firm clients.",
      rulesJson: {
        keywords: [
          "Houston City Council",
          "HCCC",
          "Harris County",
          "Beacon",
          "city contracts",
          "METRO board",
          "procurement",
          "RFP",
          "RFQ",
          "vendor",
          "contract award",
          "public improvement district",
          "PID",
          "TIF"
        ],
        committees: ["Municipal Affairs", "Local Government"],
        agencies: ["City of Houston", "Harris County", "METRO"],
        jurisdictions: ["houston", "harris_county"],
        billPrefixes: ["HB", "SB"]
      }
    },
    {
      name: "Workforce / Education / Technology",
      topic: "workforce_edtech",
      description: "TEA, workforce development, broadband, AI policy, and economic development initiatives in Texas.",
      rulesJson: {
        keywords: [
          "TEA",
          "workforce",
          "education",
          "AI",
          "artificial intelligence",
          "technology",
          "broadband",
          "economic development",
          "STEM",
          "apprenticeship",
          "career and technical",
          "CTE",
          "data privacy",
          "cybersecurity",
          "innovation",
          "startup"
        ],
        committees: ["Education", "Technology", "Economic Development"],
        agencies: ["TEA", "TWC", "TexasEDC"],
        jurisdictions: ["texas"],
        billPrefixes: ["HB", "SB"]
      }
    }
  ];
  const watchlistIds = [];
  for (const def of watchlistDefs) {
    const existing2 = await policyIntelDb.select({ id: watchlists.id }).from(watchlists).where(eq(watchlists.name, def.name));
    if (existing2.length > 0) {
      watchlistIds.push(existing2[0].id);
      continue;
    }
    const [created] = await policyIntelDb.insert(watchlists).values({
      workspaceId: workspace.id,
      name: def.name,
      topic: def.topic,
      description: def.description,
      rulesJson: def.rulesJson,
      isActive: true
    }).returning({ id: watchlists.id });
    watchlistIds.push(created.id);
  }
  const matterDefs = [
    {
      slug: "txdot-mobility-89r",
      name: "TxDOT & Mobility \u2014 89th Legislature",
      clientName: "Grace & McEwan (internal)",
      practiceArea: "Transportation & Infrastructure",
      description: "Monitoring all 89R bills, hearings, and agency actions related to TxDOT, METRO, and Texas mobility corridor projects.",
      tagsJson: ["txdot", "metro", "89R", "transportation"],
      linkWatchlist: "Transportation / Infrastructure / Mobility"
    },
    {
      slug: "houston-procurement-89r",
      name: "Houston & Harris County Procurement",
      clientName: "Grace & McEwan (internal)",
      practiceArea: "Local Government Affairs",
      description: "Track City of Houston, Harris County, and METRO procurement opportunities and policy actions.",
      tagsJson: ["houston", "procurement", "harris_county"],
      linkWatchlist: "Houston Local Government / Procurement"
    },
    {
      slug: "workforce-edtech-89r",
      name: "Workforce & EdTech \u2014 89th Legislature",
      clientName: "Grace & McEwan (internal)",
      practiceArea: "Education & Technology Policy",
      description: "Monitor TEA, workforce, broadband, AI policy, and economic development initiatives for the 89th Legislature.",
      tagsJson: ["workforce", "education", "AI", "89R"],
      linkWatchlist: "Workforce / Education / Technology"
    }
  ];
  const matterIds = [];
  for (const def of matterDefs) {
    const existingMatter = await policyIntelDb.select({ id: matters.id }).from(matters).where(and(eq(matters.workspaceId, workspace.id), eq(matters.slug, def.slug)));
    let matterId;
    if (existingMatter.length > 0) {
      matterId = existingMatter[0].id;
    } else {
      const [created] = await policyIntelDb.insert(matters).values({
        workspaceId: workspace.id,
        slug: def.slug,
        name: def.name,
        clientName: def.clientName,
        practiceArea: def.practiceArea,
        description: def.description,
        tagsJson: def.tagsJson
      }).returning({ id: matters.id });
      matterId = created.id;
    }
    matterIds.push(matterId);
    const targetWl = watchlistIds[matterDefs.indexOf(def)];
    if (targetWl) {
      const existingLink = await policyIntelDb.select({ id: matterWatchlists.id }).from(matterWatchlists).where(and(eq(matterWatchlists.matterId, matterId), eq(matterWatchlists.watchlistId, targetWl)));
      if (existingLink.length === 0) {
        await policyIntelDb.insert(matterWatchlists).values({ matterId, watchlistId: targetWl });
      }
    }
  }
  const issueRoomMatterId = matterIds[matterDefs.findIndex((matter) => matter.slug === "workforce-edtech-89r")] ?? null;
  const existingIssueRoom = await policyIntelDb.select({ id: issueRooms.id }).from(issueRooms).where(and(eq(issueRooms.workspaceId, workspace.id), eq(issueRooms.slug, "hisd-tea-sb-1882")));
  let issueRoomId;
  if (existingIssueRoom.length > 0) {
    issueRoomId = existingIssueRoom[0].id;
  } else {
    const [createdIssueRoom] = await policyIntelDb.insert(issueRooms).values({
      workspaceId: workspace.id,
      matterId: issueRoomMatterId,
      slug: "hisd-tea-sb-1882",
      title: "HISD / TEA / SB 1882 Governance",
      issueType: "education_governance",
      jurisdiction: "texas",
      status: "active",
      summary: "Track Texas education authority shifts, HISD governance actions, SB 1882-style partnership implications, and operational consequences for public-sector stakeholders.",
      recommendedPath: "Maintain one source-backed issue room that consolidates governance actions, implementation risk, and partner-facing strategic options.",
      relatedBillIds: ["SB 1882"]
    }).returning({ id: issueRooms.id });
    issueRoomId = createdIssueRoom.id;
  }
  const existingUpdates = await policyIntelDb.select({ id: issueRoomUpdates.id }).from(issueRoomUpdates).where(eq(issueRoomUpdates.issueRoomId, issueRoomId));
  if (existingUpdates.length === 0) {
    await policyIntelDb.insert(issueRoomUpdates).values({
      issueRoomId,
      title: "Initial monitoring frame",
      body: "Use this issue room to track changes in TEA authority, HISD governance, partnership models, and implementation consequences. Future recommendations should cite stored source documents.",
      updateType: "analysis"
    });
  }
  const existingOptions = await policyIntelDb.select({ id: issueRoomStrategyOptions.id }).from(issueRoomStrategyOptions).where(eq(issueRoomStrategyOptions.issueRoomId, issueRoomId));
  if (existingOptions.length === 0) {
    await policyIntelDb.insert(issueRoomStrategyOptions).values([
      {
        issueRoomId,
        label: "Monitor and brief",
        description: "Maintain a disciplined evidence room and produce partner-ready updates as governance changes occur.",
        prosJson: ["Lowest execution risk", "Improves partner awareness quickly"],
        consJson: ["Limited direct influence without additional engagement"],
        politicalFeasibility: "high",
        legalDurability: "high",
        implementationComplexity: "low",
        recommendationRank: 1
      },
      {
        issueRoomId,
        label: "Stakeholder engagement plan",
        description: "Map agencies, operators, and district actors before recommending direct outreach or coalition activity.",
        prosJson: ["Improves situational awareness", "Clarifies leverage points"],
        consJson: ["Requires disciplined stakeholder validation"],
        politicalFeasibility: "medium",
        legalDurability: "medium",
        implementationComplexity: "medium",
        recommendationRank: 2
      }
    ]);
  }
  const existingTasks = await policyIntelDb.select({ id: issueRoomTasks.id }).from(issueRoomTasks).where(eq(issueRoomTasks.issueRoomId, issueRoomId));
  if (existingTasks.length === 0) {
    await policyIntelDb.insert(issueRoomTasks).values([
      {
        issueRoomId,
        title: "Review latest TEA and HISD source documents",
        description: "Confirm which recent official actions materially affect governance or implementation authority.",
        status: "todo",
        priority: "high",
        assignee: "Grace & McEwan analyst"
      },
      {
        issueRoomId,
        title: "Draft partner briefing outline",
        description: "Prepare a short issue-room brief once the first relevant alert cluster is linked.",
        status: "todo",
        priority: "medium",
        assignee: "Grace & McEwan analyst"
      }
    ]);
  }
  const existingStakeholders = await policyIntelDb.select({ id: stakeholders.id }).from(stakeholders).where(eq(stakeholders.issueRoomId, issueRoomId));
  if (existingStakeholders.length === 0) {
    await policyIntelDb.insert(stakeholders).values([
      {
        workspaceId: workspace.id,
        issueRoomId,
        type: "agency_official",
        name: "Texas Education Agency",
        organization: "TEA",
        jurisdiction: "texas",
        tagsJson: ["agency", "education"],
        sourceSummary: "Primary state-level authority and implementation signal source for the issue room."
      },
      {
        workspaceId: workspace.id,
        issueRoomId,
        type: "organization",
        name: "Houston Independent School District",
        organization: "HISD",
        jurisdiction: "houston",
        tagsJson: ["district", "education"],
        sourceSummary: "Local district actor affected by governance and partnership changes."
      }
    ]);
  }
  return { workspace, watchlistIds, matterIds, issueRoomIds: [issueRoomId] };
}

// server/policy-intel/connectors/texas/tlo-rss.ts
import axios from "axios";
import * as cheerio from "cheerio";
var TLO_RSS_BASE = "https://capitol.texas.gov/MyTLO/RSS/RSS.aspx";
var FEED_LABELS = {
  todaysfiledhouse: "Today's Bills Filed in House",
  todaysfiledsenate: "Today's Bills Filed in Senate",
  upcomingmeetingshouse: "Upcoming House Committee Meetings",
  upcomingmeetingssenate: "Upcoming Senate Committee Meetings",
  todaysbillspassed: "Today's Passed Bills",
  todaysbillanalyses: "Today's Bill Analyses"
};
var FEED_URLS = {
  todaysfiledhouse: `${TLO_RSS_BASE}?Type=todaysfiledhouse`,
  todaysfiledsenate: `${TLO_RSS_BASE}?Type=todaysfiledsenate`,
  upcomingmeetingshouse: `${TLO_RSS_BASE}?Type=upcomingmeetingshouse`,
  upcomingmeetingssenate: `${TLO_RSS_BASE}?Type=upcomingmeetingssenate`,
  todaysbillspassed: `${TLO_RSS_BASE}?Type=todaysbillspassed`,
  todaysbillanalyses: `${TLO_RSS_BASE}?Type=todaysbillanalyses`
};
var BILL_ID_RE = /\b([HS][BJR]R?\s*\d+)\b/g;
var COMMITTEE_FIELD_RE = /Committee:\s*(.+?)(?:\n|$)/i;
async function fetchFeed(url) {
  const response = await axios.get(url, {
    timeout: 3e4,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GraceMcEwan-PolicyIntel/1.0; +https://github.com/htownz/Hogan-Legacy)",
      Accept: "application/rss+xml, application/xml, text/xml, */*"
    },
    responseType: "text"
  });
  return response.data;
}
function extractBillId(text3) {
  const re = new RegExp(BILL_ID_RE.source, BILL_ID_RE.flags);
  const first = re.exec(text3);
  if (!first) return null;
  return first[1].replace(/([HS][BJR]R?)\s*(\d+)/, "$1 $2");
}
function extractCommittee(text3) {
  const match = text3.match(COMMITTEE_FIELD_RE);
  return match ? match[1].trim() : null;
}
function parseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}
function parseFeed(xml, feedType) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];
  $("item").each((_i, el) => {
    const title = $(el).find("title").first().text().trim();
    const description = $(el).find("description").first().text().trim();
    const link = $(el).find("link").first().text().trim();
    const pubDateRaw = $(el).find("pubDate").first().text().trim() || null;
    if (title.toLowerCase().includes("no bills have been filed") || title.toLowerCase().includes("no meetings scheduled") || title.toLowerCase().includes("no bills passed") || title.toLowerCase().includes("no analyses")) {
      return;
    }
    const fullText = `${title} ${description}`;
    items.push({
      feedType,
      title,
      description,
      link,
      pubDate: parseDate(pubDateRaw),
      billId: extractBillId(fullText),
      committee: extractCommittee(description)
    });
  });
  return items;
}
function normaliseToSourceDocument(item) {
  const externalId = item.billId ?? item.link;
  const normalizedText = [item.title, item.description].filter(Boolean).join("\n");
  const tags = [item.feedType.toLowerCase()];
  if (item.billId) tags.push(item.billId.replace(/\s+/, "_").toUpperCase());
  if (item.committee) tags.push(`committee:${item.committee.toLowerCase().replace(/\s+/g, "_")}`);
  const payload = {
    sourceType: "texas_legislation",
    publisher: "Texas Legislature Online",
    sourceUrl: item.link || FEED_URLS[item.feedType],
    externalId,
    title: item.title,
    summary: item.description.slice(0, 500) || null,
    publishedAt: item.pubDate ?? null,
    normalizedText,
    rawPayload: {
      feedType: item.feedType,
      feedLabel: FEED_LABELS[item.feedType],
      billId: item.billId,
      committee: item.committee,
      rawDescription: item.description
    },
    tagsJson: tags,
    checksum: null
    // computed by source-document-service
  };
  return payload;
}
async function fetchTloFeed(feedType) {
  try {
    const xml = await fetchFeed(FEED_URLS[feedType]);
    const items = parseFeed(xml, feedType);
    const documents = items.map(normaliseToSourceDocument);
    return { feedType, items, documents, error: null };
  } catch (err) {
    return {
      feedType,
      items: [],
      documents: [],
      error: err?.message ?? String(err)
    };
  }
}
async function fetchAllTloFeeds() {
  const feedTypes = [
    "todaysfiledhouse",
    "todaysfiledsenate",
    "upcomingmeetingshouse",
    "upcomingmeetingssenate",
    "todaysbillspassed",
    "todaysbillanalyses"
  ];
  return Promise.all(feedTypes.map(fetchTloFeed));
}

// server/policy-intel/services/source-document-service.ts
init_db();
init_schema_policy_intel();
import { eq as eq2 } from "drizzle-orm";

// server/policy-intel/engine/checksum.ts
import crypto from "crypto";
function buildChecksum(sourceUrl, externalId, normalizedText) {
  const stable = `${sourceUrl.trim()}::${externalId.trim()}::${normalizedText.slice(0, 512)}`;
  return crypto.createHash("sha256").update(stable, "utf8").digest("hex");
}

// server/policy-intel/services/source-document-service.ts
async function upsertSourceDocument(payload) {
  const checksum = payload.checksum ?? buildChecksum(
    payload.sourceUrl,
    payload.externalId ?? payload.sourceUrl,
    payload.normalizedText ?? payload.title
  );
  const [inserted] = await policyIntelDb.insert(sourceDocuments).values({ ...payload, checksum }).onConflictDoNothing({ target: sourceDocuments.checksum }).returning();
  if (inserted) {
    return { doc: inserted, inserted: true };
  }
  const [existing] = await policyIntelDb.select().from(sourceDocuments).where(eq2(sourceDocuments.checksum, checksum)).limit(1);
  if (existing) {
    return { doc: existing, inserted: false };
  }
  throw new Error(`Source document checksum conflict did not return a row: ${checksum}`);
}

// server/policy-intel/services/alert-service.ts
init_db();
init_schema_policy_intel();
import { and as and2, eq as eq4, gt } from "drizzle-orm";

// server/policy-intel/engine/match-watchlists.ts
var BILL_ID_RE2 = /\b([HS][BJR]R?\s*\d+)\b/i;
function parseRules(rulesJson) {
  const toArr = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  return {
    keywords: toArr(rulesJson.keywords),
    committees: toArr(rulesJson.committees),
    agencies: toArr(rulesJson.agencies),
    billPrefixes: toArr(rulesJson.billPrefixes),
    billIds: toArr(rulesJson.billIds)
  };
}
function excerpt(text3, term, radius = 60) {
  const idx = text3.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text3.slice(0, radius * 2);
  const start2 = Math.max(0, idx - radius);
  const end = Math.min(text3.length, idx + term.length + radius);
  const prefix = start2 > 0 ? "..." : "";
  const suffix = end < text3.length ? "..." : "";
  return prefix + text3.slice(start2, end) + suffix;
}
function matchBillIds(doc, rules) {
  const reasons = [];
  const corpus = `${doc.title}
${doc.normalizedText ?? ""}`;
  const billId = typeof doc.rawPayload?.billId === "string" ? doc.rawPayload.billId : null;
  const extractedBillId = billId ?? extractBillIdFromText(corpus);
  if (extractedBillId && rules.billIds.length > 0) {
    const normalised = extractedBillId.toUpperCase().replace(/\s+/g, " ").trim();
    for (const targetId of rules.billIds) {
      const normalTarget = targetId.toUpperCase().replace(/\s+/g, " ").trim();
      if (normalised === normalTarget) {
        reasons.push({
          dimension: "bill_id",
          rule: targetId,
          excerpt: excerpt(corpus, extractedBillId)
        });
      }
    }
  }
  if (extractedBillId && rules.billPrefixes.length > 0 && reasons.length === 0) {
    const upper = extractedBillId.toUpperCase().replace(/\s+/g, "");
    const prefixMatch = rules.billPrefixes.some((p) => upper.startsWith(p));
    if (prefixMatch) {
      reasons.push({
        dimension: "bill_id",
        rule: extractedBillId,
        excerpt: excerpt(corpus, extractedBillId)
      });
    }
  }
  return reasons;
}
function matchKeywords(doc, rules) {
  const reasons = [];
  if (rules.keywords.length === 0) return reasons;
  const corpus = `${doc.title}
${doc.normalizedText ?? ""}`.toLowerCase();
  for (const kw of rules.keywords) {
    const lower = kw.toLowerCase();
    if (kw.length <= 4) {
      const re = new RegExp(`\\b${escapeRegex(lower)}\\b`, "i");
      if (re.test(corpus)) {
        reasons.push({
          dimension: "keyword",
          rule: kw,
          excerpt: excerpt(corpus, lower)
        });
      }
    } else if (corpus.includes(lower)) {
      reasons.push({
        dimension: "keyword",
        rule: kw,
        excerpt: excerpt(corpus, lower)
      });
    }
  }
  return reasons;
}
function matchCommittees(doc, rules) {
  const reasons = [];
  if (rules.committees.length === 0) return reasons;
  const corpus = `${doc.title}
${doc.normalizedText ?? ""}`;
  const rawCommittee = typeof doc.rawPayload?.committee === "string" ? doc.rawPayload.committee : null;
  const fullCorpus = rawCommittee ? `${corpus}
${rawCommittee}` : corpus;
  const lower = fullCorpus.toLowerCase();
  for (const committee of rules.committees) {
    if (lower.includes(committee.toLowerCase())) {
      reasons.push({
        dimension: "committee",
        rule: committee,
        excerpt: excerpt(fullCorpus, committee)
      });
    }
  }
  return reasons;
}
function matchAgencies(doc, rules) {
  const reasons = [];
  if (rules.agencies.length === 0) return reasons;
  const corpus = `${doc.title}
${doc.normalizedText ?? ""}`;
  for (const agency of rules.agencies) {
    if (agency.length <= 5) {
      const re = new RegExp(`\\b${escapeRegex(agency)}\\b`);
      if (re.test(corpus)) {
        reasons.push({
          dimension: "agency",
          rule: agency,
          excerpt: excerpt(corpus, agency)
        });
      }
    } else if (corpus.toLowerCase().includes(agency.toLowerCase())) {
      reasons.push({
        dimension: "agency",
        rule: agency,
        excerpt: excerpt(corpus, agency)
      });
    }
  }
  return reasons;
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function extractBillIdFromText(text3) {
  const match = text3.match(BILL_ID_RE2);
  if (!match) return null;
  return match[1].replace(/([HS][BJR]R?)\s*(\d+)/i, "$1 $2").toUpperCase();
}
function matchDocumentToWatchlist(doc, watchlist) {
  const rules = parseRules(watchlist.rulesJson);
  const reasons = [
    ...matchBillIds(doc, rules),
    ...matchKeywords(doc, rules),
    ...matchCommittees(doc, rules),
    ...matchAgencies(doc, rules)
  ];
  if (reasons.length === 0) return null;
  return { watchlist, reasons };
}
function matchDocumentToAllWatchlists(doc, watchlists7) {
  const matches = [];
  for (const wl of watchlists7) {
    if (!wl.isActive) continue;
    const match = matchDocumentToWatchlist(doc, wl);
    if (match) matches.push(match);
  }
  return matches;
}

// server/policy-intel/engine/score-alert.ts
function buildWhyItMatters(docTitle, reasons) {
  const dimensions = new Set(reasons.map((r) => r.dimension));
  const parts = [];
  if (dimensions.has("bill_id")) {
    const bills = reasons.filter((r) => r.dimension === "bill_id").map((r) => r.rule);
    parts.push(`Bill ${bills.join(", ")} directly referenced`);
  }
  if (dimensions.has("committee")) {
    const committees = reasons.filter((r) => r.dimension === "committee").map((r) => r.rule);
    parts.push(`Committee match: ${committees.join(", ")}`);
  }
  if (dimensions.has("agency")) {
    const agencies = reasons.filter((r) => r.dimension === "agency").map((r) => r.rule);
    parts.push(`Agency match: ${agencies.join(", ")}`);
  }
  if (dimensions.has("keyword")) {
    const keywords = reasons.filter((r) => r.dimension === "keyword").map((r) => r.rule);
    const display = keywords.length <= 4 ? keywords.join(", ") : `${keywords.slice(0, 4).join(", ")} +${keywords.length - 4} more`;
    parts.push(`Keyword match: ${display}`);
  }
  return `"${docTitle}" \u2014 ${parts.join("; ")}.`;
}

// server/policy-intel/metrics.ts
var MetricsRegistry = class {
  constructor() {
    this.metrics = /* @__PURE__ */ new Map();
    this.startTime = Date.now();
  }
  // ── Counter ──
  counter(name, help) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { type: "counter", help, values: /* @__PURE__ */ new Map() });
    }
  }
  inc(name, labels = {}, value = 1) {
    const m = this.metrics.get(name);
    if (!m || m.type !== "counter") return;
    const key = labelKey(labels);
    m.values.set(key, (m.values.get(key) ?? 0) + value);
  }
  // ── Gauge ──
  gauge(name, help) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { type: "gauge", help, values: /* @__PURE__ */ new Map() });
    }
  }
  set(name, labels, value) {
    const m = this.metrics.get(name);
    if (!m || m.type !== "gauge") return;
    m.values.set(labelKey(labels), value);
  }
  // ── Histogram ──
  histogram(name, help, buckets) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        type: "histogram",
        help,
        buckets: [...buckets].sort((a, b) => a - b),
        observations: /* @__PURE__ */ new Map()
      });
    }
  }
  observe(name, labels, value) {
    const m = this.metrics.get(name);
    if (!m || m.type !== "histogram") return;
    const key = labelKey(labels);
    let obs = m.observations.get(key);
    if (!obs) {
      obs = { buckets: new Array(m.buckets.length).fill(0), sum: 0, count: 0 };
      m.observations.set(key, obs);
    }
    obs.sum += value;
    obs.count += 1;
    for (let i = 0; i < m.buckets.length; i++) {
      if (value <= m.buckets[i]) obs.buckets[i]++;
    }
  }
  // ── Serialize to Prometheus text format ──
  serialize() {
    const lines = [];
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1e3);
    lines.push("# HELP policy_intel_uptime_seconds Seconds since service start");
    lines.push("# TYPE policy_intel_uptime_seconds gauge");
    lines.push(`policy_intel_uptime_seconds ${uptimeSeconds}`);
    lines.push("");
    this.metrics.forEach((m, name) => {
      lines.push(`# HELP ${name} ${m.help}`);
      lines.push(`# TYPE ${name} ${m.type}`);
      if (m.type === "counter" || m.type === "gauge") {
        m.values.forEach((val, lk) => {
          const labelStr = lk ? `{${lk}}` : "";
          lines.push(`${name}${labelStr} ${val}`);
        });
      } else if (m.type === "histogram") {
        m.observations.forEach((obs, lk) => {
          const prefix = lk ? `,${lk}` : "";
          let cumulative = 0;
          for (let i = 0; i < m.buckets.length; i++) {
            cumulative += obs.buckets[i];
            lines.push(`${name}_bucket{le="${m.buckets[i]}"${prefix}} ${cumulative}`);
          }
          lines.push(`${name}_bucket{le="+Inf"${prefix}} ${obs.count}`);
          lines.push(`${name}_sum{${lk}} ${obs.sum}`);
          lines.push(`${name}_count{${lk}} ${obs.count}`);
        });
      }
      lines.push("");
    });
    return lines.join("\n");
  }
  // ── Read-back helpers for dashboard API ──
  /** Get a single counter value */
  getCounter(name, labels = {}) {
    const m = this.metrics.get(name);
    if (!m || m.type !== "counter") return 0;
    return m.values.get(labelKey(labels)) ?? 0;
  }
  /** Get all label→value pairs for a counter */
  getCounterAll(name) {
    const m = this.metrics.get(name);
    if (!m || m.type !== "counter") return [];
    const results = [];
    m.values.forEach((val, lk) => {
      results.push({ labels: parseLabels(lk), value: val });
    });
    return results;
  }
  /** Get a gauge value */
  getGauge(name, labels = {}) {
    const m = this.metrics.get(name);
    if (!m || m.type !== "gauge") return 0;
    return m.values.get(labelKey(labels)) ?? 0;
  }
  /** Get all gauge values */
  getGaugeAll(name) {
    const m = this.metrics.get(name);
    if (!m || m.type !== "gauge") return [];
    const results = [];
    m.values.forEach((val, lk) => {
      results.push({ labels: parseLabels(lk), value: val });
    });
    return results;
  }
  /** Get histogram summary (count, sum, mean) */
  getHistogramSummary(name, labels = {}) {
    const m = this.metrics.get(name);
    if (!m || m.type !== "histogram") return { count: 0, sum: 0, mean: 0 };
    const obs = m.observations.get(labelKey(labels));
    if (!obs) return { count: 0, sum: 0, mean: 0 };
    return { count: obs.count, sum: obs.sum, mean: obs.count > 0 ? obs.sum / obs.count : 0 };
  }
  /** Get process uptime in seconds */
  getUptimeSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1e3);
  }
};
function labelKey(labels) {
  const entries = Object.entries(labels);
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}="${v}"`).join(",");
}
function parseLabels(lk) {
  if (!lk) return {};
  const result = {};
  const re = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = re.exec(lk)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}
var metrics = new MetricsRegistry();
var RollingTimeSeries = class {
  constructor() {
    this.points = [];
    this.maxPoints = 60;
  }
  // 60 ticks × 30s = 30 minutes
  record(point) {
    this.points.push(point);
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }
  }
  getAll() {
    return [...this.points];
  }
};
var timeSeries = new RollingTimeSeries();
var lastSnapshot = {};
function snapshotDelta() {
  const now = {
    alertsCreated: metrics.getCounter("policy_intel_alerts_created_total"),
    docsProcessed: metrics.getCounter("policy_intel_docs_processed_total"),
    pipelineRuns: metrics.getCounter("policy_intel_pipeline_runs_total"),
    escalations: metrics.getCounter("policy_intel_pipeline_actions_total", { action: "escalate" }),
    httpRequests: sumCounterValues("policy_intel_http_requests_total")
  };
  const delta = {};
  Object.keys(now).forEach((k) => {
    delta[k] = now[k] - (lastSnapshot[k] ?? 0);
  });
  const scoreSummary = metrics.getHistogramSummary("policy_intel_pipeline_score");
  timeSeries.record({
    t: Date.now(),
    alertsCreated: delta.alertsCreated,
    docsProcessed: delta.docsProcessed,
    pipelineRuns: delta.pipelineRuns,
    escalations: delta.escalations,
    avgScore: scoreSummary.mean,
    httpRequests: delta.httpRequests
  });
  lastSnapshot = now;
}
function sumCounterValues(name) {
  const all = metrics.getCounterAll(name);
  let total = 0;
  all.forEach((entry) => {
    total += entry.value;
  });
  return total;
}
setTimeout(() => {
  snapshotDelta();
  setInterval(snapshotDelta, 3e4);
}, 5e3);
metrics.counter("policy_intel_pipeline_runs_total", "Total agent pipeline executions");
metrics.counter("policy_intel_pipeline_actions_total", "Pipeline actions by type (escalate/watch/archive)");
metrics.histogram("policy_intel_pipeline_score", "Distribution of pipeline scores", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
metrics.histogram("policy_intel_pipeline_confidence", "Distribution of pipeline confidence", [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
metrics.histogram("policy_intel_pipeline_duration_ms", "Pipeline execution time in ms", [1, 5, 10, 25, 50, 100, 250, 500]);
metrics.counter("policy_intel_regime_detections_total", "Regime detections by type");
metrics.gauge("policy_intel_regime_current", "Current detected regime (1=active)");
metrics.histogram("policy_intel_agent_score", "Individual agent score distribution", [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
metrics.counter("policy_intel_alerts_created_total", "Total alerts created");
metrics.counter("policy_intel_alerts_skipped_total", "Alerts skipped (duplicate or cooldown)");
metrics.histogram("policy_intel_alert_score", "Distribution of alert relevance scores", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
metrics.counter("policy_intel_docs_processed_total", "Total source documents processed for alerts");
metrics.counter("policy_intel_docs_matched_total", "Documents that matched at least one watchlist");
metrics.counter("policy_intel_jobs_total", "Scheduled jobs executed");
metrics.counter("policy_intel_jobs_errors_total", "Scheduled job errors");
metrics.histogram("policy_intel_job_duration_seconds", "Job execution duration", [1, 5, 10, 30, 60, 120, 300, 600]);
metrics.counter("policy_intel_http_requests_total", "HTTP requests by method and route");
metrics.histogram("policy_intel_http_duration_ms", "HTTP request duration in ms", [5, 10, 25, 50, 100, 250, 500, 1e3, 2500, 5e3]);
metrics.counter("policy_intel_feedback_events_total", "Feedback events by outcome (promoted/suppressed/strong_positive)");
metrics.counter("policy_intel_champion_retrains_total", "Total retraining cycles executed");
metrics.counter("policy_intel_champion_promotions_total", "Number of challenger-to-champion promotions");
metrics.gauge("policy_intel_champion_accuracy", "Current champion model accuracy on holdout");
metrics.gauge("policy_intel_champion_generation", "Current champion generation number");

// server/policy-intel/engine/champion.ts
init_db();
init_schema_policy_intel();
import { desc, sql } from "drizzle-orm";
var AGENT_NAMES = ["procedural", "relevance", "stakeholder", "actionability", "timeliness", "regime"];
var FALLBACK_WEIGHTS = {
  procedural: 0.25,
  relevance: 0.3,
  stakeholder: 0.15,
  actionability: 0.15,
  timeliness: 0.1,
  regime: 0.05
};
var FALLBACK_CONFIG = {
  weights: FALLBACK_WEIGHTS,
  escalateThreshold: 60,
  archiveThreshold: 20
};
var PROMOTION_MARGIN = 0.05;
var MIN_FEEDBACK_FOR_RETRAIN = 20;
var TRAIN_RATIO = 0.8;
var cachedChampion = null;
async function getChampionConfig() {
  if (cachedChampion) {
    return {
      weights: { ...cachedChampion.weights },
      escalateThreshold: cachedChampion.escalateThreshold,
      archiveThreshold: cachedChampion.archiveThreshold
    };
  }
  const [row] = await policyIntelDb.select().from(championSnapshots).orderBy(desc(championSnapshots.promotedAt)).limit(1);
  if (row) {
    cachedChampion = {
      generation: row.generation,
      weights: row.weightsJson,
      escalateThreshold: row.escalateThreshold,
      archiveThreshold: row.archiveThreshold,
      accuracy: row.accuracy,
      feedbackCount: row.feedbackCount,
      promotedAt: row.promotedAt.toISOString(),
      isDefault: false
    };
    return {
      weights: { ...cachedChampion.weights },
      escalateThreshold: cachedChampion.escalateThreshold,
      archiveThreshold: cachedChampion.archiveThreshold
    };
  }
  return { ...FALLBACK_CONFIG, weights: { ...FALLBACK_WEIGHTS } };
}
async function getChampionStatus() {
  await getChampionConfig();
  const [{ count: liveFeedbackCount }] = await policyIntelDb.select({ count: sql`count(*)::int` }).from(feedbackLog);
  if (cachedChampion) {
    return { ...cachedChampion, feedbackCount: liveFeedbackCount };
  }
  return {
    generation: 0,
    weights: { ...FALLBACK_WEIGHTS },
    escalateThreshold: FALLBACK_CONFIG.escalateThreshold,
    archiveThreshold: FALLBACK_CONFIG.archiveThreshold,
    accuracy: 0,
    feedbackCount: liveFeedbackCount,
    promotedAt: (/* @__PURE__ */ new Date()).toISOString(),
    isDefault: true
  };
}
async function getChampionHistory(limit = 20) {
  const rows = await policyIntelDb.select().from(championSnapshots).orderBy(desc(championSnapshots.promotedAt)).limit(limit);
  return rows.map((r) => ({
    generation: r.generation,
    weights: r.weightsJson,
    escalateThreshold: r.escalateThreshold,
    archiveThreshold: r.archiveThreshold,
    accuracy: r.accuracy,
    feedbackCount: r.feedbackCount,
    promotedAt: r.promotedAt.toISOString(),
    metadata: r.metadataJson
  }));
}
async function recordFeedback(alertId, outcome, pipelineData) {
  await policyIntelDb.insert(feedbackLog).values({
    alertId,
    outcome,
    originalScore: pipelineData.originalScore,
    originalConfidence: pipelineData.originalConfidence,
    agentScoresJson: pipelineData.agentScores,
    weightsJson: pipelineData.weights,
    regime: pipelineData.regime
  });
  metrics.inc("policy_intel_feedback_events_total", { outcome });
}
var DECAY_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1e3;
function timeDecayWeight(createdAt) {
  const ageMs = Date.now() - createdAt.getTime();
  return Math.pow(0.5, ageMs / DECAY_HALF_LIFE_MS);
}
function simulateScore(row, config) {
  const agentMap = {};
  for (const entry of row.agentScoresJson) {
    const agent = entry.agent;
    if (agent && AGENT_NAMES.includes(agent)) {
      agentMap[agent] = {
        score: entry.score ?? 0,
        confidence: entry.confidence ?? 0.5
      };
    }
  }
  const w = { ...config.weights };
  const total = Object.values(w).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const k of Object.keys(w)) {
      w[k] = w[k] / total;
    }
  }
  let weightedSum = 0;
  for (const name of AGENT_NAMES) {
    const a = agentMap[name];
    if (!a) continue;
    const weight = w[name] ?? 0;
    weightedSum += weight * a.score * a.confidence;
  }
  const totalScore = Math.round(Math.min(100, Math.max(0, weightedSum * 100)));
  let action;
  if (totalScore >= config.escalateThreshold) {
    action = "escalate";
  } else if (totalScore <= config.archiveThreshold) {
    action = "archive";
  } else {
    action = "watch";
  }
  return { totalScore, action };
}
function isCorrectPrediction(action, outcome) {
  if (outcome === "promoted" || outcome === "strong_positive") {
    return action === "escalate" || action === "watch";
  }
  if (outcome === "suppressed") {
    return action === "archive" || action === "watch";
  }
  return true;
}
function evaluate(rows, config) {
  if (rows.length === 0) return 0;
  let weightedCorrect = 0;
  let totalWeight = 0;
  for (const row of rows) {
    const { action } = simulateScore(row, config);
    const w = timeDecayWeight(row.createdAt);
    totalWeight += w;
    if (isCorrectPrediction(action, row.outcome)) {
      weightedCorrect += w;
    }
  }
  return totalWeight > 0 ? weightedCorrect / totalWeight : 0;
}
function coordinateDescentOptimise(trainRows, startConfig) {
  let best = { ...startConfig, weights: { ...startConfig.weights } };
  let bestAcc = evaluate(trainRows, best);
  const deltas = [-0.1, -0.05, 0.05, 0.1];
  for (let pass = 0; pass < 3; pass++) {
    for (const agent of AGENT_NAMES) {
      for (const delta of deltas) {
        const candidate = {
          weights: { ...best.weights },
          escalateThreshold: best.escalateThreshold,
          archiveThreshold: best.archiveThreshold
        };
        candidate.weights[agent] = Math.max(0.02, (candidate.weights[agent] ?? 0.1) + delta);
        const acc = evaluate(trainRows, candidate);
        if (acc > bestAcc) {
          best = candidate;
          bestAcc = acc;
        }
      }
    }
    for (const escDelta of [-10, -5, 5, 10]) {
      for (const archDelta of [-10, -5, 5, 10]) {
        const candidate = {
          weights: { ...best.weights },
          escalateThreshold: Math.max(30, Math.min(90, best.escalateThreshold + escDelta)),
          archiveThreshold: Math.max(5, Math.min(50, best.archiveThreshold + archDelta))
        };
        if (candidate.escalateThreshold <= candidate.archiveThreshold + 10) continue;
        const acc = evaluate(trainRows, candidate);
        if (acc > bestAcc) {
          best = candidate;
          bestAcc = acc;
        }
      }
    }
  }
  return best;
}
async function runRetraining() {
  const rows = await policyIntelDb.select().from(feedbackLog).orderBy(desc(feedbackLog.createdAt));
  if (rows.length < MIN_FEEDBACK_FOR_RETRAIN) {
    const currentStatus = await getChampionStatus();
    return {
      promoted: false,
      championAccuracy: currentStatus.accuracy,
      challengerAccuracy: 0,
      newGeneration: null,
      trainSize: 0,
      holdoutSize: 0,
      challengerWeights: {},
      challengerThresholds: { escalate: 0, archive: 0 }
    };
  }
  const shuffled = [...rows];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = i % (Math.floor(i / 2) + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const splitIdx = Math.floor(shuffled.length * TRAIN_RATIO);
  const trainRows = shuffled.slice(0, splitIdx).map(toFeedbackRow);
  const holdoutRows = shuffled.slice(splitIdx).map(toFeedbackRow);
  const regimeGroups = /* @__PURE__ */ new Map();
  for (const row of trainRows) {
    const group = regimeGroups.get(row.regime) ?? [];
    group.push(row);
    regimeGroups.set(row.regime, group);
  }
  const championConfig = await getChampionConfig();
  const championAccuracy = evaluate(holdoutRows, championConfig);
  let blendedWeights = { ...championConfig.weights };
  let blendedEscalate = championConfig.escalateThreshold;
  let blendedArchive = championConfig.archiveThreshold;
  let totalSamples = 0;
  const regimeResults = {};
  if (regimeGroups.size >= 2) {
    const weightAccum = {};
    let escAccum = 0;
    let archAccum = 0;
    for (const [regime, regimeRows] of regimeGroups) {
      if (regimeRows.length < 5) continue;
      const regimeChallenger = coordinateDescentOptimise(regimeRows, championConfig);
      const regimeHoldout = holdoutRows.filter((r) => r.regime === regime);
      const regimeAcc = regimeHoldout.length >= 3 ? evaluate(regimeHoldout, regimeChallenger) : evaluate(regimeRows, regimeChallenger);
      regimeResults[regime] = { accuracy: regimeAcc, sampleCount: regimeRows.length, weights: regimeChallenger.weights };
      for (const [k, v] of Object.entries(regimeChallenger.weights)) {
        weightAccum[k] = (weightAccum[k] ?? 0) + v * regimeRows.length;
      }
      escAccum += regimeChallenger.escalateThreshold * regimeRows.length;
      archAccum += regimeChallenger.archiveThreshold * regimeRows.length;
      totalSamples += regimeRows.length;
    }
    if (totalSamples > 0) {
      blendedWeights = {};
      for (const [k, v] of Object.entries(weightAccum)) {
        blendedWeights[k] = v / totalSamples;
      }
      blendedEscalate = Math.round(escAccum / totalSamples);
      blendedArchive = Math.round(archAccum / totalSamples);
    }
  } else {
    const challenger = coordinateDescentOptimise(trainRows, championConfig);
    blendedWeights = challenger.weights;
    blendedEscalate = challenger.escalateThreshold;
    blendedArchive = challenger.archiveThreshold;
    totalSamples = trainRows.length;
  }
  const challengerConfig = {
    weights: blendedWeights,
    escalateThreshold: blendedEscalate,
    archiveThreshold: blendedArchive
  };
  const challengerAccuracy = evaluate(holdoutRows, challengerConfig);
  const agentContributions = {};
  for (const agent of AGENT_NAMES) {
    const ablatedWeights = { ...challengerConfig.weights };
    ablatedWeights[agent] = 0;
    const ablatedConfig = { ...challengerConfig, weights: ablatedWeights };
    const ablatedAccuracy = evaluate(holdoutRows, ablatedConfig);
    agentContributions[agent] = Math.max(0, challengerAccuracy - ablatedAccuracy);
  }
  metrics.inc("policy_intel_champion_retrains_total");
  const promoted = challengerAccuracy >= championAccuracy + PROMOTION_MARGIN;
  let newGeneration = null;
  if (promoted) {
    const currentStatus = await getChampionStatus();
    newGeneration = currentStatus.generation + 1;
    const wTotal = Object.values(challengerConfig.weights).reduce((s, v) => s + v, 0);
    const normWeights = {};
    for (const [k, v] of Object.entries(challengerConfig.weights)) {
      normWeights[k] = wTotal > 0 ? v / wTotal : 1 / AGENT_NAMES.length;
    }
    await policyIntelDb.insert(championSnapshots).values({
      generation: newGeneration,
      weightsJson: normWeights,
      escalateThreshold: challengerConfig.escalateThreshold,
      archiveThreshold: challengerConfig.archiveThreshold,
      accuracy: challengerAccuracy,
      feedbackCount: rows.length,
      metadataJson: {
        championAccuracy,
        challengerAccuracy,
        improvementMargin: challengerAccuracy - championAccuracy,
        trainSize: trainRows.length,
        holdoutSize: holdoutRows.length,
        regimeResults,
        agentContributions,
        timeDecayEnabled: true
      }
    });
    await policyIntelDb.insert(learningMetrics).values({
      metricType: "champion_retrain",
      regime: Object.keys(regimeResults)[0] ?? "mixed",
      valuesJson: {
        generation: newGeneration,
        championAccuracy,
        challengerAccuracy,
        agentContributions,
        regimeResults,
        feedbackCount: rows.length
      }
    });
    cachedChampion = null;
    metrics.inc("policy_intel_champion_promotions_total");
    metrics.set("policy_intel_champion_accuracy", {}, challengerAccuracy);
    metrics.set("policy_intel_champion_generation", {}, newGeneration);
  }
  return {
    promoted,
    championAccuracy,
    challengerAccuracy,
    newGeneration,
    trainSize: trainRows.length,
    holdoutSize: holdoutRows.length,
    challengerWeights: challengerConfig.weights,
    challengerThresholds: {
      escalate: challengerConfig.escalateThreshold,
      archive: challengerConfig.archiveThreshold
    }
  };
}
function toFeedbackRow(row) {
  return {
    outcome: row.outcome,
    originalScore: row.originalScore,
    agentScoresJson: row.agentScoresJson ?? [],
    weightsJson: row.weightsJson ?? {},
    regime: row.regime,
    createdAt: row.createdAt
  };
}
async function bootstrapFeedback(sampleSize = 100) {
  const [{ count: existingCount }] = await policyIntelDb.select({ count: sql`count(*)::int` }).from(feedbackLog);
  if (existingCount >= MIN_FEEDBACK_FOR_RETRAIN * 3) {
    return { sampled: 0, feedbackGenerated: 0, promoted: 0, suppressed: 0, skipped: 0 };
  }
  const existingFeedbackAlerts = await policyIntelDb.select({ alertId: feedbackLog.alertId }).from(feedbackLog);
  const feedbackAlertIds = new Set(existingFeedbackAlerts.map((r) => r.alertId));
  const highAlerts = await policyIntelDb.select().from(alerts).where(sql`${alerts.relevanceScore} >= 35 AND ${alerts.reasonsJson}::text LIKE '%evaluator%'`).orderBy(sql`RANDOM()`).limit(Math.ceil(sampleSize * 0.5));
  const lowAlerts = await policyIntelDb.select().from(alerts).where(sql`${alerts.relevanceScore} <= 15 AND ${alerts.relevanceScore} > 0 AND ${alerts.reasonsJson}::text LIKE '%evaluator%'`).orderBy(sql`RANDOM()`).limit(Math.ceil(sampleSize * 0.5));
  const sample = [...highAlerts, ...lowAlerts];
  let feedbackGenerated = 0;
  let promoted = 0;
  let suppressed = 0;
  let skipped = 0;
  const EVALUATOR_TO_AGENT = {
    procedural_significance: "procedural",
    matter_relevance: "relevance",
    stakeholder_impact: "stakeholder",
    actionability: "actionability"
  };
  const config = await getChampionConfig();
  for (const alert of sample) {
    if (feedbackAlertIds.has(alert.id)) {
      skipped++;
      continue;
    }
    try {
      const reasons = alert.reasonsJson ?? [];
      const evaluators = reasons.filter((r) => typeof r.evaluator === "string" && r.evaluator !== "_pipeline");
      const agentScores = [];
      for (const ev of evaluators) {
        const agentName = EVALUATOR_TO_AGENT[ev.evaluator];
        if (agentName) {
          const rawScore = ev.evaluatorScore ?? 0;
          const maxScore = ev.maxScore ?? 25;
          agentScores.push({
            agent: agentName,
            score: rawScore / maxScore,
            // normalize to 0-1
            confidence: maxScore > 0 ? Math.min(1, rawScore / maxScore + 0.3) : 0.5,
            rationale: ev.rationale ?? ""
          });
        }
      }
      agentScores.push({
        agent: "timeliness",
        score: 0.5,
        confidence: 0.3,
        rationale: "bootstrap default"
      });
      agentScores.push({
        agent: "regime",
        score: 0.4,
        confidence: 0.3,
        rationale: "bootstrap default"
      });
      let outcome;
      if (alert.relevanceScore >= 35) {
        outcome = "promoted";
        promoted++;
      } else {
        outcome = "suppressed";
        suppressed++;
      }
      await policyIntelDb.insert(feedbackLog).values({
        alertId: alert.id,
        outcome,
        originalScore: alert.relevanceScore,
        originalConfidence: alert.confidenceScore / 100,
        agentScoresJson: agentScores,
        weightsJson: config.weights,
        regime: "interim"
        // most data is from interim periods
      });
      feedbackGenerated++;
      metrics.inc("policy_intel_feedback_events_total", { outcome });
    } catch {
      skipped++;
    }
  }
  return {
    sampled: sample.length,
    feedbackGenerated,
    promoted,
    suppressed,
    skipped
  };
}

// server/policy-intel/engine/agent-pipeline.ts
var PROCEDURAL_KEYWORDS = {
  "floor vote": 25,
  "final passage": 25,
  "signed by governor": 25,
  "enrolled": 22,
  "third reading": 22,
  "conference committee": 20,
  "second reading": 18,
  "committee vote": 18,
  "reported favorably": 18,
  "substitute": 16,
  "amendment": 15,
  "public hearing": 14,
  "committee hearing": 12,
  "referred to committee": 10,
  "filed": 8,
  "introduced": 6,
  "posted": 5,
  "agenda": 4,
  "meeting": 3,
  "notice": 2
};
var proceduralAgent = {
  name: "procedural",
  analyze(ctx) {
    const text3 = `${ctx.docTitle} ${ctx.docSummary ?? ""}`.toLowerCase();
    let bestScore = 0;
    let bestKeyword = "";
    const found = [];
    for (const [keyword, score] of Object.entries(PROCEDURAL_KEYWORDS)) {
      if (text3.includes(keyword)) {
        found.push(keyword);
        if (score > bestScore) {
          bestScore = score;
          bestKeyword = keyword;
        }
      }
    }
    const confidence = found.length > 0 ? Math.min(1, 0.5 + bestScore / 25 * 0.5) : 0.3;
    return {
      agent: "procedural",
      score: bestScore / 25,
      confidence,
      rationale: bestScore > 0 ? `Procedural stage "${bestKeyword}" detected (${bestScore}/25)` : "No significant procedural stage detected",
      details: { found, bestKeyword, bestScore }
    };
  }
};
var relevanceAgent = {
  name: "relevance",
  analyze(ctx) {
    if (ctx.reasons.length === 0) {
      return {
        agent: "relevance",
        score: 0,
        confidence: 0.9,
        // High confidence that there's no match
        rationale: "No watchlist rule matches"
      };
    }
    const dimensions = new Set(ctx.reasons.map((r) => r.dimension));
    let rawScore = 0;
    if (dimensions.has("bill_id")) rawScore += 12;
    if (dimensions.has("committee")) rawScore += 7;
    if (dimensions.has("agency")) rawScore += 5;
    const keywordCount = ctx.reasons.filter((r) => r.dimension === "keyword").length;
    rawScore += Math.min(keywordCount * 3, 9);
    if (dimensions.size >= 3) rawScore += 4;
    else if (dimensions.size >= 2) rawScore += 2;
    const score = Math.min(rawScore, 25) / 25;
    const confidence = Math.min(1, 0.4 + dimensions.size * 0.2);
    const matched = Array.from(dimensions).join(", ");
    return {
      agent: "relevance",
      score,
      confidence,
      rationale: `Matched ${ctx.reasons.length} rule(s) across dimensions: ${matched}`,
      details: { dimensions: Array.from(dimensions), keywordCount, rawScore }
    };
  }
};
var STAKEHOLDER_INDICATORS = [
  "governor",
  "lt. governor",
  "speaker",
  "chairman",
  "chair",
  "commissioner",
  "secretary",
  "director",
  "executive director",
  "TxDOT",
  "TCEQ",
  "HHSC",
  "PUC",
  "TWC",
  "TEA",
  "METRO",
  "Houston",
  "Harris County",
  "city council",
  "commissioners court"
];
var STAKEHOLDER_TIERS = {
  governor: 3,
  "lt. governor": 3,
  speaker: 3,
  "signed by governor": 3,
  "executive director": 2,
  commissioner: 2,
  chairman: 2,
  chair: 2,
  secretary: 2,
  director: 1,
  TxDOT: 2,
  TCEQ: 2,
  HHSC: 2,
  PUC: 2,
  TWC: 1,
  TEA: 2,
  METRO: 1,
  Houston: 1,
  "Harris County": 2,
  "city council": 1,
  "commissioners court": 2
};
var stakeholderAgent = {
  name: "stakeholder",
  analyze(ctx) {
    const text3 = `${ctx.docTitle} ${ctx.docSummary ?? ""}`.toLowerCase();
    const found = [];
    for (const indicator of STAKEHOLDER_INDICATORS) {
      if (text3.includes(indicator.toLowerCase())) {
        found.push({
          indicator,
          tier: STAKEHOLDER_TIERS[indicator] ?? 1
        });
      }
    }
    const rawScore = found.reduce((sum, f) => {
      const pts = f.tier === 3 ? 8 : f.tier === 2 ? 5 : 3;
      return sum + pts;
    }, 0);
    const score = Math.min(rawScore, 25) / 25;
    const maxTier = found.length > 0 ? Math.max(...found.map((f) => f.tier)) : 0;
    const confidence = found.length > 0 ? Math.min(1, 0.5 + maxTier * 0.15 + found.length * 0.05) : 0.4;
    return {
      agent: "stakeholder",
      score,
      confidence,
      rationale: found.length > 0 ? `Stakeholder indicators: ${found.slice(0, 5).map((f) => f.indicator).join(", ")}${found.length > 5 ? ` +${found.length - 5} more` : ""}` : "No known stakeholder references detected",
      details: { found: found.map((f) => f.indicator), tiers: found.map((f) => f.tier) }
    };
  }
};
var ACTIONABILITY_PATTERNS = [
  { pattern: /vote\s+(scheduled|set|on)/i, score: 25, label: "vote scheduled" },
  { pattern: /deadline/i, score: 22, label: "deadline referenced" },
  { pattern: /hearing\s+(on|scheduled|set)/i, score: 20, label: "hearing scheduled" },
  { pattern: /public\s+comment/i, score: 18, label: "public comment period" },
  { pattern: /comment\s+period/i, score: 18, label: "comment period" },
  { pattern: /testimony/i, score: 16, label: "testimony referenced" },
  { pattern: /witness\s+list/i, score: 16, label: "witness list" },
  { pattern: /rulemaking/i, score: 14, label: "rulemaking activity" },
  { pattern: /proposed\s+rule/i, score: 14, label: "proposed rule" },
  { pattern: /effective\s+date/i, score: 12, label: "effective date mentioned" },
  { pattern: /procurement|rfp|bid/i, score: 12, label: "procurement action" },
  { pattern: /contract/i, score: 10, label: "contract referenced" },
  { pattern: /appropriat/i, score: 10, label: "appropriation referenced" },
  { pattern: /amendment/i, score: 8, label: "amendment activity" },
  { pattern: /report\s+(due|filed|released)/i, score: 8, label: "report activity" }
];
var actionabilityAgent = {
  name: "actionability",
  analyze(ctx) {
    const text3 = `${ctx.docTitle} ${ctx.docSummary ?? ""}`;
    let bestScore = 0;
    let bestLabel = "";
    const triggers = [];
    for (const { pattern, score: score2, label } of ACTIONABILITY_PATTERNS) {
      if (pattern.test(text3)) {
        triggers.push(label);
        if (score2 > bestScore) {
          bestScore = score2;
          bestLabel = label;
        }
      }
    }
    const score = bestScore / 25;
    const confidence = triggers.length > 0 ? Math.min(1, 0.6 + triggers.length * 0.1) : 0.5;
    return {
      agent: "actionability",
      score,
      confidence,
      rationale: bestScore > 0 ? `Actionable signal: ${bestLabel} (${bestScore}/25)` : "No immediate action trigger detected",
      details: { triggers, bestLabel, bestScore }
    };
  }
};
var timelinessAgent = {
  name: "timeliness",
  analyze(ctx) {
    const now = Date.now();
    let docAge = Infinity;
    if (ctx.docDate) {
      docAge = (now - new Date(ctx.docDate).getTime()) / (1e3 * 60 * 60);
    } else if (ctx.rawPayload?.date) {
      const parsed = new Date(ctx.rawPayload.date);
      if (!isNaN(parsed.getTime())) {
        docAge = (now - parsed.getTime()) / (1e3 * 60 * 60);
      }
    } else if (ctx.rawPayload?.lastAction) {
      const parsed = new Date(ctx.rawPayload.lastAction);
      if (!isNaN(parsed.getTime())) {
        docAge = (now - parsed.getTime()) / (1e3 * 60 * 60);
      }
    }
    let freshness;
    let rationale;
    if (docAge <= 24) {
      freshness = 1;
      rationale = "Document is less than 24 hours old \u2014 maximum freshness";
    } else if (docAge <= 72) {
      freshness = 0.85;
      rationale = "Document is 1-3 days old \u2014 high freshness";
    } else if (docAge <= 168) {
      freshness = 0.6;
      rationale = "Document is 3-7 days old \u2014 moderate freshness";
    } else if (docAge <= 720) {
      freshness = 0.3;
      rationale = "Document is 1-4 weeks old \u2014 low freshness";
    } else if (docAge !== Infinity) {
      freshness = 0.1;
      rationale = "Document is over a month old \u2014 stale";
    } else {
      freshness = 0.5;
      rationale = "Document age unknown \u2014 neutral freshness";
    }
    const confidence = docAge !== Infinity ? 0.8 : 0.3;
    return {
      agent: "timeliness",
      score: freshness,
      confidence,
      rationale,
      details: { docAgeHours: docAge === Infinity ? null : Math.round(docAge) }
    };
  }
};
var REGIME_CONTENT_SIGNALS = [
  {
    regime: "special_session",
    patterns: [
      /special\s+session/i,
      /called\s+session/i,
      /extraordinary\s+session/i
    ]
  },
  {
    regime: "sine_die",
    patterns: [
      /sine\s+die/i,
      /signed\s+by\s+(the\s+)?governor/i,
      /enrolled/i,
      /final\s+passage/i,
      /vetoed/i,
      /line[- ]item\s+veto/i
    ]
  },
  {
    regime: "conference",
    patterns: [
      /conference\s+committee/i,
      /free\s+conference/i,
      /conferees\s+appointed/i,
      /conference\s+report/i
    ]
  },
  {
    regime: "floor_action",
    patterns: [
      /floor\s+vote/i,
      /third\s+reading/i,
      /second\s+reading/i,
      /passed\s+(house|senate)/i,
      /record\s+vote/i,
      /yeas\s+and\s+nays/i,
      /calendar/i,
      /point\s+of\s+order/i
    ]
  },
  {
    regime: "committee_season",
    patterns: [
      /committee\s+hearing/i,
      /public\s+hearing/i,
      /witness\s+list/i,
      /reported\s+favorably/i,
      /substitute/i,
      /committee\s+vote/i,
      /referred\s+to\s+committee/i,
      /testimony/i,
      /markup/i
    ]
  },
  {
    regime: "early_session",
    patterns: [
      /convened/i,
      /session\s+opened/i,
      /first\s+reading/i,
      /filed/i,
      /introduced/i
    ]
  },
  {
    regime: "pre_filing",
    patterns: [
      /pre[- ]?fil(e|ing)/i,
      /interim\s+charge/i,
      /interim\s+report/i,
      /interim\s+study/i
    ]
  }
];
function getTexasSessionWindow(year) {
  if (year % 2 === 0) return null;
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysToFirstTue = (2 - dayOfWeek + 7) % 7;
  const firstTue = 1 + daysToFirstTue;
  const secondTue = firstTue + 7;
  const start2 = new Date(year, 0, secondTue);
  const end = new Date(start2.getTime() + 139 * 24 * 60 * 60 * 1e3);
  return { start: start2, end };
}
function detectLegislativeRegime(ctx) {
  const text3 = `${ctx.docTitle} ${ctx.docSummary ?? ""}`.toLowerCase();
  for (const { regime, patterns } of REGIME_CONTENT_SIGNALS) {
    for (const re of patterns) {
      if (re.test(text3)) {
        return regime;
      }
    }
  }
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const session = getTexasSessionWindow(year);
  if (session) {
    const dayOfSession = Math.floor(
      (now.getTime() - session.start.getTime()) / (24 * 60 * 60 * 1e3)
    );
    if (dayOfSession < 0) {
      return "pre_filing";
    }
    if (dayOfSession <= 14) {
      return "early_session";
    }
    if (dayOfSession <= 80) {
      return "committee_season";
    }
    if (dayOfSession <= 120) {
      return "floor_action";
    }
    if (dayOfSession <= 133) {
      return "conference";
    }
    if (dayOfSession <= 150) {
      return "sine_die";
    }
    return "interim";
  }
  if (year % 2 === 0 && month >= 11) {
    return "pre_filing";
  }
  return "interim";
}
var REGIME_CONFIG = {
  pre_filing: {
    urgencyMultiplier: 0.7,
    label: "Pre-filing season \u2014 bills being drafted and positioned",
    focus: "Track bill filings, interim charges, stakeholder positioning"
  },
  early_session: {
    urgencyMultiplier: 0.9,
    label: "Early session \u2014 convened, referrals and first readings underway",
    focus: "Committee assignments, bill referrals, early amendments"
  },
  committee_season: {
    urgencyMultiplier: 1.15,
    label: "Committee season \u2014 hearings, testimony, and markups at peak",
    focus: "Committee hearings, witness lists, substitutes, favorable reports"
  },
  floor_action: {
    urgencyMultiplier: 1.3,
    label: "Floor action \u2014 bills moving through 2nd/3rd readings and votes",
    focus: "Floor votes, calendars, amendments, points of order"
  },
  conference: {
    urgencyMultiplier: 1.35,
    label: "Conference period \u2014 chambers reconciling competing versions",
    focus: "Conference committee reports, final amendments, deal-making"
  },
  sine_die: {
    urgencyMultiplier: 1.4,
    label: "Sine die \u2014 final passage, enrollment, governor action window",
    focus: "Enrolled bills, governor signatures/vetoes, effective dates"
  },
  special_session: {
    urgencyMultiplier: 1.4,
    label: "Special session \u2014 compressed timeline, governor-set agenda",
    focus: "Governor's call items only \u2014 fast-track action required"
  },
  interim: {
    urgencyMultiplier: 0.6,
    label: "Interim \u2014 legislature not in session",
    focus: "Interim studies, agency rulemaking, stakeholder engagement"
  }
};
var regimeAgent = {
  name: "regime",
  analyze(ctx) {
    const regime = detectLegislativeRegime(ctx);
    const profile = REGIME_CONFIG[regime];
    const score = Math.min(profile.urgencyMultiplier / 1.4, 1);
    const text3 = `${ctx.docTitle} ${ctx.docSummary ?? ""}`.toLowerCase();
    const contentDetected = REGIME_CONTENT_SIGNALS.some(
      ({ patterns }) => patterns.some((re) => re.test(text3))
    );
    const confidence = contentDetected ? 0.85 : 0.65;
    return {
      agent: "regime",
      score,
      confidence,
      rationale: `${profile.label}. Focus: ${profile.focus}`,
      details: {
        regime,
        urgencyMultiplier: profile.urgencyMultiplier,
        contentDetected,
        focus: profile.focus
      }
    };
  }
};
var DEFAULT_WEIGHTS = {
  procedural: 0.25,
  relevance: 0.3,
  stakeholder: 0.15,
  actionability: 0.15,
  timeliness: 0.1,
  regime: 0.05
};
var DEFAULT_CONFIG = {
  weights: DEFAULT_WEIGHTS,
  escalateThreshold: 60,
  archiveThreshold: 20
};
var REGIME_WEIGHT_DELTAS = {
  pre_filing: { relevance: 0.05, stakeholder: 0.05, procedural: -0.05, actionability: -0.05 },
  early_session: { procedural: 0.03, relevance: 0.02, actionability: -0.03, stakeholder: -0.02 },
  committee_season: { actionability: 0.06, procedural: 0.04, stakeholder: 0.02, relevance: -0.08, timeliness: -0.04 },
  floor_action: { procedural: 0.08, actionability: 0.06, timeliness: 0.04, relevance: -0.1, stakeholder: -0.08 },
  conference: { procedural: 0.08, actionability: 0.08, timeliness: 0.04, relevance: -0.12, stakeholder: -0.08 },
  sine_die: { procedural: 0.1, actionability: 0.08, timeliness: 0.05, relevance: -0.13, stakeholder: -0.1 },
  special_session: { procedural: 0.08, actionability: 0.08, timeliness: 0.05, relevance: -0.12, stakeholder: -0.09 },
  interim: { stakeholder: 0.05, relevance: 0.05, procedural: -0.05, actionability: -0.05 }
};
function normalizeWeights(weights) {
  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);
  if (total <= 0) {
    const n = Object.keys(weights).length;
    return Object.fromEntries(Object.keys(weights).map((k) => [k, 1 / n]));
  }
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]));
}
function metaWeigh(agents, regime, config = DEFAULT_CONFIG) {
  const w = { ...config.weights };
  const deltas = REGIME_WEIGHT_DELTAS[regime] ?? {};
  for (const [key, delta] of Object.entries(deltas)) {
    if (key in w) {
      w[key] = Math.max(0.05, (w[key] ?? 0) + (delta ?? 0));
    }
  }
  const normalized = normalizeWeights(w);
  let weightedSum = 0;
  let confidenceSum = 0;
  for (const agent of agents) {
    const weight = normalized[agent.agent] ?? 0;
    const effectiveScore = agent.score * agent.confidence;
    weightedSum += weight * effectiveScore;
    confidenceSum += weight * agent.confidence;
  }
  const totalScore = Math.round(Math.min(100, Math.max(0, weightedSum * 100)));
  const scores = agents.map((a) => a.score);
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
  const disagreementPenalty = Math.min(0.3, variance * 2);
  const confidence = Math.max(0, Math.min(1, confidenceSum - disagreementPenalty));
  let action;
  if (totalScore >= config.escalateThreshold) {
    action = "escalate";
  } else if (totalScore <= config.archiveThreshold) {
    action = "archive";
  } else {
    action = "watch";
  }
  const sorted = [...agents].sort((a, b) => {
    const wa = normalized[a.agent] ?? 0;
    const wb = normalized[b.agent] ?? 0;
    return b.score * wb - a.score * wa;
  });
  const explanationParts = sorted.filter((a) => a.score > 0).slice(0, 3).map((a) => `${a.agent}: ${a.rationale}`);
  const explanation = explanationParts.length > 0 ? explanationParts.join(" | ") + ` -> ${action.toUpperCase()} (conf=${confidence.toFixed(2)})` : `Low-confidence match -> ${action.toUpperCase()} (conf=${confidence.toFixed(2)})`;
  return {
    action,
    totalScore,
    confidence,
    explanation,
    agents,
    weights: normalized,
    regime
  };
}
var ALL_AGENTS = [
  proceduralAgent,
  relevanceAgent,
  stakeholderAgent,
  actionabilityAgent,
  timelinessAgent,
  regimeAgent
];
async function runAgentPipeline(docTitle, docSummary, reasons, opts) {
  const t0 = Date.now();
  const ctx = {
    docTitle,
    docSummary,
    reasons,
    docDate: opts?.docDate ?? null,
    rawPayload: opts?.rawPayload ?? {}
  };
  const regime = detectLegislativeRegime(ctx);
  const agentScores = ALL_AGENTS.map((agent) => agent.analyze(ctx));
  const championConfig = await getChampionConfig();
  const config = {
    weights: championConfig.weights,
    escalateThreshold: championConfig.escalateThreshold,
    archiveThreshold: championConfig.archiveThreshold
  };
  const signal = metaWeigh(agentScores, regime, config);
  const durationMs = Date.now() - t0;
  metrics.inc("policy_intel_pipeline_runs_total");
  metrics.inc("policy_intel_pipeline_actions_total", { action: signal.action });
  metrics.observe("policy_intel_pipeline_score", {}, signal.totalScore);
  metrics.observe("policy_intel_pipeline_confidence", {}, signal.confidence);
  metrics.observe("policy_intel_pipeline_duration_ms", {}, durationMs);
  metrics.inc("policy_intel_regime_detections_total", { regime });
  for (const r of Object.keys(REGIME_CONFIG)) {
    metrics.set("policy_intel_regime_current", { regime: r }, r === regime ? 1 : 0);
  }
  for (const a of agentScores) {
    metrics.observe("policy_intel_agent_score", { agent: a.agent }, a.score);
  }
  return signal;
}
async function buildAgentScorecard(docTitle, docSummary, reasons, opts) {
  const signal = await runAgentPipeline(docTitle, docSummary, reasons, opts);
  const evaluators = signal.agents.map((a) => ({
    evaluator: a.agent,
    score: Math.round(a.score * 25),
    maxScore: 25,
    rationale: a.rationale
  }));
  const topFactors = signal.agents.filter((a) => a.score > 0).sort((a, b) => b.score - a.score).map((a) => a.rationale);
  const summary = topFactors.length > 0 ? topFactors.slice(0, 2).join("; ") : "Low-confidence match \u2014 no strong signals detected";
  return {
    evaluators,
    totalScore: signal.totalScore,
    summary: `[${signal.action.toUpperCase()}] ${summary} (confidence: ${(signal.confidence * 100).toFixed(0)}%)`,
    pipelineSignal: signal
  };
}
function getPipelineConfig() {
  return {
    agents: ALL_AGENTS.map((a) => a.name),
    defaultWeights: { ...DEFAULT_WEIGHTS },
    escalateThreshold: DEFAULT_CONFIG.escalateThreshold,
    archiveThreshold: DEFAULT_CONFIG.archiveThreshold,
    regimeWeightDeltas: { ...REGIME_WEIGHT_DELTAS }
  };
}
function detectRegime(text3 = "", date = /* @__PURE__ */ new Date()) {
  const lower = text3.toLowerCase();
  for (const { regime, patterns } of REGIME_CONTENT_SIGNALS) {
    for (const re of patterns) {
      if (re.test(lower)) return regime;
    }
  }
  const ctx = {
    docTitle: "",
    docSummary: "",
    reasons: [],
    docDate: date
  };
  return detectLegislativeRegime(ctx);
}

// server/policy-intel/security.ts
var TOKEN_LIKE_PATTERNS = [
  /(Bearer\s+)[A-Za-z0-9._~+\/-]+/gi,
  /(api[_-]?key\s*[:=]\s*)[^\s,;]+/gi,
  /(token\s*[:=]\s*)[^\s,;]+/gi,
  /(secret\s*[:=]\s*)[^\s,;]+/gi,
  /(password\s*[:=]\s*)[^\s,;]+/gi
];
var URL_SECRET_PATTERN = /([?&](?:api[_-]?key|token|secret|password)=)[^&#\s]*/gi;
function redactSecrets(input) {
  let output = input;
  for (const pattern of TOKEN_LIKE_PATTERNS) {
    output = output.replace(pattern, "$1[REDACTED]");
  }
  output = output.replace(URL_SECRET_PATTERN, "$1[REDACTED]");
  return output;
}
function safeErrorMessage(error, fallback = "Unexpected server error") {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const sanitized = redactSecrets(raw).replace(/\s+/g, " ").trim();
  if (!sanitized) return fallback;
  return sanitized.length > 400 ? `${sanitized.slice(0, 400)}...` : sanitized;
}

// server/policy-intel/notify.ts
init_logger();
var log2 = createLogger("notify");
var SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? "";
async function notifySlack(title, body, opts) {
  if (!SLACK_WEBHOOK_URL) return false;
  try {
    const attachment = {
      color: opts?.color ?? "#3498db",
      title,
      text: body,
      ts: Math.floor(Date.now() / 1e3)
    };
    if (opts?.fields) attachment.fields = opts.fields;
    const resp = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachments: [attachment] })
    });
    if (!resp.ok) {
      const body2 = await resp.text();
      log2.error({ status: resp.status }, "Slack webhook returned error");
      return false;
    }
    return true;
  } catch (err) {
    log2.error({ err: safeErrorMessage(err, "Webhook call failed") }, "Slack webhook failed");
    return false;
  }
}
async function notifyHighPriorityAlert(alert) {
  const color = alert.relevanceScore >= 80 ? "#e74c3c" : "#e67e22";
  return notifySlack(
    `\u{1F6A8} High-Priority Alert: ${alert.title}`,
    alert.whyItMatters?.slice(0, 300) ?? "No summary available",
    {
      color,
      fields: [
        { title: "Score", value: String(alert.relevanceScore), short: true },
        { title: "Watchlist", value: alert.watchlistName ?? "Unknown", short: true },
        { title: "Alert ID", value: String(alert.id), short: true }
      ]
    }
  );
}

// server/policy-intel/services/alert-service.ts
init_logger();
var log3 = createLogger("alert-service");
var BASE_COOLDOWN_MS = 24 * 60 * 60 * 1e3;
var REGIME_COOLDOWN_MULTIPLIER = {
  pre_filing: 2,
  // 48h — minimal activity, reduce noise
  early_session: 1.5,
  // 36h
  committee_season: 1,
  // 24h — standard
  floor_action: 0.5,
  // 12h — fast-moving, need timely alerts
  conference: 0.33,
  // 8h — critical phase
  sine_die: 0.25,
  // 6h — final push, every alert matters
  special_session: 0.33,
  // 8h — governor's priority
  interim: 2
  // 48h — quiet period
};
function getAdaptiveCooldownMs() {
  const regime = detectRegime("", /* @__PURE__ */ new Date());
  const multiplier = REGIME_COOLDOWN_MULTIPLIER[regime] ?? 1;
  return Math.round(BASE_COOLDOWN_MS * multiplier);
}
async function processDocumentAlerts(doc, workspaceId, activeWatchlists) {
  const result = {
    created: 0,
    skippedDuplicate: 0,
    skippedCooldown: 0,
    details: []
  };
  const workspaceWatchlists = activeWatchlists ?? await policyIntelDb.select().from(watchlists).where(
    and2(
      eq4(watchlists.workspaceId, workspaceId),
      eq4(watchlists.isActive, true)
    )
  );
  if (workspaceWatchlists.length === 0) return result;
  metrics.inc("policy_intel_docs_processed_total");
  const matches = matchDocumentToAllWatchlists(doc, workspaceWatchlists);
  if (matches.length === 0) return result;
  metrics.inc("policy_intel_docs_matched_total");
  for (const match of matches) {
    const existing = await policyIntelDb.select({ id: alerts.id }).from(alerts).where(
      and2(
        eq4(alerts.sourceDocumentId, doc.id),
        eq4(alerts.watchlistId, match.watchlist.id)
      )
    );
    if (existing.length > 0) {
      result.skippedDuplicate++;
      metrics.inc("policy_intel_alerts_skipped_total", { reason: "duplicate" });
      continue;
    }
    const cooldownCutoff = new Date(Date.now() - getAdaptiveCooldownMs());
    const recentAlerts = await policyIntelDb.select({ id: alerts.id }).from(alerts).where(
      and2(
        eq4(alerts.watchlistId, match.watchlist.id),
        eq4(alerts.workspaceId, workspaceId),
        gt(alerts.createdAt, cooldownCutoff),
        eq4(alerts.title, doc.title)
      )
    );
    if (recentAlerts.length > 0) {
      result.skippedCooldown++;
      metrics.inc("policy_intel_alerts_skipped_total", { reason: "cooldown" });
      continue;
    }
    const scorecard = await buildAgentScorecard(
      doc.title,
      doc.summary,
      match.reasons,
      {
        docDate: doc.publishedAt ? new Date(doc.publishedAt) : doc.fetchedAt ? new Date(doc.fetchedAt) : null,
        rawPayload: doc.rawPayload
      }
    );
    const whyItMatters = buildWhyItMatters(doc.title, match.reasons);
    const reasonsJson = scorecard.evaluators.map((e) => ({
      evaluator: e.evaluator,
      evaluatorScore: e.score,
      maxScore: e.maxScore,
      rationale: e.rationale
    }));
    reasonsJson.push({
      evaluator: "_pipeline",
      action: scorecard.pipelineSignal.action,
      confidence: scorecard.pipelineSignal.confidence,
      regime: scorecard.pipelineSignal.regime,
      weights: scorecard.pipelineSignal.weights,
      explanation: scorecard.pipelineSignal.explanation
    });
    const [created] = await policyIntelDb.insert(alerts).values({
      workspaceId,
      watchlistId: match.watchlist.id,
      sourceDocumentId: doc.id,
      title: doc.title,
      summary: doc.summary,
      whyItMatters: `${whyItMatters}

Scorecard: ${scorecard.summary}`,
      status: "pending_review",
      relevanceScore: scorecard.totalScore,
      reasonsJson
    }).returning({ id: alerts.id });
    result.created++;
    metrics.inc("policy_intel_alerts_created_total");
    metrics.observe("policy_intel_alert_score", {}, scorecard.totalScore);
    result.details.push({
      alertId: created.id,
      watchlist: match.watchlist.name,
      score: scorecard.totalScore
    });
    if (scorecard.totalScore >= 60) {
      notifyHighPriorityAlert({
        id: created.id,
        title: doc.title,
        relevanceScore: scorecard.totalScore,
        whyItMatters: `${whyItMatters}

Scorecard: ${scorecard.summary}`,
        watchlistName: match.watchlist.name
      }).catch((err) => log3.error({ err: err?.message ?? err }, "Slack notification failed"));
    }
  }
  return result;
}

// server/policy-intel/jobs/load-active-watchlists.ts
init_db();
init_schema_policy_intel();
import { eq as eq5 } from "drizzle-orm";
async function loadActiveWatchlistsByWorkspace() {
  const [allWorkspaces, activeWatchlists] = await Promise.all([
    policyIntelDb.select({ id: workspaces.id }).from(workspaces),
    policyIntelDb.select().from(watchlists).where(eq5(watchlists.isActive, true))
  ]);
  const watchlistsByWorkspace = /* @__PURE__ */ new Map();
  for (const watchlist of activeWatchlists) {
    const existing = watchlistsByWorkspace.get(watchlist.workspaceId) ?? [];
    existing.push(watchlist);
    watchlistsByWorkspace.set(watchlist.workspaceId, existing);
  }
  return { allWorkspaces, watchlistsByWorkspace };
}

// server/policy-intel/jobs/run-tlo-rss.ts
async function runTloRssJob() {
  const result = {
    feedsAttempted: 0,
    feedErrors: [],
    totalFetched: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    alerts: { created: 0, skippedDuplicate: 0, skippedCooldown: 0, details: [] }
  };
  const { allWorkspaces, watchlistsByWorkspace } = await loadActiveWatchlistsByWorkspace();
  const feedResults = await fetchAllTloFeeds();
  result.feedsAttempted = feedResults.length;
  for (const feedResult of feedResults) {
    if (feedResult.error) {
      result.feedErrors.push({ feedType: feedResult.feedType, error: feedResult.error });
      continue;
    }
    result.totalFetched += feedResult.documents.length;
    for (const doc of feedResult.documents) {
      try {
        const { doc: savedDoc, inserted } = await upsertSourceDocument(doc);
        if (inserted) {
          result.inserted++;
        } else {
          result.skipped++;
        }
        for (const ws of allWorkspaces) {
          const workspaceWatchlists = watchlistsByWorkspace.get(ws.id) ?? [];
          if (workspaceWatchlists.length === 0) {
            continue;
          }
          const alertResult = await processDocumentAlerts(savedDoc, ws.id, workspaceWatchlists);
          result.alerts.created += alertResult.created;
          result.alerts.skippedDuplicate += alertResult.skippedDuplicate;
          result.alerts.skippedCooldown += alertResult.skippedCooldown;
          result.alerts.details.push(...alertResult.details);
        }
      } catch (err) {
        result.errors.push({
          title: doc.title,
          error: err?.message ?? String(err)
        });
      }
    }
  }
  return result;
}

// server/policy-intel/connectors/texas/legiscan.ts
import axios2 from "axios";
var BASE_URL = "https://api.legiscan.com/";
var DEFAULT_DETAIL_CONCURRENCY = 6;
var MAX_DETAIL_CONCURRENCY = 12;
function getApiKey() {
  const key = process.env.LEGISCAN_API_KEY;
  if (!key) throw new Error("LEGISCAN_API_KEY is not set");
  return key;
}
function resolveDetailConcurrency(requested) {
  const raw = requested ?? Number.parseInt(process.env.LEGISCAN_DETAIL_CONCURRENCY ?? `${DEFAULT_DETAIL_CONCURRENCY}`, 10);
  if (!Number.isFinite(raw) || raw < 1) {
    return DEFAULT_DETAIL_CONCURRENCY;
  }
  return Math.max(1, Math.min(MAX_DETAIL_CONCURRENCY, Math.floor(raw)));
}
function resolveOffset(offset) {
  if (!Number.isFinite(offset) || !offset) return 0;
  return Math.max(0, Math.floor(offset));
}
function resolveOrderBy(orderBy) {
  if (!orderBy) return "bill_id_asc";
  return orderBy;
}
function compareByLastActionDate(left, right) {
  const leftTime = Date.parse(left.last_action_date || "") || 0;
  const rightTime = Date.parse(right.last_action_date || "") || 0;
  return leftTime - rightTime;
}
function orderMasterListEntries(entries, orderBy) {
  const resolvedOrder = resolveOrderBy(orderBy);
  const next = [...entries];
  switch (resolvedOrder) {
    case "bill_id_desc":
      next.sort((left, right) => right.bill_id - left.bill_id);
      break;
    case "last_action_date_asc":
      next.sort((left, right) => compareByLastActionDate(left, right) || left.bill_id - right.bill_id);
      break;
    case "last_action_date_desc":
      next.sort((left, right) => compareByLastActionDate(right, left) || left.bill_id - right.bill_id);
      break;
    case "bill_id_asc":
    default:
      next.sort((left, right) => left.bill_id - right.bill_id);
      break;
  }
  return next;
}
async function getCurrentTexasSession(apiKey) {
  const res = await axios2.get(BASE_URL, {
    params: { key: apiKey, op: "getSessionList", state: "TX" },
    timeout: 3e4
  });
  const sessions = res.data?.sessions;
  if (!sessions || sessions.length === 0) {
    throw new Error("No Texas sessions returned from LegiScan");
  }
  const current = sessions.find((s) => s.current === 1) ?? sessions[0];
  return {
    sessionId: current.session_id,
    sessionName: current.session_name
  };
}
async function fetchMasterList(apiKey, sessionId) {
  const res = await axios2.get(BASE_URL, {
    params: { key: apiKey, op: "getMasterList", id: sessionId },
    timeout: 6e4
  });
  const raw = res.data?.masterlist;
  if (!raw) throw new Error("Empty master list response");
  const entries = [];
  for (const key of Object.keys(raw)) {
    const entry = raw[key];
    if (entry?.bill_id) entries.push(entry);
  }
  return entries;
}
async function fetchBillDetail(apiKey, billId) {
  const res = await axios2.get(BASE_URL, {
    params: { key: apiKey, op: "getBill", id: billId },
    timeout: 3e4
  });
  const bill = res.data?.bill;
  if (!bill) return null;
  const lastAction = bill.history?.length > 0 ? bill.history[bill.history.length - 1] : null;
  return {
    billId: bill.bill_id,
    billNumber: bill.bill_number ?? "",
    title: bill.title ?? "",
    description: bill.description ?? "",
    status: bill.status_text ?? bill.status?.toString() ?? "Unknown",
    chamber: bill.body_name ?? "Unknown",
    sponsors: (bill.sponsors ?? []).map((s) => ({
      name: s.name ?? "Unknown",
      role: s.role ?? "Sponsor",
      party: s.party ?? "Unknown"
    })),
    subjects: bill.subjects ?? [],
    url: bill.url ?? "",
    stateLink: bill.state_link ?? "",
    lastAction: lastAction ? { date: lastAction.date, action: lastAction.action, chamber: lastAction.chamber } : null,
    statusDate: bill.status_date ?? "",
    lastActionDate: bill.last_action_date ?? "",
    history: (bill.history ?? []).map((h) => ({
      date: h.date,
      action: h.action,
      chamber: h.chamber ?? ""
    })),
    sessionId: bill.session_id ?? 0,
    sessionName: bill.session?.session_name ?? ""
  };
}
function normaliseToSourceDocument2(bill) {
  const externalId = `legiscan:${bill.billId}`;
  const normalizedParts = [
    bill.billNumber,
    bill.title,
    bill.description,
    bill.status,
    bill.chamber,
    ...bill.sponsors.map((s) => `${s.name} (${s.party})`),
    ...bill.subjects.map((s) => s.subject_name),
    bill.lastAction ? `${bill.lastAction.date}: ${bill.lastAction.action}` : ""
  ].filter(Boolean);
  const normalizedText = normalizedParts.join("\n");
  const tags = [
    bill.billNumber.replace(/\s+/g, "_").toUpperCase(),
    `chamber:${bill.chamber.toLowerCase()}`,
    `status:${bill.status.toLowerCase().replace(/\s+/g, "_")}`
  ];
  for (const sub of bill.subjects) {
    tags.push(`subject:${sub.subject_name.toLowerCase().replace(/\s+/g, "_")}`);
  }
  const sourceUrl = bill.stateLink || bill.url || `https://legiscan.com/TX/bill/${bill.billNumber}`;
  return {
    sourceType: "texas_legislation",
    publisher: "LegiScan / Texas Legislature",
    sourceUrl,
    externalId,
    title: `${bill.billNumber} \u2014 ${bill.title}`.slice(0, 500),
    summary: bill.description?.slice(0, 1e3) || null,
    publishedAt: bill.statusDate ? new Date(bill.statusDate) : null,
    normalizedText,
    rawPayload: {
      legiscanBillId: bill.billId,
      billId: bill.billNumber,
      billNumber: bill.billNumber,
      chamber: bill.chamber,
      status: bill.status,
      sponsors: bill.sponsors,
      subjects: bill.subjects,
      lastAction: bill.lastAction,
      history: bill.history.slice(-10),
      // keep last 10 actions
      sessionId: bill.sessionId
    },
    tagsJson: tags,
    checksum: null
    // computed by source-document-service
  };
}
function inferChamberFromBillNumber(billNumber) {
  const upper = billNumber.trim().toUpperCase();
  if (upper.startsWith("H")) return "House";
  if (upper.startsWith("S")) return "Senate";
  return "Unknown";
}
function normalizeStatus(status) {
  if (typeof status === "string") {
    return status;
  }
  return `status_${status}`;
}
function parseLegiscanDate(value) {
  const cleaned = value?.trim();
  if (!cleaned) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned) && Number.isNaN(Date.parse(cleaned))) {
    return null;
  }
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function normaliseMasterListEntryToSourceDocument(entry, sessionId, sessionName) {
  const chamber = inferChamberFromBillNumber(entry.number);
  const status = normalizeStatus(entry.status);
  const lastAction = entry.last_action ?? "";
  const normalizedText = [
    entry.number,
    entry.title,
    entry.description,
    status,
    chamber,
    lastAction ? `Last action: ${lastAction}` : "",
    sessionName
  ].filter(Boolean).join("\n");
  const tags = [
    entry.number.replace(/\s+/g, "_").toUpperCase(),
    `chamber:${chamber.toLowerCase()}`,
    `status:${status.toLowerCase().replace(/\s+/g, "_")}`,
    "legiscan_masterlist"
  ];
  const publishedAt = parseLegiscanDate(entry.last_action_date) ?? parseLegiscanDate(entry.status_date);
  return {
    sourceType: "texas_legislation",
    publisher: "LegiScan / Texas Legislature",
    sourceUrl: entry.url || `https://legiscan.com/TX/bill/${entry.number}/${(/* @__PURE__ */ new Date()).getFullYear()}`,
    externalId: `legiscan:${entry.bill_id}`,
    title: `${entry.number} \u2014 ${entry.title}`.slice(0, 500),
    summary: (entry.description || lastAction || entry.title).slice(0, 1e3) || null,
    publishedAt,
    normalizedText,
    rawPayload: {
      legiscanBillId: entry.bill_id,
      billId: entry.number,
      billNumber: entry.number,
      chamber,
      status,
      statusCode: entry.status,
      changeHash: entry.change_hash ?? null,
      lastAction,
      lastActionDate: entry.last_action_date,
      sourceKind: "master_list_backfill",
      sessionId,
      sessionName
    },
    tagsJson: tags,
    checksum: null
  };
}
async function resolveSession(apiKey, requestedSessionId) {
  if (requestedSessionId) {
    const res = await axios2.get(BASE_URL, {
      params: { key: apiKey, op: "getSessionList", state: "TX" },
      timeout: 3e4
    });
    const match = (res.data?.sessions ?? []).find((s) => s.session_id === requestedSessionId);
    return {
      sessionId: requestedSessionId,
      sessionName: match?.session_name ?? `Session ${requestedSessionId}`
    };
  }
  return getCurrentTexasSession(apiKey);
}
async function fetchLegiscanMasterListBackfill(opts = {}) {
  const apiKey = getApiKey();
  const { sessionId, sessionName } = await resolveSession(apiKey, opts.sessionId);
  const masterList = await fetchMasterList(apiKey, sessionId);
  let candidates = masterList;
  if (opts.since) {
    candidates = candidates.filter((entry) => entry.last_action_date >= opts.since);
  }
  candidates = orderMasterListEntries(candidates, opts.orderBy);
  const totalCandidates = candidates.length;
  const offset = resolveOffset(opts.offset);
  if (offset > 0) {
    candidates = candidates.slice(offset);
  }
  if (opts.limit && opts.limit > 0) {
    candidates = candidates.slice(0, opts.limit);
  }
  return {
    sessionId,
    sessionName,
    totalInMaster: masterList.length,
    totalCandidates,
    offset,
    orderBy: resolveOrderBy(opts.orderBy),
    documents: candidates.map((entry) => normaliseMasterListEntryToSourceDocument(entry, sessionId, sessionName))
  };
}
async function fetchLegiscanBills(opts = {}) {
  const apiKey = getApiKey();
  const { sessionId, sessionName } = await resolveSession(apiKey, opts.sessionId);
  const masterList = await fetchMasterList(apiKey, sessionId);
  let candidates = masterList;
  if (opts.since) {
    candidates = masterList.filter((e) => e.last_action_date >= opts.since);
  }
  candidates = orderMasterListEntries(candidates, opts.orderBy);
  const totalCandidates = candidates.length;
  const offset = resolveOffset(opts.offset);
  if (offset > 0) {
    candidates = candidates.slice(offset);
  }
  if (opts.limit && opts.limit > 0) {
    candidates = candidates.slice(0, opts.limit);
  }
  const result = {
    sessionId,
    sessionName,
    totalInMaster: masterList.length,
    totalCandidates,
    offset,
    orderBy: resolveOrderBy(opts.orderBy),
    fetched: 0,
    bills: [],
    documents: [],
    errors: []
  };
  const detailConcurrency = Math.min(resolveDetailConcurrency(opts.detailConcurrency), candidates.length || 1);
  let nextIndex = 0;
  const workers = Array.from({ length: detailConcurrency }, async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= candidates.length) {
        return;
      }
      const entry = candidates[currentIndex];
      try {
        const bill = await fetchBillDetail(apiKey, entry.bill_id);
        if (!bill) {
          result.errors.push({ billId: entry.bill_id, error: "No detail returned" });
          continue;
        }
        result.bills.push(bill);
        result.documents.push(normaliseToSourceDocument2(bill));
        result.fetched++;
      } catch (err) {
        result.errors.push({
          billId: entry.bill_id,
          error: err?.message ?? String(err)
        });
      }
    }
  });
  await Promise.all(workers);
  return result;
}

// server/policy-intel/jobs/run-legiscan.ts
async function runLegiscanJob(opts = {}) {
  const mode = opts.mode ?? "recent";
  const sinceDays = opts.sinceDays ?? 7;
  let since;
  if (mode === "recent") {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - sinceDays);
    since = d.toISOString().slice(0, 10);
  }
  const result = {
    mode,
    sessionId: 0,
    sessionName: "",
    totalInMaster: 0,
    totalCandidates: 0,
    chunk: {
      offset: Math.max(0, Math.floor(Number(opts.offset) || 0)),
      limit: opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : null,
      orderBy: opts.orderBy ?? "bill_id_asc"
    },
    fetched: 0,
    inserted: 0,
    skipped: 0,
    fetchErrors: [],
    upsertErrors: [],
    alerts: { created: 0, skippedDuplicate: 0, skippedCooldown: 0, details: [] }
  };
  let documents = [];
  if (mode === "backfill") {
    const fetchResult = await fetchLegiscanMasterListBackfill({
      since,
      limit: opts.limit,
      offset: opts.offset,
      orderBy: opts.orderBy,
      sessionId: opts.sessionId
    });
    result.sessionId = fetchResult.sessionId;
    result.sessionName = fetchResult.sessionName;
    result.totalInMaster = fetchResult.totalInMaster;
    result.totalCandidates = fetchResult.totalCandidates;
    result.chunk.offset = fetchResult.offset;
    result.chunk.orderBy = fetchResult.orderBy;
    result.fetched = fetchResult.documents.length;
    result.fetchErrors = [];
    documents = fetchResult.documents;
  } else {
    const fetchResult = await fetchLegiscanBills({
      since,
      limit: opts.limit,
      offset: opts.offset,
      orderBy: opts.orderBy,
      sessionId: opts.sessionId,
      detailConcurrency: opts.detailConcurrency
    });
    result.sessionId = fetchResult.sessionId;
    result.sessionName = fetchResult.sessionName;
    result.totalInMaster = fetchResult.totalInMaster;
    result.totalCandidates = fetchResult.totalCandidates;
    result.chunk.offset = fetchResult.offset;
    result.chunk.orderBy = fetchResult.orderBy;
    result.fetched = fetchResult.documents.length;
    result.fetchErrors = fetchResult.errors;
    documents = fetchResult.documents;
  }
  if (documents.length === 0) {
    return result;
  }
  const { allWorkspaces, watchlistsByWorkspace } = await loadActiveWatchlistsByWorkspace();
  for (const doc of documents) {
    try {
      const { doc: savedDoc, inserted } = await upsertSourceDocument(doc);
      if (inserted) {
        result.inserted++;
      } else {
        result.skipped++;
        continue;
      }
      for (const ws of allWorkspaces) {
        const workspaceWatchlists = watchlistsByWorkspace.get(ws.id) ?? [];
        if (workspaceWatchlists.length === 0) {
          continue;
        }
        const alertResult = await processDocumentAlerts(savedDoc, ws.id, workspaceWatchlists);
        result.alerts.created += alertResult.created;
        result.alerts.skippedDuplicate += alertResult.skippedDuplicate;
        result.alerts.skippedCooldown += alertResult.skippedCooldown;
        result.alerts.details.push(...alertResult.details);
      }
    } catch (err) {
      result.upsertErrors.push({
        title: doc.title,
        error: err?.message ?? String(err)
      });
    }
  }
  return result;
}

// server/policy-intel/routes.ts
init_logger();

// server/policy-intel/validation.ts
import { z } from "zod";
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message
      }));
      return res.status(400).json({ message: "Validation failed", errors });
    }
    req.body = result.data;
    next();
  };
}
var positiveInt = z.number().int().positive();
function escapeLike(input) {
  return input.replace(/[%_\\]/g, "\\$&");
}
var optionalPositiveInt = z.number().int().positive().optional();
var optionalString = z.string().optional();
var safeString = z.string().min(1).max(5e3);
var optionalSafeString = z.string().max(5e3).optional().nullable();
var createWorkspaceSchema = z.object({
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(500)
});
var createWatchlistSchema = z.object({
  workspaceId: positiveInt,
  name: z.string().min(1).max(500),
  topic: optionalSafeString,
  description: optionalSafeString,
  rulesJson: z.record(z.unknown()).optional().default({})
});
var patchWatchlistSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  topic: optionalSafeString,
  description: optionalSafeString,
  rulesJson: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional()
}).refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
var createSourceDocumentSchema = z.object({
  sourceType: z.string().min(1).max(100),
  publisher: z.string().min(1).max(500),
  sourceUrl: z.string().url().max(2e3),
  externalId: optionalSafeString,
  title: z.string().min(1).max(1e3),
  summary: optionalSafeString,
  publishedAt: z.string().datetime().optional().nullable(),
  checksum: optionalSafeString,
  rawPayload: z.record(z.unknown()).optional().default({}),
  normalizedText: optionalSafeString,
  tagsJson: z.array(z.string().max(200)).optional().default([])
});
var createAlertSchema = z.object({
  workspaceId: positiveInt,
  watchlistId: positiveInt,
  sourceDocumentId: positiveInt,
  title: z.string().min(1).max(1e3),
  summary: optionalSafeString,
  severity: z.enum(["high", "medium", "low", "info"]).optional().default("info"),
  status: z.enum(["pending_review", "ready", "sent", "suppressed"]).optional().default("pending_review"),
  alertReason: optionalSafeString,
  metadataJson: z.record(z.unknown()).optional()
});
var patchAlertSchema = z.object({
  status: z.enum(["pending_review", "ready", "sent", "suppressed"]).optional(),
  reviewerNote: z.string().max(5e3).optional()
}).refine((d) => d.status !== void 0 || d.reviewerNote !== void 0, {
  message: "Provide status and/or reviewerNote"
});
var bulkTriageSchema = z.object({
  suppressBelow: z.number().min(0).max(100).optional().default(20),
  promoteAbove: z.number().min(0).max(100).optional().default(70),
  dryRun: z.boolean().optional().default(false),
  approvalToken: z.string().max(200).optional().default("")
});
var createIssueRoomSchema = z.object({
  workspaceId: positiveInt,
  matterId: optionalPositiveInt.nullable(),
  slug: z.string().max(200).optional(),
  title: z.string().min(1).max(1e3),
  issueType: optionalSafeString,
  jurisdiction: z.string().max(100).optional().default("texas"),
  status: z.string().max(50).optional().default("active"),
  summary: optionalSafeString,
  recommendedPath: optionalSafeString,
  ownerUserId: optionalPositiveInt.nullable(),
  relatedBillIds: z.array(z.string().max(100)).optional().default([]),
  sourceDocumentIds: z.array(positiveInt).optional()
});
var createIssueRoomFromAlertSchema = z.object({
  matterId: optionalPositiveInt.nullable(),
  slug: z.string().max(200).optional(),
  title: z.string().max(1e3).optional(),
  issueType: optionalSafeString,
  jurisdiction: z.string().max(100).optional().default("texas"),
  summary: optionalSafeString,
  recommendedPath: optionalSafeString,
  ownerUserId: optionalPositiveInt.nullable(),
  relatedBillIds: z.array(z.string().max(100)).optional().default([])
});
var patchIssueRoomSchema = z.object({
  title: z.string().min(1).max(1e3).optional(),
  summary: optionalSafeString,
  status: z.string().max(50).optional(),
  recommendedPath: optionalSafeString,
  issueType: optionalSafeString,
  jurisdiction: z.string().max(100).optional()
}).refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });
var createIssueRoomUpdateSchema = z.object({
  title: z.string().min(1).max(1e3),
  body: safeString,
  updateType: z.string().max(100).optional().default("analysis"),
  sourcePackJson: z.array(z.unknown()).optional().default([])
});
var createStrategyOptionSchema = z.object({
  label: z.string().min(1).max(500),
  description: optionalSafeString,
  prosJson: z.array(z.string().max(1e3)).optional().default([]),
  consJson: z.array(z.string().max(1e3)).optional().default([]),
  politicalFeasibility: z.number().min(0).max(100).optional(),
  legalDurability: z.number().min(0).max(100).optional(),
  implementationComplexity: z.number().min(0).max(100).optional(),
  recommendationRank: z.number().int().min(0).optional().default(0)
});
var createTaskSchema = z.object({
  title: z.string().min(1).max(1e3),
  description: optionalSafeString,
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  assignee: optionalSafeString,
  dueDate: z.string().datetime().optional().nullable()
});
var patchTaskSchema = z.object({
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee: z.string().max(500).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable()
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" });
var createMatterSchema = z.object({
  workspaceId: positiveInt,
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(500),
  clientName: optionalSafeString,
  practiceArea: optionalSafeString,
  jurisdictionScope: z.string().max(100).optional().default("texas"),
  status: z.string().max(50).optional().default("active"),
  ownerUserId: optionalPositiveInt.nullable(),
  description: optionalSafeString,
  tagsJson: z.array(z.string().max(200)).optional().default([])
});
var createStakeholderSchema = z.object({
  workspaceId: positiveInt,
  type: z.string().min(1).max(100),
  name: z.string().min(1).max(500),
  title: optionalSafeString,
  organization: optionalSafeString,
  jurisdiction: optionalSafeString,
  tagsJson: z.array(z.string().max(200)).optional().default([]),
  sourceSummary: optionalSafeString
});
var createIssueRoomStakeholderSchema = z.object({
  type: z.string().min(1).max(100),
  name: z.string().min(1).max(500),
  title: optionalSafeString,
  organization: optionalSafeString,
  jurisdiction: optionalSafeString,
  tagsJson: z.array(z.string().max(200)).optional().default([]),
  sourceSummary: optionalSafeString
});
var createObservationSchema = z.object({
  sourceDocumentId: optionalPositiveInt,
  matterId: optionalPositiveInt,
  observationText: z.string().min(1).max(5e3),
  confidence: z.number().min(0).max(1).optional()
});
var createMeetingNoteSchema = z.object({
  noteText: z.string().min(1).max(1e4),
  meetingDate: z.string().datetime().optional().nullable(),
  contactMethod: z.string().max(200).optional().nullable(),
  matterId: optionalPositiveInt.nullable()
});
var createActivitySchema = z.object({
  workspaceId: positiveInt,
  alertId: optionalPositiveInt.nullable(),
  type: z.string().min(1).max(100),
  ownerUserId: optionalPositiveInt.nullable(),
  summary: z.string().min(1).max(2e3),
  detailText: optionalSafeString,
  dueAt: z.string().datetime().optional().nullable()
});
var generateBriefSchema = z.object({
  workspaceId: positiveInt,
  watchlistId: optionalPositiveInt,
  matterId: optionalPositiveInt,
  sourceDocumentIds: z.array(positiveInt).min(1, "sourceDocumentIds[] must have at least one entry"),
  title: z.string().max(1e3).optional()
});
var generateClientAlertSchema = z.object({
  issueRoomId: positiveInt,
  workspaceId: positiveInt,
  recipientName: optionalSafeString,
  firmName: optionalSafeString
});
var generateWeeklyReportSchema = z.object({
  workspaceId: positiveInt,
  week: z.string().regex(/^\d{4}-W\d{2}$/).optional(),
  recipientName: optionalSafeString,
  firmName: optionalSafeString
});
var generateHearingMemoSchema = z.object({
  hearingId: positiveInt,
  workspaceId: positiveInt,
  recipientName: optionalSafeString,
  firmName: optionalSafeString
});
var pipelineTestSchema = z.object({
  title: z.string().min(1).max(1e3),
  summary: z.string().max(5e3).optional().nullable(),
  reasons: z.array(z.record(z.unknown())).optional().default([])
});
var runLegiscanSchema = z.object({
  mode: z.enum(["recent", "full", "backfill"]).optional().default("recent"),
  sinceDays: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1e4).optional(),
  offset: z.number().int().min(0).optional(),
  orderBy: z.enum(["bill_id_asc", "bill_id_desc", "last_action_date_asc", "last_action_date_desc"]).optional(),
  sessionId: z.number().int().positive().optional(),
  detailConcurrency: z.number().int().min(1).max(20).optional()
});
var fetchTecSchema = z.object({
  searchTerm: z.string().min(1).max(500)
});
var runTecImportSchema = z.object({
  searchTerm: z.string().max(500).optional(),
  workspaceId: positiveInt,
  matterId: optionalPositiveInt,
  mode: z.enum(["search", "sweep"]).optional().default("search")
}).refine((d) => d.mode === "sweep" || d.searchTerm && d.searchTerm.length > 0, {
  message: "searchTerm is required for search mode"
});
var createCommitteeIntelFromHearingSchema = z.object({
  workspaceId: positiveInt,
  hearingId: positiveInt,
  title: z.string().max(1e3).optional(),
  focusTopics: z.array(z.string().max(500)).optional(),
  interimCharges: z.array(z.string().max(500)).optional(),
  clientContext: z.string().max(5e3).optional().nullable(),
  monitoringNotes: z.string().max(5e3).optional().nullable(),
  videoUrl: z.string().url().max(2e3).optional(),
  agendaUrl: z.string().url().max(2e3).optional(),
  transcriptSourceType: z.string().max(100).optional(),
  transcriptSourceUrl: z.string().max(2e3).optional(),
  autoIngestEnabled: z.boolean().optional(),
  autoIngestIntervalSeconds: z.number().int().min(10).max(3600).optional(),
  status: z.string().max(50).optional()
});
var addSegmentSchema = z.object({
  transcriptText: z.string().min(1).max(5e4),
  capturedAt: z.string().datetime().optional(),
  startedAtSecond: z.number().min(0).optional().nullable(),
  endedAtSecond: z.number().min(0).optional().nullable(),
  speakerName: z.string().max(500).optional(),
  speakerRole: z.string().max(200).optional(),
  affiliation: z.string().max(500).optional(),
  invited: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
});
var focusedBriefSchema = z.object({
  issue: z.string().min(1).max(2e3)
});
var createReplayRunSchema = z.object({
  sessionId: positiveInt,
  mode: z.enum(["recent", "full", "backfill"]).optional(),
  chunkSize: z.number().int().min(1).max(1e3).optional(),
  orderBy: z.string().max(100).optional(),
  requestedBy: z.string().max(200).optional(),
  sinceDays: z.number().int().positive().optional(),
  detailConcurrency: z.number().int().min(1).max(20).optional(),
  startNow: z.boolean().optional(),
  maxChunks: z.union([z.number().int().positive(), z.literal("all")]).optional()
});
var importLegislatorsSchema = z.object({
  workspaceId: positiveInt
});
var linkWatchlistToMatterSchema = z.object({
  watchlistId: positiveInt
});

// server/policy-intel/services/brief-service.ts
init_db();
init_schema_policy_intel();

// server/policy-intel/engine/build-brief.ts
init_db();
init_schema_policy_intel();
import { inArray } from "drizzle-orm";
async function buildSourcePack(sourceDocumentIds) {
  if (sourceDocumentIds.length === 0) {
    throw new Error("sourceDocumentIds must not be empty \u2014 no sources, no brief");
  }
  const docs = await policyIntelDb.select().from(sourceDocuments).where(inArray(sourceDocuments.id, sourceDocumentIds));
  const foundIds = new Set(docs.map((d) => d.id));
  const missing = sourceDocumentIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new Error(`Source documents not found: ${missing.join(", ")}`);
  }
  const entries = docs.map((d) => ({
    id: d.id,
    title: d.title,
    summary: d.summary,
    normalizedText: d.normalizedText,
    sourceUrl: d.sourceUrl,
    sourceType: d.sourceType,
    publisher: d.publisher,
    publishedAt: d.publishedAt
  }));
  const combinedText = entries.map(
    (e, i) => `[Source ${i + 1}: ${e.title}]
Publisher: ${e.publisher}
URL: ${e.sourceUrl}
${e.normalizedText ?? e.summary ?? "(no text)"}`
  ).join("\n\n---\n\n");
  return { entries, combinedText };
}
function buildCitations(pack) {
  return pack.entries.map((e) => ({
    sourceDocumentId: e.id,
    title: e.title,
    publisher: e.publisher,
    sourceUrl: e.sourceUrl,
    accessedAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
}
function determineProcedure(entries) {
  const types = new Set(entries.map((e) => e.sourceType));
  if (types.has("texas_legislation")) {
    const hasHearing = entries.some(
      (e) => e.title.toLowerCase().includes("hearing") || e.title.toLowerCase().includes("committee")
    );
    if (hasHearing) return "Committee hearing scheduled \u2014 testimony window may be open.";
    return "Bill filed \u2014 awaiting committee referral or hearing.";
  }
  if (types.has("texas_regulation")) return "Rule or agency action published \u2014 comment period may apply.";
  if (types.has("federal_legislation")) return "Federal bill activity \u2014 monitor floor/committee action.";
  if (types.has("federal_regulation")) return "Federal regulatory action \u2014 check Federal Register for deadlines.";
  return "Source document filed \u2014 review for applicability.";
}

// server/policy-intel/services/brief-service.ts
function generateTemplateBrief(title, pack, citations, procedure) {
  const sections = [];
  sections.push(`# ${title}
`);
  sections.push(`*Generated: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}*
`);
  sections.push(`## What Changed
`);
  for (const entry of pack.entries) {
    sections.push(`- **${entry.title}** (${entry.publisher})`);
    if (entry.summary) sections.push(`  ${entry.summary}`);
  }
  sections.push(`
## Why It Matters
`);
  const topics = pack.entries.map((e) => e.title).join("; ");
  sections.push(
    `This brief covers ${pack.entries.length} source document${pack.entries.length > 1 ? "s" : ""} related to: ${topics}. Review the source text below for specific language and implications.`
  );
  sections.push(`
## Procedural Posture
`);
  sections.push(procedure);
  sections.push(`
## Recommended Next Steps
`);
  sections.push(`1. Review the linked source documents for specific language changes`);
  sections.push(`2. Assess client impact and determine if action is needed`);
  sections.push(`3. Flag for senior review if high-impact provisions identified`);
  sections.push(`
## Sources
`);
  for (const c of citations) {
    sections.push(`- [${c.title}](${c.sourceUrl}) \u2014 ${c.publisher} (accessed ${c.accessedAt.split("T")[0]})`);
  }
  return sections.join("\n");
}
async function generateLlmBrief(title, pack, citations, procedure) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const systemPrompt = `You are a policy intelligence analyst for a government affairs law firm. Generate a concise, evidence-backed issue brief. You MUST only cite information from the provided source documents. Do not fabricate or assume information not in the sources.

Structure your brief exactly as:
1. ## What Changed \u2014 summarize each source document's key change
2. ## Why It Matters \u2014 explain implications for the firm's clients (transportation, procurement, local government)
3. ## Procedural Posture \u2014 ${procedure}
4. ## Recommended Next Steps \u2014 2-3 actionable items
5. ## Sources \u2014 list each source with title, publisher, and URL

Use markdown formatting. Be specific and cite source titles when making claims.`;
    const userPrompt = `Generate an issue brief titled "${title}" from these source documents:

${pack.combinedText}

Citations to include:
${citations.map((c) => `- ${c.title} (${c.publisher}) \u2014 ${c.sourceUrl}`).join("\n")}`;
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2e3,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock ? `# ${title}

${textBlock.text}` : null;
  } catch {
    return null;
  }
}
async function generateBrief(req) {
  if (!req.sourceDocumentIds || req.sourceDocumentIds.length === 0) {
    throw new Error("sourceDocumentIds is required \u2014 no sources, no brief");
  }
  const pack = await buildSourcePack(req.sourceDocumentIds);
  const citations = buildCitations(pack);
  const procedure = determineProcedure(pack.entries);
  const title = req.title ?? (pack.entries.length === 1 ? `Brief: ${pack.entries[0].title}` : `Brief: ${pack.entries.length} Source Documents`);
  let bodyMarkdown;
  let generatedBy;
  const llmBrief = await generateLlmBrief(title, pack, citations, procedure);
  if (llmBrief) {
    bodyMarkdown = llmBrief;
    generatedBy = "anthropic-claude-sonnet";
  } else {
    bodyMarkdown = generateTemplateBrief(title, pack, citations, procedure);
    generatedBy = "template";
  }
  const [brief] = await policyIntelDb.insert(briefs).values({
    workspaceId: req.workspaceId,
    watchlistId: req.watchlistId ?? null,
    title,
    status: "draft",
    briefText: bodyMarkdown,
    sourcePackJson: pack.entries.map((e) => ({
      id: e.id,
      title: e.title,
      publisher: e.publisher,
      sourceUrl: e.sourceUrl
    }))
  }).returning();
  const [deliverable] = await policyIntelDb.insert(deliverables).values({
    workspaceId: req.workspaceId,
    briefId: brief.id,
    matterId: req.matterId ?? null,
    type: "issue_brief",
    title,
    bodyMarkdown,
    sourceDocumentIds: req.sourceDocumentIds,
    citationsJson: citations.map((c) => ({ ...c })),
    generatedBy
  }).returning();
  return {
    briefId: brief.id,
    deliverableId: deliverable.id,
    title,
    bodyMarkdown,
    citations,
    generatedBy
  };
}

// server/policy-intel/services/stakeholder-service.ts
init_db();
init_schema_policy_intel();
import { and as and3, eq as eq6, inArray as inArray2 } from "drizzle-orm";
async function upsertStakeholder(data) {
  const [created] = await policyIntelDb.insert(stakeholders).values(data).onConflictDoNothing({
    target: [stakeholders.workspaceId, stakeholders.name, stakeholders.type]
  }).returning();
  if (created) {
    return { stakeholder: created, created: true };
  }
  const [existing] = await policyIntelDb.select().from(stakeholders).where(
    and3(
      eq6(stakeholders.workspaceId, data.workspaceId),
      eq6(stakeholders.name, data.name),
      eq6(stakeholders.type, data.type)
    )
  );
  if (!existing) {
    throw new Error("Failed to resolve stakeholder after upsert conflict");
  }
  return { stakeholder: existing, created: false };
}
async function addObservation(data) {
  const [created] = await policyIntelDb.insert(stakeholderObservations).values({
    stakeholderId: data.stakeholderId,
    sourceDocumentId: data.sourceDocumentId ?? null,
    matterId: data.matterId ?? null,
    observationText: data.observationText,
    confidence: data.confidence ?? "medium"
  }).returning();
  return created;
}
async function getStakeholderWithObservations(stakeholderId) {
  const [stakeholder] = await policyIntelDb.select().from(stakeholders).where(eq6(stakeholders.id, stakeholderId));
  if (!stakeholder) return null;
  const observations = await policyIntelDb.select().from(stakeholderObservations).where(eq6(stakeholderObservations.stakeholderId, stakeholderId));
  return { stakeholder, observations };
}
async function getStakeholdersForMatter(matterId) {
  const obs = await policyIntelDb.select({ stakeholderId: stakeholderObservations.stakeholderId }).from(stakeholderObservations).where(eq6(stakeholderObservations.matterId, matterId));
  if (obs.length === 0) return [];
  const uniqueIds = Array.from(new Set(obs.map((o) => o.stakeholderId)));
  return policyIntelDb.select().from(stakeholders).where(inArray2(stakeholders.id, uniqueIds));
}

// server/policy-intel/connectors/texas/tec-filings.ts
import axios3 from "axios";
import * as cheerio2 from "cheerio";
var TEC_BASE_URL = "https://www.ethics.state.tx.us";
async function searchTecFilers(name) {
  const url = `${TEC_BASE_URL}/search/cf/`;
  const resp = await axios3.post(
    url,
    new URLSearchParams({ searchType: "filerName", filerName: name, reportType: "ALL" }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15e3 }
  );
  const $ = cheerio2.load(resp.data);
  const results = [];
  $("table.searchResults tr").each((_i, row) => {
    const cols = $(row).find("td");
    if (cols.length >= 3) {
      const filerId = $(cols[0]).text().trim();
      const filerName = $(cols[1]).text().trim();
      const filerType = $(cols[2]).text().trim();
      if (filerId && filerName) {
        results.push({
          filerId,
          filerName,
          filerType,
          sourceUrl: `${TEC_BASE_URL}/search/cf/COH?filerID=${encodeURIComponent(filerId)}`
        });
      }
    }
  });
  return results;
}
async function searchTecLobbyists(name) {
  const url = `${TEC_BASE_URL}/search/lobby/`;
  const resp = await axios3.post(
    url,
    new URLSearchParams({ searchType: "lobbyistName", lobbyistName: name }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15e3 }
  );
  const $ = cheerio2.load(resp.data);
  const results = [];
  $("table.searchResults tr").each((_i, row) => {
    const cols = $(row).find("td");
    if (cols.length >= 2) {
      const nameText = $(cols[0]).text().trim();
      const regId = $(cols[1]).text().trim();
      if (nameText && regId) {
        results.push({
          name: nameText,
          registrationId: regId,
          clients: [],
          sourceUrl: `${TEC_BASE_URL}/search/lobby/detail?regID=${encodeURIComponent(regId)}`
        });
      }
    }
  });
  return results;
}
async function fetchTecData(searchTerm) {
  const result = { filers: [], lobbyists: [], errors: [] };
  try {
    result.filers = await searchTecFilers(searchTerm);
  } catch (err) {
    result.errors.push(`Filer search error: ${err?.message ?? String(err)}`);
  }
  try {
    result.lobbyists = await searchTecLobbyists(searchTerm);
  } catch (err) {
    result.errors.push(`Lobbyist search error: ${err?.message ?? String(err)}`);
  }
  return result;
}

// server/policy-intel/connectors/texas/houston-council.ts
import axios4 from "axios";
import * as cheerio3 from "cheerio";
var LEGISTAR_FEED = "https://houston.legistar.com/Feed.ashx?M=Calendar&ID=3955578&GUID=58f7aac2-38c2-4b5f-80e5-0bce60c4deba";
var COUNCIL_PAGE = "https://www.houstontx.gov/council/calendar.html";
async function fetchHoustonCouncilItems() {
  try {
    const resp = await axios4.get(LEGISTAR_FEED, { timeout: 15e3 });
    const $ = cheerio3.load(resp.data, { xmlMode: true });
    const items = [];
    $("item").each((_i, el) => {
      const title = $(el).find("title").text().trim();
      const link = $(el).find("link").text().trim();
      const pubDate = $(el).find("pubDate").text().trim();
      const description = $(el).find("description").text().trim();
      if (title) {
        items.push({
          title,
          summary: description.slice(0, 500),
          sourceUrl: link || COUNCIL_PAGE,
          publishedAt: pubDate || null,
          rawPayload: { source: "houston_legistar", feedType: "council_calendar" }
        });
      }
    });
    return { items, error: null };
  } catch (err) {
    return { items: [], error: err?.message ?? String(err) };
  }
}

// server/policy-intel/connectors/texas/harris-county.ts
import axios5 from "axios";
import * as cheerio4 from "cheerio";
var LEGISTAR_FEED2 = "https://harriscountytx.legistar.com/Feed.ashx?M=Calendar&ID=18040568&GUID=c8d5f0ea-3dc6-4b2a-a9cf-82fd1e2e4f56";
var HCCC_AGENDA_PAGE = "https://agenda.harriscountytx.gov/";
async function fetchHarrisCountyItems() {
  try {
    const resp = await axios5.get(LEGISTAR_FEED2, { timeout: 15e3 });
    const $ = cheerio4.load(resp.data, { xmlMode: true });
    const items = [];
    $("item").each((_i, el) => {
      const title = $(el).find("title").text().trim();
      const link = $(el).find("link").text().trim();
      const pubDate = $(el).find("pubDate").text().trim();
      const description = $(el).find("description").text().trim();
      if (title) {
        items.push({
          title,
          summary: description.slice(0, 500),
          sourceUrl: link || HCCC_AGENDA_PAGE,
          publishedAt: pubDate || null,
          rawPayload: { source: "harris_county_legistar", feedType: "commissioners_court" }
        });
      }
    });
    return { items, error: null };
  } catch (err) {
    return { items: [], error: err?.message ?? String(err) };
  }
}

// server/policy-intel/connectors/texas/metro-board.ts
import axios6 from "axios";
import * as cheerio5 from "cheerio";
var METRO_BOARD_PAGE = "https://www.ridemetro.org/pages/board-of-directors.aspx";
var METRO_NOTICES_PAGE = "https://www.ridemetro.org/pages/public-notices.aspx";
async function fetchMetroBoardItems() {
  try {
    const resp = await axios6.get(METRO_BOARD_PAGE, { timeout: 15e3 });
    const $ = cheerio5.load(resp.data);
    const items = [];
    $("table tr, .meeting, li, p, a").each((_i, el) => {
      const text3 = $(el).text().trim();
      if (text3.length > 15 && text3.length < 500 && (text3.toLowerCase().includes("board") || text3.toLowerCase().includes("meeting") || text3.toLowerCase().includes("agenda") || text3.toLowerCase().includes("metro"))) {
        const href = $(el).attr("href");
        items.push({
          title: text3.slice(0, 200),
          summary: text3,
          sourceUrl: href && href.startsWith("http") ? href : METRO_BOARD_PAGE,
          publishedAt: null,
          rawPayload: { source: "metro_board_page", feedType: "metro_board" }
        });
      }
    });
    const seen = /* @__PURE__ */ new Set();
    const unique = items.filter((item) => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    });
    return { items: unique.slice(0, 20), error: null };
  } catch (err) {
    return { items: [], error: err?.message ?? String(err) };
  }
}
async function fetchMetroNotices() {
  try {
    const resp = await axios6.get(METRO_NOTICES_PAGE, { timeout: 15e3 });
    const $ = cheerio5.load(resp.data);
    const items = [];
    $("table tr, .notice, li, p").each((_i, el) => {
      const text3 = $(el).text().trim();
      if (text3.length > 20 && text3.length < 500 && (text3.toLowerCase().includes("notice") || text3.toLowerCase().includes("hearing") || text3.toLowerCase().includes("procurement") || text3.toLowerCase().includes("contract"))) {
        items.push({
          title: text3.slice(0, 200),
          summary: text3,
          sourceUrl: METRO_NOTICES_PAGE,
          publishedAt: null,
          rawPayload: { source: "metro_notices_page", feedType: "metro_notices" }
        });
      }
    });
    const seen = /* @__PURE__ */ new Set();
    const unique = items.filter((item) => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    });
    return { items: unique.slice(0, 20), error: null };
  } catch (err) {
    return { items: [], error: err?.message ?? String(err) };
  }
}

// server/policy-intel/jobs/run-local-feeds.ts
async function runLocalFeedsJob() {
  const result = {
    feedsAttempted: 0,
    feedErrors: [],
    totalFetched: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    alerts: { created: 0, skippedDuplicate: 0, skippedCooldown: 0, details: [] }
  };
  const { allWorkspaces, watchlistsByWorkspace } = await loadActiveWatchlistsByWorkspace();
  const feeds = [
    { name: "houston_council", fetch: fetchHoustonCouncilItems },
    { name: "harris_county", fetch: fetchHarrisCountyItems },
    { name: "metro_board", fetch: fetchMetroBoardItems },
    { name: "metro_notices", fetch: fetchMetroNotices }
  ];
  for (const feed of feeds) {
    result.feedsAttempted++;
    try {
      const feedResult = await feed.fetch();
      if (feedResult.error) {
        result.feedErrors.push({ feedName: feed.name, error: feedResult.error });
        continue;
      }
      result.totalFetched += feedResult.items.length;
      for (const item of feedResult.items) {
        try {
          const { doc: savedDoc, inserted } = await upsertSourceDocument({
            sourceType: "texas_local",
            publisher: feed.name,
            sourceUrl: item.sourceUrl,
            externalId: null,
            title: item.title,
            summary: item.summary,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
            checksum: null,
            rawPayload: item.rawPayload,
            normalizedText: item.summary,
            tagsJson: [feed.name, "local"]
          });
          if (inserted) {
            result.inserted++;
          } else {
            result.skipped++;
          }
          for (const ws of allWorkspaces) {
            const workspaceWatchlists = watchlistsByWorkspace.get(ws.id) ?? [];
            if (workspaceWatchlists.length === 0) {
              continue;
            }
            const alertResult = await processDocumentAlerts(savedDoc, ws.id, workspaceWatchlists);
            result.alerts.created += alertResult.created;
            result.alerts.skippedDuplicate += alertResult.skippedDuplicate;
            result.alerts.skippedCooldown += alertResult.skippedCooldown;
            result.alerts.details.push(...alertResult.details);
          }
        } catch (err) {
          result.errors.push({
            title: item.title,
            error: err?.message ?? String(err)
          });
        }
      }
    } catch (err) {
      result.feedErrors.push({ feedName: feed.name, error: err?.message ?? String(err) });
    }
  }
  return result;
}

// server/policy-intel/jobs/run-tec.ts
init_db();
init_schema_policy_intel();
import { eq as eq7 } from "drizzle-orm";
async function importTecResults(searchTerm, workspaceId, matterId, result) {
  const tecData = await fetchTecData(searchTerm);
  result.errors.push(...tecData.errors);
  for (const filer of tecData.filers) {
    try {
      await importFiler(filer, workspaceId, matterId, result);
    } catch (err) {
      result.errors.push(`Filer import error (${filer.filerName}): ${err?.message ?? String(err)}`);
    }
  }
  for (const lobbyist of tecData.lobbyists) {
    try {
      await importLobbyist(lobbyist, workspaceId, matterId, result);
    } catch (err) {
      result.errors.push(`Lobbyist import error (${lobbyist.name}): ${err?.message ?? String(err)}`);
    }
  }
}
async function importFiler(filer, workspaceId, matterId, result) {
  const type = filer.filerType.toLowerCase().includes("pac") ? "pac" : "organization";
  const { stakeholder, created } = await upsertStakeholder({
    workspaceId,
    type,
    name: filer.filerName,
    title: `TEC Filer (${filer.filerType})`,
    organization: filer.filerName,
    jurisdiction: "texas",
    tagsJson: ["tec", "campaign-finance", filer.filerType.toLowerCase()],
    sourceSummary: `TEC campaign finance filer ID: ${filer.filerId}`
  });
  if (created) result.stakeholdersCreated++;
  else result.stakeholdersExisting++;
  const { doc: sourceDoc, inserted } = await upsertSourceDocument({
    sourceType: "texas_ethics",
    publisher: "Texas Ethics Commission",
    sourceUrl: filer.sourceUrl,
    externalId: `tec-filer-${filer.filerId}`,
    title: `TEC Filing: ${filer.filerName} (${filer.filerType})`,
    summary: `Campaign finance filer record for ${filer.filerName}. Filer ID: ${filer.filerId}, Type: ${filer.filerType}.`,
    publishedAt: /* @__PURE__ */ new Date(),
    checksum: null,
    rawPayload: filer,
    normalizedText: `${filer.filerName} ${filer.filerType} campaign finance filer ${filer.filerId}`,
    tagsJson: ["tec", "campaign-finance"]
  });
  if (inserted) result.sourceDocsInserted++;
  else result.sourceDocsSkipped++;
  if (created || inserted) {
    await addObservation({
      stakeholderId: stakeholder.id,
      sourceDocumentId: sourceDoc.id,
      matterId,
      observationText: `TEC campaign finance filer. Type: ${filer.filerType}. Filer ID: ${filer.filerId}.`,
      confidence: "high"
    });
    result.observationsCreated++;
  }
}
async function importLobbyist(lobbyist, workspaceId, matterId, result) {
  const { stakeholder, created } = await upsertStakeholder({
    workspaceId,
    type: "lobbyist",
    name: lobbyist.name,
    title: "Registered Lobbyist",
    organization: lobbyist.clients.length > 0 ? lobbyist.clients.join(", ") : void 0,
    jurisdiction: "texas",
    tagsJson: ["tec", "lobbyist", `reg-${lobbyist.registrationId}`],
    sourceSummary: `TEC lobbyist registration ID: ${lobbyist.registrationId}`
  });
  if (created) result.stakeholdersCreated++;
  else result.stakeholdersExisting++;
  const { doc: sourceDoc, inserted } = await upsertSourceDocument({
    sourceType: "texas_ethics",
    publisher: "Texas Ethics Commission",
    sourceUrl: lobbyist.sourceUrl,
    externalId: `tec-lobby-${lobbyist.registrationId}`,
    title: `TEC Lobbyist: ${lobbyist.name}`,
    summary: `Lobbyist registration for ${lobbyist.name}. Registration ID: ${lobbyist.registrationId}.${lobbyist.clients.length > 0 ? ` Clients: ${lobbyist.clients.join(", ")}.` : ""}`,
    publishedAt: /* @__PURE__ */ new Date(),
    checksum: null,
    rawPayload: lobbyist,
    normalizedText: `${lobbyist.name} lobbyist registration ${lobbyist.registrationId} ${lobbyist.clients.join(" ")}`,
    tagsJson: ["tec", "lobbyist"]
  });
  if (inserted) result.sourceDocsInserted++;
  else result.sourceDocsSkipped++;
  if (created || inserted) {
    await addObservation({
      stakeholderId: stakeholder.id,
      sourceDocumentId: sourceDoc.id,
      matterId,
      observationText: `TEC registered lobbyist. Registration ID: ${lobbyist.registrationId}.${lobbyist.clients.length > 0 ? ` Represents: ${lobbyist.clients.join(", ")}.` : ""}`,
      confidence: "high"
    });
    result.observationsCreated++;
  }
}
async function runTecImportJob(opts) {
  const mode = opts.mode ?? "search";
  const result = {
    mode,
    searchTerms: [],
    stakeholdersCreated: 0,
    stakeholdersExisting: 0,
    sourceDocsInserted: 0,
    sourceDocsSkipped: 0,
    observationsCreated: 0,
    errors: []
  };
  if (mode === "search") {
    if (!opts.searchTerm) {
      throw new Error("searchTerm is required for search mode");
    }
    result.searchTerms.push(opts.searchTerm);
    await importTecResults(opts.searchTerm, opts.workspaceId, opts.matterId, result);
  } else {
    const activeWatchlists = await policyIntelDb.select().from(watchlists).where(eq7(watchlists.isActive, true));
    const terms = /* @__PURE__ */ new Set();
    for (const wl of activeWatchlists) {
      const words = wl.name.split(/\s+/).filter((w) => w.length > 3);
      words.forEach((w) => terms.add(w));
      const rules = wl.rulesJson;
      if (rules && typeof rules === "object") {
        const kw = rules.keywords;
        if (Array.isArray(kw)) {
          kw.forEach((k) => terms.add(k));
        }
      }
    }
    result.searchTerms = Array.from(terms);
    for (const term of result.searchTerms) {
      try {
        await importTecResults(term, opts.workspaceId, opts.matterId, result);
      } catch (err) {
        result.errors.push(`Sweep error for "${term}": ${err?.message ?? String(err)}`);
      }
    }
  }
  return result;
}

// server/policy-intel/scheduler.ts
init_db();
init_logger();
import cron from "node-cron";

// server/policy-intel/engine/intelligence/velocity-analyzer.ts
init_db();
init_schema_policy_intel();
import { eq as eq8, gte, sql as sql2 } from "drizzle-orm";
function classifyMomentum(wow, accel) {
  if (wow > 200 || wow > 100 && accel > 0) return "surging";
  if (wow > 30) return "heating";
  if (wow > -20 && wow <= 30) return "steady";
  if (wow > -60) return "cooling";
  return "stalled";
}
function calcSignificance(current, previous) {
  const volume = Math.min(current + previous, 100) / 100;
  const change = previous > 0 ? Math.abs(current - previous) / previous : current > 0 ? 1 : 0;
  return Math.min(1, volume * 0.4 + change * 0.6);
}
function buildNarrative(v) {
  const subjectLabel = v.subjectType === "watchlist" ? `Watchlist "${v.subject}"` : `${v.subjectType} "${v.subject}"`;
  if (v.momentum === "surging") {
    return `${subjectLabel} is surging \u2014 ${v.current7d} alerts this week vs ${v.previous7d} last week (${v.weekOverWeekChange > 0 ? "+" : ""}${v.weekOverWeekChange.toFixed(0)}%). Activity is accelerating and may require immediate attention.`;
  }
  if (v.momentum === "heating") {
    return `${subjectLabel} is heating up \u2014 activity increased ${v.weekOverWeekChange.toFixed(0)}% week-over-week. Monitor for escalation.`;
  }
  if (v.momentum === "cooling") {
    return `${subjectLabel} is cooling \u2014 activity declined ${Math.abs(v.weekOverWeekChange).toFixed(0)}% this week. The legislative push may be waning.`;
  }
  if (v.momentum === "stalled") {
    return `${subjectLabel} has stalled \u2014 minimal recent activity after prior movement. This issue may be dead or tabled.`;
  }
  return `${subjectLabel} is holding steady at ${v.current7d} alerts/week.`;
}
async function analyzeVelocity() {
  const now = /* @__PURE__ */ new Date();
  const d7 = new Date(now.getTime() - 7 * 864e5);
  const d14 = new Date(now.getTime() - 14 * 864e5);
  const d30 = new Date(now.getTime() - 30 * 864e5);
  const d60 = new Date(now.getTime() - 60 * 864e5);
  const watchlistRows = await policyIntelDb.select({
    watchlistId: alerts.watchlistId,
    watchlistName: watchlists.name,
    cur7: sql2`SUM(CASE WHEN ${alerts.createdAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    prev7: sql2`SUM(CASE WHEN ${alerts.createdAt} >= ${d14.toISOString()}::timestamptz AND ${alerts.createdAt} < ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    cur30: sql2`SUM(CASE WHEN ${alerts.createdAt} >= ${d30.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    prev30: sql2`SUM(CASE WHEN ${alerts.createdAt} >= ${d60.toISOString()}::timestamptz AND ${alerts.createdAt} < ${d30.toISOString()}::timestamptz THEN 1 ELSE 0 END)`
  }).from(alerts).innerJoin(watchlists, eq8(alerts.watchlistId, watchlists.id)).where(gte(alerts.createdAt, d60)).groupBy(alerts.watchlistId, watchlists.name);
  const watchlistMap = /* @__PURE__ */ new Map();
  for (const r of watchlistRows) {
    if (!r.watchlistId) continue;
    watchlistMap.set(r.watchlistId, {
      name: r.watchlistName ?? "Unknown",
      cur7: Number(r.cur7) || 0,
      prev7: Number(r.prev7) || 0,
      cur30: Number(r.cur30) || 0,
      prev30: Number(r.prev30) || 0
    });
  }
  const sourceRows = await policyIntelDb.select({
    sourceType: sourceDocuments.sourceType,
    cur7: sql2`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    prev7: sql2`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d14.toISOString()}::timestamptz AND ${sourceDocuments.fetchedAt} < ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    cur30: sql2`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d30.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    prev30: sql2`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d60.toISOString()}::timestamptz AND ${sourceDocuments.fetchedAt} < ${d30.toISOString()}::timestamptz THEN 1 ELSE 0 END)`
  }).from(sourceDocuments).where(gte(sourceDocuments.fetchedAt, d60)).groupBy(sourceDocuments.sourceType);
  const sourceMap = /* @__PURE__ */ new Map();
  for (const r of sourceRows) {
    sourceMap.set(r.sourceType, {
      cur7: Number(r.cur7) || 0,
      prev7: Number(r.prev7) || 0,
      cur30: Number(r.cur30) || 0,
      prev30: Number(r.prev30) || 0
    });
  }
  const vectors = [];
  for (const [id, d] of watchlistMap) {
    const wow = d.prev7 > 0 ? (d.cur7 - d.prev7) / d.prev7 * 100 : d.cur7 > 0 ? 100 : 0;
    const monthRate = d.prev30 > 0 ? (d.cur30 - d.prev30) / d.prev30 * 100 : 0;
    const accel = wow - monthRate;
    const partial = {
      subject: d.name,
      subjectType: "watchlist",
      subjectId: id,
      current7d: d.cur7,
      previous7d: d.prev7,
      current30d: d.cur30,
      previous30d: d.prev30,
      weekOverWeekChange: wow,
      acceleration: accel,
      momentum: classifyMomentum(wow, accel),
      significance: calcSignificance(d.cur7, d.prev7)
    };
    vectors.push({ ...partial, narrative: buildNarrative(partial) });
  }
  for (const [sourceType, d] of sourceMap) {
    const wow = d.prev7 > 0 ? (d.cur7 - d.prev7) / d.prev7 * 100 : d.cur7 > 0 ? 100 : 0;
    const monthRate = d.prev30 > 0 ? (d.cur30 - d.prev30) / d.prev30 * 100 : 0;
    const accel = wow - monthRate;
    const partial = {
      subject: sourceType,
      subjectType: "source_type",
      current7d: d.cur7,
      previous7d: d.prev7,
      current30d: d.cur30,
      previous30d: d.prev30,
      weekOverWeekChange: wow,
      acceleration: accel,
      momentum: classifyMomentum(wow, accel),
      significance: calcSignificance(d.cur7, d.prev7)
    };
    vectors.push({ ...partial, narrative: buildNarrative(partial) });
  }
  vectors.sort((a, b) => b.significance - a.significance);
  const topMovers = vectors.filter((v) => v.momentum === "surging" || v.momentum === "heating").slice(0, 5);
  const emergingTopics = vectors.filter((v) => v.previous7d === 0 && v.current7d > 0).slice(0, 5);
  const decayingTopics = vectors.filter((v) => v.momentum === "stalled" || v.momentum === "cooling").slice(0, 5);
  const regime = detectRegime("", now);
  try {
    await policyIntelDb.insert(velocitySnapshots).values({
      capturedAt: now,
      regime,
      vectorsJson: vectors.map((v) => ({
        subject: v.subject,
        subjectType: v.subjectType,
        momentum: v.momentum,
        weekOverWeekChange: v.weekOverWeekChange,
        significance: v.significance,
        current7d: v.current7d,
        previous7d: v.previous7d
      })),
      topMoversJson: topMovers.map((v) => ({
        subject: v.subject,
        momentum: v.momentum,
        weekOverWeekChange: v.weekOverWeekChange
      })),
      totalVectors: vectors.length,
      surgingCount: vectors.filter((v) => v.momentum === "surging").length,
      stalledCount: vectors.filter((v) => v.momentum === "stalled").length
    });
  } catch {
  }
  return {
    analyzedAt: now.toISOString(),
    vectors,
    topMovers,
    emergingTopics,
    decayingTopics
  };
}

// server/policy-intel/engine/intelligence/cross-correlator.ts
init_db();
init_schema_policy_intel();
import { gte as gte2, desc as desc3 } from "drizzle-orm";
function extractBillIds(text3) {
  const pattern = /\b(H\.?B\.?|S\.?B\.?|H\.?R\.?|S\.?R\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const ids = /* @__PURE__ */ new Set();
  let m;
  while ((m = pattern.exec(text3)) !== null) {
    const prefix = m[1].replace(/\./g, "").toUpperCase();
    ids.add(`${prefix} ${m[2]}`);
  }
  return [...ids];
}
async function analyzeCorrelations() {
  const d90 = new Date(Date.now() - 90 * 864e5);
  const recentDocs = await policyIntelDb.select({
    id: sourceDocuments.id,
    title: sourceDocuments.title,
    sourceType: sourceDocuments.sourceType,
    rawPayload: sourceDocuments.rawPayload,
    normalizedText: sourceDocuments.normalizedText,
    fetchedAt: sourceDocuments.fetchedAt
  }).from(sourceDocuments).where(gte2(sourceDocuments.fetchedAt, d90)).orderBy(desc3(sourceDocuments.fetchedAt)).limit(2e3);
  const billMap = /* @__PURE__ */ new Map();
  for (const doc of recentDocs) {
    const billIds = [];
    const payload = doc.rawPayload;
    if (payload?.billId && typeof payload.billId === "string") {
      billIds.push(payload.billId.replace(/\./g, "").toUpperCase().replace(/\s+/g, " ").trim());
    }
    billIds.push(...extractBillIds(doc.title));
    if (doc.normalizedText) {
      billIds.push(...extractBillIds(doc.normalizedText.slice(0, 2e3)));
    }
    for (const billId of new Set(billIds)) {
      const existing = billMap.get(billId);
      if (existing) {
        existing.alertCount++;
        if (doc.fetchedAt && doc.fetchedAt.toISOString() > existing.lastSeen) {
          existing.lastSeen = doc.fetchedAt.toISOString();
        }
      } else {
        const committees = [];
        if (payload?.committee && typeof payload.committee === "string") {
          committees.push(payload.committee);
        }
        billMap.set(billId, {
          billId,
          title: doc.title,
          sourceDocumentId: doc.id,
          sourceType: doc.sourceType,
          lastSeen: doc.fetchedAt?.toISOString() ?? (/* @__PURE__ */ new Date()).toISOString(),
          alertCount: 1,
          watchlistIds: [],
          committees
        });
      }
    }
  }
  const alertRows = await policyIntelDb.select({
    watchlistId: alerts.watchlistId,
    sourceDocumentId: alerts.sourceDocumentId
  }).from(alerts).where(gte2(alerts.createdAt, d90));
  const docToWatchlists = /* @__PURE__ */ new Map();
  for (const row of alertRows) {
    if (!row.sourceDocumentId || !row.watchlistId) continue;
    const set = docToWatchlists.get(row.sourceDocumentId) ?? /* @__PURE__ */ new Set();
    set.add(row.watchlistId);
    docToWatchlists.set(row.sourceDocumentId, set);
  }
  for (const bill of billMap.values()) {
    if (bill.sourceDocumentId) {
      bill.watchlistIds = [...docToWatchlists.get(bill.sourceDocumentId) ?? []];
    }
  }
  const hearingRows = await policyIntelDb.select({
    id: hearingEvents.id,
    committee: hearingEvents.committee,
    relatedBillIds: hearingEvents.relatedBillIds
  }).from(hearingEvents).where(gte2(hearingEvents.hearingDate, d90));
  const edges = /* @__PURE__ */ new Map();
  function addEdge(a, b, linkage) {
    const key = [a, b].sort().join("||");
    const existing = edges.get(key) ?? { linkages: [], strength: 0 };
    existing.linkages.push(linkage);
    existing.strength += linkage.strength;
    edges.set(key, existing);
  }
  for (const h of hearingRows) {
    const bills = (h.relatedBillIds ?? []).filter((id) => billMap.has(id));
    for (let i = 0; i < bills.length; i++) {
      for (let j = i + 1; j < bills.length; j++) {
        addEdge(bills[i], bills[j], { type: "same_hearing", detail: `Both scheduled for ${h.committee} hearing`, strength: 0.8 });
      }
      const node = billMap.get(bills[i]);
      if (node && !node.committees.includes(h.committee)) {
        node.committees.push(h.committee);
      }
    }
  }
  const watchlistBills = /* @__PURE__ */ new Map();
  for (const [billId, node] of billMap) {
    for (const wid of node.watchlistIds) {
      const list = watchlistBills.get(wid) ?? [];
      list.push(billId);
      watchlistBills.set(wid, list);
    }
  }
  for (const [_wid, bills] of watchlistBills) {
    if (bills.length < 2 || bills.length > 20) continue;
    for (let i = 0; i < bills.length; i++) {
      for (let j = i + 1; j < Math.min(bills.length, i + 10); j++) {
        addEdge(bills[i], bills[j], { type: "same_watchlist", detail: "Matched same watchlist rules", strength: 0.5 });
      }
    }
  }
  const committeeBills = /* @__PURE__ */ new Map();
  for (const [billId, node] of billMap) {
    for (const comm of node.committees) {
      const list = committeeBills.get(comm) ?? [];
      list.push(billId);
      committeeBills.set(comm, list);
    }
  }
  for (const [comm, bills] of committeeBills) {
    if (bills.length < 2 || bills.length > 30) continue;
    for (let i = 0; i < bills.length; i++) {
      for (let j = i + 1; j < Math.min(bills.length, i + 10); j++) {
        addEdge(bills[i], bills[j], { type: "same_committee", detail: `Both in ${comm}`, strength: 0.4 });
      }
    }
  }
  const parent = /* @__PURE__ */ new Map();
  function find(x) {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
    return parent.get(x);
  }
  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  for (const [key, edge] of edges) {
    if (edge.strength >= 0.4) {
      const [a, b] = key.split("||");
      union(a, b);
    }
  }
  const clusterGroups = /* @__PURE__ */ new Map();
  for (const billId of billMap.keys()) {
    const root = find(billId);
    const group = clusterGroups.get(root) ?? [];
    group.push(billId);
    clusterGroups.set(root, group);
  }
  const clusters = [];
  const isolatedBills = [];
  for (const [_root, billIds] of clusterGroups) {
    if (billIds.length < 2) {
      const node = billMap.get(billIds[0]);
      if (node) isolatedBills.push(node);
      continue;
    }
    const bills = billIds.map((id) => billMap.get(id)).filter(Boolean);
    const clusterLinkages = [];
    for (const [key, edge] of edges) {
      const [a, b] = key.split("||");
      if (billIds.includes(a) && billIds.includes(b)) {
        clusterLinkages.push(...edge.linkages);
      }
    }
    const uniqueLinkages = Array.from(
      new Map(clusterLinkages.map((l) => [`${l.type}:${l.detail}`, l])).values()
    );
    const cohesion = Math.min(1, uniqueLinkages.reduce((s, l) => s + l.strength, 0) / (bills.length * 2));
    const totalAlerts = bills.reduce((s, b) => s + b.alertCount, 0);
    const significance = cohesion > 0.7 && totalAlerts > 10 ? "critical" : cohesion > 0.5 || totalAlerts > 5 ? "high" : cohesion > 0.3 ? "moderate" : "low";
    const label = bills.slice(0, 3).map((b) => b.billId).join(", ") + (bills.length > 3 ? ` +${bills.length - 3} more` : "");
    const committees = [...new Set(bills.flatMap((b) => b.committees))];
    const narrative = `Cluster of ${bills.length} related bills (${label}) with ${uniqueLinkages.length} connection(s). ` + (committees.length > 0 ? `Active in ${committees.join(", ")}. ` : "") + `${totalAlerts} total alerts generated. ` + (significance === "critical" ? "This cluster shows strong interconnection and high activity \u2014 likely a coordinated legislative push." : significance === "high" ? "Significant correlation detected \u2014 these bills are likely part of the same policy effort." : "Moderate topical relationship detected.");
    clusters.push({
      id: billIds.sort().join("-"),
      label,
      bills,
      linkages: uniqueLinkages,
      cohesion,
      significance,
      narrative
    });
  }
  clusters.sort((a, b) => {
    const sigOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    return sigOrder[a.significance] - sigOrder[b.significance] || b.cohesion - a.cohesion;
  });
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    clusters,
    isolatedBills,
    isolatedBillCount: isolatedBills.length,
    totalBillsAnalyzed: billMap.size
  };
}

// server/policy-intel/engine/intelligence/influence-ranker.ts
init_db();
init_schema_policy_intel();
import { count as count2, sql as sql4 } from "drizzle-orm";
async function analyzeInfluence() {
  const allStakeholders = await policyIntelDb.select().from(stakeholders);
  const allCommittees = await policyIntelDb.select().from(committeeMembers);
  const stakeholderCommittees = /* @__PURE__ */ new Map();
  for (const cm of allCommittees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }
  const obsCounts = await policyIntelDb.select({ stakeholderId: stakeholderObservations.stakeholderId, cnt: count2(), latestAt: sql4`MAX(${stakeholderObservations.createdAt})` }).from(stakeholderObservations).groupBy(stakeholderObservations.stakeholderId);
  const obsMap = new Map(obsCounts.map((r) => [r.stakeholderId, { count: r.cnt, latestAt: r.latestAt }]));
  const noteCounts = await policyIntelDb.select({ stakeholderId: meetingNotes.stakeholderId, cnt: count2(), latestAt: sql4`MAX(${meetingNotes.createdAt})` }).from(meetingNotes).groupBy(meetingNotes.stakeholderId);
  const noteMap = new Map(noteCounts.map((r) => [r.stakeholderId, { count: r.cnt, latestAt: r.latestAt }]));
  const issueRoomPresence = await policyIntelDb.select({ stakeholderId: stakeholderObservations.stakeholderId, distinctMatters: sql4`COUNT(DISTINCT ${stakeholderObservations.matterId})` }).from(stakeholderObservations).groupBy(stakeholderObservations.stakeholderId);
  const matterReachMap = new Map(issueRoomPresence.map((r) => [r.stakeholderId, r.distinctMatters ?? 0]));
  const profiles = [];
  for (const s of allStakeholders) {
    const committees = stakeholderCommittees.get(s.id) ?? [];
    const obs = obsMap.get(s.id) ?? { count: 0, latestAt: null };
    const notes = noteMap.get(s.id) ?? { count: 0, latestAt: null };
    const matterReach = matterReachMap.get(s.id) ?? 0;
    let positionalPower = 0;
    const roles = [];
    const chairPositions = [];
    if (s.type === "legislator") {
      positionalPower += 10;
      for (const cm of committees) {
        if (cm.role === "chair") {
          positionalPower += 8;
          chairPositions.push(cm.committeeName);
          roles.push(`Chair: ${cm.committeeName}`);
        } else if (cm.role === "vice_chair") {
          positionalPower += 4;
          roles.push(`Vice Chair: ${cm.committeeName}`);
        } else {
          positionalPower += 1;
        }
      }
      if (s.title?.toLowerCase().includes("speaker") || s.title?.toLowerCase().includes("president")) {
        positionalPower += 10;
        roles.push("Chamber Leadership");
      }
    } else if (s.type === "lobbyist") {
      positionalPower += 5;
      roles.push("Lobbyist");
    } else if (s.type === "agency_official") {
      positionalPower += 8;
      roles.push("Agency Official");
    } else if (s.type === "pac") {
      positionalPower += 3;
      roles.push("PAC");
    }
    positionalPower = Math.min(30, positionalPower);
    const activityLevel = Math.min(
      25,
      Math.min(12, obs.count * 3) + // observations, 3pts each up to 12
      Math.min(13, notes.count * 5)
      // meeting notes, 5pts each up to 13
    );
    const networkReach = Math.min(
      25,
      Math.min(10, committees.length * 3) + // committee memberships
      Math.min(15, matterReach * 5)
      // matters touched
    );
    const now = Date.now();
    const latestActivity = [obs.latestAt, notes.latestAt].filter(Boolean).map((d) => new Date(d).getTime());
    const mostRecent = latestActivity.length > 0 ? Math.max(...latestActivity) : 0;
    const daysSince = mostRecent > 0 ? (now - mostRecent) / 864e5 : 999;
    const recency = daysSince < 7 ? 20 : daysSince < 14 ? 16 : daysSince < 30 ? 12 : daysSince < 90 ? 6 : daysSince < 180 ? 2 : 0;
    const influenceScore = positionalPower + activityLevel + networkReach + recency;
    let assessment;
    if (influenceScore >= 70) {
      assessment = `${s.name} is a top-tier power broker. ${chairPositions.length > 0 ? `Chairs ${chairPositions.join(", ")} \u2014 a gatekeeper for bills in those areas.` : "Well-connected across multiple matters."} Prioritize relationship maintenance.`;
    } else if (influenceScore >= 50) {
      assessment = `${s.name} has significant influence. ${obs.count > 0 ? `${obs.count} observations recorded.` : "Limited observation data \u2014 consider increasing engagement tracking."} ${notes.count === 0 ? "No meeting notes \u2014 consider scheduling a touchpoint." : ""}`;
    } else if (positionalPower >= 15 && activityLevel <= 5) {
      assessment = `${s.name} holds structural power (${roles.join(", ")}) but is under-engaged in our tracking. This is a gap \u2014 we may be missing their influence on our issues.`;
    } else {
      assessment = `${s.name} has moderate relevance. ${committees.length > 0 ? `Member of ${committees.length} committee(s).` : ""} Monitor for changes in position or activity.`;
    }
    profiles.push({
      stakeholderId: s.id,
      name: s.name,
      type: s.type,
      party: s.party ?? void 0,
      chamber: s.chamber ?? void 0,
      influenceScore,
      breakdown: { positionalPower, activityLevel, networkReach, recency },
      roles,
      touchpoints: {
        committeeCount: committees.length,
        observationCount: obs.count,
        meetingNoteCount: notes.count,
        issueRoomCount: matterReach,
        chairPositions
      },
      assessment
    });
  }
  profiles.sort((a, b) => b.influenceScore - a.influenceScore);
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    profiles,
    powerBrokers: profiles.slice(0, 10),
    gatekeepers: profiles.filter((p) => p.touchpoints.chairPositions.length > 0).slice(0, 10),
    wellConnected: [...profiles].sort((a, b) => b.breakdown.networkReach - a.breakdown.networkReach).slice(0, 10),
    underEngaged: profiles.filter((p) => p.breakdown.positionalPower >= 15 && p.breakdown.activityLevel <= 5).slice(0, 10)
  };
}

// server/policy-intel/engine/intelligence/risk-model.ts
init_db();
init_schema_policy_intel();
import { eq as eq12, gte as gte4, desc as desc6 } from "drizzle-orm";

// server/policy-intel/engine/intelligence/sponsor-network.ts
init_db();
init_schema_policy_intel();
import { eq as eq11, gte as gte3, desc as desc5 } from "drizzle-orm";
async function analyzeSponsorNetwork() {
  const d90 = new Date(Date.now() - 90 * 864e5);
  const legislators = await policyIntelDb.select({
    id: stakeholders.id,
    name: stakeholders.name,
    party: stakeholders.party,
    chamber: stakeholders.chamber,
    title: stakeholders.title
  }).from(stakeholders).where(eq11(stakeholders.type, "legislator"));
  const committees = await policyIntelDb.select().from(committeeMembers);
  const stakeholderCommittees = /* @__PURE__ */ new Map();
  for (const cm of committees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }
  const sponsorProfiles = /* @__PURE__ */ new Map();
  for (const leg of legislators) {
    const comms = stakeholderCommittees.get(leg.id) ?? [];
    const chairPositions = comms.filter((c) => c.role === "chair").map((c) => c.committeeName);
    const isLeadership = !!(leg.title && /speaker|president|pro tem|whip|caucus chair/i.test(leg.title));
    sponsorProfiles.set(leg.id, {
      stakeholderId: leg.id,
      name: leg.name,
      party: leg.party ?? "Unknown",
      chamber: leg.chamber ?? "Unknown",
      billIds: [],
      chairPositions,
      committeeCount: comms.length,
      isLeadership,
      billCount: 0
    });
  }
  const recentAlerts = await policyIntelDb.select({
    title: alerts.title,
    summary: alerts.summary,
    whyItMatters: alerts.whyItMatters
  }).from(alerts).where(gte3(alerts.createdAt, d90)).orderBy(desc5(alerts.relevanceScore)).limit(500);
  const billIdPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const billTexts = /* @__PURE__ */ new Map();
  for (const a of recentAlerts) {
    const fullText = `${a.title} ${a.summary ?? ""} ${a.whyItMatters ?? ""}`;
    let m;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      const existing = billTexts.get(billId) ?? "";
      billTexts.set(billId, existing + " " + fullText);
    }
  }
  const recentDocs = await policyIntelDb.select({
    title: sourceDocuments.title,
    rawPayload: sourceDocuments.rawPayload,
    normalizedText: sourceDocuments.normalizedText
  }).from(sourceDocuments).where(gte3(sourceDocuments.fetchedAt, d90)).orderBy(desc5(sourceDocuments.fetchedAt)).limit(1e3);
  for (const doc of recentDocs) {
    const fullText = `${doc.title} ${doc.normalizedText?.slice(0, 3e3) ?? ""}`;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    let m;
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      const existing = billTexts.get(billId) ?? "";
      billTexts.set(billId, existing + " " + fullText);
    }
    const payload = doc.rawPayload;
    if (payload?.sponsors && Array.isArray(payload.sponsors)) {
      for (const sponsor of payload.sponsors) {
        if (typeof sponsor === "object" && sponsor !== null) {
          const sName = sponsor.name;
          const sBillId = sponsor.billId;
          if (typeof sName === "string" && typeof sBillId === "string") {
            const normalized = sBillId.replace(/\./g, "").toUpperCase().replace(/\s+/g, " ").trim();
            const existing = billTexts.get(normalized) ?? "";
            billTexts.set(normalized, existing + " Sponsor: " + sName);
          }
        }
      }
    }
  }
  const billSponsors = /* @__PURE__ */ new Map();
  for (const [billId, text3] of billTexts) {
    const textLower = text3.toLowerCase();
    const matched = /* @__PURE__ */ new Set();
    for (const [id, profile] of sponsorProfiles) {
      const nameParts = profile.name.split(/\s+/);
      const lastName = nameParts[nameParts.length - 1];
      if (lastName.length >= 3) {
        const lastNamePattern = new RegExp(`\\b${lastName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (lastNamePattern.test(textLower)) {
          matched.add(id);
          if (!profile.billIds.includes(billId)) {
            profile.billIds.push(billId);
            profile.billCount++;
          }
        }
      }
    }
    if (matched.size > 0) {
      billSponsors.set(billId, matched);
    }
  }
  const hearings = await policyIntelDb.select({
    committee: hearingEvents.committee,
    relatedBillIds: hearingEvents.relatedBillIds
  }).from(hearingEvents).where(gte3(hearingEvents.hearingDate, d90));
  const billCommittees = /* @__PURE__ */ new Map();
  for (const h of hearings) {
    for (const billId of h.relatedBillIds ?? []) {
      const list = billCommittees.get(billId) ?? [];
      if (!list.includes(h.committee)) list.push(h.committee);
      billCommittees.set(billId, list);
    }
  }
  const billAnalyses = [];
  for (const [billId, sponsorIds] of billSponsors) {
    const sponsors = Array.from(sponsorIds).map((id) => sponsorProfiles.get(id)).filter((s) => s !== void 0);
    if (sponsors.length === 0) continue;
    const parties = [...new Set(sponsors.map((s) => s.party).filter((p) => p !== "Unknown"))];
    const chambers = [...new Set(sponsors.map((s) => s.chamber).filter((c) => c !== "Unknown"))];
    const isBipartisan = parties.length >= 2;
    const comms = billCommittees.get(billId) ?? [];
    const hasCommitteeChair = sponsors.some(
      (s) => s.chairPositions.some((cp) => comms.some((bc) => bc.toLowerCase().includes(cp.toLowerCase()) || cp.toLowerCase().includes(bc.toLowerCase())))
    );
    const hasLeadership = sponsors.some((s) => s.isLeadership);
    let coalitionPower = 0;
    coalitionPower += Math.min(20, sponsors.length * 5);
    coalitionPower += isBipartisan ? 20 : 0;
    coalitionPower += hasCommitteeChair ? 25 : 0;
    coalitionPower += hasLeadership ? 20 : 0;
    coalitionPower += chambers.length >= 2 ? 15 : 0;
    coalitionPower = Math.min(100, coalitionPower);
    let sharedPairs = 0;
    let totalPairs = 0;
    for (let i = 0; i < sponsors.length; i++) {
      for (let j = i + 1; j < sponsors.length; j++) {
        totalPairs++;
        const siComms = new Set((stakeholderCommittees.get(sponsors[i].stakeholderId) ?? []).map((c) => c.committeeName));
        const sjComms = (stakeholderCommittees.get(sponsors[j].stakeholderId) ?? []).map((c) => c.committeeName);
        if (sjComms.some((c) => siComms.has(c))) sharedPairs++;
      }
    }
    const networkDensity = totalPairs > 0 ? sharedPairs / totalPairs : 0;
    const firstAlert = recentAlerts.find(
      (a) => `${a.title} ${a.summary ?? ""}`.includes(billId) || billId.split(" ").every((part) => a.title.includes(part))
    );
    const title = firstAlert?.title ?? billId;
    const narrativeParts = [];
    narrativeParts.push(`${billId} has ${sponsors.length} identified sponsor(s)`);
    if (isBipartisan) narrativeParts.push("with BIPARTISAN support \u2014 significantly increases passage odds");
    if (hasCommitteeChair) narrativeParts.push("\u2014 a key committee chair backs this bill, providing gate control over its path");
    if (hasLeadership) narrativeParts.push("\u2014 chamber leadership is involved, signaling priority");
    if (chambers.length >= 2) narrativeParts.push("with sponsors in both chambers (bicameral coalition)");
    if (networkDensity >= 0.5) narrativeParts.push(". Sponsors are highly connected through shared committee memberships");
    const narrative = narrativeParts.join(" ") + ".";
    billAnalyses.push({
      billId,
      title,
      sponsors,
      coalition: {
        size: sponsors.length,
        isBipartisan,
        parties,
        chambers,
        hasCommitteeChair,
        hasLeadership,
        coalitionPower
      },
      networkDensity: Math.round(networkDensity * 100) / 100,
      narrative
    });
  }
  billAnalyses.sort((a, b) => b.coalition.coalitionPower - a.coalition.coalitionPower);
  const allSponsors = Array.from(sponsorProfiles.values()).filter((s) => s.billCount > 0);
  allSponsors.sort((a, b) => b.billCount - a.billCount);
  const bipartisanBills = billAnalyses.filter((b) => b.coalition.isBipartisan);
  const leadershipBacked = billAnalyses.filter((b) => b.coalition.hasLeadership);
  const avgCoalitionSize = billAnalyses.length > 0 ? billAnalyses.reduce((s, b) => s + b.coalition.size, 0) / billAnalyses.length : 0;
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    billAnalyses,
    prolificSponsors: allSponsors.slice(0, 15),
    bipartisanBills,
    leadershipBacked,
    networkStats: {
      totalSponsors: allSponsors.length,
      avgCoalitionSize: Math.round(avgCoalitionSize * 10) / 10,
      bipartisanRate: billAnalyses.length > 0 ? Math.round(bipartisanBills.length / billAnalyses.length * 100) / 100 : 0,
      leadershipRate: billAnalyses.length > 0 ? Math.round(leadershipBacked.length / billAnalyses.length * 100) / 100 : 0
    }
  };
}

// server/policy-intel/engine/intelligence/risk-model.ts
var calibrationCache = null;
var CALIBRATION_TTL_MS = 30 * 60 * 1e3;
async function loadCalibration() {
  if (calibrationCache && Date.now() - calibrationCache.loadedAt < CALIBRATION_TTL_MS) {
    return calibrationCache;
  }
  try {
    const [row] = await policyIntelDb.select().from(learningMetrics).where(eq12(learningMetrics.metricType, "forecast_calibration")).orderBy(desc6(learningMetrics.capturedAt)).limit(1);
    if (!row) return null;
    const vals = row.valuesJson;
    calibrationCache = {
      accuracy: vals.accuracy ?? 0,
      calibrationBuckets: vals.calibrationBuckets ?? [],
      loadedAt: Date.now()
    };
    return calibrationCache;
  } catch {
    return null;
  }
}
function calibrationCorrection(predictedProb, calibration) {
  if (!calibration || calibration.calibrationBuckets.length === 0) return 1;
  for (const bucket of calibration.calibrationBuckets) {
    if (predictedProb >= bucket.lower && predictedProb < (bucket.upper ?? 1.01)) {
      if (bucket.count < 3) continue;
      const midpoint = (bucket.lower + (bucket.upper ?? 1)) / 2;
      if (midpoint === 0) continue;
      const ratio = bucket.actualRate / midpoint;
      return Math.max(0.5, Math.min(1.5, ratio));
    }
  }
  return 1;
}
function detectStage(text3) {
  const lower = (text3 ?? "").toLowerCase();
  if (/enrolled|signed by governor|sent to governor/i.test(lower)) return { stage: "enrolled", weight: 0.95 };
  if (/passed (both|senate and house|house and senate)/i.test(lower)) return { stage: "passed_both", weight: 0.9 };
  if (/passed (senate|house)|third reading/i.test(lower)) return { stage: "passed_chamber", weight: 0.6 };
  if (/conference committee/i.test(lower)) return { stage: "conference", weight: 0.65 };
  if (/reported favorably|voted from committee/i.test(lower)) return { stage: "reported", weight: 0.45 };
  if (/floor vote|calendar|set for/i.test(lower)) return { stage: "calendared", weight: 0.4 };
  if (/hearing scheduled|public hearing|committee hearing/i.test(lower)) return { stage: "hearing", weight: 0.25 };
  if (/referred to committee|committee referral/i.test(lower)) return { stage: "referred", weight: 0.15 };
  if (/introduced|filed|prefiled/i.test(lower)) return { stage: "filed", weight: 0.08 };
  return { stage: "unknown", weight: 0.1 };
}
function extractBillIds2(text3) {
  const pattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?)\s*(\d+)\b/gi;
  const ids = /* @__PURE__ */ new Set();
  let m;
  while ((m = pattern.exec(text3)) !== null) {
    ids.add(`${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`);
  }
  return [...ids];
}
async function analyzeRisk() {
  const d90 = new Date(Date.now() - 90 * 864e5);
  const now = /* @__PURE__ */ new Date();
  const regime = detectRegime("", now);
  const calibration = await loadCalibration();
  const regimeMultiplier = {
    pre_filing: 0.3,
    // bills filed but session hasn't started
    early_session: 0.5,
    // early days, many bills die
    committee_season: 0.7,
    // committees are filtering
    floor_action: 0.85,
    // if it got here, it's serious
    conference: 0.9,
    // very likely to pass if in conference
    sine_die: 0.95,
    // final push
    special_session: 0.85,
    // governor wants it
    interim: 0.1
    // no bills moving
  };
  const recentAlerts = await policyIntelDb.select({
    id: alerts.id,
    title: alerts.title,
    summary: alerts.summary,
    whyItMatters: alerts.whyItMatters,
    relevanceScore: alerts.relevanceScore,
    reasonsJson: alerts.reasonsJson,
    watchlistId: alerts.watchlistId,
    sourceDocumentId: alerts.sourceDocumentId,
    createdAt: alerts.createdAt
  }).from(alerts).where(gte4(alerts.createdAt, d90)).orderBy(desc6(alerts.relevanceScore)).limit(500);
  const billAlerts = /* @__PURE__ */ new Map();
  for (const a of recentAlerts) {
    const billIds = extractBillIds2(`${a.title} ${a.summary ?? ""}`);
    for (const billId of billIds) {
      const list = billAlerts.get(billId) ?? [];
      list.push(a);
      billAlerts.set(billId, list);
    }
  }
  const upcomingHearings = await policyIntelDb.select({
    committee: hearingEvents.committee,
    hearingDate: hearingEvents.hearingDate,
    relatedBillIds: hearingEvents.relatedBillIds,
    status: hearingEvents.status
  }).from(hearingEvents).where(gte4(hearingEvents.hearingDate, d90));
  const billHearings = /* @__PURE__ */ new Map();
  for (const h of upcomingHearings) {
    for (const billId of h.relatedBillIds ?? []) {
      const list = billHearings.get(billId) ?? [];
      list.push(h);
      billHearings.set(billId, list);
    }
  }
  const chairs = await policyIntelDb.select({
    committeeName: committeeMembers.committeeName,
    stakeholderId: committeeMembers.stakeholderId,
    chamber: committeeMembers.chamber
  }).from(committeeMembers).where(eq12(committeeMembers.role, "chair"));
  const committeeChairs = new Map(chairs.map((c) => [c.committeeName.toLowerCase(), c]));
  let sponsorAnalyses = [];
  try {
    const sponsorReport = await analyzeSponsorNetwork();
    sponsorAnalyses = sponsorReport.billAnalyses;
  } catch {
  }
  const sponsorMap = new Map(sponsorAnalyses.map((s) => [s.billId, s]));
  const assessments = [];
  for (const [billId, billAlertList] of billAlerts) {
    const riskFactors = [];
    const mitigatingFactors = [];
    const combinedText = billAlertList.map((a) => `${a.title} ${a.summary ?? ""} ${a.whyItMatters ?? ""}`).join(" ");
    const bestTitle = billAlertList[0].title;
    const { stage, weight: stageWeight } = detectStage(combinedText);
    const stageFactor = {
      factor: "Legislative Stage",
      impact: stageWeight,
      detail: `Bill is at "${stage}" stage (${(stageWeight * 100).toFixed(0)}% base probability)`
    };
    if (stageWeight >= 0.4) riskFactors.push(stageFactor);
    else mitigatingFactors.push({ ...stageFactor, impact: -stageFactor.impact });
    const regimeMult = regimeMultiplier[regime] ?? 0.5;
    if (regimeMult >= 0.7) {
      riskFactors.push({ factor: "Session Timing", impact: regimeMult * 0.5, detail: `Legislature is in "${regime}" phase \u2014 bills moving faster` });
    } else {
      mitigatingFactors.push({ factor: "Session Timing", impact: -(1 - regimeMult) * 0.3, detail: `Legislature is in "${regime}" phase \u2014 low bill movement expected` });
    }
    const hearings = billHearings.get(billId) ?? [];
    const futureHearings = hearings.filter((h) => h.hearingDate >= now);
    if (futureHearings.length > 0) {
      riskFactors.push({ factor: "Hearing Scheduled", impact: 0.3, detail: `${futureHearings.length} upcoming hearing(s) \u2014 active consideration` });
    }
    const d7 = new Date(now.getTime() - 7 * 864e5);
    const d14 = new Date(now.getTime() - 14 * 864e5);
    const recentCount = billAlertList.filter((a) => a.createdAt >= d7).length;
    const prevWeekCount = billAlertList.filter((a) => a.createdAt >= d14 && a.createdAt < d7).length;
    if (recentCount >= 3) {
      riskFactors.push({ factor: "High Recent Activity", impact: 0.2, detail: `${recentCount} alerts in past 7 days \u2014 accelerating activity` });
    }
    if (prevWeekCount > 0 && recentCount > prevWeekCount * 2) {
      riskFactors.push({
        factor: "Activity Acceleration",
        impact: 0.15,
        detail: `Alert volume doubled from ${prevWeekCount} to ${recentCount} week-over-week \u2014 exponential growth detected`
      });
    }
    const sourceTypes = new Set(billAlertList.map((a) => a.watchlistId).filter(Boolean));
    if (sourceTypes.size >= 3) {
      riskFactors.push({
        factor: "Multi-Watchlist Alert",
        impact: 0.15,
        detail: `Triggered ${sourceTypes.size} different watchlists \u2014 broad cross-domain relevance`
      });
    }
    const avgScore = billAlertList.reduce((s, a) => s + a.relevanceScore, 0) / billAlertList.length;
    if (avgScore >= 60) {
      riskFactors.push({ factor: "High Relevance", impact: 0.15, detail: `Average relevance score ${avgScore.toFixed(0)} \u2014 strong watchlist match` });
    }
    const govSignal = /governor|abbott/i.test(combinedText);
    const speakerSignal = /speaker|phelan/i.test(combinedText);
    const ltGovSignal = /lieutenant governor|lt\.\s*gov/i.test(combinedText);
    if (govSignal) riskFactors.push({ factor: "Governor Involvement", impact: 0.25, detail: "Governor referenced \u2014 executive priority signal" });
    if (speakerSignal) riskFactors.push({ factor: "Speaker Involvement", impact: 0.2, detail: "Speaker referenced \u2014 leadership priority" });
    if (ltGovSignal) riskFactors.push({ factor: "Lt. Governor Involvement", impact: 0.2, detail: "Lt. Governor referenced \u2014 Senate leadership priority" });
    const sponsorData = sponsorMap.get(billId);
    let sponsorPower;
    let bipartisanSupport;
    if (sponsorData) {
      sponsorPower = sponsorData.coalition.coalitionPower;
      bipartisanSupport = sponsorData.coalition.isBipartisan;
      if (sponsorData.coalition.coalitionPower >= 60) {
        riskFactors.push({
          factor: "Strong Sponsor Coalition",
          impact: 0.25,
          detail: `Coalition power ${sponsorData.coalition.coalitionPower}/100 \u2014 ${sponsorData.coalition.size} sponsor(s)${sponsorData.coalition.hasLeadership ? " including leadership" : ""}`
        });
      } else if (sponsorData.coalition.coalitionPower <= 20 && sponsorData.coalition.size <= 1) {
        mitigatingFactors.push({
          factor: "Weak Sponsor Base",
          impact: -0.1,
          detail: `Only ${sponsorData.coalition.size} identified sponsor(s) \u2014 limited political support`
        });
      }
      if (sponsorData.coalition.isBipartisan) {
        riskFactors.push({
          factor: "Bipartisan Support",
          impact: 0.2,
          detail: `Sponsors from ${sponsorData.coalition.parties.join(" & ")} \u2014 bipartisan bills pass at significantly higher rates`
        });
      }
      if (sponsorData.coalition.hasCommitteeChair) {
        riskFactors.push({
          factor: "Committee Chair Backing",
          impact: 0.2,
          detail: "A sponsor chairs the committee where this bill is assigned \u2014 provides gate control"
        });
      }
    }
    const amendmentSignal = /amendment|substitute|companion|engrossed|committee substitute/i.test(combinedText);
    if (amendmentSignal) {
      riskFactors.push({
        factor: "Amendment Activity",
        impact: 0.1,
        detail: "Amendment or substitute bill language detected \u2014 indicates active negotiation and forward momentum"
      });
    }
    const oppositionSignal = /oppose|opposition|against|testified against|registered against/i.test(combinedText);
    if (oppositionSignal) {
      mitigatingFactors.push({
        factor: "Opposition Detected",
        impact: -0.1,
        detail: "Opposition language detected in alert text \u2014 may slow or block passage"
      });
    }
    const baseProb = stageWeight;
    const riskBoost = riskFactors.reduce((s, f) => s + f.impact * 0.3, 0);
    const mitigate = mitigatingFactors.reduce((s, f) => s + Math.abs(f.impact) * 0.2, 0);
    const sponsorMult = sponsorPower !== void 0 ? 0.7 + sponsorPower / 100 * 0.6 : 1;
    const rawProbability = (baseProb + riskBoost - mitigate) * regimeMult * sponsorMult;
    const calCorrection = calibrationCorrection(rawProbability, calibration);
    const passageProbability = Math.min(0.99, Math.max(0.01, rawProbability * calCorrection));
    const riskScore = Math.round(passageProbability * avgScore);
    const riskLevel = riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : riskScore >= 40 ? "elevated" : riskScore >= 20 ? "moderate" : "low";
    const recommendations = [];
    if (riskLevel === "critical" || riskLevel === "high") {
      recommendations.push("Prepare client communication on potential impact");
      if (futureHearings.length > 0) recommendations.push("Consider filing testimony or registering position");
      if (bipartisanSupport) recommendations.push("Bipartisan bill \u2014 consider engaging sponsors from both parties");
    }
    if (govSignal) recommendations.push("Monitor executive action \u2014 governor involvement increases passage odds");
    if (stage === "hearing" || stage === "referred") {
      recommendations.push("Track committee actions closely \u2014 this is the key decision point");
    }
    if (sponsorData?.coalition.hasCommitteeChair) {
      recommendations.push("Committee chair is a sponsor \u2014 direct outreach to chair's office may be most effective");
    }
    if (recommendations.length === 0) recommendations.push("Continue standard monitoring");
    const dataPoints = billAlertList.length + hearings.length + (govSignal ? 1 : 0) + (sponsorData ? sponsorData.sponsors.length : 0);
    const confidence = dataPoints >= 5 ? "high" : dataPoints >= 2 ? "medium" : "low";
    const narrative = `${billId}: ${riskLevel.toUpperCase()} risk (score ${riskScore}/100, ${(passageProbability * 100).toFixed(0)}% passage probability). Currently at "${stage}" stage during "${regime}" regime. ` + (riskFactors.length > 0 ? `Key risk factors: ${riskFactors.map((f) => f.factor).join(", ")}. ` : "") + (bipartisanSupport ? "Bipartisan support detected. " : "") + (recommendations[0] !== "Continue standard monitoring" ? `Recommended: ${recommendations[0]}.` : "No immediate action required.");
    assessments.push({
      billId,
      title: bestTitle,
      passageProbability,
      riskLevel,
      stage,
      riskFactors,
      mitigatingFactors,
      riskScore,
      narrative,
      recommendations,
      confidence,
      sponsorPower,
      bipartisanSupport
    });
  }
  assessments.sort((a, b) => b.riskScore - a.riskScore);
  return {
    analyzedAt: now.toISOString(),
    regime,
    assessments,
    criticalRisks: assessments.filter((a) => a.riskLevel === "critical" || a.riskLevel === "high").slice(0, 10),
    risingRisks: assessments.filter((a) => a.riskFactors.some((f) => f.factor === "High Recent Activity")).slice(0, 10)
  };
}

// server/policy-intel/engine/intelligence/anomaly-detector.ts
init_db();
init_schema_policy_intel();
import { count as count5, desc as desc7, eq as eq13, gte as gte5, sql as sql7 } from "drizzle-orm";
function severityFromDeviation(dev) {
  if (dev >= 4) return "critical";
  if (dev >= 3) return "high";
  if (dev >= 2) return "medium";
  return "low";
}
async function learnedThresholdAdjustment(anomalyType) {
  try {
    const d90 = new Date(Date.now() - 90 * 864e5);
    const history2 = await policyIntelDb.select({
      total: count5(),
      actioned: sql7`SUM(CASE WHEN ${anomalyHistory.wasActioned} THEN 1 ELSE 0 END)`
    }).from(anomalyHistory).where(
      sql7`${anomalyHistory.type} = ${anomalyType} AND ${anomalyHistory.detectedAt} >= ${d90.toISOString()}::timestamptz`
    );
    const total = Number(history2[0]?.total ?? 0);
    const actioned = Number(history2[0]?.actioned ?? 0);
    if (total < 5) return 0;
    const actionRate = actioned / total;
    if (actionRate < 0.2) return 0.5;
    if (actionRate > 0.8) return -0.3;
    return 0;
  } catch {
    return 0;
  }
}
async function persistAnomalies(anomalies, regime) {
  if (anomalies.length === 0) return;
  try {
    const values = anomalies.slice(0, 50).map((a) => ({
      type: a.type,
      severity: a.severity,
      subject: a.subject.slice(0, 256),
      deviation: a.deviation,
      baseline: a.baseline,
      observed: a.observed,
      detectedAt: new Date(a.detectedAt),
      regime,
      wasActioned: false,
      metadataJson: a.metadata ?? {}
    }));
    await policyIntelDb.insert(anomalyHistory).values(values);
  } catch {
  }
}
async function detectAnomalies() {
  const now = /* @__PURE__ */ new Date();
  const d7 = new Date(now.getTime() - 7 * 864e5);
  const d30 = new Date(now.getTime() - 30 * 864e5);
  const d90 = new Date(now.getTime() - 90 * 864e5);
  const anomalies = [];
  const regime = detectRegime("", now);
  const regimeMultiplier = {
    pre_filing: 0.3,
    early_session: 0.6,
    committee_season: 1,
    floor_action: 1.5,
    conference: 1.3,
    sine_die: 2,
    special_session: 1.5,
    interim: 0.2
  };
  const regimeMult = regimeMultiplier[regime] ?? 1;
  const volumeThresholdAdj = await learnedThresholdAdjustment("volume_spike");
  const volumeRows = await policyIntelDb.select({
    watchlistId: alerts.watchlistId,
    watchlistName: watchlists.name,
    total90d: count5(),
    recent7d: sql7`SUM(CASE WHEN ${alerts.createdAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`
  }).from(alerts).innerJoin(watchlists, eq13(alerts.watchlistId, watchlists.id)).where(gte5(alerts.createdAt, d90)).groupBy(alerts.watchlistId, watchlists.name);
  for (const row of volumeRows) {
    const avg7d = row.total90d / 13;
    const adjustedAvg = avg7d * regimeMult;
    const recent = Number(row.recent7d) || 0;
    if (adjustedAvg < 1) continue;
    const stdApprox = Math.max(adjustedAvg * 0.5, 1);
    const zScore = (recent - adjustedAvg) / stdApprox;
    if (zScore >= 2 + volumeThresholdAdj) {
      anomalies.push({
        type: "volume_spike",
        severity: severityFromDeviation(zScore),
        subject: row.watchlistName ?? `Watchlist #${row.watchlistId}`,
        deviation: Math.round(zScore * 100) / 100,
        baseline: Math.round(adjustedAvg * 10) / 10,
        observed: recent,
        narrative: `"${row.watchlistName}" generated ${recent} alerts in the past 7 days \u2014 ${zScore.toFixed(1)}\xD7 standard deviations above its regime-adjusted weekly average of ${adjustedAvg.toFixed(1)} (regime: ${regime}). This is an unusual spike worth investigating.`,
        detectedAt: now.toISOString(),
        metadata: { watchlistId: row.watchlistId, total90d: row.total90d, regime }
      });
    }
  }
  const scoreStats = await policyIntelDb.select({
    avgScore: sql7`AVG(${alerts.relevanceScore})`,
    stdScore: sql7`STDDEV_POP(${alerts.relevanceScore})`,
    maxScore: sql7`MAX(${alerts.relevanceScore})`
  }).from(alerts).where(gte5(alerts.createdAt, d90));
  const avgScore = Number(scoreStats[0]?.avgScore) || 0;
  const stdScore = Math.max(Number(scoreStats[0]?.stdScore) || 1, 1);
  const highScoreAlerts = await policyIntelDb.select({
    id: alerts.id,
    title: alerts.title,
    relevanceScore: alerts.relevanceScore,
    watchlistName: watchlists.name,
    createdAt: alerts.createdAt
  }).from(alerts).innerJoin(watchlists, eq13(alerts.watchlistId, watchlists.id)).where(gte5(alerts.createdAt, d7)).orderBy(desc7(alerts.relevanceScore)).limit(20);
  for (const a of highScoreAlerts) {
    const zScore = (a.relevanceScore - avgScore) / stdScore;
    if (zScore >= 2.5) {
      anomalies.push({
        type: "score_outlier",
        severity: severityFromDeviation(zScore),
        subject: a.title,
        deviation: Math.round(zScore * 100) / 100,
        baseline: Math.round(avgScore),
        observed: a.relevanceScore,
        narrative: `Alert "${a.title}" scored ${a.relevanceScore} (avg: ${avgScore.toFixed(0)}, \u03C3: ${stdScore.toFixed(0)}) \u2014 a ${zScore.toFixed(1)}\u03C3 outlier. This document matched unusually strongly on watchlist "${a.watchlistName}".`,
        detectedAt: now.toISOString(),
        metadata: { alertId: a.id, watchlistName: a.watchlistName }
      });
    }
  }
  const sourceRows = await policyIntelDb.select({
    sourceType: sourceDocuments.sourceType,
    recent7d: sql7`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    total30d: count5()
  }).from(sourceDocuments).where(gte5(sourceDocuments.fetchedAt, d30)).groupBy(sourceDocuments.sourceType);
  const totalRecent = sourceRows.reduce((s, r) => s + (Number(r.recent7d) || 0), 0);
  for (const row of sourceRows) {
    const recent = Number(row.recent7d) || 0;
    if (totalRecent < 10) continue;
    const share = recent / totalRecent;
    const expectedShare = row.total30d / sourceRows.reduce((s, r) => s + r.total30d, 0);
    if (share > 0.6 && expectedShare < 0.4) {
      anomalies.push({
        type: "source_flood",
        severity: "medium",
        subject: row.sourceType,
        deviation: Math.round(share / expectedShare * 100) / 100,
        baseline: Math.round(expectedShare * 100),
        observed: Math.round(share * 100),
        narrative: `Source type "${row.sourceType}" accounts for ${(share * 100).toFixed(0)}% of documents this week (historical norm: ${(expectedShare * 100).toFixed(0)}%). This concentration may indicate a data issue or a burst of activity from one channel.`,
        detectedAt: now.toISOString(),
        metadata: { recent7d: recent, total30d: row.total30d }
      });
    }
  }
  const convergenceRows = await policyIntelDb.select({
    sourceDocumentId: alerts.sourceDocumentId,
    alertTitle: sql7`MIN(${alerts.title})`,
    watchlistCount: sql7`COUNT(DISTINCT ${alerts.watchlistId})`,
    totalAlerts: count5()
  }).from(alerts).where(gte5(alerts.createdAt, d30)).groupBy(alerts.sourceDocumentId).having(sql7`COUNT(DISTINCT ${alerts.watchlistId}) >= 3`).orderBy(desc7(sql7`COUNT(DISTINCT ${alerts.watchlistId})`)).limit(10);
  for (const row of convergenceRows) {
    const wlCount = Number(row.watchlistCount);
    anomalies.push({
      type: "watchlist_convergence",
      severity: wlCount >= 5 ? "critical" : wlCount >= 4 ? "high" : "medium",
      subject: row.alertTitle ?? `Doc #${row.sourceDocumentId}`,
      deviation: wlCount,
      baseline: 1,
      observed: wlCount,
      narrative: `A single document triggered alerts across ${wlCount} different watchlists \u2014 this cross-domain convergence suggests a high-impact event that touches multiple client interests simultaneously.`,
      detectedAt: now.toISOString(),
      metadata: { sourceDocumentId: row.sourceDocumentId, totalAlerts: row.totalAlerts }
    });
  }
  const recentHearings = await policyIntelDb.select({
    committee: hearingEvents.committee,
    hearingDate: hearingEvents.hearingDate,
    relatedBillIds: hearingEvents.relatedBillIds
  }).from(hearingEvents).where(gte5(hearingEvents.hearingDate, d7)).limit(100);
  const hearingBillIds = /* @__PURE__ */ new Map();
  for (const h of recentHearings) {
    for (const billId of h.relatedBillIds ?? []) {
      hearingBillIds.set(billId, h.committee);
    }
  }
  if (hearingBillIds.size > 0) {
    const billIdArray = Array.from(hearingBillIds.keys());
    const coveredBills = /* @__PURE__ */ new Set();
    if (billIdArray.length > 0) {
      const alertBillSearch = await policyIntelDb.select({ title: alerts.title, summary: alerts.summary }).from(alerts).where(gte5(alerts.createdAt, d90)).limit(1e3);
      for (const a of alertBillSearch) {
        const text3 = `${a.title} ${a.summary ?? ""}`;
        for (const billId of billIdArray) {
          if (text3.includes(billId)) {
            coveredBills.add(billId);
          }
        }
      }
    }
    for (const [billId, committee] of hearingBillIds) {
      if (!coveredBills.has(billId)) {
        anomalies.push({
          type: "ghost_bill",
          severity: "high",
          subject: billId,
          deviation: 0,
          baseline: 0,
          observed: 0,
          narrative: `Bill "${billId}" appeared in a hearing scheduled for ${committee} but has zero matching alerts in the system. This bill may have bypassed normal monitoring \u2014 it needs manual review to determine if your watchlists should cover it.`,
          detectedAt: now.toISOString(),
          metadata: { committee }
        });
      }
    }
  }
  const burstRows = await policyIntelDb.select({
    watchlistId: alerts.watchlistId,
    watchlistName: watchlists.name,
    recent7d: sql7`SUM(CASE WHEN ${alerts.createdAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    mid23d: sql7`SUM(CASE WHEN ${alerts.createdAt} >= ${d30.toISOString()}::timestamptz AND ${alerts.createdAt} < ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`
  }).from(alerts).innerJoin(watchlists, eq13(alerts.watchlistId, watchlists.id)).where(gte5(alerts.createdAt, d30)).groupBy(alerts.watchlistId, watchlists.name);
  for (const row of burstRows) {
    const recent = Number(row.recent7d) || 0;
    const prior = Number(row.mid23d) || 0;
    if (prior === 0 && recent >= 3) {
      anomalies.push({
        type: "velocity_anomaly",
        severity: recent >= 6 ? "critical" : "high",
        subject: row.watchlistName ?? `Watchlist #${row.watchlistId}`,
        deviation: recent,
        baseline: 0,
        observed: recent,
        narrative: `"${row.watchlistName}" was completely silent for 23 days then generated ${recent} alerts in the past week \u2014 a classic "silence then burst" pattern that often signals sudden legislative action or a data gap being filled.`,
        detectedAt: now.toISOString(),
        metadata: { watchlistId: row.watchlistId, silenceDays: 23, burstCount: recent }
      });
    }
  }
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  await persistAnomalies(anomalies, regime);
  return {
    analyzedAt: now.toISOString(),
    anomalies,
    criticalCount: anomalies.filter((a) => a.severity === "critical").length,
    highCount: anomalies.filter((a) => a.severity === "high").length,
    baselineWindow: "90 days"
  };
}

// server/policy-intel/engine/intelligence/forecast-tracker.ts
init_db();
init_schema_policy_intel();
import { desc as desc8, count as count6, eq as eq14 } from "drizzle-orm";
var BILL_ID_PATTERN = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/i;
var OUTCOME_SNAPSHOT_STALE_HOURS = 18;
var outcomeTruthPersistenceReady = false;
async function ensureOutcomeTruthPersistence() {
  if (outcomeTruthPersistenceReady) return;
  await queryClient.unsafe(`
    do $$
    begin
      create type policy_intel_bill_outcome as enum ('active', 'passed', 'failed', 'stalled', 'amended', 'unknown');
    exception
      when duplicate_object then null;
    end
    $$;
  `);
  await queryClient.unsafe(`
    create table if not exists policy_intel_bill_outcome_snapshots (
      id serial primary key,
      snapshot_key varchar(16) not null,
      captured_at timestamptz not null default now(),
      bill_id varchar(64) not null,
      stage varchar(64) not null default 'unknown',
      outcome policy_intel_bill_outcome not null default 'unknown',
      status_text text,
      source_document_id integer references policy_intel_source_documents(id) on delete set null,
      published_at timestamptz,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);
  await queryClient.unsafe(`
    create unique index if not exists policy_intel_bill_outcome_snapshot_bill_idx
    on policy_intel_bill_outcome_snapshots (snapshot_key, bill_id)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_bill_outcome_snapshot_idx
    on policy_intel_bill_outcome_snapshots (snapshot_key, captured_at)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_bill_outcome_outcome_idx
    on policy_intel_bill_outcome_snapshots (outcome)
  `);
  outcomeTruthPersistenceReady = true;
}
function utcSnapshotKey(date) {
  return date.toISOString().slice(0, 10);
}
function normalizeBillId(value) {
  if (!value) return null;
  const normalized = value.replace(/\./g, "").toUpperCase().replace(/\s+/g, " ").trim();
  return normalized || null;
}
function extractBillIdFromTitle(title) {
  const text3 = title ?? "";
  const match = text3.match(BILL_ID_PATTERN);
  if (!match) return null;
  return normalizeBillId(`${match[1]} ${match[2]}`);
}
function getPayloadRecord(rawPayload) {
  if (rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)) {
    return rawPayload;
  }
  return {};
}
function classifyOutcome(statusText, lastActionText) {
  const text3 = `${statusText} ${lastActionText}`.toLowerCase();
  if (/\b(amended|committee substitute|substitute adopted|engrossed as amended)\b/.test(text3)) {
    return "amended";
  }
  if (/\b(signed|enrolled|chaptered|effective|became law|sent to governor|governor signed|passed both|adopted final)\b/.test(text3)) {
    return "passed";
  }
  if (/\b(failed|defeated|killed|died|vetoed|withdrawn|stricken|lost|rejected)\b/.test(text3)) {
    return "failed";
  }
  if (/\b(left pending|held in committee|stalled|tabled|postponed indefinitely)\b/.test(text3)) {
    return "stalled";
  }
  if (/\b(referred|reported|considered|in committee|on floor|calendar)\b/.test(text3)) {
    return "active";
  }
  return "unknown";
}
function classifyStage(statusText, lastActionText) {
  const text3 = `${statusText} ${lastActionText}`.toLowerCase();
  if (/\b(governor|signed|veto|chaptered|effective|became law)\b/.test(text3)) return "governor";
  if (/\b(passed both|final passage|conference|concurrence)\b/.test(text3)) return "final_passage";
  if (/\b(second reading|third reading|on floor|calendar|engrossed)\b/.test(text3)) return "floor";
  if (/\b(referred|committee|public hearing|left pending|reported favorably)\b/.test(text3)) return "committee";
  if (/\b(prefiled|filed|introduced|read first time)\b/.test(text3)) return "introduced";
  return "unknown";
}
function resolveBillIdFromDocument(doc) {
  const payload = getPayloadRecord(doc.rawPayload);
  const payloadBillId = (typeof payload.billId === "string" ? payload.billId : null) ?? (typeof payload.billNumber === "string" ? payload.billNumber : null);
  return normalizeBillId(payloadBillId) ?? extractBillIdFromTitle(doc.title);
}
function resolveStatusText(payload) {
  const status = typeof payload.status === "string" ? payload.status : "";
  const statusCode = payload.statusCode !== void 0 && payload.statusCode !== null ? String(payload.statusCode) : "";
  return `${status} ${statusCode}`.trim();
}
function resolveLastActionText(payload) {
  const raw = payload.lastAction;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const action = raw.action;
    if (typeof action === "string") return action;
  }
  return "";
}
function outcomeToBinary(outcome) {
  if (outcome === "passed" || outcome === "amended") return 1;
  if (outcome === "failed" || outcome === "stalled") return 0;
  return null;
}
async function latestOutcomeSnapshotMeta() {
  await ensureOutcomeTruthPersistence();
  const [row] = await policyIntelDb.select({
    snapshotKey: billOutcomeSnapshots.snapshotKey,
    capturedAt: billOutcomeSnapshots.capturedAt
  }).from(billOutcomeSnapshots).orderBy(desc8(billOutcomeSnapshots.snapshotKey), desc8(billOutcomeSnapshots.capturedAt)).limit(1);
  if (!row) return null;
  return row;
}
async function refreshOutcomeTruthSnapshot(snapshotKey = utcSnapshotKey(/* @__PURE__ */ new Date())) {
  await ensureOutcomeTruthPersistence();
  const capturedAt = /* @__PURE__ */ new Date();
  const docs = await policyIntelDb.select({
    id: sourceDocuments.id,
    title: sourceDocuments.title,
    rawPayload: sourceDocuments.rawPayload,
    publishedAt: sourceDocuments.publishedAt
  }).from(sourceDocuments).where(eq14(sourceDocuments.sourceType, "texas_legislation")).orderBy(desc8(sourceDocuments.publishedAt), desc8(sourceDocuments.id));
  const latestByBill = /* @__PURE__ */ new Map();
  for (const doc of docs) {
    const billId = resolveBillIdFromDocument(doc);
    if (!billId || latestByBill.has(billId)) continue;
    const payload = getPayloadRecord(doc.rawPayload);
    const statusText = resolveStatusText(payload);
    const lastActionText = resolveLastActionText(payload);
    latestByBill.set(billId, {
      billId,
      stage: classifyStage(statusText, lastActionText),
      outcome: classifyOutcome(statusText, lastActionText),
      statusText: `${statusText} ${lastActionText}`.trim(),
      sourceDocumentId: doc.id,
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null
    });
  }
  await policyIntelDb.delete(billOutcomeSnapshots).where(eq14(billOutcomeSnapshots.snapshotKey, snapshotKey));
  const rows = Array.from(latestByBill.values()).map((entry) => ({
    snapshotKey,
    capturedAt,
    billId: entry.billId,
    stage: entry.stage,
    outcome: entry.outcome,
    statusText: entry.statusText || null,
    sourceDocumentId: entry.sourceDocumentId,
    publishedAt: entry.publishedAt ? new Date(entry.publishedAt) : null,
    metadataJson: {}
  }));
  const batchSize = 500;
  for (let index2 = 0; index2 < rows.length; index2 += batchSize) {
    const batch = rows.slice(index2, index2 + batchSize);
    await policyIntelDb.insert(billOutcomeSnapshots).values(batch);
  }
  return {
    snapshotKey,
    capturedAt: capturedAt.toISOString(),
    billsCaptured: rows.length
  };
}
async function ensureOutcomeTruthSnapshot() {
  const now = /* @__PURE__ */ new Date();
  const targetKey = utcSnapshotKey(now);
  const latest = await latestOutcomeSnapshotMeta();
  const latestAgeMs = latest ? now.getTime() - latest.capturedAt.getTime() : Number.POSITIVE_INFINITY;
  const shouldRefresh = !latest || latest.snapshotKey !== targetKey || latestAgeMs > OUTCOME_SNAPSHOT_STALE_HOURS * 60 * 60 * 1e3;
  const snapshotKey = shouldRefresh ? (await refreshOutcomeTruthSnapshot(targetKey)).snapshotKey : latest.snapshotKey;
  const rows = await policyIntelDb.select().from(billOutcomeSnapshots).where(eq14(billOutcomeSnapshots.snapshotKey, snapshotKey));
  const outcomes = /* @__PURE__ */ new Map();
  for (const row of rows) {
    outcomes.set(row.billId, {
      billId: row.billId,
      stage: row.stage,
      outcome: row.outcome,
      statusText: row.statusText ?? "",
      sourceDocumentId: row.sourceDocumentId ?? null,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null
    });
  }
  return { snapshotKey, outcomes };
}
async function getLatestOutcomeTruthSnapshotSummary() {
  await ensureOutcomeTruthPersistence();
  const latest = await latestOutcomeSnapshotMeta();
  if (!latest) {
    return {
      snapshotKey: null,
      capturedAt: null,
      totalBills: 0,
      outcomeCounts: {}
    };
  }
  const rows = await policyIntelDb.select({ outcome: billOutcomeSnapshots.outcome, cnt: count6() }).from(billOutcomeSnapshots).where(eq14(billOutcomeSnapshots.snapshotKey, latest.snapshotKey)).groupBy(billOutcomeSnapshots.outcome);
  const outcomeCounts = {};
  for (const row of rows) {
    outcomeCounts[row.outcome] = Number(row.cnt ?? 0);
  }
  const totalBills = Object.values(outcomeCounts).reduce((acc, next) => acc + next, 0);
  return {
    snapshotKey: latest.snapshotKey,
    capturedAt: latest.capturedAt.toISOString(),
    totalBills,
    outcomeCounts
  };
}
function metricNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
async function getForecastDriftSummary(limit = 24) {
  const normalizedLimit = Math.max(2, Math.min(120, Math.floor(Number(limit) || 24)));
  const rows = await policyIntelDb.select().from(learningMetrics).where(eq14(learningMetrics.metricType, "forecast_calibration")).orderBy(desc8(learningMetrics.capturedAt)).limit(normalizedLimit);
  const points = rows.slice().reverse().map((row) => {
    const values = row.valuesJson ?? {};
    return {
      capturedAt: row.capturedAt.toISOString(),
      regime: row.regime,
      accuracy: metricNumber(values.accuracy) ?? 0,
      rankingAccuracy: metricNumber(values.rankingAccuracy) ?? 0,
      verifiablePredictions: Math.max(0, Math.floor(metricNumber(values.verifiablePredictions) ?? 0))
    };
  });
  if (points.length < 2) {
    return {
      metricType: "forecast_calibration",
      points,
      latestAccuracy: points[0]?.accuracy ?? null,
      baselineAccuracy: points[0]?.accuracy ?? null,
      deltaAccuracy: null,
      latestRankingAccuracy: points[0]?.rankingAccuracy ?? null,
      deltaRankingAccuracy: null,
      trend: "insufficient_data",
      driftAlert: false,
      narrative: "Not enough calibration history yet to detect drift; at least 2 forecast calibration points are required."
    };
  }
  const baseline = points[0];
  const latest = points[points.length - 1];
  const deltaAccuracy = latest.accuracy - baseline.accuracy;
  const deltaRankingAccuracy = latest.rankingAccuracy - baseline.rankingAccuracy;
  const trend = deltaAccuracy > 0.05 ? "improving" : deltaAccuracy < -0.05 ? "degrading" : "stable";
  const recentWindow = points.slice(-Math.min(4, points.length));
  const recentDeclines = recentWindow.slice(1).filter((point, idx) => point.accuracy < recentWindow[idx].accuracy).length;
  const driftAlert = trend === "degrading" && (latest.accuracy < 0.55 || recentDeclines >= 2);
  const narrative = `Calibration trend is ${trend.toUpperCase()} over ${points.length} checkpoints (accuracy delta ${(deltaAccuracy * 100).toFixed(1)}pp, ranking delta ${(deltaRankingAccuracy * 100).toFixed(1)}pp).` + (driftAlert ? " Drift alert: recent forecast quality is deteriorating and should trigger model review." : " No drift alert threshold is currently exceeded.");
  return {
    metricType: "forecast_calibration",
    points,
    latestAccuracy: latest.accuracy,
    baselineAccuracy: baseline.accuracy,
    deltaAccuracy,
    latestRankingAccuracy: latest.rankingAccuracy,
    deltaRankingAccuracy,
    trend,
    driftAlert,
    narrative
  };
}
var MAX_SNAPSHOTS = 200;
async function storeSnapshot(snapshot) {
  await policyIntelDb.insert(forecastSnapshots).values({
    snapshotId: snapshot.snapshotId,
    capturedAt: new Date(snapshot.capturedAt),
    predictionsJson: snapshot.predictions,
    regime: snapshot.regime,
    totalInsights: snapshot.totalInsights,
    criticalRiskCount: snapshot.criticalRiskCount,
    anomalyCount: snapshot.anomalyCount
  });
  const countResult = await policyIntelDb.select({ cnt: count6() }).from(forecastSnapshots);
  const total = Number(countResult[0]?.cnt ?? 0);
  if (total > MAX_SNAPSHOTS) {
    const oldest = await policyIntelDb.select({ id: forecastSnapshots.id }).from(forecastSnapshots).orderBy(forecastSnapshots.capturedAt).limit(total - MAX_SNAPSHOTS);
    for (const row of oldest) {
      await policyIntelDb.delete(forecastSnapshots).where(eq14(forecastSnapshots.id, row.id));
    }
  }
}
async function getLatestSnapshot() {
  const [row] = await policyIntelDb.select().from(forecastSnapshots).orderBy(desc8(forecastSnapshots.capturedAt)).limit(1);
  if (!row) return null;
  return dbRowToSnapshot(row);
}
async function getAllSnapshots() {
  const rows = await policyIntelDb.select().from(forecastSnapshots).orderBy(forecastSnapshots.capturedAt).limit(MAX_SNAPSHOTS);
  return rows.map(dbRowToSnapshot);
}
function dbRowToSnapshot(row) {
  return {
    snapshotId: row.snapshotId,
    capturedAt: row.capturedAt.toISOString(),
    predictions: row.predictionsJson ?? [],
    regime: row.regime,
    totalInsights: row.totalInsights,
    criticalRiskCount: row.criticalRiskCount,
    anomalyCount: row.anomalyCount
  };
}
async function gradePredictions() {
  const snapshots = await getAllSnapshots();
  const { snapshotKey, outcomes } = await ensureOutcomeTruthSnapshot();
  if (snapshots.length < 2) {
    return {
      windowStart: (/* @__PURE__ */ new Date()).toISOString(),
      windowEnd: (/* @__PURE__ */ new Date()).toISOString(),
      totalPredictions: 0,
      verifiablePredictions: 0,
      accuracy: {
        overall: 0,
        calibration: buildEmptyCalibration(),
        rankingAccuracy: 0
      },
      blindSpots: [],
      trendDirection: "insufficient_data",
      narrative: `Insufficient forecast history \u2014 need at least 2 briefings to begin tracking accuracy. Outcome-truth snapshot ${snapshotKey} is ready for grading once more predictions accumulate.`
    };
  }
  const olderSnapshots = snapshots.slice(0, -1);
  const allPredictions = [];
  for (const snap of olderSnapshots) {
    allPredictions.push(...snap.predictions);
  }
  const uniquePredictions = /* @__PURE__ */ new Map();
  for (const p of allPredictions) {
    if (!uniquePredictions.has(p.billId)) {
      uniquePredictions.set(p.billId, { ...p });
    }
  }
  let correct = 0;
  let verifiable = 0;
  const buckets = buildEmptyCalibration();
  const missedBills = [];
  for (const [billId, pred] of uniquePredictions) {
    const normalizedBillId = normalizeBillId(billId) ?? billId;
    const truth = outcomes.get(normalizedBillId);
    const actual = truth ? outcomeToBinary(truth.outcome) : null;
    if (actual === null) {
      pred.actualOutcome = truth?.outcome ?? "unknown";
      continue;
    }
    const predictedPass = pred.predictedPassageProbability >= 0.5;
    const didPass = actual === 1;
    verifiable++;
    pred.actualOutcome = truth?.outcome ?? "unknown";
    if (predictedPass && didPass || !predictedPass && !didPass) {
      correct++;
      pred.wasAccurate = true;
    } else {
      pred.wasAccurate = false;
      if (!predictedPass && didPass) {
        missedBills.push(billId);
      }
    }
    for (const bucket of buckets) {
      if (pred.predictedPassageProbability >= bucket.lower && pred.predictedPassageProbability < bucket.upper) {
        bucket.count++;
        if (didPass) bucket.actualRate = (bucket.actualRate * (bucket.count - 1) + 1) / bucket.count;
        else bucket.actualRate = bucket.actualRate * (bucket.count - 1) / bucket.count;
        bucket.calibrationError = Math.abs(bucket.actualRate - (bucket.lower + bucket.upper) / 2);
        break;
      }
    }
  }
  const overallAccuracy = verifiable > 0 ? correct / verifiable : 0;
  let trendDirection = "insufficient_data";
  if (snapshots.length >= 4) {
    const midpoint = Math.floor(snapshots.length / 2);
    const olderAccuracy = computeSubsetAccuracy(snapshots.slice(0, midpoint), outcomes);
    const newerAccuracy = computeSubsetAccuracy(snapshots.slice(midpoint, -1), outcomes);
    if (newerAccuracy > olderAccuracy + 0.05) trendDirection = "improving";
    else if (newerAccuracy < olderAccuracy - 0.05) trendDirection = "degrading";
    else trendDirection = "stable";
  }
  const blindSpots = [];
  if (missedBills.length > 0) {
    blindSpots.push({
      category: "Under-predicted bills",
      description: `${missedBills.length} bill(s) were assessed as low risk but showed continued high activity \u2014 these may have been under-monitored.`,
      missCount: missedBills.length,
      examples: missedBills.slice(0, 5)
    });
  }
  let concordant = 0;
  let discordant = 0;
  const predsArray = Array.from(uniquePredictions.values());
  for (let i = 0; i < Math.min(predsArray.length, 50); i++) {
    for (let j = i + 1; j < Math.min(predsArray.length, 50); j++) {
      const pi = predsArray[i];
      const pj = predsArray[j];
      const ti = outcomes.get(normalizeBillId(pi.billId) ?? pi.billId);
      const tj = outcomes.get(normalizeBillId(pj.billId) ?? pj.billId);
      const ai = ti ? outcomeToBinary(ti.outcome) : null;
      const aj = tj ? outcomeToBinary(tj.outcome) : null;
      if (ai === null || aj === null) continue;
      if (pi.predictedPassageProbability > pj.predictedPassageProbability && ai > aj || pi.predictedPassageProbability < pj.predictedPassageProbability && ai < aj) {
        concordant++;
      } else if (pi.predictedPassageProbability > pj.predictedPassageProbability && ai < aj || pi.predictedPassageProbability < pj.predictedPassageProbability && ai > aj) {
        discordant++;
      }
    }
  }
  const rankingAccuracy = concordant + discordant > 0 ? concordant / (concordant + discordant) : 0.5;
  const narrative = verifiable === 0 ? `No predictions are yet verifiable against outcome truth snapshot ${snapshotKey}.` : `Graded ${verifiable} predictions: ${(overallAccuracy * 100).toFixed(0)}% accuracy. Ranking accuracy ${(rankingAccuracy * 100).toFixed(0)}% (higher predicted passage aligned with actual outcomes). ` + (trendDirection === "improving" ? "Model accuracy is improving over time. " : trendDirection === "degrading" ? "Warning: model accuracy is declining \u2014 check for data quality issues. " : trendDirection === "stable" ? "Model accuracy is stable. " : "") + (missedBills.length > 0 ? `${missedBills.length} blind spot(s) detected \u2014 bills under-predicted for passage but later passed/amended.` : `No major blind spots detected in outcome snapshot ${snapshotKey}.`);
  return {
    windowStart: snapshots[0].capturedAt,
    windowEnd: snapshots[snapshots.length - 1].capturedAt,
    totalPredictions: uniquePredictions.size,
    verifiablePredictions: verifiable,
    accuracy: {
      overall: Math.round(overallAccuracy * 100) / 100,
      calibration: buckets,
      rankingAccuracy: Math.round(rankingAccuracy * 100) / 100
    },
    blindSpots,
    trendDirection,
    narrative
  };
}
async function computeDelta(currentPredictions, currentAnomalyCount, currentClusterCount) {
  const previous = await getLatestSnapshot();
  if (!previous) {
    return {
      previousSnapshotId: null,
      previousCapturedAt: null,
      newRisks: currentPredictions.filter((p) => p.riskScore >= 40).map((p) => p.billId),
      resolvedRisks: [],
      escalatedRisks: [],
      deescalatedRisks: [],
      newAnomalies: currentAnomalyCount,
      resolvedAnomalies: 0,
      newClusters: currentClusterCount,
      threatTrend: "stable",
      narrative: "First analysis \u2014 no previous briefing to compare against. Future briefings will track changes automatically."
    };
  }
  const prevBills = new Map(previous.predictions.map((p) => [p.billId, p]));
  const currBills = new Map(currentPredictions.map((p) => [p.billId, p]));
  const newRisks = [];
  const resolvedRisks = [];
  const escalated = [];
  const deescalated = [];
  const riskOrder = { critical: 4, high: 3, elevated: 2, moderate: 1, low: 0 };
  for (const [billId, curr] of currBills) {
    const prev = prevBills.get(billId);
    if (!prev) {
      if (curr.riskScore >= 40) newRisks.push(billId);
    } else {
      const prevOrd = riskOrder[prev.predictedRiskLevel] ?? 0;
      const currOrd = riskOrder[curr.predictedRiskLevel] ?? 0;
      if (currOrd > prevOrd) {
        escalated.push({ billId, previousLevel: prev.predictedRiskLevel, currentLevel: curr.predictedRiskLevel });
      } else if (currOrd < prevOrd) {
        deescalated.push({ billId, previousLevel: prev.predictedRiskLevel, currentLevel: curr.predictedRiskLevel });
      }
    }
  }
  for (const [billId, prev] of prevBills) {
    if (!currBills.has(billId) && prev.riskScore >= 40) {
      resolvedRisks.push(billId);
    }
  }
  const resolvedAnomalies = Math.max(0, previous.anomalyCount - currentAnomalyCount);
  const newAnomalies = Math.max(0, currentAnomalyCount - previous.anomalyCount);
  const threatTrend = escalated.length > deescalated.length + 2 || newRisks.length > resolvedRisks.length + 2 ? "escalating" : deescalated.length > escalated.length + 2 || resolvedRisks.length > newRisks.length + 2 ? "deescalating" : "stable";
  const parts = [];
  if (newRisks.length > 0) parts.push(`${newRisks.length} new risk(s) emerged`);
  if (resolvedRisks.length > 0) parts.push(`${resolvedRisks.length} risk(s) resolved`);
  if (escalated.length > 0) parts.push(`${escalated.length} bill(s) escalated in risk level`);
  if (deescalated.length > 0) parts.push(`${deescalated.length} bill(s) de-escalated`);
  if (newAnomalies > 0) parts.push(`${newAnomalies} new anomalies`);
  if (resolvedAnomalies > 0) parts.push(`${resolvedAnomalies} anomalies resolved`);
  const narrative = parts.length === 0 ? `No significant changes since last analysis (${new Date(previous.capturedAt).toLocaleDateString()}). The legislative landscape is stable.` : `Since last analysis (${new Date(previous.capturedAt).toLocaleDateString()}): ${parts.join("; ")}. Overall threat trend: ${threatTrend.toUpperCase()}.`;
  return {
    previousSnapshotId: previous.snapshotId,
    previousCapturedAt: previous.capturedAt,
    newRisks,
    resolvedRisks,
    escalatedRisks: escalated,
    deescalatedRisks: deescalated,
    newAnomalies,
    resolvedAnomalies,
    newClusters: currentClusterCount - (previous.predictions.length > 0 ? 0 : 0),
    // rough
    threatTrend,
    narrative
  };
}
async function captureSnapshot(predictions, regime, insightCount, criticalRiskCount, anomalyCount) {
  const snapshot = {
    snapshotId: `snap-${Date.now()}`,
    capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
    predictions,
    regime,
    totalInsights: insightCount,
    criticalRiskCount,
    anomalyCount
  };
  await storeSnapshot(snapshot);
  return snapshot;
}
async function analyzeForecast(predictions, regime, insightCount, criticalRiskCount, anomalyCount, clusterCount) {
  const delta = await computeDelta(predictions, anomalyCount, clusterCount);
  const grade = await gradePredictions();
  const snapshot = await captureSnapshot(predictions, regime, insightCount, criticalRiskCount, anomalyCount);
  if (grade.verifiablePredictions > 0) {
    await policyIntelDb.insert(learningMetrics).values({
      metricType: "forecast_calibration",
      regime,
      valuesJson: {
        accuracy: grade.accuracy.overall,
        rankingAccuracy: grade.accuracy.rankingAccuracy,
        calibrationBuckets: grade.accuracy.calibration,
        blindSpotCount: grade.blindSpots.length,
        trendDirection: grade.trendDirection,
        verifiablePredictions: grade.verifiablePredictions
      }
    });
  }
  const allSnaps = await getAllSnapshots();
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    currentSnapshot: snapshot,
    delta,
    grade,
    historyDepth: allSnaps.length
  };
}
function buildEmptyCalibration() {
  return [
    { range: "0-20%", lower: 0, upper: 0.2, count: 0, actualRate: 0, calibrationError: 0 },
    { range: "20-40%", lower: 0.2, upper: 0.4, count: 0, actualRate: 0, calibrationError: 0 },
    { range: "40-60%", lower: 0.4, upper: 0.6, count: 0, actualRate: 0, calibrationError: 0 },
    { range: "60-80%", lower: 0.6, upper: 0.8, count: 0, actualRate: 0, calibrationError: 0 },
    { range: "80-100%", lower: 0.8, upper: 1.01, count: 0, actualRate: 0, calibrationError: 0 }
  ];
}
function computeSubsetAccuracy(snapshots, outcomes) {
  let correct = 0;
  let total = 0;
  for (const snap of snapshots) {
    for (const pred of snap.predictions) {
      const truth = outcomes.get(normalizeBillId(pred.billId) ?? pred.billId);
      const actual = truth ? outcomeToBinary(truth.outcome) : null;
      if (actual === null) continue;
      const predictedPass = pred.predictedPassageProbability >= 0.5;
      const didPass = actual === 1;
      total++;
      if (predictedPass && didPass || !predictedPass && !didPass) correct++;
    }
  }
  return total > 0 ? correct / total : 0;
}

// server/policy-intel/engine/intelligence/historical-patterns.ts
init_db();
import { sql as sql8 } from "drizzle-orm";
function normalizeStatus2(raw) {
  if (raw == null) return "unknown";
  const s = String(raw).toLowerCase().replace("status_", "").trim();
  switch (s) {
    case "0":
      return "na";
    case "1":
      return "introduced";
    case "2":
      return "engrossed";
    case "3":
      return "enrolled";
    case "4":
      return "passed";
    case "5":
      return "vetoed";
    default:
      return "unknown";
  }
}
var MONTH_LABELS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function extractCommittee2(lastAction) {
  const m = lastAction.match(/(?:Referred to|referred to)\s+(.+?)(?:\.|$)/i);
  return m ? m[1].trim() : null;
}
function extractBillType(billNumber) {
  const m = billNumber.match(/^(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)/i);
  return m ? m[1].replace(/\./g, "").toUpperCase() : "OTHER";
}
var BILL_TYPE_LABELS = {
  HB: "House Bill",
  SB: "Senate Bill",
  HJR: "House Joint Resolution",
  SJR: "Senate Joint Resolution",
  HCR: "House Concurrent Resolution",
  SCR: "Senate Concurrent Resolution",
  OTHER: "Other"
};
async function analyzeHistoricalPatterns() {
  const statusQuery = await policyIntelDb.execute(sql8`
    SELECT
      raw_payload->>'billNumber' AS bill_number,
      raw_payload->>'sessionId' AS session_id,
      raw_payload->>'sessionName' AS session_name,
      raw_payload->>'chamber' AS chamber,
      MAX(CASE
        WHEN (raw_payload->>'status') IN ('5', 'status_5') THEN '5'
        WHEN (raw_payload->>'status') IN ('4', 'status_4') THEN '4'
        WHEN (raw_payload->>'status') IN ('3', 'status_3') THEN '3'
        WHEN (raw_payload->>'status') IN ('2', 'status_2') THEN '2'
        WHEN (raw_payload->>'status') IN ('1', 'status_1') THEN '1'
        ELSE '0'
      END) AS best_status,
      MAX(raw_payload->>'lastActionDate') AS last_action_date
    FROM policy_intel_source_documents
    WHERE source_type = 'texas_legislation'
      AND raw_payload->>'billNumber' IS NOT NULL
    GROUP BY raw_payload->>'billNumber', raw_payload->>'sessionId',
             raw_payload->>'sessionName', raw_payload->>'chamber'
  `);
  const committeeQuery = await policyIntelDb.execute(sql8`
    SELECT DISTINCT ON (raw_payload->>'billNumber', raw_payload->>'sessionId')
      raw_payload->>'billNumber' AS bill_number,
      raw_payload->>'sessionId' AS session_id,
      raw_payload->>'lastAction' AS last_action
    FROM policy_intel_source_documents
    WHERE source_type = 'texas_legislation'
      AND raw_payload->>'lastAction' ILIKE 'Referred to%'
  `);
  const committeeOf = /* @__PURE__ */ new Map();
  for (const row of committeeQuery) {
    const bn = (row.bill_number ?? "").trim();
    const sid = row.session_id ?? "";
    const committee = extractCommittee2(row.last_action ?? "");
    if (bn && committee) {
      committeeOf.set(`${bn}||${sid}`, committee);
    }
  }
  const STATUS_MAP = {
    "0": "na",
    "1": "introduced",
    "2": "engrossed",
    "3": "enrolled",
    "4": "passed",
    "5": "vetoed"
  };
  const parsed = [];
  for (const row of statusQuery) {
    const billNumber = (row.bill_number ?? "").trim();
    const sessionId = row.session_id ?? "";
    const lastActionDate = row.last_action_date ?? null;
    let month = null;
    if (lastActionDate) {
      const d = new Date(lastActionDate);
      if (!isNaN(d.getTime())) month = d.getMonth() + 1;
    }
    const committee = committeeOf.get(`${billNumber}||${sessionId}`) ?? null;
    parsed.push({
      status: STATUS_MAP[row.best_status ?? "0"] ?? "unknown",
      chamber: row.chamber ?? "Unknown",
      sessionName: row.session_name ?? "Unknown",
      sessionId,
      billNumber,
      billType: extractBillType(billNumber),
      committee,
      lastActionDate,
      lastActionMonth: month
    });
  }
  const totalBills = parsed.length;
  const passedCount = parsed.filter((b) => b.status === "passed").length;
  const overallPassageRate = totalBills > 0 ? passedCount / totalBills : 0;
  const referralQuery = await policyIntelDb.execute(sql8`
    SELECT
      TRIM(SUBSTRING(raw_payload->>'lastAction' FROM 'Referred to (.+)')) AS committee_name,
      raw_payload->>'status' AS status,
      raw_payload->>'sessionName' AS session_name,
      COUNT(*)::text AS cnt
    FROM policy_intel_source_documents
    WHERE source_type = 'texas_legislation'
      AND raw_payload->>'lastAction' ILIKE 'Referred to%'
    GROUP BY committee_name, raw_payload->>'status', raw_payload->>'sessionName'
  `);
  const cAgg = /* @__PURE__ */ new Map();
  for (const row of referralQuery) {
    const committee = (row.committee_name ?? "").trim();
    if (!committee) continue;
    const count12 = parseInt(row.cnt, 10) || 0;
    const status = normalizeStatus2(row.status);
    const session = row.session_name ?? "Unknown";
    if (!cAgg.has(committee)) {
      cAgg.set(committee, { total: 0, statusCounts: {}, sessionTotals: /* @__PURE__ */ new Map() });
    }
    const agg = cAgg.get(committee);
    agg.total += count12;
    agg.statusCounts[status] = (agg.statusCounts[status] ?? 0) + count12;
    if (!agg.sessionTotals.has(session)) agg.sessionTotals.set(session, { total: 0, progressed: 0 });
    const st = agg.sessionTotals.get(session);
    st.total += count12;
    if (status !== "introduced" && status !== "na" && status !== "unknown") {
      st.progressed += count12;
    }
  }
  let totalReferred = 0;
  let totalProgressed = 0;
  for (const agg of cAgg.values()) {
    totalReferred += agg.total;
    totalProgressed += Object.entries(agg.statusCounts).filter(([s]) => s !== "introduced" && s !== "na" && s !== "unknown").reduce((sum, [, c]) => sum + c, 0);
  }
  const avgProgressionRate = totalReferred > 0 ? totalProgressed / totalReferred : 0;
  const committeeRates = [];
  for (const [committee, agg] of cAgg.entries()) {
    if (agg.total < 10) continue;
    const progressed = Object.entries(agg.statusCounts).filter(([s]) => s !== "introduced" && s !== "na" && s !== "unknown").reduce((sum, [, c]) => sum + c, 0);
    const progressionRate = agg.total > 0 ? progressed / agg.total : 0;
    const vetoed = agg.statusCounts["vetoed"] ?? 0;
    const sessionTrends = [...agg.sessionTotals.entries()].map(([session, { total, progressed: progressed2 }]) => ({
      session,
      total,
      passed: progressed2,
      rate: total > 0 ? progressed2 / total : 0
    })).sort((a, b) => a.session.localeCompare(b.session));
    const relativePerformance = progressionRate > avgProgressionRate + 0.05 ? "above_average" : progressionRate < avgProgressionRate - 0.05 ? "below_average" : "average";
    const stuckPct = ((1 - progressionRate) * 100).toFixed(1);
    committeeRates.push({
      committee,
      totalBills: agg.total,
      passedBills: progressed,
      passageRate: progressionRate,
      vetoedBills: vetoed,
      vetoRate: agg.total > 0 ? vetoed / agg.total : 0,
      relativePerformance,
      statusBreakdown: agg.statusCounts,
      sessionTrends,
      narrative: `${committee}: ${agg.total} bills referred, ${stuckPct}% still in committee. ${progressed} progressed past referral (${(progressionRate * 100).toFixed(1)}% progression rate). ${relativePerformance === "above_average" ? "Progresses bills faster than average." : relativePerformance === "below_average" ? "Major bottleneck \u2014 kills most bills." : "Average progression rate."}`
    });
  }
  committeeRates.sort((a, b) => b.totalBills - a.totalBills);
  const typeMap = /* @__PURE__ */ new Map();
  for (const b of parsed) {
    if (!typeMap.has(b.billType)) typeMap.set(b.billType, []);
    typeMap.get(b.billType).push(b);
  }
  const billTypePatterns = [];
  for (const [billType, bills] of typeMap.entries()) {
    const total = bills.length;
    const passed = bills.filter((b) => b.status === "passed").length;
    const vetoed = bills.filter((b) => b.status === "vetoed").length;
    const engrossed = bills.filter((b) => b.status === "engrossed").length;
    const rate = total > 0 ? passed / total : 0;
    billTypePatterns.push({
      billType,
      label: BILL_TYPE_LABELS[billType] ?? billType,
      totalBills: total,
      passedBills: passed,
      passageRate: rate,
      vetoedBills: vetoed,
      engrossedBills: engrossed,
      avgProgressionDays: null,
      // would require introduction date vs passage date
      narrative: `${BILL_TYPE_LABELS[billType] ?? billType}s have a ${(rate * 100).toFixed(1)}% passage rate (${passed}/${total}). ${vetoed > 0 ? `${vetoed} were vetoed.` : ""}`
    });
  }
  billTypePatterns.sort((a, b) => b.totalBills - a.totalBills);
  const sessionMap = /* @__PURE__ */ new Map();
  for (const b of parsed) {
    const key = b.sessionName;
    if (!sessionMap.has(key)) sessionMap.set(key, []);
    sessionMap.get(key).push(b);
  }
  const sessionAnalyses = [];
  const sessionPassageRates = [];
  for (const [sessionName, bills] of sessionMap.entries()) {
    const total = bills.length;
    const introduced = bills.filter((b) => b.status === "introduced").length;
    const engrossed = bills.filter((b) => b.status === "engrossed").length;
    const enrolled = bills.filter((b) => b.status === "enrolled").length;
    const passed = bills.filter((b) => b.status === "passed").length;
    const vetoed = bills.filter((b) => b.status === "vetoed").length;
    const rate = total > 0 ? passed / total : 0;
    sessionPassageRates.push(rate);
    sessionAnalyses.push({
      sessionName,
      sessionId: bills[0]?.sessionId ?? "",
      totalBills: total,
      introduced,
      engrossed,
      enrolled,
      passed,
      vetoed,
      passageRate: rate,
      performanceVsMedian: 0,
      // computed after median is known
      narrative: ""
      // computed after median is known
    });
  }
  const sortedRates = [...sessionPassageRates].sort((a, b) => a - b);
  const medianRate = sortedRates.length > 0 ? sortedRates[Math.floor(sortedRates.length / 2)] : 0;
  for (const sa of sessionAnalyses) {
    sa.performanceVsMedian = medianRate > 0 ? (sa.passageRate - medianRate) / medianRate : 0;
    const pctVsMedian = (sa.performanceVsMedian * 100).toFixed(1);
    const dir = sa.performanceVsMedian > 0 ? "above" : sa.performanceVsMedian < 0 ? "below" : "at";
    sa.narrative = `${sa.sessionName}: ${sa.totalBills} bills filed, ${sa.passed} passed (${(sa.passageRate * 100).toFixed(1)}% passage rate, ${dir} median by ${Math.abs(sa.performanceVsMedian * 100).toFixed(1)}%). ${sa.vetoed} vetoed.`;
  }
  sessionAnalyses.sort((a, b) => a.sessionName.localeCompare(b.sessionName));
  const chamberMap = /* @__PURE__ */ new Map();
  for (const b of parsed) {
    if (!chamberMap.has(b.chamber)) chamberMap.set(b.chamber, []);
    chamberMap.get(b.chamber).push(b);
  }
  const chamberPatterns = [];
  for (const [chamber, bills] of chamberMap.entries()) {
    const total = bills.length;
    const passed = bills.filter((b) => b.status === "passed").length;
    const rate = total > 0 ? passed / total : 0;
    const cMap = /* @__PURE__ */ new Map();
    for (const b of bills) {
      if (!b.committee) continue;
      if (!cMap.has(b.committee)) cMap.set(b.committee, { total: 0, passed: 0 });
      const entry = cMap.get(b.committee);
      entry.total++;
      if (b.status === "passed") entry.passed++;
    }
    const topCommittees = [...cMap.entries()].map(([committee, { total: total2, passed: passed2 }]) => ({
      committee,
      bills: total2,
      passageRate: total2 > 0 ? passed2 / total2 : 0
    })).sort((a, b) => b.bills - a.bills).slice(0, 5);
    chamberPatterns.push({
      chamber,
      totalBills: total,
      passedBills: passed,
      passageRate: rate,
      topCommittees,
      narrative: `${chamber} chamber: ${(rate * 100).toFixed(1)}% passage rate across ${total} bills. Top committee: ${topCommittees[0]?.committee ?? "N/A"} (${topCommittees[0] ? (topCommittees[0].passageRate * 100).toFixed(1) + "%" : "N/A"}).`
    });
  }
  const passedBills = parsed.filter((b) => b.status === "passed" && b.lastActionMonth != null);
  const monthCounts = /* @__PURE__ */ new Map();
  for (const b of passedBills) {
    const m = b.lastActionMonth;
    monthCounts.set(m, (monthCounts.get(m) ?? 0) + 1);
  }
  const totalPassed = passedBills.length;
  const timingPatterns = [];
  for (let m = 1; m <= 12; m++) {
    const count12 = monthCounts.get(m) ?? 0;
    const share = totalPassed > 0 ? count12 / totalPassed : 0;
    timingPatterns.push({
      month: m,
      monthLabel: MONTH_LABELS[m],
      billsPassedInMonth: count12,
      shareOfPassages: share,
      narrative: count12 > 0 ? `${MONTH_LABELS[m]}: ${count12} bills passed (${(share * 100).toFixed(1)}% of all passed bills).` : `${MONTH_LABELS[m]}: no bills passed in this month historically.`
    });
  }
  const keyFindings = [];
  const topCommittee = committeeRates.filter((c) => c.totalBills >= 50).sort((a, b) => b.passageRate - a.passageRate)[0];
  if (topCommittee) {
    keyFindings.push(
      `${topCommittee.committee} has the highest committee progression rate at ${(topCommittee.passageRate * 100).toFixed(1)}% (${topCommittee.passedBills}/${topCommittee.totalBills} bills advanced past referral).`
    );
  }
  const bottomCommittee = committeeRates.filter((c) => c.totalBills >= 50).sort((a, b) => a.passageRate - b.passageRate)[0];
  if (bottomCommittee && bottomCommittee.committee !== topCommittee?.committee) {
    keyFindings.push(
      `${bottomCommittee.committee} is the biggest bottleneck \u2014 only ${(bottomCommittee.passageRate * 100).toFixed(1)}% of ${bottomCommittee.totalBills} referred bills advanced past committee.`
    );
  }
  const peakMonth = timingPatterns.reduce((max, t) => t.billsPassedInMonth > max.billsPassedInMonth ? t : max, timingPatterns[0]);
  if (peakMonth && peakMonth.billsPassedInMonth > 0) {
    keyFindings.push(
      `${peakMonth.monthLabel} is historically the peak month for bill passage, with ${(peakMonth.shareOfPassages * 100).toFixed(1)}% of all passed bills.`
    );
  }
  const topType = [...billTypePatterns].filter((bt) => bt.billType !== "OTHER").sort((a, b) => b.passageRate - a.passageRate)[0];
  if (topType) {
    keyFindings.push(
      `${topType.label}s have the highest passage rate at ${(topType.passageRate * 100).toFixed(1)}%.`
    );
  }
  keyFindings.push(
    `Overall, ${(overallPassageRate * 100).toFixed(1)}% of bills pass across ${sessionAnalyses.length} sessions (${passedCount}/${totalBills}).`
  );
  const housePat = chamberPatterns.find((c) => c.chamber === "House");
  const senatePat = chamberPatterns.find((c) => c.chamber === "Senate");
  if (housePat && senatePat) {
    const diff = Math.abs(housePat.passageRate - senatePat.passageRate) * 100;
    const higher = housePat.passageRate > senatePat.passageRate ? "House" : "Senate";
    keyFindings.push(
      `${higher} bills pass at a ${diff.toFixed(1)}pp higher rate than ${higher === "House" ? "Senate" : "House"} bills.`
    );
  }
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalBillsAnalyzed: totalBills,
    sessionsAnalyzed: sessionAnalyses.length,
    committeeRates,
    billTypePatterns,
    sessionAnalyses,
    chamberPatterns,
    timingPatterns,
    keyFindings,
    overallPassageRate
  };
}

// server/policy-intel/engine/intelligence/legislator-profiler.ts
init_db();
init_schema_policy_intel();
import { eq as eq15, sql as sql9, gte as gte6, desc as desc9, count as count7 } from "drizzle-orm";
async function analyzeLegislatorProfiles() {
  const d90 = new Date(Date.now() - 90 * 864e5);
  const legislators = await policyIntelDb.select().from(stakeholders).where(eq15(stakeholders.type, "legislator"));
  const allCommittees = await policyIntelDb.select().from(committeeMembers);
  const stakeholderCommittees = /* @__PURE__ */ new Map();
  for (const cm of allCommittees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }
  const obsCounts = await policyIntelDb.select({ stakeholderId: stakeholderObservations.stakeholderId, cnt: count7(), latestAt: sql9`MAX(${stakeholderObservations.createdAt})` }).from(stakeholderObservations).groupBy(stakeholderObservations.stakeholderId);
  const obsMap = new Map(obsCounts.map((r) => [r.stakeholderId, { count: r.cnt, latestAt: r.latestAt }]));
  const noteCounts = await policyIntelDb.select({ stakeholderId: meetingNotes.stakeholderId, cnt: count7(), latestAt: sql9`MAX(${meetingNotes.createdAt})` }).from(meetingNotes).groupBy(meetingNotes.stakeholderId);
  const noteMap = new Map(noteCounts.map((r) => [r.stakeholderId, { count: r.cnt, latestAt: r.latestAt }]));
  const activeWatchlists = await policyIntelDb.select({ id: watchlists.id, rulesJson: watchlists.rulesJson }).from(watchlists).where(eq15(watchlists.isActive, true));
  const watchedBillIds = /* @__PURE__ */ new Set();
  for (const wl of activeWatchlists) {
    const rules = wl.rulesJson;
    if (rules?.billIds && Array.isArray(rules.billIds)) {
      for (const bid of rules.billIds) {
        if (typeof bid === "string") watchedBillIds.add(bid.toUpperCase());
      }
    }
  }
  const recentAlerts = await policyIntelDb.select({ title: alerts.title, summary: alerts.summary, whyItMatters: alerts.whyItMatters }).from(alerts).where(gte6(alerts.createdAt, d90)).orderBy(desc9(alerts.relevanceScore)).limit(800);
  const recentDocs = await policyIntelDb.select({
    title: sourceDocuments.title,
    rawPayload: sourceDocuments.rawPayload,
    normalizedText: sourceDocuments.normalizedText
  }).from(sourceDocuments).where(gte6(sourceDocuments.fetchedAt, d90)).orderBy(desc9(sourceDocuments.fetchedAt)).limit(800);
  const billIdPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const billTexts = /* @__PURE__ */ new Map();
  for (const a of recentAlerts) {
    const fullText = `${a.title} ${a.summary ?? ""} ${a.whyItMatters ?? ""}`;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    let m;
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      billTexts.set(billId, (billTexts.get(billId) ?? "") + " " + fullText);
    }
  }
  for (const doc of recentDocs) {
    const fullText = `${doc.title} ${doc.normalizedText?.slice(0, 2e3) ?? ""}`;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    let m;
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      billTexts.set(billId, (billTexts.get(billId) ?? "") + " " + fullText);
    }
    const payload = doc.rawPayload;
    if (payload && typeof payload === "object") {
      const p = payload;
      if (p.sponsors && Array.isArray(p.sponsors)) {
        for (const sp of p.sponsors) {
          if (sp && typeof sp === "object") {
            const rec = sp;
            if (typeof rec.name === "string" && typeof rec.bill_id === "string") {
              const bid = rec.bill_id.toString().replace(/\./g, "").toUpperCase().replace(/\s+/g, " ").trim();
              billTexts.set(bid, (billTexts.get(bid) ?? "") + ` Sponsor: ${rec.name}`);
            }
          }
        }
      }
    }
  }
  const legislatorBills = /* @__PURE__ */ new Map();
  const billLegislators = /* @__PURE__ */ new Map();
  for (const leg of legislators) {
    const nameParts = leg.name.split(/\s+/).filter((p) => p.length > 2);
    if (nameParts.length === 0) continue;
    const lastName = nameParts[nameParts.length - 1];
    for (const [billId, text3] of billTexts) {
      const lowerText = text3.toLowerCase();
      if (lowerText.includes(lastName.toLowerCase())) {
        const firstNameOrInitial = nameParts.length > 1 ? nameParts[0] : null;
        const isConfirmed = firstNameOrInitial ? lowerText.includes(firstNameOrInitial.toLowerCase()) || lowerText.includes(lastName.toLowerCase()) : true;
        if (isConfirmed) {
          const bills = legislatorBills.get(leg.id) ?? /* @__PURE__ */ new Set();
          bills.add(billId);
          legislatorBills.set(leg.id, bills);
          const legs = billLegislators.get(billId) ?? /* @__PURE__ */ new Set();
          legs.add(leg.id);
          billLegislators.set(billId, legs);
        }
      }
    }
  }
  const committeeBillCounts = /* @__PURE__ */ new Map();
  for (const a of recentAlerts) {
    const t = `${a.title ?? ""} ${a.summary ?? ""}`.toLowerCase();
    for (const cm of allCommittees) {
      if (t.includes(cm.committeeName.toLowerCase().slice(0, 30))) {
        committeeBillCounts.set(cm.committeeName, (committeeBillCounts.get(cm.committeeName) ?? 0) + 1);
      }
    }
  }
  const profiles = [];
  let totalBillsMatched = 0;
  for (const leg of legislators) {
    const committees = stakeholderCommittees.get(leg.id) ?? [];
    const obs = obsMap.get(leg.id) ?? { count: 0, latestAt: null };
    const notes = noteMap.get(leg.id) ?? { count: 0, latestAt: null };
    const bills = legislatorBills.get(leg.id) ?? /* @__PURE__ */ new Set();
    totalBillsMatched += bills.size;
    let powerScore = 0;
    const isLeadership = !!(leg.title && /speaker|president|pro tem|whip|caucus chair/i.test(leg.title));
    let committeePower = 0;
    for (const cm of committees) {
      if (cm.role === "chair") committeePower += 15;
      else if (cm.role === "vice_chair") committeePower += 8;
      else committeePower += 2;
    }
    committeePower = Math.min(40, committeePower);
    const leadershipPower = isLeadership ? 25 : 0;
    const billActivity = Math.min(20, bills.size * 3);
    const engagementSignal = Math.min(15, obs.count * 3 + notes.count * 4);
    powerScore = committeePower + leadershipPower + billActivity + engagementSignal;
    const billTypes = {};
    for (const bid of bills) {
      const prefix = bid.split(/\s/)[0] || "OTHER";
      billTypes[prefix] = (billTypes[prefix] ?? 0) + 1;
    }
    let watchlistOverlap = 0;
    for (const bid of bills) {
      if (watchedBillIds.has(bid.toUpperCase())) watchlistOverlap++;
    }
    const issueFocus = deriveIssueFocus(bills, billTexts);
    const allyMap = /* @__PURE__ */ new Map();
    for (const bid of bills) {
      const coLegs = billLegislators.get(bid) ?? /* @__PURE__ */ new Set();
      for (const coId of coLegs) {
        if (coId !== leg.id) {
          allyMap.set(coId, (allyMap.get(coId) ?? 0) + 1);
        }
      }
    }
    const allies = [...allyMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([allyId, sharedBills]) => {
      const ally = legislators.find((l) => l.id === allyId);
      return {
        name: ally?.name ?? `Legislator #${allyId}`,
        party: ally?.party ?? "Unknown",
        sharedBills,
        isCrossParty: ally?.party ? ally.party !== leg.party : false
      };
    });
    const latestDates = [obs.latestAt, notes.latestAt].filter(Boolean).map((d) => new Date(d).getTime());
    const mostRecent = latestDates.length > 0 ? new Date(Math.max(...latestDates)).toISOString() : null;
    const engagementLevel = obs.count + notes.count >= 5 ? "high" : obs.count + notes.count >= 2 ? "moderate" : obs.count + notes.count >= 1 ? "low" : "none";
    const enrichedCommittees = committees.map((cm) => ({
      name: cm.committeeName,
      role: cm.role,
      activeBillCount: committeeBillCounts.get(cm.committeeName) ?? 0
    }));
    const impactLevel = powerScore >= 60 && watchlistOverlap >= 2 || isLeadership ? "critical" : powerScore >= 40 || watchlistOverlap >= 1 ? "high" : powerScore >= 20 ? "moderate" : "low";
    const tags = [];
    if (isLeadership) tags.push("leadership");
    if (committees.some((c) => c.role === "chair")) tags.push("committee-chair");
    if (committees.some((c) => c.role === "vice_chair")) tags.push("vice-chair");
    if (allies.some((a) => a.isCrossParty)) tags.push("bipartisan");
    if (engagementLevel === "none") tags.push("unengaged");
    if (watchlistOverlap > 0) tags.push("watchlist-active");
    if (bills.size >= 5) tags.push("prolific");
    const assessmentParts = [];
    if (isLeadership) {
      assessmentParts.push(`${leg.name} holds chamber leadership \u2014 top-tier structural power.`);
    }
    if (committees.filter((c) => c.role === "chair").length > 0) {
      const chairNames = committees.filter((c) => c.role === "chair").map((c) => c.committeeName);
      assessmentParts.push(`Chairs ${chairNames.join(", ")} \u2014 controls bill flow in ${chairNames.length > 1 ? "these areas" : "this area"}.`);
    }
    if (bills.size > 0) {
      assessmentParts.push(`Linked to ${bills.size} bill${bills.size !== 1 ? "s" : ""} in recent activity.`);
    }
    if (watchlistOverlap > 0) {
      assessmentParts.push(`${watchlistOverlap} bill${watchlistOverlap !== 1 ? "s" : ""} overlap with active watchlists \u2014 direct impact on tracked issues.`);
    }
    if (allies.some((a) => a.isCrossParty && a.sharedBills >= 2)) {
      assessmentParts.push("Shows bipartisan collaboration patterns.");
    }
    if (engagementLevel === "none" && powerScore >= 30) {
      assessmentParts.push("\u26A0 Under-engaged: high power but no observations or meeting notes in our system.");
    }
    const assessment = assessmentParts.length > 0 ? assessmentParts.join(" ") : `${leg.name} (${leg.party ?? "Unknown"}) \u2014 moderate legislative profile with limited recent activity in tracked areas.`;
    profiles.push({
      stakeholderId: leg.id,
      name: leg.name,
      party: leg.party ?? "Unknown",
      chamber: leg.chamber ?? "Unknown",
      district: leg.district ?? "Unknown",
      title: isLeadership ? leg.title ?? void 0 : void 0,
      powerScore,
      committees: enrichedCommittees,
      sponsorship: {
        totalBills: bills.size,
        billIds: [...bills],
        billTypes,
        watchlistOverlap
      },
      issueFocus,
      allies,
      engagement: {
        observationCount: obs.count,
        meetingNoteCount: notes.count,
        lastContactDate: mostRecent,
        engagementLevel
      },
      assessment,
      tags,
      impactLevel
    });
  }
  profiles.sort((a, b) => b.powerScore - a.powerScore);
  const keyPlayers = profiles.filter((p) => p.impactLevel === "critical" || p.impactLevel === "high").slice(0, 10);
  const gatekeepers = profiles.filter((p) => p.committees.some((c) => c.role === "chair" && c.activeBillCount > 0));
  const bridgeBuilders = profiles.filter((p) => p.allies.filter((a) => a.isCrossParty && a.sharedBills >= 2).length >= 1).sort((a, b) => {
    const aCross = a.allies.filter((al) => al.isCrossParty).reduce((s, al) => s + al.sharedBills, 0);
    const bCross = b.allies.filter((al) => al.isCrossParty).reduce((s, al) => s + al.sharedBills, 0);
    return bCross - aCross;
  }).slice(0, 10);
  const blindSpots = profiles.filter((p) => p.powerScore >= 30 && p.engagement.engagementLevel === "none").slice(0, 10);
  const byParty = {};
  const byChamber = {};
  const engagementBreakdown = { high: 0, moderate: 0, low: 0, none: 0 };
  for (const p of profiles) {
    byParty[p.party] = (byParty[p.party] ?? 0) + 1;
    byChamber[p.chamber] = (byChamber[p.chamber] ?? 0) + 1;
    engagementBreakdown[p.engagement.engagementLevel]++;
  }
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalLegislators: profiles.length,
    totalBillsMatched,
    profiles,
    keyPlayers,
    gatekeepers,
    bridgeBuilders,
    blindSpots,
    stats: {
      byParty,
      byChamber,
      avgPowerScore: profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.powerScore, 0) / profiles.length) : 0,
      avgBillCount: profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.sponsorship.totalBills, 0) / profiles.length * 10) / 10 : 0,
      engagementBreakdown
    }
  };
}
function deriveIssueFocus(bills, billTexts) {
  const topicKeywords = {
    "Energy & Environment": ["energy", "electric", "power grid", "solar", "wind", "oil", "gas", "emission", "environmental", "climate", "water", "pollution"],
    "Criminal Justice": ["criminal", "felony", "misdemeanor", "incarceration", "parole", "probation", "sentencing", "law enforcement", "police", "corrections"],
    "Education": ["education", "school", "teacher", "student", "university", "college", "curriculum", "textbook", "tuition"],
    "Healthcare": ["health", "hospital", "medicaid", "medicare", "insurance", "pharmaceutical", "drug", "mental health", "nursing"],
    "Transportation": ["transportation", "highway", "road", "bridge", "transit", "railroad", "traffic", "tolls", "txdot"],
    "Public Safety": ["public safety", "emergency", "disaster", "fire", "flood", "hurricane", "homeland security"],
    "Taxation & Finance": ["tax", "revenue", "budget", "fiscal", "appropriation", "finance", "property tax", "sales tax"],
    "Elections & Voting": ["election", "voting", "ballot", "voter", "redistrict", "campaign", "poll"],
    "Agriculture": ["agriculture", "farm", "ranch", "livestock", "crop", "rural", "water rights"],
    "Technology & Privacy": ["technology", "data", "privacy", "cybersecurity", "broadband", "internet", "artificial intelligence"]
  };
  const topicCounts = {};
  for (const bid of bills) {
    const text3 = (billTexts.get(bid) ?? "").toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((kw) => text3.includes(kw))) {
        topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
      }
    }
  }
  return Object.entries(topicCounts).filter(([, cnt]) => cnt >= 1).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic, cnt]) => ({
    topic,
    billCount: cnt,
    stance: cnt >= 3 ? "champion" : cnt >= 2 ? "aligned" : "neutral"
  }));
}

// server/policy-intel/engine/intelligence/influence-map.ts
init_db();
init_schema_policy_intel();
import { eq as eq16, gte as gte7, desc as desc10, count as count8, and as and8 } from "drizzle-orm";
async function analyzeInfluenceMaps() {
  const d90 = new Date(Date.now() - 90 * 864e5);
  const legislators = await policyIntelDb.select().from(stakeholders).where(eq16(stakeholders.type, "legislator"));
  const legById = new Map(legislators.map((l) => [l.id, l]));
  const allCommittees = await policyIntelDb.select().from(committeeMembers);
  const committeeLookup = /* @__PURE__ */ new Map();
  const stakeholderCommittees = /* @__PURE__ */ new Map();
  for (const cm of allCommittees) {
    const byCommittee = committeeLookup.get(cm.committeeName) ?? [];
    byCommittee.push(cm);
    committeeLookup.set(cm.committeeName, byCommittee);
    const bySH = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    bySH.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, bySH);
  }
  const obsCounts = await policyIntelDb.select({ stakeholderId: stakeholderObservations.stakeholderId, cnt: count8() }).from(stakeholderObservations).groupBy(stakeholderObservations.stakeholderId);
  const noteCounts = await policyIntelDb.select({ stakeholderId: meetingNotes.stakeholderId, cnt: count8() }).from(meetingNotes).groupBy(meetingNotes.stakeholderId);
  const engagementMap = /* @__PURE__ */ new Map();
  for (const r of obsCounts) engagementMap.set(r.stakeholderId, r.cnt);
  for (const r of noteCounts) engagementMap.set(r.stakeholderId, (engagementMap.get(r.stakeholderId) ?? 0) + r.cnt);
  const recentAlerts = await policyIntelDb.select({
    title: alerts.title,
    summary: alerts.summary,
    whyItMatters: alerts.whyItMatters,
    relevanceScore: alerts.relevanceScore
  }).from(alerts).where(and8(gte7(alerts.createdAt, d90), gte7(alerts.relevanceScore, 40))).orderBy(desc10(alerts.relevanceScore)).limit(400);
  const billIdPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const billData = /* @__PURE__ */ new Map();
  for (const a of recentAlerts) {
    const fullText = `${a.title} ${a.summary ?? ""} ${a.whyItMatters ?? ""}`;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    let m;
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      const existing = billData.get(billId) ?? {
        title: a.title,
        text: "",
        avgScore: 0,
        scoreCount: 0,
        committees: /* @__PURE__ */ new Set(),
        sponsorNames: /* @__PURE__ */ new Set()
      };
      existing.text += " " + fullText;
      existing.avgScore += a.relevanceScore ?? 0;
      existing.scoreCount++;
      billData.set(billId, existing);
    }
  }
  for (const [, bd] of billData) {
    if (bd.scoreCount > 0) bd.avgScore = bd.avgScore / bd.scoreCount;
  }
  const committeeNames = [...committeeLookup.keys()];
  for (const [, bd] of billData) {
    const lowerText = bd.text.toLowerCase();
    for (const cn of committeeNames) {
      if (lowerText.includes(cn.toLowerCase().slice(0, 25))) {
        bd.committees.add(cn);
      }
    }
    const referredMatch = bd.text.match(/[Rr]eferred to\s+(.+?)(\.|,|\n|$)/);
    if (referredMatch) {
      const refCom = referredMatch[1].trim();
      const closest = committeeNames.find(
        (cn) => cn.toLowerCase().startsWith(refCom.toLowerCase().slice(0, 20))
      );
      if (closest) bd.committees.add(closest);
    }
  }
  for (const [, bd] of billData) {
    for (const leg of legislators) {
      const lastName = leg.name.split(/\s+/).pop()?.toLowerCase();
      if (lastName && lastName.length > 2 && bd.text.toLowerCase().includes(lastName)) {
        bd.sponsorNames.add(leg.name);
      }
    }
  }
  function detectStage2(text3) {
    const lower = (text3 ?? "").toLowerCase();
    if (/enrolled|signed by governor/i.test(lower)) return "enrolled";
    if (/passed (both|senate and house)/i.test(lower)) return "passed_both";
    if (/passed (senate|house)|third reading/i.test(lower)) return "passed_chamber";
    if (/conference committee/i.test(lower)) return "conference";
    if (/reported favorably|voted from committee/i.test(lower)) return "reported";
    if (/hearing scheduled|committee hearing/i.test(lower)) return "hearing";
    if (/referred to committee|referred to/i.test(lower)) return "referred";
    if (/introduced|filed/i.test(lower)) return "filed";
    return "unknown";
  }
  const topBills = [...billData.entries()].sort((a, b) => b[1].avgScore - a[1].avgScore).slice(0, 30);
  const maps = [];
  const legislatorBillCounts = /* @__PURE__ */ new Map();
  for (const [billId, bd] of topBills) {
    const stage = detectStage2(bd.text);
    const committeePath = [...bd.committees];
    const targets = [];
    for (const committee of bd.committees) {
      const members = committeeLookup.get(committee) ?? [];
      for (const member of members) {
        const leg = legById.get(member.stakeholderId);
        if (!leg) continue;
        const engagement = engagementMap.get(leg.id) ?? 0;
        const isChair = member.role === "chair";
        const isViceChair = member.role === "vice_chair";
        const isSponsor = bd.sponsorNames.has(leg.name);
        let leverage = 0;
        if (isChair) leverage += 40;
        else if (isViceChair) leverage += 20;
        else leverage += 8;
        if (isSponsor) leverage += 25;
        const isLeadership = !!(leg.title && /speaker|president|pro tem/i.test(leg.title));
        if (isLeadership) leverage += 20;
        leverage = Math.min(100, leverage);
        let likelyStance = "unknown";
        const evidence = [];
        if (isSponsor) {
          likelyStance = "support";
          evidence.push(`Identified as sponsor/co-sponsor of ${billId}`);
        }
        const billChamber = billId.startsWith("H") ? "House" : billId.startsWith("S") ? "Senate" : null;
        if (billChamber && leg.chamber === billChamber && isSponsor) {
          evidence.push("Bill originates in their chamber \u2014 increased influence");
          leverage = Math.min(100, leverage + 5);
        }
        if (engagement > 0) {
          evidence.push(`${engagement} engagement records in our system`);
        } else {
          evidence.push("No engagement records \u2014 stance is less predictable");
        }
        if (isChair) {
          evidence.push(`Chairs ${committee} \u2014 controls bill scheduling and hearing`);
        }
        const role = isChair ? "committee_chair" : isSponsor ? "sponsor" : isViceChair ? "committee_member" : isLeadership ? "leadership" : "committee_member";
        let recommendation = "";
        if (isChair && !isSponsor) {
          recommendation = `Schedule briefing with ${leg.name} \u2014 as chair of ${committee}, they control whether this bill gets a hearing. Focus on policy merits and constituent impact.`;
        } else if (isSponsor) {
          recommendation = `${leg.name} sponsors this bill \u2014 maintain relationship and offer support. Ask about co-sponsors they're recruiting.`;
        } else if (isViceChair) {
          recommendation = `Engage ${leg.name} as vice-chair \u2014 they influence committee agenda and can advocate for scheduling.`;
        } else {
          recommendation = `${leg.name} serves on ${committee}. ${engagement === 0 ? "Introduce our position and " : ""}Build support for committee vote.`;
        }
        if (!targets.some((t) => t.stakeholderId === leg.id)) {
          targets.push({
            stakeholderId: leg.id,
            name: leg.name,
            party: leg.party ?? "Unknown",
            chamber: leg.chamber ?? "Unknown",
            role,
            leverage,
            predictability: engagement >= 3 ? "high" : engagement >= 1 ? "medium" : "low",
            likelyStance,
            relevantCommittees: [committee],
            engagementDepth: engagement,
            recommendation,
            evidence
          });
        } else {
          const existing = targets.find((t) => t.stakeholderId === leg.id);
          existing.relevantCommittees.push(committee);
          existing.leverage = Math.min(100, existing.leverage + 5);
        }
      }
    }
    for (const sponsorName of bd.sponsorNames) {
      if (targets.some((t) => t.name === sponsorName)) continue;
      const leg = legislators.find((l) => l.name === sponsorName);
      if (!leg) continue;
      const engagement = engagementMap.get(leg.id) ?? 0;
      targets.push({
        stakeholderId: leg.id,
        name: leg.name,
        party: leg.party ?? "Unknown",
        chamber: leg.chamber ?? "Unknown",
        role: "sponsor",
        leverage: 30,
        predictability: engagement >= 3 ? "high" : engagement >= 1 ? "medium" : "low",
        likelyStance: "support",
        relevantCommittees: [],
        engagementDepth: engagement,
        recommendation: `${leg.name} sponsors ${billId}. Coordinate on advocacy strategy and identify additional co-sponsors.`,
        evidence: [`Named as sponsor in bill documentation`]
      });
    }
    targets.sort((a, b) => b.leverage - a.leverage);
    const stageProb = {
      enrolled: 0.95,
      passed_both: 0.9,
      passed_chamber: 0.6,
      conference: 0.65,
      reported: 0.45,
      hearing: 0.25,
      referred: 0.15,
      filed: 0.08,
      unknown: 0.1
    };
    const passageProbability = stageProb[stage] ?? 0.1;
    const engagedCount = targets.filter((t) => t.engagementDepth > 0).length;
    const totalLeverage = targets.reduce((s, t) => s + t.leverage, 0);
    for (const t of targets) {
      const key = `${t.stakeholderId}`;
      const existing = legislatorBillCounts.get(key) ?? {
        name: t.name,
        party: t.party,
        chamber: t.chamber,
        bills: /* @__PURE__ */ new Set(),
        totalLeverage: 0
      };
      existing.bills.add(billId);
      existing.totalLeverage += t.leverage;
      legislatorBillCounts.set(key, existing);
    }
    const topTargets = targets.slice(0, 3).map((t) => t.name).join(", ");
    const narrative = targets.length > 0 ? `${billId} (${stage}) has ${targets.length} identified influence targets. Top leverage: ${topTargets}. ${engagedCount > 0 ? `We've engaged ${engagedCount} of ${targets.length} targets.` : "No targets have been engaged yet \u2014 outreach gap."} ${committeePath.length > 0 ? `Bill path includes: ${committeePath.join(", ")}.` : ""}` : `${billId} (${stage}) \u2014 no specific influence targets identified. Consider expanding committee data.`;
    const recommendations = [];
    const chairTargets = targets.filter((t) => t.role === "committee_chair" && t.engagementDepth === 0);
    if (chairTargets.length > 0) {
      recommendations.push(`PRIORITY: Engage ${chairTargets.length} uncontacted committee chair${chairTargets.length !== 1 ? "s" : ""}: ${chairTargets.map((t) => t.name).join(", ")}`);
    }
    const unknownStance = targets.filter((t) => t.likelyStance === "unknown" && t.leverage >= 20);
    if (unknownStance.length > 0) {
      recommendations.push(`Research stance of ${unknownStance.length} high-leverage target${unknownStance.length !== 1 ? "s" : ""} with unknown position`);
    }
    if (engagedCount === 0 && targets.length > 0) {
      recommendations.push(`Begin outreach immediately \u2014 no influence targets engaged yet`);
    }
    maps.push({
      billId,
      title: bd.title,
      stage,
      committeePath,
      passageProbability,
      targets,
      totalLeverage,
      engagedCount,
      narrative,
      recommendations
    });
  }
  maps.sort((a, b) => {
    const aPriority = a.passageProbability * a.totalLeverage;
    const bPriority = b.passageProbability * b.totalLeverage;
    return bPriority - aPriority;
  });
  const pivotalLegislators = [...legislatorBillCounts.entries()].map(([, data]) => ({
    name: data.name,
    party: data.party,
    billCount: data.bills.size,
    avgLeverage: Math.round(data.totalLeverage / data.bills.size),
    billIds: [...data.bills]
  })).filter((p) => p.billCount >= 2).sort((a, b) => b.billCount - a.billCount || b.avgLeverage - a.avgLeverage).slice(0, 15);
  const outreachPlan = [...legislatorBillCounts.entries()].map(([, data]) => {
    const leg = legislators.find((l) => l.name === data.name);
    const engagement = leg ? engagementMap.get(leg.id) ?? 0 : 0;
    const engagementLevel = engagement >= 5 ? "high" : engagement >= 2 ? "moderate" : engagement >= 1 ? "low" : "none";
    return {
      name: data.name,
      party: data.party,
      chamber: data.chamber,
      billIds: [...data.bills],
      combinedLeverage: data.totalLeverage,
      currentEngagement: engagementLevel,
      priority: 0
    };
  }).sort((a, b) => {
    const aScore = a.combinedLeverage * (a.currentEngagement === "none" ? 2 : a.currentEngagement === "low" ? 1.5 : 1);
    const bScore = b.combinedLeverage * (b.currentEngagement === "none" ? 2 : b.currentEngagement === "low" ? 1.5 : 1);
    return bScore - aScore;
  }).slice(0, 20);
  outreachPlan.forEach((p, i) => {
    p.priority = i + 1;
  });
  const totalTargets = maps.reduce((s, m) => s + m.targets.length, 0);
  const engagementGaps = maps.reduce((s, m) => s + m.targets.filter((t) => t.engagementDepth === 0).length, 0);
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    maps,
    pivotalLegislators,
    outreachPlan,
    stats: {
      totalBillsAnalyzed: maps.length,
      totalTargetsIdentified: totalTargets,
      avgTargetsPerBill: maps.length > 0 ? Math.round(totalTargets / maps.length * 10) / 10 : 0,
      engagementGapCount: engagementGaps
    }
  };
}

// server/policy-intel/engine/intelligence/swarm-coordinator.ts
init_power_network_analyzer();
init_legislation_predictor();
init_logger();
var log6 = createLogger("intelligence");
function withAnalyzerFallback(name, runner, fallback, onFailure) {
  return runner().catch((error) => {
    log6.error({ analyzer: name, err: error }, "analyzer failed");
    onFailure?.();
    return fallback();
  });
}
function emptyVelocityReport() {
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    vectors: [],
    topMovers: [],
    emergingTopics: [],
    decayingTopics: []
  };
}
function emptyCorrelationReport() {
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    clusters: [],
    isolatedBills: [],
    totalBillsAnalyzed: 0
  };
}
function emptyInfluenceReport() {
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    profiles: [],
    powerBrokers: [],
    gatekeepers: [],
    wellConnected: [],
    underEngaged: []
  };
}
function emptyRiskReport() {
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    regime: "interim",
    assessments: [],
    criticalRisks: [],
    risingRisks: []
  };
}
function emptyAnomalyReport() {
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    anomalies: [],
    criticalCount: 0,
    highCount: 0,
    baselineWindow: "n/a"
  };
}
function emptyForecastReport(message) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    analyzedAt: now,
    currentSnapshot: {
      snapshotId: "unavailable",
      capturedAt: now,
      predictions: [],
      regime: "interim",
      totalInsights: 0,
      criticalRiskCount: 0,
      anomalyCount: 0
    },
    delta: {
      previousSnapshotId: null,
      previousCapturedAt: null,
      newRisks: [],
      resolvedRisks: [],
      escalatedRisks: [],
      deescalatedRisks: [],
      newAnomalies: 0,
      resolvedAnomalies: 0,
      newClusters: 0,
      threatTrend: "stable",
      narrative: message
    },
    grade: {
      windowStart: now,
      windowEnd: now,
      totalPredictions: 0,
      verifiablePredictions: 0,
      accuracy: {
        overall: 0,
        calibration: [],
        rankingAccuracy: 0
      },
      blindSpots: [],
      trendDirection: "insufficient_data",
      narrative: message
    },
    historyDepth: 0
  };
}
async function runSwarm() {
  const start2 = Date.now();
  let coreAnalyzerFailed = false;
  const [velocity, correlations, influence, risk, anomalies, sponsors, historical, legislators, influenceMap, powerNetwork, legislationPredictions2] = await Promise.all([
    withAnalyzerFallback("velocity-analyzer", analyzeVelocity, emptyVelocityReport, () => {
      coreAnalyzerFailed = true;
    }),
    withAnalyzerFallback("cross-correlator", analyzeCorrelations, emptyCorrelationReport, () => {
      coreAnalyzerFailed = true;
    }),
    withAnalyzerFallback("influence-ranker", analyzeInfluence, emptyInfluenceReport, () => {
      coreAnalyzerFailed = true;
    }),
    withAnalyzerFallback("risk-model", analyzeRisk, emptyRiskReport, () => {
      coreAnalyzerFailed = true;
    }),
    withAnalyzerFallback("anomaly-detector", detectAnomalies, emptyAnomalyReport, () => {
      coreAnalyzerFailed = true;
    }),
    withAnalyzerFallback("sponsor-network", analyzeSponsorNetwork, () => ({
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      billAnalyses: [],
      prolificSponsors: [],
      bipartisanBills: [],
      leadershipBacked: [],
      networkStats: { totalSponsors: 0, avgCoalitionSize: 0, bipartisanRate: 0, leadershipRate: 0 }
    })),
    withAnalyzerFallback("historical-patterns", analyzeHistoricalPatterns, () => ({
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalBillsAnalyzed: 0,
      sessionsAnalyzed: 0,
      committeeRates: [],
      billTypePatterns: [],
      sessionAnalyses: [],
      chamberPatterns: [],
      timingPatterns: [],
      keyFindings: [],
      overallPassageRate: 0
    })),
    withAnalyzerFallback("legislator-profiler", analyzeLegislatorProfiles, () => ({
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalLegislators: 0,
      totalBillsMatched: 0,
      profiles: [],
      keyPlayers: [],
      gatekeepers: [],
      bridgeBuilders: [],
      blindSpots: [],
      stats: { byParty: {}, byChamber: {}, avgPowerScore: 0, avgBillCount: 0, engagementBreakdown: { high: 0, moderate: 0, low: 0, none: 0 } }
    })),
    withAnalyzerFallback("influence-map", analyzeInfluenceMaps, () => ({
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      maps: [],
      pivotalLegislators: [],
      outreachPlan: [],
      stats: { totalBillsAnalyzed: 0, totalTargetsIdentified: 0, avgTargetsPerBill: 0, engagementGapCount: 0 }
    })),
    withAnalyzerFallback("power-network-analyzer", analyzeNetworkPower, () => ({
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      bigThree: [],
      votingBlocs: [],
      powerFlows: [],
      keyFindings: [],
      stats: {
        totalStakeholders: 0,
        totalCommitteeMembers: 0,
        totalChairs: 0,
        totalViceChairs: 0,
        chamberBreakdown: { house: 0, senate: 0 },
        partyBreakdown: { R: 0, D: 0, other: 0 },
        blocsDetected: 0,
        bipartisanBlocs: 0
      }
    })),
    withAnalyzerFallback("legislation-predictor", predictLegislation, () => ({
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      session: "89R",
      predictions: [],
      mostLikelyToPass: [],
      likelyBlocked: [],
      chamberConflicts: [],
      signals: [],
      stats: { totalPredictions: 0, highConfidence: 0, mediumConfidence: 0, lowConfidence: 0, avgPassageProbability: 0 }
    }))
  ]);
  const analysisTimeMs = Date.now() - start2;
  const predictions = risk.assessments.map((ra) => ({
    billId: ra.billId,
    predictedStage: ra.stage,
    predictedPassageProbability: ra.passageProbability,
    predictedRiskLevel: ra.riskLevel,
    riskScore: ra.riskScore
  }));
  let forecast;
  if (!coreAnalyzerFailed && predictions.length > 0) {
    forecast = await analyzeForecast(
      predictions,
      risk.regime,
      0,
      // insight count not yet known; updated on next run via snapshot
      risk.criticalRisks.length,
      anomalies.anomalies.length,
      correlations.clusters.length
    );
  } else {
    forecast = emptyForecastReport(
      "Forecast unavailable for this run because one or more core analyzers failed or returned no predictions."
    );
  }
  const insights = [];
  const surgingSubjects = new Set(
    velocity.topMovers.filter((v) => v.momentum === "surging").map((v) => v.subject.toLowerCase())
  );
  for (const ra of risk.criticalRisks) {
    const isSurging = surgingSubjects.has(ra.billId.toLowerCase()) || velocity.topMovers.some(
      (v) => v.momentum === "surging" && ra.title.toLowerCase().includes(v.subject.toLowerCase())
    );
    if (isSurging) {
      insights.push({
        priority: 1,
        category: "immediate_action",
        title: `${ra.billId} is critical AND accelerating`,
        narrative: `${ra.billId} (${ra.stage}) has a ${(ra.passageProbability * 100).toFixed(0)}% passage probability AND activity on related topics is surging. This combination demands immediate attention \u2014 the bill is moving fast through a favorable legislative environment. ${ra.recommendations[0] ?? ""}`,
        sources: ["risk-model", "velocity-analyzer"],
        confidence: Math.min(ra.confidence === "high" ? 0.9 : ra.confidence === "medium" ? 0.7 : 0.5, 1),
        relatedEntities: [{ type: "bill", id: ra.billId, label: ra.title }]
      });
    }
  }
  const powerBrokerNames = new Set(
    influence.powerBrokers.map((p) => p.name.toLowerCase())
  );
  for (const anomaly of anomalies.anomalies.filter((a) => a.severity === "critical" || a.severity === "high")) {
    const involvesPowerBroker = influence.powerBrokers.some(
      (pb) => anomaly.subject.toLowerCase().includes(pb.name.toLowerCase()) || anomaly.narrative.toLowerCase().includes(pb.name.toLowerCase())
    );
    if (involvesPowerBroker) {
      insights.push({
        priority: 1,
        category: "emerging_threat",
        title: `Anomalous activity involving key stakeholder`,
        narrative: `${anomaly.narrative} This is especially significant because it involves stakeholders with high influence scores in your network.`,
        sources: ["anomaly-detector", "influence-ranker"],
        confidence: 0.8
      });
    }
  }
  for (const cluster of correlations.clusters.filter((c) => c.significance === "critical" || c.significance === "high")) {
    const clusterBillIds = cluster.bills.map((b) => b.billId);
    const riskyBills = risk.assessments.filter(
      (ra) => clusterBillIds.includes(ra.billId) && (ra.riskLevel === "critical" || ra.riskLevel === "high")
    );
    if (riskyBills.length >= 2) {
      insights.push({
        priority: 2,
        category: "emerging_threat",
        title: `Bill cluster "${cluster.label}" contains ${riskyBills.length} high-risk bills`,
        narrative: `This cluster of ${cluster.bills.length} related bills includes ${riskyBills.length} that individually score as high or critical risk. Together they may represent a coordinated legislative push. Bills: ${riskyBills.map((b) => b.billId).join(", ")}. ${cluster.narrative}`,
        sources: ["cross-correlator", "risk-model"],
        confidence: 0.85,
        relatedEntities: riskyBills.map((b) => ({ type: "bill", id: b.billId, label: b.title }))
      });
    }
  }
  for (const mover of velocity.topMovers.filter((v) => v.momentum === "surging" || v.momentum === "heating")) {
    const hasRiskAssessment = risk.assessments.some(
      (ra) => ra.title.toLowerCase().includes(mover.subject.toLowerCase()) || ra.billId.toLowerCase().includes(mover.subject.toLowerCase())
    );
    if (!hasRiskAssessment && mover.significance > 0.5) {
      insights.push({
        priority: 2,
        category: "situational_awareness",
        title: `Rising activity on "${mover.subject}" \u2014 no risk assessment available`,
        narrative: `${mover.narrative} However, no bills from this topic have been risk-assessed yet. Consider whether new watchlist terms or manual review is needed to ensure coverage.`,
        sources: ["velocity-analyzer"],
        confidence: 0.6
      });
    }
  }
  for (const gk of influence.gatekeepers) {
    const isUnderEngaged = influence.underEngaged.some((u) => u.stakeholderId === gk.stakeholderId);
    if (isUnderEngaged) {
      insights.push({
        priority: 3,
        category: "opportunity",
        title: `Committee gatekeeper "${gk.name}" is under-engaged`,
        narrative: `${gk.name} holds a committee leadership position (influence score: ${gk.influenceScore}) but has low engagement in your system. Proactive outreach to this gatekeeper could create leverage on bills moving through their committee.`,
        sources: ["influence-ranker"],
        confidence: 0.7,
        relatedEntities: [{ type: "stakeholder", id: gk.stakeholderId, label: gk.name }]
      });
    }
  }
  for (const anomaly of anomalies.anomalies.filter((a) => a.severity === "critical")) {
    const duplicate = insights.some(
      (i) => i.title.toLowerCase().includes(anomaly.subject.toLowerCase())
    );
    if (!duplicate) {
      insights.push({
        priority: 2,
        category: "emerging_threat",
        title: `Anomaly: ${anomaly.type.replace(/_/g, " ")} \u2014 ${anomaly.subject}`,
        narrative: anomaly.narrative,
        sources: ["anomaly-detector"],
        confidence: 0.75
      });
    }
  }
  for (const decaying of velocity.decayingTopics) {
    const wasRisky = risk.assessments.some(
      (ra) => (ra.riskLevel === "critical" || ra.riskLevel === "high") && (ra.title.toLowerCase().includes(decaying.subject.toLowerCase()) || ra.billId.toLowerCase().includes(decaying.subject.toLowerCase()))
    );
    if (wasRisky) {
      insights.push({
        priority: 3,
        category: "situational_awareness",
        title: `Previously critical topic "${decaying.subject}" is losing momentum`,
        narrative: `${decaying.narrative} This topic was previously assessed as high or critical risk. The declining activity may signal that the legislative push is stalling \u2014 but confirm before deprioritizing.`,
        sources: ["velocity-analyzer", "risk-model"],
        confidence: 0.65
      });
    }
  }
  const ghostBills = anomalies.anomalies.filter((a) => a.type === "ghost_bill");
  for (const ghost of ghostBills) {
    const inCluster = correlations.clusters.some(
      (c) => c.bills.some((b) => b.billId === ghost.subject)
    );
    if (inCluster) {
      insights.push({
        priority: 1,
        category: "emerging_threat",
        title: `Ghost bill ${ghost.subject} found inside a related bill cluster`,
        narrative: `${ghost.narrative} Additionally, this bill appears in a cluster of related legislation \u2014 it's connected to bills you ARE tracking but slipped through monitoring. This is a high-priority coverage gap.`,
        sources: ["anomaly-detector", "cross-correlator"],
        confidence: 0.85,
        relatedEntities: [{ type: "bill", id: ghost.subject, label: ghost.subject }]
      });
    }
  }
  for (const bpBill of sponsors.bipartisanBills) {
    const isSurging = velocity.topMovers.some(
      (v) => v.momentum === "surging" && (bpBill.billId.toLowerCase().includes(v.subject.toLowerCase()) || bpBill.title.toLowerCase().includes(v.subject.toLowerCase()))
    );
    if (isSurging) {
      insights.push({
        priority: 1,
        category: "immediate_action",
        title: `Bipartisan bill ${bpBill.billId} is accelerating`,
        narrative: `${bpBill.billId} has bipartisan support (${bpBill.coalition.parties.join("/")} coalition of ${bpBill.coalition.size}) AND its topic is surging. Bipartisan bills with momentum have the highest passage probability \u2014 this demands immediate strategic positioning.`,
        sources: ["sponsor-network", "velocity-analyzer"],
        confidence: 0.9,
        relatedEntities: [{ type: "bill", id: bpBill.billId, label: bpBill.title }]
      });
    }
  }
  for (const lbBill of sponsors.leadershipBacked) {
    const riskAssessment = risk.assessments.find((ra) => ra.billId === lbBill.billId);
    if (riskAssessment && (riskAssessment.riskLevel === "critical" || riskAssessment.riskLevel === "high")) {
      insights.push({
        priority: 1,
        category: "emerging_threat",
        title: `Leadership-backed ${lbBill.billId} at ${riskAssessment.riskLevel} risk`,
        narrative: `${lbBill.billId} has chamber leadership sponsorship (coalition power: ${lbBill.coalition.coalitionPower}) and scores ${riskAssessment.riskLevel} risk with ${(riskAssessment.passageProbability * 100).toFixed(0)}% passage probability. Leadership-backed bills are structurally favored \u2014 the passage probability here may be conservative.`,
        sources: ["sponsor-network", "risk-model"],
        confidence: 0.88,
        relatedEntities: [{ type: "bill", id: lbBill.billId, label: lbBill.title }]
      });
    }
  }
  for (const sp of sponsors.prolificSponsors) {
    if (sp.billCount >= 3) {
      const riskyBills = sp.billIds.filter(
        (bid) => risk.assessments.some((ra) => ra.billId === bid && (ra.riskLevel === "critical" || ra.riskLevel === "high"))
      );
      if (riskyBills.length >= 2) {
        insights.push({
          priority: 2,
          category: "strategic_recommendation",
          title: `${sp.name} sponsors ${riskyBills.length} high-risk bills`,
          narrative: `${sp.name} (${sp.party}) sponsors ${sp.billCount} bills total, of which ${riskyBills.length} are assessed as high/critical risk. This legislator is a key actor \u2014 engagement strategy should prioritize understanding their legislative agenda. ${sp.isLeadership ? "ALERT: This sponsor holds a leadership position." : ""}`,
          sources: ["sponsor-network", "risk-model"],
          confidence: 0.8,
          relatedEntities: [{ type: "stakeholder", id: sp.stakeholderId, label: sp.name }]
        });
      }
    }
  }
  const velocityAnomalies = anomalies.anomalies.filter((a) => a.type === "velocity_anomaly");
  for (const va of velocityAnomalies) {
    const matchingRisk = risk.assessments.find(
      (ra) => va.subject.toLowerCase().includes(ra.billId.toLowerCase()) || ra.title.toLowerCase().includes(va.subject.toLowerCase())
    );
    if (matchingRisk && (matchingRisk.riskLevel === "critical" || matchingRisk.riskLevel === "high")) {
      insights.push({
        priority: 1,
        category: "immediate_action",
        title: `Silence-then-burst on ${matchingRisk.riskLevel}-risk topic`,
        narrative: `${va.narrative} This watchlist covers a ${matchingRisk.riskLevel}-risk area. After weeks of silence, the sudden burst may indicate behind-the-scenes negotiations have concluded and legislative action is imminent.`,
        sources: ["anomaly-detector", "risk-model"],
        confidence: 0.82
      });
    }
  }
  if (forecast && forecast.grade.trendDirection === "degrading") {
    insights.push({
      priority: 3,
      category: "strategic_recommendation",
      title: "Intelligence model accuracy is declining",
      narrative: `${forecast.grade.narrative} The system's predictions are becoming less reliable. Consider reviewing watchlist configurations and scoring weights \u2014 the legislative landscape may have shifted in ways the model hasn't adapted to yet.`,
      sources: ["forecast-tracker"],
      confidence: 0.9
    });
  }
  if (forecast) {
    for (const bs of forecast.grade.blindSpots) {
      if (bs.missCount >= 2) {
        insights.push({
          priority: 3,
          category: "situational_awareness",
          title: `Forecast blind spot: ${bs.category}`,
          narrative: `The system has missed ${bs.missCount} predictions in the "${bs.category}" category. ${bs.description} Examples: ${bs.examples.slice(0, 3).join(", ")}.`,
          sources: ["forecast-tracker"],
          confidence: 0.7
        });
      }
    }
  }
  if (historical.committeeRates.length > 0) {
    for (const ra of risk.assessments.filter((r) => r.riskLevel === "critical" || r.riskLevel === "high")) {
      const matchedCommittee = historical.committeeRates.find(
        (cr) => ra.narrative.toLowerCase().includes(cr.committee.toLowerCase()) || ra.title.toLowerCase().includes(cr.committee.toLowerCase())
      );
      if (matchedCommittee && matchedCommittee.passageRate > 0.5) {
        insights.push({
          priority: 1,
          category: "immediate_action",
          title: `${ra.billId} in high-passage committee (${(matchedCommittee.passageRate * 100).toFixed(0)}% historical)`,
          narrative: `${ra.billId} is in ${matchedCommittee.committee}, which historically passes ${(matchedCommittee.passageRate * 100).toFixed(1)}% of referred bills (${matchedCommittee.passedBills}/${matchedCommittee.totalBills} across ${matchedCommittee.sessionTrends.length} sessions). Combined with its ${ra.riskLevel} risk rating, this bill has structurally favorable odds.`,
          sources: ["historical-patterns", "risk-model"],
          confidence: 0.85,
          relatedEntities: [{ type: "bill", id: ra.billId, label: ra.title }]
        });
      }
    }
  }
  for (const finding of historical.keyFindings.slice(0, 3)) {
    insights.push({
      priority: 4,
      category: "situational_awareness",
      title: "Historical pattern insight",
      narrative: finding,
      sources: ["historical-patterns"],
      confidence: 0.9
    });
  }
  for (const bs of legislators.blindSpots.slice(0, 3)) {
    insights.push({
      priority: 3,
      category: "opportunity",
      title: `Unengaged power player: ${bs.name}`,
      narrative: `${bs.name} (${bs.party}, ${bs.chamber}) has a power score of ${bs.powerScore} with ${bs.committees.filter((c) => c.role === "chair").length} chair position(s), but zero engagement records in our system. ${bs.sponsorship.watchlistOverlap > 0 ? `They are linked to ${bs.sponsorship.watchlistOverlap} watchlist bill(s) \u2014 this is a critical outreach gap.` : "They may influence bills in our tracked areas."}`,
      sources: ["legislator-profiler"],
      confidence: 0.8,
      relatedEntities: [{ type: "stakeholder", id: bs.stakeholderId, label: bs.name }]
    });
  }
  for (const bb of legislators.bridgeBuilders.slice(0, 2)) {
    const crossPartyAllies = bb.allies.filter((a) => a.isCrossParty);
    if (crossPartyAllies.length > 0) {
      insights.push({
        priority: 3,
        category: "strategic_recommendation",
        title: `Bipartisan bridge: ${bb.name}`,
        narrative: `${bb.name} (${bb.party}) frequently collaborates across party lines with ${crossPartyAllies.map((a) => a.name).slice(0, 3).join(", ")}. On ${bb.sponsorship.totalBills} bill(s), they demonstrate bipartisan reach. Consider leveraging this for bills needing cross-party support.`,
        sources: ["legislator-profiler"],
        confidence: 0.75,
        relatedEntities: [{ type: "stakeholder", id: bb.stakeholderId, label: bb.name }]
      });
    }
  }
  const unengagedMaps = influenceMap.maps.filter((m) => m.engagedCount === 0 && m.targets.length > 0);
  if (unengagedMaps.length > 0) {
    const topGap = unengagedMaps[0];
    insights.push({
      priority: 2,
      category: "strategic_recommendation",
      title: `Outreach gap: ${topGap.billId} has ${topGap.targets.length} uncontacted targets`,
      narrative: `${topGap.billId} (${topGap.stage}, ${(topGap.passageProbability * 100).toFixed(0)}% passage est.) has ${topGap.targets.length} identified influence targets but NONE have been engaged. Top leverage: ${topGap.targets.slice(0, 3).map((t) => `${t.name} (${t.leverage}pts)`).join(", ")}. ${topGap.recommendations[0] ?? ""}`,
      sources: ["influence-map"],
      confidence: 0.82,
      relatedEntities: [{ type: "bill", id: topGap.billId, label: topGap.title }]
    });
  }
  for (const pivotal of influenceMap.pivotalLegislators.slice(0, 2)) {
    if (pivotal.billCount >= 3) {
      insights.push({
        priority: 2,
        category: "strategic_recommendation",
        title: `Pivotal legislator: ${pivotal.name} influences ${pivotal.billCount} bills`,
        narrative: `${pivotal.name} (${pivotal.party}) appears as an influence target across ${pivotal.billCount} tracked bills (avg leverage: ${pivotal.avgLeverage}). Engaging this single legislator could impact: ${pivotal.billIds.slice(0, 5).join(", ")}. This is a high-efficiency outreach opportunity.`,
        sources: ["influence-map"],
        confidence: 0.8,
        relatedEntities: [{ type: "stakeholder", id: pivotal.name, label: pivotal.name }]
      });
    }
  }
  for (const prediction of legislationPredictions2.mostLikelyToPass.slice(0, 3)) {
    const allSupport = prediction.powerCenterDynamic.governor === "support" && prediction.powerCenterDynamic.ltGov === "support" && prediction.powerCenterDynamic.speaker === "support";
    if (allSupport && prediction.confidence >= 0.7) {
      insights.push({
        priority: 1,
        category: "immediate_action",
        title: `Big Three aligned on "${prediction.topic}"`,
        narrative: `${prediction.assessment} Predicted sponsor: ${prediction.likelySponsor?.name ?? "TBD"} (${prediction.predictedBillType}). Passage probability: ${(prediction.passageProbability * 100).toFixed(0)}%. All three power centers support this \u2014 legislation is virtually certain.`,
        sources: ["power-network", "legislation-predictor"],
        confidence: prediction.confidence
      });
    }
  }
  for (const bloc of powerNetwork.votingBlocs.filter((b) => b.bipartisan && b.members.length >= 4)) {
    insights.push({
      priority: 2,
      category: "strategic_recommendation",
      title: `Bipartisan bloc: "${bloc.name}" (${bloc.members.length} members)`,
      narrative: `${bloc.narrative} This cross-party coalition could be decisive on close votes. Key issues: ${bloc.issueAreas.slice(0, 3).join(", ")}.`,
      sources: ["power-network"],
      confidence: 0.75
    });
  }
  for (const prediction of legislationPredictions2.likelyBlocked.slice(0, 2)) {
    if (prediction.powerCenterDynamic.governor === "oppose") {
      insights.push({
        priority: 2,
        category: "emerging_threat",
        title: `Governor veto risk: "${prediction.topic}"`,
        narrative: `${prediction.assessment} Despite legislative momentum, gubernatorial opposition creates a significant veto barrier. Supporters will need a 2/3 override strategy or must negotiate acceptable amendments.`,
        sources: ["legislation-predictor"],
        confidence: prediction.confidence
      });
    }
  }
  for (const finding of powerNetwork.keyFindings.slice(0, 2)) {
    insights.push({
      priority: 3,
      category: "situational_awareness",
      title: "Power structure insight",
      narrative: finding,
      sources: ["power-network"],
      confidence: 0.85
    });
  }
  insights.sort((a, b) => a.priority - b.priority);
  const criticalBills = risk.criticalRisks.length;
  const surgingTopics = velocity.topMovers.filter((v) => v.momentum === "surging").length;
  const criticalAnomalies = anomalies.criticalCount;
  const p1Insights = insights.filter((i) => i.priority === 1).length;
  const bipartisanCount = sponsors.bipartisanBills.length;
  const summaryParts = [];
  if (p1Insights > 0) {
    summaryParts.push(`${p1Insights} situation${p1Insights !== 1 ? "s" : ""} requiring immediate attention`);
  }
  if (criticalBills > 0) {
    summaryParts.push(`${criticalBills} bill${criticalBills !== 1 ? "s" : ""} at critical risk of passage`);
  }
  if (surgingTopics > 0) {
    summaryParts.push(`${surgingTopics} topic${surgingTopics !== 1 ? "s" : ""} with surging activity`);
  }
  if (criticalAnomalies > 0) {
    summaryParts.push(`${criticalAnomalies} critical anomal${criticalAnomalies !== 1 ? "ies" : "y"} detected`);
  }
  if (bipartisanCount > 0) {
    summaryParts.push(`${bipartisanCount} bipartisan bill${bipartisanCount !== 1 ? "s" : ""} identified`);
  }
  if (powerNetwork.votingBlocs.length > 0) {
    summaryParts.push(`${powerNetwork.votingBlocs.length} voting bloc${powerNetwork.votingBlocs.length !== 1 ? "s" : ""} mapped`);
  }
  if (legislationPredictions2.predictions.length > 0) {
    summaryParts.push(`${legislationPredictions2.predictions.length} legislation prediction${legislationPredictions2.predictions.length !== 1 ? "s" : ""} generated`);
  }
  const modelStatus = forecast?.grade.trendDirection === "degrading" ? " \u26A0 Model accuracy declining." : "";
  const executiveSummary = summaryParts.length > 0 ? `Intelligence briefing identified ${summaryParts.join(", ")}. The legislative landscape is ${risk.regime === "floor_action" || risk.regime === "sine_die" ? "in a high-activity phase" : "in a " + risk.regime.replace(/_/g, " ") + " phase"}. ${insights.length} total strategic insight${insights.length !== 1 ? "s" : ""} generated from cross-referencing ${velocity.vectors.length} velocity vectors, ${correlations.clusters.length} bill clusters, ${influence.profiles.length} stakeholder profiles, ${risk.assessments.length} risk assessments, ${sponsors.networkStats.totalSponsors} sponsor profiles, ${legislators.totalLegislators} legislator intelligence profiles, ${influenceMap.maps.length} bill influence maps, ${powerNetwork.votingBlocs.length} voting blocs, ${legislationPredictions2.predictions.length} legislation predictions, and ${anomalies.anomalies.length} anomaly detections in ${analysisTimeMs}ms.${modelStatus}` : `No critical situations detected. The legislative landscape is in a ${risk.regime.replace(/_/g, " ")} phase. System monitoring ${velocity.vectors.length} activity vectors across ${risk.assessments.length} assessed bills. Sponsor network tracking ${sponsors.networkStats.totalSponsors} legislators. ${legislators.totalLegislators} legislator profiles generated. Power network: ${powerNetwork.votingBlocs.length} voting blocs, ${legislationPredictions2.predictions.length} predictions. Analysis completed in ${analysisTimeMs}ms.${modelStatus}`;
  const insightCounts = {};
  for (const ins of insights) {
    insightCounts[ins.category] = (insightCounts[ins.category] ?? 0) + 1;
  }
  const delta = forecast?.delta ?? {
    previousSnapshotId: null,
    previousCapturedAt: null,
    newRisks: [],
    resolvedRisks: [],
    escalatedRisks: [],
    deescalatedRisks: [],
    newAnomalies: 0,
    resolvedAnomalies: 0,
    newClusters: 0,
    threatTrend: "stable",
    narrative: "First briefing \u2014 no comparison available yet. Future briefings will track changes automatically."
  };
  const correlationsForResponse = {
    ...correlations,
    isolatedBills: [],
    isolatedBillCount: correlations.isolatedBillCount ?? correlations.isolatedBills.length
  };
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    executiveSummary,
    insights,
    insightCounts,
    velocity,
    correlations: correlationsForResponse,
    influence,
    risk,
    anomalies,
    sponsors,
    historical,
    legislators,
    influenceMap,
    powerNetwork,
    legislationPredictions: legislationPredictions2,
    forecast: forecast ?? {
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      currentSnapshot: { snapshotId: "", capturedAt: "", predictions: [], regime: risk.regime, totalInsights: 0, criticalRiskCount: 0, anomalyCount: 0 },
      delta,
      grade: { windowStart: "", windowEnd: "", totalPredictions: 0, verifiablePredictions: 0, accuracy: { overall: 0, calibration: [], rankingAccuracy: 0 }, blindSpots: [], trendDirection: "insufficient_data", narrative: "Forecast system initializing." },
      historyDepth: 0
    },
    delta,
    analysisTimeMs
  };
}

// server/policy-intel/services/committee-intel-service.ts
init_db();
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { and as and11, asc, desc as desc13, eq as eq19, gte as gte9, ilike as ilike5, inArray as inArray3, or } from "drizzle-orm";
import * as cheerio6 from "cheerio";
init_schema_policy_intel();
var ISSUE_CATALOG = [
  {
    tag: "critical_infrastructure",
    label: "Critical Infrastructure",
    patterns: [/\bcritical infrastructure\b/i, /\bgrid security\b/i, /\binfrastructure security\b/i, /\bsecure the grid\b/i]
  },
  {
    tag: "supply_chain_integrity",
    label: "Supply Chain Integrity",
    patterns: [/\bsupply chain\b/i, /\bprocurement\b/i, /\bvendor risk\b/i, /\bmanufactur/i]
  },
  {
    tag: "foreign_entity_risk",
    label: "Foreign Entity Risk",
    patterns: [/\bchina\b/i, /\brussia\b/i, /\biran\b/i, /\bforeign entit(y|ies)\b/i, /\bhostile foreign\b/i]
  },
  {
    tag: "utility_regulation",
    label: "Utility Regulation",
    patterns: [/\bercot\b/i, /\bpuct\b/i, /\bpublic utility commission\b/i, /\bpublic utility counsel\b/i, /\btransmission\b/i]
  },
  {
    tag: "grid_reliability",
    label: "Grid Reliability",
    patterns: [/\breliab/i, /\boutage\b/i, /\bblackout\b/i, /\bresilien/i, /\bgeneration\b/i]
  },
  {
    tag: "ratepayer_impact",
    label: "Ratepayer Impact",
    patterns: [/\bratepayer/i, /\baffordab/i, /\brate(s)?\b/i, /\bcost(s)?\b/i, /\bprice(s)?\b/i]
  },
  {
    tag: "witness_process",
    label: "Witness Process",
    patterns: [/\binvited testimony\b/i, /\bpublic testimony\b/i, /\bwitness(es)?\b/i, /\bpublic comment\b/i]
  }
];
var AGENCY_HINTS = ["commission", "council", "office", "department", "agency", "authority", "ercot", "utility"];
var ORGANIZATION_HINTS = ["association", "alliance", "coalition", "chamber", "company", "corp", "foundation", "group", "llc", "inc", "union"];
var TEXAS_CAPITOL_TIME_ZONE = "America/Chicago";
var OFFICIAL_TRANSCRIPTION_CLIP_SECONDS = 150;
var OFFICIAL_TRANSCRIPTION_OVERLAP_SECONDS = 8;
var OFFICIAL_TRANSCRIPTION_TIMEOUT_MS = 12e4;
var FFMPEG_BINARY = process.env.FFMPEG_PATH?.trim() || "ffmpeg";
var execFileAsync = promisify(execFile);
var NON_SPEECH_TRANSCRIPT_PATTERNS = [
  /^\[(?:music|applause|laughter|inaudible|silence|noise|crosstalk|cross talk|background noise|gavel|off mic|off-mic|unintelligible)[^\]]*\]$/i,
  /^\((?:music|applause|laughter|inaudible|silence|noise|crosstalk|cross talk|background noise|gavel|off mic|off-mic|unintelligible)[^\)]*\)$/i,
  /^(?:music|applause|laughter|inaudible|silence|noise|crosstalk|cross talk|background noise|gavel|off mic|off-mic|unintelligible)\.?$/i
];
var SPEAKER_ROLE_VALUES = [
  "chair",
  "member",
  "staff",
  "agency",
  "invited_witness",
  "public_witness",
  "moderator",
  "unknown"
];
function hashValue(value) {
  return createHash("sha1").update(value).digest("hex");
}
function getMetadataRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function buildTranscriptFeedIdentityKey(sessionId, sourceType, cursorValue, sourceId) {
  const normalizedSourceType = sourceType?.trim().toLowerCase() || null;
  if (!normalizedSourceType || normalizedSourceType === "manual") return null;
  const normalizedCursor = cursorValue?.trim() || "";
  const normalizedSourceId = sourceId === null || sourceId === void 0 ? "" : String(sourceId).trim();
  if (!normalizedCursor && !normalizedSourceId) return null;
  return [sessionId, normalizedSourceType, normalizedSourceId, normalizedCursor].join("|");
}
function cleanUrl(value) {
  const next = value?.trim();
  return next ? next : null;
}
function resolveCandidateTranscriptSourceUrl(sourceType, transcriptSourceUrl, videoUrl) {
  const explicit = cleanUrl(transcriptSourceUrl);
  if (explicit) return explicit;
  if (sourceType !== "manual") {
    const fallback = cleanUrl(videoUrl);
    if (fallback && /^(data:|https?:)/i.test(fallback) && /\.(vtt|json|txt)(\?.*)?$/i.test(fallback)) {
      return fallback;
    }
  }
  return null;
}
function resolveTranscriptSourceUrl(session) {
  return resolveCandidateTranscriptSourceUrl(session.transcriptSourceType, session.transcriptSourceUrl, session.videoUrl);
}
function resolveAutoIngestStatus(sourceType, sourceUrl, autoIngestEnabled, current) {
  if (!autoIngestEnabled) return "idle";
  if (sourceType === "manual") return current === "error" ? "error" : "idle";
  if (sourceType === "official") return current === "error" ? "error" : "ready";
  if (!sourceUrl) return current === "error" ? "error" : "idle";
  return current === "error" ? "error" : "ready";
}
function parseTimestampToSeconds(value) {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[\.,](\d{1,3}))?$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const milliseconds = Number((match[4] ?? "0").padEnd(3, "0"));
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1e3;
}
function buildCapturedAtFromOffset(session, startedAtSecond, fallbackIndex) {
  const base = toDate(session.hearingDate) ?? /* @__PURE__ */ new Date();
  const offset = startedAtSecond ?? fallbackIndex * 30;
  return new Date(base.getTime() + Math.max(offset, 0) * 1e3).toISOString();
}
function normaliseSpeakerFromText(transcriptText) {
  const cleaned = transcriptText.replace(/^>>\s*/, "").trim();
  const patterns = [
    /^([^:(\-—]{2,120}?)(?:\s+\(([^)]+)\))?\s*[:\-—]\s+(.+)$/s,
    /^([^:(]{2,120}?)(?:\s+\(([^)]+)\))?:\s+(.+)$/s
  ];
  const match = patterns.map((pattern) => cleaned.match(pattern)).find((candidate) => Boolean(candidate));
  if (!match) {
    return {
      speakerName: null,
      affiliation: null,
      transcriptText: cleaned
    };
  }
  const rawSpeakerName = match[1]?.trim() || null;
  const speakerName = isLikelySpeakerLabel(rawSpeakerName) ? rawSpeakerName : null;
  const affiliation = match[2]?.trim() || null;
  const nextText = match[3]?.trim() || cleaned;
  if (!speakerName) {
    return {
      speakerName: null,
      affiliation: null,
      transcriptText: cleaned
    };
  }
  return {
    speakerName,
    affiliation,
    transcriptText: nextText
  };
}
function isLikelySpeakerLabel(value) {
  const label = value?.trim() ?? "";
  if (!label || label.length < 2 || label.length > 80) return false;
  if (!/[A-Za-z]/.test(label)) return false;
  if (/[.!?]/.test(label)) return false;
  if (/\d{1,2}:\d{2}/.test(label)) return false;
  if (/^(agenda|item|today|thank you|thanks|question|answer)$/i.test(label)) return false;
  const tokenCount = label.split(/\s+/).length;
  return tokenCount <= 8;
}
function decodeBasicHtmlEntities(value) {
  return value.replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&nbsp;/gi, " ");
}
function cleanTranscriptText(value) {
  const cleaned = decodeBasicHtmlEntities(
    value.replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, " ").replace(/<\/?c(?:\.[^>]+)?>/gi, " ").replace(/<\/?(?:i|b|u|v|ruby|rt|lang)[^>]*>/gi, " ").replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  const normalized = cleaned.replace(/[.!?]+$/g, "").trim();
  if (!normalized) return null;
  if (NON_SPEECH_TRANSCRIPT_PATTERNS.some((pattern) => pattern.test(cleaned) || pattern.test(normalized))) {
    return null;
  }
  return cleaned;
}
function normalizeSpeakerRole(value) {
  if (typeof value !== "string") return void 0;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return void 0;
  if (SPEAKER_ROLE_VALUES.includes(normalized)) {
    return normalized;
  }
  if (/chair/.test(normalized)) return "chair";
  if (/(member|senator|representative|legislator|committee member)/.test(normalized)) return "member";
  if (/staff/.test(normalized)) return "staff";
  if (/(agency|commission|department|director|commissioner)/.test(normalized)) return "agency";
  if (/invited/.test(normalized)) return "invited_witness";
  if (/(public witness|public testimony|public)/.test(normalized)) return "public_witness";
  if (/(moderator|host|facilitator)/.test(normalized)) return "moderator";
  if (/witness/.test(normalized)) return "public_witness";
  return void 0;
}
function buildTranscriptExternalKey(parts) {
  return hashValue(parts.map((part) => String(part ?? "")).join("|"));
}
function buildFeedEntry(session, index2, value) {
  const cleanedInputText = cleanTranscriptText(value.transcriptText);
  if (!cleanedInputText) return null;
  const metadata = getMetadataRecord(value.metadata);
  const sourceType = typeof metadata.sourceType === "string" ? metadata.sourceType : null;
  const sourceId = typeof metadata.sourceId === "string" || typeof metadata.sourceId === "number" ? metadata.sourceId : null;
  const normalizedSpeaker = normaliseSpeakerFromText(cleanedInputText);
  const speakerName = value.speakerName?.trim() || normalizedSpeaker.speakerName;
  const affiliation = value.affiliation?.trim() || normalizedSpeaker.affiliation;
  const candidateText = speakerName || affiliation ? normalizedSpeaker.transcriptText : cleanedInputText;
  const transcriptText = cleanTranscriptText(candidateText);
  if (!transcriptText) return null;
  const startedAtSecond = value.startedAtSecond ?? null;
  const endedAtSecond = value.endedAtSecond ?? null;
  const capturedAt = value.capturedAt ?? buildCapturedAtFromOffset(session, startedAtSecond, index2);
  const cursorValue = value.cursorValue ?? String(startedAtSecond ?? index2);
  const dedupKey = buildTranscriptFeedIdentityKey(session.id, sourceType, cursorValue, sourceId);
  const externalKey = buildTranscriptExternalKey([
    session.id,
    cursorValue,
    startedAtSecond,
    endedAtSecond,
    speakerName,
    affiliation,
    transcriptText
  ]);
  return {
    externalKey,
    cursorValue,
    capturedAt,
    startedAtSecond,
    endedAtSecond,
    speakerName,
    speakerRole: value.speakerRole,
    affiliation,
    transcriptText,
    invited: value.invited ?? false,
    metadata: {
      ...metadata,
      externalKey,
      dedupKey,
      feedCursor: cursorValue
    }
  };
}
function buildFeedEntryDedupKey(sessionId, entry) {
  const metadata = getMetadataRecord(entry.metadata);
  const storedKey = typeof metadata.dedupKey === "string" ? metadata.dedupKey.trim() : "";
  if (storedKey) return storedKey;
  return buildTranscriptFeedIdentityKey(
    sessionId,
    typeof metadata.sourceType === "string" ? metadata.sourceType : null,
    entry.cursorValue,
    typeof metadata.sourceId === "string" || typeof metadata.sourceId === "number" ? metadata.sourceId : null
  ) ?? entry.externalKey;
}
function parseWebVttFeed(content, session) {
  const cues = [];
  const blocks = content.replace(/^WEBVTT\s*/i, "").split(/\r?\n\r?\n/).map((block) => block.trim()).filter(Boolean);
  let cueIndex = 0;
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) continue;
    const timeLine = lines[timeLineIndex];
    const [rawStart, rawEnd] = timeLine.split("-->").map((part) => part.trim());
    const startedAtSecond = parseTimestampToSeconds(rawStart);
    const endedAtSecond = parseTimestampToSeconds(rawEnd);
    const textLines = lines.slice(timeLineIndex + 1).filter((line) => !line.startsWith("NOTE"));
    const entry = buildFeedEntry(session, cueIndex, {
      cursorValue: `${cueIndex}:${rawStart}`,
      startedAtSecond: startedAtSecond === null ? null : Math.floor(startedAtSecond),
      endedAtSecond: endedAtSecond === null ? null : Math.floor(endedAtSecond),
      transcriptText: textLines.join(" "),
      metadata: {
        sourceType: "webvtt"
      }
    });
    if (entry) cues.push(entry);
    cueIndex += 1;
  }
  return cues;
}
function findJsonTranscriptArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "object" && item !== null);
  }
  if (!value || typeof value !== "object") return [];
  const record = value;
  for (const key of ["segments", "items", "entries", "cues", "transcript", "data"]) {
    const next = record[key];
    if (Array.isArray(next)) {
      return next.filter((item) => typeof item === "object" && item !== null);
    }
  }
  return [];
}
function parseJsonFeed(content, session) {
  const parsed = JSON.parse(content);
  const items = findJsonTranscriptArray(parsed);
  return items.map((item, index2) => {
    const transcriptText = String(item.text ?? item.content ?? item.body ?? item.transcript ?? "").trim();
    const startedAtSecond = item.start === void 0 ? item.startTime : item.start;
    const endedAtSecond = item.end === void 0 ? item.endTime : item.end;
    const capturedAt = item.capturedAt ?? item.timestamp ?? item.createdAt ?? null;
    const entry = buildFeedEntry(session, index2, {
      cursorValue: String(item.id ?? item.sequence ?? item.index ?? startedAtSecond ?? index2),
      capturedAt: typeof capturedAt === "string" ? capturedAt : null,
      startedAtSecond: typeof startedAtSecond === "number" ? startedAtSecond : parseTimestampToSeconds(String(startedAtSecond ?? "")),
      endedAtSecond: typeof endedAtSecond === "number" ? endedAtSecond : parseTimestampToSeconds(String(endedAtSecond ?? "")),
      speakerName: typeof item.speaker === "string" ? item.speaker : typeof item.name === "string" ? item.name : null,
      speakerRole: normalizeSpeakerRole(item.role),
      affiliation: typeof item.affiliation === "string" ? item.affiliation : typeof item.organization === "string" ? item.organization : null,
      transcriptText,
      invited: Boolean(item.invited),
      metadata: {
        sourceType: "json",
        sourceId: item.id ?? null
      }
    });
    return entry;
  }).filter((entry) => Boolean(entry));
}
function parseTextFeed(content, session) {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.map((line, index2) => {
    const timestampMatch = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?(?:[\.,]\d{1,3})?)\]?\s+(.*)$/);
    const startedAtSecond = timestampMatch ? parseTimestampToSeconds(timestampMatch[1]) : null;
    const transcriptText = timestampMatch ? timestampMatch[2] : line;
    return buildFeedEntry(session, index2, {
      cursorValue: String(index2),
      startedAtSecond: startedAtSecond === null ? null : Math.floor(startedAtSecond),
      transcriptText,
      metadata: {
        sourceType: "text"
      }
    });
  }).filter((entry) => Boolean(entry));
}
function parseTranscriptFeed(content, sourceType, session) {
  if (sourceType === "webvtt") return parseWebVttFeed(content, session);
  if (sourceType === "json") return parseJsonFeed(content, session);
  if (sourceType === "text") return parseTextFeed(content, session);
  return [];
}
function inferTranscriptFeedTypeFromUrl(value) {
  const cleaned = cleanUrl(value);
  if (!cleaned) return null;
  if (/\.vtt(\?.*)?$/i.test(cleaned)) return "webvtt";
  if (/\.json(\?.*)?$/i.test(cleaned)) return "json";
  if (/\.txt(\?.*)?$/i.test(cleaned)) return "text";
  return null;
}
function formatTexasDateKey(value) {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TEXAS_CAPITOL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
function parseUsDateToKey(value) {
  if (!value) return null;
  const match = value.trim().match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2e3 + rawYear : rawYear;
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return Number.isNaN(date.getTime()) ? null : formatTexasDateKey(date);
}
function dayDifferenceFromDateKeys(left, right) {
  if (!left || !right) return Number.POSITIVE_INFINITY;
  const leftDate = /* @__PURE__ */ new Date(`${left}T12:00:00Z`);
  const rightDate = /* @__PURE__ */ new Date(`${right}T12:00:00Z`);
  return Math.round(Math.abs(leftDate.getTime() - rightDate.getTime()) / 864e5);
}
function normalizeCommitteeName(value) {
  return normalizeText(value).replace(/\b(committee|subcommittee|joint|hearing|select|special|part|room|house|senate|on|and)\b/g, " ").replace(/\b(i|ii|iii|iv|v)\b/g, " ").replace(/\s+/g, " ").trim();
}
function tokenizeCommitteeName(value) {
  return normalizeCommitteeName(value).split(" ").map((token) => token.trim()).filter((token) => token.length >= 2);
}
function scoreCommitteeMatch(expected, candidate) {
  const expectedName = normalizeCommitteeName(expected);
  const candidateName = normalizeCommitteeName(candidate);
  if (!expectedName || !candidateName) return 0;
  if (expectedName === candidateName) return 120;
  let score = 0;
  if (candidateName.includes(expectedName) || expectedName.includes(candidateName)) {
    score += 40;
  }
  const expectedTokens = new Set(tokenizeCommitteeName(expected));
  const candidateTokens = new Set(tokenizeCommitteeName(candidate));
  let matches = 0;
  for (const token of expectedTokens) {
    if (candidateTokens.has(token)) matches += 1;
  }
  if (matches === 0) return score;
  score += matches * 18;
  score += Math.round(matches / Math.max(expectedTokens.size, candidateTokens.size, 1) * 30);
  return score;
}
function scoreOfficialSourceCandidate(session, candidateTitle, candidateDateKey) {
  const committeeScore = scoreCommitteeMatch(session.committee, candidateTitle);
  if (committeeScore === 0) return 0;
  const hearingDateKey = formatTexasDateKey(session.hearingDate);
  if (!hearingDateKey || !candidateDateKey) return committeeScore;
  const dayDifference = dayDifferenceFromDateKeys(hearingDateKey, candidateDateKey);
  if (dayDifference === 0) return committeeScore + 100;
  if (dayDifference <= 2) return committeeScore + 30 - dayDifference * 10;
  if (dayDifference <= 7) return committeeScore - dayDifference * 6;
  return committeeScore - dayDifference * 12;
}
function resolveTexasLegislativeSessionInfo(session) {
  const sourceValues = [session.agendaUrl, session.videoUrl, session.transcriptSourceUrl].filter((value) => Boolean(value));
  for (const value of sourceValues) {
    const match = value.match(/\/tlodocs\/(\d{2,3}[A-Z0-9]*)\//i);
    if (!match) continue;
    const rawToken = match[1].toUpperCase();
    const tokenMatch = rawToken.match(/^(\d{2,3})([A-Z0-9]*)$/);
    if (!tokenMatch) continue;
    const suffix = tokenMatch[2] || "R";
    return {
      rawToken,
      sessionNumber: tokenMatch[1],
      houseArchiveCode: suffix === "R" ? "R" : suffix.replace(/^[A-Z]+/, "") || suffix
    };
  }
  const hearingDate = toDate(session.hearingDate) ?? /* @__PURE__ */ new Date();
  const year = hearingDate.getUTCFullYear();
  const bienniumStartYear = year % 2 === 0 ? year - 1 : year;
  const sessionNumber = 89 + Math.round((bienniumStartYear - 2025) / 2);
  return {
    rawToken: null,
    sessionNumber: String(sessionNumber),
    houseArchiveCode: "R"
  };
}
function isHlsUrl(value) {
  return Boolean(value && /\.m3u8(\?.*)?$/i.test(value));
}
function extractHouseVideoEventId(value) {
  const cleaned = cleanUrl(value);
  if (!cleaned) return null;
  const match = cleaned.match(/house\.texas\.gov\/videos\/(\d+)/i);
  if (!match) return null;
  const eventId = Number(match[1]);
  return Number.isFinite(eventId) ? eventId : null;
}
function extractSenateVideoPlayerUrl(value) {
  const cleaned = cleanUrl(value);
  if (!cleaned) return null;
  return /senate\.texas\.gov\/videoplayer\.php/i.test(cleaned) ? cleaned : null;
}
async function fetchJsonResponse(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*"
    }
  });
  if (!response.ok) {
    throw new Error(`Request for ${url} failed with status ${response.status}`);
  }
  return response.json();
}
async function fetchTextResponse(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5"
    }
  });
  if (!response.ok) {
    throw new Error(`Request for ${url} failed with status ${response.status}`);
  }
  return response.text();
}
function buildHouseOfficialSource(event) {
  const transcriptUrl = cleanUrl(event.videoTTV) ?? cleanUrl(event.videoTXT);
  return {
    sourceId: String(event.id),
    chamber: "House",
    sourceLabel: event.name,
    officialPageUrl: cleanUrl(event.EventUrl),
    videoStreamUrl: cleanUrl(event.videoUrl),
    transcriptUrl,
    transcriptFormat: cleanUrl(event.videoTTV) ? "webvtt" : cleanUrl(event.videoTXT) ? "text" : null,
    eventDateKey: parseUsDateToKey(event.date),
    metadata: {
      channel: event.channel ?? null,
      room: event.room ?? null,
      duration: event.duration ?? null,
      captions: Boolean(event.captions)
    }
  };
}
async function fetchHouseOfficialEventById(eventId) {
  const event = await fetchJsonResponse(`https://www.house.texas.gov/api/GetVideoEvent/${eventId}`);
  if (!event?.id) return null;
  return buildHouseOfficialSource(event);
}
async function resolveHouseOfficialSource(session) {
  const explicitEventId = extractHouseVideoEventId(session.videoUrl) ?? extractHouseVideoEventId(session.transcriptSourceUrl);
  if (explicitEventId) {
    return fetchHouseOfficialEventById(explicitEventId);
  }
  const { sessionNumber, houseArchiveCode } = resolveTexasLegislativeSessionInfo(session);
  const events = await fetchJsonResponse(
    `https://www.house.texas.gov/api/GetVideoEvents/${sessionNumber}/${houseArchiveCode}/published/committee`
  );
  const scored = events.map((event) => ({
    event,
    score: scoreOfficialSourceCandidate(session, event.name, parseUsDateToKey(event.date))
  })).filter((candidate) => candidate.score > 0).sort((left, right) => right.score - left.score || left.event.id - right.event.id);
  const best = scored[0];
  if (!best || best.score < 110) return null;
  return buildHouseOfficialSource(best.event);
}
function parseSenateArchiveEvents(html) {
  const $ = cheerio6.load(html);
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  $('a[href*="videoplayer.php?vid="]').each((_index, element) => {
    const link = $(element).attr("href");
    if (!link) return;
    const url = new URL(link, "https://senate.texas.gov/");
    const officialPageUrl = url.toString();
    if (seen.has(officialPageUrl)) return;
    seen.add(officialPageUrl);
    const row = $(element).closest("tr");
    const rowCells = row.find("td");
    const rowText = row.text().replace(/\s+/g, " ").trim();
    const rowDateText = rowCells.first().text().trim();
    const rowTitle = row.find("td.av-prog").first().text().replace(/\s+/g, " ").trim();
    const container = row.length > 0 ? row : $(element).closest("li,article,section,div,p");
    const containerText = container.text().replace(/\s+/g, " ").trim();
    const linkText = $(element).text().replace(/\s+/g, " ").trim();
    const dateKey = parseUsDateToKey(rowDateText) ?? parseUsDateToKey(rowText) ?? parseUsDateToKey(containerText);
    const title = rowTitle || linkText || containerText || rowText || "Senate committee hearing";
    results.push({
      dateKey,
      title,
      officialPageUrl,
      sourceId: url.searchParams.get("vid") ?? hashValue(officialPageUrl)
    });
  });
  return results;
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function decodeSenatePlayerStreamUrl(officialPageUrl) {
  const html = await fetchTextResponse(officialPageUrl);
  const directQuotedMatch = html.match(/src\s*:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i);
  if (directQuotedMatch) {
    return directQuotedMatch[1];
  }
  const atobLiteralMatch = html.match(/src\s*:\s*atob\(\s*['"]([^'"]+)['"]\s*\)/i);
  if (atobLiteralMatch) {
    try {
      const decoded = Buffer.from(atobLiteralMatch[1], "base64").toString("utf8").trim();
      if (isHlsUrl(decoded) || /^https?:\/\//i.test(decoded)) {
        return decoded;
      }
    } catch {
    }
  }
  const atobVariableMatch = html.match(/src\s*:\s*atob\(\s*([A-Za-z_$][\w$]*)\s*\)/i);
  if (atobVariableMatch) {
    const variableName = atobVariableMatch[1].trim();
    const variableMatch = html.match(new RegExp(`(?:const|let|var)\\s+${escapeRegExp(variableName)}\\s*=\\s*['"]([^'"]+)['"]`, "i"));
    if (variableMatch) {
      try {
        const decoded = Buffer.from(variableMatch[1], "base64").toString("utf8").trim();
        if (isHlsUrl(decoded) || /^https?:\/\//i.test(decoded)) {
          return decoded;
        }
      } catch {
      }
    }
  }
  const fallbackUrlMatch = html.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/i);
  return fallbackUrlMatch ? fallbackUrlMatch[0] : null;
}
function buildSenateOfficialSource(event, videoStreamUrl) {
  return {
    sourceId: event.sourceId,
    chamber: "Senate",
    sourceLabel: event.title,
    officialPageUrl: event.officialPageUrl,
    videoStreamUrl,
    transcriptUrl: null,
    transcriptFormat: null,
    eventDateKey: event.dateKey,
    metadata: {}
  };
}
function shouldProbeSenateLiveSource(session) {
  const hearingDate = toDate(session.hearingDate);
  if (!hearingDate) return false;
  const now = Date.now();
  const probeWindowStartMs = hearingDate.getTime() - 10 * 60 * 60 * 1e3;
  const probeWindowEndMs = hearingDate.getTime() + 24 * 60 * 60 * 1e3;
  return now >= probeWindowStartMs && now <= probeWindowEndMs;
}
async function resolveBestPlayableSenateCandidate(session, candidates, options) {
  const ranked = candidates.map((candidate) => ({
    candidate,
    score: scoreOfficialSourceCandidate(session, candidate.title, candidate.dateKey)
  })).filter((candidate) => candidate.score >= options.minScore).sort((left, right) => right.score - left.score || left.candidate.officialPageUrl.localeCompare(right.candidate.officialPageUrl));
  for (const { candidate } of ranked.slice(0, Math.max(options.maxAttempts, 1))) {
    try {
      const videoStreamUrl = await decodeSenatePlayerStreamUrl(candidate.officialPageUrl);
      if (videoStreamUrl) {
        return buildSenateOfficialSource(candidate, videoStreamUrl);
      }
    } catch {
      continue;
    }
  }
  return null;
}
async function resolveSenateOfficialSource(session) {
  const explicitPlayerUrl = extractSenateVideoPlayerUrl(session.videoUrl) ?? extractSenateVideoPlayerUrl(session.transcriptSourceUrl);
  if (explicitPlayerUrl) {
    const videoStreamUrl = await decodeSenatePlayerStreamUrl(explicitPlayerUrl);
    if (!videoStreamUrl) return null;
    return buildSenateOfficialSource({
      dateKey: formatTexasDateKey(session.hearingDate),
      title: session.committee,
      officialPageUrl: explicitPlayerUrl,
      sourceId: new URL(explicitPlayerUrl).searchParams.get("vid") ?? hashValue(explicitPlayerUrl)
    }, videoStreamUrl);
  }
  const { sessionNumber } = resolveTexasLegislativeSessionInfo(session);
  const archiveHtml = await fetchTextResponse(`https://senate.texas.gov/av-archive.php?sess=${sessionNumber}&lang=en`);
  const archiveCandidates = parseSenateArchiveEvents(archiveHtml);
  const archiveSource = await resolveBestPlayableSenateCandidate(session, archiveCandidates, {
    minScore: 70,
    maxAttempts: 6
  });
  if (archiveSource) {
    return archiveSource;
  }
  if (!shouldProbeSenateLiveSource(session)) {
    return null;
  }
  const liveResponses = await Promise.allSettled([
    fetchTextResponse("https://senate.texas.gov/av-live.php"),
    fetchTextResponse("https://senate.texas.gov/av-live.php?lang=en")
  ]);
  const liveCandidates = liveResponses.filter((response) => response.status === "fulfilled").flatMap((response) => parseSenateArchiveEvents(response.value));
  return resolveBestPlayableSenateCandidate(session, liveCandidates, {
    minScore: 55,
    maxAttempts: 8
  });
}
async function resolveOfficialCommitteeSource(session) {
  const explicitVideoUrl = cleanUrl(session.videoUrl) ?? cleanUrl(session.transcriptSourceUrl);
  if (explicitVideoUrl && isHlsUrl(explicitVideoUrl)) {
    return {
      sourceId: hashValue(explicitVideoUrl),
      chamber: normalizeText(session.chamber).includes("house") ? "House" : "Senate",
      sourceLabel: session.title,
      officialPageUrl: explicitVideoUrl,
      videoStreamUrl: explicitVideoUrl,
      transcriptUrl: null,
      transcriptFormat: null,
      eventDateKey: formatTexasDateKey(session.hearingDate),
      metadata: {}
    };
  }
  const normalizedChamber = normalizeText(session.chamber);
  if (normalizedChamber.includes("house")) {
    return resolveHouseOfficialSource(session);
  }
  if (normalizedChamber.includes("senate")) {
    return resolveSenateOfficialSource(session);
  }
  if (normalizedChamber.includes("joint")) {
    return await resolveHouseOfficialSource(session) ?? await resolveSenateOfficialSource(session);
  }
  return null;
}
async function resolveTranscriptSyncSource(session) {
  if (session.transcriptSourceType === "manual") {
    throw new Error("This session does not have an automatic transcript source configured");
  }
  if (session.transcriptSourceType !== "official") {
    const sourceUrl = resolveTranscriptSourceUrl(session);
    if (!sourceUrl) {
      throw new Error("This session does not have an automatic transcript feed configured");
    }
    return {
      sourceType: session.transcriptSourceType,
      sourceMode: "feed",
      sourceUrl,
      sourceLabel: session.title,
      resolvedFrom: sourceUrl,
      feedType: session.transcriptSourceType,
      officialSource: null
    };
  }
  const explicitFeedUrl = cleanUrl(session.transcriptSourceUrl);
  const explicitFeedType = inferTranscriptFeedTypeFromUrl(explicitFeedUrl);
  if (explicitFeedUrl && explicitFeedType) {
    return {
      sourceType: "official",
      sourceMode: "feed",
      sourceUrl: explicitFeedUrl,
      sourceLabel: session.title,
      resolvedFrom: explicitFeedUrl,
      feedType: explicitFeedType,
      officialSource: null
    };
  }
  const officialSource = await resolveOfficialCommitteeSource(session);
  if (!officialSource) {
    throw new Error(`No official ${session.chamber.toLowerCase()} committee source is available for ${session.committee} yet`);
  }
  if (officialSource.transcriptUrl && officialSource.transcriptFormat) {
    return {
      sourceType: "official",
      sourceMode: "feed",
      sourceUrl: officialSource.transcriptUrl,
      sourceLabel: officialSource.sourceLabel,
      resolvedFrom: officialSource.officialPageUrl ?? officialSource.transcriptUrl,
      feedType: officialSource.transcriptFormat,
      officialSource
    };
  }
  if (officialSource.videoStreamUrl) {
    return {
      sourceType: "official",
      sourceMode: "audio_transcription",
      sourceUrl: officialSource.videoStreamUrl,
      sourceLabel: officialSource.sourceLabel,
      resolvedFrom: officialSource.officialPageUrl ?? officialSource.videoStreamUrl,
      feedType: null,
      officialSource
    };
  }
  throw new Error(`Official source resolution succeeded for ${session.committee}, but no transcript or video stream is available yet`);
}
function isRetryableOfficialSourceError(session, message) {
  if (session.transcriptSourceType !== "official") {
    return false;
  }
  if (/No official .* committee source is available .* yet/i.test(message)) {
    return true;
  }
  if (/Official source resolution succeeded .* but no transcript or video stream is available yet/i.test(message)) {
    return true;
  }
  if (/Transcript feed request failed with status (404|429|500|502|503|504)/i.test(message)) {
    return true;
  }
  return false;
}
function classifyOfficialSourceWaitReason(message) {
  if (/No official .* committee source is available .* yet/i.test(message)) {
    return "source_not_published";
  }
  if (/Official source resolution succeeded .* but no transcript or video stream is available yet/i.test(message)) {
    return "media_not_live";
  }
  const statusMatch = message.match(/Transcript feed request failed with status (\d{3})/i);
  if (statusMatch) {
    return `feed_http_${statusMatch[1]}`;
  }
  return "official_source_pending";
}
function parseCursorSecond(value) {
  const cleaned = value?.trim();
  if (!cleaned) return 0;
  const match = cleaned.match(/^(\d+)/);
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}
function buildOfficialTranscriptionPrompt(session, officialSource) {
  const hints = cleanList(session.focusTopicsJson).slice(0, 5);
  return [
    `Texas ${officialSource.chamber} committee hearing transcription.`,
    `Committee: ${session.committee}.`,
    hints.length > 0 ? `Priority topics: ${hints.join(", ")}.` : null,
    "Keep legislative acronyms, witness names, and agency names verbatim when they are intelligible."
  ].filter((value) => Boolean(value)).join(" ");
}
async function extractAudioClipFromStream(streamUrl, startSecond, durationSeconds) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "committee-intel-"));
  const filePath = path.join(tempDir, `clip-${Date.now()}.mp3`);
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(Math.max(0, startSecond)),
    "-i",
    streamUrl,
    "-t",
    String(Math.max(30, durationSeconds)),
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "32k",
    filePath
  ];
  try {
    await execFileAsync(FFMPEG_BINARY, args, {
      timeout: OFFICIAL_TRANSCRIPTION_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024
    });
    const info = await stat(filePath);
    if (info.size < 1024) {
      throw new Error("ffmpeg produced an empty audio clip");
    }
    return {
      filePath,
      cleanup: async () => {
        await rm(tempDir, { recursive: true, force: true });
      }
    };
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw new Error(error?.message ?? "ffmpeg audio extraction failed");
  }
}
async function transcribeAudioFile(filePath, prompt) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured for official video transcription");
  }
  const buffer = await readFile(filePath);
  const formData = new FormData();
  formData.append("file", new File([buffer], path.basename(filePath), { type: "audio/mpeg" }));
  formData.append("model", "whisper-1");
  formData.append("language", "en");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "segment");
  if (prompt.trim()) {
    formData.append("prompt", prompt.trim());
  }
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: formData
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Audio transcription failed with status ${response.status}: ${body.slice(0, 300)}`);
  }
  const data = await response.json();
  return {
    text: typeof data.text === "string" ? data.text : "",
    segments: Array.isArray(data.segments) ? data.segments.map((segment) => ({
      start: Number(segment.start ?? 0),
      end: Number(segment.end ?? segment.start ?? 0),
      text: typeof segment.text === "string" ? segment.text : ""
    })).filter((segment) => Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.text.trim().length > 0) : []
  };
}
async function buildOfficialTranscriptEntries(session, officialSource) {
  if (!officialSource.videoStreamUrl) {
    throw new Error(`Official source for ${session.committee} does not expose a playable video stream`);
  }
  const priorCursorSecond = parseCursorSecond(session.lastAutoIngestCursor);
  const clipStartSecond = Math.max(0, priorCursorSecond - OFFICIAL_TRANSCRIPTION_OVERLAP_SECONDS);
  const extractedAudio = await extractAudioClipFromStream(
    officialSource.videoStreamUrl,
    clipStartSecond,
    OFFICIAL_TRANSCRIPTION_CLIP_SECONDS
  );
  try {
    const transcription = await transcribeAudioFile(
      extractedAudio.filePath,
      buildOfficialTranscriptionPrompt(session, officialSource)
    );
    const metadataBase = {
      sourceType: "official",
      sourceId: officialSource.sourceId,
      officialPageUrl: officialSource.officialPageUrl,
      videoStreamUrl: officialSource.videoStreamUrl,
      sourceLabel: officialSource.sourceLabel,
      ...officialSource.metadata
    };
    const entries = transcription.segments.length > 0 ? transcription.segments.map((segment, index2) => {
      const startedAtSecond = clipStartSecond + Math.max(0, Math.floor(segment.start));
      const endedAtSecond = clipStartSecond + Math.max(Math.floor(segment.end), Math.floor(segment.start));
      return buildFeedEntry(session, index2, {
        cursorValue: String(startedAtSecond),
        startedAtSecond,
        endedAtSecond,
        transcriptText: segment.text,
        metadata: metadataBase
      });
    }).filter((entry) => Boolean(entry)) : (() => {
      const fallback = buildFeedEntry(session, clipStartSecond, {
        cursorValue: String(clipStartSecond),
        startedAtSecond: clipStartSecond,
        endedAtSecond: clipStartSecond + OFFICIAL_TRANSCRIPTION_CLIP_SECONDS,
        transcriptText: transcription.text,
        metadata: metadataBase
      });
      return fallback ? [fallback] : [];
    })();
    const lastEntry = entries.at(-1) ?? null;
    const lastEntryCursorSecond = lastEntry ? lastEntry.endedAtSecond ?? lastEntry.startedAtSecond ?? clipStartSecond : clipStartSecond;
    const minimumProgressSecond = clipStartSecond + Math.max(30, OFFICIAL_TRANSCRIPTION_CLIP_SECONDS - OFFICIAL_TRANSCRIPTION_OVERLAP_SECONDS);
    const cursor = String(Math.max(lastEntryCursorSecond, minimumProgressSecond, priorCursorSecond));
    return { entries, cursor };
  } finally {
    await extractedAudio.cleanup();
  }
}
async function applyTranscriptEntries(session, parsedEntries) {
  await mergeDuplicateFeedSegments(session);
  const existingSegments = await loadSessionSegments(session.id);
  const existingByKey = new Map(existingSegments.map((segment) => [buildStoredSegmentDedupKey(segment), segment]));
  const seenParsedKeys = /* @__PURE__ */ new Set();
  const requests = [];
  let updatedSegments = 0;
  let duplicateSegments = 0;
  for (const entry of parsedEntries) {
    const dedupKey = buildFeedEntryDedupKey(session.id, entry);
    if (seenParsedKeys.has(dedupKey)) {
      duplicateSegments += 1;
      continue;
    }
    seenParsedKeys.add(dedupKey);
    const request = {
      capturedAt: entry.capturedAt,
      startedAtSecond: entry.startedAtSecond,
      endedAtSecond: entry.endedAtSecond,
      speakerName: entry.speakerName ?? void 0,
      speakerRole: entry.speakerRole,
      affiliation: entry.affiliation ?? void 0,
      transcriptText: entry.transcriptText,
      invited: entry.invited,
      metadata: entry.metadata
    };
    const existingSegment = existingByKey.get(dedupKey);
    if (!existingSegment) {
      requests.push(request);
      continue;
    }
    if (buildStoredSegmentExternalKey(existingSegment) !== entry.externalKey) {
      await updateCommitteeIntelSegment(session, existingSegment, request);
      updatedSegments += 1;
    } else {
      duplicateSegments += 1;
    }
  }
  await insertCommitteeIntelSegments(session, requests);
  return {
    ingestedSegments: requests.length,
    updatedSegments,
    duplicateSegments
  };
}
function normalizeText(value) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\b(senator|sen|representative|rep|chairman|chairwoman|chair|dr|mr|mrs|ms)\b/g, " ").replace(/\s+/g, " ").trim();
}
function cleanList(values) {
  const next = /* @__PURE__ */ new Set();
  for (const value of values ?? []) {
    const cleaned = value.trim();
    if (!cleaned) continue;
    next.add(cleaned);
  }
  return Array.from(next);
}
function slugifyIssue(value) {
  return normalizeText(value).replace(/\s+/g, "_").slice(0, 64) || "general";
}
function labelFromTag(tag) {
  return tag.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function toIsoString(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function getNextAutoIngestWindow(session) {
  if (!session.autoIngestEnabled) {
    return {
      nextEligibleAutoIngestAt: null,
      nextEligibleAutoIngestInSeconds: null
    };
  }
  const now = Date.now();
  const intervalMs = Math.max(session.autoIngestIntervalSeconds, 30) * 1e3;
  const lastIngestedAt = toDate(session.lastAutoIngestedAt);
  if (!lastIngestedAt) {
    return {
      nextEligibleAutoIngestAt: new Date(now).toISOString(),
      nextEligibleAutoIngestInSeconds: 0
    };
  }
  const nextEligibleMs = lastIngestedAt.getTime() + intervalMs;
  const remainingMs = Math.max(0, nextEligibleMs - now);
  return {
    nextEligibleAutoIngestAt: new Date(nextEligibleMs).toISOString(),
    nextEligibleAutoIngestInSeconds: Math.ceil(remainingMs / 1e3)
  };
}
function formatTimestampLabel(seconds, capturedAt) {
  if (seconds !== null && seconds !== void 0) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  const date = toDate(capturedAt);
  if (!date) return "Unknown";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function buildIssueLabelMap(session) {
  const labels = /* @__PURE__ */ new Map();
  for (const item of ISSUE_CATALOG) {
    labels.set(item.tag, item.label);
  }
  for (const topic of cleanList(session.focusTopicsJson)) {
    labels.set(slugifyIssue(topic), topic);
  }
  return labels;
}
function matchesFocusTopic(normalizedTranscript, topic) {
  const normalizedTopic = normalizeText(topic);
  if (!normalizedTopic) return false;
  if (normalizedTranscript.includes(normalizedTopic)) return true;
  const tokens = normalizedTopic.split(" ").filter((token) => token.length >= 5);
  if (tokens.length < 2) return false;
  const matchedTokens = tokens.filter((token) => normalizedTranscript.includes(token));
  return matchedTokens.length >= Math.min(2, tokens.length);
}
function detectIssueTags(transcriptText, focusTopics) {
  const normalizedTranscript = normalizeText(transcriptText);
  const matched = /* @__PURE__ */ new Set();
  for (const item of ISSUE_CATALOG) {
    if (item.patterns.some((pattern) => pattern.test(transcriptText))) {
      matched.add(item.tag);
    }
  }
  for (const topic of cleanList(focusTopics)) {
    if (matchesFocusTopic(normalizedTranscript, topic)) {
      matched.add(slugifyIssue(topic));
    }
  }
  return Array.from(matched);
}
function determineSpeakerRole(currentRole, speakerName, affiliation, transcriptText) {
  if (currentRole && currentRole !== "unknown") return currentRole;
  const rawSpeakerName = (speakerName ?? "").toLowerCase();
  const normalizedName = normalizeText(speakerName);
  const normalizedAffiliation = normalizeText(affiliation);
  const normalizedTranscript = normalizeText(transcriptText);
  if (normalizedName.includes("chair") || normalizedTranscript.includes("chair recognizes")) return "chair";
  if (/^(sen\.?|senator|rep\.?|representative)\b/i.test(rawSpeakerName) || normalizedTranscript.includes("senator") || normalizedTranscript.includes("representative")) return "member";
  if (/^commissioner\b/i.test(rawSpeakerName)) return "agency";
  if (AGENCY_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "agency";
  if (normalizedTranscript.includes("invited testimony") || normalizedAffiliation.includes("invited")) return "invited_witness";
  if (normalizedTranscript.includes("public testimony") || normalizedTranscript.includes("public witness")) return "public_witness";
  if (normalizedAffiliation.includes("staff") || normalizedTranscript.includes("committee staff")) return "staff";
  if (speakerName && affiliation) return "public_witness";
  return "unknown";
}
function determinePosition(transcriptText, speakerRole) {
  const normalized = normalizeText(transcriptText);
  const looksLikeQuestion = /\?|^(can|could|would|how|why|what|when|where|who|is|are|do|does|did)\b/i.test(transcriptText.trim());
  if ((speakerRole === "chair" || speakerRole === "member") && looksLikeQuestion) return "questioning";
  if (/\boppose\b|\bobject\b|\bconcern(ed|ing)?\b|\brisks?\b|\bvulnerab/i.test(normalized)) return "oppose";
  if (/\bsupport\b|\bback\b|\bendorse\b|\bfavor\b|\brecommend\b|\bpromote\b/i.test(normalized)) return "support";
  if ((speakerRole === "chair" || speakerRole === "member") && /\bhow\b|\bwhy\b|\bwhat\b/i.test(normalized)) return "questioning";
  if (/\bupdate\b|\bbrief(ed|ing)?\b|\boverview\b|\bresponded\b|\bstated\b|\breported\b/i.test(normalized) || speakerRole === "agency") return "neutral";
  if (speakerRole === "chair" || speakerRole === "member") return "questioning";
  return "monitoring";
}
function scoreImportance(transcriptText, speakerRole, issueTags, position, invited) {
  let score = 20;
  score += issueTags.length * 12;
  if (speakerRole === "chair" || speakerRole === "member") score += 12;
  if (speakerRole === "agency" || invited) score += 8;
  if (position === "support" || position === "oppose" || position === "questioning") score += 10;
  if (transcriptText.trim().length > 240) score += 8;
  if (/\bcritical\b|\burgent\b|\brecommend\b|\bsecurity\b|\bvulnerab/i.test(transcriptText)) score += 8;
  return clamp(score, 10, 100);
}
function summarizeSegment(speakerName, affiliation, issueTags, position, issueLabels) {
  const speakerLabel = speakerName?.trim() || affiliation?.trim() || "Speaker";
  const issueLabel = issueTags.length > 0 ? issueTags.slice(0, 2).map((tag) => issueLabels.get(tag) ?? labelFromTag(tag)).join(", ") : "general hearing discussion";
  if (position === "support") return `${speakerLabel} voiced support on ${issueLabel}.`;
  if (position === "oppose") return `${speakerLabel} raised concerns about ${issueLabel}.`;
  if (position === "questioning") return `${speakerLabel} pressed witnesses on ${issueLabel}.`;
  if (position === "neutral") return `${speakerLabel} provided updates on ${issueLabel}.`;
  return `${speakerLabel} spoke on ${issueLabel}.`;
}
function detectInvitedWitness(transcriptText, speakerRole, invited) {
  if (invited === true) return true;
  if (speakerRole === "invited_witness") return true;
  return /\binvited testimony\b|\binvited witness\b/i.test(transcriptText);
}
function resolveEntityType(speakerRole, speakerName, affiliation, committeeMemberMap) {
  const rawSpeakerName = (speakerName ?? "").toLowerCase();
  const normalizedName = normalizeText(speakerName);
  const normalizedAffiliation = normalizeText(affiliation);
  if (committeeMemberMap.has(normalizedName) || speakerRole === "chair" || speakerRole === "member" || /^(sen\.?|senator|rep\.?|representative)\b/i.test(rawSpeakerName)) return "legislator";
  if (speakerRole === "agency" || AGENCY_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "agency";
  if (speakerRole === "staff") return "staff";
  if (speakerRole === "invited_witness" || speakerRole === "public_witness" || speakerName && affiliation) return "witness";
  if (ORGANIZATION_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "organization";
  return "unknown";
}
function selectEntityName(segment, fallbackCommittee) {
  const name = segment.speakerName?.trim();
  if (name) return name;
  const affiliation = segment.affiliation?.trim();
  if (affiliation) return affiliation;
  return fallbackCommittee || null;
}
function buildStakeholderLookups(rows) {
  const byName = /* @__PURE__ */ new Map();
  const byOrganization = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const normalizedName = normalizeText(row.name);
    if (normalizedName && !byName.has(normalizedName)) byName.set(normalizedName, row);
    const normalizedOrganization = normalizeText(row.organization);
    if (normalizedOrganization && !byOrganization.has(normalizedOrganization)) byOrganization.set(normalizedOrganization, row);
  }
  return { byName, byOrganization };
}
function resolveStakeholderId(entityName, affiliation, committeeMemberMap, stakeholderByName, stakeholderByOrganization) {
  const normalizedName = normalizeText(entityName);
  const normalizedAffiliation = normalizeText(affiliation);
  if (normalizedName && committeeMemberMap.has(normalizedName)) {
    return committeeMemberMap.get(normalizedName)?.stakeholderId ?? null;
  }
  if (normalizedName && stakeholderByName.has(normalizedName)) {
    return stakeholderByName.get(normalizedName)?.id ?? null;
  }
  if (normalizedAffiliation && stakeholderByOrganization.has(normalizedAffiliation)) {
    return stakeholderByOrganization.get(normalizedAffiliation)?.id ?? null;
  }
  return null;
}
function buildEmptyAnalysis(session, totalSegments = 0, totalSignals = 0) {
  return {
    analyzedAt: session.lastAnalyzedAt ? toIsoString(session.lastAnalyzedAt) : null,
    summary: totalSegments > 0 ? `Tracking ${totalSegments} transcript segments for ${session.committee}, but no issue-level signals have been extracted yet.` : `Committee intelligence is ready for ${session.committee}. Add transcript or caption segments to begin live analysis.`,
    totalSegments,
    totalSignals,
    trackedEntities: 0,
    invitedWitnessCount: 0,
    rollCall: [],
    issueCoverage: [],
    keyMoments: [],
    electedFocus: [],
    activeWitnesses: [],
    witnessRankings: [],
    postHearingRecap: null,
    positionMap: []
  };
}
function parseStoredAnalysis(session, segments, signals) {
  const raw = session.analyticsJson;
  if (!raw || typeof raw.summary !== "string") {
    return buildEmptyAnalysis(session, segments.length, signals.length);
  }
  return {
    analyzedAt: typeof raw.analyzedAt === "string" ? raw.analyzedAt : null,
    summary: raw.summary,
    totalSegments: typeof raw.totalSegments === "number" ? raw.totalSegments : segments.length,
    totalSignals: typeof raw.totalSignals === "number" ? raw.totalSignals : signals.length,
    trackedEntities: typeof raw.trackedEntities === "number" ? raw.trackedEntities : 0,
    invitedWitnessCount: typeof raw.invitedWitnessCount === "number" ? raw.invitedWitnessCount : 0,
    rollCall: Array.isArray(raw.rollCall) ? raw.rollCall : [],
    issueCoverage: Array.isArray(raw.issueCoverage) ? raw.issueCoverage : [],
    keyMoments: Array.isArray(raw.keyMoments) ? raw.keyMoments : [],
    electedFocus: Array.isArray(raw.electedFocus) ? raw.electedFocus : [],
    activeWitnesses: Array.isArray(raw.activeWitnesses) ? raw.activeWitnesses : [],
    witnessRankings: Array.isArray(raw.witnessRankings) ? raw.witnessRankings : [],
    postHearingRecap: raw.postHearingRecap && typeof raw.postHearingRecap === "object" ? raw.postHearingRecap : null,
    positionMap: Array.isArray(raw.positionMap) ? raw.positionMap : []
  };
}
function buildAnalysisSummary(session, issueCoverage, electedFocus, activeWitnesses, totalSegments) {
  if (totalSegments === 0) {
    return `Committee intelligence is standing by for ${session.committee}. No live transcript segments have been ingested yet.`;
  }
  const issueText = issueCoverage.length > 0 ? issueCoverage.slice(0, 3).map((issue) => `${issue.label} (${issue.mentionCount})`).join(", ") : "no dominant issue cluster yet";
  const electedText = electedFocus.length > 0 ? `Committee-member pressure is coming from ${electedFocus.slice(0, 2).map((entry) => entry.entityName).join(" and ")}.` : "No committee-member questioning has been isolated yet.";
  const witnessText = activeWitnesses.length > 0 ? `Active witnesses include ${activeWitnesses.slice(0, 3).map((entry) => entry.entityName).join(", ")}.` : "No witness or agency bloc has been isolated yet.";
  return `Tracking ${totalSegments} transcript segments for ${session.committee}. Most active issues: ${issueText}. ${electedText} ${witnessText}`;
}
function buildRecommendations(issue, supporters, opponents, electedFocus, activeWitnesses, hearingDate) {
  const recommendations = [];
  if (supporters.length === 0 && opponents.length === 0) {
    recommendations.push(`No direct signals are tied to ${issue} yet. Add more transcript segments or tighten the session focus topics.`);
  }
  if (opponents.length > supporters.length) {
    recommendations.push(`Opposition is stronger than support on ${issue}. Prepare counter-messaging and targeted member follow-up before the next committee touchpoint.`);
  }
  if (supporters.length >= opponents.length && supporters.length > 0) {
    recommendations.push(`Support is building around ${issue}. Identify the most credible supportive witnesses and reinforce their record in follow-up materials.`);
  }
  if (electedFocus.length > 0) {
    recommendations.push(`Brief ${electedFocus.slice(0, 2).map((entry) => entry.entityName).join(" and ")} directly on ${issue}; they are already signaling active engagement.`);
  }
  if (activeWitnesses.some((entry) => entry.invited)) {
    recommendations.push(`Invited witnesses are shaping the record on ${issue}. Prioritize outreach to those entities before written follow-up closes.`);
  }
  if (hearingDate) {
    const hearing = new Date(hearingDate);
    const diffHours = (hearing.getTime() - Date.now()) / 36e5;
    if (diffHours >= -6 && diffHours <= 36) {
      recommendations.push(`Keep live transcript ingestion running through the hearing window so member questioning on ${issue} is captured in real time.`);
    }
  }
  return recommendations.slice(0, 4);
}
function getDominantPosition(entry) {
  return entry.positions[0]?.position ?? "unknown";
}
function buildWitnessRankings(activeWitnesses, keyMoments) {
  const keyMomentCounts = /* @__PURE__ */ new Map();
  for (const moment of keyMoments) {
    const key = normalizeText(moment.speakerName);
    if (!key) continue;
    keyMomentCounts.set(key, (keyMomentCounts.get(key) ?? 0) + 1);
  }
  return activeWitnesses.map((entry) => {
    const issueBreadth = entry.positions.length;
    const keyMomentCount = keyMomentCounts.get(normalizeText(entry.entityName)) ?? 0;
    const dominantPosition = getDominantPosition(entry);
    const score = clamp(
      entry.mentionCount * 12 + issueBreadth * 8 + keyMomentCount * 10 + (entry.invited ? 15 : 0) + (entry.entityType === "agency" ? 6 : 0) + (dominantPosition !== "monitoring" && dominantPosition !== "unknown" ? 8 : 0),
      0,
      100
    );
    const summaryParts = [
      `${entry.entityName} appeared ${entry.mentionCount} time${entry.mentionCount === 1 ? "" : "s"}`,
      entry.primaryIssues.length > 0 ? `across ${entry.primaryIssues.slice(0, 2).join(" and ")}` : void 0,
      entry.invited ? "as invited testimony" : void 0
    ].filter(Boolean);
    return {
      rank: 0,
      entityName: entry.entityName,
      entityType: entry.entityType,
      stakeholderId: entry.stakeholderId,
      affiliation: entry.affiliation,
      invited: entry.invited,
      score,
      dominantPosition,
      mentionCount: entry.mentionCount,
      issueBreadth,
      keyMomentCount,
      primaryIssues: entry.primaryIssues,
      summary: `${summaryParts.join(" ")}.`
    };
  }).sort((left, right) => right.score - left.score || right.mentionCount - left.mentionCount).slice(0, 10).map((entry, index2) => ({ ...entry, rank: index2 + 1 }));
}
function buildMemberPressurePoints(electedFocus) {
  return electedFocus.slice(0, 5).map((entry) => {
    const topIssue = entry.positions[0]?.label ?? "the central issues";
    const topPosition = getDominantPosition(entry).replace(/_/g, " ");
    return `${entry.entityName} concentrated on ${topIssue} and is primarily ${topPosition}.`;
  });
}
function buildAgencyCommitments(segments) {
  return segments.filter(
    (segment) => (segment.speakerRole === "agency" || segment.invited) && /\b(will|plan to|committed|recommend|working on|next step|we are going to|intend to)\b/i.test(segment.transcriptText)
  ).sort((left, right) => right.importance - left.importance).slice(0, 5).map((segment) => `${segment.speakerName || segment.affiliation || "Witness"}: ${segment.summary ?? segment.transcriptText.slice(0, 180)}`);
}
function buildPostHearingRecap(session, issueCoverage, electedFocus, witnessRankings, segments) {
  if (segments.length === 0) return null;
  const topIssues = issueCoverage.slice(0, 4);
  const issueLabels = topIssues.map((issue) => issue.label);
  const headline = issueLabels.length > 0 ? `${session.committee} recap: ${issueLabels.join(", ")} dominated the hearing.` : `${session.committee} recap: testimony centered on the committee's interim agenda.`;
  const overview = [
    `The session generated ${segments.length} tracked transcript segments and ${witnessRankings.length} ranked witnesses or agencies.`,
    topIssues.length > 0 ? `Primary areas of focus were ${topIssues.map((issue) => `${issue.label} (${issue.mentionCount} mentions)`).join(", ")}.` : `No single issue cluster dominated the hearing record.`
  ].join(" ");
  const issueHighlights = topIssues.map((issue) => {
    const entityText = issue.keyEntities.length > 0 ? ` Key voices: ${issue.keyEntities.join(", ")}.` : "";
    return `${issue.label}: ${issue.mentionCount} mentions, ${issue.supportCount} support, ${issue.opposeCount} oppose, ${issue.questioningCount} questioning.${entityText}`;
  });
  const followUpActions = [
    witnessRankings.length > 0 ? `Follow up with ${witnessRankings.slice(0, 2).map((entry) => entry.entityName).join(" and ")} while the hearing record is still fresh.` : null,
    electedFocus.length > 0 ? `Prepare a member-specific response for ${electedFocus.slice(0, 2).map((entry) => entry.entityName).join(" and ")} based on their questioning.` : null,
    topIssues.length > 0 ? `Build a short readout on ${topIssues[0].label} for client distribution after testimony closes.` : null
  ].filter((value) => Boolean(value));
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    headline,
    overview,
    issueHighlights,
    memberPressurePoints: buildMemberPressurePoints(electedFocus),
    witnessLeaderboard: witnessRankings.slice(0, 5),
    agencyCommitments: buildAgencyCommitments(segments),
    followUpActions
  };
}
async function loadSessionCore(sessionId) {
  const [row] = await policyIntelDb.select({
    session: committeeIntelSessions,
    hearing: hearingEvents
  }).from(committeeIntelSessions).leftJoin(hearingEvents, eq19(hearingEvents.id, committeeIntelSessions.hearingId)).where(eq19(committeeIntelSessions.id, sessionId));
  if (!row) return null;
  return { session: row.session, hearing: row.hearing ?? null };
}
async function loadSessionSegments(sessionId) {
  return policyIntelDb.select().from(committeeIntelSegments).where(eq19(committeeIntelSegments.sessionId, sessionId)).orderBy(asc(committeeIntelSegments.segmentIndex), asc(committeeIntelSegments.createdAt));
}
async function loadSessionSignals(sessionId) {
  return policyIntelDb.select().from(committeeIntelSignals).where(eq19(committeeIntelSignals.sessionId, sessionId)).orderBy(desc13(committeeIntelSignals.createdAt), asc(committeeIntelSignals.id));
}
async function loadSessionDetail(sessionId) {
  const core = await loadSessionCore(sessionId);
  if (!core) return null;
  const [segments, signals] = await Promise.all([
    loadSessionSegments(sessionId),
    loadSessionSignals(sessionId)
  ]);
  return {
    session: core.session,
    hearing: core.hearing,
    segments,
    signals,
    analysis: parseStoredAnalysis(core.session, segments, signals)
  };
}
async function loadStakeholderContext(session) {
  const [stakeholderRows, committeeRows] = await Promise.all([
    policyIntelDb.select({
      id: stakeholders.id,
      name: stakeholders.name,
      type: stakeholders.type,
      organization: stakeholders.organization,
      party: stakeholders.party,
      chamber: stakeholders.chamber,
      title: stakeholders.title
    }).from(stakeholders).where(eq19(stakeholders.workspaceId, session.workspaceId)),
    policyIntelDb.select({
      stakeholderId: committeeMembers.stakeholderId,
      role: committeeMembers.role,
      name: stakeholders.name,
      party: stakeholders.party,
      chamber: stakeholders.chamber
    }).from(committeeMembers).innerJoin(stakeholders, eq19(stakeholders.id, committeeMembers.stakeholderId)).where(and11(
      or(
        ilike5(committeeMembers.committeeName, session.committee),
        ilike5(committeeMembers.committeeName, session.committee.replace(/&/g, "and")),
        ilike5(committeeMembers.committeeName, session.committee.replace(/\band\b/g, "&"))
      ),
      eq19(committeeMembers.chamber, session.chamber)
    ))
  ]);
  const { byName, byOrganization } = buildStakeholderLookups(stakeholderRows);
  const committeeMemberMap = /* @__PURE__ */ new Map();
  for (const row of committeeRows) {
    committeeMemberMap.set(normalizeText(row.name), row);
  }
  return {
    stakeholderRows,
    stakeholderByName: byName,
    stakeholderByOrganization: byOrganization,
    committeeMemberMap
  };
}
function findMemberByLastName(lastName, committeeMemberMap) {
  const normalizedLastName = normalizeText(lastName);
  if (!normalizedLastName) return null;
  for (const [, entry] of committeeMemberMap) {
    const memberLastName = normalizeText(entry.name.split(" ").pop() ?? "");
    if (memberLastName === normalizedLastName) return entry;
  }
  for (const [, entry] of committeeMemberMap) {
    const memberLastName = normalizeText(entry.name.split(" ").pop() ?? "");
    if (memberLastName.length >= 4 && normalizedLastName.length >= 4 && (memberLastName.startsWith(normalizedLastName.slice(0, 4)) || normalizedLastName.startsWith(memberLastName.slice(0, 4)))) {
      return entry;
    }
  }
  return null;
}
function extractSpeakerFromTranscriptContext(segment, committeeMemberMap) {
  if (segment.speakerName?.trim()) {
    return { speakerName: null, speakerRole: null };
  }
  const text3 = segment.transcriptText;
  const rollCallMatch = text3.match(
    /^(?:Senator|Sen\.?|Dean|Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+([\w'-]+)\??\s*(?:Present|Here)\b/i
  );
  if (rollCallMatch) {
    const lastName = rollCallMatch[1];
    const matched = findMemberByLastName(lastName, committeeMemberMap);
    return {
      speakerName: matched?.name ?? `Senator ${lastName}`,
      speakerRole: "member"
    };
  }
  if (/committee.*will come to order/i.test(text3) || /^there being \d+ present,?\s*a quorum is established/i.test(text3)) {
    const chair = [...committeeMemberMap.values()].find((m) => m.role === "chair");
    return {
      speakerName: chair?.name ?? null,
      speakerRole: "chair"
    };
  }
  if (/thank you,?\s*(?:mr\.?\s*)?chairman/i.test(text3)) {
    return { speakerName: null, speakerRole: "member" };
  }
  if (/^(?:Senator|Sen\.?)\s+[\w'-]+\s+and\s+(?:Senator|Sen\.?)\s+[\w'-]+/i.test(text3)) {
    const chair = [...committeeMemberMap.values()].find((m) => m.role === "chair");
    return { speakerName: chair?.name ?? null, speakerRole: "chair" };
  }
  if (/^(?:before we begin|i'm going to ask|i will ask|let me recognize)/i.test(text3)) {
    const chair = [...committeeMemberMap.values()].find((m) => m.role === "chair");
    return { speakerName: chair?.name ?? null, speakerRole: "chair" };
  }
  if (/^(?:welcome,?\s*sir|thank you,?\s*senator)/i.test(text3)) {
    const chair = [...committeeMemberMap.values()].find((m) => m.role === "chair");
    return { speakerName: chair?.name ?? null, speakerRole: "chair" };
  }
  if (/^(?:the chair (?:opens|recognizes)|with that,?\s*we'll begin|the plan is to hear|let the record reflect|so this is the|today we (?:will|are)|the committee has (?:dedicated|been)|members,?\s*(?:i wanted|welcome|we)|are there any remarks)/i.test(text3)) {
    const chair = [...committeeMemberMap.values()].find((m) => m.role === "chair");
    return { speakerName: chair?.name ?? null, speakerRole: "chair" };
  }
  return { speakerName: null, speakerRole: null };
}
function deriveSegment(segment, session, committeeMemberMap) {
  const issueLabels = buildIssueLabelMap(session);
  const extracted = committeeMemberMap ? extractSpeakerFromTranscriptContext(segment, committeeMemberMap) : { speakerName: null, speakerRole: null };
  const speakerName = segment.speakerName?.trim() || extracted.speakerName || null;
  const effectiveSegment = speakerName !== segment.speakerName ? { ...segment, speakerName } : segment;
  const speakerRole = extracted.speakerRole ?? determineSpeakerRole(effectiveSegment.speakerRole, speakerName, effectiveSegment.affiliation, effectiveSegment.transcriptText);
  const issueTagsJson = detectIssueTags(segment.transcriptText, session.focusTopicsJson);
  const position = determinePosition(segment.transcriptText, speakerRole);
  const invited = detectInvitedWitness(segment.transcriptText, speakerRole, segment.invited);
  const importance = scoreImportance(segment.transcriptText, speakerRole, issueTagsJson, position, invited);
  const summary = summarizeSegment(speakerName, segment.affiliation, issueTagsJson, position, issueLabels);
  const metadataJson = {
    ...segment.metadataJson ?? {},
    wordCount: normalizeText(segment.transcriptText).split(" ").filter(Boolean).length
  };
  return {
    speakerName,
    speakerRole,
    summary,
    issueTagsJson,
    position,
    importance,
    invited,
    metadataJson
  };
}
function buildStoredSegmentExternalKey(segment) {
  const metadata = getMetadataRecord(segment.metadataJson);
  const metadataKey = typeof metadata.externalKey === "string" ? metadata.externalKey : null;
  if (metadataKey) return metadataKey;
  return buildTranscriptExternalKey([
    segment.sessionId,
    segment.segmentIndex,
    segment.startedAtSecond,
    segment.endedAtSecond,
    segment.speakerName,
    segment.affiliation,
    segment.transcriptText
  ]);
}
function buildStoredSegmentDedupKey(segment) {
  const metadata = getMetadataRecord(segment.metadataJson);
  const storedKey = typeof metadata.dedupKey === "string" ? metadata.dedupKey.trim() : "";
  if (storedKey) return storedKey;
  return buildTranscriptFeedIdentityKey(
    segment.sessionId,
    typeof metadata.sourceType === "string" ? metadata.sourceType : null,
    typeof metadata.feedCursor === "string" ? metadata.feedCursor : null,
    typeof metadata.sourceId === "string" || typeof metadata.sourceId === "number" ? metadata.sourceId : null
  ) ?? buildStoredSegmentExternalKey(segment);
}
function buildStoredSegmentFeedIdentity(segment) {
  const metadata = getMetadataRecord(segment.metadataJson);
  return buildTranscriptFeedIdentityKey(
    segment.sessionId,
    typeof metadata.sourceType === "string" ? metadata.sourceType : null,
    typeof metadata.feedCursor === "string" ? metadata.feedCursor : null,
    typeof metadata.sourceId === "string" || typeof metadata.sourceId === "number" ? metadata.sourceId : null
  );
}
async function getNextSegmentIndex(sessionId) {
  const [lastSegment] = await policyIntelDb.select({ segmentIndex: committeeIntelSegments.segmentIndex }).from(committeeIntelSegments).where(eq19(committeeIntelSegments.sessionId, sessionId)).orderBy(desc13(committeeIntelSegments.segmentIndex)).limit(1);
  return (lastSegment?.segmentIndex ?? -1) + 1;
}
function buildCommitteeIntelSegmentValues(session, segmentIndex, request, current) {
  const capturedAt = toDate(request.capturedAt) ?? /* @__PURE__ */ new Date();
  const createdAt = current?.createdAt ? toDate(current.createdAt) ?? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date();
  const baseSegment = {
    id: current?.id ?? 0,
    sessionId: session.id,
    segmentIndex,
    capturedAt,
    startedAtSecond: request.startedAtSecond ?? null,
    endedAtSecond: request.endedAtSecond ?? null,
    speakerName: request.speakerName?.trim() || null,
    speakerRole: request.speakerRole ?? "unknown",
    affiliation: request.affiliation?.trim() || null,
    transcriptText: request.transcriptText.trim(),
    summary: null,
    issueTagsJson: [],
    position: "unknown",
    importance: 0,
    invited: request.invited ?? false,
    metadataJson: request.metadata ?? {},
    createdAt
  };
  const derived = deriveSegment(baseSegment, session);
  return {
    sessionId: session.id,
    segmentIndex: baseSegment.segmentIndex,
    capturedAt,
    startedAtSecond: baseSegment.startedAtSecond,
    endedAtSecond: baseSegment.endedAtSecond,
    speakerName: baseSegment.speakerName,
    speakerRole: derived.speakerRole,
    affiliation: baseSegment.affiliation,
    transcriptText: baseSegment.transcriptText,
    summary: derived.summary,
    issueTagsJson: derived.issueTagsJson,
    position: derived.position,
    importance: derived.importance,
    invited: derived.invited,
    metadataJson: derived.metadataJson
  };
}
async function insertCommitteeIntelSegments(session, requests) {
  if (requests.length === 0) return [];
  const startingIndex = await getNextSegmentIndex(session.id);
  const rows = requests.map(
    (request, requestIndex) => buildCommitteeIntelSegmentValues(session, startingIndex + requestIndex, request)
  );
  const inserted = [];
  const batchSize = 250;
  for (let index2 = 0; index2 < rows.length; index2 += batchSize) {
    const batch = rows.slice(index2, index2 + batchSize);
    const created = await policyIntelDb.insert(committeeIntelSegments).values(batch).returning();
    inserted.push(...created);
  }
  return inserted;
}
async function updateCommitteeIntelSegment(session, segment, request) {
  const values = buildCommitteeIntelSegmentValues(
    session,
    segment.segmentIndex,
    request,
    { id: segment.id, createdAt: segment.createdAt }
  );
  const [updated] = await policyIntelDb.update(committeeIntelSegments).set({
    capturedAt: values.capturedAt,
    startedAtSecond: values.startedAtSecond,
    endedAtSecond: values.endedAtSecond,
    speakerName: values.speakerName,
    speakerRole: values.speakerRole,
    affiliation: values.affiliation,
    transcriptText: values.transcriptText,
    summary: values.summary,
    issueTagsJson: values.issueTagsJson,
    position: values.position,
    importance: values.importance,
    invited: values.invited,
    metadataJson: values.metadataJson
  }).where(eq19(committeeIntelSegments.id, segment.id)).returning();
  return updated ?? { ...segment, ...values };
}
async function mergeDuplicateFeedSegments(session) {
  const segments = await loadSessionSegments(session.id);
  const grouped = /* @__PURE__ */ new Map();
  for (const segment of segments) {
    const identityKey = buildStoredSegmentFeedIdentity(segment);
    if (!identityKey) continue;
    const current = grouped.get(identityKey) ?? [];
    current.push(segment);
    grouped.set(identityKey, current);
  }
  for (const group of grouped.values()) {
    if (group.length < 2) continue;
    const orderedByIndex = [...group].sort((left, right) => left.segmentIndex - right.segmentIndex || left.id - right.id);
    const orderedByFreshness = [...group].sort((left, right) => {
      const rightTime = toDate(right.createdAt)?.getTime() ?? 0;
      const leftTime = toDate(left.createdAt)?.getTime() ?? 0;
      return rightTime - leftTime || right.id - left.id;
    });
    const keeper = orderedByIndex[0];
    const canonical = orderedByFreshness[0];
    if (canonical.id !== keeper.id) {
      await updateCommitteeIntelSegment(session, keeper, {
        capturedAt: toIsoString(canonical.capturedAt) ?? void 0,
        startedAtSecond: canonical.startedAtSecond,
        endedAtSecond: canonical.endedAtSecond,
        speakerName: canonical.speakerName ?? void 0,
        speakerRole: canonical.speakerRole,
        affiliation: canonical.affiliation ?? void 0,
        transcriptText: canonical.transcriptText,
        invited: canonical.invited,
        metadata: getMetadataRecord(canonical.metadataJson)
      });
    }
    const duplicateIds = group.filter((segment) => segment.id !== keeper.id).map((segment) => segment.id);
    if (duplicateIds.length === 0) continue;
    await policyIntelDb.delete(committeeIntelSignals).where(and11(
      eq19(committeeIntelSignals.sessionId, session.id),
      inArray3(committeeIntelSignals.segmentId, duplicateIds)
    ));
    await policyIntelDb.delete(committeeIntelSegments).where(inArray3(committeeIntelSegments.id, duplicateIds));
  }
}
function buildRollCall(segments, committeeMemberMap) {
  const rollCallPattern = /^(?:Senator|Sen\.?|Dean|Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+([\w'-]+)\??\s*(Present|Here)\b/i;
  const entries = [];
  const seen = /* @__PURE__ */ new Set();
  for (const segment of segments) {
    const match = segment.transcriptText.match(rollCallPattern);
    if (!match) continue;
    const lastName = match[1];
    const response = match[2];
    const normalizedLast = normalizeText(lastName);
    if (seen.has(normalizedLast)) continue;
    seen.add(normalizedLast);
    const member = findMemberByLastName(lastName, committeeMemberMap);
    entries.push({
      name: member?.name ?? `Senator ${lastName}`,
      response: response.charAt(0).toUpperCase() + response.slice(1).toLowerCase(),
      matched: member !== null,
      stakeholderId: member?.stakeholderId ?? null,
      party: member?.party ?? null,
      role: member?.role ?? null
    });
  }
  return entries;
}
function buildAnalysis(session, segments, signals, committeeMemberMap) {
  if (segments.length === 0) {
    return buildEmptyAnalysis(session, 0, 0);
  }
  const issueLabels = buildIssueLabelMap(session);
  const segmentById = new Map(segments.map((segment) => [segment.id, segment]));
  const issueMap = /* @__PURE__ */ new Map();
  for (const signal of signals) {
    const current = issueMap.get(signal.issueTag) ?? {
      issueTag: signal.issueTag,
      label: issueLabels.get(signal.issueTag) ?? labelFromTag(signal.issueTag),
      mentionCount: 0,
      supportCount: 0,
      opposeCount: 0,
      questioningCount: 0,
      neutralCount: 0,
      keyEntities: []
    };
    current.mentionCount += 1;
    if (signal.position === "support") current.supportCount += 1;
    else if (signal.position === "oppose") current.opposeCount += 1;
    else if (signal.position === "questioning") current.questioningCount += 1;
    else current.neutralCount += 1;
    if (!current.keyEntities.includes(signal.entityName)) {
      current.keyEntities.push(signal.entityName);
    }
    issueMap.set(signal.issueTag, current);
  }
  const issueCoverage = Array.from(issueMap.values()).map((issue) => ({ ...issue, keyEntities: issue.keyEntities.slice(0, 4) })).sort((left, right) => right.mentionCount - left.mentionCount);
  const keyMoments = segments.filter((segment) => segment.importance >= 35).sort((left, right) => right.importance - left.importance || left.segmentIndex - right.segmentIndex).slice(0, 12).map((segment) => ({
    segmentId: segment.id,
    timestampLabel: formatTimestampLabel(segment.startedAtSecond, segment.capturedAt),
    timestampSecond: segment.startedAtSecond ?? null,
    speakerName: segment.speakerName,
    speakerRole: segment.speakerRole,
    summary: segment.summary ?? summarizeSegment(segment.speakerName, segment.affiliation, segment.issueTagsJson, segment.position, issueLabels),
    importance: segment.importance,
    position: segment.position,
    issueTags: segment.issueTagsJson
  }));
  const entityMap = /* @__PURE__ */ new Map();
  for (const signal of signals) {
    const normalizedName = normalizeText(signal.entityName);
    const key = `${normalizedName}|${signal.entityType}|${normalizeText(signal.affiliation)}`;
    const segment = signal.segmentId ? segmentById.get(signal.segmentId) ?? null : null;
    const current = entityMap.get(key) ?? {
      entityName: signal.entityName,
      entityType: signal.entityType,
      stakeholderId: signal.stakeholderId ?? null,
      affiliation: signal.affiliation ?? null,
      mentionCount: 0,
      invited: segment?.invited ?? false,
      positions: /* @__PURE__ */ new Map()
    };
    current.mentionCount += 1;
    current.invited = current.invited || Boolean(segment?.invited);
    if (current.stakeholderId === null && signal.stakeholderId !== null) {
      current.stakeholderId = signal.stakeholderId;
    }
    const issueEntry = current.positions.get(signal.issueTag) ?? {
      issueTag: signal.issueTag,
      label: issueLabels.get(signal.issueTag) ?? labelFromTag(signal.issueTag),
      counts: {
        support: 0,
        oppose: 0,
        questioning: 0,
        neutral: 0,
        monitoring: 0,
        unknown: 0
      },
      mentionCount: 0,
      confidenceTotal: 0,
      confidenceMax: 0
    };
    issueEntry.counts[signal.position] += 1;
    issueEntry.mentionCount += 1;
    issueEntry.confidenceTotal += signal.confidence;
    issueEntry.confidenceMax = Math.max(issueEntry.confidenceMax, signal.confidence);
    current.positions.set(signal.issueTag, issueEntry);
    entityMap.set(key, current);
  }
  const toEntitySummary = (entry) => {
    const positions = Array.from(entry.positions.values()).map((positionEntry) => {
      const ordered = Object.entries(positionEntry.counts).sort((left, right) => right[1] - left[1]);
      return {
        issueTag: positionEntry.issueTag,
        label: positionEntry.label,
        position: ordered[0]?.[0] ?? "unknown",
        confidence: Number((positionEntry.confidenceTotal / Math.max(positionEntry.mentionCount, 1)).toFixed(2)),
        mentionCount: positionEntry.mentionCount
      };
    }).sort((left, right) => right.mentionCount - left.mentionCount);
    return {
      entityName: entry.entityName,
      entityType: entry.entityType,
      stakeholderId: entry.stakeholderId,
      affiliation: entry.affiliation,
      mentionCount: entry.mentionCount,
      invited: entry.invited,
      primaryIssues: positions.slice(0, 3).map((position) => position.label),
      positions
    };
  };
  const entitySummaries = Array.from(entityMap.values()).map(toEntitySummary).sort((left, right) => right.mentionCount - left.mentionCount);
  const electedFocus = entitySummaries.filter((entry) => entry.entityType === "legislator" || committeeMemberMap.has(normalizeText(entry.entityName))).slice(0, 10);
  const activeWitnesses = entitySummaries.filter((entry) => entry.entityType !== "legislator").slice(0, 10);
  const witnessRankings = buildWitnessRankings(activeWitnesses, keyMoments);
  const postHearingRecap = buildPostHearingRecap(session, issueCoverage, electedFocus, witnessRankings, segments);
  const positionMap = entitySummaries.flatMap((entry) => entry.positions.map((position) => ({
    entityName: entry.entityName,
    entityType: entry.entityType,
    stakeholderId: entry.stakeholderId,
    affiliation: entry.affiliation,
    issueTag: position.issueTag,
    label: position.label,
    position: position.position,
    confidence: position.confidence,
    mentionCount: position.mentionCount,
    invited: entry.invited
  }))).sort((left, right) => right.mentionCount - left.mentionCount).slice(0, 40);
  const rollCall = buildRollCall(segments, committeeMemberMap);
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    summary: buildAnalysisSummary(session, issueCoverage, electedFocus, activeWitnesses, segments.length),
    totalSegments: segments.length,
    totalSignals: signals.length,
    trackedEntities: entitySummaries.length,
    invitedWitnessCount: activeWitnesses.filter((entry) => entry.invited).length,
    rollCall,
    issueCoverage,
    keyMoments,
    electedFocus,
    activeWitnesses,
    witnessRankings,
    postHearingRecap,
    positionMap
  };
}
async function listCommitteeIntelSessions(filters) {
  const conditions = [];
  if (filters?.workspaceId) conditions.push(eq19(committeeIntelSessions.workspaceId, filters.workspaceId));
  if (filters?.hearingId) conditions.push(eq19(committeeIntelSessions.hearingId, filters.hearingId));
  if (filters?.status) conditions.push(eq19(committeeIntelSessions.status, filters.status));
  if (filters?.from) {
    const fromDate = toDate(filters.from);
    if (fromDate) conditions.push(gte9(committeeIntelSessions.hearingDate, fromDate));
  }
  return policyIntelDb.select().from(committeeIntelSessions).where(conditions.length > 0 ? and11(...conditions) : void 0).orderBy(asc(committeeIntelSessions.hearingDate), asc(committeeIntelSessions.id));
}
async function createCommitteeIntelSessionFromHearing(request) {
  const [hearingRow] = await policyIntelDb.select({
    hearing: hearingEvents,
    agendaUrl: sourceDocuments.sourceUrl
  }).from(hearingEvents).leftJoin(sourceDocuments, eq19(sourceDocuments.id, hearingEvents.sourceDocumentId)).where(eq19(hearingEvents.id, request.hearingId));
  if (!hearingRow) {
    throw new Error(`Hearing ${request.hearingId} not found`);
  }
  const [existing] = await policyIntelDb.select({ id: committeeIntelSessions.id }).from(committeeIntelSessions).where(and11(
    eq19(committeeIntelSessions.workspaceId, request.workspaceId),
    eq19(committeeIntelSessions.hearingId, request.hearingId)
  ));
  if (existing) {
    return updateCommitteeIntelSession(existing.id, {
      title: request.title,
      focusTopics: request.focusTopics,
      interimCharges: request.interimCharges,
      clientContext: request.clientContext,
      monitoringNotes: request.monitoringNotes,
      videoUrl: request.videoUrl,
      agendaUrl: request.agendaUrl ?? hearingRow.agendaUrl ?? null,
      transcriptSourceType: request.transcriptSourceType,
      transcriptSourceUrl: request.transcriptSourceUrl,
      autoIngestEnabled: request.autoIngestEnabled,
      autoIngestIntervalSeconds: request.autoIngestIntervalSeconds,
      status: request.status
    });
  }
  const transcriptSourceType = request.transcriptSourceType ?? "manual";
  const transcriptSourceUrl = resolveCandidateTranscriptSourceUrl(
    transcriptSourceType,
    request.transcriptSourceUrl,
    request.videoUrl
  );
  const autoIngestEnabled = Boolean(request.autoIngestEnabled);
  const autoIngestIntervalSeconds = clamp(request.autoIngestIntervalSeconds ?? 120, 30, 3600);
  const autoIngestStatus = resolveAutoIngestStatus(transcriptSourceType, transcriptSourceUrl, autoIngestEnabled, "idle");
  const [created] = await policyIntelDb.insert(committeeIntelSessions).values({
    workspaceId: request.workspaceId,
    hearingId: hearingRow.hearing.id,
    title: request.title?.trim() || `${hearingRow.hearing.committee} Committee Intelligence`,
    committee: hearingRow.hearing.committee,
    chamber: hearingRow.hearing.chamber,
    hearingDate: hearingRow.hearing.hearingDate,
    status: request.status ?? "planned",
    agendaUrl: request.agendaUrl ?? hearingRow.agendaUrl ?? null,
    videoUrl: request.videoUrl ?? null,
    transcriptSourceType,
    transcriptSourceUrl,
    autoIngestEnabled,
    autoIngestIntervalSeconds,
    autoIngestStatus,
    focusTopicsJson: cleanList(request.focusTopics),
    interimChargesJson: cleanList(request.interimCharges),
    clientContext: request.clientContext?.trim() || null,
    monitoringNotes: request.monitoringNotes?.trim() || null,
    analyticsJson: {}
  }).returning();
  return refreshCommitteeIntelSession(created.id);
}
async function getCommitteeIntelSession(sessionId) {
  return loadSessionDetail(sessionId);
}
async function deleteCommitteeIntelSession(sessionId) {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }
  await policyIntelDb.delete(committeeIntelSessions).where(eq19(committeeIntelSessions.id, sessionId));
  return { ok: true, sessionId };
}
async function resetCommitteeIntelSession(sessionId) {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }
  const [segments, signals] = await Promise.all([
    loadSessionSegments(sessionId),
    loadSessionSignals(sessionId)
  ]);
  await policyIntelDb.delete(committeeIntelSignals).where(eq19(committeeIntelSignals.sessionId, sessionId));
  await policyIntelDb.delete(committeeIntelSegments).where(eq19(committeeIntelSegments.sessionId, sessionId));
  await policyIntelDb.update(committeeIntelSessions).set({
    status: "planned",
    autoIngestStatus: resolveAutoIngestStatus(
      core.session.transcriptSourceType,
      resolveTranscriptSourceUrl(core.session),
      core.session.autoIngestEnabled,
      "idle"
    ),
    autoIngestError: null,
    lastAutoIngestedAt: null,
    lastAutoIngestCursor: null,
    liveSummary: null,
    analyticsJson: {},
    lastAnalyzedAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq19(committeeIntelSessions.id, sessionId));
  const detail = await refreshCommitteeIntelSession(sessionId);
  return {
    detail,
    reset: {
      sessionId,
      clearedSegments: segments.length,
      clearedSignals: signals.length,
      resetAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function rebuildCommitteeIntelSession(sessionId) {
  const reset = await resetCommitteeIntelSession(sessionId);
  const synced = await syncCommitteeIntelTranscriptFeed(sessionId);
  return {
    detail: synced.detail,
    reset: reset.reset,
    sync: synced.sync
  };
}
async function updateCommitteeIntelSession(sessionId, patch) {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }
  const nextTranscriptSourceType = patch.transcriptSourceType ?? core.session.transcriptSourceType;
  const nextVideoUrl = patch.videoUrl === void 0 ? core.session.videoUrl : patch.videoUrl;
  const nextTranscriptSourceUrl = patch.transcriptSourceUrl === void 0 ? core.session.transcriptSourceUrl : resolveCandidateTranscriptSourceUrl(nextTranscriptSourceType, patch.transcriptSourceUrl, nextVideoUrl);
  const nextAutoIngestEnabled = patch.autoIngestEnabled ?? core.session.autoIngestEnabled;
  const nextAutoIngestIntervalSeconds = clamp(
    patch.autoIngestIntervalSeconds ?? core.session.autoIngestIntervalSeconds,
    30,
    3600
  );
  const nextAutoIngestStatus = resolveAutoIngestStatus(
    nextTranscriptSourceType,
    nextTranscriptSourceUrl,
    nextAutoIngestEnabled,
    core.session.autoIngestStatus
  );
  await policyIntelDb.update(committeeIntelSessions).set({
    title: patch.title?.trim() || core.session.title,
    status: patch.status ?? core.session.status,
    agendaUrl: patch.agendaUrl === void 0 ? core.session.agendaUrl : patch.agendaUrl,
    videoUrl: nextVideoUrl,
    transcriptSourceType: nextTranscriptSourceType,
    transcriptSourceUrl: nextTranscriptSourceUrl,
    autoIngestEnabled: nextAutoIngestEnabled,
    autoIngestIntervalSeconds: nextAutoIngestIntervalSeconds,
    autoIngestStatus: nextAutoIngestStatus,
    autoIngestError: nextAutoIngestStatus === "error" ? core.session.autoIngestError : null,
    focusTopicsJson: patch.focusTopics ? cleanList(patch.focusTopics) : core.session.focusTopicsJson,
    interimChargesJson: patch.interimCharges ? cleanList(patch.interimCharges) : core.session.interimChargesJson,
    clientContext: patch.clientContext === void 0 ? core.session.clientContext : patch.clientContext,
    monitoringNotes: patch.monitoringNotes === void 0 ? core.session.monitoringNotes : patch.monitoringNotes,
    liveSummary: patch.liveSummary === void 0 ? core.session.liveSummary : patch.liveSummary,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq19(committeeIntelSessions.id, sessionId));
  return refreshCommitteeIntelSession(sessionId);
}
async function addCommitteeIntelSegment(sessionId, request) {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }
  const transcriptText = request.transcriptText.trim();
  if (!transcriptText) {
    throw new Error("transcriptText is required");
  }
  await insertCommitteeIntelSegments(core.session, [{
    ...request,
    transcriptText
  }]);
  if (core.session.status === "planned") {
    await policyIntelDb.update(committeeIntelSessions).set({
      status: "monitoring",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq19(committeeIntelSessions.id, sessionId));
  }
  if (core.hearing && core.hearing.status === "scheduled") {
    await policyIntelDb.update(hearingEvents).set({ status: "in_progress", updatedAt: /* @__PURE__ */ new Date() }).where(eq19(hearingEvents.id, core.hearing.id));
  }
  return refreshCommitteeIntelSession(sessionId);
}
async function syncCommitteeIntelTranscriptFeed(sessionId) {
  const attemptStartedAt = /* @__PURE__ */ new Date();
  const attemptedAt = attemptStartedAt.toISOString();
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }
  if (core.session.transcriptSourceType === "manual") {
    const message = "This session does not have an automatic transcript source configured";
    await policyIntelDb.update(committeeIntelSessions).set({
      autoIngestStatus: core.session.autoIngestEnabled ? "error" : "idle",
      autoIngestError: message,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq19(committeeIntelSessions.id, sessionId));
    throw new Error(message);
  }
  await policyIntelDb.update(committeeIntelSessions).set({
    autoIngestStatus: "syncing",
    autoIngestError: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq19(committeeIntelSessions.id, sessionId));
  try {
    let resolvedSource = null;
    let parsedEntries = [];
    let cursor = core.session.lastAutoIngestCursor ?? null;
    resolvedSource = await resolveTranscriptSyncSource(core.session);
    if (resolvedSource.sourceMode === "feed") {
      if (!resolvedSource.sourceUrl || !resolvedSource.feedType) {
        throw new Error("Resolved transcript feed is missing a fetchable URL");
      }
      const response = await fetch(resolvedSource.sourceUrl, {
        headers: {
          Accept: "text/vtt,application/json,text/plain;q=0.9,*/*;q=0.5"
        }
      });
      if (!response.ok) {
        throw new Error(`Transcript feed request failed with status ${response.status}`);
      }
      const content = await response.text();
      parsedEntries = parseTranscriptFeed(content, resolvedSource.feedType, core.session);
      cursor = parsedEntries.at(-1)?.cursorValue ?? cursor;
    } else {
      if (!resolvedSource.officialSource) {
        throw new Error("Official source resolution did not return a playable source");
      }
      const transcription = await buildOfficialTranscriptEntries(core.session, resolvedSource.officialSource);
      parsedEntries = transcription.entries;
      cursor = transcription.cursor ?? cursor;
    }
    const upsertResult = await applyTranscriptEntries(core.session, parsedEntries);
    const persistedVideoUrl = core.session.videoUrl ?? cleanUrl(resolvedSource.officialSource?.officialPageUrl) ?? cleanUrl(resolvedSource.officialSource?.videoStreamUrl) ?? null;
    const persistedTranscriptSourceUrl = core.session.transcriptSourceType === "official" ? core.session.transcriptSourceUrl ?? cleanUrl(resolvedSource.officialSource?.transcriptUrl) ?? null : core.session.transcriptSourceUrl;
    await policyIntelDb.update(committeeIntelSessions).set({
      status: core.session.status === "planned" && (upsertResult.ingestedSegments > 0 || upsertResult.updatedSegments > 0) ? "monitoring" : core.session.status,
      videoUrl: persistedVideoUrl,
      transcriptSourceUrl: persistedTranscriptSourceUrl,
      autoIngestStatus: resolveAutoIngestStatus(core.session.transcriptSourceType, resolvedSource.sourceUrl, core.session.autoIngestEnabled, "ready"),
      autoIngestError: null,
      lastAutoIngestedAt: /* @__PURE__ */ new Date(),
      lastAutoIngestCursor: cursor,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq19(committeeIntelSessions.id, sessionId));
    const detail = await refreshCommitteeIntelSession(sessionId);
    if (core.hearing && core.hearing.status === "scheduled" && (upsertResult.ingestedSegments > 0 || upsertResult.updatedSegments > 0)) {
      await policyIntelDb.update(hearingEvents).set({ status: "in_progress", updatedAt: /* @__PURE__ */ new Date() }).where(eq19(hearingEvents.id, core.hearing.id));
    }
    const completedAtDate = /* @__PURE__ */ new Date();
    const completedAt = completedAtDate.toISOString();
    const durationMs = completedAtDate.getTime() - attemptStartedAt.getTime();
    const nextWindow = getNextAutoIngestWindow(detail.session);
    return {
      detail,
      sync: {
        sessionId,
        sourceType: resolvedSource.sourceType,
        sourceMode: resolvedSource.sourceMode,
        sourceUrl: resolvedSource.sourceUrl,
        sourceLabel: resolvedSource.sourceLabel,
        resolvedFrom: resolvedSource.resolvedFrom,
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
        totalParsed: parsedEntries.length,
        ingestedSegments: upsertResult.ingestedSegments,
        updatedSegments: upsertResult.updatedSegments,
        duplicateSegments: upsertResult.duplicateSegments,
        cursor,
        status: detail.session.autoIngestStatus,
        outcome: "synced",
        retryable: false,
        waitReason: null,
        attemptedAt,
        completedAt,
        durationMs,
        nextEligibleAutoIngestAt: nextWindow.nextEligibleAutoIngestAt,
        nextEligibleAutoIngestInSeconds: nextWindow.nextEligibleAutoIngestInSeconds
      }
    };
  } catch (error) {
    const message = safeErrorMessage(error, "Transcript synchronization failed");
    if (isRetryableOfficialSourceError(core.session, message)) {
      const fallbackSourceUrl = resolveTranscriptSourceUrl(core.session);
      const nextAutoIngestStatus = resolveAutoIngestStatus(
        core.session.transcriptSourceType,
        fallbackSourceUrl,
        core.session.autoIngestEnabled,
        "ready"
      );
      await policyIntelDb.update(committeeIntelSessions).set({
        autoIngestStatus: nextAutoIngestStatus,
        autoIngestError: null,
        lastAutoIngestedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq19(committeeIntelSessions.id, sessionId));
      const detail = await refreshCommitteeIntelSession(sessionId);
      const completedAtDate = /* @__PURE__ */ new Date();
      const completedAt = completedAtDate.toISOString();
      const durationMs = completedAtDate.getTime() - attemptStartedAt.getTime();
      const nextWindow = getNextAutoIngestWindow(detail.session);
      return {
        detail,
        sync: {
          sessionId,
          sourceType: core.session.transcriptSourceType,
          sourceMode: "audio_transcription",
          sourceUrl: fallbackSourceUrl,
          sourceLabel: core.session.title,
          resolvedFrom: fallbackSourceUrl,
          fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
          totalParsed: 0,
          ingestedSegments: 0,
          updatedSegments: 0,
          duplicateSegments: 0,
          cursor: core.session.lastAutoIngestCursor ?? null,
          status: detail.session.autoIngestStatus,
          outcome: "waiting_source",
          retryable: true,
          waitReason: classifyOfficialSourceWaitReason(message),
          attemptedAt,
          completedAt,
          durationMs,
          nextEligibleAutoIngestAt: nextWindow.nextEligibleAutoIngestAt,
          nextEligibleAutoIngestInSeconds: nextWindow.nextEligibleAutoIngestInSeconds,
          error: message
        }
      };
    }
    await policyIntelDb.update(committeeIntelSessions).set({
      autoIngestStatus: "error",
      autoIngestError: message,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq19(committeeIntelSessions.id, sessionId));
    throw new Error(message);
  }
}
async function syncCommitteeIntelAutoIngestSessions() {
  const startedAtDate = /* @__PURE__ */ new Date();
  const rows = await policyIntelDb.select().from(committeeIntelSessions).where(eq19(committeeIntelSessions.autoIngestEnabled, true)).orderBy(asc(committeeIntelSessions.hearingDate), asc(committeeIntelSessions.id));
  let sessionsSynced = 0;
  let sessionsWaiting = 0;
  let sessionsErrored = 0;
  let sessionsWithChanges = 0;
  let ingestedSegments = 0;
  let updatedSegments = 0;
  let sessionsSkipped = 0;
  const waitReasonCounts = {};
  const errors = [];
  for (const session of rows) {
    if (session.status === "completed") {
      sessionsSkipped += 1;
      continue;
    }
    const lastSync = toDate(session.lastAutoIngestedAt);
    const intervalMs = Math.max(session.autoIngestIntervalSeconds, 30) * 1e3;
    if (lastSync && Date.now() - lastSync.getTime() < intervalMs) {
      sessionsSkipped += 1;
      continue;
    }
    try {
      const result = await syncCommitteeIntelTranscriptFeed(session.id);
      if (result.sync.outcome === "waiting_source") {
        sessionsWaiting += 1;
        const waitReason = result.sync.waitReason ?? "unknown";
        waitReasonCounts[waitReason] = (waitReasonCounts[waitReason] ?? 0) + 1;
        continue;
      }
      sessionsSynced += 1;
      ingestedSegments += result.sync.ingestedSegments;
      updatedSegments += result.sync.updatedSegments;
      if (result.sync.ingestedSegments > 0 || result.sync.updatedSegments > 0) {
        sessionsWithChanges += 1;
      }
    } catch (error) {
      sessionsErrored += 1;
      errors.push(`session ${session.id}: ${safeErrorMessage(error, "sync failed")}`);
    }
  }
  const completedAtDate = /* @__PURE__ */ new Date();
  return {
    startedAt: startedAtDate.toISOString(),
    completedAt: completedAtDate.toISOString(),
    durationMs: completedAtDate.getTime() - startedAtDate.getTime(),
    sessionsChecked: rows.length,
    sessionsSynced,
    sessionsWaiting,
    sessionsErrored,
    sessionsWithChanges,
    sessionsSkipped,
    ingestedSegments,
    updatedSegments,
    waitReasonCounts,
    errors: errors.length,
    errorMessages: errors.slice(0, 10)
  };
}
async function generateCommitteeIntelPostHearingRecap(sessionId) {
  const detail = await refreshCommitteeIntelSession(sessionId);
  if (detail.analysis.postHearingRecap) {
    return detail.analysis.postHearingRecap;
  }
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    headline: `${detail.session.committee} recap is not ready yet.`,
    overview: "No transcript segments have been ingested for this session yet.",
    issueHighlights: [],
    memberPressurePoints: [],
    witnessLeaderboard: [],
    agencyCommitments: [],
    followUpActions: ["Enable automatic transcript ingestion or add transcript segments before generating a recap."]
  };
}
async function refreshCommitteeIntelSession(sessionId) {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }
  const { committeeMemberMap, stakeholderByName, stakeholderByOrganization } = await loadStakeholderContext(core.session);
  const rawSegments = await loadSessionSegments(sessionId);
  const updatedSegments = await Promise.all(rawSegments.map(async (segment) => {
    const derived = deriveSegment(segment, core.session, committeeMemberMap);
    const [updated] = await policyIntelDb.update(committeeIntelSegments).set({
      speakerName: derived.speakerName,
      speakerRole: derived.speakerRole,
      summary: derived.summary,
      issueTagsJson: derived.issueTagsJson,
      position: derived.position,
      importance: derived.importance,
      invited: derived.invited,
      metadataJson: derived.metadataJson
    }).where(eq19(committeeIntelSegments.id, segment.id)).returning();
    return updated ?? { ...segment, ...derived };
  }));
  await policyIntelDb.delete(committeeIntelSignals).where(eq19(committeeIntelSignals.sessionId, sessionId));
  const signalPayloads = updatedSegments.flatMap((segment) => {
    const entityName = selectEntityName(segment, core.session.committee);
    if (!entityName || segment.issueTagsJson.length === 0) return [];
    const entityType = resolveEntityType(segment.speakerRole, segment.speakerName, segment.affiliation, committeeMemberMap);
    const stakeholderId = resolveStakeholderId(
      entityName,
      segment.affiliation,
      committeeMemberMap,
      stakeholderByName,
      stakeholderByOrganization
    );
    const evidenceQuote = segment.transcriptText.replace(/\s+/g, " ").trim().slice(0, 320);
    const confidence = Number(Math.min(0.95, 0.45 + segment.importance / 120).toFixed(2));
    return segment.issueTagsJson.map((issueTag) => ({
      sessionId,
      segmentId: segment.id,
      stakeholderId,
      entityName,
      entityType,
      affiliation: segment.affiliation,
      issueTag,
      position: segment.position,
      confidence,
      evidenceQuote,
      sourceKind: "transcript"
    }));
  });
  const insertedSignals = signalPayloads.length > 0 ? await policyIntelDb.insert(committeeIntelSignals).values(signalPayloads).returning() : [];
  const analysis = buildAnalysis(core.session, updatedSegments, insertedSignals, committeeMemberMap);
  const [updatedSession] = await policyIntelDb.update(committeeIntelSessions).set({
    liveSummary: analysis.summary,
    analyticsJson: analysis,
    lastAnalyzedAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq19(committeeIntelSessions.id, sessionId)).returning();
  if (core.hearing && core.hearing.status === "scheduled" && updatedSegments.length > 0) {
    await policyIntelDb.update(hearingEvents).set({ status: "in_progress", updatedAt: /* @__PURE__ */ new Date() }).where(eq19(hearingEvents.id, core.hearing.id));
  }
  return {
    session: updatedSession,
    hearing: core.hearing,
    segments: updatedSegments,
    signals: insertedSignals,
    analysis
  };
}
async function generateCommitteeIntelFocusedBrief(sessionId, issue) {
  const detail = await refreshCommitteeIntelSession(sessionId);
  const normalizedIssue = normalizeText(issue);
  const matchedIssues = detail.analysis.issueCoverage.filter((item) => {
    const normalizedLabel = normalizeText(item.label);
    return normalizedLabel.includes(normalizedIssue) || item.issueTag.includes(slugifyIssue(issue));
  });
  const matchedIssueTags = matchedIssues.length > 0 ? matchedIssues.map((item) => item.issueTag) : detail.analysis.issueCoverage.slice(0, 1).map((item) => item.issueTag);
  const topMoments = detail.analysis.keyMoments.filter((moment) => moment.issueTags.some((tag) => matchedIssueTags.includes(tag))).slice(0, 6);
  const relevantPositions = detail.analysis.positionMap.filter((row) => matchedIssueTags.includes(row.issueTag));
  const supporters = relevantPositions.filter((row) => row.position === "support").slice(0, 8);
  const opponents = relevantPositions.filter((row) => row.position === "oppose" || row.position === "questioning").slice(0, 8);
  const electedFocus = detail.analysis.electedFocus.filter((entry) => entry.positions.some((position) => matchedIssueTags.includes(position.issueTag))).slice(0, 6);
  const activeWitnesses = detail.analysis.activeWitnesses.filter((entry) => entry.positions.some((position) => matchedIssueTags.includes(position.issueTag))).slice(0, 6);
  const issueLabel = matchedIssues[0]?.label ?? issue;
  const summaryParts = [
    `${detail.session.committee} is tracking ${issueLabel}.`,
    supporters.length > 0 ? `Support signals are led by ${supporters.slice(0, 3).map((row) => row.entityName).join(", ")}.` : `No clear support bloc has surfaced yet.`,
    opponents.length > 0 ? `Concern or resistance is coming from ${opponents.slice(0, 3).map((row) => row.entityName).join(", ")}.` : `No direct opposition or skeptical questioning has been isolated yet.`,
    electedFocus.length > 0 ? `${electedFocus.slice(0, 2).map((entry) => entry.entityName).join(" and ")} are the committee members most engaged on this issue.` : `Member questioning on this issue has not been isolated yet.`
  ];
  return {
    issue: issueLabel,
    matchedIssueTags,
    summary: summaryParts.join(" "),
    topMoments,
    supporters,
    opponents,
    electedFocus,
    activeWitnesses,
    recommendations: buildRecommendations(
      issueLabel,
      supporters,
      opponents,
      electedFocus,
      activeWitnesses,
      toIsoString(detail.session.hearingDate)
    )
  };
}

// server/policy-intel/scheduler.ts
var log7 = createLogger("scheduler");
var jobs = /* @__PURE__ */ new Map();
var runningFlags = /* @__PURE__ */ new Map();
var runningSince = /* @__PURE__ */ new Map();
var lastRuns = /* @__PURE__ */ new Map();
var jobTelemetry = /* @__PURE__ */ new Map();
var history = [];
var persistedHistory = [];
var MAX_HISTORY = 50;
var MAX_PERSISTED_HISTORY = 500;
var DEFAULT_JOB_TIMEOUT_MS = Number(process.env.SCHEDULER_JOB_TIMEOUT_MS || 20 * 60 * 1e3);
var DEFAULT_INTEL_BRIEFING_TIMEOUT_MS = Number(
  process.env.SCHEDULER_INTEL_BRIEFING_TIMEOUT_MS || 15 * 60 * 1e3
);
var DEFAULT_COMMITTEE_INTEL_SYNC_TIMEOUT_MS = Number(
  process.env.SCHEDULER_COMMITTEE_INTEL_SYNC_TIMEOUT_MS || 5 * 60 * 1e3
);
var schedulerEnabled = false;
var schedulerStartedAt = null;
var persistenceInitialized = false;
var persistenceEnabled = false;
function pushHistory(record) {
  history.unshift(record);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  lastRuns.set(record.jobName, record);
  const telemetry = jobTelemetry.get(record.jobName) ?? {
    totalRuns: 0,
    successRuns: 0,
    errorRuns: 0,
    skippedWhileRunning: 0,
    consecutiveFailures: 0,
    lastSuccessAt: null,
    lastErrorAt: null
  };
  telemetry.totalRuns += 1;
  if (record.status === "success") {
    telemetry.successRuns += 1;
    telemetry.consecutiveFailures = 0;
    telemetry.lastSuccessAt = record.finishedAt;
  } else {
    telemetry.errorRuns += 1;
    telemetry.consecutiveFailures += 1;
    telemetry.lastErrorAt = record.finishedAt;
  }
  jobTelemetry.set(record.jobName, telemetry);
}
function mapPersistedRow(row) {
  const toIso = (value) => {
    if (value instanceof Date) return value.toISOString();
    const text3 = String(value ?? "");
    const parsed = new Date(text3);
    return Number.isNaN(parsed.getTime()) ? text3 : parsed.toISOString();
  };
  const summaryRaw = row.summary_json;
  const summary = summaryRaw && typeof summaryRaw === "object" && !Array.isArray(summaryRaw) ? summaryRaw : {};
  return {
    jobName: String(row.job_name ?? "unknown"),
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
    durationMs: Number(row.duration_ms ?? 0),
    status: row.status === "error" ? "error" : "success",
    summary,
    error: row.error ? String(row.error) : void 0
  };
}
function mergeHistoryRecords() {
  const deduped = /* @__PURE__ */ new Map();
  for (const record of [...history, ...persistedHistory]) {
    const key = `${record.jobName}|${record.startedAt}|${record.finishedAt}`;
    if (!deduped.has(key)) {
      deduped.set(key, record);
    }
  }
  return Array.from(deduped.values()).sort((left, right) => {
    const rightTs = Date.parse(right.finishedAt) || 0;
    const leftTs = Date.parse(left.finishedAt) || 0;
    return rightTs - leftTs;
  }).slice(0, MAX_PERSISTED_HISTORY);
}
async function initializeHistoryPersistence() {
  if (persistenceInitialized) return;
  persistenceInitialized = true;
  try {
    await queryClient.unsafe(`
      create table if not exists policy_intel_scheduler_runs (
        id serial primary key,
        job_name varchar(128) not null,
        started_at timestamptz not null,
        finished_at timestamptz not null,
        duration_ms integer not null,
        status varchar(16) not null,
        summary_json jsonb not null default '{}'::jsonb,
        error text,
        created_at timestamptz not null default now()
      )
    `);
    await queryClient.unsafe(`
      create index if not exists policy_intel_scheduler_runs_finished_idx
      on policy_intel_scheduler_runs (finished_at desc)
    `);
    await queryClient.unsafe(`
      create index if not exists policy_intel_scheduler_runs_job_finished_idx
      on policy_intel_scheduler_runs (job_name, finished_at desc)
    `);
    const rows = await queryClient.unsafe(
      `
      select
        job_name,
        started_at,
        finished_at,
        duration_ms,
        status,
        summary_json,
        error
      from policy_intel_scheduler_runs
      order by finished_at desc
      limit $1
      `,
      [MAX_PERSISTED_HISTORY]
    );
    persistedHistory.length = 0;
    persistedHistory.push(...rows.map((row) => mapPersistedRow(row)));
    persistenceEnabled = true;
  } catch (error) {
    persistenceEnabled = false;
    log7.warn({ err: error?.message ?? String(error) }, "persistent history disabled");
  }
}
async function persistHistoryRecord(record) {
  if (!persistenceEnabled) return;
  try {
    await queryClient.unsafe(
      `
      insert into policy_intel_scheduler_runs (
        job_name,
        started_at,
        finished_at,
        duration_ms,
        status,
        summary_json,
        error
      )
      values ($1, $2, $3, $4, $5, $6::jsonb, $7)
      `,
      [
        record.jobName,
        record.startedAt,
        record.finishedAt,
        record.durationMs,
        record.status,
        JSON.stringify(record.summary ?? {}),
        record.error ?? null
      ]
    );
    persistedHistory.unshift(record);
    if (persistedHistory.length > MAX_PERSISTED_HISTORY) {
      persistedHistory.length = MAX_PERSISTED_HISTORY;
    }
  } catch (error) {
    log7.warn({ err: error?.message ?? String(error) }, "failed to persist run history");
  }
}
function getOrCreateTelemetry(jobName) {
  const existing = jobTelemetry.get(jobName);
  if (existing) return existing;
  const created = {
    totalRuns: 0,
    successRuns: 0,
    errorRuns: 0,
    skippedWhileRunning: 0,
    consecutiveFailures: 0,
    lastSuccessAt: null,
    lastErrorAt: null
  };
  jobTelemetry.set(jobName, created);
  return created;
}
function getNextRun(cronExpr) {
  try {
    const interval = cron.validate(cronExpr) ? cronExpr : null;
    if (!interval) return null;
    return `cron: ${cronExpr}`;
  } catch {
    return null;
  }
}
function normaliseTimeoutMs(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
async function withTimeout(jobName, timeoutMs, runner) {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${jobName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    timeoutHandle.unref?.();
  });
  try {
    return await Promise.race([runner(), timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}
async function executeJob(jobName, runner, timeoutMs = DEFAULT_JOB_TIMEOUT_MS) {
  if (!persistenceInitialized) {
    await initializeHistoryPersistence();
  }
  if (runningFlags.get(jobName)) {
    const telemetry = getOrCreateTelemetry(jobName);
    telemetry.skippedWhileRunning += 1;
    log7.info({ job: jobName }, "already running, skipping");
    return;
  }
  runningFlags.set(jobName, true);
  const start2 = Date.now();
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  runningSince.set(jobName, startedAt);
  try {
    log7.info({ job: jobName }, "starting");
    const result = await withTimeout(jobName, timeoutMs, runner);
    const record = {
      jobName,
      startedAt,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      durationMs: Date.now() - start2,
      status: "success",
      summary: result
    };
    pushHistory(record);
    await persistHistoryRecord(record);
    log7.info({ job: jobName, durationMs: record.durationMs }, "completed");
  } catch (err) {
    const record = {
      jobName,
      startedAt,
      finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      durationMs: Date.now() - start2,
      status: "error",
      summary: {},
      error: err?.message ?? String(err)
    };
    pushHistory(record);
    await persistHistoryRecord(record);
    log7.error({ job: jobName, err: record.error }, "failed");
  } finally {
    runningFlags.set(jobName, false);
    runningSince.set(jobName, null);
  }
}
async function legiscanRecent() {
  const r = await runLegiscanJob({ mode: "recent", sinceDays: 7 });
  return {
    mode: r.mode,
    sessionName: r.sessionName,
    fetched: r.fetched,
    inserted: r.inserted,
    skipped: r.skipped,
    alertsCreated: r.alerts.created,
    errors: r.fetchErrors.length + r.upsertErrors.length
  };
}
async function tloRss() {
  const r = await runTloRssJob();
  return {
    feedsAttempted: r.feedsAttempted,
    totalFetched: r.totalFetched,
    inserted: r.inserted,
    skipped: r.skipped,
    alertsCreated: r.alerts.created,
    feedErrors: r.feedErrors.length
  };
}
async function localFeeds() {
  const r = await runLocalFeedsJob();
  return {
    feedsAttempted: r.feedsAttempted,
    totalFetched: r.totalFetched,
    inserted: r.inserted,
    skipped: r.skipped,
    alertsCreated: r.alerts.created,
    feedErrors: r.feedErrors.length
  };
}
async function tecSweep() {
  const r = await runTecImportJob({ mode: "sweep", workspaceId: 2 });
  return {
    mode: r.mode,
    searchTerms: r.searchTerms.length,
    stakeholdersCreated: r.stakeholdersCreated,
    stakeholdersExisting: r.stakeholdersExisting,
    sourceDocsInserted: r.sourceDocsInserted,
    sourceDocsSkipped: r.sourceDocsSkipped,
    observationsCreated: r.observationsCreated,
    errors: r.errors.length
  };
}
async function intelligenceBriefing() {
  const briefing = await runSwarm();
  return {
    generatedAt: briefing.generatedAt,
    analysisTimeMs: briefing.analysisTimeMs,
    insights: briefing.insights.length,
    criticalRisks: briefing.risk.criticalRisks.length,
    anomalies: briefing.anomalies.anomalies.length,
    forecastHistoryDepth: briefing.forecast.historyDepth,
    threatTrend: briefing.delta.threatTrend
  };
}
async function committeeIntelSync() {
  return syncCommitteeIntelAutoIngestSessions();
}
function startScheduler() {
  const enabled = process.env.SCHEDULER_ENABLED !== "false";
  if (!enabled) {
    log7.info("scheduler disabled via SCHEDULER_ENABLED=false");
    schedulerEnabled = false;
    return;
  }
  schedulerEnabled = true;
  schedulerStartedAt = (/* @__PURE__ */ new Date()).toISOString();
  void initializeHistoryPersistence();
  const legiscanCron = process.env.CRON_LEGISCAN ?? "0 */4 * * *";
  const tloCron = process.env.CRON_TLO_RSS ?? "0 1,7,13,19 * * *";
  const localCron = process.env.CRON_LOCAL_FEEDS ?? "0 2,8,14,20 * * *";
  const tecCron = process.env.CRON_TEC_SWEEP ?? "0 3 * * *";
  const intelBriefingCron = process.env.CRON_INTEL_BRIEFING ?? "30 */6 * * *";
  const intelBriefingEnabled = process.env.SCHEDULER_INTEL_BRIEFING !== "false";
  const committeeIntelSyncCron = process.env.CRON_COMMITTEE_INTEL_SYNC ?? "*/2 * * * *";
  const committeeIntelSyncEnabled = process.env.SCHEDULER_COMMITTEE_INTEL_SYNC !== "false";
  const jobDefs = [
    {
      name: "legiscan-recent",
      cron: legiscanCron,
      fn: legiscanRecent,
      timeoutMs: normaliseTimeoutMs(Number(process.env.SCHEDULER_LEGISCAN_TIMEOUT_MS), DEFAULT_JOB_TIMEOUT_MS)
    },
    {
      name: "tlo-rss",
      cron: tloCron,
      fn: tloRss,
      timeoutMs: normaliseTimeoutMs(Number(process.env.SCHEDULER_TLO_RSS_TIMEOUT_MS), DEFAULT_JOB_TIMEOUT_MS)
    },
    {
      name: "local-feeds",
      cron: localCron,
      fn: localFeeds,
      timeoutMs: normaliseTimeoutMs(Number(process.env.SCHEDULER_LOCAL_FEEDS_TIMEOUT_MS), DEFAULT_JOB_TIMEOUT_MS)
    },
    {
      name: "tec-sweep",
      cron: tecCron,
      fn: tecSweep,
      timeoutMs: normaliseTimeoutMs(Number(process.env.SCHEDULER_TEC_TIMEOUT_MS), DEFAULT_JOB_TIMEOUT_MS)
    },
    {
      name: "intel-briefing",
      cron: intelBriefingCron,
      fn: intelligenceBriefing,
      timeoutMs: normaliseTimeoutMs(
        Number(process.env.SCHEDULER_INTEL_BRIEFING_TIMEOUT_MS),
        DEFAULT_INTEL_BRIEFING_TIMEOUT_MS
      ),
      enabled: intelBriefingEnabled
    },
    {
      name: "committee-intel-sync",
      cron: committeeIntelSyncCron,
      fn: committeeIntelSync,
      timeoutMs: normaliseTimeoutMs(
        Number(process.env.SCHEDULER_COMMITTEE_INTEL_SYNC_TIMEOUT_MS),
        DEFAULT_COMMITTEE_INTEL_SYNC_TIMEOUT_MS
      ),
      enabled: committeeIntelSyncEnabled
    }
  ];
  for (const def of jobDefs) {
    if (def.enabled === false) {
      log7.info({ job: def.name }, "skipped, disabled");
      continue;
    }
    if (!cron.validate(def.cron)) {
      log7.error({ job: def.name, cron: def.cron }, "invalid cron expression");
      continue;
    }
    const task = cron.schedule(def.cron, () => {
      void executeJob(def.name, def.fn, def.timeoutMs);
    });
    jobs.set(def.name, {
      name: def.name,
      cronExpression: def.cron,
      enabled: true,
      task
    });
    runningFlags.set(def.name, false);
    runningSince.set(def.name, null);
    getOrCreateTelemetry(def.name);
    log7.info({ job: def.name, cron: def.cron }, "registered");
  }
  log7.info({ jobCount: jobs.size }, "started");
}
function stopScheduler() {
  jobs.forEach((job) => {
    job.task?.stop();
    job.enabled = false;
  });
  runningSince.forEach((_value, key) => {
    runningSince.set(key, null);
  });
  schedulerEnabled = false;
  log7.info("stopped all jobs");
}
function getSchedulerStatus() {
  const jobStatuses = Array.from(jobs.values()).map((j) => ({
    ...(() => {
      const telemetry = getOrCreateTelemetry(j.name);
      return {
        runCounts: {
          total: telemetry.totalRuns,
          success: telemetry.successRuns,
          error: telemetry.errorRuns,
          skippedWhileRunning: telemetry.skippedWhileRunning
        },
        consecutiveFailures: telemetry.consecutiveFailures,
        lastSuccessAt: telemetry.lastSuccessAt,
        lastErrorAt: telemetry.lastErrorAt
      };
    })(),
    name: j.name,
    cronExpression: j.cronExpression,
    enabled: j.enabled,
    running: runningFlags.get(j.name) ?? false,
    runningSince: runningSince.get(j.name) ?? null,
    lastRun: lastRuns.get(j.name) ?? null,
    nextRun: getNextRun(j.cronExpression)
  }));
  return {
    enabled: schedulerEnabled,
    startedAt: schedulerStartedAt,
    jobs: jobStatuses,
    recentHistory: mergeHistoryRecords().slice(0, 20)
  };
}
async function triggerJob(jobName) {
  const runners = {
    "legiscan-recent": legiscanRecent,
    "tlo-rss": tloRss,
    "local-feeds": localFeeds,
    "tec-sweep": tecSweep,
    "intel-briefing": intelligenceBriefing,
    "committee-intel-sync": committeeIntelSync
  };
  const runner = runners[jobName];
  if (!runner) return null;
  await executeJob(jobName, runner);
  return lastRuns.get(jobName) ?? null;
}
function getJobHistory() {
  return mergeHistoryRecords();
}

// server/policy-intel/env-status.ts
var ENVIRONMENT_VARIABLES = [
  {
    key: "DATABASE_URL",
    required: true,
    description: "Postgres connection string for Policy Intel"
  },
  {
    key: "POLICY_INTEL_API_TOKEN",
    required: false,
    description: "Bearer token for API protection"
  },
  {
    key: "CORS_ORIGINS",
    required: false,
    description: "Comma-separated allowed CORS origins"
  },
  {
    key: "LEGISCAN_API_KEY",
    required: false,
    description: "LegiScan ingestion and legislator import"
  },
  {
    key: "OPENSTATES_API_KEY",
    required: false,
    description: "OpenStates committee membership import"
  },
  {
    key: "OPENAI_API_KEY",
    required: false,
    description: "Official audio transcription fallback"
  },
  {
    key: "ANTHROPIC_API_KEY",
    required: false,
    description: "Enhanced brief generation"
  },
  {
    key: "SLACK_WEBHOOK_URL",
    required: false,
    description: "Slack alert notifications"
  },
  {
    key: "SCHEDULER_ENABLED",
    required: false,
    description: "Enable/disable scheduled jobs (default: true)"
  },
  {
    key: "NODE_ENV",
    required: false,
    description: "Runtime environment (development/production)"
  },
  {
    key: "LOG_LEVEL",
    required: false,
    description: "Pino log level (debug/info/warn/error)"
  }
];
function getEnvironmentStatusReport() {
  const isProduction = process.env.NODE_ENV === "production";
  const variables = ENVIRONMENT_VARIABLES.map((entry) => {
    const raw = process.env[entry.key];
    const configured2 = typeof raw === "string" && raw.trim().length > 0;
    const required = entry.required || isProduction && entry.key === "POLICY_INTEL_API_TOKEN";
    return {
      key: entry.key,
      configured: configured2,
      required,
      description: entry.description
    };
  });
  const configured = variables.filter((item) => item.configured).length;
  const missingRequired = variables.filter((item) => item.required && !item.configured).length;
  return {
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    counts: {
      total: variables.length,
      configured,
      missingRequired
    },
    variables
  };
}

// server/policy-intel/services/deliverable-service.ts
init_db();
init_schema_policy_intel();
import { eq as eq20, and as and12, gte as gte10, lte, inArray as inArray4, desc as desc14 } from "drizzle-orm";
async function generateClientAlert(req) {
  const [room] = await policyIntelDb.select().from(issueRooms).where(eq20(issueRooms.id, req.issueRoomId));
  if (!room) throw new Error(`Issue room ${req.issueRoomId} not found`);
  const sourceLinks = await policyIntelDb.select().from(issueRoomSourceDocuments).where(eq20(issueRoomSourceDocuments.issueRoomId, req.issueRoomId));
  const sourceDocs = sourceLinks.length > 0 ? await policyIntelDb.select().from(sourceDocuments).where(
    inArray4(
      sourceDocuments.id,
      sourceLinks.map((l) => l.sourceDocumentId)
    )
  ) : [];
  const updates = await policyIntelDb.select().from(issueRoomUpdates).where(eq20(issueRoomUpdates.issueRoomId, req.issueRoomId)).orderBy(desc14(issueRoomUpdates.id));
  const strategies = await policyIntelDb.select().from(issueRoomStrategyOptions).where(eq20(issueRoomStrategyOptions.issueRoomId, req.issueRoomId)).orderBy(issueRoomStrategyOptions.recommendationRank);
  const relatedAlerts = sourceDocs.length > 0 ? await policyIntelDb.select().from(alerts).where(
    inArray4(
      alerts.sourceDocumentId,
      sourceDocs.map((d) => d.id)
    )
  ).orderBy(desc14(alerts.relevanceScore)).limit(10) : [];
  const firm = req.firmName ?? "Grace & McEwan LLP";
  const recipient = req.recipientName ?? "Client";
  const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const title = `Client Alert: ${room.title}`;
  const sections = [];
  sections.push(`# ${title}
`);
  sections.push(`**${firm}** \u2014 Government Affairs & Policy Intelligence
`);
  sections.push(`**Date:** ${today}  `);
  sections.push(`**To:** ${recipient}  `);
  sections.push(`**Re:** ${room.title}  `);
  sections.push(`**Status:** ${(room.status ?? "active").replace(/_/g, " ").toUpperCase()}
`);
  sections.push(`---
`);
  sections.push(`## Executive Summary
`);
  if (room.summary) {
    sections.push(room.summary + "\n");
  } else {
    sections.push(
      `This alert concerns ${room.title}. Our monitoring system has identified ${sourceDocs.length} relevant source document(s) and ${relatedAlerts.length} alert(s) requiring your attention.
`
    );
  }
  if (room.issueType || room.jurisdiction) {
    sections.push(
      `**Issue Area:** ${room.issueType ?? "General"} | **Jurisdiction:** ${(room.jurisdiction ?? "texas").charAt(0).toUpperCase() + (room.jurisdiction ?? "texas").slice(1)}
`
    );
  }
  const relatedBills = room.relatedBillIds ?? [];
  if (relatedBills.length > 0) {
    sections.push(`## Related Bills
`);
    for (const bill of relatedBills) {
      sections.push(`- **${bill}**`);
    }
    sections.push("");
  }
  if (relatedAlerts.length > 0) {
    sections.push(`## Key Findings
`);
    for (const alert of relatedAlerts.slice(0, 5)) {
      const score = alert.relevanceScore ?? 0;
      const priority = score >= 70 ? "\u{1F534} High" : score >= 40 ? "\u{1F7E1} Medium" : "\u26AA Low";
      sections.push(`- **${alert.title}** (${priority} Priority, Score: ${score})`);
      if (alert.whyItMatters) {
        const reason = alert.whyItMatters.split("\n")[0].slice(0, 200);
        sections.push(`  *${reason}*`);
      }
    }
    sections.push("");
  }
  if (sourceDocs.length > 0) {
    sections.push(`## Source Evidence
`);
    for (const doc of sourceDocs.slice(0, 10)) {
      sections.push(
        `- **${doc.title}** \u2014 ${doc.publisher} ` + (doc.publishedAt ? `(${new Date(doc.publishedAt).toLocaleDateString()})` : "") + (doc.sourceUrl ? ` [Link](${doc.sourceUrl})` : "")
      );
      if (doc.summary) sections.push(`  ${doc.summary.slice(0, 250)}`);
    }
    sections.push("");
  }
  if (room.recommendedPath || strategies.length > 0) {
    sections.push(`## Recommended Action
`);
    if (room.recommendedPath) {
      sections.push(room.recommendedPath + "\n");
    }
    if (strategies.length > 0) {
      sections.push(`### Strategic Options
`);
      for (const s of strategies) {
        sections.push(`**${s.recommendationRank}. ${s.label}**`);
        if (s.description) sections.push(s.description);
        const pros = s.prosJson ?? [];
        const cons = s.consJson ?? [];
        if (pros.length > 0)
          sections.push(
            `  - *Advantages:* ${pros.join("; ")}`
          );
        if (cons.length > 0)
          sections.push(
            `  - *Risks:* ${cons.join("; ")}`
          );
        if (s.politicalFeasibility)
          sections.push(
            `  - *Political Feasibility:* ${s.politicalFeasibility}`
          );
        sections.push("");
      }
    }
  }
  if (updates.length > 0) {
    sections.push(`## Recent Developments
`);
    for (const u of updates.slice(0, 5)) {
      const date = new Date(u.createdAt).toLocaleDateString();
      sections.push(`- **${date} \u2014 ${u.title}**`);
      if (u.body) sections.push(`  ${u.body.slice(0, 300)}`);
    }
    sections.push("");
  }
  sections.push(`---
`);
  sections.push(
    `*This alert was prepared by ${firm} using automated policy intelligence monitoring. Please contact your ${firm} team for further analysis or questions.*
`
  );
  sections.push(
    `*Confidential \u2014 Prepared for ${recipient}. Do not distribute without authorization.*`
  );
  const bodyMarkdown = sections.join("\n");
  const sourceDocumentIds = sourceDocs.map((d) => d.id);
  const [deliverable] = await policyIntelDb.insert(deliverables).values({
    workspaceId: req.workspaceId,
    matterId: req.matterId ?? room.matterId ?? null,
    type: "client_alert",
    title,
    bodyMarkdown,
    sourceDocumentIds,
    citationsJson: sourceDocs.map((d) => ({
      sourceDocumentId: d.id,
      title: d.title,
      publisher: d.publisher,
      sourceUrl: d.sourceUrl,
      accessedAt: (/* @__PURE__ */ new Date()).toISOString()
    })),
    generatedBy: "template"
  }).returning();
  if (req.matterId || room.matterId) {
    await policyIntelDb.insert(activities).values({
      workspaceId: req.workspaceId,
      matterId: req.matterId ?? room.matterId ?? null,
      type: "brief_drafted",
      summary: `Client alert "${title}" generated from issue room #${req.issueRoomId}`
    });
  }
  return {
    deliverableId: deliverable.id,
    type: "client_alert",
    title,
    bodyMarkdown,
    generatedBy: "template"
  };
}
async function generateWeeklyReport(req) {
  const now = /* @__PURE__ */ new Date();
  let weekStart;
  let weekEnd;
  if (req.week) {
    const [yearStr, weekStr] = req.week.split("-W");
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = jan1.getDay();
    const daysOffset = (week - 1) * 7 + (1 - dayOfWeek);
    weekStart = new Date(year, 0, 1 + daysOffset);
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
  } else {
    const day = now.getDay();
    weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (day + 6) % 7);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
  }
  const weekAlerts = await policyIntelDb.select().from(alerts).where(
    and12(
      eq20(alerts.workspaceId, req.workspaceId),
      gte10(alerts.createdAt, weekStart),
      lte(alerts.createdAt, weekEnd)
    )
  ).orderBy(desc14(alerts.relevanceScore));
  const watchlistIds = Array.from(
    new Set(weekAlerts.filter((a) => a.watchlistId).map((a) => a.watchlistId))
  );
  const watchlistMap = /* @__PURE__ */ new Map();
  if (watchlistIds.length > 0) {
    const wlRows = await policyIntelDb.select({ id: watchlists.id, name: watchlists.name }).from(watchlists).where(inArray4(watchlists.id, watchlistIds));
    for (const wl of wlRows) watchlistMap.set(wl.id, wl.name);
  }
  const weekActivities = await policyIntelDb.select().from(activities).where(
    and12(
      eq20(activities.workspaceId, req.workspaceId),
      gte10(activities.createdAt, weekStart),
      lte(activities.createdAt, weekEnd)
    )
  ).orderBy(desc14(activities.createdAt));
  const firm = req.firmName ?? "Grace & McEwan LLP";
  const recipient = req.recipientName ?? "Client";
  const weekLabel = req.week ?? `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)).padStart(2, "0")}`;
  const startDate = weekStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const endDate = weekEnd.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const title = `Weekly Policy Intelligence Report \u2014 ${weekLabel}`;
  const sections = [];
  sections.push(`# ${title}
`);
  sections.push(`**${firm}** \u2014 Government Affairs & Policy Intelligence
`);
  sections.push(`**Period:** ${startDate} \u2014 ${endDate}  `);
  sections.push(`**Prepared for:** ${recipient}  `);
  sections.push(
    `**Generated:** ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
`
  );
  sections.push(`---
`);
  const highPriority = weekAlerts.filter((a) => (a.relevanceScore ?? 0) >= 70);
  const pendingReview = weekAlerts.filter(
    (a) => a.status === "pending_review"
  );
  const reviewed = weekAlerts.filter((a) => a.status !== "pending_review");
  sections.push(`## Week at a Glance
`);
  sections.push(`| Metric | Count |`);
  sections.push(`|--------|-------|`);
  sections.push(`| Total Alerts | ${weekAlerts.length} |`);
  sections.push(`| High Priority (\u226570) | ${highPriority.length} |`);
  sections.push(`| Reviewed | ${reviewed.length} |`);
  sections.push(`| Pending Review | ${pendingReview.length} |`);
  sections.push(`| Activities Logged | ${weekActivities.length} |`);
  sections.push("");
  if (highPriority.length > 0) {
    sections.push(`## High-Priority Items
`);
    sections.push(
      `The following ${highPriority.length} item(s) scored \u226570 and warrant immediate attention:
`
    );
    for (const a of highPriority) {
      sections.push(`### ${a.title}`);
      sections.push(`**Score:** ${a.relevanceScore} | **Status:** ${(a.status ?? "pending_review").replace(/_/g, " ")}
`);
      if (a.whyItMatters) {
        sections.push(a.whyItMatters.split("\n\n")[0] + "\n");
      }
    }
  }
  const watchlistGroups = /* @__PURE__ */ new Map();
  for (const a of weekAlerts) {
    const name = a.watchlistId ? watchlistMap.get(a.watchlistId) ?? `Watchlist #${a.watchlistId}` : "Unassigned";
    if (!watchlistGroups.has(name)) watchlistGroups.set(name, []);
    watchlistGroups.get(name).push(a);
  }
  if (watchlistGroups.size > 0) {
    sections.push(`## Alerts by Topic
`);
    for (const [name, groupAlerts] of Array.from(watchlistGroups.entries())) {
      const groupHigh = groupAlerts.filter(
        (a) => (a.relevanceScore ?? 0) >= 70
      ).length;
      sections.push(
        `### ${name} (${groupAlerts.length} alert${groupAlerts.length !== 1 ? "s" : ""}${groupHigh > 0 ? `, ${groupHigh} high-priority` : ""})
`
      );
      for (const a of groupAlerts.slice(0, 8)) {
        const score = a.relevanceScore ?? 0;
        const icon = score >= 70 ? "\u{1F534}" : score >= 40 ? "\u{1F7E1}" : "\u26AA";
        sections.push(
          `- ${icon} **${a.title.slice(0, 100)}** (Score: ${score}, ${(a.status ?? "pending").replace(/_/g, " ")})`
        );
      }
      if (groupAlerts.length > 8)
        sections.push(
          `- *...and ${groupAlerts.length - 8} more alert(s)*`
        );
      sections.push("");
    }
  }
  if (weekActivities.length > 0) {
    sections.push(`## Team Activities
`);
    for (const a of weekActivities.slice(0, 15)) {
      const date = new Date(a.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
      sections.push(
        `- **${date}** \u2014 ${a.summary} *(${(a.type ?? "").replace(/_/g, " ")})*`
      );
    }
    if (weekActivities.length > 15)
      sections.push(
        `- *...and ${weekActivities.length - 15} more*`
      );
    sections.push("");
  }
  sections.push(`## Week Ahead
`);
  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
  const upcomingHearings = await policyIntelDb.select().from(hearingEvents).where(
    and12(
      eq20(hearingEvents.workspaceId, req.workspaceId),
      gte10(hearingEvents.hearingDate, nextWeekStart),
      lte(hearingEvents.hearingDate, nextWeekEnd)
    )
  ).orderBy(hearingEvents.hearingDate);
  if (upcomingHearings.length > 0) {
    sections.push(
      `${upcomingHearings.length} hearing(s) scheduled for next week:
`
    );
    for (const h of upcomingHearings.slice(0, 5)) {
      const hDate = new Date(h.hearingDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
      sections.push(
        `- **${hDate}** \u2014 ${h.committee} (${h.chamber})${h.location ? ` at ${h.location}` : ""}`
      );
    }
  } else {
    sections.push(`No hearings currently scheduled for next week.
`);
  }
  sections.push("");
  sections.push(`---
`);
  sections.push(
    `*This report was prepared by ${firm} using automated policy intelligence. For detailed analysis, please contact your ${firm} representative.*
`
  );
  sections.push(
    `*Confidential \u2014 Prepared for ${recipient}. Do not distribute without authorization.*`
  );
  const bodyMarkdown = sections.join("\n");
  const [deliverable] = await policyIntelDb.insert(deliverables).values({
    workspaceId: req.workspaceId,
    matterId: req.matterId ?? null,
    type: "weekly_digest",
    title,
    bodyMarkdown,
    sourceDocumentIds: [],
    citationsJson: [],
    generatedBy: "template"
  }).returning();
  await policyIntelDb.insert(activities).values({
    workspaceId: req.workspaceId,
    matterId: req.matterId ?? null,
    type: "brief_drafted",
    summary: `Weekly report "${title}" generated for ${startDate} \u2014 ${endDate}`
  });
  return {
    deliverableId: deliverable.id,
    type: "weekly_digest",
    title,
    bodyMarkdown,
    generatedBy: "template"
  };
}
async function generateHearingMemo(req) {
  const [hearing] = await policyIntelDb.select().from(hearingEvents).where(eq20(hearingEvents.id, req.hearingId));
  if (!hearing) throw new Error(`Hearing ${req.hearingId} not found`);
  const relatedBills = hearing.relatedBillIds ?? [];
  let relatedDocs = [];
  if (relatedBills.length > 0) {
    const conditions = relatedBills.map(
      (bill) => eq20(sourceDocuments.title, bill)
    );
    const allDocs = await policyIntelDb.select().from(sourceDocuments).limit(500);
    relatedDocs = allDocs.filter(
      (d) => relatedBills.some(
        (bill) => d.title.toLowerCase().includes(bill.toLowerCase()) || (d.normalizedText ?? "").toLowerCase().includes(bill.toLowerCase())
      )
    );
  }
  const members = await policyIntelDb.select().from(committeeMembers).where(eq20(committeeMembers.committeeName, hearing.committee));
  const memberStakeholderIds = members.filter((m) => m.stakeholderId).map((m) => m.stakeholderId);
  const memberStakeholders = memberStakeholderIds.length > 0 ? await policyIntelDb.select().from(stakeholders).where(inArray4(stakeholders.id, memberStakeholderIds)) : [];
  const billAlerts = relatedDocs.length > 0 ? await policyIntelDb.select().from(alerts).where(
    inArray4(
      alerts.sourceDocumentId,
      relatedDocs.map((d) => d.id)
    )
  ).orderBy(desc14(alerts.relevanceScore)).limit(10) : [];
  const firm = req.firmName ?? "Grace & McEwan LLP";
  const recipient = req.recipientName ?? "Client";
  const hearingDate = new Date(hearing.hearingDate).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );
  const title = `Hearing Memo: ${hearing.committee} \u2014 ${hearingDate}`;
  const sections = [];
  sections.push(`# ${title}
`);
  sections.push(`**${firm}** \u2014 Government Affairs & Policy Intelligence
`);
  sections.push(`**Committee:** ${hearing.committee}  `);
  sections.push(`**Chamber:** ${hearing.chamber}  `);
  sections.push(`**Date:** ${hearingDate}  `);
  if (hearing.timeDescription)
    sections.push(`**Time:** ${hearing.timeDescription}  `);
  if (hearing.location) sections.push(`**Location:** ${hearing.location}  `);
  sections.push(`**Status:** ${(hearing.status ?? "scheduled").replace(/_/g, " ").toUpperCase()}  `);
  sections.push(`**Prepared for:** ${recipient}
`);
  sections.push(`---
`);
  sections.push(`## Hearing Overview
`);
  if (hearing.description) {
    sections.push(hearing.description + "\n");
  } else {
    sections.push(
      `The ${hearing.committee} (${hearing.chamber}) will convene on ${hearingDate}` + (hearing.location ? ` at ${hearing.location}` : "") + `. ${relatedBills.length > 0 ? `${relatedBills.length} bill(s) are on the agenda.` : "Agenda details to follow."}
`
    );
  }
  if (relatedBills.length > 0) {
    sections.push(`## Bills on Agenda
`);
    for (const bill of relatedBills) {
      const doc = relatedDocs.find(
        (d) => d.title.toLowerCase().includes(bill.toLowerCase())
      );
      sections.push(`### ${bill}`);
      if (doc) {
        sections.push(`**Title:** ${doc.title}  `);
        if (doc.summary) sections.push(`**Summary:** ${doc.summary.slice(0, 400)}
`);
        if (doc.sourceUrl) sections.push(`**Source:** [${doc.publisher}](${doc.sourceUrl})
`);
      } else {
        sections.push(`*No source document on file for this bill.*
`);
      }
    }
  }
  if (billAlerts.length > 0) {
    sections.push(`## Intelligence from Alert Pipeline
`);
    sections.push(
      `Our monitoring system has flagged ${billAlerts.length} alert(s) related to bills on this agenda:
`
    );
    for (const a of billAlerts.slice(0, 5)) {
      const score = a.relevanceScore ?? 0;
      const priority = score >= 70 ? "\u{1F534} High" : score >= 40 ? "\u{1F7E1} Medium" : "\u26AA Low";
      sections.push(`- **${a.title}** (${priority}, Score: ${score})`);
      if (a.whyItMatters) {
        const reason = a.whyItMatters.split("\n")[0].slice(0, 250);
        sections.push(`  *${reason}*`);
      }
    }
    sections.push("");
  }
  if (members.length > 0) {
    sections.push(`## Committee Composition
`);
    sections.push(`| Role | Member | Party |`);
    sections.push(`|------|--------|-------|`);
    for (const m of members) {
      const s = memberStakeholders.find(
        (st) => st.id === m.stakeholderId
      );
      const name = s?.name ?? "Unknown";
      const party = s?.tagsJson ? s.tagsJson.find((t) => t === "R" || t === "D" || t === "I") ?? "" : "";
      sections.push(
        `| ${m.role.charAt(0).toUpperCase() + m.role.slice(1)} | ${name} | ${party} |`
      );
    }
    sections.push("");
  }
  sections.push(`## Preparation Notes
`);
  sections.push(`1. Review the bills listed above for specific language affecting client interests`);
  sections.push(`2. Identify potential testimony opportunities or witness registration deadlines`);
  sections.push(`3. Note any amendments or substitutes that may be offered`);
  if (members.length > 0) {
    const chair = members.find(
      (m) => (m.role ?? "").toLowerCase().includes("chair")
    );
    if (chair) {
      const chairName = memberStakeholders.find((s) => s.id === chair.stakeholderId)?.name ?? "the Chair";
      sections.push(
        `4. ${chairName} chairs this committee \u2014 review voting history and stated positions`
      );
    }
  }
  sections.push("");
  sections.push(`---
`);
  sections.push(
    `*This memo was prepared by ${firm} using automated policy intelligence monitoring. Contact your ${firm} team for hearing attendance strategy or testimony preparation.*
`
  );
  sections.push(
    `*Confidential \u2014 Prepared for ${recipient}. Do not distribute without authorization.*`
  );
  const bodyMarkdown = sections.join("\n");
  const sourceDocumentIds = relatedDocs.map((d) => d.id);
  const [deliverable] = await policyIntelDb.insert(deliverables).values({
    workspaceId: req.workspaceId,
    matterId: req.matterId ?? null,
    type: "hearing_memo",
    title,
    bodyMarkdown,
    sourceDocumentIds,
    citationsJson: relatedDocs.map((d) => ({
      sourceDocumentId: d.id,
      title: d.title,
      publisher: d.publisher,
      sourceUrl: d.sourceUrl,
      accessedAt: (/* @__PURE__ */ new Date()).toISOString()
    })),
    generatedBy: "template"
  }).returning();
  await policyIntelDb.insert(activities).values({
    workspaceId: req.workspaceId,
    matterId: req.matterId ?? null,
    type: "brief_drafted",
    summary: `Hearing memo generated for ${hearing.committee} on ${hearingDate}`
  });
  return {
    deliverableId: deliverable.id,
    type: "hearing_memo",
    title,
    bodyMarkdown,
    generatedBy: "template"
  };
}

// server/policy-intel/services/replay-orchestrator-service.ts
init_db();
init_schema_policy_intel();
import { and as and13, desc as desc15, eq as eq21 } from "drizzle-orm";
var DEFAULT_CHUNK_SIZE = 250;
var MAX_CHUNK_SIZE = 2e3;
var DEFAULT_ADVANCE_CHUNKS = 1;
var MAX_ADVANCE_CHUNKS = 200;
var REPLAY_ADVISORY_LOCK_NAMESPACE = 87121;
var replayPersistenceReady = false;
var VALID_ORDER_BY = /* @__PURE__ */ new Set([
  "bill_id_asc",
  "bill_id_desc",
  "last_action_date_asc",
  "last_action_date_desc"
]);
function normalizeMode(mode) {
  if (mode === "recent" || mode === "backfill" || mode === "full") {
    return mode;
  }
  return "full";
}
function normalizeOrderBy(orderBy) {
  if (!orderBy) return "bill_id_asc";
  return VALID_ORDER_BY.has(orderBy) ? orderBy : "bill_id_asc";
}
function normalizeChunkSize(chunkSize) {
  if (!Number.isFinite(chunkSize)) return DEFAULT_CHUNK_SIZE;
  return Math.max(1, Math.min(MAX_CHUNK_SIZE, Math.floor(chunkSize)));
}
function normalizeMaxChunks(value) {
  if (!Number.isFinite(value)) return DEFAULT_ADVANCE_CHUNKS;
  return Math.max(1, Math.min(MAX_ADVANCE_CHUNKS, Math.floor(value)));
}
function asRecord(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return {};
}
async function ensureReplayPersistence() {
  if (replayPersistenceReady) return;
  await queryClient.unsafe(`
    do $$
    begin
      create type policy_intel_replay_run_status as enum ('planned', 'running', 'paused', 'completed', 'failed');
    exception
      when duplicate_object then null;
    end
    $$;
  `);
  await queryClient.unsafe(`
    do $$
    begin
      create type policy_intel_replay_chunk_status as enum ('pending', 'running', 'success', 'error', 'skipped');
    exception
      when duplicate_object then null;
    end
    $$;
  `);
  await queryClient.unsafe(`
    create table if not exists policy_intel_replay_runs (
      id serial primary key,
      source varchar(64) not null default 'legiscan',
      session_id integer not null,
      mode varchar(16) not null default 'full',
      order_by varchar(32) not null default 'bill_id_asc',
      chunk_size integer not null default 250,
      next_offset integer not null default 0,
      total_candidates integer,
      processed_candidates integer not null default 0,
      status policy_intel_replay_run_status not null default 'planned',
      requested_by varchar(255),
      options_json jsonb not null default '{}'::jsonb,
      last_error text,
      started_at timestamptz,
      completed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await queryClient.unsafe(`
    create table if not exists policy_intel_replay_chunks (
      id serial primary key,
      replay_run_id integer not null references policy_intel_replay_runs(id) on delete cascade,
      chunk_index integer not null,
      "offset" integer not null,
      "limit" integer not null,
      status policy_intel_replay_chunk_status not null default 'pending',
      started_at timestamptz,
      finished_at timestamptz,
      fetched integer not null default 0,
      inserted integer not null default 0,
      skipped integer not null default 0,
      alerts_created integer not null default 0,
      fetch_errors integer not null default 0,
      upsert_errors integer not null default 0,
      error text,
      result_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);
  await queryClient.unsafe(`
    create unique index if not exists policy_intel_replay_chunks_run_chunk_idx
    on policy_intel_replay_chunks (replay_run_id, chunk_index)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_replay_chunks_run_created_idx
    on policy_intel_replay_chunks (replay_run_id, created_at)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_replay_runs_status_created_idx
    on policy_intel_replay_runs (status, created_at)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_replay_runs_source_session_idx
    on policy_intel_replay_runs (source, session_id)
  `);
  replayPersistenceReady = true;
}
function calculateProgress(run, chunks) {
  const successfulChunks = chunks.filter((chunk) => chunk.status === "success" || chunk.status === "skipped").length;
  const errorChunks = chunks.filter((chunk) => chunk.status === "error").length;
  const lastChunkCompletedAt = chunks.find((chunk) => chunk.finishedAt instanceof Date)?.finishedAt?.toISOString() ?? null;
  const total = run.totalCandidates;
  const elapsedMs = run.startedAt ? Date.now() - run.startedAt.getTime() : 0;
  const elapsedMinutes = elapsedMs > 0 ? elapsedMs / 6e4 : 0;
  const processedPerMinute = elapsedMinutes > 0 && run.processedCandidates > 0 ? run.processedCandidates / elapsedMinutes : null;
  if (!total || total <= 0) {
    return {
      completionRatio: 0,
      remainingCandidates: null,
      hasMore: run.status !== "completed",
      processedPerMinute,
      etaMinutes: null,
      successfulChunks,
      errorChunks,
      lastChunkCompletedAt
    };
  }
  const processed = Math.max(0, Math.min(run.processedCandidates, total));
  const remaining = Math.max(0, total - processed);
  const etaMinutes = processedPerMinute && processedPerMinute > 0 ? remaining / processedPerMinute : null;
  return {
    completionRatio: total > 0 ? processed / total : 0,
    remainingCandidates: remaining,
    hasMore: remaining > 0 && run.status !== "completed",
    processedPerMinute,
    etaMinutes,
    successfulChunks,
    errorChunks,
    lastChunkCompletedAt
  };
}
async function tryAcquireRunAdvanceLock(runId) {
  const rows = await queryClient.unsafe(
    "select pg_try_advisory_lock($1, $2) as locked",
    [REPLAY_ADVISORY_LOCK_NAMESPACE, runId]
  );
  return Boolean(rows[0]?.locked);
}
async function releaseRunAdvanceLock(runId) {
  await queryClient.unsafe("select pg_advisory_unlock($1, $2)", [REPLAY_ADVISORY_LOCK_NAMESPACE, runId]);
}
async function getRunOrThrow(runId) {
  const [run] = await policyIntelDb.select().from(replayRuns).where(eq21(replayRuns.id, runId));
  if (!run) {
    throw new Error(`Replay run ${runId} was not found`);
  }
  return run;
}
async function listReplayRuns(filters = {}) {
  await ensureReplayPersistence();
  const limit = Math.max(1, Math.min(200, Number(filters.limit) || 50));
  const rows = await policyIntelDb.select().from(replayRuns).where(filters.status ? eq21(replayRuns.status, filters.status) : void 0).orderBy(desc15(replayRuns.createdAt)).limit(limit);
  return Promise.all(rows.map((row) => getReplayRunDetail(row.id)));
}
async function getReplayRunDetail(runId) {
  await ensureReplayPersistence();
  const run = await getRunOrThrow(runId);
  const chunks = await policyIntelDb.select().from(replayChunks).where(eq21(replayChunks.replayRunId, runId)).orderBy(desc15(replayChunks.chunkIndex), desc15(replayChunks.createdAt)).limit(500);
  return {
    run,
    chunks,
    progress: calculateProgress(run, chunks)
  };
}
async function createLegiscanReplayRun(request) {
  await ensureReplayPersistence();
  if (!Number.isFinite(request.sessionId) || request.sessionId <= 0) {
    throw new Error("sessionId is required");
  }
  const mode = normalizeMode(request.mode);
  const chunkSize = normalizeChunkSize(request.chunkSize);
  const orderBy = normalizeOrderBy(request.orderBy);
  const optionsJson = {
    sinceDays: Number.isFinite(request.sinceDays) ? Math.max(1, Math.floor(request.sinceDays)) : void 0,
    detailConcurrency: Number.isFinite(request.detailConcurrency) ? Math.max(1, Math.floor(request.detailConcurrency)) : void 0
  };
  const [created] = await policyIntelDb.insert(replayRuns).values({
    source: "legiscan",
    sessionId: Math.floor(request.sessionId),
    mode,
    orderBy,
    chunkSize,
    nextOffset: 0,
    processedCandidates: 0,
    status: "planned",
    requestedBy: request.requestedBy?.trim() || null,
    optionsJson,
    startedAt: null,
    completedAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).returning();
  return getReplayRunDetail(created.id);
}
async function pauseReplayRun(runId) {
  await ensureReplayPersistence();
  const run = await getRunOrThrow(runId);
  if (run.status === "completed") {
    return getReplayRunDetail(runId);
  }
  await policyIntelDb.update(replayRuns).set({
    status: "paused",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq21(replayRuns.id, runId));
  return getReplayRunDetail(runId);
}
async function advanceReplayRun(runId, options = {}) {
  await ensureReplayPersistence();
  const lockAcquired = await tryAcquireRunAdvanceLock(runId);
  if (!lockAcquired) {
    return getReplayRunDetail(runId);
  }
  const stopOnError = options.stopOnError !== false;
  const maxChunks = options.untilCompleted ? MAX_ADVANCE_CHUNKS : normalizeMaxChunks(options.maxChunks);
  try {
    let run = await getRunOrThrow(runId);
    if (run.status === "completed") {
      return getReplayRunDetail(runId);
    }
    if (run.status === "failed" || run.status === "paused" || run.status === "planned") {
      await policyIntelDb.update(replayRuns).set({
        status: "running",
        startedAt: run.startedAt ?? /* @__PURE__ */ new Date(),
        lastError: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq21(replayRuns.id, runId));
      run = await getRunOrThrow(runId);
    }
    for (let step = 0; step < maxChunks; step++) {
      run = await getRunOrThrow(runId);
      if (run.status !== "running") {
        break;
      }
      if (run.totalCandidates !== null && run.nextOffset >= run.totalCandidates) {
        await policyIntelDb.update(replayRuns).set({
          status: "completed",
          completedAt: run.completedAt ?? /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq21(replayRuns.id, runId));
        break;
      }
      const chunkIndex = Math.floor(run.nextOffset / Math.max(run.chunkSize, 1));
      const [createdChunk] = await policyIntelDb.insert(replayChunks).values({
        replayRunId: run.id,
        chunkIndex,
        offset: run.nextOffset,
        limit: run.chunkSize,
        status: "running",
        startedAt: /* @__PURE__ */ new Date()
      }).returning();
      try {
        const optionsJson = asRecord(run.optionsJson);
        const result = await runLegiscanJob({
          mode: normalizeMode(run.mode),
          sessionId: run.sessionId,
          offset: run.nextOffset,
          limit: run.chunkSize,
          orderBy: normalizeOrderBy(run.orderBy),
          sinceDays: typeof optionsJson.sinceDays === "number" ? optionsJson.sinceDays : void 0,
          detailConcurrency: typeof optionsJson.detailConcurrency === "number" ? optionsJson.detailConcurrency : void 0
        });
        const totalCandidates = Number.isFinite(result.totalCandidates) ? result.totalCandidates : run.totalCandidates;
        const remaining = totalCandidates === null ? null : Math.max(0, totalCandidates - run.nextOffset);
        const candidateCount = remaining === null ? run.chunkSize : Math.min(run.chunkSize, remaining);
        const nextOffset = run.nextOffset + candidateCount;
        const hasMore = totalCandidates === null ? result.fetched > 0 : nextOffset < totalCandidates;
        await policyIntelDb.update(replayChunks).set({
          status: result.fetched === 0 && candidateCount === 0 ? "skipped" : "success",
          finishedAt: /* @__PURE__ */ new Date(),
          fetched: result.fetched,
          inserted: result.inserted,
          skipped: result.skipped,
          alertsCreated: result.alerts.created,
          fetchErrors: result.fetchErrors.length,
          upsertErrors: result.upsertErrors.length,
          resultJson: result
        }).where(eq21(replayChunks.id, createdChunk.id));
        await policyIntelDb.update(replayRuns).set({
          totalCandidates,
          processedCandidates: run.processedCandidates + candidateCount,
          nextOffset: hasMore ? nextOffset : run.nextOffset + candidateCount,
          status: hasMore ? "running" : "completed",
          completedAt: hasMore ? null : /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          lastError: null
        }).where(eq21(replayRuns.id, run.id));
        if (!hasMore) {
          break;
        }
      } catch (error) {
        const message = safeErrorMessage(error, "Replay chunk failed");
        await policyIntelDb.update(replayChunks).set({
          status: "error",
          finishedAt: /* @__PURE__ */ new Date(),
          error: message
        }).where(eq21(replayChunks.id, createdChunk.id));
        await policyIntelDb.update(replayRuns).set({
          status: "failed",
          lastError: message,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq21(replayRuns.id, run.id));
        if (stopOnError) {
          break;
        }
        await policyIntelDb.update(replayRuns).set({
          status: "running",
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and13(eq21(replayRuns.id, run.id), eq21(replayRuns.status, "failed")));
      }
    }
    return getReplayRunDetail(runId);
  } finally {
    await releaseRunAdvanceLock(runId);
  }
}

// server/policy-intel/routes.ts
var log12 = createLogger("routes");
function slugifyIssueRoom(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}
function parseId(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}
function createPolicyIntelRouter() {
  const router = Router();
  router.get("/health", async (_req, res) => {
    res.json({ ok: true, service: "policy-intel", scope: "us-federal-texas" });
  });
  router.get("/", async (_req, res) => {
    res.json({
      service: "ActUp Policy Intel",
      scope: ["us_federal", "texas"],
      routes: [
        "/api/intel/workspaces",
        "/api/intel/dashboard/stats",
        "/api/intel/watchlists",
        "/api/intel/source-documents",
        "/api/intel/alerts",
        "/api/intel/briefs",
        "/api/intel/briefs/generate",
        "/api/intel/deliverables",
        "/api/intel/matters",
        "/api/intel/issue-rooms",
        "/api/intel/activities",
        "/api/intel/stakeholders",
        "/api/intel/jobs",
        "/api/intel/jobs/run-local-feeds",
        "/api/intel/jobs/run-legiscan",
        "/api/intel/workspaces/:id/digest",
        "/api/intel/champion/status",
        "/api/intel/champion/history",
        "/api/intel/champion/retrain",
        "/api/intel/intelligence/briefing",
        "/api/intel/intelligence/velocity",
        "/api/intel/intelligence/correlations",
        "/api/intel/intelligence/influence",
        "/api/intel/intelligence/risk",
        "/api/intel/intelligence/anomalies",
        "/api/intel/intelligence/forecast",
        "/api/intel/intelligence/forecast/drift",
        "/api/intel/intelligence/sponsors",
        "/api/intel/intelligence/legislators",
        "/api/intel/intelligence/influence-map",
        "/api/intel/committee-intel/sessions",
        "/api/intel/committee-intel/sessions/from-hearing"
      ]
    });
  });
  router.get("/workspaces", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(workspaces).orderBy(workspaces.id);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/dashboard/stats", async (_req, res, next) => {
    try {
      const [
        [totalAlertsRow],
        [pendingRow],
        [highPriorityRow],
        [totalDocsRow],
        [activeMattersRow],
        [activeWatchlistsRow],
        recentAlerts,
        recentDocs,
        alertsByWatchlist,
        alertsByStatus
      ] = await Promise.all([
        policyIntelDb.select({ count: count11() }).from(alerts),
        policyIntelDb.select({ count: count11() }).from(alerts).where(eq26(alerts.status, "pending_review")),
        policyIntelDb.select({ count: count11() }).from(alerts).where(gte15(alerts.relevanceScore, 70)),
        policyIntelDb.select({ count: count11() }).from(sourceDocuments),
        policyIntelDb.select({ count: count11() }).from(matters).where(eq26(matters.status, "active")),
        policyIntelDb.select({ count: count11() }).from(watchlists).where(eq26(watchlists.isActive, true)),
        policyIntelDb.select().from(alerts).orderBy(desc20(alerts.id)).limit(10),
        policyIntelDb.select().from(sourceDocuments).orderBy(desc20(sourceDocuments.id)).limit(5),
        policyIntelDb.select({
          watchlistId: alerts.watchlistId,
          count: count11()
        }).from(alerts).groupBy(alerts.watchlistId).orderBy(desc20(count11())).limit(10),
        policyIntelDb.select({
          status: alerts.status,
          count: count11()
        }).from(alerts).groupBy(alerts.status)
      ]);
      const wlIds = alertsByWatchlist.map((r) => r.watchlistId).filter((id) => id !== null);
      const wlRows = wlIds.length > 0 ? await policyIntelDb.select({ id: watchlists.id, name: watchlists.name }).from(watchlists).where(inArray8(watchlists.id, wlIds)) : [];
      const wlNameMap = new Map(wlRows.map((w) => [w.id, w.name]));
      res.json({
        totalAlerts: totalAlertsRow?.count ?? 0,
        pendingReview: pendingRow?.count ?? 0,
        highPriority: highPriorityRow?.count ?? 0,
        totalDocuments: totalDocsRow?.count ?? 0,
        activeMatters: activeMattersRow?.count ?? 0,
        activeWatchlists: activeWatchlistsRow?.count ?? 0,
        recentAlerts,
        recentDocuments: recentDocs,
        alertsByWatchlist: alertsByWatchlist.map((r) => ({
          watchlistId: r.watchlistId,
          watchlistName: r.watchlistId ? wlNameMap.get(r.watchlistId) ?? "Unknown" : "Unlinked",
          count: r.count
        })),
        alertsByStatus: alertsByStatus.map((r) => ({
          status: r.status,
          count: r.count
        }))
      });
    } catch (err) {
      next(err);
    }
  });
  router.get("/dashboard/kpis", async (_req, res, next) => {
    try {
      const pipelineRuns = metrics.getCounter("policy_intel_pipeline_runs_total");
      const alertsCreated = metrics.getCounter("policy_intel_alerts_created_total");
      const docsProcessed = metrics.getCounter("policy_intel_docs_processed_total");
      const docsMatched = metrics.getCounter("policy_intel_docs_matched_total");
      const escalations = metrics.getCounter("policy_intel_pipeline_actions_total", { action: "escalate" });
      const watches = metrics.getCounter("policy_intel_pipeline_actions_total", { action: "watch" });
      const archives = metrics.getCounter("policy_intel_pipeline_actions_total", { action: "archive" });
      const alertsSkippedDup = metrics.getCounter("policy_intel_alerts_skipped_total", { reason: "duplicate" });
      const alertsSkippedCooldown = metrics.getCounter("policy_intel_alerts_skipped_total", { reason: "cooldown" });
      const scoreSummary = metrics.getHistogramSummary("policy_intel_pipeline_score");
      const confidenceSummary = metrics.getHistogramSummary("policy_intel_pipeline_confidence");
      const durationSummary = metrics.getHistogramSummary("policy_intel_pipeline_duration_ms");
      const regimeGauges = metrics.getGaugeAll("policy_intel_regime_current");
      const activeRegime = regimeGauges.find((g) => g.value === 1);
      const agentNames = ["procedural", "relevance", "stakeholder", "actionability", "timeliness", "regime"];
      const agentScores = agentNames.map((name) => ({
        agent: name,
        ...metrics.getHistogramSummary("policy_intel_agent_score", { agent: name })
      }));
      const [
        [alertCount],
        [pendingCount],
        [highPriorityCount]
      ] = await Promise.all([
        policyIntelDb.select({ count: count11() }).from(alerts),
        policyIntelDb.select({ count: count11() }).from(alerts).where(eq26(alerts.status, "pending_review")),
        policyIntelDb.select({ count: count11() }).from(alerts).where(gte15(alerts.relevanceScore, 70))
      ]);
      const spark = timeSeries.getAll();
      res.json({
        uptime: metrics.getUptimeSeconds(),
        kpis: {
          totalAlerts: alertCount?.count ?? 0,
          pendingReview: pendingCount?.count ?? 0,
          highPriority: highPriorityCount?.count ?? 0,
          pipelineRuns,
          alertsCreated,
          docsProcessed,
          docsMatched,
          matchRate: docsProcessed > 0 ? Math.round(docsMatched / docsProcessed * 100) : 0,
          escalations,
          watches,
          archives,
          alertsSkipped: alertsSkippedDup + alertsSkippedCooldown
        },
        pipeline: {
          avgScore: Math.round(scoreSummary.mean * 10) / 10,
          avgConfidence: Math.round(confidenceSummary.mean * 100) / 100,
          avgDurationMs: Math.round(durationSummary.mean * 10) / 10,
          totalRuns: scoreSummary.count
        },
        regime: activeRegime ? activeRegime.labels.regime ?? "unknown" : "unknown",
        agents: agentScores,
        sparklines: spark
      });
    } catch (err) {
      next(err);
    }
  });
  router.get("/dashboard/analytics", async (_req, res, next) => {
    try {
      const [scoreDistRaw, sourceBreakdownRaw, dailyVolumeRaw] = await Promise.all([
        policyIntelDb.execute(sql18`
          SELECT
            CASE
              WHEN relevance_score < 10 THEN '0-9'
              WHEN relevance_score < 20 THEN '10-19'
              WHEN relevance_score < 30 THEN '20-29'
              WHEN relevance_score < 40 THEN '30-39'
              WHEN relevance_score < 50 THEN '40-49'
              WHEN relevance_score < 60 THEN '50-59'
              WHEN relevance_score < 70 THEN '60-69'
              WHEN relevance_score < 80 THEN '70-79'
              WHEN relevance_score < 90 THEN '80-89'
              ELSE '90-100'
            END AS bucket,
            count(*)::int AS count
          FROM policy_intel_alerts
          GROUP BY bucket
          ORDER BY bucket
        `),
        policyIntelDb.execute(sql18`
          SELECT source_type, count(*)::int AS count
          FROM policy_intel_source_documents
          GROUP BY source_type
          ORDER BY count DESC
        `),
        policyIntelDb.execute(sql18`
          SELECT date_trunc('day', created_at)::date AS day, count(*)::int AS count
          FROM policy_intel_alerts
          WHERE created_at >= now() - interval '30 days'
          GROUP BY day
          ORDER BY day
        `)
      ]);
      res.json({
        scoreDistribution: scoreDistRaw,
        sourceTypeBreakdown: sourceBreakdownRaw,
        dailyAlertVolume: dailyVolumeRaw
      });
    } catch (err) {
      next(err);
    }
  });
  router.post("/workspaces", validateBody(createWorkspaceSchema), async (req, res, next) => {
    try {
      const { slug, name } = req.body;
      const [created] = await policyIntelDb.insert(workspaces).values({ slug, name }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/watchlists", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(watchlists).orderBy(desc20(watchlists.id)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count11() }).from(watchlists)
      ]);
      res.json({ data: rows, total: totalRow?.count ?? 0, page, limit, totalPages: Math.ceil((totalRow?.count ?? 0) / limit) });
    } catch (err) {
      next(err);
    }
  });
  router.post("/watchlists", validateBody(createWatchlistSchema), async (req, res, next) => {
    try {
      const { workspaceId, name, topic, description, rulesJson } = req.body;
      const [created] = await policyIntelDb.insert(watchlists).values({
        workspaceId: Number(workspaceId),
        name,
        topic,
        description,
        rulesJson: rulesJson ?? {}
      }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/watchlists/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [watchlist] = await policyIntelDb.select().from(watchlists).where(eq26(watchlists.id, id));
      if (!watchlist) {
        return res.status(404).json({ message: "watchlist not found" });
      }
      res.json(watchlist);
    } catch (err) {
      next(err);
    }
  });
  router.patch("/watchlists/:id", validateBody(patchWatchlistSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { name, topic, description, rulesJson, isActive } = req.body;
      const updates = {};
      if (name !== void 0) updates.name = name;
      if (topic !== void 0) updates.topic = topic;
      if (description !== void 0) updates.description = description;
      if (rulesJson !== void 0) updates.rulesJson = rulesJson;
      if (isActive !== void 0) updates.isActive = Boolean(isActive);
      updates.updatedAt = /* @__PURE__ */ new Date();
      const [updated] = await policyIntelDb.update(watchlists).set(updates).where(eq26(watchlists.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "watchlist not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
  router.get("/watchlists/:id/alerts", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const status = req.query.status;
      const conditions = [eq26(alerts.watchlistId, id)];
      if (status && status !== "all") conditions.push(eq26(alerts.status, status));
      const where = and18(...conditions);
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(alerts).where(where).orderBy(desc20(alerts.relevanceScore)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count11() }).from(alerts).where(where)
      ]);
      res.json({ data: rows, total: totalRow?.count ?? 0, page, limit, totalPages: Math.ceil((totalRow?.count ?? 0) / limit) });
    } catch (err) {
      next(err);
    }
  });
  router.post("/source-documents", validateBody(createSourceDocumentSchema), async (req, res, next) => {
    try {
      const {
        sourceType,
        publisher,
        sourceUrl,
        externalId,
        title,
        summary,
        publishedAt,
        checksum,
        rawPayload,
        normalizedText,
        tagsJson
      } = req.body;
      const [created] = await policyIntelDb.insert(sourceDocuments).values({
        sourceType,
        publisher,
        sourceUrl,
        externalId,
        title,
        summary,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        checksum,
        rawPayload: rawPayload ?? {},
        normalizedText,
        tagsJson: tagsJson ?? []
      }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/source-documents", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const sourceType = req.query.sourceType;
      const search = req.query.search;
      const conditions = [];
      if (sourceType) conditions.push(eq26(sourceDocuments.sourceType, sourceType));
      if (search) {
        const terms = search.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[^a-zA-Z0-9]/g, "")).filter(Boolean);
        if (terms.length > 0) {
          const tsq = terms.join(" & ");
          conditions.push(sql18`to_tsvector('english', coalesce(${sourceDocuments.title},'') || ' ' || coalesce(${sourceDocuments.summary},'') || ' ' || coalesce(${sourceDocuments.normalizedText},'')) @@ to_tsquery('english', ${tsq})`);
        }
      }
      const where = conditions.length > 0 ? and18(...conditions) : void 0;
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(sourceDocuments).where(where).orderBy(desc20(sourceDocuments.id)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count11() }).from(sourceDocuments).where(where)
      ]);
      const total = totalRow?.count ?? 0;
      const docIds = rows.map((r) => r.id);
      let alertCountMap = {};
      if (docIds.length > 0) {
        const alertAgg = await policyIntelDb.select({
          sourceDocumentId: alerts.sourceDocumentId,
          count: sql18`count(*)::int`,
          maxScore: sql18`coalesce(max(${alerts.relevanceScore}), 0)`
        }).from(alerts).where(inArray8(alerts.sourceDocumentId, docIds)).groupBy(alerts.sourceDocumentId);
        for (const a of alertAgg) {
          if (a.sourceDocumentId) {
            alertCountMap[a.sourceDocumentId] = { count: a.count, maxScore: a.maxScore };
          }
        }
      }
      const enriched = rows.map((r) => ({
        ...r,
        alertCount: alertCountMap[r.id]?.count ?? 0,
        maxAlertScore: alertCountMap[r.id]?.maxScore ?? 0
      }));
      res.json({ data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      next(err);
    }
  });
  router.post("/alerts", validateBody(createAlertSchema), async (req, res, next) => {
    try {
      const {
        workspaceId,
        watchlistId,
        sourceDocumentId,
        title,
        summary,
        severity,
        status,
        alertReason,
        metadataJson
      } = req.body;
      const severityScoreMap = {
        high: 80,
        medium: 50,
        low: 20,
        info: 0
      };
      const relevanceScore = severityScoreMap[severity] ?? 0;
      const validStatuses = ["pending_review", "ready", "sent", "suppressed"];
      const resolvedStatus = validStatuses.includes(status) ? status : "pending_review";
      const [created] = await policyIntelDb.insert(alerts).values({
        workspaceId: Number(workspaceId),
        watchlistId: Number(watchlistId),
        sourceDocumentId: Number(sourceDocumentId),
        title,
        summary,
        whyItMatters: alertReason ?? null,
        status: resolvedStatus,
        relevanceScore,
        reasonsJson: metadataJson ? [{ manual: true, data: metadataJson }] : []
      }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/alerts", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const status = req.query.status;
      const watchlistId = req.query.watchlistId ? Number(req.query.watchlistId) : void 0;
      const minScore = req.query.minScore ? Number(req.query.minScore) : void 0;
      const search = req.query.search;
      const conditions = [];
      if (status && status !== "all") conditions.push(eq26(alerts.status, status));
      if (watchlistId) conditions.push(eq26(alerts.watchlistId, watchlistId));
      if (minScore !== void 0) conditions.push(gte15(alerts.relevanceScore, minScore));
      if (search) {
        const terms = search.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[^a-zA-Z0-9]/g, "")).filter(Boolean);
        if (terms.length > 0) {
          const tsq = terms.join(" & ");
          conditions.push(sql18`to_tsvector('english', coalesce(${alerts.title},'') || ' ' || coalesce(${alerts.summary},'') || ' ' || coalesce(${alerts.whyItMatters},'')) @@ to_tsquery('english', ${tsq})`);
        }
      }
      const where = conditions.length > 0 ? and18(...conditions) : void 0;
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(alerts).where(where).orderBy(desc20(alerts.id)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count11() }).from(alerts).where(where)
      ]);
      const total = totalRow?.count ?? 0;
      res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      next(err);
    }
  });
  router.patch("/alerts/:id", validateBody(patchAlertSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { status, reviewerNote } = req.body;
      const validStatuses = ["pending_review", "ready", "sent", "suppressed"];
      const updates = {};
      if (status && validStatuses.includes(status)) {
        updates.status = status;
      }
      if (reviewerNote !== void 0) {
        updates.reviewerNote = reviewerNote;
      }
      updates.reviewedAt = /* @__PURE__ */ new Date();
      const [updated] = await policyIntelDb.update(alerts).set(updates).where(eq26(alerts.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "alert not found" });
      if (updated.watchlistId) {
        const links = await policyIntelDb.select().from(matterWatchlists).where(eq26(matterWatchlists.watchlistId, updated.watchlistId));
        for (const link of links) {
          await policyIntelDb.insert(activities).values({
            workspaceId: updated.workspaceId,
            matterId: link.matterId,
            alertId: updated.id,
            type: "review_completed",
            summary: `Alert "${updated.title}" reviewed \u2192 ${updated.status}`,
            detailText: reviewerNote ?? null
          });
        }
      }
      if (status && ["ready", "sent", "suppressed"].includes(status)) {
        try {
          const outcome = status === "suppressed" ? "suppressed" : "promoted";
          const reasons = updated.reasonsJson ?? [];
          const pipelineEntry = reasons.find((r) => r.evaluator === "_pipeline" || r.agent === "_pipeline");
          const agentScores = reasons.filter(
            (r) => r.evaluator !== "_pipeline" && r.agent !== "_pipeline"
          );
          await recordFeedback(updated.id, outcome, {
            originalScore: updated.relevanceScore,
            originalConfidence: updated.confidenceScore / 100,
            agentScores,
            weights: pipelineEntry?.weights ?? {},
            regime: pipelineEntry?.regime ?? "interim"
          });
        } catch (feedbackErr) {
          log12.error({ err: feedbackErr }, "champion feedback recording failed");
        }
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
  router.get("/alerts/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [alert] = await policyIntelDb.select().from(alerts).where(eq26(alerts.id, id));
      if (!alert) return res.status(404).json({ message: "alert not found" });
      const [sourceDoc, watchlist, linkedIssueRoom] = await Promise.all([
        alert.sourceDocumentId ? policyIntelDb.select().from(sourceDocuments).where(eq26(sourceDocuments.id, alert.sourceDocumentId)).then((r) => r[0] ?? null) : Promise.resolve(null),
        alert.watchlistId ? policyIntelDb.select().from(watchlists).where(eq26(watchlists.id, alert.watchlistId)).then((r) => r[0] ?? null) : Promise.resolve(null),
        alert.issueRoomId ? policyIntelDb.select().from(issueRooms).where(eq26(issueRooms.id, alert.issueRoomId)).then((r) => r[0] ?? null) : Promise.resolve(null)
      ]);
      res.json({ alert, sourceDocument: sourceDoc, watchlist, issueRoom: linkedIssueRoom });
    } catch (err) {
      next(err);
    }
  });
  router.post("/alerts/bulk-triage", validateBody(bulkTriageSchema), async (req, res, next) => {
    try {
      const suppressBelow = req.body.suppressBelow;
      const promoteAbove = req.body.promoteAbove;
      const dryRun = req.body.dryRun;
      const approvalToken = req.body.approvalToken;
      const requireApproval = process.env.BULK_TRIAGE_REQUIRE_APPROVAL !== "false";
      const approvalThreshold = Math.max(1, Number(process.env.BULK_TRIAGE_APPROVAL_THRESHOLD || 100));
      const approvalPhrase = process.env.BULK_TRIAGE_APPROVAL_TOKEN || "APPROVE_BULK_TRIAGE";
      const [pendingCountRow] = await policyIntelDb.select({ count: count11() }).from(alerts).where(eq26(alerts.status, "pending_review"));
      const pendingCount = pendingCountRow?.count ?? 0;
      const [suppressCountRow] = await policyIntelDb.select({ count: count11() }).from(alerts).where(and18(
        eq26(alerts.status, "pending_review"),
        lt(alerts.relevanceScore, suppressBelow)
      ));
      const [promoteCountRow] = await policyIntelDb.select({ count: count11() }).from(alerts).where(and18(
        eq26(alerts.status, "pending_review"),
        gte15(alerts.relevanceScore, promoteAbove)
      ));
      const toSuppress = suppressCountRow?.count ?? 0;
      const toPromote = promoteCountRow?.count ?? 0;
      const suppressShare = pendingCount > 0 ? toSuppress / pendingCount : 0;
      if (!dryRun && requireApproval && toSuppress >= approvalThreshold) {
        if (approvalToken !== approvalPhrase) {
          return res.status(409).json({
            message: `Bulk triage approval required: rerun with dryRun=true first, then set approvalToken to execute suppression of ${toSuppress} alerts`,
            requireApproval,
            approvalThreshold,
            toSuppress,
            toPromote,
            pendingCount,
            suppressShare
          });
        }
      }
      if (dryRun) {
        return res.json({
          dryRun: true,
          wouldSuppress: toSuppress,
          wouldPromote: toPromote,
          suppressBelow,
          promoteAbove,
          pendingCount,
          suppressShare,
          requireApproval,
          approvalThreshold
        });
      }
      const result = await policyIntelDb.transaction(async (tx) => {
        let suppressed = 0;
        let promoted = 0;
        if (toSuppress > 0) {
          await tx.update(alerts).set({ status: "suppressed", reviewedAt: /* @__PURE__ */ new Date(), reviewerNote: `auto-triage: score < ${suppressBelow}` }).where(and18(
            eq26(alerts.status, "pending_review"),
            lt(alerts.relevanceScore, suppressBelow)
          ));
          suppressed = toSuppress;
        }
        if (toPromote > 0) {
          await tx.update(alerts).set({ status: "ready", reviewedAt: /* @__PURE__ */ new Date(), reviewerNote: `auto-triage: score >= ${promoteAbove}` }).where(and18(
            eq26(alerts.status, "pending_review"),
            gte15(alerts.relevanceScore, promoteAbove)
          ));
          promoted = toPromote;
        }
        return { suppressed, promoted };
      });
      res.json({
        ...result,
        suppressBelow,
        promoteAbove,
        pendingCount,
        suppressShare,
        requireApproval,
        approvalThreshold
      });
    } catch (err) {
      next(err);
    }
  });
  router.get("/workspaces/:id/digest", async (req, res, next) => {
    try {
      const workspaceId = Number(req.params.id);
      const weekParam = req.query.week;
      let weekStart;
      let weekEnd;
      if (weekParam && /^\d{4}-W\d{2}$/.test(weekParam)) {
        const [yearStr, weekStr] = weekParam.split("-W");
        const year = Number(yearStr);
        const week = Number(weekStr);
        const jan4 = new Date(year, 0, 4);
        const dayOfWeek = jan4.getDay() || 7;
        weekStart = new Date(jan4);
        weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
        weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
      } else {
        const now = /* @__PURE__ */ new Date();
        const dayOfWeek = now.getDay() || 7;
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek + 1);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
      }
      const weekAlerts = await policyIntelDb.select().from(alerts).where(
        and18(
          eq26(alerts.workspaceId, workspaceId),
          gt2(alerts.createdAt, weekStart)
        )
      ).orderBy(desc20(alerts.relevanceScore));
      const filtered = weekAlerts.filter((a) => a.createdAt < weekEnd);
      const grouped = {};
      for (const alert of filtered) {
        const wlId = alert.watchlistId ?? 0;
        if (!grouped[wlId]) grouped[wlId] = { watchlistId: wlId, alerts: [] };
        grouped[wlId].alerts.push(alert);
      }
      const wlIds = Object.keys(grouped).map(Number).filter((id) => id > 0);
      const wlRows = wlIds.length > 0 ? await policyIntelDb.select().from(watchlists).where(inArray8(watchlists.id, wlIds)) : [];
      const wlNameMap = new Map(wlRows.map((w) => [w.id, w.name]));
      const sections = Object.values(grouped).map((g) => ({
        watchlist: wlNameMap.get(g.watchlistId) ?? "Unlinked",
        alertCount: g.alerts.length,
        highPriority: g.alerts.filter((a) => a.relevanceScore >= 70).length,
        alerts: g.alerts.map((a) => ({
          id: a.id,
          title: a.title,
          score: a.relevanceScore,
          status: a.status,
          whyItMatters: a.whyItMatters
        }))
      }));
      const weekActivities = await policyIntelDb.select().from(activities).where(
        and18(
          eq26(activities.workspaceId, workspaceId),
          gt2(activities.createdAt, weekStart)
        )
      ).orderBy(desc20(activities.createdAt));
      const filteredActivities = weekActivities.filter((a) => a.createdAt < weekEnd);
      res.json({
        workspace: workspaceId,
        period: {
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
          week: weekParam ?? `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)).padStart(2, "0")}`
        },
        summary: {
          totalAlerts: filtered.length,
          highPriority: filtered.filter((a) => a.relevanceScore >= 70).length,
          pendingReview: filtered.filter((a) => a.status === "pending_review").length,
          reviewed: filtered.filter((a) => a.status !== "pending_review").length,
          activitiesLogged: filteredActivities.length
        },
        sections,
        recentActivities: filteredActivities.slice(0, 20).map((a) => ({
          id: a.id,
          type: a.type,
          summary: a.summary,
          matterId: a.matterId,
          createdAt: a.createdAt
        }))
      });
    } catch (err) {
      next(err);
    }
  });
  router.get("/briefs", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(briefs).orderBy(desc20(briefs.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/briefs/generate", validateBody(generateBriefSchema), async (req, res, next) => {
    try {
      const { workspaceId, watchlistId, matterId, sourceDocumentIds, title } = req.body;
      const result = await generateBrief({
        workspaceId: Number(workspaceId),
        watchlistId: watchlistId ? Number(watchlistId) : void 0,
        matterId: matterId ? Number(matterId) : void 0,
        sourceDocumentIds: sourceDocumentIds.map(Number),
        title
      });
      if (matterId) {
        await policyIntelDb.insert(activities).values({
          workspaceId: Number(workspaceId),
          matterId: Number(matterId),
          type: "brief_drafted",
          summary: `Brief "${result.title ?? title ?? "Untitled"}" generated from ${sourceDocumentIds.length} source(s)`
        });
      }
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });
  router.get("/deliverables", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(deliverables).orderBy(desc20(deliverables.id)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count11() }).from(deliverables)
      ]);
      res.json({ data: rows, total: totalRow?.count ?? 0, page, limit, totalPages: Math.ceil((totalRow?.count ?? 0) / limit) });
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id/briefs", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const rows = await policyIntelDb.select().from(deliverables).where(eq26(deliverables.matterId, matterId)).orderBy(desc20(deliverables.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/jobs", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(monitoringJobs).orderBy(desc20(monitoringJobs.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/issue-rooms", async (req, res, next) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : void 0;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const where = workspaceId ? eq26(issueRooms.workspaceId, workspaceId) : void 0;
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(issueRooms).where(where).orderBy(desc20(issueRooms.id)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count11() }).from(issueRooms).where(where)
      ]);
      res.json({ data: rows, total: totalRow?.count ?? 0, page, limit, totalPages: Math.ceil((totalRow?.count ?? 0) / limit) });
    } catch (err) {
      next(err);
    }
  });
  router.post("/issue-rooms", validateBody(createIssueRoomSchema), async (req, res, next) => {
    try {
      const { workspaceId, matterId, slug, title, issueType, jurisdiction, status, summary, recommendedPath, ownerUserId, relatedBillIds, sourceDocumentIds } = req.body;
      const resolvedSlug = slugifyIssueRoom(slug ?? title);
      const [created] = await policyIntelDb.insert(issueRooms).values({
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : null,
        slug: resolvedSlug,
        title,
        issueType,
        jurisdiction: jurisdiction ?? "texas",
        status: status ?? "active",
        summary,
        recommendedPath,
        ownerUserId: ownerUserId ? Number(ownerUserId) : null,
        relatedBillIds: relatedBillIds ?? []
      }).returning();
      if (Array.isArray(sourceDocumentIds) && sourceDocumentIds.length > 0) {
        await policyIntelDb.insert(issueRoomSourceDocuments).values(
          sourceDocumentIds.map((sourceDocumentId) => ({
            issueRoomId: created.id,
            sourceDocumentId: Number(sourceDocumentId),
            relationshipType: "background"
          }))
        );
      }
      await policyIntelDb.insert(activities).values({
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : null,
        issueRoomId: created.id,
        type: "note_added",
        summary: `Issue room created: ${title}`,
        detailText: summary ?? null
      });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/issue-rooms/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq26(issueRooms.id, id));
      if (!issueRoom) return res.status(404).json({ message: "issue room not found" });
      const [linkedSources, updates, strategyOptions, tasks, linkedStakeholders] = await Promise.all([
        policyIntelDb.select().from(issueRoomSourceDocuments).where(eq26(issueRoomSourceDocuments.issueRoomId, id)).orderBy(desc20(issueRoomSourceDocuments.id)),
        policyIntelDb.select().from(issueRoomUpdates).where(eq26(issueRoomUpdates.issueRoomId, id)).orderBy(desc20(issueRoomUpdates.id)),
        policyIntelDb.select().from(issueRoomStrategyOptions).where(eq26(issueRoomStrategyOptions.issueRoomId, id)).orderBy(issueRoomStrategyOptions.recommendationRank, desc20(issueRoomStrategyOptions.id)),
        policyIntelDb.select().from(issueRoomTasks).where(eq26(issueRoomTasks.issueRoomId, id)).orderBy(desc20(issueRoomTasks.id)),
        policyIntelDb.select().from(stakeholders).where(eq26(stakeholders.issueRoomId, id)).orderBy(desc20(stakeholders.id))
      ]);
      const sourceIds = linkedSources.map((row) => row.sourceDocumentId);
      const sourceRows = sourceIds.length > 0 ? await policyIntelDb.select().from(sourceDocuments).where(inArray8(sourceDocuments.id, sourceIds)) : [];
      res.json({
        issueRoom,
        sourceDocuments: sourceRows,
        sourceLinks: linkedSources,
        updates,
        strategyOptions,
        tasks,
        stakeholders: linkedStakeholders
      });
    } catch (err) {
      next(err);
    }
  });
  router.post("/alerts/:id/create-issue-room", validateBody(createIssueRoomFromAlertSchema), async (req, res, next) => {
    try {
      const alertId = Number(req.params.id);
      const [alert] = await policyIntelDb.select().from(alerts).where(eq26(alerts.id, alertId));
      if (!alert) return res.status(404).json({ message: "alert not found" });
      const { matterId, slug, title, issueType, jurisdiction, summary, recommendedPath, ownerUserId, relatedBillIds } = req.body;
      const resolvedTitle = title ?? alert.title;
      const [created] = await policyIntelDb.insert(issueRooms).values({
        workspaceId: alert.workspaceId,
        matterId: matterId ? Number(matterId) : null,
        slug: slugifyIssueRoom(slug ?? resolvedTitle),
        title: resolvedTitle,
        issueType,
        jurisdiction: jurisdiction ?? "texas",
        status: "active",
        summary: summary ?? alert.summary ?? alert.whyItMatters,
        recommendedPath,
        ownerUserId: ownerUserId ? Number(ownerUserId) : null,
        relatedBillIds: relatedBillIds ?? []
      }).returning();
      if (alert.sourceDocumentId) {
        await policyIntelDb.insert(issueRoomSourceDocuments).values({
          issueRoomId: created.id,
          sourceDocumentId: alert.sourceDocumentId,
          relationshipType: "primary_authority"
        });
      }
      const [updatedAlert] = await policyIntelDb.update(alerts).set({ issueRoomId: created.id }).where(eq26(alerts.id, alertId)).returning();
      await policyIntelDb.insert(activities).values({
        workspaceId: alert.workspaceId,
        matterId: matterId ? Number(matterId) : null,
        issueRoomId: created.id,
        alertId: alert.id,
        type: "note_added",
        summary: `Issue room created from alert: ${resolvedTitle}`,
        detailText: alert.whyItMatters ?? alert.summary ?? null
      });
      try {
        const reasons = alert.reasonsJson ?? [];
        const pipelineEntry = reasons.find((r) => r.evaluator === "_pipeline" || r.agent === "_pipeline");
        const agentScores = reasons.filter(
          (r) => r.evaluator !== "_pipeline" && r.agent !== "_pipeline"
        );
        await recordFeedback(alert.id, "strong_positive", {
          originalScore: alert.relevanceScore,
          originalConfidence: alert.confidenceScore / 100,
          agentScores,
          weights: pipelineEntry?.weights ?? {},
          regime: pipelineEntry?.regime ?? "interim"
        });
      } catch (feedbackErr) {
        log12.error({ err: feedbackErr }, "champion strong_positive feedback failed");
      }
      res.status(201).json({ issueRoom: created, alert: updatedAlert });
    } catch (err) {
      next(err);
    }
  });
  router.patch("/issue-rooms/:id", validateBody(patchIssueRoomSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { title, summary, status, recommendedPath, issueType, jurisdiction } = req.body;
      const patch = {};
      if (title !== void 0) patch.title = title;
      if (summary !== void 0) patch.summary = summary;
      if (status !== void 0) patch.status = status;
      if (recommendedPath !== void 0) patch.recommendedPath = recommendedPath;
      if (issueType !== void 0) patch.issueType = issueType;
      if (jurisdiction !== void 0) patch.jurisdiction = jurisdiction;
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }
      patch.updatedAt = /* @__PURE__ */ new Date();
      const [updated] = await policyIntelDb.update(issueRooms).set(patch).where(eq26(issueRooms.id, id)).returning();
      if (!updated) {
        return res.status(404).json({ message: "Issue room not found" });
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
  router.get("/issue-rooms/:id/alerts", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const linkedDocs = await policyIntelDb.select({ sourceDocumentId: issueRoomSourceDocuments.sourceDocumentId }).from(issueRoomSourceDocuments).where(eq26(issueRoomSourceDocuments.issueRoomId, issueRoomId));
      const linkedSourceDocumentIds = linkedDocs.map((row) => row.sourceDocumentId);
      const rows = linkedSourceDocumentIds.length > 0 ? await policyIntelDb.select().from(alerts).where(
        or2(
          eq26(alerts.issueRoomId, issueRoomId),
          inArray8(alerts.sourceDocumentId, linkedSourceDocumentIds)
        )
      ).orderBy(desc20(alerts.id)) : await policyIntelDb.select().from(alerts).where(eq26(alerts.issueRoomId, issueRoomId)).orderBy(desc20(alerts.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/issue-rooms/:id/updates", validateBody(createIssueRoomUpdateSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { title, body, updateType, sourcePackJson } = req.body;
      const [created] = await policyIntelDb.insert(issueRoomUpdates).values({
        issueRoomId,
        title,
        body,
        updateType: updateType ?? "analysis",
        sourcePackJson: sourcePackJson ?? []
      }).returning();
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq26(issueRooms.id, issueRoomId));
      if (issueRoom) {
        await policyIntelDb.insert(activities).values({
          workspaceId: issueRoom.workspaceId,
          matterId: issueRoom.matterId,
          issueRoomId,
          type: "note_added",
          summary: `Issue room update added: ${title}`,
          detailText: body
        });
      }
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.post("/issue-rooms/:id/strategy-options", validateBody(createStrategyOptionSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { label, description, prosJson, consJson, politicalFeasibility, legalDurability, implementationComplexity, recommendationRank } = req.body;
      const [created] = await policyIntelDb.insert(issueRoomStrategyOptions).values({
        issueRoomId,
        label,
        description,
        prosJson: prosJson ?? [],
        consJson: consJson ?? [],
        politicalFeasibility,
        legalDurability,
        implementationComplexity,
        recommendationRank: recommendationRank ? Number(recommendationRank) : 0
      }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.post("/issue-rooms/:id/tasks", validateBody(createTaskSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { title, description, status, priority, assignee, dueDate } = req.body;
      const [created] = await policyIntelDb.insert(issueRoomTasks).values({
        issueRoomId,
        title,
        description,
        status: status ?? "todo",
        priority: priority ?? "medium",
        assignee,
        dueDate: dueDate ? new Date(dueDate) : null
      }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.patch("/issue-rooms/:issueRoomId/tasks/:taskId", validateBody(patchTaskSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.issueRoomId);
      const taskId = Number(req.params.taskId);
      const { status, priority, assignee, dueDate, completedAt } = req.body;
      const [existing] = await policyIntelDb.select().from(issueRoomTasks).where(and18(eq26(issueRoomTasks.id, taskId), eq26(issueRoomTasks.issueRoomId, issueRoomId)));
      if (!existing) {
        return res.status(404).json({ message: "task not found" });
      }
      const updateValues = {};
      if (status !== void 0) updateValues.status = status;
      if (priority !== void 0) updateValues.priority = priority;
      if (assignee !== void 0) updateValues.assignee = assignee;
      if (dueDate !== void 0) updateValues.dueDate = dueDate ? new Date(dueDate) : null;
      if (completedAt !== void 0) {
        updateValues.completedAt = completedAt ? new Date(completedAt) : null;
      } else if (status !== void 0) {
        updateValues.completedAt = status === "done" ? /* @__PURE__ */ new Date() : null;
      }
      const [updated] = await policyIntelDb.update(issueRoomTasks).set(updateValues).where(and18(eq26(issueRoomTasks.id, taskId), eq26(issueRoomTasks.issueRoomId, issueRoomId))).returning();
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq26(issueRooms.id, issueRoomId));
      if (issueRoom) {
        await policyIntelDb.insert(activities).values({
          workspaceId: issueRoom.workspaceId,
          matterId: issueRoom.matterId,
          issueRoomId,
          type: "status_changed",
          summary: `Issue room task updated: ${updated.title}`,
          detailText: `status=${updated.status}; priority=${updated.priority}; assignee=${updated.assignee ?? ""}`
        });
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
  router.post("/issue-rooms/:id/stakeholders", validateBody(createIssueRoomStakeholderSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq26(issueRooms.id, issueRoomId));
      if (!issueRoom) return res.status(404).json({ message: "issue room not found" });
      const { type, name, title, organization, jurisdiction, tagsJson, sourceSummary } = req.body;
      const [created] = await policyIntelDb.insert(stakeholders).values({
        workspaceId: issueRoom.workspaceId,
        issueRoomId,
        type,
        name,
        title,
        organization,
        jurisdiction,
        tagsJson: tagsJson ?? [],
        sourceSummary
      }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(matters).orderBy(desc20(matters.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/matters", validateBody(createMatterSchema), async (req, res, next) => {
    try {
      const { workspaceId, slug, name, clientName, practiceArea, jurisdictionScope, status, ownerUserId, description, tagsJson } = req.body;
      const [created] = await policyIntelDb.insert(matters).values({
        workspaceId: Number(workspaceId),
        slug,
        name,
        clientName,
        practiceArea,
        jurisdictionScope: jurisdictionScope ?? "texas",
        status: status ?? "active",
        ownerUserId: ownerUserId ? Number(ownerUserId) : null,
        description,
        tagsJson: tagsJson ?? []
      }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [matter] = await policyIntelDb.select().from(matters).where(eq26(matters.id, id));
      if (!matter) return res.status(404).json({ message: "matter not found" });
      res.json(matter);
    } catch (err) {
      next(err);
    }
  });
  router.post("/matters/:id/watchlists", validateBody(linkWatchlistToMatterSchema), async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const { watchlistId } = req.body;
      const [created] = await policyIntelDb.insert(matterWatchlists).values({ matterId, watchlistId: Number(watchlistId) }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id/watchlists", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const links = await policyIntelDb.select().from(matterWatchlists).where(eq26(matterWatchlists.matterId, matterId));
      if (links.length === 0) return res.json([]);
      const wlIds = links.map((l) => l.watchlistId);
      const rows = await policyIntelDb.select().from(watchlists).where(inArray8(watchlists.id, wlIds));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id/alerts", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const links = await policyIntelDb.select().from(matterWatchlists).where(eq26(matterWatchlists.matterId, matterId));
      if (links.length === 0) return res.json([]);
      const wlIds = links.map((l) => l.watchlistId);
      const rows = await policyIntelDb.select().from(alerts).where(inArray8(alerts.watchlistId, wlIds)).orderBy(desc20(alerts.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/matters/:id/activities", validateBody(createActivitySchema), async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const { workspaceId, alertId, type, ownerUserId, summary, detailText, dueAt } = req.body;
      const [created] = await policyIntelDb.insert(activities).values({
        workspaceId: Number(workspaceId),
        matterId,
        alertId: alertId ? Number(alertId) : null,
        type,
        ownerUserId: ownerUserId ? Number(ownerUserId) : null,
        summary,
        detailText,
        dueAt: dueAt ? new Date(dueAt) : null
      }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id/activities", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const rows = await policyIntelDb.select().from(activities).where(eq26(activities.matterId, matterId)).orderBy(desc20(activities.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/activities", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(activities).orderBy(desc20(activities.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/stakeholders/for-bill/:billId", async (req, res, next) => {
    try {
      const billId = req.params.billId.toUpperCase().replace(/\s+/g, " ");
      const hearingRows = await policyIntelDb.select({ committee: hearingEvents.committee, chamber: hearingEvents.chamber }).from(hearingEvents).where(sql18`${hearingEvents.relatedBillIds}::jsonb @> ${JSON.stringify([billId])}::jsonb`);
      const docRows = await policyIntelDb.select({
        committee: sql18`${sourceDocuments.rawPayload}->>'committee'`,
        feedType: sql18`${sourceDocuments.rawPayload}->>'feedType'`
      }).from(sourceDocuments).where(
        or2(
          ilike6(sourceDocuments.title, `%${escapeLike(billId)}%`),
          sql18`${sourceDocuments.rawPayload}->>'billId' = ${billId}`
        )
      );
      const committeeNames = /* @__PURE__ */ new Set();
      for (const r of hearingRows) committeeNames.add(r.committee);
      for (const r of docRows) {
        if (r.committee) committeeNames.add(r.committee);
      }
      let members = [];
      if (committeeNames.size > 0) {
        members = await policyIntelDb.select({
          committeeMemberId: committeeMembers.id,
          committeeName: committeeMembers.committeeName,
          role: committeeMembers.role,
          stakeholderId: stakeholders.id,
          name: stakeholders.name,
          party: stakeholders.party,
          chamber: stakeholders.chamber,
          district: stakeholders.district,
          title: stakeholders.title,
          email: stakeholders.email,
          phone: stakeholders.phone
        }).from(committeeMembers).innerJoin(stakeholders, eq26(committeeMembers.stakeholderId, stakeholders.id)).where(inArray8(committeeMembers.committeeName, [...committeeNames]));
      }
      const observedStakeholders = await policyIntelDb.select({
        stakeholderId: stakeholders.id,
        name: stakeholders.name,
        party: stakeholders.party,
        chamber: stakeholders.chamber,
        district: stakeholders.district,
        title: stakeholders.title,
        email: stakeholders.email,
        phone: stakeholders.phone,
        observationText: stakeholderObservations.observationText
      }).from(stakeholderObservations).innerJoin(stakeholders, eq26(stakeholderObservations.stakeholderId, stakeholders.id)).where(ilike6(stakeholderObservations.observationText, `%${escapeLike(billId)}%`));
      res.json({
        billId,
        committees: [...committeeNames],
        committeeMembers: members,
        relatedStakeholders: observedStakeholders
      });
    } catch (err) {
      next(err);
    }
  });
  router.get("/stakeholders", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(stakeholders).orderBy(desc20(stakeholders.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/stakeholders", validateBody(createStakeholderSchema), async (req, res, next) => {
    try {
      const { workspaceId, type, name, title, organization, jurisdiction, tagsJson, sourceSummary } = req.body;
      const result = await upsertStakeholder({
        workspaceId: Number(workspaceId),
        type,
        name,
        title,
        organization,
        jurisdiction,
        tagsJson: tagsJson ?? [],
        sourceSummary
      });
      res.status(result.created ? 201 : 200).json(result.stakeholder);
    } catch (err) {
      next(err);
    }
  });
  router.get("/stakeholders/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const result = await getStakeholderWithObservations(id);
      if (!result) return res.status(404).json({ message: "stakeholder not found" });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/stakeholders/:id/observations", validateBody(createObservationSchema), async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const { sourceDocumentId, matterId, observationText, confidence } = req.body;
      const obs = await addObservation({
        stakeholderId,
        sourceDocumentId: sourceDocumentId ? Number(sourceDocumentId) : void 0,
        matterId: matterId ? Number(matterId) : void 0,
        observationText,
        confidence
      });
      res.status(201).json(obs);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id/stakeholders", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const rows = await getStakeholdersForMatter(matterId);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/jobs/fetch-tec", validateBody(fetchTecSchema), async (req, res, next) => {
    try {
      const { searchTerm } = req.body;
      const result = await fetchTecData(searchTerm);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/jobs/run-tec-import", validateBody(runTecImportSchema), async (req, res, next) => {
    try {
      const { searchTerm, workspaceId, matterId, mode } = req.body;
      const result = await runTecImportJob({
        mode: mode === "sweep" ? "sweep" : "search",
        searchTerm,
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : void 0
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/jobs/run-local-feeds", async (_req, res, next) => {
    try {
      const result = await runLocalFeedsJob();
      const status = result.feedErrors.length === result.feedsAttempted ? 500 : 200;
      res.status(status).json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/seed", async (_req, res, next) => {
    try {
      const result = await seedGraceMcEwan();
      res.status(200).json({
        message: "Grace & McEwan workspace seeded",
        workspaceId: result.workspace.id,
        watchlistIds: result.watchlistIds,
        matterIds: result.matterIds,
        issueRoomIds: result.issueRoomIds
      });
    } catch (err) {
      next(err);
    }
  });
  router.post("/jobs/run-tlo-rss", async (_req, res, next) => {
    try {
      const result = await runTloRssJob();
      const status = result.feedErrors.length === result.feedsAttempted ? 500 : 200;
      res.status(status).json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/jobs/run-legiscan", validateBody(runLegiscanSchema), async (req, res, next) => {
    try {
      const { mode, sinceDays, limit, offset, orderBy, sessionId, detailConcurrency } = req.body;
      const parsedOrderBy = typeof orderBy === "string" ? orderBy.trim() : void 0;
      const result = await runLegiscanJob({
        mode: mode === "full" || mode === "backfill" ? mode : "recent",
        sinceDays: sinceDays !== void 0 ? Number(sinceDays) : void 0,
        limit: limit !== void 0 ? Number(limit) : void 0,
        offset: offset !== void 0 ? Number(offset) : void 0,
        orderBy: parsedOrderBy === "bill_id_asc" || parsedOrderBy === "bill_id_desc" || parsedOrderBy === "last_action_date_asc" || parsedOrderBy === "last_action_date_desc" ? parsedOrderBy : void 0,
        sessionId: sessionId !== void 0 ? Number(sessionId) : void 0,
        detailConcurrency: detailConcurrency !== void 0 ? Number(detailConcurrency) : void 0
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/replay/legiscan/runs", validateBody(createReplayRunSchema), async (req, res, next) => {
    try {
      const { sessionId, mode, chunkSize, orderBy, requestedBy, sinceDays, detailConcurrency, startNow, maxChunks } = req.body;
      const created = await createLegiscanReplayRun({
        sessionId: Number(sessionId),
        mode: typeof mode === "string" ? mode : void 0,
        chunkSize: Number.isFinite(Number(chunkSize)) ? Number(chunkSize) : void 0,
        orderBy: typeof orderBy === "string" ? orderBy : void 0,
        requestedBy: typeof requestedBy === "string" ? requestedBy : void 0,
        sinceDays: Number.isFinite(Number(sinceDays)) ? Number(sinceDays) : void 0,
        detailConcurrency: Number.isFinite(Number(detailConcurrency)) ? Number(detailConcurrency) : void 0
      });
      if (startNow === true) {
        const started = await advanceReplayRun(created.run.id, {
          maxChunks: Number.isFinite(Number(maxChunks)) ? Number(maxChunks) : 1,
          untilCompleted: maxChunks === "all",
          stopOnError: true
        });
        return res.status(201).json(started);
      }
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/replay/legiscan/runs", async (req, res, next) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : void 0;
      const limit = Number.isFinite(Number(req.query.limit)) ? Number(req.query.limit) : void 0;
      const rows = await listReplayRuns({
        status,
        limit
      });
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/replay/legiscan/runs/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await getReplayRunDetail(id);
      res.json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.post("/replay/legiscan/runs/:id/advance", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await advanceReplayRun(id, {
        maxChunks: Number.isFinite(Number(req.body?.maxChunks)) ? Number(req.body.maxChunks) : void 0,
        untilCompleted: req.body?.untilCompleted === true,
        stopOnError: req.body?.stopOnError !== false
      });
      res.json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.post("/replay/legiscan/runs/:id/pause", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await pauseReplayRun(id);
      res.json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.post("/replay/legiscan/runs/:id/resume", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await advanceReplayRun(id, {
        maxChunks: Number.isFinite(Number(req.body?.maxChunks)) ? Number(req.body.maxChunks) : 1,
        untilCompleted: req.body?.untilCompleted === true,
        stopOnError: req.body?.stopOnError !== false
      });
      res.json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.post("/jobs/match-existing", async (_req, res, next) => {
    try {
      const allDocs = await policyIntelDb.select().from(sourceDocuments);
      const allWorkspaces = await policyIntelDb.select({ id: workspaces.id }).from(workspaces);
      const totals = { created: 0, skippedDuplicate: 0, skippedCooldown: 0, details: [] };
      for (const doc of allDocs) {
        for (const ws of allWorkspaces) {
          const r = await processDocumentAlerts(doc, ws.id);
          totals.created += r.created;
          totals.skippedDuplicate += r.skippedDuplicate;
          totals.skippedCooldown += r.skippedCooldown;
          totals.details.push(...r.details);
        }
      }
      res.json({ docsProcessed: allDocs.length, workspaces: allWorkspaces.length, alerts: totals });
    } catch (err) {
      next(err);
    }
  });
  router.get("/scheduler/status", (_req, res) => {
    res.json(getSchedulerStatus());
  });
  router.get("/scheduler/history", (_req, res) => {
    res.json(getJobHistory());
  });
  router.get("/ops/environment", (_req, res) => {
    res.json(getEnvironmentStatusReport());
  });
  router.post("/scheduler/trigger/:jobName", async (req, res, next) => {
    try {
      const { jobName } = req.params;
      const validJobs = ["legiscan-recent", "tlo-rss", "local-feeds", "tec-sweep", "intel-briefing", "committee-intel-sync"];
      if (!validJobs.includes(jobName)) {
        return res.status(400).json({ message: `Invalid job name. Valid: ${validJobs.join(", ")}` });
      }
      const record = await triggerJob(jobName);
      if (!record) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(record);
    } catch (err) {
      next(err);
    }
  });
  router.get("/metrics/pipeline", async (_req, res, next) => {
    try {
      const config = getPipelineConfig();
      const probe = await runAgentPipeline("probe", null, []);
      res.json({
        ...config,
        currentRegime: probe.regime,
        currentWeights: probe.weights,
        probeScore: probe.totalScore,
        probeAction: probe.action,
        probeConfidence: probe.confidence
      });
    } catch (err) {
      next(err);
    }
  });
  router.post("/metrics/pipeline/test", validateBody(pipelineTestSchema), async (req, res, next) => {
    try {
      const { title, summary, reasons } = req.body;
      const signal = await runAgentPipeline(
        title,
        summary ?? null,
        Array.isArray(reasons) ? reasons : []
      );
      res.json(signal);
    } catch (err) {
      next(err);
    }
  });
  router.get("/champion/status", async (_req, res, next) => {
    try {
      const status = await getChampionStatus();
      res.json(status);
    } catch (err) {
      next(err);
    }
  });
  router.get("/champion/history", async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const history2 = await getChampionHistory(limit);
      res.json(history2);
    } catch (err) {
      next(err);
    }
  });
  router.post("/champion/retrain", async (_req, res, next) => {
    try {
      const result = await runRetraining();
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/champion/bootstrap", async (req, res, next) => {
    try {
      const sampleSize = Math.min(Number(req.body?.sampleSize) || 100, 500);
      const result = await bootstrapFeedback(sampleSize);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.get("/hearings", async (req, res, next) => {
    try {
      const { from, to, chamber, committee } = req.query;
      const conditions = [];
      if (from) conditions.push(gte15(hearingEvents.hearingDate, new Date(from)));
      if (to) conditions.push(lt(hearingEvents.hearingDate, new Date(to)));
      if (chamber) conditions.push(eq26(hearingEvents.chamber, chamber));
      if (committee) conditions.push(ilike6(hearingEvents.committee, `%${escapeLike(committee)}%`));
      const rows = await policyIntelDb.select().from(hearingEvents).where(conditions.length > 0 ? and18(...conditions) : void 0).orderBy(hearingEvents.hearingDate);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/hearings/this-week", async (req, res, next) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      const rows = await policyIntelDb.select().from(hearingEvents).where(and18(
        gte15(hearingEvents.hearingDate, monday),
        lt(hearingEvents.hearingDate, nextMonday)
      )).orderBy(hearingEvents.hearingDate);
      res.json({ weekStart: monday.toISOString(), weekEnd: nextMonday.toISOString(), hearings: rows });
    } catch (err) {
      next(err);
    }
  });
  router.get("/hearings/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [row] = await policyIntelDb.select().from(hearingEvents).where(eq26(hearingEvents.id, id));
      if (!row) return res.status(404).json({ message: "Hearing not found" });
      res.json(row);
    } catch (err) {
      next(err);
    }
  });
  router.post("/hearings/sync", async (req, res, next) => {
    try {
      const docs = await policyIntelDb.select().from(sourceDocuments).where(
        or2(
          sql18`${sourceDocuments.rawPayload}->>'feedType' = 'upcomingmeetingshouse'`,
          sql18`${sourceDocuments.rawPayload}->>'feedType' = 'upcomingmeetingssenate'`,
          sql18`${sourceDocuments.rawPayload}->>'feedType' = 'upcomingmeetingsjoint'`
        )
      );
      let created = 0;
      let skipped = 0;
      for (const doc of docs) {
        const rp = doc.rawPayload ?? {};
        const feedType = rp.feedType ?? "";
        const chamber = feedType.includes("house") ? "House" : feedType.includes("senate") ? "Senate" : "Joint";
        const titleMatch = doc.title?.match(/^(.+?)\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (!titleMatch) {
          skipped++;
          continue;
        }
        const committee = titleMatch[1].trim();
        const dateStr = titleMatch[2];
        const [month, day, year] = dateStr.split("/").map(Number);
        const hearingDate = new Date(year, month - 1, day);
        const rawDesc = rp.rawDescription ?? "";
        const timeMatch = rawDesc.match(/Time:\s*(.+?)(?:,|$)/i);
        const locMatch = rawDesc.match(/Location:\s*(.+?)(?:,|$)/i);
        const timeDesc = timeMatch ? timeMatch[1].trim() : null;
        const location = locMatch ? locMatch[1].trim() : null;
        if (timeDesc) {
          const tMatch = timeDesc.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (tMatch) {
            let hours = parseInt(tMatch[1]);
            const mins = parseInt(tMatch[2]);
            const ampm = tMatch[3].toUpperCase();
            if (ampm === "PM" && hours !== 12) hours += 12;
            if (ampm === "AM" && hours === 12) hours = 0;
            hearingDate.setHours(hours, mins, 0, 0);
          }
        }
        const extId = `tlo-hearing-${doc.id}`;
        const [existing] = await policyIntelDb.select({ id: hearingEvents.id }).from(hearingEvents).where(eq26(hearingEvents.externalId, extId));
        if (existing) {
          skipped++;
          continue;
        }
        await policyIntelDb.insert(hearingEvents).values({
          workspaceId: 1,
          sourceDocumentId: doc.id,
          committee,
          chamber,
          hearingDate,
          timeDescription: timeDesc,
          location,
          description: doc.summary,
          relatedBillIds: [],
          status: "scheduled",
          externalId: extId
        });
        created++;
      }
      res.json({ totalDocs: docs.length, created, skipped });
    } catch (err) {
      next(err);
    }
  });
  router.get("/committee-intel/sessions", async (req, res, next) => {
    try {
      const workspaceId = req.query.workspaceId ? parseId(String(req.query.workspaceId)) : null;
      const hearingId = req.query.hearingId ? parseId(String(req.query.hearingId)) : null;
      const status = typeof req.query.status === "string" ? req.query.status : void 0;
      const from = typeof req.query.from === "string" ? req.query.from : void 0;
      const rows = await listCommitteeIntelSessions({
        workspaceId: workspaceId ?? void 0,
        hearingId: hearingId ?? void 0,
        status,
        from
      });
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-intel/sessions/from-hearing", validateBody(createCommitteeIntelFromHearingSchema), async (req, res, next) => {
    try {
      const workspaceId = req.body.workspaceId;
      const hearingId = req.body.hearingId;
      const detail = await createCommitteeIntelSessionFromHearing({
        workspaceId,
        hearingId,
        title: typeof req.body?.title === "string" ? req.body.title : void 0,
        focusTopics: Array.isArray(req.body?.focusTopics) ? req.body.focusTopics : void 0,
        interimCharges: Array.isArray(req.body?.interimCharges) ? req.body.interimCharges : void 0,
        clientContext: typeof req.body?.clientContext === "string" ? req.body.clientContext : void 0,
        monitoringNotes: typeof req.body?.monitoringNotes === "string" ? req.body.monitoringNotes : void 0,
        videoUrl: typeof req.body?.videoUrl === "string" ? req.body.videoUrl : void 0,
        agendaUrl: typeof req.body?.agendaUrl === "string" ? req.body.agendaUrl : void 0,
        transcriptSourceType: typeof req.body?.transcriptSourceType === "string" ? req.body.transcriptSourceType : void 0,
        transcriptSourceUrl: typeof req.body?.transcriptSourceUrl === "string" ? req.body.transcriptSourceUrl : void 0,
        autoIngestEnabled: typeof req.body?.autoIngestEnabled === "boolean" ? req.body.autoIngestEnabled : void 0,
        autoIngestIntervalSeconds: typeof req.body?.autoIngestIntervalSeconds === "number" ? req.body.autoIngestIntervalSeconds : void 0,
        status: typeof req.body?.status === "string" ? req.body.status : void 0
      });
      res.status(201).json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.get("/committee-intel/sessions/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await getCommitteeIntelSession(id);
      if (!detail) return res.status(404).json({ message: "Committee intelligence session not found" });
      res.json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.patch("/committee-intel/sessions/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await updateCommitteeIntelSession(id, {
        title: typeof req.body?.title === "string" ? req.body.title : void 0,
        focusTopics: Array.isArray(req.body?.focusTopics) ? req.body.focusTopics : void 0,
        interimCharges: Array.isArray(req.body?.interimCharges) ? req.body.interimCharges : void 0,
        clientContext: typeof req.body?.clientContext === "string" || req.body?.clientContext === null ? req.body.clientContext : void 0,
        monitoringNotes: typeof req.body?.monitoringNotes === "string" || req.body?.monitoringNotes === null ? req.body.monitoringNotes : void 0,
        liveSummary: typeof req.body?.liveSummary === "string" || req.body?.liveSummary === null ? req.body.liveSummary : void 0,
        agendaUrl: typeof req.body?.agendaUrl === "string" || req.body?.agendaUrl === null ? req.body.agendaUrl : void 0,
        videoUrl: typeof req.body?.videoUrl === "string" || req.body?.videoUrl === null ? req.body.videoUrl : void 0,
        transcriptSourceType: typeof req.body?.transcriptSourceType === "string" ? req.body.transcriptSourceType : void 0,
        transcriptSourceUrl: typeof req.body?.transcriptSourceUrl === "string" || req.body?.transcriptSourceUrl === null ? req.body.transcriptSourceUrl : void 0,
        autoIngestEnabled: typeof req.body?.autoIngestEnabled === "boolean" ? req.body.autoIngestEnabled : void 0,
        autoIngestIntervalSeconds: typeof req.body?.autoIngestIntervalSeconds === "number" ? req.body.autoIngestIntervalSeconds : void 0,
        status: typeof req.body?.status === "string" ? req.body.status : void 0
      });
      res.json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.delete("/committee-intel/sessions/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const result = await deleteCommitteeIntelSession(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-intel/sessions/:id/reset", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const result = await resetCommitteeIntelSession(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-intel/sessions/:id/rebuild", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const result = await rebuildCommitteeIntelSession(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-intel/sessions/:id/segments", validateBody(addSegmentSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await addCommitteeIntelSegment(id, {
        capturedAt: typeof req.body?.capturedAt === "string" ? req.body.capturedAt : void 0,
        startedAtSecond: typeof req.body?.startedAtSecond === "number" ? req.body.startedAtSecond : null,
        endedAtSecond: typeof req.body?.endedAtSecond === "number" ? req.body.endedAtSecond : null,
        speakerName: typeof req.body?.speakerName === "string" ? req.body.speakerName : void 0,
        speakerRole: typeof req.body?.speakerRole === "string" ? req.body.speakerRole : void 0,
        affiliation: typeof req.body?.affiliation === "string" ? req.body.affiliation : void 0,
        transcriptText: req.body.transcriptText,
        invited: typeof req.body?.invited === "boolean" ? req.body.invited : void 0,
        metadata: req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : void 0
      });
      res.status(201).json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-intel/sessions/:id/analyze", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await refreshCommitteeIntelSession(id);
      res.json(detail);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-intel/sessions/:id/sync-feed", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const result = await syncCommitteeIntelTranscriptFeed(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-intel/sessions/:id/focused-brief", validateBody(focusedBriefSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const brief = await generateCommitteeIntelFocusedBrief(id, req.body.issue);
      res.json(brief);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-intel/sessions/:id/post-hearing-recap", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const recap = await generateCommitteeIntelPostHearingRecap(id);
      res.json(recap);
    } catch (err) {
      next(err);
    }
  });
  router.post("/committee-members/import", async (req, res, next) => {
    try {
      const apiKey = process.env.OPENSTATES_API_KEY || "";
      if (!apiKey) return res.status(400).json({ message: "OPENSTATES_API_KEY not configured" });
      const graphqlUrl = "https://openstates.org/graphql";
      const houseOrgId = "ocd-organization/d6189dbb-417e-429e-ae4b-2ee6747eddc0";
      const senateOrgId = "ocd-organization/cabf1716-c572-406a-bfdd-1917c11ac629";
      const fetchMembers = async (orgId, chamber) => {
        const allEdges = [];
        let cursor = null;
        let hasMore = true;
        while (hasMore) {
          const afterClause = cursor ? `, after: "${cursor}"` : "";
          const query = `{ people(memberOf: "${orgId}", first: 100${afterClause}) { edges { node { name familyName currentMemberships { organization { name classification } role } } } pageInfo { hasNextPage endCursor } } }`;
          const resp = await fetch(graphqlUrl, {
            method: "POST",
            headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({ query })
          });
          const json = await resp.json();
          const edges = json?.data?.people?.edges ?? [];
          allEdges.push(...edges);
          hasMore = json?.data?.people?.pageInfo?.hasNextPage ?? false;
          cursor = json?.data?.people?.pageInfo?.endCursor ?? null;
        }
        return allEdges.map((e) => ({
          name: e.node.name,
          familyName: e.node.familyName || "",
          chamber,
          committees: (e.node.currentMemberships ?? []).filter((m) => m.organization.classification === "committee").map((m) => ({
            name: m.organization.name,
            role: m.role || "member"
          }))
        }));
      };
      log12.info("importing committee memberships from OpenStates GraphQL");
      const [houseMembers, senateMembers] = await Promise.all([
        fetchMembers(houseOrgId, "House"),
        fetchMembers(senateOrgId, "Senate")
      ]);
      const allMembers = [...houseMembers, ...senateMembers];
      log12.info({ total: allMembers.length, house: houseMembers.length, senate: senateMembers.length }, "fetched legislators from OpenStates");
      const existingStakeholders = await policyIntelDb.select({ id: stakeholders.id, name: stakeholders.name, chamber: stakeholders.chamber }).from(stakeholders).where(eq26(stakeholders.type, "legislator"));
      const normalize = (s) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const nameMap = /* @__PURE__ */ new Map();
      const familyMap = /* @__PURE__ */ new Map();
      for (const s of existingStakeholders) {
        nameMap.set(normalize(s.name), { id: s.id, chamber: s.chamber });
        const parts = s.name.split(/\s+/);
        if (parts.length > 1) {
          familyMap.set(normalize(parts[parts.length - 1]), { id: s.id, chamber: s.chamber });
        }
      }
      await policyIntelDb.delete(committeeMembers);
      let matched = 0;
      let unmatched = 0;
      let inserted = 0;
      const unmatchedNames = [];
      for (const member of allMembers) {
        const normName = normalize(member.name);
        let stakeholder = nameMap.get(normName);
        if (!stakeholder && member.familyName) {
          stakeholder = familyMap.get(normalize(member.familyName));
        }
        if (!stakeholder) {
          unmatched++;
          unmatchedNames.push(member.name);
          continue;
        }
        matched++;
        for (const comm of member.committees) {
          const roleStr = comm.role.toLowerCase();
          const dbRole = roleStr.includes("chair") && !roleStr.includes("vice") ? "chair" : roleStr.includes("vice") ? "vice_chair" : "member";
          await policyIntelDb.insert(committeeMembers).values({
            stakeholderId: stakeholder.id,
            committeeName: comm.name,
            chamber: member.chamber,
            role: dbRole
          });
          inserted++;
        }
      }
      log12.info({ matched, unmatched, inserted }, "committee import complete");
      res.json({
        success: true,
        matched,
        unmatched,
        inserted,
        unmatchedNames: unmatchedNames.slice(0, 20),
        totalFetched: allMembers.length
      });
    } catch (err) {
      next(err);
    }
  });
  router.get("/committee-members", async (req, res, next) => {
    try {
      const { stakeholderId, committee, chamber } = req.query;
      const conditions = [];
      if (stakeholderId) conditions.push(eq26(committeeMembers.stakeholderId, Number(stakeholderId)));
      if (committee) conditions.push(ilike6(committeeMembers.committeeName, `%${escapeLike(committee)}%`));
      if (chamber) conditions.push(eq26(committeeMembers.chamber, chamber));
      const rows = await policyIntelDb.select({
        id: committeeMembers.id,
        stakeholderId: committeeMembers.stakeholderId,
        committeeName: committeeMembers.committeeName,
        chamber: committeeMembers.chamber,
        role: committeeMembers.role,
        sessionId: committeeMembers.sessionId,
        stakeholderName: stakeholders.name,
        stakeholderParty: stakeholders.party,
        stakeholderDistrict: stakeholders.district
      }).from(committeeMembers).leftJoin(stakeholders, eq26(committeeMembers.stakeholderId, stakeholders.id)).where(conditions.length > 0 ? and18(...conditions) : void 0).orderBy(committeeMembers.committeeName, committeeMembers.role);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/stakeholders/:id/meeting-notes", async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const rows = await policyIntelDb.select().from(meetingNotes).where(eq26(meetingNotes.stakeholderId, stakeholderId)).orderBy(desc20(meetingNotes.createdAt));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/stakeholders/:id/meeting-notes", validateBody(createMeetingNoteSchema), async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const { noteText, meetingDate, contactMethod, matterId } = req.body;
      const [row] = await policyIntelDb.insert(meetingNotes).values({
        stakeholderId,
        matterId: matterId ? Number(matterId) : null,
        noteText: noteText.trim(),
        meetingDate: meetingDate ? new Date(meetingDate) : null,
        contactMethod: contactMethod ?? null
      }).returning();
      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  });
  router.get("/stakeholders/:id/full", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [stakeholder] = await policyIntelDb.select().from(stakeholders).where(eq26(stakeholders.id, id));
      if (!stakeholder) return res.status(404).json({ message: "Stakeholder not found" });
      const observations = await policyIntelDb.select().from(stakeholderObservations).where(eq26(stakeholderObservations.stakeholderId, id)).orderBy(desc20(stakeholderObservations.createdAt));
      const committees = await policyIntelDb.select().from(committeeMembers).where(eq26(committeeMembers.stakeholderId, id));
      const notes = await policyIntelDb.select().from(meetingNotes).where(eq26(meetingNotes.stakeholderId, id)).orderBy(desc20(meetingNotes.createdAt));
      res.json({ ...stakeholder, observations, committees, meetingNotes: notes });
    } catch (err) {
      next(err);
    }
  });
  router.post("/stakeholders/import-legislators", validateBody(importLegislatorsSchema), async (req, res, next) => {
    try {
      const workspaceId = req.body.workspaceId;
      const apiKey = process.env.LEGISCAN_API_KEY;
      if (!apiKey) return res.status(500).json({ message: "LEGISCAN_API_KEY not configured" });
      const sessionListResp = await fetch(
        `https://api.legiscan.com/?key=${encodeURIComponent(apiKey)}&op=getSessionList&state=TX`
      );
      const sessionListData = await sessionListResp.json();
      const sessions = sessionListData?.sessions;
      if (!sessions || !Array.isArray(sessions)) {
        return res.status(502).json({ message: "Failed to fetch LegiScan sessions" });
      }
      const currentSession = sessions.sort((a, b) => b.session_id - a.session_id)[0];
      const sessionId = currentSession?.session_id;
      if (!sessionId) return res.status(502).json({ message: "No Texas session found" });
      const peopleResp = await fetch(
        `https://api.legiscan.com/?key=${encodeURIComponent(apiKey)}&op=getSessionPeople&id=${sessionId}`
      );
      const peopleData = await peopleResp.json();
      const people = peopleData?.sessionpeople?.people;
      if (!Array.isArray(people)) {
        return res.status(502).json({ message: "Failed to fetch session people" });
      }
      let created = 0;
      let existing = 0;
      for (const person of people) {
        const name = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
        if (!name) continue;
        const chamber = person.role_id === 1 ? "House" : person.role_id === 2 ? "Senate" : "Unknown";
        const party = person.party ?? "";
        const district = person.district ?? "";
        const title = `${chamber} District ${district} (${party})`;
        const [existingRow] = await policyIntelDb.select({ id: stakeholders.id }).from(stakeholders).where(and18(
          eq26(stakeholders.workspaceId, workspaceId),
          eq26(stakeholders.name, name),
          eq26(stakeholders.type, "legislator")
        ));
        if (existingRow) {
          await policyIntelDb.update(stakeholders).set({
            legiscanPeopleId: person.people_id ?? null,
            party: party || null,
            chamber: chamber || null,
            district: district ? String(district) : null,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq26(stakeholders.id, existingRow.id));
          existing++;
          continue;
        }
        await policyIntelDb.insert(stakeholders).values({
          workspaceId,
          type: "legislator",
          name,
          title,
          organization: `Texas ${chamber}`,
          jurisdiction: "texas",
          tagsJson: [party, chamber, `District ${district}`].filter(Boolean),
          sourceSummary: `LegiScan people_id: ${person.people_id}`,
          legiscanPeopleId: person.people_id ?? null,
          party: party || null,
          chamber: chamber || null,
          district: district ? String(district) : null
        });
        created++;
      }
      res.json({ sessionId, sessionName: currentSession.session_name, totalPeople: people.length, created, existing });
    } catch (err) {
      next(err);
    }
  });
  router.post("/notifications/test-slack", async (_req, res, next) => {
    try {
      const sent = await notifySlack(
        "Policy Intel test notification",
        "This is a test message from Policy Intel. If you see this, Slack notifications are configured correctly."
      );
      res.json({ sent, message: sent ? "Test notification sent" : "SLACK_WEBHOOK_URL not configured" });
    } catch (err) {
      next(err);
    }
  });
  router.post("/deliverables/generate-client-alert", validateBody(generateClientAlertSchema), async (req, res, next) => {
    try {
      const { issueRoomId, workspaceId, matterId, recipientName, firmName } = req.body;
      const result = await generateClientAlert({
        issueRoomId: Number(issueRoomId),
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : void 0,
        recipientName,
        firmName
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/deliverables/generate-weekly-report", validateBody(generateWeeklyReportSchema), async (req, res, next) => {
    try {
      const { workspaceId, matterId, week, recipientName, firmName } = req.body;
      const result = await generateWeeklyReport({
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : void 0,
        week,
        recipientName,
        firmName
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/deliverables/generate-hearing-memo", validateBody(generateHearingMemoSchema), async (req, res, next) => {
    try {
      const { hearingId, workspaceId, matterId, recipientName, firmName } = req.body;
      const result = await generateHearingMemo({
        hearingId: Number(hearingId),
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : void 0,
        recipientName,
        firmName
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/briefing", async (_req, res, next) => {
    try {
      const briefing = await runSwarm();
      res.json(briefing);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/velocity", async (_req, res, next) => {
    try {
      const report = await analyzeVelocity();
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/correlations", async (req, res, next) => {
    try {
      const report = await analyzeCorrelations();
      const rawPage = Number(req.query.page);
      const rawPageSize = Number(req.query.pageSize);
      const includeIsolated = req.query.includeIsolated === "true";
      if (!Number.isFinite(rawPageSize) || rawPageSize <= 0) {
        return res.json(report);
      }
      const totalClusters = report.clusters.length;
      const pageSize = Math.max(1, Math.min(100, Math.floor(rawPageSize)));
      const totalPages = Math.max(1, Math.ceil(totalClusters / pageSize));
      const page = Math.min(
        totalPages,
        Math.max(1, Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1)
      );
      const start2 = (page - 1) * pageSize;
      res.json({
        ...report,
        clusters: report.clusters.slice(start2, start2 + pageSize),
        isolatedBills: includeIsolated ? report.isolatedBills : [],
        isolatedBillCount: report.isolatedBills.length,
        pagination: {
          page,
          pageSize,
          totalClusters,
          totalPages,
          hasMore: page < totalPages
        }
      });
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/influence", async (_req, res, next) => {
    try {
      const report = await analyzeInfluence();
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/risk", async (_req, res, next) => {
    try {
      const report = await analyzeRisk();
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/anomalies", async (_req, res, next) => {
    try {
      const report = await detectAnomalies();
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/forecast/outcomes", async (_req, res, next) => {
    try {
      const summary = await getLatestOutcomeTruthSnapshotSummary();
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });
  router.post("/intelligence/forecast/outcomes/refresh", async (req, res, next) => {
    try {
      const snapshotKey = typeof req.body?.snapshotKey === "string" ? req.body.snapshotKey : void 0;
      const result = await refreshOutcomeTruthSnapshot(snapshotKey);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/forecast/drift", async (req, res, next) => {
    try {
      const limit = Number.isFinite(Number(req.query.limit)) ? Number(req.query.limit) : void 0;
      const summary = await getForecastDriftSummary(limit);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/forecast", async (_req, res, next) => {
    try {
      const riskReport = await analyzeRisk();
      const anomalyReport = await detectAnomalies();
      const predictions = riskReport.assessments.map((ra) => ({
        billId: ra.billId,
        predictedStage: ra.stage,
        predictedPassageProbability: ra.passageProbability,
        predictedRiskLevel: ra.riskLevel,
        riskScore: ra.riskScore
      }));
      const report = await analyzeForecast(
        predictions,
        riskReport.regime,
        0,
        riskReport.criticalRisks.length,
        anomalyReport.anomalies.length,
        0
      );
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/sponsors", async (_req, res, next) => {
    try {
      const report = await analyzeSponsorNetwork();
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/historical", async (_req, res, next) => {
    try {
      const report = await analyzeHistoricalPatterns();
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/legislators", async (_req, res, next) => {
    try {
      const report = await analyzeLegislatorProfiles();
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/influence-map", async (_req, res, next) => {
    try {
      const report = await analyzeInfluenceMaps();
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/power-network", async (_req, res, next) => {
    try {
      const { analyzeNetworkPower: analyzeNetworkPower2 } = await Promise.resolve().then(() => (init_power_network_analyzer(), power_network_analyzer_exports));
      const force = _req.query.force === "true";
      const report = await analyzeNetworkPower2(force);
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/intelligence/predictions", async (_req, res, next) => {
    try {
      const { predictLegislation: predictLegislation2 } = await Promise.resolve().then(() => (init_legislation_predictor(), legislation_predictor_exports));
      const force = _req.query.force === "true";
      const report = await predictLegislation2(force);
      res.json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/predictions/dashboard", async (req, res, next) => {
    try {
      const { getPredictionDashboard: getPredictionDashboard2 } = await Promise.resolve().then(() => (init_passage_predictor_service(), passage_predictor_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const dashboard = await getPredictionDashboard2(workspaceId);
      res.json(dashboard);
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/predictions/predict", async (req, res, next) => {
    try {
      const { predictBillPassage: predictBillPassage2 } = await Promise.resolve().then(() => (init_passage_predictor_service(), passage_predictor_service_exports));
      const { workspaceId, billId, billTitle, forceRefresh } = req.body;
      if (!workspaceId || !billId) {
        return res.status(400).json({ error: "workspaceId and billId required" });
      }
      const result = await predictBillPassage2({ workspaceId, billId, billTitle, forceRefresh });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/predictions/batch", async (req, res, next) => {
    try {
      const { predictBillPassageBatch: predictBillPassageBatch2 } = await Promise.resolve().then(() => (init_passage_predictor_service(), passage_predictor_service_exports));
      const { workspaceId, billIds } = req.body;
      if (!workspaceId || !Array.isArray(billIds)) {
        return res.status(400).json({ error: "workspaceId and billIds[] required" });
      }
      const results = await predictBillPassageBatch2({ workspaceId, billIds });
      res.json({ data: results, total: results.length });
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/predictions/auto-discover", async (req, res, next) => {
    try {
      const { autoDiscoverAndPredict: autoDiscoverAndPredict2 } = await Promise.resolve().then(() => (init_passage_predictor_service(), passage_predictor_service_exports));
      const { workspaceId } = req.body;
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const result = await autoDiscoverAndPredict2(workspaceId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/clients", async (req, res, next) => {
    try {
      const { listClientProfiles: listClientProfiles2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const clients = await listClientProfiles2(workspaceId);
      res.json({ data: clients, total: clients.length });
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/clients/:id", async (req, res, next) => {
    try {
      const { getClientProfile: getClientProfile2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid client id" });
      const profile = await getClientProfile2(id);
      if (!profile) return res.status(404).json({ error: "Client profile not found" });
      res.json(profile);
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/clients", async (req, res, next) => {
    try {
      const { createClientProfile: createClientProfile2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const profile = await createClientProfile2(req.body);
      res.status(201).json(profile);
    } catch (err) {
      next(err);
    }
  });
  router.patch("/premium/clients/:id", async (req, res, next) => {
    try {
      const { updateClientProfile: updateClientProfile2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid client id" });
      const profile = await updateClientProfile2(id, req.body);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/templates", async (req, res, next) => {
    try {
      const { listReportTemplates: listReportTemplates2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const templates = await listReportTemplates2(workspaceId, req.query.type);
      res.json({ data: templates, total: templates.length });
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/templates", async (req, res, next) => {
    try {
      const { createReportTemplate: createReportTemplate2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const template = await createReportTemplate2(req.body);
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  });
  router.patch("/premium/templates/:id", async (req, res, next) => {
    try {
      const { updateReportTemplate: updateReportTemplate2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid template id" });
      const template = await updateReportTemplate2(id, req.body);
      res.json(template);
    } catch (err) {
      next(err);
    }
  });
  router.delete("/premium/templates/:id", async (req, res, next) => {
    try {
      const { deleteReportTemplate: deleteReportTemplate2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid template id" });
      await deleteReportTemplate2(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/reports/executive", async (req, res, next) => {
    try {
      const { generateExecutiveReport: generateExecutiveReport2 } = await Promise.resolve().then(() => (init_client_reporting_service(), client_reporting_service_exports));
      const report = await generateExecutiveReport2(req.body);
      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/relationships/network", async (req, res, next) => {
    try {
      const { buildNetworkGraph: buildNetworkGraph2 } = await Promise.resolve().then(() => (init_relationship_intelligence_service(), relationship_intelligence_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const focusStakeholderId = req.query.focusStakeholderId ? parseId(req.query.focusStakeholderId) : void 0;
      const minStrength = req.query.minStrength ? parseFloat(req.query.minStrength) : void 0;
      const relationshipTypes = req.query.types ? req.query.types.split(",") : void 0;
      const graph = await buildNetworkGraph2(workspaceId, {
        focusStakeholderId: focusStakeholderId ?? void 0,
        relationshipTypes,
        minStrength
      });
      res.json(graph);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/relationships/dossier/:stakeholderId", async (req, res, next) => {
    try {
      const { getStakeholderDossier: getStakeholderDossier2 } = await Promise.resolve().then(() => (init_relationship_intelligence_service(), relationship_intelligence_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      const stakeholderId = parseId(req.params.stakeholderId);
      if (!workspaceId || !stakeholderId) {
        return res.status(400).json({ error: "workspaceId and stakeholderId required" });
      }
      const dossier = await getStakeholderDossier2(workspaceId, stakeholderId);
      res.json(dossier);
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/relationships", async (req, res, next) => {
    try {
      const { createRelationship: createRelationship2 } = await Promise.resolve().then(() => (init_relationship_intelligence_service(), relationship_intelligence_service_exports));
      const rel = await createRelationship2(req.body);
      res.status(201).json(rel);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/relationships", async (req, res, next) => {
    try {
      const { listRelationships: listRelationships2 } = await Promise.resolve().then(() => (init_relationship_intelligence_service(), relationship_intelligence_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const stakeholderId = req.query.stakeholderId ? parseId(req.query.stakeholderId) : void 0;
      const rels = await listRelationships2(workspaceId, stakeholderId ?? void 0);
      res.json({ data: rels, total: rels.length });
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/relationships/auto-discover", async (req, res, next) => {
    try {
      const { autoDiscoverRelationships: autoDiscoverRelationships2 } = await Promise.resolve().then(() => (init_relationship_intelligence_service(), relationship_intelligence_service_exports));
      const { workspaceId } = req.body;
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const result = await autoDiscoverRelationships2(workspaceId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/session/dashboard", async (req, res, next) => {
    try {
      const { getSessionDashboard: getSessionDashboard2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const dashboard = await getSessionDashboard2(workspaceId);
      if (!dashboard) {
        return res.json({ message: "No active session. Initialize a session first.", session: null });
      }
      res.json(dashboard);
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/session/initialize", async (req, res, next) => {
    try {
      const { initializeTexasSession: initializeTexasSession2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const { workspaceId, sessionNumber } = req.body;
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const result = await initializeTexasSession2(workspaceId, sessionNumber);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/session/sessions", async (req, res, next) => {
    try {
      const { listSessions: listSessions2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const sessions = await listSessions2(workspaceId);
      res.json({ data: sessions, total: sessions.length });
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/session/transition", async (req, res, next) => {
    try {
      const { executePhaseTransition: executePhaseTransition2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const { workspaceId, toPhase } = req.body;
      if (!workspaceId || !toPhase) {
        return res.status(400).json({ error: "workspaceId and toPhase required" });
      }
      const result = await executePhaseTransition2(workspaceId, toPhase);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/session/transition/plan", async (req, res, next) => {
    try {
      const { generatePhaseTransitionPlan: generatePhaseTransitionPlan2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      const toPhase = req.query.toPhase;
      if (!workspaceId || !toPhase) {
        return res.status(400).json({ error: "workspaceId and toPhase required" });
      }
      const plan = await generatePhaseTransitionPlan2(workspaceId, toPhase);
      res.json(plan);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/actions", async (req, res, next) => {
    try {
      const { listClientActions: listClientActions2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const workspaceId = parseId(req.query.workspaceId);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const actions = await listClientActions2(workspaceId, {
        status: req.query.status,
        matterId: req.query.matterId ? parseId(req.query.matterId) ?? void 0 : void 0,
        assignee: req.query.assignee
      });
      res.json({ data: actions, total: actions.length });
    } catch (err) {
      next(err);
    }
  });
  router.post("/premium/actions", async (req, res, next) => {
    try {
      const { createClientAction: createClientAction2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const action = await createClientAction2(req.body);
      res.status(201).json(action);
    } catch (err) {
      next(err);
    }
  });
  router.patch("/premium/actions/:id", async (req, res, next) => {
    try {
      const { updateClientAction: updateClientAction2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid action id" });
      const action = await updateClientAction2(id, req.body);
      res.json(action);
    } catch (err) {
      next(err);
    }
  });
  router.get("/premium/session/milestones", async (req, res, next) => {
    try {
      const { listMilestones: listMilestones2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const sessionId = parseId(req.query.sessionId);
      if (!sessionId) return res.status(400).json({ error: "sessionId required" });
      const phase = req.query.phase;
      const milestones = await listMilestones2(sessionId, phase);
      res.json({ data: milestones, total: milestones.length });
    } catch (err) {
      next(err);
    }
  });
  router.patch("/premium/session/milestones/:id", async (req, res, next) => {
    try {
      const { updateMilestoneStatus: updateMilestoneStatus2 } = await Promise.resolve().then(() => (init_session_lifecycle_service(), session_lifecycle_service_exports));
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid milestone id" });
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "status required" });
      const milestone = await updateMilestoneStatus2(id, status);
      res.json(milestone);
    } catch (err) {
      next(err);
    }
  });
  return router;
}

// server/policy-intel/app.ts
init_db();
import { sql as sql19 } from "drizzle-orm";

// server/policy-intel/auth.ts
var IS_PRODUCTION = process.env.NODE_ENV === "production";
function resolveApiToken() {
  const token = process.env.POLICY_INTEL_API_TOKEN;
  return typeof token === "string" ? token.trim() : "";
}
var API_TOKEN = resolveApiToken();
function validatePolicyIntelAuthConfiguration() {
  if (IS_PRODUCTION && !API_TOKEN) {
    throw new Error("POLICY_INTEL_API_TOKEN must be set in production");
  }
}
var PUBLIC_PATHS = /* @__PURE__ */ new Set(["/health", "/", "/metrics"]);
function authMiddleware(req, res, next) {
  if (!API_TOKEN) return next();
  if (PUBLIC_PATHS.has(req.path)) return next();
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header required (Bearer <token>)" });
  }
  const token = header.slice(7).trim();
  if (token !== API_TOKEN) {
    return res.status(403).json({ message: "Invalid API token" });
  }
  next();
}

// server/policy-intel/app.ts
init_logger();
var log13 = createLogger("policy-intel");
function createPolicyIntelApp() {
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
    // allow loading cross-origin resources (e.g. legislator photos)
  }));
  const corsRaw = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean);
  if ((!corsRaw || corsRaw.length === 0) && process.env.NODE_ENV === "production") {
    throw new Error("CORS_ORIGINS must be set in production (comma-separated list of allowed origins)");
  }
  const allowedOrigins = corsRaw && corsRaw.length > 0 ? corsRaw : ["http://localhost:5173", "http://localhost:5050"];
  app2.use(cors({ origin: allowedOrigins, credentials: true }));
  app2.use(express.json({ limit: "2mb" }));
  app2.use(express.urlencoded({ extended: true }));
  const apiLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 6e4,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later" }
  });
  const mutationLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_MUTATION_WINDOW_MS) || 6e4,
    max: Number(process.env.RATE_LIMIT_MUTATION_MAX) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many write requests, please try again later" }
  });
  app2.use("/api/intel", apiLimiter);
  app2.use("/api/intel", (req, _res, next) => {
    if (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") {
      return mutationLimiter(req, _res, next);
    }
    next();
  });
  app2.use((req, res, next) => {
    const start2 = Date.now();
    res.on("finish", () => {
      const route = req.route?.path ?? req.path;
      const method = req.method;
      metrics.inc("policy_intel_http_requests_total", { method, route, status: String(res.statusCode) });
      metrics.observe("policy_intel_http_duration_ms", { method, route }, Date.now() - start2);
    });
    next();
  });
  app2.get("/health/liveness", (_req, res) => {
    res.json({ ok: true, app: "actup-policy-intel" });
  });
  app2.get("/health", async (_req, res) => {
    try {
      await policyIntelDb.execute(sql19`SELECT 1`);
      res.json({ ok: true, app: "actup-policy-intel" });
    } catch {
      res.status(503).json({ ok: false, app: "actup-policy-intel", error: "database unreachable" });
    }
  });
  app2.get("/metrics", (_req, res) => {
    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.send(metrics.serialize());
  });
  app2.use("/api/intel", authMiddleware, createPolicyIntelRouter());
  app2.use((err, req, res, _next) => {
    const message = safeErrorMessage(err);
    log13.error({ method: req.method, path: req.path, err: message }, "request failed");
    const clientMessage = process.env.NODE_ENV === "production" ? "Internal server error" : message;
    res.status(500).json({ message: clientMessage });
  });
  return app2;
}

// server/policy-intel/index.ts
init_db();
init_logger();
var log14 = createLogger("policy-intel");
process.on("uncaughtException", (err) => {
  log14.error({ err: safeErrorMessage(err) }, "uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  log14.error({ err: safeErrorMessage(reason) }, "unhandledRejection");
});
var port = Number(process.env.POLICY_INTEL_PORT || 5050);
var host = process.env.HOST || "0.0.0.0";
validatePolicyIntelAuthConfiguration();
var app = createPolicyIntelApp();
var server = null;
var shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log14.info({ signal }, "shutting down");
  stopScheduler();
  const forcedExit = setTimeout(() => {
    log14.error("forced shutdown after timeout");
    process.exit(1);
  }, 1e4);
  forcedExit.unref?.();
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server?.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
    await queryClient.end({ timeout: 5 });
    process.exit(0);
  } catch (error) {
    log14.error({ err: error }, "shutdown failed");
    process.exit(1);
  } finally {
    clearTimeout(forcedExit);
  }
}
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
async function start() {
  await ensureDatabaseConnection();
  server = app.listen(port, host, () => {
    log14.info({ host, port }, "listening");
    startScheduler();
  });
}
void start().catch((error) => {
  log14.fatal({ err: safeErrorMessage(error) }, "startup failed");
  process.exit(1);
});
