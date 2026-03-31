/**
 * Velocity Analyzer — detects acceleration and deceleration patterns
 * in legislative activity across watchlists, topics, and bill clusters.
 *
 * Produces "momentum vectors" — is a topic heating up or cooling down?
 * This is the difference between "you got 3 alerts" vs "this topic just
 * went from 1 alert/week to 12 in 3 days — something is moving."
 */
import { policyIntelDb } from "../../db";
import { alerts, sourceDocuments, watchlists } from "@shared/schema-policy-intel";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export interface VelocityVector {
  /** What we're tracking (watchlist name, source type, bill prefix) */
  subject: string;
  subjectType: "watchlist" | "source_type" | "bill_prefix" | "committee";
  subjectId?: number;
  /** Counts per time window */
  current7d: number;
  previous7d: number;
  current30d: number;
  previous30d: number;
  /** Derived signals */
  weekOverWeekChange: number; // percentage change (-100 to +Infinity)
  acceleration: number; // second derivative — is the CHANGE accelerating?
  momentum: "surging" | "heating" | "steady" | "cooling" | "stalled";
  /** Significance: is this change meaningful or just noise? */
  significance: number; // 0-1 (higher = more confident this is real signal)
  /** Human explanation */
  narrative: string;
}

export interface VelocityReport {
  analyzedAt: string;
  vectors: VelocityVector[];
  topMovers: VelocityVector[];
  emergingTopics: VelocityVector[];
  decayingTopics: VelocityVector[];
}

function classifyMomentum(wow: number, accel: number): VelocityVector["momentum"] {
  if (wow > 200 || (wow > 100 && accel > 0)) return "surging";
  if (wow > 30) return "heating";
  if (wow > -20 && wow <= 30) return "steady";
  if (wow > -60) return "cooling";
  return "stalled";
}

function calcSignificance(current: number, previous: number): number {
  const volume = Math.min(current + previous, 100) / 100; // higher volume = more significant
  const change = previous > 0 ? Math.abs(current - previous) / previous : current > 0 ? 1 : 0;
  return Math.min(1, volume * 0.4 + change * 0.6);
}

function buildNarrative(v: Omit<VelocityVector, "narrative">): string {
  const subjectLabel = v.subjectType === "watchlist" ? `Watchlist "${v.subject}"` : `${v.subjectType} "${v.subject}"`;
  if (v.momentum === "surging") {
    return `${subjectLabel} is surging — ${v.current7d} alerts this week vs ${v.previous7d} last week (${v.weekOverWeekChange > 0 ? "+" : ""}${v.weekOverWeekChange.toFixed(0)}%). Activity is accelerating and may require immediate attention.`;
  }
  if (v.momentum === "heating") {
    return `${subjectLabel} is heating up — activity increased ${v.weekOverWeekChange.toFixed(0)}% week-over-week. Monitor for escalation.`;
  }
  if (v.momentum === "cooling") {
    return `${subjectLabel} is cooling — activity declined ${Math.abs(v.weekOverWeekChange).toFixed(0)}% this week. The legislative push may be waning.`;
  }
  if (v.momentum === "stalled") {
    return `${subjectLabel} has stalled — minimal recent activity after prior movement. This issue may be dead or tabled.`;
  }
  return `${subjectLabel} is holding steady at ${v.current7d} alerts/week.`;
}

export async function analyzeVelocity(): Promise<VelocityReport> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 86400000);
  const d14 = new Date(now.getTime() - 14 * 86400000);
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const d60 = new Date(now.getTime() - 60 * 86400000);

  // ── Watchlist velocity (most actionable) ─────────────────────────────
  // Use SUM+CASE aggregation to avoid GROUP BY CASE expression issues
  const watchlistRows = await policyIntelDb
    .select({
      watchlistId: alerts.watchlistId,
      watchlistName: watchlists.name,
      cur7: sql<number>`SUM(CASE WHEN ${alerts.createdAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
      prev7: sql<number>`SUM(CASE WHEN ${alerts.createdAt} >= ${d14.toISOString()}::timestamptz AND ${alerts.createdAt} < ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
      cur30: sql<number>`SUM(CASE WHEN ${alerts.createdAt} >= ${d30.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
      prev30: sql<number>`SUM(CASE WHEN ${alerts.createdAt} >= ${d60.toISOString()}::timestamptz AND ${alerts.createdAt} < ${d30.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    })
    .from(alerts)
    .innerJoin(watchlists, eq(alerts.watchlistId, watchlists.id))
    .where(gte(alerts.createdAt, d60))
    .groupBy(alerts.watchlistId, watchlists.name);

  // Build watchlist map from aggregated rows
  const watchlistMap = new Map<number, { name: string; cur7: number; prev7: number; cur30: number; prev30: number }>();
  for (const r of watchlistRows) {
    if (!r.watchlistId) continue;
    watchlistMap.set(r.watchlistId, {
      name: r.watchlistName ?? "Unknown",
      cur7: Number(r.cur7) || 0,
      prev7: Number(r.prev7) || 0,
      cur30: Number(r.cur30) || 0,
      prev30: Number(r.prev30) || 0,
    });
  }

  // ── Source type velocity ─────────────────────────────────────────────
  const sourceRows = await policyIntelDb
    .select({
      sourceType: sourceDocuments.sourceType,
      cur7: sql<number>`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
      prev7: sql<number>`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d14.toISOString()}::timestamptz AND ${sourceDocuments.fetchedAt} < ${d7.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
      cur30: sql<number>`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d30.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
      prev30: sql<number>`SUM(CASE WHEN ${sourceDocuments.fetchedAt} >= ${d60.toISOString()}::timestamptz AND ${sourceDocuments.fetchedAt} < ${d30.toISOString()}::timestamptz THEN 1 ELSE 0 END)`,
    })
    .from(sourceDocuments)
    .where(gte(sourceDocuments.fetchedAt, d60))
    .groupBy(sourceDocuments.sourceType);

  const sourceMap = new Map<string, { cur7: number; prev7: number; cur30: number; prev30: number }>();
  for (const r of sourceRows) {
    sourceMap.set(r.sourceType, {
      cur7: Number(r.cur7) || 0,
      prev7: Number(r.prev7) || 0,
      cur30: Number(r.cur30) || 0,
      prev30: Number(r.prev30) || 0,
    });
  }

  // ── Build velocity vectors ───────────────────────────────────────────
  const vectors: VelocityVector[] = [];

  for (const [id, d] of watchlistMap) {
    const wow = d.prev7 > 0 ? ((d.cur7 - d.prev7) / d.prev7) * 100 : d.cur7 > 0 ? 100 : 0;
    const monthRate = d.prev30 > 0 ? ((d.cur30 - d.prev30) / d.prev30) * 100 : 0;
    const accel = wow - monthRate; // is the weekly change faster than the monthly trend?
    const partial: Omit<VelocityVector, "narrative"> = {
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
      significance: calcSignificance(d.cur7, d.prev7),
    };
    vectors.push({ ...partial, narrative: buildNarrative(partial) });
  }

  for (const [sourceType, d] of sourceMap) {
    const wow = d.prev7 > 0 ? ((d.cur7 - d.prev7) / d.prev7) * 100 : d.cur7 > 0 ? 100 : 0;
    const monthRate = d.prev30 > 0 ? ((d.cur30 - d.prev30) / d.prev30) * 100 : 0;
    const accel = wow - monthRate;
    const partial: Omit<VelocityVector, "narrative"> = {
      subject: sourceType,
      subjectType: "source_type",
      current7d: d.cur7,
      previous7d: d.prev7,
      current30d: d.cur30,
      previous30d: d.prev30,
      weekOverWeekChange: wow,
      acceleration: accel,
      momentum: classifyMomentum(wow, accel),
      significance: calcSignificance(d.cur7, d.prev7),
    };
    vectors.push({ ...partial, narrative: buildNarrative(partial) });
  }

  // Sort by significance
  vectors.sort((a, b) => b.significance - a.significance);

  return {
    analyzedAt: now.toISOString(),
    vectors,
    topMovers: vectors.filter(v => v.momentum === "surging" || v.momentum === "heating").slice(0, 5),
    emergingTopics: vectors.filter(v => v.previous7d === 0 && v.current7d > 0).slice(0, 5),
    decayingTopics: vectors.filter(v => v.momentum === "stalled" || v.momentum === "cooling").slice(0, 5),
  };
}
