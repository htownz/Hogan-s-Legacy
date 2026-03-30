/**
 * Alert Service
 *
 * Creates alerts from watchlist matches, with two dedup guards:
 *  1. Same (sourceDocumentId, watchlistId) → skip (one alert per doc per watchlist)
 *  2. Same alert reason within a 24-hour cooldown window → skip (suppress repeat noise)
 */
import { and, eq, gt } from "drizzle-orm";
import { policyIntelDb } from "../db";
import { alerts, watchlists, type PolicyIntelSourceDocument, type PolicyIntelWatchlist } from "@shared/schema-policy-intel";
import { matchDocumentToAllWatchlists, type WatchlistMatch } from "../engine/match-watchlists";
import { scoreAlert, buildWhyItMatters } from "../engine/score-alert";
import { buildScorecard } from "../engine/evaluators";
import { buildAgentScorecard } from "../engine/agent-pipeline";
import { metrics } from "../metrics";

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
  activeWatchlists?: PolicyIntelWatchlist[],
): Promise<AlertCreationResult> {
  const result: AlertCreationResult = {
    created: 0,
    skippedDuplicate: 0,
    skippedCooldown: 0,
    details: [],
  };

  // Fetch active watchlists for this workspace
  const workspaceWatchlists =
    activeWatchlists ??
    await policyIntelDb
      .select()
      .from(watchlists)
      .where(
        and(
          eq(watchlists.workspaceId, workspaceId),
          eq(watchlists.isActive, true),
        ),
      );

  if (workspaceWatchlists.length === 0) return result;

  // Run matching engine
  metrics.inc("policy_intel_docs_processed_total");
  const matches = matchDocumentToAllWatchlists(doc, workspaceWatchlists);
  if (matches.length === 0) return result;
  metrics.inc("policy_intel_docs_matched_total");

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
      metrics.inc("policy_intel_alerts_skipped_total", { reason: "duplicate" });
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
      metrics.inc("policy_intel_alerts_skipped_total", { reason: "cooldown" });
      continue;
    }

    // Build alert payload with multi-agent pipeline scorecard
    const scorecard = await buildAgentScorecard(
      doc.title,
      doc.summary,
      match.reasons,
      {
        docDate: doc.createdAt ? new Date(doc.createdAt) : null,
        rawPayload: doc.rawPayload as Record<string, unknown> | undefined,
      },
    );
    const whyItMatters = buildWhyItMatters(doc.title, match.reasons);
    const reasonsJson: Record<string, unknown>[] = scorecard.evaluators.map((e) => ({
      evaluator: e.evaluator,
      evaluatorScore: e.score,
      maxScore: e.maxScore,
      rationale: e.rationale,
    }));
    // Append pipeline diagnostics to reasonsJson
    reasonsJson.push({
      evaluator: "_pipeline",
      action: scorecard.pipelineSignal.action,
      confidence: scorecard.pipelineSignal.confidence,
      regime: scorecard.pipelineSignal.regime,
      weights: scorecard.pipelineSignal.weights,
      explanation: scorecard.pipelineSignal.explanation,
    });

    const [created] = await policyIntelDb
      .insert(alerts)
      .values({
        workspaceId,
        watchlistId: match.watchlist.id,
        sourceDocumentId: doc.id,
        title: doc.title,
        summary: doc.summary,
        whyItMatters: `${whyItMatters}\n\nScorecard: ${scorecard.summary}`,
        status: "pending_review",
        relevanceScore: scorecard.totalScore,
        reasonsJson,
      })
      .returning({ id: alerts.id });

    result.created++;
    metrics.inc("policy_intel_alerts_created_total");
    metrics.observe("policy_intel_alert_score", {}, scorecard.totalScore);
    result.details.push({
      alertId: created.id,
      watchlist: match.watchlist.name,
      score: scorecard.totalScore,
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
  activeWatchlists?: PolicyIntelWatchlist[],
): Promise<AlertCreationResult> {
  const aggregate: AlertCreationResult = {
    created: 0,
    skippedDuplicate: 0,
    skippedCooldown: 0,
    details: [],
  };

  for (const doc of docs) {
    const r = await processDocumentAlerts(doc, workspaceId, activeWatchlists);
    aggregate.created += r.created;
    aggregate.skippedDuplicate += r.skippedDuplicate;
    aggregate.skippedCooldown += r.skippedCooldown;
    aggregate.details.push(...r.details);
  }

  return aggregate;
}
