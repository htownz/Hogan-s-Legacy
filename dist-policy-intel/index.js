var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/policy-intel/app.ts
import express from "express";
import cors from "cors";

// server/policy-intel/routes.ts
import { Router } from "express";
import { and as and4, desc, eq as eq5, gt as gt2, inArray as inArray2, or } from "drizzle-orm";

// server/policy-intel/db.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// shared/schema-policy-intel.ts
var schema_policy_intel_exports = {};
__export(schema_policy_intel_exports, {
  activities: () => activities,
  activityTypeEnum: () => activityTypeEnum,
  alertStatusEnum: () => alertStatusEnum,
  alerts: () => alerts,
  briefStatusEnum: () => briefStatusEnum,
  briefs: () => briefs,
  deliverableTypeEnum: () => deliverableTypeEnum,
  deliverables: () => deliverables,
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
  matterStatusEnum: () => matterStatusEnum,
  matterWatchlists: () => matterWatchlists,
  matters: () => matters,
  monitoringJobs: () => monitoringJobs,
  sourceDocuments: () => sourceDocuments,
  sourceTypeEnum: () => sourceTypeEnum,
  stakeholderObservations: () => stakeholderObservations,
  stakeholderTypeEnum: () => stakeholderTypeEnum,
  stakeholders: () => stakeholders,
  watchlists: () => watchlists,
  workspaces: () => workspaces
});
import {
  boolean,
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
var sourceTypeEnum = pgEnum("policy_intel_source_type", [
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
var alertStatusEnum = pgEnum("policy_intel_alert_status", [
  "pending_review",
  "ready",
  "sent",
  "suppressed"
]);
var briefStatusEnum = pgEnum("policy_intel_brief_status", [
  "draft",
  "review",
  "published"
]);
var deliverableTypeEnum = pgEnum("policy_intel_deliverable_type", [
  "issue_brief",
  "hearing_memo",
  "client_alert",
  "weekly_digest"
]);
var matterStatusEnum = pgEnum("policy_intel_matter_status", [
  "active",
  "watching",
  "closed",
  "archived"
]);
var activityTypeEnum = pgEnum("policy_intel_activity_type", [
  "alert_received",
  "brief_drafted",
  "note_added",
  "task_assigned",
  "status_changed",
  "document_linked",
  "review_completed"
]);
var issueRoomStatusEnum = pgEnum("policy_intel_issue_room_status", [
  "active",
  "watching",
  "resolved",
  "archived"
]);
var issueRoomRelationshipTypeEnum = pgEnum("policy_intel_issue_room_relationship_type", [
  "primary_authority",
  "background",
  "opposition_signal",
  "funding_context",
  "stakeholder_signal",
  "timeline_event"
]);
var issueRoomUpdateTypeEnum = pgEnum("policy_intel_issue_room_update_type", [
  "analysis",
  "status",
  "political",
  "legal",
  "funding",
  "meeting_note"
]);
var issueRoomTaskStatusEnum = pgEnum("policy_intel_issue_room_task_status", [
  "todo",
  "in_progress",
  "blocked",
  "done"
]);
var issueRoomTaskPriorityEnum = pgEnum("policy_intel_issue_room_task_priority", [
  "low",
  "medium",
  "high",
  "critical"
]);
var workspaces = pgTable("policy_intel_workspaces", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  jurisdictionScope: varchar("jurisdiction_scope", { length: 64 }).notNull().default("us_federal_texas"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var watchlists = pgTable(
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
    workspaceNameUnique: uniqueIndex("policy_intel_watchlists_workspace_name_idx").on(
      table.workspaceId,
      table.name
    )
  })
);
var sourceDocuments = pgTable("policy_intel_source_documents", {
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
});
var alerts = pgTable("policy_intel_alerts", {
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
});
var briefs = pgTable("policy_intel_briefs", {
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
var monitoringJobs = pgTable("policy_intel_monitoring_jobs", {
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
var matters = pgTable("policy_intel_matters", {
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
var matterWatchlists = pgTable(
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
var issueRooms = pgTable(
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
var issueRoomSourceDocuments = pgTable(
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
var issueRoomUpdates = pgTable("policy_intel_issue_room_updates", {
  id: serial("id").primaryKey(),
  issueRoomId: integer("issue_room_id").notNull().references(() => issueRooms.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  updateType: issueRoomUpdateTypeEnum("update_type").notNull().default("analysis"),
  sourcePackJson: jsonb("source_pack_json").$type().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var issueRoomStrategyOptions = pgTable("policy_intel_issue_room_strategy_options", {
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
var issueRoomTasks = pgTable("policy_intel_issue_room_tasks", {
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
var activities = pgTable("policy_intel_activities", {
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
var deliverables = pgTable("policy_intel_deliverables", {
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
var stakeholderTypeEnum = pgEnum("policy_intel_stakeholder_type", [
  "legislator",
  "lobbyist",
  "agency_official",
  "pac",
  "organization",
  "individual"
]);
var stakeholders = pgTable("policy_intel_stakeholders", {
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var stakeholderObservations = pgTable("policy_intel_stakeholder_observations", {
  id: serial("id").primaryKey(),
  stakeholderId: integer("stakeholder_id").notNull().references(() => stakeholders.id, { onDelete: "cascade" }),
  sourceDocumentId: integer("source_document_id").references(() => sourceDocuments.id, { onDelete: "set null" }),
  matterId: integer("matter_id").references(() => matters.id, { onDelete: "set null" }),
  observationText: text("observation_text").notNull(),
  confidence: varchar("confidence", { length: 32 }).notNull().default("medium"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// server/policy-intel/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for policy-intel service");
}
var queryClient = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});
var policyIntelDb = drizzle(queryClient, { schema: schema_policy_intel_exports });

// server/policy-intel/seed/grace-mcewan.ts
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
  return { workspace, watchlistIds, matterIds };
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
function extractBillId(text2) {
  const re = new RegExp(BILL_ID_RE.source, BILL_ID_RE.flags);
  const first = re.exec(text2);
  if (!first) return null;
  return first[1].replace(/([HS][BJR]R?)\s*(\d+)/, "$1 $2");
}
function extractCommittee(text2) {
  const match = text2.match(COMMITTEE_FIELD_RE);
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
  const existing = await policyIntelDb.select().from(sourceDocuments).where(eq2(sourceDocuments.checksum, checksum));
  if (existing.length > 0) {
    return { doc: existing[0], inserted: false };
  }
  const [inserted] = await policyIntelDb.insert(sourceDocuments).values({ ...payload, checksum }).returning();
  return { doc: inserted, inserted: true };
}

// server/policy-intel/services/alert-service.ts
import { and as and2, eq as eq3, gt } from "drizzle-orm";

// server/policy-intel/engine/match-watchlists.ts
function parseRules(rulesJson) {
  const toArr = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  return {
    keywords: toArr(rulesJson.keywords),
    committees: toArr(rulesJson.committees),
    agencies: toArr(rulesJson.agencies),
    billPrefixes: toArr(rulesJson.billPrefixes)
  };
}
function excerpt(text2, term, radius = 60) {
  const idx = text2.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text2.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text2.length, idx + term.length + radius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text2.length ? "..." : "";
  return prefix + text2.slice(start, end) + suffix;
}
function matchBillIds(doc, rules) {
  const reasons = [];
  const corpus = `${doc.title}
${doc.normalizedText ?? ""}`;
  const billId = typeof doc.rawPayload?.billId === "string" ? doc.rawPayload.billId : null;
  if (billId && rules.billPrefixes.length > 0) {
    const upper = billId.toUpperCase().replace(/\s+/g, "");
    const prefixMatch = rules.billPrefixes.some((p) => upper.startsWith(p));
    if (prefixMatch) {
      reasons.push({
        dimension: "bill_id",
        rule: billId,
        excerpt: excerpt(corpus, billId)
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
function matchDocumentToAllWatchlists(doc, watchlists2) {
  const matches = [];
  for (const wl of watchlists2) {
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

// server/policy-intel/engine/evaluators.ts
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
function evaluateProceduralSignificance(docTitle, docSummary, reasons) {
  const text2 = `${docTitle} ${docSummary ?? ""}`.toLowerCase();
  let bestScore = 0;
  let bestKeyword = "";
  for (const [keyword, score] of Object.entries(PROCEDURAL_KEYWORDS)) {
    if (text2.includes(keyword) && score > bestScore) {
      bestScore = score;
      bestKeyword = keyword;
    }
  }
  return {
    evaluator: "procedural_significance",
    score: Math.min(bestScore, 25),
    maxScore: 25,
    rationale: bestScore > 0 ? `Procedural stage "${bestKeyword}" detected (significance: ${bestScore}/25)` : "No significant procedural stage detected"
  };
}
function evaluateMatterRelevance(reasons) {
  if (reasons.length === 0) {
    return {
      evaluator: "matter_relevance",
      score: 0,
      maxScore: 25,
      rationale: "No watchlist rule matches"
    };
  }
  const dimensions = new Set(reasons.map((r) => r.dimension));
  let score = 0;
  if (dimensions.has("bill_id")) score += 12;
  if (dimensions.has("committee")) score += 7;
  if (dimensions.has("agency")) score += 5;
  const keywordCount = reasons.filter((r) => r.dimension === "keyword").length;
  score += Math.min(keywordCount * 3, 9);
  if (dimensions.size >= 3) score += 4;
  else if (dimensions.size >= 2) score += 2;
  const matched = Array.from(dimensions).join(", ");
  return {
    evaluator: "matter_relevance",
    score: Math.min(score, 25),
    maxScore: 25,
    rationale: `Matched ${reasons.length} rule(s) across dimensions: ${matched}`
  };
}
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
function evaluateStakeholderImpact(docTitle, docSummary) {
  const text2 = `${docTitle} ${docSummary ?? ""}`.toLowerCase();
  const found = [];
  for (const indicator of STAKEHOLDER_INDICATORS) {
    if (text2.includes(indicator.toLowerCase())) {
      found.push(indicator);
    }
  }
  const score = Math.min(found.length * 5, 25);
  return {
    evaluator: "stakeholder_impact",
    score,
    maxScore: 25,
    rationale: found.length > 0 ? `Stakeholder indicators found: ${found.slice(0, 5).join(", ")}${found.length > 5 ? ` +${found.length - 5} more` : ""}` : "No known stakeholder references detected"
  };
}
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
function evaluateActionability(docTitle, docSummary) {
  const text2 = `${docTitle} ${docSummary ?? ""}`;
  let bestScore = 0;
  let bestLabel = "";
  for (const { pattern, score, label } of ACTIONABILITY_PATTERNS) {
    if (pattern.test(text2) && score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }
  return {
    evaluator: "actionability",
    score: Math.min(bestScore, 25),
    maxScore: 25,
    rationale: bestScore > 0 ? `Actionable signal: ${bestLabel} (score: ${bestScore}/25)` : "No immediate action trigger detected"
  };
}
function buildScorecard(docTitle, docSummary, reasons) {
  const evaluators = [
    evaluateProceduralSignificance(docTitle, docSummary, reasons),
    evaluateMatterRelevance(reasons),
    evaluateStakeholderImpact(docTitle, docSummary),
    evaluateActionability(docTitle, docSummary)
  ];
  const totalScore = evaluators.reduce((sum, e) => sum + e.score, 0);
  const topFactors = evaluators.filter((e) => e.score > 0).sort((a, b) => b.score - a.score).map((e) => e.rationale);
  const summary = topFactors.length > 0 ? topFactors.slice(0, 2).join("; ") : "Low-confidence match \u2014 no strong signals detected";
  return {
    evaluators,
    totalScore: Math.min(totalScore, 100),
    summary
  };
}

// server/policy-intel/services/alert-service.ts
var COOLDOWN_MS = 24 * 60 * 60 * 1e3;
async function processDocumentAlerts(doc, workspaceId) {
  const result = {
    created: 0,
    skippedDuplicate: 0,
    skippedCooldown: 0,
    details: []
  };
  const activeWatchlists = await policyIntelDb.select().from(watchlists).where(
    and2(
      eq3(watchlists.workspaceId, workspaceId),
      eq3(watchlists.isActive, true)
    )
  );
  if (activeWatchlists.length === 0) return result;
  const matches = matchDocumentToAllWatchlists(doc, activeWatchlists);
  if (matches.length === 0) return result;
  for (const match of matches) {
    const existing = await policyIntelDb.select({ id: alerts.id }).from(alerts).where(
      and2(
        eq3(alerts.sourceDocumentId, doc.id),
        eq3(alerts.watchlistId, match.watchlist.id)
      )
    );
    if (existing.length > 0) {
      result.skippedDuplicate++;
      continue;
    }
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_MS);
    const recentAlerts = await policyIntelDb.select({ id: alerts.id }).from(alerts).where(
      and2(
        eq3(alerts.watchlistId, match.watchlist.id),
        eq3(alerts.workspaceId, workspaceId),
        gt(alerts.createdAt, cooldownCutoff),
        eq3(alerts.title, doc.title)
      )
    );
    if (recentAlerts.length > 0) {
      result.skippedCooldown++;
      continue;
    }
    const scorecard = buildScorecard(doc.title, doc.summary, match.reasons);
    const whyItMatters = buildWhyItMatters(doc.title, match.reasons);
    const reasonsJson = scorecard.evaluators.map((e) => ({
      evaluator: e.evaluator,
      evaluatorScore: e.score,
      maxScore: e.maxScore,
      rationale: e.rationale
    }));
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
    result.details.push({
      alertId: created.id,
      watchlist: match.watchlist.name,
      score: scorecard.totalScore
    });
  }
  return result;
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
  const allWorkspaces = await policyIntelDb.select({ id: workspaces.id }).from(workspaces);
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
          const alertResult = await processDocumentAlerts(savedDoc, ws.id);
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

// server/policy-intel/engine/build-brief.ts
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
import { and as and3, eq as eq4 } from "drizzle-orm";
async function upsertStakeholder(data) {
  const existing = await policyIntelDb.select().from(stakeholders).where(
    and3(
      eq4(stakeholders.workspaceId, data.workspaceId),
      eq4(stakeholders.name, data.name),
      eq4(stakeholders.type, data.type)
    )
  );
  if (existing.length > 0) {
    return { stakeholder: existing[0], created: false };
  }
  const [created] = await policyIntelDb.insert(stakeholders).values(data).returning();
  return { stakeholder: created, created: true };
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
  const [stakeholder] = await policyIntelDb.select().from(stakeholders).where(eq4(stakeholders.id, stakeholderId));
  if (!stakeholder) return null;
  const observations = await policyIntelDb.select().from(stakeholderObservations).where(eq4(stakeholderObservations.stakeholderId, stakeholderId));
  return { stakeholder, observations };
}
async function getStakeholdersForMatter(matterId) {
  const obs = await policyIntelDb.select({ stakeholderId: stakeholderObservations.stakeholderId }).from(stakeholderObservations).where(eq4(stakeholderObservations.matterId, matterId));
  if (obs.length === 0) return [];
  const uniqueIds = Array.from(new Set(obs.map((o) => o.stakeholderId)));
  const results = [];
  for (const id of uniqueIds) {
    const [s] = await policyIntelDb.select().from(stakeholders).where(eq4(stakeholders.id, id));
    if (s) results.push(s);
  }
  return results;
}

// server/policy-intel/connectors/texas/tec-filings.ts
import axios2 from "axios";
import * as cheerio2 from "cheerio";
var TEC_BASE_URL = "https://www.ethics.state.tx.us";
async function searchTecFilers(name) {
  const url = `${TEC_BASE_URL}/search/cf/`;
  const resp = await axios2.post(
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
  const resp = await axios2.post(
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
import axios3 from "axios";
import * as cheerio3 from "cheerio";
var LEGISTAR_FEED = "https://houston.legistar.com/Feed.ashx?M=Calendar&ID=3955578&GUID=58f7aac2-38c2-4b5f-80e5-0bce60c4deba";
var COUNCIL_PAGE = "https://www.houstontx.gov/council/calendar.html";
async function fetchHoustonCouncilItems() {
  try {
    const resp = await axios3.get(LEGISTAR_FEED, { timeout: 15e3 });
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
import axios4 from "axios";
import * as cheerio4 from "cheerio";
var LEGISTAR_FEED2 = "https://harriscountytx.legistar.com/Feed.ashx?M=Calendar&ID=18040568&GUID=c8d5f0ea-3dc6-4b2a-a9cf-82fd1e2e4f56";
var HCCC_AGENDA_PAGE = "https://agenda.harriscountytx.gov/";
async function fetchHarrisCountyItems() {
  try {
    const resp = await axios4.get(LEGISTAR_FEED2, { timeout: 15e3 });
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
import axios5 from "axios";
import * as cheerio5 from "cheerio";
var METRO_BOARD_PAGE = "https://www.ridemetro.org/pages/board-of-directors.aspx";
var METRO_NOTICES_PAGE = "https://www.ridemetro.org/pages/public-notices.aspx";
async function fetchMetroBoardItems() {
  try {
    const resp = await axios5.get(METRO_BOARD_PAGE, { timeout: 15e3 });
    const $ = cheerio5.load(resp.data);
    const items = [];
    $("table tr, .meeting, li, p, a").each((_i, el) => {
      const text2 = $(el).text().trim();
      if (text2.length > 15 && text2.length < 500 && (text2.toLowerCase().includes("board") || text2.toLowerCase().includes("meeting") || text2.toLowerCase().includes("agenda") || text2.toLowerCase().includes("metro"))) {
        const href = $(el).attr("href");
        items.push({
          title: text2.slice(0, 200),
          summary: text2,
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
    const resp = await axios5.get(METRO_NOTICES_PAGE, { timeout: 15e3 });
    const $ = cheerio5.load(resp.data);
    const items = [];
    $("table tr, .notice, li, p").each((_i, el) => {
      const text2 = $(el).text().trim();
      if (text2.length > 20 && text2.length < 500 && (text2.toLowerCase().includes("notice") || text2.toLowerCase().includes("hearing") || text2.toLowerCase().includes("procurement") || text2.toLowerCase().includes("contract"))) {
        items.push({
          title: text2.slice(0, 200),
          summary: text2,
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
  const allWorkspaces = await policyIntelDb.select({ id: workspaces.id }).from(workspaces);
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
            const alertResult = await processDocumentAlerts(savedDoc, ws.id);
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

// server/policy-intel/routes.ts
function slugifyIssueRoom(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
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
        "/api/intel/workspaces/:id/digest"
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
  router.post("/workspaces", async (req, res, next) => {
    try {
      const { slug, name } = req.body ?? {};
      if (!slug || !name) {
        return res.status(400).json({ message: "slug and name are required" });
      }
      const [created] = await policyIntelDb.insert(workspaces).values({ slug, name }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/watchlists", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(watchlists).orderBy(desc(watchlists.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/watchlists", async (req, res, next) => {
    try {
      const { workspaceId, name, topic, description, rulesJson } = req.body ?? {};
      if (!workspaceId || !name) {
        return res.status(400).json({ message: "workspaceId and name are required" });
      }
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
      const id = Number(req.params.id);
      const [watchlist] = await policyIntelDb.select().from(watchlists).where(eq5(watchlists.id, id));
      if (!watchlist) {
        return res.status(404).json({ message: "watchlist not found" });
      }
      res.json(watchlist);
    } catch (err) {
      next(err);
    }
  });
  router.post("/source-documents", async (req, res, next) => {
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
      } = req.body ?? {};
      if (!sourceType || !publisher || !sourceUrl || !title) {
        return res.status(400).json({
          message: "sourceType, publisher, sourceUrl, and title are required"
        });
      }
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
  router.get("/source-documents", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(sourceDocuments).orderBy(desc(sourceDocuments.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/alerts", async (req, res, next) => {
    try {
      const {
        workspaceId,
        watchlistId,
        sourceDocumentId,
        title,
        summary,
        // Accept friendly input names; map to actual schema columns below
        severity = "info",
        status = "pending_review",
        alertReason,
        metadataJson
      } = req.body ?? {};
      if (!workspaceId || !watchlistId || !sourceDocumentId || !title) {
        return res.status(400).json({
          message: "workspaceId, watchlistId, sourceDocumentId, and title are required"
        });
      }
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
  router.get("/alerts", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(alerts).orderBy(desc(alerts.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.patch("/alerts/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { status, reviewerNote } = req.body ?? {};
      const validStatuses = ["pending_review", "ready", "sent", "suppressed"];
      const updates = {};
      if (status && validStatuses.includes(status)) {
        updates.status = status;
      }
      if (reviewerNote !== void 0) {
        updates.reviewerNote = reviewerNote;
      }
      updates.reviewedAt = /* @__PURE__ */ new Date();
      if (Object.keys(updates).length <= 1) {
        return res.status(400).json({ message: "Provide status and/or reviewerNote" });
      }
      const [updated] = await policyIntelDb.update(alerts).set(updates).where(eq5(alerts.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "alert not found" });
      if (updated.watchlistId) {
        const links = await policyIntelDb.select().from(matterWatchlists).where(eq5(matterWatchlists.watchlistId, updated.watchlistId));
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
      res.json(updated);
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
        and4(
          eq5(alerts.workspaceId, workspaceId),
          gt2(alerts.createdAt, weekStart)
        )
      ).orderBy(desc(alerts.relevanceScore));
      const filtered = weekAlerts.filter((a) => a.createdAt < weekEnd);
      const grouped = {};
      for (const alert of filtered) {
        const wlId = alert.watchlistId ?? 0;
        if (!grouped[wlId]) grouped[wlId] = { watchlistId: wlId, alerts: [] };
        grouped[wlId].alerts.push(alert);
      }
      const wlIds = Object.keys(grouped).map(Number).filter((id) => id > 0);
      const wlRows = wlIds.length > 0 ? await policyIntelDb.select().from(watchlists).where(inArray2(watchlists.id, wlIds)) : [];
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
        and4(
          eq5(activities.workspaceId, workspaceId),
          gt2(activities.createdAt, weekStart)
        )
      ).orderBy(desc(activities.createdAt));
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
      const rows = await policyIntelDb.select().from(briefs).orderBy(desc(briefs.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/briefs/generate", async (req, res, next) => {
    try {
      const { workspaceId, watchlistId, matterId, sourceDocumentIds, title } = req.body ?? {};
      if (!workspaceId || !sourceDocumentIds || !Array.isArray(sourceDocumentIds) || sourceDocumentIds.length === 0) {
        return res.status(400).json({ message: "workspaceId and non-empty sourceDocumentIds[] are required \u2014 no sources, no brief" });
      }
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
  router.get("/deliverables", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(deliverables).orderBy(desc(deliverables.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id/briefs", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const rows = await policyIntelDb.select().from(deliverables).where(eq5(deliverables.matterId, matterId)).orderBy(desc(deliverables.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/jobs", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(monitoringJobs).orderBy(desc(monitoringJobs.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/issue-rooms", async (req, res, next) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : void 0;
      const rows = workspaceId ? await policyIntelDb.select().from(issueRooms).where(eq5(issueRooms.workspaceId, workspaceId)).orderBy(desc(issueRooms.id)) : await policyIntelDb.select().from(issueRooms).orderBy(desc(issueRooms.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/issue-rooms", async (req, res, next) => {
    try {
      const { workspaceId, matterId, slug, title, issueType, jurisdiction, status, summary, recommendedPath, ownerUserId, relatedBillIds, sourceDocumentIds } = req.body ?? {};
      if (!workspaceId || !title) {
        return res.status(400).json({ message: "workspaceId and title are required" });
      }
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
      const id = Number(req.params.id);
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq5(issueRooms.id, id));
      if (!issueRoom) return res.status(404).json({ message: "issue room not found" });
      const [linkedSources, updates, strategyOptions, tasks, linkedStakeholders] = await Promise.all([
        policyIntelDb.select().from(issueRoomSourceDocuments).where(eq5(issueRoomSourceDocuments.issueRoomId, id)).orderBy(desc(issueRoomSourceDocuments.id)),
        policyIntelDb.select().from(issueRoomUpdates).where(eq5(issueRoomUpdates.issueRoomId, id)).orderBy(desc(issueRoomUpdates.id)),
        policyIntelDb.select().from(issueRoomStrategyOptions).where(eq5(issueRoomStrategyOptions.issueRoomId, id)).orderBy(issueRoomStrategyOptions.recommendationRank, desc(issueRoomStrategyOptions.id)),
        policyIntelDb.select().from(issueRoomTasks).where(eq5(issueRoomTasks.issueRoomId, id)).orderBy(desc(issueRoomTasks.id)),
        policyIntelDb.select().from(stakeholders).where(eq5(stakeholders.issueRoomId, id)).orderBy(desc(stakeholders.id))
      ]);
      const sourceIds = linkedSources.map((row) => row.sourceDocumentId);
      const sourceRows = sourceIds.length > 0 ? await policyIntelDb.select().from(sourceDocuments).where(inArray2(sourceDocuments.id, sourceIds)) : [];
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
  router.post("/alerts/:id/create-issue-room", async (req, res, next) => {
    try {
      const alertId = Number(req.params.id);
      const [alert] = await policyIntelDb.select().from(alerts).where(eq5(alerts.id, alertId));
      if (!alert) return res.status(404).json({ message: "alert not found" });
      const { matterId, slug, title, issueType, jurisdiction, summary, recommendedPath, ownerUserId, relatedBillIds } = req.body ?? {};
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
      const [updatedAlert] = await policyIntelDb.update(alerts).set({ issueRoomId: created.id }).where(eq5(alerts.id, alertId)).returning();
      await policyIntelDb.insert(activities).values({
        workspaceId: alert.workspaceId,
        matterId: matterId ? Number(matterId) : null,
        issueRoomId: created.id,
        alertId: alert.id,
        type: "note_added",
        summary: `Issue room created from alert: ${resolvedTitle}`,
        detailText: alert.whyItMatters ?? alert.summary ?? null
      });
      res.status(201).json({ issueRoom: created, alert: updatedAlert });
    } catch (err) {
      next(err);
    }
  });
  router.get("/issue-rooms/:id/alerts", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const linkedDocs = await policyIntelDb.select({ sourceDocumentId: issueRoomSourceDocuments.sourceDocumentId }).from(issueRoomSourceDocuments).where(eq5(issueRoomSourceDocuments.issueRoomId, issueRoomId));
      const linkedSourceDocumentIds = linkedDocs.map((row) => row.sourceDocumentId);
      const rows = linkedSourceDocumentIds.length > 0 ? await policyIntelDb.select().from(alerts).where(
        or(
          eq5(alerts.issueRoomId, issueRoomId),
          inArray2(alerts.sourceDocumentId, linkedSourceDocumentIds)
        )
      ).orderBy(desc(alerts.id)) : await policyIntelDb.select().from(alerts).where(eq5(alerts.issueRoomId, issueRoomId)).orderBy(desc(alerts.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/issue-rooms/:id/updates", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { title, body, updateType, sourcePackJson } = req.body ?? {};
      if (!title || !body) {
        return res.status(400).json({ message: "title and body are required" });
      }
      const [created] = await policyIntelDb.insert(issueRoomUpdates).values({
        issueRoomId,
        title,
        body,
        updateType: updateType ?? "analysis",
        sourcePackJson: sourcePackJson ?? []
      }).returning();
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq5(issueRooms.id, issueRoomId));
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
  router.post("/issue-rooms/:id/strategy-options", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { label, description, prosJson, consJson, politicalFeasibility, legalDurability, implementationComplexity, recommendationRank } = req.body ?? {};
      if (!label) {
        return res.status(400).json({ message: "label is required" });
      }
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
  router.post("/issue-rooms/:id/tasks", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { title, description, status, priority, assignee, dueDate } = req.body ?? {};
      if (!title) {
        return res.status(400).json({ message: "title is required" });
      }
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
  router.post("/issue-rooms/:id/stakeholders", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq5(issueRooms.id, issueRoomId));
      if (!issueRoom) return res.status(404).json({ message: "issue room not found" });
      const { type, name, title, organization, jurisdiction, tagsJson, sourceSummary } = req.body ?? {};
      if (!type || !name) {
        return res.status(400).json({ message: "type and name are required" });
      }
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
      const rows = await policyIntelDb.select().from(matters).orderBy(desc(matters.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/matters", async (req, res, next) => {
    try {
      const { workspaceId, slug, name, clientName, practiceArea, jurisdictionScope, status, ownerUserId, description, tagsJson } = req.body ?? {};
      if (!workspaceId || !slug || !name) {
        return res.status(400).json({ message: "workspaceId, slug, and name are required" });
      }
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
      const id = Number(req.params.id);
      const [matter] = await policyIntelDb.select().from(matters).where(eq5(matters.id, id));
      if (!matter) return res.status(404).json({ message: "matter not found" });
      res.json(matter);
    } catch (err) {
      next(err);
    }
  });
  router.post("/matters/:id/watchlists", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const { watchlistId } = req.body ?? {};
      if (!watchlistId) {
        return res.status(400).json({ message: "watchlistId is required" });
      }
      const [created] = await policyIntelDb.insert(matterWatchlists).values({ matterId, watchlistId: Number(watchlistId) }).returning();
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id/watchlists", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const links = await policyIntelDb.select().from(matterWatchlists).where(eq5(matterWatchlists.matterId, matterId));
      if (links.length === 0) return res.json([]);
      const wlIds = links.map((l) => l.watchlistId);
      const rows = await policyIntelDb.select().from(watchlists).where(inArray2(watchlists.id, wlIds));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/matters/:id/alerts", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const links = await policyIntelDb.select().from(matterWatchlists).where(eq5(matterWatchlists.matterId, matterId));
      if (links.length === 0) return res.json([]);
      const wlIds = links.map((l) => l.watchlistId);
      const rows = await policyIntelDb.select().from(alerts).where(inArray2(alerts.watchlistId, wlIds)).orderBy(desc(alerts.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/matters/:id/activities", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const { workspaceId, alertId, type, ownerUserId, summary, detailText, dueAt } = req.body ?? {};
      if (!workspaceId || !type || !summary) {
        return res.status(400).json({ message: "workspaceId, type, and summary are required" });
      }
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
      const rows = await policyIntelDb.select().from(activities).where(eq5(activities.matterId, matterId)).orderBy(desc(activities.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/activities", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(activities).orderBy(desc(activities.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.get("/stakeholders", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(stakeholders).orderBy(desc(stakeholders.id));
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
  router.post("/stakeholders", async (req, res, next) => {
    try {
      const { workspaceId, type, name, title, organization, jurisdiction, tagsJson, sourceSummary } = req.body ?? {};
      if (!workspaceId || !type || !name) {
        return res.status(400).json({ message: "workspaceId, type, and name are required" });
      }
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
      const id = Number(req.params.id);
      const result = await getStakeholderWithObservations(id);
      if (!result) return res.status(404).json({ message: "stakeholder not found" });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  router.post("/stakeholders/:id/observations", async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const { sourceDocumentId, matterId, observationText, confidence } = req.body ?? {};
      if (!observationText) {
        return res.status(400).json({ message: "observationText is required" });
      }
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
  router.post("/jobs/fetch-tec", async (req, res, next) => {
    try {
      const { searchTerm } = req.body ?? {};
      if (!searchTerm) {
        return res.status(400).json({ message: "searchTerm is required" });
      }
      const result = await fetchTecData(searchTerm);
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
        matterIds: result.matterIds
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
  return router;
}

// server/policy-intel/app.ts
function createPolicyIntelApp() {
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.use(cors({ origin: true, credentials: true }));
  app2.use(express.json({ limit: "2mb" }));
  app2.use(express.urlencoded({ extended: true }));
  app2.get("/health", (_req, res) => {
    res.json({ ok: true, app: "actup-policy-intel" });
  });
  app2.use("/api/intel", createPolicyIntelRouter());
  app2.use((err, _req, res, _next) => {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({ message });
  });
  return app2;
}

// server/policy-intel/index.ts
var port = Number(process.env.POLICY_INTEL_PORT || 5050);
var host = process.env.HOST || "0.0.0.0";
var app = createPolicyIntelApp();
app.listen(port, host, () => {
  console.log(`[policy-intel] listening on http://${host}:${port}`);
});
