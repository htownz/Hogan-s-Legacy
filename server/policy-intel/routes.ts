import { Router } from "express";
import { and, count, desc, eq, gt, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { policyIntelDb } from "./db";
import { activities, alerts, briefs, deliverables, issueRoomSourceDocuments, issueRoomStrategyOptions, issueRoomTasks, issueRoomUpdates, issueRooms, matters, matterWatchlists, monitoringJobs, sourceDocuments, stakeholders, stakeholderObservations, watchlists, workspaces } from "@shared/schema-policy-intel";
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

function slugifyIssueRoom(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
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
        "/api/intel/workspaces/:id/digest"
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

  router.get("/watchlists", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(watchlists).orderBy(desc(watchlists.id));
      res.json(rows);
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
      const id = Number(req.params.id);
      const [watchlist] = await policyIntelDb.select().from(watchlists).where(eq(watchlists.id, id));
      if (!watchlist) {
        return res.status(404).json({ message: "watchlist not found" });
      }
      res.json(watchlist);
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
      if (search) conditions.push(ilike(sourceDocuments.title, `%${search}%`));

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
      if (search) conditions.push(ilike(alerts.title, `%${search}%`));

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
      const id = Number(req.params.id);
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

      res.json(updated);
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

  router.get("/deliverables", async (_req, res, next) => {
    try {
      const rows = await policyIntelDb.select().from(deliverables).orderBy(desc(deliverables.id));
      res.json(rows);
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
      const rows = workspaceId
        ? await policyIntelDb.select().from(issueRooms).where(eq(issueRooms.workspaceId, workspaceId)).orderBy(desc(issueRooms.id))
        : await policyIntelDb.select().from(issueRooms).orderBy(desc(issueRooms.id));
      res.json(rows);
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
      const id = Number(req.params.id);
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

      res.status(201).json({ issueRoom: created, alert: updatedAlert });
    } catch (err: any) {
      next(err);
    }
  });

  // ── PATCH issue room fields ──────────────────────────────────────────────
  router.patch("/issue-rooms/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
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
      const id = Number(req.params.id);
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
      const id = Number(req.params.id);
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

  return router;
}
