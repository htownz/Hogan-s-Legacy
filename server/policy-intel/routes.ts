import { Router } from "express";
import { and, count, desc, eq, gt, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { policyIntelDb } from "./db";
import { activities, alerts, briefs, deliverables, issueRoomSourceDocuments, issueRoomStrategyOptions, issueRoomTasks, issueRoomUpdates, issueRooms, matters, matterWatchlists, monitoringJobs, sourceDocuments, stakeholders, stakeholderObservations, watchlists, workspaces, hearingEvents, committeeMembers, meetingNotes } from "@shared/schema-policy-intel";
import { seedGraceMcEwan } from "./seed/grace-mcewan";
import { runTloRssJob } from "./jobs/run-tlo-rss";
import { runLegiscanJob } from "./jobs/run-legiscan";
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
import { generateClientAlert, generateWeeklyReport, generateHearingMemo } from "./services/deliverable-service";
import { runSwarm } from "./engine/intelligence/swarm-coordinator";
import { analyzeVelocity } from "./engine/intelligence/velocity-analyzer";
import { analyzeCorrelations } from "./engine/intelligence/cross-correlator";
import { analyzeInfluence } from "./engine/intelligence/influence-ranker";
import { analyzeRisk } from "./engine/intelligence/risk-model";
import { detectAnomalies } from "./engine/intelligence/anomaly-detector";
import { analyzeForecast } from "./engine/intelligence/forecast-tracker";
import { analyzeSponsorNetwork } from "./engine/intelligence/sponsor-network";

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
        "/api/intel/intelligence/sponsors"
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
        scoreDistribution: scoreDistRaw.rows ?? scoreDistRaw,
        sourceTypeBreakdown: sourceBreakdownRaw.rows ?? sourceBreakdownRaw,
        dailyAlertVolume: dailyVolumeRaw.rows ?? dailyVolumeRaw,
      });
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/workspaces", async (req, res, next) => {
    try {
      const { slug, name } = req.body ?? {};
      if (!slug || !name) {
        return res.status(400).json({ message: "slug and name are required" });
      }

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

  router.post("/watchlists", async (req, res, next) => {
    try {
      const { workspaceId, name, topic, description, rulesJson } = req.body ?? {};
      if (!workspaceId || !name) {
        return res.status(400).json({ message: "workspaceId and name are required" });
      }

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
  router.patch("/watchlists/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { name, topic, description, rulesJson, isActive } = req.body ?? {};

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (topic !== undefined) updates.topic = topic;
      if (description !== undefined) updates.description = description;
      if (rulesJson !== undefined) updates.rulesJson = rulesJson;
      if (isActive !== undefined) updates.isActive = Boolean(isActive);
      updates.updatedAt = new Date();

      if (Object.keys(updates).length <= 1) {
        return res.status(400).json({ message: "Provide at least one field to update" });
      }

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
        tagsJson,
      } = req.body ?? {};

      if (!sourceType || !publisher || !sourceUrl || !title) {
        return res.status(400).json({
          message: "sourceType, publisher, sourceUrl, and title are required",
        });
      }

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
      res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err: any) {
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
        metadataJson,
      } = req.body ?? {};

      if (!workspaceId || !watchlistId || !sourceDocumentId || !title) {
        return res.status(400).json({
          message: "workspaceId, watchlistId, sourceDocumentId, and title are required",
        });
      }

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

  router.patch("/alerts/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { status, reviewerNote } = req.body ?? {};

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

      if (Object.keys(updates).length <= 1) {
        return res.status(400).json({ message: "Provide status and/or reviewerNote" });
      }

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
          console.error("[champion] feedback recording failed:", feedbackErr);
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
  router.post("/alerts/bulk-triage", async (req, res, next) => {
    try {
      const suppressBelow = Math.max(0, Math.min(100, Number(req.body?.suppressBelow) || 20));
      const promoteAbove = Math.max(0, Math.min(100, Number(req.body?.promoteAbove) || 70));
      const dryRun = Boolean(req.body?.dryRun);

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

      if (dryRun) {
        return res.json({ dryRun: true, wouldSuppress: toSuppress, wouldPromote: toPromote, suppressBelow, promoteAbove });
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

      res.json({ ...result, suppressBelow, promoteAbove });
    } catch (err: any) {
      next(err);
    }
  });

  // ── Phase 7: Weekly digest ────────────────────────────────────────────────

  router.get("/workspaces/:id/digest", async (req, res, next) => {
    try {
      const workspaceId = Number(req.params.id);
      const weekParam = req.query.week as string | undefined;

      // Parse ISO week format YYYY-Www or default to current week
      let weekStart: Date;
      let weekEnd: Date;

      if (weekParam && /^\d{4}-W\d{2}$/.test(weekParam)) {
        const [yearStr, weekStr] = weekParam.split("-W");
        const year = Number(yearStr);
        const week = Number(weekStr);
        // ISO week: Monday of week 1 is the week containing Jan 4
        const jan4 = new Date(year, 0, 4);
        const dayOfWeek = jan4.getDay() || 7;
        weekStart = new Date(jan4);
        weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
        weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
      } else {
        // Current week (Monday-Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay() || 7;
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek + 1);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
      }

      // Get alerts for this workspace in the date range
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

      // Filter by week end date in JS (Drizzle doesn't have lt easily without importing)
      const filtered = weekAlerts.filter((a) => a.createdAt < weekEnd);

      // Group by watchlist
      const grouped: Record<number, { watchlistId: number; alerts: typeof filtered }> = {};
      for (const alert of filtered) {
        const wlId = alert.watchlistId ?? 0;
        if (!grouped[wlId]) grouped[wlId] = { watchlistId: wlId, alerts: [] };
        grouped[wlId].alerts.push(alert);
      }

      // Fetch watchlist names
      const wlIds = Object.keys(grouped).map(Number).filter((id) => id > 0);
      const wlRows = wlIds.length > 0
        ? await policyIntelDb.select().from(watchlists).where(inArray(watchlists.id, wlIds))
        : [];
      const wlNameMap = new Map(wlRows.map((w) => [w.id, w.name]));

      // Build digest sections
      const sections = Object.values(grouped).map((g) => ({
        watchlist: wlNameMap.get(g.watchlistId) ?? "Unlinked",
        alertCount: g.alerts.length,
        highPriority: g.alerts.filter((a) => a.relevanceScore >= 70).length,
        alerts: g.alerts.map((a) => ({
          id: a.id,
          title: a.title,
          score: a.relevanceScore,
          status: a.status,
          whyItMatters: a.whyItMatters,
        })),
      }));

      // Get activities for the period
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

      const filteredActivities = weekActivities.filter((a) => a.createdAt < weekEnd);

      res.json({
        workspace: workspaceId,
        period: {
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
          week: weekParam ?? `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)).padStart(2, "0")}`,
        },
        summary: {
          totalAlerts: filtered.length,
          highPriority: filtered.filter((a) => a.relevanceScore >= 70).length,
          pendingReview: filtered.filter((a) => a.status === "pending_review").length,
          reviewed: filtered.filter((a) => a.status !== "pending_review").length,
          activitiesLogged: filteredActivities.length,
        },
        sections,
        recentActivities: filteredActivities.slice(0, 20).map((a) => ({
          id: a.id,
          type: a.type,
          summary: a.summary,
          matterId: a.matterId,
          createdAt: a.createdAt,
        })),
      });
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

  router.post("/briefs/generate", async (req, res, next) => {
    try {
      const { workspaceId, watchlistId, matterId, sourceDocumentIds, title } = req.body ?? {};
      if (!workspaceId || !sourceDocumentIds || !Array.isArray(sourceDocumentIds) || sourceDocumentIds.length === 0) {
        return res.status(400).json({ message: "workspaceId and non-empty sourceDocumentIds[] are required — no sources, no brief" });
      }
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

  router.post("/issue-rooms", async (req, res, next) => {
    try {
      const { workspaceId, matterId, slug, title, issueType, jurisdiction, status, summary, recommendedPath, ownerUserId, relatedBillIds, sourceDocumentIds } = req.body ?? {};
      if (!workspaceId || !title) {
        return res.status(400).json({ message: "workspaceId and title are required" });
      }

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

  router.post("/alerts/:id/create-issue-room", async (req, res, next) => {
    try {
      const alertId = Number(req.params.id);
      const [alert] = await policyIntelDb.select().from(alerts).where(eq(alerts.id, alertId));
      if (!alert) return res.status(404).json({ message: "alert not found" });

      const { matterId, slug, title, issueType, jurisdiction, summary, recommendedPath, ownerUserId, relatedBillIds } = req.body ?? {};
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
        console.error("[champion] strong_positive feedback failed:", feedbackErr);
      }

      res.status(201).json({ issueRoom: created, alert: updatedAlert });
    } catch (err: any) {
      next(err);
    }
  });

  // ── PATCH issue room fields ──────────────────────────────────────────────
  router.patch("/issue-rooms/:id", async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: "invalid id" });
      const { title, summary, status, recommendedPath, issueType, jurisdiction } = req.body ?? {};
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

  router.post("/issue-rooms/:id/updates", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { title, body, updateType, sourcePackJson } = req.body ?? {};
      if (!title || !body) {
        return res.status(400).json({ message: "title and body are required" });
      }

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

  router.post("/issue-rooms/:id/strategy-options", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { label, description, prosJson, consJson, politicalFeasibility, legalDurability, implementationComplexity, recommendationRank } = req.body ?? {};
      if (!label) {
        return res.status(400).json({ message: "label is required" });
      }

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

  router.post("/issue-rooms/:id/tasks", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const { title, description, status, priority, assignee, dueDate } = req.body ?? {};
      if (!title) {
        return res.status(400).json({ message: "title is required" });
      }

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

  router.patch("/issue-rooms/:issueRoomId/tasks/:taskId", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.issueRoomId);
      const taskId = Number(req.params.taskId);
      const { status, priority, assignee, dueDate, completedAt } = req.body ?? {};

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

      if (Object.keys(updateValues).length === 0) {
        return res.status(400).json({ message: "at least one field is required" });
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

  router.post("/issue-rooms/:id/stakeholders", async (req, res, next) => {
    try {
      const issueRoomId = Number(req.params.id);
      const [issueRoom] = await policyIntelDb.select().from(issueRooms).where(eq(issueRooms.id, issueRoomId));
      if (!issueRoom) return res.status(404).json({ message: "issue room not found" });

      const { type, name, title, organization, jurisdiction, tagsJson, sourceSummary } = req.body ?? {};
      if (!type || !name) {
        return res.status(400).json({ message: "type and name are required" });
      }

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

  router.post("/matters", async (req, res, next) => {
    try {
      const { workspaceId, slug, name, clientName, practiceArea, jurisdictionScope, status, ownerUserId, description, tagsJson } = req.body ?? {};
      if (!workspaceId || !slug || !name) {
        return res.status(400).json({ message: "workspaceId, slug, and name are required" });
      }
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
  router.post("/matters/:id/watchlists", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const { watchlistId } = req.body ?? {};
      if (!watchlistId) {
        return res.status(400).json({ message: "watchlistId is required" });
      }
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

  router.post("/matters/:id/activities", async (req, res, next) => {
    try {
      const matterId = Number(req.params.id);
      const { workspaceId, alertId, type, ownerUserId, summary, detailText, dueAt } = req.body ?? {};
      if (!workspaceId || !type || !summary) {
        return res.status(400).json({ message: "workspaceId, type, and summary are required" });
      }
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
            ilike(sourceDocuments.title, `%${billId}%`),
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
        .where(ilike(stakeholderObservations.observationText, `%${billId}%`));

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

  router.post("/stakeholders/:id/observations", async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const { sourceDocumentId, matterId, observationText, confidence } = req.body ?? {};
      if (!observationText) {
        return res.status(400).json({ message: "observationText is required" });
      }
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

  router.post("/jobs/fetch-tec", async (req, res, next) => {
    try {
      const { searchTerm } = req.body ?? {};
      if (!searchTerm) {
        return res.status(400).json({ message: "searchTerm is required" });
      }
      const result = await fetchTecData(searchTerm);
      res.json(result);
    } catch (err: any) {
      next(err);
    }
  });

  router.post("/jobs/run-tec-import", async (req, res, next) => {
    try {
      const { searchTerm, workspaceId, matterId, mode } = req.body ?? {};
      if (!workspaceId) {
        return res.status(400).json({ message: "workspaceId is required" });
      }
      if (mode !== "sweep" && !searchTerm) {
        return res.status(400).json({ message: "searchTerm is required for search mode" });
      }
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

  router.post("/jobs/run-legiscan", async (req, res, next) => {
    try {
      const { mode, sinceDays, limit, sessionId, detailConcurrency } = req.body ?? {};
      const result = await runLegiscanJob({
        mode: mode === "full" || mode === "backfill" ? mode : "recent",
        sinceDays: sinceDays ? Number(sinceDays) : undefined,
        limit: limit ? Number(limit) : undefined,
        sessionId: sessionId ? Number(sessionId) : undefined,
        detailConcurrency: detailConcurrency ? Number(detailConcurrency) : undefined,
      });
      res.json(result);
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

  router.post("/scheduler/trigger/:jobName", async (req, res, next) => {
    try {
      const { jobName } = req.params;
      const validJobs = ["legiscan-recent", "tlo-rss", "local-feeds", "tec-sweep"];
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
  router.post("/metrics/pipeline/test", async (req, res, next) => {
    try {
      const { title, summary, reasons } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "title is required" });
      }
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
      if (committee) conditions.push(ilike(hearingEvents.committee, `%${committee}%`));

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

  // ── Committee Members ──────────────────────────────────────────────────────

  /**
   * GET /committee-members — list all committee assignments, optionally filtered.
   */
  router.get("/committee-members", async (req, res, next) => {
    try {
      const { stakeholderId, committee, chamber } = req.query;
      const conditions = [];
      if (stakeholderId) conditions.push(eq(committeeMembers.stakeholderId, Number(stakeholderId)));
      if (committee) conditions.push(ilike(committeeMembers.committeeName, `%${committee}%`));
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
  router.post("/stakeholders/:id/meeting-notes", async (req, res, next) => {
    try {
      const stakeholderId = Number(req.params.id);
      const { noteText, meetingDate, contactMethod, matterId } = req.body ?? {};
      if (!noteText?.trim()) return res.status(400).json({ message: "noteText required" });

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
  router.post("/stakeholders/import-legislators", async (req, res, next) => {
    try {
      const workspaceId = Number(req.body?.workspaceId);
      if (!workspaceId) return res.status(400).json({ message: "workspaceId required" });

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
  router.post("/deliverables/generate-client-alert", async (req, res, next) => {
    try {
      const { issueRoomId, workspaceId, matterId, recipientName, firmName } = req.body;
      if (!issueRoomId || !workspaceId) {
        return res.status(400).json({ error: "issueRoomId and workspaceId are required" });
      }
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
  router.post("/deliverables/generate-weekly-report", async (req, res, next) => {
    try {
      const { workspaceId, matterId, week, recipientName, firmName } = req.body;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
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
  router.post("/deliverables/generate-hearing-memo", async (req, res, next) => {
    try {
      const { hearingId, workspaceId, matterId, recipientName, firmName } = req.body;
      if (!hearingId || !workspaceId) {
        return res.status(400).json({ error: "hearingId and workspaceId are required" });
      }
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
  router.get("/intelligence/correlations", async (_req, res, next) => {
    try {
      const report = await analyzeCorrelations();
      res.json(report);
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

  return router;
}
