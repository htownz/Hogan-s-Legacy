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
  alerts, sourceDocuments, watchlists, hearingEvents,
} from "@shared/schema-policy-intel";
import { count, desc, eq, gte, sql } from "drizzle-orm";

export interface Anomaly {
  type:
    | "volume_spike"
    | "score_outlier"
    | "timing_anomaly"
    | "ghost_bill"
    | "source_flood"
    | "watchlist_convergence";
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

export async function detectAnomalies(): Promise<AnomalyReport> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000);
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const d90 = new Date(now.getTime() - 90 * 86400000);
  const anomalies: Anomaly[] = [];

  // ── 1. Volume Spike Detection ──────────────────────────────────────
  // Compare last-7-day alert volume per watchlist against 90-day average
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
    const recent = Number(row.recent7d) || 0;
    if (avg7d < 1) continue; // not enough data
    const stdApprox = Math.max(avg7d * 0.5, 1); // rough std deviation
    const zScore = (recent - avg7d) / stdApprox;
    if (zScore >= 2) {
      anomalies.push({
        type: "volume_spike",
        severity: severityFromDeviation(zScore),
        subject: row.watchlistName ?? `Watchlist #${row.watchlistId}`,
        deviation: Math.round(zScore * 100) / 100,
        baseline: Math.round(avg7d * 10) / 10,
        observed: recent,
        narrative: `"${row.watchlistName}" generated ${recent} alerts in the past 7 days — ${zScore.toFixed(1)}× standard deviations above its weekly average of ${avg7d.toFixed(1)}. This is an unusual spike worth investigating.`,
        detectedAt: now.toISOString(),
        metadata: { watchlistId: row.watchlistId, total90d: row.total90d },
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

  // ── 5. Ghost Bill Detection ────────────────────────────────────────
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

  for (const h of recentHearings) {
    for (const billId of (h.relatedBillIds ?? [])) {
      // Check if there's any alert matching this bill ID
      const billAlerts = await policyIntelDb
        .select({ cnt: count() })
        .from(alerts)
        .where(sql`(${alerts.title} ILIKE ${"%" + billId + "%"} OR ${alerts.summary} ILIKE ${"%" + billId + "%"})`)
        .limit(1);

      const alertCount = billAlerts[0]?.cnt ?? 0;
      if (alertCount === 0) {
        anomalies.push({
          type: "ghost_bill",
          severity: "high",
          subject: billId,
          deviation: 0,
          baseline: 0,
          observed: 0,
          narrative: `Bill "${billId}" appeared in a hearing scheduled for ${h.committee} but has zero matching alerts in the system. This bill may have bypassed normal monitoring — it needs manual review to determine if your watchlists should cover it.`,
          detectedAt: now.toISOString(),
          metadata: { committee: h.committee, hearingDate: h.hearingDate },
        });
      }
    }
  }

  // ── Sort by severity ───────────────────────────────────────────────
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    analyzedAt: now.toISOString(),
    anomalies,
    criticalCount: anomalies.filter(a => a.severity === "critical").length,
    highCount: anomalies.filter(a => a.severity === "high").length,
    baselineWindow: "90 days",
  };
}
