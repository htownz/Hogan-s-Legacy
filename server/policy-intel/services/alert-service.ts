/**
 * Alert Service
 *
 * Creates alerts from watchlist matches, with two dedup guards:
 *  1. Same (sourceDocumentId, watchlistId) → skip (one alert per doc per watchlist)
 *  2. Same alert reason within a 24-hour cooldown window → skip (suppress repeat noise)
 */
import { and, eq, gt } from "drizzle-orm";
import { policyIntelDb } from "../db";
import { alerts, watchlists, type PolicyIntelSourceDocument } from "@shared/schema-policy-intel";
import { matchDocumentToAllWatchlists, type WatchlistMatch } from "../engine/match-watchlists";
import { scoreAlert, buildWhyItMatters } from "../engine/score-alert";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AlertCreationResult {
  created: number;
  skippedDuplicate: number;
  skippedCooldown: number;
  details: { alertId: number; watchlist: string; score: number }[];
}

// ── Cooldown constant ────────────────────────────────────────────────────────

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Core ─────────────────────────────────────────────────────────────────────

/**
 * Process a single source document against all active watchlists in its workspace.
 */
export async function processDocumentAlerts(
  doc: PolicyIntelSourceDocument,
  workspaceId: number,
): Promise<AlertCreationResult> {
  const result: AlertCreationResult = {
    created: 0,
    skippedDuplicate: 0,
    skippedCooldown: 0,
    details: [],
  };

  // Fetch active watchlists for this workspace
  const activeWatchlists = await policyIntelDb
    .select()
    .from(watchlists)
    .where(
      and(
        eq(watchlists.workspaceId, workspaceId),
        eq(watchlists.isActive, true),
      ),
    );

  if (activeWatchlists.length === 0) return result;

  // Run matching engine
  const matches = matchDocumentToAllWatchlists(doc, activeWatchlists);
  if (matches.length === 0) return result;

  for (const match of matches) {
    // 1. Dedup: skip if an alert already exists for this (doc, watchlist)
    const existing = await policyIntelDb
      .select({ id: alerts.id })
      .from(alerts)
      .where(
        and(
          eq(alerts.sourceDocumentId, doc.id),
          eq(alerts.watchlistId, match.watchlist.id),
        ),
      );

    if (existing.length > 0) {
      result.skippedDuplicate++;
      continue;
    }

    // 2. Cooldown: skip if a matching alert fired within 24h with similar reasons
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_MS);
    const recentAlerts = await policyIntelDb
      .select({ id: alerts.id })
      .from(alerts)
      .where(
        and(
          eq(alerts.watchlistId, match.watchlist.id),
          eq(alerts.workspaceId, workspaceId),
          gt(alerts.createdAt, cooldownCutoff),
          eq(alerts.title, doc.title),
        ),
      );

    if (recentAlerts.length > 0) {
      result.skippedCooldown++;
      continue;
    }

    // Build alert payload
    const score = scoreAlert(match.reasons);
    const whyItMatters = buildWhyItMatters(doc.title, match.reasons);
    const reasonsJson = match.reasons.map(
      (r) => `[${r.dimension}] ${r.rule}: ${r.excerpt.slice(0, 120)}`,
    );

    const [created] = await policyIntelDb
      .insert(alerts)
      .values({
        workspaceId,
        watchlistId: match.watchlist.id,
        sourceDocumentId: doc.id,
        title: doc.title,
        summary: doc.summary,
        whyItMatters,
        status: "pending_review",
        relevanceScore: score,
        reasonsJson,
      })
      .returning({ id: alerts.id });

    result.created++;
    result.details.push({
      alertId: created.id,
      watchlist: match.watchlist.name,
      score,
    });
  }

  return result;
}

/**
 * Process multiple documents against a workspace's watchlists.
 * Convenience wrapper for batch processing from job runner.
 */
export async function processDocumentBatch(
  docs: PolicyIntelSourceDocument[],
  workspaceId: number,
): Promise<AlertCreationResult> {
  const aggregate: AlertCreationResult = {
    created: 0,
    skippedDuplicate: 0,
    skippedCooldown: 0,
    details: [],
  };

  for (const doc of docs) {
    const r = await processDocumentAlerts(doc, workspaceId);
    aggregate.created += r.created;
    aggregate.skippedDuplicate += r.skippedDuplicate;
    aggregate.skippedCooldown += r.skippedCooldown;
    aggregate.details.push(...r.details);
  }

  return aggregate;
}
