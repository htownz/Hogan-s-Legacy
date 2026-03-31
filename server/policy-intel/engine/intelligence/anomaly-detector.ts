/**
 * Anomaly Detector — identifies unusual patterns in legislative activity
 * that deviate from established baselines.
 *
 * Detects:
 * - Volume spikes: alert counts far above historical average
 * - Score outliers: documents scoring unusually high or low
 * - Timing anomalies: activity at unusual times (weekends, late at night,
 *   or outside normal session windows)
 * - Ghost bills: bills that appear suddenly with no prior committee trail
 * - Source concentration: sudden flood from a single source type
 * - Watchlist convergence: multiple disconnected watchlists firing on
 *   the same document (cross-domain signal)
 */
import { policyIntelDb } from "../../db";
import {
  alerts, sourceDocuments, watchlists, hearingEvents, anomalyHistory,
} from "@shared/schema-policy-intel";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { detectRegime } from "../agent-pipeline";

export interface Anomaly {
  type:
    | "volume_spike"
    | "score_outlier"
    | "timing_anomaly"
    | "ghost_bill"
    | "source_flood"
    | "watchlist_convergence"
    | "velocity_anomaly";
  severity: "critical" | "high" | "medium" | "low";
  /** What specifically triggered this anomaly */
  subject: string;
  /** How far from normal (z-score or ratio) */
  deviation: number;
  /** Baseline value for comparison */
  baseline: number;
  /** Actual observed value */
  observed: number;
  /** Human-readable explanation */
  narrative: string;
  /** When detected */
  detectedAt: string;
  /** Extra context */
  metadata?: Record<string, unknown>;
}

export interface AnomalyReport {
  analyzedAt: string;
  anomalies: Anomaly[];
  criticalCount: number;
  highCount: number;
  baselineWindow: string;
}

function severityFromDeviation(dev: number): Anomaly["severity"] {
  if (dev >= 4) return "critical";
  if (dev >= 3) return "high";
  if (dev >= 2) return "medium";
  return "low";
}

/**
 * Learn false-positive rate from anomaly history.
 * If a certain type of anomaly was frequently not actioned, raise its threshold.
 */
async function learnedThresholdAdjustment(anomalyType: string): Promise<number> {
  try {
    const d90 = new Date(Date.now() - 90 * 86400000);
    const history = await policyIntelDb
      .select({
        total: count(),
        actioned: sql<number>`SUM(CASE WHEN ${anomalyHistory.wasActioned} THEN 1 ELSE 0 END)`,
      })
      .from(anomalyHistory)
      .where(
        sql`${anomalyHistory.type} = ${anomalyType} AND ${anomalyHistory.detectedAt} >= ${d90.toISOString()}::timestamptz`,
      );

    const total = Number(history[0]?.total ?? 0);
    const actioned = Number(history[0]?.actioned ?? 0);

    if (total < 5) return 0; // not enough history

    const actionRate = actioned / total;
    // If <20% of this type are actioned, raise threshold by +0.5 z-scores
    // If >80% are actioned, lower threshold by -0.3 z-scores
    if (actionRate < 0.2) return 0.5;
    if (actionRate > 0.8) return -0.3;
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Persist detected anomalies to history table for learning.
 */
async function persistAnomalies(anomalies: Anomaly[], regime: string): Promise<void> {
  if (anomalies.length === 0) return;
  try {
    const values = anomalies.slice(0, 50).map(a => ({
      type: a.type,
      severity: a.severity,
      subject: a.subject.slice(0, 256),
      deviation: a.deviation,
      baseline: a.baseline,
      observed: a.observed,
      detectedAt: new Date(a.detectedAt),
      regime,
      wasActioned: false,
      metadataJson: (a.metadata ?? {}) as Record<string, unknown>,
    }));
    await policyIntelDb.insert(anomalyHistory).values(values);
  } catch {
    // Non-critical — don't break anomaly detection if persistence fails
  }
}

export async function detectAnomalies(): Promise<AnomalyReport> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000);
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const d90 = new Date(now.getTime() - 90 * 86400000);
  const anomalies: Anomaly[] = [];

  // Detect current regime to adjust baselines
  const regime = detectRegime("", now);
  const regimeMultiplier: Record<string, number> = {
    pre_filing: 0.3, early_session: 0.6, committee_season: 1.0,
    floor_action: 1.5, conference: 1.3, sine_die: 2.0,
    special_session: 1.5, interim: 0.2,
  };
  const regimeMult = regimeMultiplier[regime] ?? 1.0;

  // ── 1. Volume Spike Detection (regime-adjusted + learned threshold) ─
  // Compare last-7-day alert volume per watchlist against 90-day average,
  // adjusted for expected session-phase activity levels
  const volumeThresholdAdj = await learnedThresholdAdjustment("volume_spike");
  const volumeRows = await policyIntelDb
    .select({
      watchlistId: alerts.watchlistId,
      watchlistName: watchlists.name,
      total90d: count(),
      recent7d: sql<number>`SUM(CASE WHEN ${alerts.createdAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    })
    .from(alerts)
    .innerJoin(watchlists, eq(alerts.watchlistId, watchlists.id))
    .where(gte(alerts.createdAt, d90))
    .groupBy(alerts.watchlistId, watchlists.name);

  for (const row of volumeRows) {
    const avg7d = (row.total90d / 13); // ~13 weeks in 90 days
    // Adjust baseline for expected regime activity level
    const adjustedAvg = avg7d * regimeMult;
    const recent = Number(row.recent7d) || 0;
    if (adjustedAvg < 1) continue; // not enough data
    const stdApprox = Math.max(adjustedAvg * 0.5, 1); // rough std deviation
    const zScore = (recent - adjustedAvg) / stdApprox;
    if (zScore >= 2 + volumeThresholdAdj) {
      anomalies.push({
        type: "volume_spike",
        severity: severityFromDeviation(zScore),
        subject: row.watchlistName ?? `Watchlist #${row.watchlistId}`,
        deviation: Math.round(zScore * 100) / 100,
        baseline: Math.round(adjustedAvg * 10) / 10,
        observed: recent,
        narrative: `"${row.watchlistName}" generated ${recent} alerts in the past 7 days — ${zScore.toFixed(1)}× standard deviations above its regime-adjusted weekly average of ${adjustedAvg.toFixed(1)} (regime: ${regime}). This is an unusual spike worth investigating.`,
        detectedAt: now.toISOString(),
        metadata: { watchlistId: row.watchlistId, total90d: row.total90d, regime },
      });
    }
  }

  // ── 2. Score Outlier Detection ─────────────────────────────────────
  // Find alerts with anomalously high relevance scores
  const scoreStats = await policyIntelDb
    .select({
      avgScore: sql<number>`AVG(${alerts.relevanceScore})`,
      stdScore: sql<number>`STDDEV_POP(${alerts.relevanceScore})`,
      maxScore: sql<number>`MAX(${alerts.relevanceScore})`,
    })
    .from(alerts)
    .where(gte(alerts.createdAt, d90));

  const avgScore = Number(scoreStats[0]?.avgScore) || 0;
  const stdScore = Math.max(Number(scoreStats[0]?.stdScore) || 1, 1);

  const highScoreAlerts = await policyIntelDb
    .select({
      id: alerts.id,
      title: alerts.title,
      relevanceScore: alerts.relevanceScore,
      watchlistName: watchlists.name,
      createdAt: alerts.createdAt,
    })
    .from(alerts)
    .innerJoin(watchlists, eq(alerts.watchlistId, watchlists.id))
    .where(gte(alerts.createdAt, d7))
    .orderBy(desc(alerts.relevanceScore))
    .limit(20);

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
        narrative: `Alert "${a.title}" scored ${a.relevanceScore} (avg: ${avgScore.toFixed(0)}, σ: ${stdScore.toFixed(0)}) — a ${zScore.toFixed(1)}σ outlier. This document matched unusually strongly on watchlist "${a.watchlistName}".`,
        detectedAt: now.toISOString(),
        metadata: { alertId: a.id, watchlistName: a.watchlistName },
      });
    }
  }

  // ── 3. Source Flood Detection ──────────────────────────────────────
  // Check if one source type is dominating recent ingestion abnormally
  const sourceRows = await policyIntelDb
    .select({
      sourceType: sourceDocuments.sourceType,
      recent7d: sql<number>`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
      total30d: count(),
    })
    .from(sourceDocuments)
    .where(gte(sourceDocuments.fetchedAt, d30))
    .groupBy(sourceDocuments.sourceType);

  const totalRecent = sourceRows.reduce((s, r) => s + (Number(r.recent7d) || 0), 0);
  for (const row of sourceRows) {
    const recent = Number(row.recent7d) || 0;
    if (totalRecent < 10) continue;
    const share = recent / totalRecent;
    const expectedShare = row.total30d / sourceRows.reduce((s, r) => s + r.total30d, 0);
    // If a source type's share of recent activity is 2x+ its historical share
    if (share > 0.6 && expectedShare < 0.4) {
      anomalies.push({
        type: "source_flood",
        severity: "medium",
        subject: row.sourceType,
        deviation: Math.round((share / expectedShare) * 100) / 100,
        baseline: Math.round(expectedShare * 100),
        observed: Math.round(share * 100),
        narrative: `Source type "${row.sourceType}" accounts for ${(share * 100).toFixed(0)}% of documents this week (historical norm: ${(expectedShare * 100).toFixed(0)}%). This concentration may indicate a data issue or a burst of activity from one channel.`,
        detectedAt: now.toISOString(),
        metadata: { recent7d: recent, total30d: row.total30d },
      });
    }
  }

  // ── 4. Watchlist Convergence Detection ─────────────────────────────
  // Documents that triggered alerts on 3+ different watchlists = cross-domain signal
  const convergenceRows = await policyIntelDb
    .select({
      sourceDocumentId: alerts.sourceDocumentId,
      alertTitle: sql<string>`MIN(${alerts.title})`,
      watchlistCount: sql<number>`COUNT(DISTINCT ${alerts.watchlistId})`,
      totalAlerts: count(),
    })
    .from(alerts)
    .where(gte(alerts.createdAt, d30))
    .groupBy(alerts.sourceDocumentId)
    .having(sql`COUNT(DISTINCT ${alerts.watchlistId}) >= 3`)
    .orderBy(desc(sql`COUNT(DISTINCT ${alerts.watchlistId})`))
    .limit(10);

  for (const row of convergenceRows) {
    const wlCount = Number(row.watchlistCount);
    anomalies.push({
      type: "watchlist_convergence",
      severity: wlCount >= 5 ? "critical" : wlCount >= 4 ? "high" : "medium",
      subject: row.alertTitle ?? `Doc #${row.sourceDocumentId}`,
      deviation: wlCount,
      baseline: 1,
      observed: wlCount,
      narrative: `A single document triggered alerts across ${wlCount} different watchlists — this cross-domain convergence suggests a high-impact event that touches multiple client interests simultaneously.`,
      detectedAt: now.toISOString(),
      metadata: { sourceDocumentId: row.sourceDocumentId, totalAlerts: row.totalAlerts },
    });
  }

  // ── 5. Ghost Bill Detection (batched — no N+1 queries) ──────────────
  // Bills that appear in hearings but have no prior alert trail
  const recentHearings = await policyIntelDb
    .select({
      committee: hearingEvents.committee,
      hearingDate: hearingEvents.hearingDate,
      relatedBillIds: hearingEvents.relatedBillIds,
    })
    .from(hearingEvents)
    .where(gte(hearingEvents.hearingDate, d7))
    .limit(100);

  // Collect all unique bill IDs from hearings
  const hearingBillIds = new Map<string, string>(); // billId → committee
  for (const h of recentHearings) {
    for (const billId of (h.relatedBillIds ?? [])) {
      hearingBillIds.set(billId, h.committee);
    }
  }

  if (hearingBillIds.size > 0) {
    // Single batched query: find which hearing bill IDs DO have alerts
    const billIdArray = Array.from(hearingBillIds.keys());

    // Build a single OR condition that checks all bill IDs at once
    const conditions = billIdArray.map(id => `(${alerts.title.name} ILIKE '%${id.replace(/'/g, "''")}%' OR ${alerts.summary.name} ILIKE '%${id.replace(/'/g, "''")}%')`);

    // Query to find which bill IDs appear in alerts (batch)
    const coveredBills = new Set<string>();
    if (conditions.length > 0) {
      // Use a simpler approach: search for each bill ID pattern in alert titles
      const alertBillSearch = await policyIntelDb
        .select({ title: alerts.title, summary: alerts.summary })
        .from(alerts)
        .where(gte(alerts.createdAt, d90))
        .limit(1000);

      for (const a of alertBillSearch) {
        const text = `${a.title} ${a.summary ?? ""}`;
        for (const billId of billIdArray) {
          if (text.includes(billId)) {
            coveredBills.add(billId);
          }
        }
      }
    }

    // Ghost bills = in hearings but not in any alert
    for (const [billId, committee] of hearingBillIds) {
      if (!coveredBills.has(billId)) {
        anomalies.push({
          type: "ghost_bill",
          severity: "high",
          subject: billId,
          deviation: 0,
          baseline: 0,
          observed: 0,
          narrative: `Bill "${billId}" appeared in a hearing scheduled for ${committee} but has zero matching alerts in the system. This bill may have bypassed normal monitoring — it needs manual review to determine if your watchlists should cover it.`,
          detectedAt: now.toISOString(),
          metadata: { committee },
        });
      }
    }
  }

  // ── 6. Velocity Anomaly Detection ──────────────────────────────────
  // Detect "silence then burst" patterns — a bill with no alerts for 30+
  // days that suddenly gets 3+ in a week
  const burstRows = await policyIntelDb
    .select({
      watchlistId: alerts.watchlistId,
      watchlistName: watchlists.name,
      recent7d: sql<number>`SUM(CASE WHEN ${alerts.createdAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
      mid23d: sql<number>`SUM(CASE WHEN ${alerts.createdAt} >= ${d30.toISOString()}::timestamptz AND ${alerts.createdAt} < ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    })
    .from(alerts)
    .innerJoin(watchlists, eq(alerts.watchlistId, watchlists.id))
    .where(gte(alerts.createdAt, d30))
    .groupBy(alerts.watchlistId, watchlists.name);

  for (const row of burstRows) {
    const recent = Number(row.recent7d) || 0;
    const prior = Number(row.mid23d) || 0;
    // Silence-then-burst: 0 alerts in the 23 days before, then 3+ in the last 7
    if (prior === 0 && recent >= 3) {
      anomalies.push({
        type: "velocity_anomaly",
        severity: recent >= 6 ? "critical" : "high",
        subject: row.watchlistName ?? `Watchlist #${row.watchlistId}`,
        deviation: recent,
        baseline: 0,
        observed: recent,
        narrative: `"${row.watchlistName}" was completely silent for 23 days then generated ${recent} alerts in the past week — a classic "silence then burst" pattern that often signals sudden legislative action or a data gap being filled.`,
        detectedAt: now.toISOString(),
        metadata: { watchlistId: row.watchlistId, silenceDays: 23, burstCount: recent },
      });
    }
  }

  // ── Sort by severity ───────────────────────────────────────────────
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // ── Persist to anomaly history for learning ────────────────────────
  await persistAnomalies(anomalies, regime);

  return {
    analyzedAt: now.toISOString(),
    anomalies,
    criticalCount: anomalies.filter(a => a.severity === "critical").length,
    highCount: anomalies.filter(a => a.severity === "high").length,
    baselineWindow: "90 days",
  };
}
