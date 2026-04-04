import { Router } from "express";
import { and, count, desc, eq, gt, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { policyIntelDb } from "./db";
import { activities, alerts, briefs, deliverables, issueRoomSourceDocuments, issueRoomStrategyOptions, issueRoomTasks, issueRoomUpdates, issueRooms, matters, matterWatchlists, monitoringJobs, sourceDocuments, stakeholders, stakeholderObservations, watchlists, workspaces, hearingEvents, committeeMembers, meetingNotes } from "@shared/schema-policy-intel";
import { seedGraceMcEwan } from "./seed/grace-mcewan";
import { runTloRssJob } from "./jobs/run-tlo-rss";
import { runLegiscanJob } from "./jobs/run-legiscan";
import { createLogger } from "./logger";

const log = createLogger("routes");
import {
  validateBody,
  escapeLike,
  createWorkspaceSchema,
  createWatchlistSchema,
  patchWatchlistSchema,
  createSourceDocumentSchema,
  createAlertSchema,
  patchAlertSchema,
  bulkTriageSchema,
  createIssueRoomSchema,
  createIssueRoomFromAlertSchema,
  patchIssueRoomSchema,
  createIssueRoomUpdateSchema,
  createStrategyOptionSchema,
  createTaskSchema,
  patchTaskSchema,
  createIssueRoomStakeholderSchema,
  createMatterSchema,
  createStakeholderSchema,
  createObservationSchema,
  createMeetingNoteSchema,
  createActivitySchema,
  generateBriefSchema,
  generateClientAlertSchema,
  generateWeeklyReportSchema,
  generateHearingMemoSchema,
  pipelineTestSchema,
  runLegiscanSchema,
  fetchTecSchema,
  runTecImportSchema,
  createCommitteeIntelFromHearingSchema,
  addSegmentSchema,
  focusedBriefSchema,
  createReplayRunSchema,
  importLegislatorsSchema,
  linkWatchlistToMatterSchema,
} from "./validation";
import { processDocumentAlerts } from "./services/alert-service";
import { generateBrief } from "./services/brief-service";
import { upsertStakeholder, addObservation, getStakeholderWithObservations, getStakeholdersForMatter } from "./services/stakeholder-service";
import { fetchTecData } from "./connectors/texas/tec-filings";
import { runLocalFeedsJob } from "./jobs/run-local-feeds";
import { runTecImportJob } from "./jobs/run-tec";
import { getSchedulerStatus, triggerJob, getJobHistory } from "./scheduler";
import { getPipelineConfig, runAgentPipeline } from "./engine/agent-pipeline";
import { metrics, timeSeries } from "./metrics";
import { recordFeedback, getChampionStatus, getChampionHistory, runRetraining, bootstrapFeedback } from "./engine/champion";
import type { FeedbackOutcome } from "./engine/champion";
import { notifySlack } from "./notify";
import { getEnvironmentStatusReport } from "./env-status";
import { generateClientAlert, generateWeeklyReport, generateHearingMemo } from "./services/deliverable-service";
import { runSwarm } from "./engine/intelligence/swarm-coordinator";
import { analyzeVelocity } from "./engine/intelligence/velocity-analyzer";
import { analyzeCorrelations } from "./engine/intelligence/cross-correlator";
import { analyzeInfluence } from "./engine/intelligence/influence-ranker";
import { analyzeRisk } from "./engine/intelligence/risk-model";
import { detectAnomalies } from "./engine/intelligence/anomaly-detector";
import {
  analyzeForecast,
  getForecastDriftSummary,
  getLatestOutcomeTruthSnapshotSummary,
  refreshOutcomeTruthSnapshot,
} from "./engine/intelligence/forecast-tracker";
import { analyzeSponsorNetwork } from "./engine/intelligence/sponsor-network";
import { analyzeHistoricalPatterns } from "./engine/intelligence/historical-patterns";
import { analyzeLegislatorProfiles } from "./engine/intelligence/legislator-profiler";
import { analyzeInfluenceMaps } from "./engine/intelligence/influence-map";
import {
  advanceReplayRun,
  createLegiscanReplayRun,
  getReplayRunDetail,
  listReplayRuns,
  pauseReplayRun,
} from "./services/replay-orchestrator-service";
import {
  addCommitteeIntelSegment,
  createCommitteeIntelSessionFromHearing,
  deleteCommitteeIntelSession,
  rebuildCommitteeIntelSession,
  generateCommitteeIntelPostHearingRecap,
  generateCommitteeIntelFocusedBrief,
  getCommitteeIntelSession,
  listCommitteeIntelSessions,
  refreshCommitteeIntelSession,
  resetCommitteeIntelSession,
  syncCommitteeIntelTranscriptFeed,
  updateCommitteeIntelSession,
} from "./services/committee-intel-service";

function slugifyIssueRoom(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

async function buildWorkspaceDigestPayload(workspaceId: number, weekParam?: string) {
  let weekStart: Date;
  let weekEnd: Date;

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
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
  }

  const weekAlerts = await policyIntelDb
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.workspaceId, workspaceId),
        gt(alerts.createdAt, weekStart),
      ),
    )
    .orderBy(desc(alerts.relevanceScore));

  const filteredAlerts = weekAlerts.filter((alert) => alert.createdAt < weekEnd);
  const grouped: Record<number, { watchlistId: number; alerts: typeof filteredAlerts }> = {};

  for (const alert of filteredAlerts) {
    const watchlistId = alert.watchlistId ?? 0;
    if (!grouped[watchlistId]) {
      grouped[watchlistId] = { watchlistId, alerts: [] };
    }
    grouped[watchlistId].alerts.push(alert);
  }

  const watchlistIds = Object.keys(grouped).map(Number).filter((id) => id > 0);
  const watchlistRows = watchlistIds.length > 0
    ? await policyIntelDb.select().from(watchlists).where(inArray(watchlists.id, watchlistIds))
    : [];
  const watchlistNameMap = new Map(watchlistRows.map((watchlist) => [watchlist.id, watchlist.name]));

  const sections = Object.values(grouped).map((group) => ({
    watchlist: watchlistNameMap.get(group.watchlistId) ?? "Unlinked",
    alertCount: group.alerts.length,
    highPriority: group.alerts.filter((alert) => alert.relevanceScore >= 70).length,
    alerts: group.alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      score: alert.relevanceScore,
      status: alert.status,
      whyItMatters: alert.whyItMatters,
    })),
  }));

  const weekActivities = await policyIntelDb
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.workspaceId, workspaceId),
        gt(activities.createdAt, weekStart),
      ),
    )
    .orderBy(desc(activities.createdAt));

  const filteredActivities = weekActivities.filter((activity) => activity.createdAt < weekEnd);

  return {
    workspace: workspaceId,
    period: {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
      week: weekParam ?? `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)).padStart(2, "0")}`,
    },
    summary: {
      totalAlerts: filteredAlerts.length,
      highPriority: filteredAlerts.filter((alert) => alert.relevanceScore >= 70).length,
      pendingReview: filteredAlerts.filter((alert) => alert.status === "pending_review").length,
      reviewed: filteredAlerts.filter((alert) => alert.status !== "pending_review").length,
      activitiesLogged: filteredActivities.length,
    },
    sections,
    recentActivities: filteredActivities.slice(0, 20).map((activity) => ({
      id: activity.id,
      type: activity.type,
      summary: activity.summary,
      matterId: activity.matterId,
      createdAt: activity.createdAt,
    })),
  };
}

export function createPolicyIntelRouter() {
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
    } catch (err: any) {
      next(err);
    }
  });

  // ── Dashboard aggregate stats (no full scans) ────────────────────────────

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
        alertsByStatus,
      ] = await Promise.all([
        policyIntelDb.select({ count: count() }).from(alerts),
        policyIntelDb.select({ count: count() }).from(alerts).where(eq(alerts.status, "pending_review")),
        policyIntelDb.select({ count: count() }).from(alerts).where(gte(alerts.relevanceScore, 70)),
        policyIntelDb.select({ count: count() }).from(sourceDocuments),
        policyIntelDb.select({ count: count() }).from(matters).where(eq(matters.status, "active")),
        policyIntelDb.select({ count: count() }).from(watchlists).where(eq(watchlists.isActive, true)),
        policyIntelDb
          .select()
          .from(alerts)
          .orderBy(desc(alerts.id))
          .limit(10),
        policyIntelDb
          .select()
          .from(sourceDocuments)
          .orderBy(desc(sourceDocuments.id))
          .limit(5),
        policyIntelDb
          .select({
            watchlistId: alerts.watchlistId,
            count: count(),
          })
          .from(alerts)
          .groupBy(alerts.watchlistId)
          .orderBy(desc(count()))
          .limit(10),
        policyIntelDb
          .select({
            status: alerts.status,
            count: count(),
          })
          .from(alerts)
          .groupBy(alerts.status),
      ]);

      // Resolve watchlist names for the breakdown
      const wlIds = alertsByWatchlist.map((r) => r.watchlistId).filter((id): id is number => id !== null);
      const wlRows = wlIds.length > 0
        ? await policyIntelDb.select({ id: watchlists.id, name: watchlists.name }).from(watchlists).where(inArray(watchlists.id, wlIds))
        : [];
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
          count: r.count,
        })),
        alertsByStatus: alertsByStatus.map((r) => ({
          status: r.status,
          count: r.count,
        })),
      });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /dashboard/kpis — real-time KPI data with sparkline time-series
   */
  router.get("/dashboard/kpis", async (_req, res, next) => {
    try {
      // Live counters from Prometheus metrics registry
      const pipelineRuns = metrics.getCounter("policy_intel_pipeline_runs_total");
      const alertsCreated = metrics.getCounter("policy_intel_alerts_created_total");
      const docsProcessed = metrics.getCounter("policy_intel_docs_processed_total");
      const docsMatched = metrics.getCounter("policy_intel_docs_matched_total");
      const escalations = metrics.getCounter("policy_intel_pipeline_actions_total", { action: "escalate" });
      const watches = metrics.getCounter("policy_intel_pipeline_actions_total", { action: "watch" });
      const archives = metrics.getCounter("policy_intel_pipeline_actions_total", { action: "archive" });
      const alertsSkippedDup = metrics.getCounter("policy_intel_alerts_skipped_total", { reason: "duplicate" });
      const alertsSkippedCooldown = metrics.getCounter("policy_intel_alerts_skipped_total", { reason: "cooldown" });

      // Pipeline performance
      const scoreSummary = metrics.getHistogramSummary("policy_intel_pipeline_score");
      const confidenceSummary = metrics.getHistogramSummary("policy_intel_pipeline_confidence");
      const durationSummary = metrics.getHistogramSummary("policy_intel_pipeline_duration_ms");

      // Current regime
      const regimeGauges = metrics.getGaugeAll("policy_intel_regime_current");
      const activeRegime = regimeGauges.find((g) => g.value === 1);

      // Agent averages
      const agentNames = ["procedural", "relevance", "stakeholder", "actionability", "timeliness", "regime"];
      const agentScores = agentNames.map((name) => ({
        agent: name,
        ...metrics.getHistogramSummary("policy_intel_agent_score", { agent: name }),
      }));

      // DB counts (lightweight — use cached if under 2s old)
      const [
        [alertCount],
        [pendingCount],
        [highPriorityCount],
      ] = await Promise.all([
        policyIntelDb.select({ count: count() }).from(alerts),
        policyIntelDb.select({ count: count() }).from(alerts).where(eq(alerts.status, "pending_review")),
        policyIntelDb.select({ count: count() }).from(alerts).where(gte(alerts.relevanceScore, 70)),
      ]);

      // Sparkline time-series (30-min rolling window, 30s intervals)
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
          matchRate: docsProcessed > 0 ? Math.round((docsMatched / docsProcessed) * 100) : 0,
          escalations,
          watches,
          archives,
          alertsSkipped: alertsSkippedDup + alertsSkippedCooldown,
        },
        pipeline: {
          avgScore: Math.round(scoreSummary.mean * 10) / 10,
          avgConfidence: Math.round(confidenceSummary.mean * 100) / 100,
          avgDurationMs: Math.round(durationSummary.mean * 10) / 10,
          totalRuns: scoreSummary.count,
        },
        regime: activeRegime ? activeRegime.labels.regime ?? "unknown" : "unknown",
        agents: agentScores,
        sparklines: spark,
      });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /dashboard/analytics — alert score distribution + source type breakdown
   */
  router.get("/dashboard/analytics", async (_req, res, next) => {
    try {
      const [scoreDistRaw, sourceBreakdownRaw, dailyVolumeRaw] = await Promise.all([
        policyIntelDb.execute(sql`
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
        policyIntelDb.execute(sql`
          SELECT source_type, count(*)::int AS count
          FROM policy_intel_source_documents
          GROUP BY source_type
          ORDER BY count DESC
        `),
        policyIntelDb.execute(sql`
          SELECT date_trunc('day', created_at)::date AS day, count(*)::int AS count
          FROM policy_intel_alerts
          WHERE created_at >= now() - interval '30 days'
          GROUP BY day
          ORDER BY day
        `),
      ]);

      res.json({
        scoreDistribution: scoreDistRaw,
        sourceTypeBreakdown: sourceBreakdownRaw,
        dailyAlertVolume: dailyVolumeRaw,
      });
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/workspaces", validateBody(createWorkspaceSchema), async (req, res, next) => {
    try {
      const { slug, name } = req.body;

      const [created] = await policyIntelDb
        .insert(workspaces)
        .values({ slug, name })
        .returning();

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/watchlists", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(watchlists).orderBy(desc(watchlists.id)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count() }).from(watchlists),
      ]);
      res.json({ data: rows, total: totalRow?.count ?? 0, page, limit, totalPages: Math.ceil((totalRow?.count ?? 0) / limit) });
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/watchlists", validateBody(createWatchlistSchema), async (req, res, next) => {
    try {
      const { workspaceId, name, topic, description, rulesJson } = req.body;

      const [created] = await policyIntelDb
        .insert(watchlists)
        .values({
          workspaceId: Number(workspaceId),
          name,
          topic,
          description,
          rulesJson: rulesJson ?? {},
        })
        .returning();

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/watchlists/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [watchlist] = await policyIntelDb.select().from(watchlists).where(eq(watchlists.id, id));
      if (!watchlist) {
        return res.status(404).json({ message: "watchlist not found" });
      }
      res.json(watchlist);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * PATCH /watchlists/:id — update watchlist name, description, rules, or active status.
   */
  router.patch("/watchlists/:id", validateBody(patchWatchlistSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { name, topic, description, rulesJson, isActive } = req.body;

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (topic !== undefined) updates.topic = topic;
      if (description !== undefined) updates.description = description;
      if (rulesJson !== undefined) updates.rulesJson = rulesJson;
      if (isActive !== undefined) updates.isActive = Boolean(isActive);
      updates.updatedAt = new Date();

      const [updated] = await policyIntelDb
        .update(watchlists)
        .set(updates)
        .where(eq(watchlists.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "watchlist not found" });
      res.json(updated);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Watchlist alerts ────────────────────────────────────────────────────

  router.get("/watchlists/:id/alerts", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const status = req.query.status as string | undefined;

      const conditions = [eq(alerts.watchlistId, id)];
      if (status && status !== "all") conditions.push(eq(alerts.status, status as any));

      const where = and(...conditions);

      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(alerts).where(where).orderBy(desc(alerts.relevanceScore)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count() }).from(alerts).where(where),
      ]);

      res.json({ data: rows, total: totalRow?.count ?? 0, page, limit, totalPages: Math.ceil((totalRow?.count ?? 0) / limit) });
    } catch (err: any) {
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
        tagsJson,
      } = req.body;

      const [created] = await policyIntelDb
        .insert(sourceDocuments)
        .values({
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
          tagsJson: tagsJson ?? [],
        })
        .returning();

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/source-documents", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const sourceType = req.query.sourceType as string | undefined;
      const search = req.query.search as string | undefined;

      const conditions = [];
      if (sourceType) conditions.push(eq(sourceDocuments.sourceType, sourceType as any));
      if (search) {
        const terms = search.trim().split(/\s+/).filter(Boolean).map(t => t.replace(/[^a-zA-Z0-9]/g, "")).filter(Boolean);
        if (terms.length > 0) {
          const tsq = terms.join(" & ");
          conditions.push(sql`to_tsvector('english', coalesce(${sourceDocuments.title},'') || ' ' || coalesce(${sourceDocuments.summary},'') || ' ' || coalesce(${sourceDocuments.normalizedText},'')) @@ to_tsquery('english', ${tsq})`);
        }
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb
          .select()
          .from(sourceDocuments)
          .where(where)
          .orderBy(desc(sourceDocuments.id))
          .limit(limit)
          .offset(offset),
        policyIntelDb
          .select({ count: count() })
          .from(sourceDocuments)
          .where(where),
      ]);

      const total = totalRow?.count ?? 0;

      // Enrich with alert counts
      const docIds = rows.map((r) => r.id);
      let alertCountMap: Record<number, { count: number; maxScore: number }> = {};
      if (docIds.length > 0) {
        const alertAgg = await policyIntelDb
          .select({
            sourceDocumentId: alerts.sourceDocumentId,
            count: sql<number>`count(*)::int`,
            maxScore: sql<number>`coalesce(max(${alerts.relevanceScore}), 0)`,
          })
          .from(alerts)
          .where(inArray(alerts.sourceDocumentId, docIds))
          .groupBy(alerts.sourceDocumentId);
        for (const a of alertAgg) {
          if (a.sourceDocumentId) {
            alertCountMap[a.sourceDocumentId] = { count: a.count, maxScore: a.maxScore };
          }
        }
      }

      const enriched = rows.map((r) => ({
        ...r,
        alertCount: alertCountMap[r.id]?.count ?? 0,
        maxAlertScore: alertCountMap[r.id]?.maxScore ?? 0,
      }));

      res.json({ data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
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
        metadataJson,
      } = req.body;

      // Map severity string → relevanceScore integer
      const severityScoreMap: Record<string, number> = {
        high: 80, medium: 50, low: 20, info: 0,
      };
      const relevanceScore = severityScoreMap[severity as string] ?? 0;

      // status must be a valid alertStatusEnum value
      const validStatuses = ["pending_review", "ready", "sent", "suppressed"] as const;
      type AlertStatus = typeof validStatuses[number];
      const resolvedStatus: AlertStatus = validStatuses.includes(status as AlertStatus)
        ? (status as AlertStatus)
        : "pending_review";

      const [created] = await policyIntelDb
        .insert(alerts)
        .values({
          workspaceId: Number(workspaceId),
          watchlistId: Number(watchlistId),
          sourceDocumentId: Number(sourceDocumentId),
          title,
          summary,
          whyItMatters: alertReason ?? null,
          status: resolvedStatus,
          relevanceScore,
          reasonsJson: metadataJson ? [{ manual: true, data: metadataJson }] : [],
        })
        .returning();

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/alerts", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const status = req.query.status as string | undefined;
      const watchlistId = req.query.watchlistId ? Number(req.query.watchlistId) : undefined;
      const minScore = req.query.minScore ? Number(req.query.minScore) : undefined;
      const search = req.query.search as string | undefined;

      const conditions = [];
      if (status && status !== "all") conditions.push(eq(alerts.status, status as any));
      if (watchlistId) conditions.push(eq(alerts.watchlistId, watchlistId));
      if (minScore !== undefined) conditions.push(gte(alerts.relevanceScore, minScore));
      if (search) {
        const terms = search.trim().split(/\s+/).filter(Boolean).map(t => t.replace(/[^a-zA-Z0-9]/g, "")).filter(Boolean);
        if (terms.length > 0) {
          const tsq = terms.join(" & ");
          conditions.push(sql`to_tsvector('english', coalesce(${alerts.title},'') || ' ' || coalesce(${alerts.summary},'') || ' ' || coalesce(${alerts.whyItMatters},'')) @@ to_tsquery('english', ${tsq})`);
        }
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb
          .select()
          .from(alerts)
          .where(where)
          .orderBy(desc(alerts.id))
          .limit(limit)
          .offset(offset),
        policyIntelDb
          .select({ count: count() })
          .from(alerts)
          .where(where),
      ]);

      const total = totalRow?.count ?? 0;
      res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Phase 7: Reviewer feedback ────────────────────────────────────────────

  router.patch("/alerts/:id", validateBody(patchAlertSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { status, reviewerNote } = req.body;

      const validStatuses = ["pending_review", "ready", "sent", "suppressed"] as const;
      type AlertStatus = typeof validStatuses[number];

      const updates: Record<string, unknown> = {};
      if (status && validStatuses.includes(status as AlertStatus)) {
        updates.status = status;
      }
      if (reviewerNote !== undefined) {
        updates.reviewerNote = reviewerNote;
      }
      updates.reviewedAt = new Date();

      const [updated] = await policyIntelDb
        .update(alerts)
        .set(updates)
        .where(eq(alerts.id, id))
        .returning();

      if (!updated) return res.status(404).json({ message: "alert not found" });

      // Log activity if alert is linked to a matter via watchlist
      if (updated.watchlistId) {
        const links = await policyIntelDb
          .select()
          .from(matterWatchlists)
          .where(eq(matterWatchlists.watchlistId, updated.watchlistId));

        for (const link of links) {
          await policyIntelDb.insert(activities).values({
            workspaceId: updated.workspaceId,
            matterId: link.matterId,
            alertId: updated.id,
            type: "review_completed",
            summary: `Alert "${updated.title}" reviewed → ${updated.status}`,
            detailText: reviewerNote ?? null,
          });
        }
      }

      // ── Champion/Challenger feedback recording ──
      // Map reviewer action to feedback outcome for walk-forward training
      if (status && ["ready", "sent", "suppressed"].includes(status)) {
        try {
          const outcome: FeedbackOutcome =
            status === "suppressed" ? "suppressed" : "promoted";

          // Extract pipeline data from reasonsJson
          const reasons = (updated.reasonsJson ?? []) as Record<string, unknown>[];
          const pipelineEntry = reasons.find((r) => r.evaluator === "_pipeline" || r.agent === "_pipeline");
          const agentScores = reasons.filter(
            (r) => r.evaluator !== "_pipeline" && r.agent !== "_pipeline",
          );

          await recordFeedback(updated.id, outcome, {
            originalScore: updated.relevanceScore,
            originalConfidence: updated.confidenceScore / 100,
            agentScores,
            weights: (pipelineEntry?.weights as Record<string, number>) ?? {},
            regime: (pipelineEntry?.regime as string) ?? "interim",
          });
        } catch (feedbackErr) {
          // Non-fatal — don't block the review response
          log.error({ err: feedbackErr }, "champion feedback recording failed");
        }
      }

      res.json(updated);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Single alert detail ─────────────────────────────────────────────────

  router.get("/alerts/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [alert] = await policyIntelDb.select().from(alerts).where(eq(alerts.id, id));
      if (!alert) return res.status(404).json({ message: "alert not found" });

      // Fetch related data in parallel
      const [sourceDoc, watchlist, linkedIssueRoom] = await Promise.all([
        alert.sourceDocumentId
          ? policyIntelDb.select().from(sourceDocuments).where(eq(sourceDocuments.id, alert.sourceDocumentId)).then(r => r[0] ?? null)
          : Promise.resolve(null),
        alert.watchlistId
          ? policyIntelDb.select().from(watchlists).where(eq(watchlists.id, alert.watchlistId)).then(r => r[0] ?? null)
          : Promise.resolve(null),
        alert.issueRoomId
          ? policyIntelDb.select().from(issueRooms).where(eq(issueRooms.id, alert.issueRoomId)).then(r => r[0] ?? null)
          : Promise.resolve(null),
      ]);

      res.json({ alert, sourceDocument: sourceDoc, watchlist, issueRoom: linkedIssueRoom });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Bulk auto-triage ──────────────────────────────────────────────────────

  /**
   * POST /alerts/bulk-triage — auto-suppress low-scoring alerts and auto-promote bill-ID matches.
   * Body: { suppressBelow?: number, promoteAbove?: number, dryRun?: boolean }
   */
  router.post("/alerts/bulk-triage", validateBody(bulkTriageSchema), async (req, res, next) => {
    try {
      const suppressBelow = req.body.suppressBelow;
      const promoteAbove = req.body.promoteAbove;
      const dryRun = req.body.dryRun;
      const approvalToken = req.body.approvalToken;
      const requireApproval = process.env.BULK_TRIAGE_REQUIRE_APPROVAL !== "false";
      const approvalThreshold = Math.max(1, Number(process.env.BULK_TRIAGE_APPROVAL_THRESHOLD || 100));
      const approvalPhrase = process.env.BULK_TRIAGE_APPROVAL_TOKEN || "APPROVE_BULK_TRIAGE";

      const [pendingCountRow] = await policyIntelDb
        .select({ count: count() })
        .from(alerts)
        .where(eq(alerts.status, "pending_review"));
      const pendingCount = pendingCountRow?.count ?? 0;

      // Count how many would be affected
      const [suppressCountRow] = await policyIntelDb
        .select({ count: count() })
        .from(alerts)
        .where(and(
          eq(alerts.status, "pending_review"),
          lt(alerts.relevanceScore, suppressBelow),
        ));
      const [promoteCountRow] = await policyIntelDb
        .select({ count: count() })
        .from(alerts)
        .where(and(
          eq(alerts.status, "pending_review"),
          gte(alerts.relevanceScore, promoteAbove),
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
            suppressShare,
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
          approvalThreshold,
        });
      }

      // Execute triage inside a transaction to prevent race conditions
      const result = await policyIntelDb.transaction(async (tx) => {
        let suppressed = 0;
        let promoted = 0;

        if (toSuppress > 0) {
          await tx
            .update(alerts)
            .set({ status: "suppressed", reviewedAt: new Date(), reviewerNote: `auto-triage: score < ${suppressBelow}` })
            .where(and(
              eq(alerts.status, "pending_review"),
              lt(alerts.relevanceScore, suppressBelow),
            ));
          suppressed = toSuppress;
        }

        if (toPromote > 0) {
          await tx
            .update(alerts)
            .set({ status: "ready", reviewedAt: new Date(), reviewerNote: `auto-triage: score >= ${promoteAbove}` })
            .where(and(
              eq(alerts.status, "pending_review"),
              gte(alerts.relevanceScore, promoteAbove),
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
        approvalThreshold,
      });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Phase 7: Weekly digest ────────────────────────────────────────────────

  router.get("/workspaces/:id/digest", async (req, res, next) => {
    try {
      const workspaceId = Number(req.params.id);
      const weekParam = req.query.week as string | undefined;
      res.json(await buildWorkspaceDigestPayload(workspaceId, weekParam));
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/briefs", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(briefs).orderBy(desc(briefs.id));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/briefs/generate", validateBody(generateBriefSchema), async (req, res, next) => {
    try {
      const { workspaceId, watchlistId, matterId, sourceDocumentIds, title } = req.body;
      const result = await generateBrief({
        workspaceId: Number(workspaceId),
        watchlistId: watchlistId ? Number(watchlistId) : undefined,
        matterId: matterId ? Number(matterId) : undefined,
        sourceDocumentIds: sourceDocumentIds.map(Number),
        title,
      });

      // Log activity if linked to a matter
      if (matterId) {
        await policyIntelDb.insert(activities).values({
          workspaceId: Number(workspaceId),
          matterId: Number(matterId),
          type: "brief_drafted",
          summary: `Brief "${result.title ?? title ?? "Untitled"}" generated from ${sourceDocumentIds.length} source(s)`,
        });
      }

      res.status(201).json(result);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/deliverables", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(deliverables).orderBy(desc(deliverables.id)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count() }).from(deliverables),
      ]);
      res.json({ data: rows, total: totalRow?.count ?? 0, page, limit, totalPages: Math.ceil((totalRow?.count ?? 0) / limit) });
    } catch (err: any) {
      next(err);
    }
  });

  // Briefs for a specific matter (via deliverables)
  router.get("/matters/:id/briefs", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const rows = await policyIntelDb
        .select()
        .from(deliverables)
        .where(eq(deliverables.matterId, matterId))
        .orderBy(desc(deliverables.id));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/jobs", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(monitoringJobs).orderBy(desc(monitoringJobs.id));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Issue Rooms ───────────────────────────────────────────────────────────

  router.get("/issue-rooms", async (req, res, next) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = (page - 1) * limit;
      const where = workspaceId ? eq(issueRooms.workspaceId, workspaceId) : undefined;
      const [rows, [totalRow]] = await Promise.all([
        policyIntelDb.select().from(issueRooms).where(where).orderBy(desc(issueRooms.id)).limit(limit).offset(offset),
        policyIntelDb.select({ count: count() }).from(issueRooms).where(where),
      ]);
      res.json({ data: rows, total: totalRow?.count ?? 0, page, limit, totalPages: Math.ceil((totalRow?.count ?? 0) / limit) });
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/issue-rooms", validateBody(createIssueRoomSchema), async (req, res, next) => {
    try {
      const { workspaceId, matterId, slug, title, issueType, jurisdiction, status, summary, recommendedPath, ownerUserId, relatedBillIds, sourceDocumentIds } = req.body;

      const resolvedSlug = slugifyIssueRoom(slug ?? title);
      const [created] = await policyIntelDb
        .insert(issueRooms)
        .values({
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
          relatedBillIds: relatedBillIds ?? [],
        })
        .returning();

      if (Array.isArray(sourceDocumentIds) && sourceDocumentIds.length > 0) {
        await policyIntelDb.insert(issueRoomSourceDocuments).values(
          sourceDocumentIds.map((sourceDocumentId: number) => ({
            issueRoomId: created.id,
            sourceDocumentId: Number(sourceDocumentId),
            relationshipType: "background" as const,
          })),
        );
      }

      await policyIntelDb.insert(activities).values({
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : null,
        issueRoomId: created.id,
        type: "note_added",
        summary: `Issue room created: ${title}`,
        detailText: summary ?? null,
      });

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/issue-rooms/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq(issueRooms.id, id));
      if (!issueRoom) return res.status(404).json({ message: "issue room not found" });

      const [linkedSources, updates, strategyOptions, tasks, linkedStakeholders] = await Promise.all([
        policyIntelDb.select().from(issueRoomSourceDocuments).where(eq(issueRoomSourceDocuments.issueRoomId, id)).orderBy(desc(issueRoomSourceDocuments.id)),
        policyIntelDb.select().from(issueRoomUpdates).where(eq(issueRoomUpdates.issueRoomId, id)).orderBy(desc(issueRoomUpdates.id)),
        policyIntelDb.select().from(issueRoomStrategyOptions).where(eq(issueRoomStrategyOptions.issueRoomId, id)).orderBy(issueRoomStrategyOptions.recommendationRank, desc(issueRoomStrategyOptions.id)),
        policyIntelDb.select().from(issueRoomTasks).where(eq(issueRoomTasks.issueRoomId, id)).orderBy(desc(issueRoomTasks.id)),
        policyIntelDb.select().from(stakeholders).where(eq(stakeholders.issueRoomId, id)).orderBy(desc(stakeholders.id)),
      ]);

      const sourceIds = linkedSources.map((row) => row.sourceDocumentId);
      const sourceRows = sourceIds.length > 0
        ? await policyIntelDb.select().from(sourceDocuments).where(inArray(sourceDocuments.id, sourceIds))
        : [];

      res.json({
        issueRoom,
        sourceDocuments: sourceRows,
        sourceLinks: linkedSources,
        updates,
        strategyOptions,
        tasks,
        stakeholders: linkedStakeholders,
      });
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/alerts/:id/create-issue-room", validateBody(createIssueRoomFromAlertSchema), async (req, res, next) => {
    try {
      const alertId = Number(req.params.id);
      const [alert] = await policyIntelDb.select().from(alerts).where(eq(alerts.id, alertId));
      if (!alert) return res.status(404).json({ message: "alert not found" });

      const { matterId, slug, title, issueType, jurisdiction, summary, recommendedPath, ownerUserId, relatedBillIds } = req.body;
      const resolvedTitle = title ?? alert.title;
      const [created] = await policyIntelDb
        .insert(issueRooms)
        .values({
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
          relatedBillIds: relatedBillIds ?? [],
        })
        .returning();

      if (alert.sourceDocumentId) {
        await policyIntelDb.insert(issueRoomSourceDocuments).values({
          issueRoomId: created.id,
          sourceDocumentId: alert.sourceDocumentId,
          relationshipType: "primary_authority",
        });
      }

      const [updatedAlert] = await policyIntelDb
        .update(alerts)
        .set({ issueRoomId: created.id })
        .where(eq(alerts.id, alertId))
        .returning();

      await policyIntelDb.insert(activities).values({
        workspaceId: alert.workspaceId,
        matterId: matterId ? Number(matterId) : null,
        issueRoomId: created.id,
        alertId: alert.id,
        type: "note_added",
        summary: `Issue room created from alert: ${resolvedTitle}`,
        detailText: alert.whyItMatters ?? alert.summary ?? null,
      });

      // Strong positive signal for champion/challenger
      try {
        const reasons = (alert.reasonsJson ?? []) as Record<string, unknown>[];
        const pipelineEntry = reasons.find((r) => r.evaluator === "_pipeline" || r.agent === "_pipeline");
        const agentScores = reasons.filter(
          (r) => r.evaluator !== "_pipeline" && r.agent !== "_pipeline",
        );
        await recordFeedback(alert.id, "strong_positive", {
          originalScore: alert.relevanceScore,
          originalConfidence: alert.confidenceScore / 100,
          agentScores,
          weights: (pipelineEntry?.weights as Record<string, number>) ?? {},
          regime: (pipelineEntry?.regime as string) ?? "interim",
        });
      } catch (feedbackErr) {
        log.error({ err: feedbackErr }, "champion strong_positive feedback failed");
      }

      res.status(201).json({ issueRoom: created, alert: updatedAlert });
    } catch (err: any) {
      next(err);
    }
  });

  // ── PATCH issue room fields ──────────────────────────────────────────────
  router.patch("/issue-rooms/:id", validateBody(patchIssueRoomSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { title, summary, status, recommendedPath, issueType, jurisdiction } = req.body;
      const patch: Record<string, unknown> = {};
      if (title !== undefined) patch.title = title;
      if (summary !== undefined) patch.summary = summary;
      if (status !== undefined) patch.status = status;
      if (recommendedPath !== undefined) patch.recommendedPath = recommendedPath;
      if (issueType !== undefined) patch.issueType = issueType;
      if (jurisdiction !== undefined) patch.jurisdiction = jurisdiction;

      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      patch.updatedAt = new Date();

      const [updated] = await policyIntelDb
        .update(issueRooms)
        .set(patch)
        .where(eq(issueRooms.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Issue room not found" });
      }

      res.json(updated);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/issue-rooms/:id/alerts", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const linkedDocs = await policyIntelDb
        .select({ sourceDocumentId: issueRoomSourceDocuments.sourceDocumentId })
        .from(issueRoomSourceDocuments)
        .where(eq(issueRoomSourceDocuments.issueRoomId, issueRoomId));

      const linkedSourceDocumentIds = linkedDocs.map((row) => row.sourceDocumentId);
      const rows = linkedSourceDocumentIds.length > 0
        ? await policyIntelDb
            .select()
            .from(alerts)
            .where(
              or(
                eq(alerts.issueRoomId, issueRoomId),
                inArray(alerts.sourceDocumentId, linkedSourceDocumentIds),
              ),
            )
            .orderBy(desc(alerts.id))
        : await policyIntelDb.select().from(alerts).where(eq(alerts.issueRoomId, issueRoomId)).orderBy(desc(alerts.id));

      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/issue-rooms/:id/updates", validateBody(createIssueRoomUpdateSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { title, body, updateType, sourcePackJson } = req.body;

      const [created] = await policyIntelDb
        .insert(issueRoomUpdates)
        .values({
          issueRoomId,
          title,
          body,
          updateType: updateType ?? "analysis",
          sourcePackJson: sourcePackJson ?? [],
        })
        .returning();

      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq(issueRooms.id, issueRoomId));
      if (issueRoom) {
        await policyIntelDb.insert(activities).values({
          workspaceId: issueRoom.workspaceId,
          matterId: issueRoom.matterId,
          issueRoomId,
          type: "note_added",
          summary: `Issue room update added: ${title}`,
          detailText: body,
        });
      }

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/issue-rooms/:id/strategy-options", validateBody(createStrategyOptionSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { label, description, prosJson, consJson, politicalFeasibility, legalDurability, implementationComplexity, recommendationRank } = req.body;

      const [created] = await policyIntelDb
        .insert(issueRoomStrategyOptions)
        .values({
          issueRoomId,
          label,
          description,
          prosJson: prosJson ?? [],
          consJson: consJson ?? [],
          politicalFeasibility,
          legalDurability,
          implementationComplexity,
          recommendationRank: recommendationRank ? Number(recommendationRank) : 0,
        })
        .returning();

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/issue-rooms/:id/tasks", validateBody(createTaskSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { title, description, status, priority, assignee, dueDate } = req.body;

      const [created] = await policyIntelDb
        .insert(issueRoomTasks)
        .values({
          issueRoomId,
          title,
          description,
          status: status ?? "todo",
          priority: priority ?? "medium",
          assignee,
          dueDate: dueDate ? new Date(dueDate) : null,
        })
        .returning();

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.patch("/issue-rooms/:issueRoomId/tasks/:taskId", validateBody(patchTaskSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.issueRoomId);
      const taskId = Number(req.params.taskId);
      const { status, priority, assignee, dueDate, completedAt } = req.body;

      const [existing] = await policyIntelDb
        .select()
        .from(issueRoomTasks)
        .where(and(eq(issueRoomTasks.id, taskId), eq(issueRoomTasks.issueRoomId, issueRoomId)));

      if (!existing) {
        return res.status(404).json({ message: "task not found" });
      }

      const updateValues: Record<string, unknown> = {};

      if (status !== undefined) updateValues.status = status;
      if (priority !== undefined) updateValues.priority = priority;
      if (assignee !== undefined) updateValues.assignee = assignee;
      if (dueDate !== undefined) updateValues.dueDate = dueDate ? new Date(dueDate) : null;

      if (completedAt !== undefined) {
        updateValues.completedAt = completedAt ? new Date(completedAt) : null;
      } else if (status !== undefined) {
        updateValues.completedAt = status === "done" ? new Date() : null;
      }

      const [updated] = await policyIntelDb
        .update(issueRoomTasks)
        .set(updateValues)
        .where(and(eq(issueRoomTasks.id, taskId), eq(issueRoomTasks.issueRoomId, issueRoomId)))
        .returning();

      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq(issueRooms.id, issueRoomId));
      if (issueRoom) {
        await policyIntelDb.insert(activities).values({
          workspaceId: issueRoom.workspaceId,
          matterId: issueRoom.matterId,
          issueRoomId,
          type: "status_changed",
          summary: `Issue room task updated: ${updated.title}`,
          detailText: `status=${updated.status}; priority=${updated.priority}; assignee=${updated.assignee ?? ""}`,
        });
      }

      res.json(updated);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/issue-rooms/:id/stakeholders", validateBody(createIssueRoomStakeholderSchema), async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq(issueRooms.id, issueRoomId));
      if (!issueRoom) return res.status(404).json({ message: "issue room not found" });

      const { type, name, title, organization, jurisdiction, tagsJson, sourceSummary } = req.body;

      const [created] = await policyIntelDb
        .insert(stakeholders)
        .values({
          workspaceId: issueRoom.workspaceId,
          issueRoomId,
          type,
          name,
          title,
          organization,
          jurisdiction,
          tagsJson: tagsJson ?? [],
          sourceSummary,
        })
        .returning();

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Matters ────────────────────────────────────────────────────────────────

  router.get("/matters", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(matters).orderBy(desc(matters.id));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/matters", validateBody(createMatterSchema), async (req, res, next) => {
    try {
      const { workspaceId, slug, name, clientName, practiceArea, jurisdictionScope, status, ownerUserId, description, tagsJson } = req.body;
      const [created] = await policyIntelDb
        .insert(matters)
        .values({
          workspaceId: Number(workspaceId),
          slug,
          name,
          clientName,
          practiceArea,
          jurisdictionScope: jurisdictionScope ?? "texas",
          status: status ?? "active",
          ownerUserId: ownerUserId ? Number(ownerUserId) : null,
          description,
          tagsJson: tagsJson ?? [],
        })
        .returning();
      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/matters/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [matter] = await policyIntelDb.select().from(matters).where(eq(matters.id, id));
      if (!matter) return res.status(404).json({ message: "matter not found" });
      res.json(matter);
    } catch (err: any) {
      next(err);
    }
  });

  // Link a watchlist to a matter
  router.post("/matters/:id/watchlists", validateBody(linkWatchlistToMatterSchema), async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const { watchlistId } = req.body;
      const [created] = await policyIntelDb
        .insert(matterWatchlists)
        .values({ matterId, watchlistId: Number(watchlistId) })
        .returning();
      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  // Get watchlists linked to a matter
  router.get("/matters/:id/watchlists", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const links = await policyIntelDb.select().from(matterWatchlists).where(eq(matterWatchlists.matterId, matterId));
      if (links.length === 0) return res.json([]);
      const wlIds = links.map((l) => l.watchlistId);
      const rows = await policyIntelDb.select().from(watchlists).where(inArray(watchlists.id, wlIds));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  // Get alerts for a matter (via its linked watchlists)
  router.get("/matters/:id/alerts", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const links = await policyIntelDb.select().from(matterWatchlists).where(eq(matterWatchlists.matterId, matterId));
      if (links.length === 0) return res.json([]);
      const wlIds = links.map((l) => l.watchlistId);
      const rows = await policyIntelDb
        .select()
        .from(alerts)
        .where(inArray(alerts.watchlistId, wlIds))
        .orderBy(desc(alerts.id));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Activities ────────────────────────────────────────────────────────────

  router.post("/matters/:id/activities", validateBody(createActivitySchema), async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const { workspaceId, alertId, type, ownerUserId, summary, detailText, dueAt } = req.body;
      const [created] = await policyIntelDb
        .insert(activities)
        .values({
          workspaceId: Number(workspaceId),
          matterId,
          alertId: alertId ? Number(alertId) : null,
          type,
          ownerUserId: ownerUserId ? Number(ownerUserId) : null,
          summary,
          detailText,
          dueAt: dueAt ? new Date(dueAt) : null,
        })
        .returning();
      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/matters/:id/activities", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const rows = await policyIntelDb
        .select()
        .from(activities)
        .where(eq(activities.matterId, matterId))
        .orderBy(desc(activities.id));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/activities", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(activities).orderBy(desc(activities.id));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Stakeholders ──────────────────────────────────────────────────────────

  // NOTE: /for-bill/:billId must come before /:id to avoid ":id" matching "for-bill"

  /**
   * GET /stakeholders/for-bill/:billId — find legislators on committees relevant to a bill.
   */
  router.get("/stakeholders/for-bill/:billId", async (req, res, next) => {
    try {
      const billId = req.params.billId.toUpperCase().replace(/\s+/g, " ");

      const hearingRows = await policyIntelDb
        .select({ committee: hearingEvents.committee, chamber: hearingEvents.chamber })
        .from(hearingEvents)
        .where(sql`${hearingEvents.relatedBillIds}::jsonb @> ${JSON.stringify([billId])}::jsonb`);

      const docRows = await policyIntelDb
        .select({
          committee: sql<string>`${sourceDocuments.rawPayload}->>'committee'`,
          feedType: sql<string>`${sourceDocuments.rawPayload}->>'feedType'`,
        })
        .from(sourceDocuments)
        .where(
          or(
            ilike(sourceDocuments.title, `%${escapeLike(billId)}%`),
            sql`${sourceDocuments.rawPayload}->>'billId' = ${billId}`,
          ),
        );

      const committeeNames = new Set<string>();
      for (const r of hearingRows) committeeNames.add(r.committee);
      for (const r of docRows) {
        if (r.committee) committeeNames.add(r.committee);
      }

      let members: any[] = [];
      if (committeeNames.size > 0) {
        members = await policyIntelDb
          .select({
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
            phone: stakeholders.phone,
          })
          .from(committeeMembers)
          .innerJoin(stakeholders, eq(committeeMembers.stakeholderId, stakeholders.id))
          .where(inArray(committeeMembers.committeeName, [...committeeNames]));
      }

      const observedStakeholders = await policyIntelDb
        .select({
          stakeholderId: stakeholders.id,
          name: stakeholders.name,
          party: stakeholders.party,
          chamber: stakeholders.chamber,
          district: stakeholders.district,
          title: stakeholders.title,
          email: stakeholders.email,
          phone: stakeholders.phone,
          observationText: stakeholderObservations.observationText,
        })
        .from(stakeholderObservations)
        .innerJoin(stakeholders, eq(stakeholderObservations.stakeholderId, stakeholders.id))
        .where(ilike(stakeholderObservations.observationText, `%${escapeLike(billId)}%`));

      res.json({
        billId,
        committees: [...committeeNames],
        committeeMembers: members,
        relatedStakeholders: observedStakeholders,
      });
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/stakeholders", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(stakeholders).orderBy(desc(stakeholders.id));
      res.json(rows);
    } catch (err: any) {
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
        sourceSummary,
      });
      res.status(result.created ? 201 : 200).json(result.stakeholder);
    } catch (err: any) {
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
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/stakeholders/:id/observations", validateBody(createObservationSchema), async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const { sourceDocumentId, matterId, observationText, confidence } = req.body;
      const obs = await addObservation({
        stakeholderId,
        sourceDocumentId: sourceDocumentId ? Number(sourceDocumentId) : undefined,
        matterId: matterId ? Number(matterId) : undefined,
        observationText,
        confidence,
      });
      res.status(201).json(obs);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/matters/:id/stakeholders", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const rows = await getStakeholdersForMatter(matterId);
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  // ── TEC Connector ─────────────────────────────────────────────────────────

  router.post("/jobs/fetch-tec", validateBody(fetchTecSchema), async (req, res, next) => {
    try {
      const { searchTerm } = req.body;
      const result = await fetchTecData(searchTerm);
      res.json(result);
    } catch (err: any) {
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
        matterId: matterId ? Number(matterId) : undefined,
      });
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Local Feeds ───────────────────────────────────────────────────────────

  router.post("/jobs/run-local-feeds", async (_req, res, next) => {
    try {
      const result = await runLocalFeedsJob();
      const status = result.feedErrors.length === result.feedsAttempted ? 500 : 200;
      res.status(status).json(result);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Dev-only: seed Grace & McEwan workspace + watchlists ──────────────────
  router.post("/seed", async (_req, res, next) => {
    try {
      const result = await seedGraceMcEwan();
      res.status(200).json({
        message: "Grace & McEwan workspace seeded",
        workspaceId: result.workspace.id,
        watchlistIds: result.watchlistIds,
        matterIds: result.matterIds,
        issueRoomIds: result.issueRoomIds,
      });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Job triggers ──────────────────────────────────────────────────────────

  router.post("/jobs/run-tlo-rss", async (_req, res, next) => {
    try {
      const result = await runTloRssJob();
      const status = result.feedErrors.length === result.feedsAttempted ? 500 : 200;
      res.status(status).json(result);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/jobs/run-legiscan", validateBody(runLegiscanSchema), async (req, res, next) => {
    try {
      const { mode, sinceDays, limit, offset, orderBy, sessionId, detailConcurrency } = req.body;
      const parsedOrderBy = typeof orderBy === "string" ? orderBy.trim() : undefined;
      const result = await runLegiscanJob({
        mode: mode === "full" || mode === "backfill" ? mode : "recent",
        sinceDays: sinceDays !== undefined ? Number(sinceDays) : undefined,
        limit: limit !== undefined ? Number(limit) : undefined,
        offset: offset !== undefined ? Number(offset) : undefined,
        orderBy:
          parsedOrderBy === "bill_id_asc"
          || parsedOrderBy === "bill_id_desc"
          || parsedOrderBy === "last_action_date_asc"
          || parsedOrderBy === "last_action_date_desc"
            ? parsedOrderBy
            : undefined,
        sessionId: sessionId !== undefined ? Number(sessionId) : undefined,
        detailConcurrency: detailConcurrency !== undefined ? Number(detailConcurrency) : undefined,
      });
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Replay Orchestrator ─────────────────────────────────────────────────

  router.post("/replay/legiscan/runs", validateBody(createReplayRunSchema), async (req, res, next) => {
    try {
      const { sessionId, mode, chunkSize, orderBy, requestedBy, sinceDays, detailConcurrency, startNow, maxChunks } = req.body;

      const created = await createLegiscanReplayRun({
        sessionId: Number(sessionId),
        mode: typeof mode === "string" ? mode as "recent" | "full" | "backfill" : undefined,
        chunkSize: Number.isFinite(Number(chunkSize)) ? Number(chunkSize) : undefined,
        orderBy: typeof orderBy === "string" ? orderBy as any : undefined,
        requestedBy: typeof requestedBy === "string" ? requestedBy : undefined,
        sinceDays: Number.isFinite(Number(sinceDays)) ? Number(sinceDays) : undefined,
        detailConcurrency: Number.isFinite(Number(detailConcurrency)) ? Number(detailConcurrency) : undefined,
      });

      if (startNow === true) {
        const started = await advanceReplayRun(created.run.id, {
          maxChunks: Number.isFinite(Number(maxChunks)) ? Number(maxChunks) : 1,
          untilCompleted: maxChunks === "all",
          stopOnError: true,
        });
        return res.status(201).json(started);
      }

      res.status(201).json(created);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/replay/legiscan/runs", async (req, res, next) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const limit = Number.isFinite(Number(req.query.limit)) ? Number(req.query.limit) : undefined;
      const rows = await listReplayRuns({
        status: status as any,
        limit,
      });
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  router.get("/replay/legiscan/runs/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await getReplayRunDetail(id);
      res.json(detail);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/replay/legiscan/runs/:id/advance", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await advanceReplayRun(id, {
        maxChunks: Number.isFinite(Number(req.body?.maxChunks)) ? Number(req.body.maxChunks) : undefined,
        untilCompleted: req.body?.untilCompleted === true,
        stopOnError: req.body?.stopOnError !== false,
      });
      res.json(detail);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/replay/legiscan/runs/:id/pause", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const detail = await pauseReplayRun(id);
      res.json(detail);
    } catch (err: any) {
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
        stopOnError: req.body?.stopOnError !== false,
      });
      res.json(detail);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/jobs/match-existing", async (_req, res, next) => {
    try {
      const allDocs = await policyIntelDb.select().from(sourceDocuments);
      const allWorkspaces = await policyIntelDb.select({ id: workspaces.id }).from(workspaces);

      const totals = { created: 0, skippedDuplicate: 0, skippedCooldown: 0, details: [] as { alertId: number; watchlist: string; score: number }[] };

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
    } catch (err: any) {
      next(err);
    }
  });

  // ── Scheduler ─────────────────────────────────────────────────────────────

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
    } catch (err: any) {
      next(err);
    }
  });

  // ── Pipeline Diagnostics ──────────────────────────────────────────────────

  /**
   * GET /metrics/pipeline — agent pipeline configuration and current regime
   */
  router.get("/metrics/pipeline", async (_req, res, next) => {
    try {
      const config = getPipelineConfig();
      // Run a synthetic probe to show current regime
      const probe = await runAgentPipeline("probe", null, []);
      res.json({
        ...config,
        currentRegime: probe.regime,
        currentWeights: probe.weights,
        probeScore: probe.totalScore,
        probeAction: probe.action,
        probeConfidence: probe.confidence,
      });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /metrics/pipeline/test — test the agent pipeline with custom input
   * Body: { title: string, summary?: string, reasons?: MatchReason[] }
   */
  router.post("/metrics/pipeline/test", validateBody(pipelineTestSchema), async (req, res, next) => {
    try {
      const { title, summary, reasons } = req.body;
      const signal = await runAgentPipeline(
        title,
        summary ?? null,
        Array.isArray(reasons) ? reasons : [],
      );
      res.json(signal);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Champion / Challenger endpoints ────────────────────────────────────────

  /**
   * GET /champion/status — current champion weights, accuracy, generation
   */
  router.get("/champion/status", async (_req, res, next) => {
    try {
      const status = await getChampionStatus();
      res.json(status);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /champion/history — past champion snapshots (most recent first)
   */
  router.get("/champion/history", async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const history = await getChampionHistory(limit);
      res.json(history);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /champion/retrain — manually trigger a retraining cycle
   */
  router.post("/champion/retrain", async (_req, res, next) => {
    try {
      const result = await runRetraining();
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /champion/bootstrap — seed feedback data from existing alerts
   * Body: { sampleSize?: number } (default: 100)
   */
  router.post("/champion/bootstrap", async (req, res, next) => {
    try {
      const sampleSize = Math.min(Number(req.body?.sampleSize) || 100, 500);
      const result = await bootstrapFeedback(sampleSize);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Hearing Calendar ────────────────────────────────────────────────────────

  /**
   * GET /hearings — list hearing events with optional date range, chamber, committee filters.
   */
  router.get("/hearings", async (req, res, next) => {
    try {
      const { from, to, chamber, committee } = req.query;
      const conditions = [];
      if (from) conditions.push(gte(hearingEvents.hearingDate, new Date(from as string)));
      if (to) conditions.push(lt(hearingEvents.hearingDate, new Date(to as string)));
      if (chamber) conditions.push(eq(hearingEvents.chamber, chamber as string));
      if (committee) conditions.push(ilike(hearingEvents.committee, `%${escapeLike(committee as string)}%`));

      const rows = await policyIntelDb
        .select()
        .from(hearingEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(hearingEvents.hearingDate);

      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /hearings/this-week — hearings in the current week.
   */
  router.get("/hearings/this-week", async (req, res, next) => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);

      const rows = await policyIntelDb
        .select()
        .from(hearingEvents)
        .where(and(
          gte(hearingEvents.hearingDate, monday),
          lt(hearingEvents.hearingDate, nextMonday),
        ))
        .orderBy(hearingEvents.hearingDate);

      res.json({ weekStart: monday.toISOString(), weekEnd: nextMonday.toISOString(), hearings: rows });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /hearings/:id — single hearing detail.
   */
  router.get("/hearings/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [row] = await policyIntelDb.select().from(hearingEvents).where(eq(hearingEvents.id, id));
      if (!row) return res.status(404).json({ message: "Hearing not found" });
      res.json(row);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /hearings/sync — parse hearing events from existing TLO source documents.
   */
  router.post("/hearings/sync", async (req, res, next) => {
    try {
      const docs = await policyIntelDb
        .select()
        .from(sourceDocuments)
        .where(
          or(
            sql`${sourceDocuments.rawPayload}->>'feedType' = 'upcomingmeetingshouse'`,
            sql`${sourceDocuments.rawPayload}->>'feedType' = 'upcomingmeetingssenate'`,
            sql`${sourceDocuments.rawPayload}->>'feedType' = 'upcomingmeetingsjoint'`,
          ),
        );

      let created = 0;
      let skipped = 0;

      for (const doc of docs) {
        const rp = (doc.rawPayload ?? {}) as Record<string, any>;
        const feedType = rp.feedType ?? "";
        const chamber = feedType.includes("house") ? "House" : feedType.includes("senate") ? "Senate" : "Joint";

        const titleMatch = doc.title?.match(/^(.+?)\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (!titleMatch) { skipped++; continue; }

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

        // Upsert by external id
        const extId = `tlo-hearing-${doc.id}`;
        const [existing] = await policyIntelDb
          .select({ id: hearingEvents.id })
          .from(hearingEvents)
          .where(eq(hearingEvents.externalId, extId));

        if (existing) { skipped++; continue; }

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
          externalId: extId,
        });
        created++;
      }

      res.json({ totalDocs: docs.length, created, skipped });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Committee Intelligence ───────────────────────────────────────────────

  router.get("/committee-intel/sessions", async (req, res, next) => {
    try {
      const workspaceId = req.query.workspaceId ? parseId(String(req.query.workspaceId)) : null;
      const hearingId = req.query.hearingId ? parseId(String(req.query.hearingId)) : null;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const from = typeof req.query.from === "string" ? req.query.from : undefined;

      const rows = await listCommitteeIntelSessions({
        workspaceId: workspaceId ?? undefined,
        hearingId: hearingId ?? undefined,
        status: status as any,
        from,
      });

      res.json(rows);
    } catch (err: any) {
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
        title: typeof req.body?.title === "string" ? req.body.title : undefined,
        focusTopics: Array.isArray(req.body?.focusTopics) ? req.body.focusTopics : undefined,
        interimCharges: Array.isArray(req.body?.interimCharges) ? req.body.interimCharges : undefined,
        clientContext: typeof req.body?.clientContext === "string" ? req.body.clientContext : undefined,
        monitoringNotes: typeof req.body?.monitoringNotes === "string" ? req.body.monitoringNotes : undefined,
        videoUrl: typeof req.body?.videoUrl === "string" ? req.body.videoUrl : undefined,
        agendaUrl: typeof req.body?.agendaUrl === "string" ? req.body.agendaUrl : undefined,
        transcriptSourceType: typeof req.body?.transcriptSourceType === "string" ? req.body.transcriptSourceType : undefined,
        transcriptSourceUrl: typeof req.body?.transcriptSourceUrl === "string" ? req.body.transcriptSourceUrl : undefined,
        autoIngestEnabled: typeof req.body?.autoIngestEnabled === "boolean" ? req.body.autoIngestEnabled : undefined,
        autoIngestIntervalSeconds: typeof req.body?.autoIngestIntervalSeconds === "number" ? req.body.autoIngestIntervalSeconds : undefined,
        status: typeof req.body?.status === "string" ? req.body.status : undefined,
      });

      res.status(201).json(detail);
    } catch (err: any) {
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
    } catch (err: any) {
      next(err);
    }
  });

  router.patch("/committee-intel/sessions/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const detail = await updateCommitteeIntelSession(id, {
        title: typeof req.body?.title === "string" ? req.body.title : undefined,
        focusTopics: Array.isArray(req.body?.focusTopics) ? req.body.focusTopics : undefined,
        interimCharges: Array.isArray(req.body?.interimCharges) ? req.body.interimCharges : undefined,
        clientContext: typeof req.body?.clientContext === "string" || req.body?.clientContext === null ? req.body.clientContext : undefined,
        monitoringNotes: typeof req.body?.monitoringNotes === "string" || req.body?.monitoringNotes === null ? req.body.monitoringNotes : undefined,
        liveSummary: typeof req.body?.liveSummary === "string" || req.body?.liveSummary === null ? req.body.liveSummary : undefined,
        agendaUrl: typeof req.body?.agendaUrl === "string" || req.body?.agendaUrl === null ? req.body.agendaUrl : undefined,
        videoUrl: typeof req.body?.videoUrl === "string" || req.body?.videoUrl === null ? req.body.videoUrl : undefined,
        transcriptSourceType: typeof req.body?.transcriptSourceType === "string" ? req.body.transcriptSourceType : undefined,
        transcriptSourceUrl: typeof req.body?.transcriptSourceUrl === "string" || req.body?.transcriptSourceUrl === null ? req.body.transcriptSourceUrl : undefined,
        autoIngestEnabled: typeof req.body?.autoIngestEnabled === "boolean" ? req.body.autoIngestEnabled : undefined,
        autoIngestIntervalSeconds: typeof req.body?.autoIngestIntervalSeconds === "number" ? req.body.autoIngestIntervalSeconds : undefined,
        status: typeof req.body?.status === "string" ? req.body.status : undefined,
      });

      res.json(detail);
    } catch (err: any) {
      next(err);
    }
  });

  router.delete("/committee-intel/sessions/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const result = await deleteCommitteeIntelSession(id);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/committee-intel/sessions/:id/reset", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const result = await resetCommitteeIntelSession(id);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/committee-intel/sessions/:id/rebuild", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const result = await rebuildCommitteeIntelSession(id);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/committee-intel/sessions/:id/segments", validateBody(addSegmentSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const detail = await addCommitteeIntelSegment(id, {
        capturedAt: typeof req.body?.capturedAt === "string" ? req.body.capturedAt : undefined,
        startedAtSecond: typeof req.body?.startedAtSecond === "number" ? req.body.startedAtSecond : null,
        endedAtSecond: typeof req.body?.endedAtSecond === "number" ? req.body.endedAtSecond : null,
        speakerName: typeof req.body?.speakerName === "string" ? req.body.speakerName : undefined,
        speakerRole: typeof req.body?.speakerRole === "string" ? req.body.speakerRole : undefined,
        affiliation: typeof req.body?.affiliation === "string" ? req.body.affiliation : undefined,
        transcriptText: req.body.transcriptText,
        invited: typeof req.body?.invited === "boolean" ? req.body.invited : undefined,
        metadata: req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : undefined,
      });

      res.status(201).json(detail);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/committee-intel/sessions/:id/analyze", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const detail = await refreshCommitteeIntelSession(id);
      res.json(detail);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/committee-intel/sessions/:id/sync-feed", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const result = await syncCommitteeIntelTranscriptFeed(id);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/committee-intel/sessions/:id/focused-brief", validateBody(focusedBriefSchema), async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const brief = await generateCommitteeIntelFocusedBrief(id, req.body.issue);
      res.json(brief);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/committee-intel/sessions/:id/post-hearing-recap", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });

      const recap = await generateCommitteeIntelPostHearingRecap(id);
      res.json(recap);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Committee Members ──────────────────────────────────────────────────────

  /**
   * POST /committee-members/import — import committee memberships from OpenStates GraphQL API.
   */
  router.post("/committee-members/import", async (req, res, next) => {
    try {
      const apiKey = process.env.OPENSTATES_API_KEY || "";
      if (!apiKey) return res.status(400).json({ message: "OPENSTATES_API_KEY not configured" });

      const graphqlUrl = "https://openstates.org/graphql";
      const houseOrgId = "ocd-organization/d6189dbb-417e-429e-ae4b-2ee6747eddc0";
      const senateOrgId = "ocd-organization/cabf1716-c572-406a-bfdd-1917c11ac629";

      const fetchMembers = async (orgId: string, chamber: string) => {
        const allEdges: any[] = [];
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
          const afterClause = cursor ? `, after: "${cursor}"` : "";
          const query = `{ people(memberOf: "${orgId}", first: 100${afterClause}) { edges { node { name familyName currentMemberships { organization { name classification } role } } } pageInfo { hasNextPage endCursor } } }`;

          const resp = await fetch(graphqlUrl, {
            method: "POST",
            headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          const json = (await resp.json()) as any;
          const edges = json?.data?.people?.edges ?? [];
          allEdges.push(...edges);
          hasMore = json?.data?.people?.pageInfo?.hasNextPage ?? false;
          cursor = json?.data?.people?.pageInfo?.endCursor ?? null;
        }
        return allEdges.map((e: any) => ({
          name: e.node.name as string,
          familyName: (e.node.familyName || "") as string,
          chamber,
          committees: (e.node.currentMemberships ?? [])
            .filter((m: any) => m.organization.classification === "committee")
            .map((m: any) => ({
              name: m.organization.name as string,
              role: (m.role || "member") as string,
            })),
        }));
      };

      log.info("importing committee memberships from OpenStates GraphQL");
      const [houseMembers, senateMembers] = await Promise.all([
        fetchMembers(houseOrgId, "House"),
        fetchMembers(senateOrgId, "Senate"),
      ]);
      const allMembers = [...houseMembers, ...senateMembers];
      log.info({ total: allMembers.length, house: houseMembers.length, senate: senateMembers.length }, "fetched legislators from OpenStates");

      // Load existing stakeholders
      const existingStakeholders = await policyIntelDb
        .select({ id: stakeholders.id, name: stakeholders.name, chamber: stakeholders.chamber })
        .from(stakeholders)
        .where(eq(stakeholders.type, "legislator"));

      // Build name -> stakeholder lookup (normalize: lowercase, trim, strip accents)
      const normalize = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const nameMap = new Map<string, { id: number; chamber: string | null }>();
      const familyMap = new Map<string, { id: number; chamber: string | null }>();
      for (const s of existingStakeholders) {
        nameMap.set(normalize(s.name), { id: s.id, chamber: s.chamber });
        // Also index by last name for fuzzy matching
        const parts = s.name.split(/\s+/);
        if (parts.length > 1) {
          familyMap.set(normalize(parts[parts.length - 1]), { id: s.id, chamber: s.chamber });
        }
      }

      // Delete existing committee memberships to replace
      await policyIntelDb.delete(committeeMembers);

      let matched = 0;
      let unmatched = 0;
      let inserted = 0;
      const unmatchedNames: string[] = [];

      for (const member of allMembers) {
        const normName = normalize(member.name);
        let stakeholder = nameMap.get(normName);
        // Fallback: match by family name if exact doesn't work
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
          const dbRole = roleStr.includes("chair") && !roleStr.includes("vice")
            ? "chair" as const
            : roleStr.includes("vice")
              ? "vice_chair" as const
              : "member" as const;

          await policyIntelDb.insert(committeeMembers).values({
            stakeholderId: stakeholder.id,
            committeeName: comm.name,
            chamber: member.chamber,
            role: dbRole,
          });
          inserted++;
        }
      }

      log.info({ matched, unmatched, inserted }, "committee import complete");

      res.json({
        success: true,
        matched,
        unmatched,
        inserted,
        unmatchedNames: unmatchedNames.slice(0, 20),
        totalFetched: allMembers.length,
      });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /committee-members — list all committee assignments, optionally filtered.
   */
  router.get("/committee-members", async (req, res, next) => {
    try {
      const { stakeholderId, committee, chamber } = req.query;
      const conditions = [];
      if (stakeholderId) conditions.push(eq(committeeMembers.stakeholderId, Number(stakeholderId)));
      if (committee) conditions.push(ilike(committeeMembers.committeeName, `%${escapeLike(committee as string)}%`));
      if (chamber) conditions.push(eq(committeeMembers.chamber, chamber as string));

      const rows = await policyIntelDb
        .select({
          id: committeeMembers.id,
          stakeholderId: committeeMembers.stakeholderId,
          committeeName: committeeMembers.committeeName,
          chamber: committeeMembers.chamber,
          role: committeeMembers.role,
          sessionId: committeeMembers.sessionId,
          stakeholderName: stakeholders.name,
          stakeholderParty: stakeholders.party,
          stakeholderDistrict: stakeholders.district,
        })
        .from(committeeMembers)
        .leftJoin(stakeholders, eq(committeeMembers.stakeholderId, stakeholders.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(committeeMembers.committeeName, committeeMembers.role);

      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Meeting Notes ──────────────────────────────────────────────────────────

  /**
   * GET /stakeholders/:id/meeting-notes — notes for a stakeholder.
   */
  router.get("/stakeholders/:id/meeting-notes", async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const rows = await policyIntelDb
        .select()
        .from(meetingNotes)
        .where(eq(meetingNotes.stakeholderId, stakeholderId))
        .orderBy(desc(meetingNotes.createdAt));
      res.json(rows);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /stakeholders/:id/meeting-notes — add a meeting note.
   */
  router.post("/stakeholders/:id/meeting-notes", validateBody(createMeetingNoteSchema), async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const { noteText, meetingDate, contactMethod, matterId } = req.body;

      const [row] = await policyIntelDb
        .insert(meetingNotes)
        .values({
          stakeholderId,
          matterId: matterId ? Number(matterId) : null,
          noteText: noteText.trim(),
          meetingDate: meetingDate ? new Date(meetingDate) : null,
          contactMethod: contactMethod ?? null,
        })
        .returning();

      res.status(201).json(row);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Enhanced stakeholder detail ────────────────────────────────────────────

  /**
   * GET /stakeholders/:id/full — stakeholder with committee memberships, meeting notes, and observations.
   */
  router.get("/stakeholders/:id/full", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const [stakeholder] = await policyIntelDb.select().from(stakeholders).where(eq(stakeholders.id, id));
      if (!stakeholder) return res.status(404).json({ message: "Stakeholder not found" });

      const observations = await policyIntelDb
        .select()
        .from(stakeholderObservations)
        .where(eq(stakeholderObservations.stakeholderId, id))
        .orderBy(desc(stakeholderObservations.createdAt));

      const committees = await policyIntelDb
        .select()
        .from(committeeMembers)
        .where(eq(committeeMembers.stakeholderId, id));

      const notes = await policyIntelDb
        .select()
        .from(meetingNotes)
        .where(eq(meetingNotes.stakeholderId, id))
        .orderBy(desc(meetingNotes.createdAt));

      res.json({ ...stakeholder, observations, committees, meetingNotes: notes });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Texas legislator import ───────────────────────────────────────────────

  /**
   * POST /stakeholders/import-legislators — import legislator directory from LegiScan API.
   * Body: { workspaceId: number }
   */
  router.post("/stakeholders/import-legislators", validateBody(importLegislatorsSchema), async (req, res, next) => {
    try {
      const workspaceId = req.body.workspaceId;

      const apiKey = process.env.LEGISCAN_API_KEY;
      if (!apiKey) return res.status(500).json({ message: "LEGISCAN_API_KEY not configured" });

      // Fetch current session legislators from LegiScan
      // First get the session list to find the current Texas session
      const sessionListResp = await fetch(
        `https://api.legiscan.com/?key=${encodeURIComponent(apiKey)}&op=getSessionList&state=TX`,
      );
      const sessionListData = await sessionListResp.json() as Record<string, unknown>;
      const sessions = (sessionListData as any)?.sessions;
      if (!sessions || !Array.isArray(sessions)) {
        return res.status(502).json({ message: "Failed to fetch LegiScan sessions" });
      }

      // Get the most recent session
      const currentSession = sessions.sort((a: any, b: any) => b.session_id - a.session_id)[0];
      const sessionId = currentSession?.session_id;
      if (!sessionId) return res.status(502).json({ message: "No Texas session found" });

      // Fetch session people
      const peopleResp = await fetch(
        `https://api.legiscan.com/?key=${encodeURIComponent(apiKey)}&op=getSessionPeople&id=${sessionId}`,
      );
      const peopleData = await peopleResp.json() as Record<string, unknown>;
      const people = (peopleData as any)?.sessionpeople?.people;
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

        // Upsert by (workspaceId, name, type)
        const [existingRow] = await policyIntelDb
          .select({ id: stakeholders.id })
          .from(stakeholders)
          .where(and(
            eq(stakeholders.workspaceId, workspaceId),
            eq(stakeholders.name, name),
            eq(stakeholders.type, "legislator"),
          ));

        if (existingRow) {
          // Update structured fields on existing legislators
          await policyIntelDb.update(stakeholders).set({
            legiscanPeopleId: person.people_id ?? null,
            party: party || null,
            chamber: chamber || null,
            district: district ? String(district) : null,
            updatedAt: new Date(),
          }).where(eq(stakeholders.id, existingRow.id));
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
          district: district ? String(district) : null,
        });
        created++;
      }

      res.json({ sessionId, sessionName: currentSession.session_name, totalPeople: people.length, created, existing });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Slack notification test ───────────────────────────────────────────────

  /**
   * POST /notifications/test-slack — send a test notification to verify Slack webhook.
   */
  router.post("/notifications/test-slack", async (_req, res, next) => {
    try {
      const sent = await notifySlack(
        "Policy Intel test notification",
        "This is a test message from Policy Intel. If you see this, Slack notifications are configured correctly.",
      );
      res.json({ sent, message: sent ? "Test notification sent" : "SLACK_WEBHOOK_URL not configured" });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Client Deliverables ────────────────────────────────────────────────────

  /**
   * POST /deliverables/generate-client-alert — generate a client alert from an issue room.
   */
  router.post("/deliverables/generate-client-alert", validateBody(generateClientAlertSchema), async (req, res, next) => {
    try {
      const { issueRoomId, workspaceId, matterId, recipientName, firmName } = req.body;
      const result = await generateClientAlert({
        issueRoomId: Number(issueRoomId),
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : undefined,
        recipientName,
        firmName,
      });
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /deliverables/generate-weekly-report — generate a weekly client report from digest data.
   */
  router.post("/deliverables/generate-weekly-report", validateBody(generateWeeklyReportSchema), async (req, res, next) => {
    try {
      const { workspaceId, matterId, week, recipientName, firmName } = req.body;
      const result = await generateWeeklyReport({
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : undefined,
        week,
        recipientName,
        firmName,
      });
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /deliverables/generate-hearing-memo — generate a hearing memo for a committee session.
   */
  router.post("/deliverables/generate-hearing-memo", validateBody(generateHearingMemoSchema), async (req, res, next) => {
    try {
      const { hearingId, workspaceId, matterId, recipientName, firmName } = req.body;
      const result = await generateHearingMemo({
        hearingId: Number(hearingId),
        workspaceId: Number(workspaceId),
        matterId: matterId ? Number(matterId) : undefined,
        recipientName,
        firmName,
      });
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Intelligence Engine ──────────────────────────────────────────────────────

  /**
   * GET /intelligence/briefing — full swarm analysis (all 5 analyzers + cross-reference).
   * This is the flagship intelligence endpoint.
   */
  router.get("/intelligence/briefing", async (_req, res, next) => {
    try {
      const briefing = await runSwarm();
      res.json(briefing);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/velocity — topic momentum vectors only.
   */
  router.get("/intelligence/velocity", async (_req, res, next) => {
    try {
      const report = await analyzeVelocity();
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/correlations — bill cluster analysis only.
   */
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
        Math.max(1, Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1),
      );
      const start = (page - 1) * pageSize;

      res.json({
        ...report,
        clusters: report.clusters.slice(start, start + pageSize),
        isolatedBills: includeIsolated ? report.isolatedBills : [],
        isolatedBillCount: report.isolatedBills.length,
        pagination: {
          page,
          pageSize,
          totalClusters,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/influence — stakeholder power rankings only.
   */
  router.get("/intelligence/influence", async (_req, res, next) => {
    try {
      const report = await analyzeInfluence();
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/risk — bill passage probability assessments only.
   */
  router.get("/intelligence/risk", async (_req, res, next) => {
    try {
      const report = await analyzeRisk();
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/anomalies — anomaly detections only.
   */
  router.get("/intelligence/anomalies", async (_req, res, next) => {
    try {
      const report = await detectAnomalies();
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/forecast/outcomes — latest outcome-truth snapshot summary.
   */
  router.get("/intelligence/forecast/outcomes", async (_req, res, next) => {
    try {
      const summary = await getLatestOutcomeTruthSnapshotSummary();
      res.json(summary);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /intelligence/forecast/outcomes/refresh — rebuild outcome-truth snapshot from bill source documents.
   */
  router.post("/intelligence/forecast/outcomes/refresh", async (req, res, next) => {
    try {
      const snapshotKey = typeof req.body?.snapshotKey === "string" ? req.body.snapshotKey : undefined;
      const result = await refreshOutcomeTruthSnapshot(snapshotKey);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/forecast/drift — learning-metric trend summary for calibration drift monitoring.
   */
  router.get("/intelligence/forecast/drift", async (req, res, next) => {
    try {
      const limit = Number.isFinite(Number(req.query.limit)) ? Number(req.query.limit) : undefined;
      const summary = await getForecastDriftSummary(limit);
      res.json(summary);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/forecast — forecast accuracy, model drift, and delta briefing.
   */
  router.get("/intelligence/forecast", async (_req, res, next) => {
    try {
      // Need risk data to build predictions for the forecast
      const riskReport = await analyzeRisk();
      const anomalyReport = await detectAnomalies();
      const predictions = riskReport.assessments.map((ra: any) => ({
        billId: ra.billId,
        predictedStage: ra.stage,
        predictedPassageProbability: ra.passageProbability,
        predictedRiskLevel: ra.riskLevel,
        riskScore: ra.riskScore,
      }));
      const report = await analyzeForecast(
        predictions,
        riskReport.regime,
        0,
        riskReport.criticalRisks.length,
        anomalyReport.anomalies.length,
        0,
      );
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/sponsors — sponsor network analysis and coalition power mapping.
   */
  router.get("/intelligence/sponsors", async (_req, res, next) => {
    try {
      const report = await analyzeSponsorNetwork();
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/historical — historical pattern analysis across 23 sessions.
   */
  router.get("/intelligence/historical", async (_req, res, next) => {
    try {
      const report = await analyzeHistoricalPatterns();
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/legislators — AI-generated legislator intelligence profiles.
   */
  router.get("/intelligence/legislators", async (_req, res, next) => {
    try {
      const report = await analyzeLegislatorProfiles();
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/influence-map — bill influence maps showing who can change outcomes.
   */
  router.get("/intelligence/influence-map", async (_req, res, next) => {
    try {
      const report = await analyzeInfluenceMaps();
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/power-network — Political power structure: Big Three, voting blocs, leadership chains.
   */
  router.get("/intelligence/power-network", async (_req, res, next) => {
    try {
      const { analyzeNetworkPower } = await import("./engine/intelligence/power-network-analyzer");
      const force = _req.query.force === "true";
      const report = await analyzeNetworkPower(force);
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /intelligence/predictions — Legislation predictions: what bills will emerge, who files them, Big Three dynamics.
   */
  router.get("/intelligence/predictions", async (_req, res, next) => {
    try {
      const { predictLegislation } = await import("./engine/intelligence/legislation-predictor");
      const force = _req.query.force === "true";
      const report = await predictLegislation(force);
      res.json(report);
    } catch (err: any) {
      next(err);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PREMIUM ROUTES — Bill Passage Predictions, Client Reporting,
  //                   Relationship Intelligence, Session Lifecycle,
  //                   Client Profiles & Actions
  // ══════════════════════════════════════════════════════════════════════════

  // ── Bill Passage Predictions ──────────────────────────────────────────────

  /**
   * GET /premium/predictions/dashboard?workspaceId=N — Prediction dashboard overview
   */
  router.get("/premium/predictions/dashboard", async (req, res, next) => {
    try {
      const { getPredictionDashboard } = await import("./services/passage-predictor-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const dashboard = await getPredictionDashboard(workspaceId);
      res.json(dashboard);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/predictions/predict — Predict passage probability for a bill
   * Body: { workspaceId, billId, billTitle?, forceRefresh? }
   */
  router.post("/premium/predictions/predict", async (req, res, next) => {
    try {
      const { predictBillPassage } = await import("./services/passage-predictor-service");
      const { workspaceId, billId, billTitle, forceRefresh } = req.body;
      if (!workspaceId || !billId) {
        return res.status(400).json({ error: "workspaceId and billId required" });
      }
      const result = await predictBillPassage({ workspaceId, billId, billTitle, forceRefresh });
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/predictions/batch — Batch predict passage for multiple bills
   * Body: { workspaceId, billIds: string[] }
   */
  router.post("/premium/predictions/batch", async (req, res, next) => {
    try {
      const { predictBillPassageBatch } = await import("./services/passage-predictor-service");
      const { workspaceId, billIds } = req.body;
      if (!workspaceId || !Array.isArray(billIds)) {
        return res.status(400).json({ error: "workspaceId and billIds[] required" });
      }
      const results = await predictBillPassageBatch({ workspaceId, billIds });
      res.json({ data: results, total: results.length });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/predictions/auto-discover — Auto-discover bills from alerts and predict passage
   * Body: { workspaceId }
   */
  router.post("/premium/predictions/auto-discover", async (req, res, next) => {
    try {
      const { autoDiscoverAndPredict } = await import("./services/passage-predictor-service");
      const { workspaceId } = req.body;
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const result = await autoDiscoverAndPredict(workspaceId);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Client Profiles ───────────────────────────────────────────────────────

  /**
   * GET /premium/clients?workspaceId=N — List client profiles
   */
  router.get("/premium/clients", async (req, res, next) => {
    try {
      const { listClientProfiles } = await import("./services/client-reporting-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const clients = await listClientProfiles(workspaceId);
      res.json({ data: clients, total: clients.length });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /premium/clients/:id — Get client profile
   */
  router.get("/premium/clients/:id", async (req, res, next) => {
    try {
      const { getClientProfile } = await import("./services/client-reporting-service");
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid client id" });
      const profile = await getClientProfile(id);
      if (!profile) return res.status(404).json({ error: "Client profile not found" });
      res.json(profile);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/clients — Create client profile
   */
  router.post("/premium/clients", async (req, res, next) => {
    try {
      const { createClientProfile } = await import("./services/client-reporting-service");
      const profile = await createClientProfile(req.body);
      res.status(201).json(profile);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * PATCH /premium/clients/:id — Update client profile
   */
  router.patch("/premium/clients/:id", async (req, res, next) => {
    try {
      const { updateClientProfile } = await import("./services/client-reporting-service");
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid client id" });
      const profile = await updateClientProfile(id, req.body);
      res.json(profile);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Client Reports & Templates ────────────────────────────────────────────

  /**
   * GET /premium/templates?workspaceId=N&type=X — List report templates
   */
  router.get("/premium/templates", async (req, res, next) => {
    try {
      const { listReportTemplates } = await import("./services/client-reporting-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const templates = await listReportTemplates(workspaceId, req.query.type as string);
      res.json({ data: templates, total: templates.length });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/templates — Create report template
   */
  router.post("/premium/templates", async (req, res, next) => {
    try {
      const { createReportTemplate } = await import("./services/client-reporting-service");
      const template = await createReportTemplate(req.body);
      res.status(201).json(template);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * PATCH /premium/templates/:id — Update report template
   */
  router.patch("/premium/templates/:id", async (req, res, next) => {
    try {
      const { updateReportTemplate } = await import("./services/client-reporting-service");
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid template id" });
      const template = await updateReportTemplate(id, req.body);
      res.json(template);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * DELETE /premium/templates/:id — Delete report template
   */
  router.delete("/premium/templates/:id", async (req, res, next) => {
    try {
      const { deleteReportTemplate } = await import("./services/client-reporting-service");
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid template id" });
      await deleteReportTemplate(id);
      res.status(204).end();
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/reports/executive — Generate executive intelligence report
   * Body: { workspaceId, clientProfileId?, period: "daily"|"weekly"|"monthly", includePredictions?, includeStakeholderIntel? }
   */
  router.post("/premium/reports/executive", async (req, res, next) => {
    try {
      const { generateExecutiveReport } = await import("./services/client-reporting-service");
      const report = await generateExecutiveReport(req.body);
      res.status(201).json(report);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Relationship Intelligence ─────────────────────────────────────────────

  /**
   * GET /premium/relationships/network?workspaceId=N — Get the influence network graph
   */
  router.get("/premium/relationships/network", async (req, res, next) => {
    try {
      const { buildNetworkGraph } = await import("./services/relationship-intelligence-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const focusStakeholderId = req.query.focusStakeholderId
        ? parseId(req.query.focusStakeholderId as string)
        : undefined;
      const minStrength = req.query.minStrength
        ? parseFloat(req.query.minStrength as string)
        : undefined;
      const relationshipTypes = req.query.types
        ? (req.query.types as string).split(",")
        : undefined;

      const graph = await buildNetworkGraph(workspaceId, {
        focusStakeholderId: focusStakeholderId ?? undefined,
        relationshipTypes,
        minStrength,
      });
      res.json(graph);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /premium/relationships/dossier/:stakeholderId?workspaceId=N — Stakeholder dossier
   */
  router.get("/premium/relationships/dossier/:stakeholderId", async (req, res, next) => {
    try {
      const { getStakeholderDossier } = await import("./services/relationship-intelligence-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      const stakeholderId = parseId(req.params.stakeholderId);
      if (!workspaceId || !stakeholderId) {
        return res.status(400).json({ error: "workspaceId and stakeholderId required" });
      }
      const dossier = await getStakeholderDossier(workspaceId, stakeholderId);
      res.json(dossier);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/relationships — Create a relationship between stakeholders
   */
  router.post("/premium/relationships", async (req, res, next) => {
    try {
      const { createRelationship } = await import("./services/relationship-intelligence-service");
      const rel = await createRelationship(req.body);
      res.status(201).json(rel);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /premium/relationships?workspaceId=N&stakeholderId=N — List relationships
   */
  router.get("/premium/relationships", async (req, res, next) => {
    try {
      const { listRelationships } = await import("./services/relationship-intelligence-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const stakeholderId = req.query.stakeholderId
        ? parseId(req.query.stakeholderId as string)
        : undefined;
      const rels = await listRelationships(workspaceId, stakeholderId ?? undefined);
      res.json({ data: rels, total: rels.length });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/relationships/auto-discover — Auto-discover relationships from existing data
   * Body: { workspaceId }
   */
  router.post("/premium/relationships/auto-discover", async (req, res, next) => {
    try {
      const { autoDiscoverRelationships } = await import("./services/relationship-intelligence-service");
      const { workspaceId } = req.body;
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const result = await autoDiscoverRelationships(workspaceId);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /premium/market/dashboard?workspaceId=N — Aggregated market screen payload
   */
  router.get("/premium/market/dashboard", async (req, res, next) => {
    try {
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

      const weekParam = req.query.week as string | undefined;
      const committeeFrom = req.query.from as string | undefined;
      const committeeLimit = Math.min(24, Math.max(1, Number(req.query.committeeLimit) || 12));
      const issueRoomLimit = Math.min(24, Math.max(1, Number(req.query.issueRoomLimit) || 12));
      const minRelationshipStrength = req.query.minRelationshipStrength
        ? Number(req.query.minRelationshipStrength)
        : 0.35;

      const [
        { getPredictionDashboard },
        { buildNetworkGraph },
        { getSessionDashboard },
      ] = await Promise.all([
        import("./services/passage-predictor-service"),
        import("./services/relationship-intelligence-service"),
        import("./services/session-lifecycle-service"),
      ]);

      const [
        predictions,
        sessionDashboard,
        relationshipNetwork,
        digest,
        committeeSessions,
        roomRows,
      ] = await Promise.all([
        getPredictionDashboard(workspaceId),
        getSessionDashboard(workspaceId),
        buildNetworkGraph(workspaceId, { minStrength: minRelationshipStrength }),
        buildWorkspaceDigestPayload(workspaceId, weekParam),
        listCommitteeIntelSessions({ workspaceId, from: committeeFrom }),
        policyIntelDb
          .select()
          .from(issueRooms)
          .where(eq(issueRooms.workspaceId, workspaceId))
          .orderBy(desc(issueRooms.updatedAt), desc(issueRooms.id))
          .limit(issueRoomLimit),
      ]);

      res.json({
        workspaceId,
        generatedAt: new Date().toISOString(),
        summary: {
          trackedBills: predictions.totalTracked,
          committeeSessions: committeeSessions.length,
          issueRooms: roomRows.length,
          networkNodes: relationshipNetwork.stats.totalNodes,
          networkEdges: relationshipNetwork.stats.totalEdges,
          pendingReviewAlerts: digest.summary.pendingReview,
          pendingClientActions: sessionDashboard?.stats.pendingActions ?? 0,
        },
        predictions,
        session: sessionDashboard
          ? sessionDashboard
          : { message: "No active session. Initialize a session first.", session: null },
        relationships: relationshipNetwork,
        digest,
        committeeSessions: committeeSessions.slice(0, committeeLimit),
        issueRooms: roomRows,
      });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Session Lifecycle Management ──────────────────────────────────────────

  /**
   * GET /premium/session/dashboard?workspaceId=N — Session lifecycle dashboard
   */
  router.get("/premium/session/dashboard", async (req, res, next) => {
    try {
      const { getSessionDashboard } = await import("./services/session-lifecycle-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const dashboard = await getSessionDashboard(workspaceId);
      if (!dashboard) {
        return res.json({ message: "No active session. Initialize a session first.", session: null });
      }
      res.json(dashboard);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/session/initialize — Initialize a Texas legislative session with standard milestones
   * Body: { workspaceId, sessionNumber? }
   */
  router.post("/premium/session/initialize", async (req, res, next) => {
    try {
      const { initializeTexasSession } = await import("./services/session-lifecycle-service");
      const { workspaceId, sessionNumber } = req.body;
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const result = await initializeTexasSession(workspaceId, sessionNumber);
      res.status(201).json(result);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /premium/session/sessions?workspaceId=N — List all sessions
   */
  router.get("/premium/session/sessions", async (req, res, next) => {
    try {
      const { listSessions } = await import("./services/session-lifecycle-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const sessions = await listSessions(workspaceId);
      res.json({ data: sessions, total: sessions.length });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/session/transition — Execute a phase transition with auto-generated tasks and milestones
   * Body: { workspaceId, toPhase }
   */
  router.post("/premium/session/transition", async (req, res, next) => {
    try {
      const { executePhaseTransition } = await import("./services/session-lifecycle-service");
      const { workspaceId, toPhase } = req.body;
      if (!workspaceId || !toPhase) {
        return res.status(400).json({ error: "workspaceId and toPhase required" });
      }
      const result = await executePhaseTransition(workspaceId, toPhase);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /premium/session/transition/plan?workspaceId=N&toPhase=X — Preview a phase transition plan
   */
  router.get("/premium/session/transition/plan", async (req, res, next) => {
    try {
      const { generatePhaseTransitionPlan } = await import("./services/session-lifecycle-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      const toPhase = req.query.toPhase as string;
      if (!workspaceId || !toPhase) {
        return res.status(400).json({ error: "workspaceId and toPhase required" });
      }
      const plan = await generatePhaseTransitionPlan(workspaceId, toPhase);
      res.json(plan);
    } catch (err: any) {
      next(err);
    }
  });

  // ── Client Actions ────────────────────────────────────────────────────────

  /**
   * GET /premium/actions?workspaceId=N&status=X&assignee=X — List client actions
   */
  router.get("/premium/actions", async (req, res, next) => {
    try {
      const { listClientActions } = await import("./services/session-lifecycle-service");
      const workspaceId = parseId(req.query.workspaceId as string);
      if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
      const actions = await listClientActions(workspaceId, {
        status: req.query.status as string,
        matterId: req.query.matterId ? parseId(req.query.matterId as string) ?? undefined : undefined,
        assignee: req.query.assignee as string,
      });
      res.json({ data: actions, total: actions.length });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * POST /premium/actions — Create a client action
   */
  router.post("/premium/actions", async (req, res, next) => {
    try {
      const { createClientAction } = await import("./services/session-lifecycle-service");
      const action = await createClientAction(req.body);
      res.status(201).json(action);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * PATCH /premium/actions/:id — Update a client action
   */
  router.patch("/premium/actions/:id", async (req, res, next) => {
    try {
      const { updateClientAction } = await import("./services/session-lifecycle-service");
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid action id" });
      const action = await updateClientAction(id, req.body);
      res.json(action);
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * GET /premium/session/milestones?sessionId=N — List milestones for a session
   */
  router.get("/premium/session/milestones", async (req, res, next) => {
    try {
      const { listMilestones } = await import("./services/session-lifecycle-service");
      const sessionId = parseId(req.query.sessionId as string);
      if (!sessionId) return res.status(400).json({ error: "sessionId required" });
      const phase = req.query.phase as string | undefined;
      const milestones = await listMilestones(sessionId, phase);
      res.json({ data: milestones, total: milestones.length });
    } catch (err: any) {
      next(err);
    }
  });

  /**
   * PATCH /premium/session/milestones/:id — Update milestone status
   */
  router.patch("/premium/session/milestones/:id", async (req, res, next) => {
    try {
      const { updateMilestoneStatus } = await import("./services/session-lifecycle-service");
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid milestone id" });
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "status required" });
      const milestone = await updateMilestoneStatus(id, status);
      res.json(milestone);
    } catch (err: any) {
      next(err);
    }
  });

  return router;
}
