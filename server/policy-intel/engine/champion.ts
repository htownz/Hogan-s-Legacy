/**
 * Champion / Challenger Walk-Forward Retraining Engine
 *
 * Ported from Hogan Market OS champion/challenger weight promotion logic.
 * Learns from reviewer feedback (promoted vs suppressed alerts) to optimise
 * the MetaWeigher's agent weights and action thresholds.
 *
 * Core loop (triggered manually or on schedule):
 *  1. Pull recent feedback log rows
 *  2. Split into train/holdout (80/20)
 *  3. Coordinate-descent optimiser sweeps weights + thresholds
 *  4. Score challenger accuracy on holdout
 *  5. If challenger beats champion by ≥PROMOTION_MARGIN → promote
 */

import { desc, eq, sql } from "drizzle-orm";
import { policyIntelDb } from "../db";
import { alerts, championSnapshots, feedbackLog } from "@shared/schema-policy-intel";
import { metrics } from "../metrics";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChampionConfig {
  weights: Record<string, number>;
  escalateThreshold: number;
  archiveThreshold: number;
}

export interface ChampionStatus {
  generation: number;
  weights: Record<string, number>;
  escalateThreshold: number;
  archiveThreshold: number;
  accuracy: number;
  feedbackCount: number;
  promotedAt: string;
  isDefault: boolean;
}

export interface RetrainResult {
  promoted: boolean;
  championAccuracy: number;
  challengerAccuracy: number;
  newGeneration: number | null;
  trainSize: number;
  holdoutSize: number;
  challengerWeights: Record<string, number>;
  challengerThresholds: { escalate: number; archive: number };
}

// ── Constants ────────────────────────────────────────────────────────────────

const AGENT_NAMES = ["procedural", "relevance", "stakeholder", "actionability", "timeliness", "regime"];

const FALLBACK_WEIGHTS: Record<string, number> = {
  procedural: 0.25,
  relevance: 0.30,
  stakeholder: 0.15,
  actionability: 0.15,
  timeliness: 0.10,
  regime: 0.05,
};

const FALLBACK_CONFIG: ChampionConfig = {
  weights: FALLBACK_WEIGHTS,
  escalateThreshold: 60,
  archiveThreshold: 20,
};

/** Challenger must beat champion by this margin to be promoted */
const PROMOTION_MARGIN = 0.05;

/** Minimum feedback samples required before retraining */
const MIN_FEEDBACK_FOR_RETRAIN = 20;

/** Train/holdout split ratio */
const TRAIN_RATIO = 0.8;

// ── In-memory champion cache ─────────────────────────────────────────────────

let cachedChampion: ChampionStatus | null = null;

/**
 * Return the current champion config (weights + thresholds).
 * Falls back to hardcoded defaults if no champion has been promoted yet.
 */
export async function getChampionConfig(): Promise<ChampionConfig> {
  if (cachedChampion) {
    return {
      weights: { ...cachedChampion.weights },
      escalateThreshold: cachedChampion.escalateThreshold,
      archiveThreshold: cachedChampion.archiveThreshold,
    };
  }

  // Try loading from DB
  const [row] = await policyIntelDb
    .select()
    .from(championSnapshots)
    .orderBy(desc(championSnapshots.promotedAt))
    .limit(1);

  if (row) {
    cachedChampion = {
      generation: row.generation,
      weights: row.weightsJson as Record<string, number>,
      escalateThreshold: row.escalateThreshold,
      archiveThreshold: row.archiveThreshold,
      accuracy: row.accuracy,
      feedbackCount: row.feedbackCount,
      promotedAt: row.promotedAt.toISOString(),
      isDefault: false,
    };
    return {
      weights: { ...cachedChampion.weights },
      escalateThreshold: cachedChampion.escalateThreshold,
      archiveThreshold: cachedChampion.archiveThreshold,
    };
  }

  // No champion in DB yet — use hardcoded fallback
  return { ...FALLBACK_CONFIG, weights: { ...FALLBACK_WEIGHTS } };
}

/**
 * Return champion status for the dashboard/API.
 */
export async function getChampionStatus(): Promise<ChampionStatus> {
  // Ensure cache is populated
  await getChampionConfig();

  // Get live feedback count from the feedback log table
  const [{ count: liveFeedbackCount }] = await policyIntelDb
    .select({ count: sql<number>`count(*)::int` })
    .from(feedbackLog);

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
    promotedAt: new Date().toISOString(),
    isDefault: true,
  };
}

/**
 * Return champion snapshot history (most recent first).
 */
export async function getChampionHistory(limit = 20) {
  const rows = await policyIntelDb
    .select()
    .from(championSnapshots)
    .orderBy(desc(championSnapshots.promotedAt))
    .limit(limit);

  return rows.map((r) => ({
    generation: r.generation,
    weights: r.weightsJson as Record<string, number>,
    escalateThreshold: r.escalateThreshold,
    archiveThreshold: r.archiveThreshold,
    accuracy: r.accuracy,
    feedbackCount: r.feedbackCount,
    promotedAt: r.promotedAt.toISOString(),
    metadata: r.metadataJson,
  }));
}

// ── Feedback Recording ───────────────────────────────────────────────────────

export type FeedbackOutcome = "promoted" | "suppressed" | "strong_positive";

/**
 * Record a reviewer's feedback signal for an alert.
 * Called from the PATCH /alerts/:id handler.
 */
export async function recordFeedback(
  alertId: number,
  outcome: FeedbackOutcome,
  pipelineData: {
    originalScore: number;
    originalConfidence: number;
    agentScores: Record<string, unknown>[];
    weights: Record<string, number>;
    regime: string;
  },
): Promise<void> {
  await policyIntelDb.insert(feedbackLog).values({
    alertId,
    outcome,
    originalScore: pipelineData.originalScore,
    originalConfidence: pipelineData.originalConfidence,
    agentScoresJson: pipelineData.agentScores,
    weightsJson: pipelineData.weights,
    regime: pipelineData.regime,
  });

  metrics.inc("policy_intel_feedback_events_total", { outcome });
}

// ── Walk-Forward Trainer ─────────────────────────────────────────────────────

interface FeedbackRow {
  outcome: string;
  originalScore: number;
  agentScoresJson: Record<string, unknown>[];
  weightsJson: Record<string, number>;
  regime: string;
}

/**
 * Simulate scoring a feedback row with a given config.
 * Returns the predicted action (escalate/watch/archive) based on
 * re-weighted agent scores.
 */
function simulateScore(
  row: FeedbackRow,
  config: ChampionConfig,
): { totalScore: number; action: "escalate" | "watch" | "archive" } {
  // Extract agent scores from the stored agent scores JSON
  const agentMap: Record<string, { score: number; confidence: number }> = {};
  for (const entry of row.agentScoresJson) {
    const agent = entry.agent as string;
    if (agent && AGENT_NAMES.includes(agent)) {
      agentMap[agent] = {
        score: (entry.score as number) ?? 0,
        confidence: (entry.confidence as number) ?? 0.5,
      };
    }
  }

  // Normalise weights
  const w = { ...config.weights };
  const total = Object.values(w).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const k of Object.keys(w)) {
      w[k] = w[k] / total;
    }
  }

  // Weighted sum (same logic as metaWeigh, without regime deltas — already baked in)
  let weightedSum = 0;
  for (const name of AGENT_NAMES) {
    const a = agentMap[name];
    if (!a) continue;
    const weight = w[name] ?? 0;
    weightedSum += weight * a.score * a.confidence;
  }

  const totalScore = Math.round(Math.min(100, Math.max(0, weightedSum * 100)));

  let action: "escalate" | "watch" | "archive";
  if (totalScore >= config.escalateThreshold) {
    action = "escalate";
  } else if (totalScore <= config.archiveThreshold) {
    action = "archive";
  } else {
    action = "watch";
  }

  return { totalScore, action };
}

/**
 * Check if a predicted action agrees with the reviewer outcome.
 *  - promoted / strong_positive → should be escalate or watch (not archive)
 *  - suppressed → should be archive or watch (not escalate)
 */
function isCorrectPrediction(action: string, outcome: string): boolean {
  if (outcome === "promoted" || outcome === "strong_positive") {
    return action === "escalate" || action === "watch";
  }
  if (outcome === "suppressed") {
    return action === "archive" || action === "watch";
  }
  return true;
}

/**
 * Calculate accuracy of a config on a set of feedback rows.
 */
function evaluate(rows: FeedbackRow[], config: ChampionConfig): number {
  if (rows.length === 0) return 0;
  let correct = 0;
  for (const row of rows) {
    const { action } = simulateScore(row, config);
    if (isCorrectPrediction(action, row.outcome)) {
      correct++;
    }
  }
  return correct / rows.length;
}

/**
 * Coordinate-descent optimiser.
 * Sweeps each weight and threshold independently, keeping the best at each step.
 * Lightweight, deterministic, no external dependencies.
 */
function coordinateDescentOptimise(
  trainRows: FeedbackRow[],
  startConfig: ChampionConfig,
): ChampionConfig {
  let best = { ...startConfig, weights: { ...startConfig.weights } };
  let bestAcc = evaluate(trainRows, best);

  // Weight sweep: try shifting each agent weight by ±0.05
  const deltas = [-0.10, -0.05, 0.05, 0.10];

  for (let pass = 0; pass < 3; pass++) {
    for (const agent of AGENT_NAMES) {
      for (const delta of deltas) {
        const candidate: ChampionConfig = {
          weights: { ...best.weights },
          escalateThreshold: best.escalateThreshold,
          archiveThreshold: best.archiveThreshold,
        };
        candidate.weights[agent] = Math.max(0.02, (candidate.weights[agent] ?? 0.1) + delta);

        const acc = evaluate(trainRows, candidate);
        if (acc > bestAcc) {
          best = candidate;
          bestAcc = acc;
        }
      }
    }

    // Threshold sweep
    for (const escDelta of [-10, -5, 5, 10]) {
      for (const archDelta of [-10, -5, 5, 10]) {
        const candidate: ChampionConfig = {
          weights: { ...best.weights },
          escalateThreshold: Math.max(30, Math.min(90, best.escalateThreshold + escDelta)),
          archiveThreshold: Math.max(5, Math.min(50, best.archiveThreshold + archDelta)),
        };
        // Ensure escalate > archive
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

// ── Public Retrain API ───────────────────────────────────────────────────────

/**
 * Run a champion/challenger retraining cycle.
 *
 * 1. Load all feedback rows
 * 2. Split into train (80%) / holdout (20%)
 * 3. Optimise challenger on training set
 * 4. Evaluate both on holdout
 * 5. Promote if challenger ≥ champion + PROMOTION_MARGIN
 */
export async function runRetraining(): Promise<RetrainResult> {
  // Load feedback
  const rows = await policyIntelDb
    .select()
    .from(feedbackLog)
    .orderBy(desc(feedbackLog.createdAt));

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
      challengerThresholds: { escalate: 0, archive: 0 },
    };
  }

  // Shuffle deterministically (Fisher-Yates with seeded indices)
  const shuffled = [...rows];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = i % (Math.floor(i / 2) + 1); // deterministic pseudo-shuffle
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const splitIdx = Math.floor(shuffled.length * TRAIN_RATIO);
  const trainRows: FeedbackRow[] = shuffled.slice(0, splitIdx).map(toFeedbackRow);
  const holdoutRows: FeedbackRow[] = shuffled.slice(splitIdx).map(toFeedbackRow);

  // Get current champion config
  const championConfig = await getChampionConfig();
  const championAccuracy = evaluate(holdoutRows, championConfig);

  // Optimise challenger via coordinate descent
  const challengerConfig = coordinateDescentOptimise(trainRows, championConfig);
  const challengerAccuracy = evaluate(holdoutRows, challengerConfig);

  metrics.inc("policy_intel_champion_retrains_total");

  // Promotion decision
  const promoted = challengerAccuracy >= championAccuracy + PROMOTION_MARGIN;

  let newGeneration: number | null = null;

  if (promoted) {
    const currentStatus = await getChampionStatus();
    newGeneration = currentStatus.generation + 1;

    // Normalise challenger weights before persisting
    const wTotal = Object.values(challengerConfig.weights).reduce((s, v) => s + v, 0);
    const normWeights: Record<string, number> = {};
    for (const [k, v] of Object.entries(challengerConfig.weights)) {
      normWeights[k] = wTotal > 0 ? v / wTotal : 1 / AGENT_NAMES.length;
    }

    // Persist new champion
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
      },
    });

    // Invalidate cache so next pipeline run picks up new weights
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
      archive: challengerConfig.archiveThreshold,
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toFeedbackRow(row: typeof feedbackLog.$inferSelect): FeedbackRow {
  return {
    outcome: row.outcome,
    originalScore: row.originalScore,
    agentScoresJson: (row.agentScoresJson ?? []) as Record<string, unknown>[],
    weightsJson: (row.weightsJson ?? {}) as Record<string, number>,
    regime: row.regime,
  };
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

export interface BootstrapResult {
  sampled: number;
  feedbackGenerated: number;
  promoted: number;
  suppressed: number;
  skipped: number;
}

/**
 * Bootstrap feedback data from existing alerts using their stored evaluator
 * scores mapped to agent format, with the original relevance_score as the
 * labeling signal:
 *   originalScore ≥ 35 → "promoted"  (high-value alerts)
 *   originalScore ≤ 15 → "suppressed" (noise)
 *   16-34 → skipped (ambiguous)
 *
 * Maps old 4-evaluator format to 6-agent format:
 *   procedural_significance → procedural (0-25 → 0-1)
 *   matter_relevance       → relevance
 *   stakeholder_impact     → stakeholder
 *   actionability          → actionability
 *   (timeliness, regime get defaults)
 */
export async function bootstrapFeedback(sampleSize = 100): Promise<BootstrapResult> {
  // Check how many feedback entries already exist
  const [{ count: existingCount }] = await policyIntelDb
    .select({ count: sql<number>`count(*)::int` })
    .from(feedbackLog);

  // Don't bootstrap if we already have sufficient data
  if (existingCount >= MIN_FEEDBACK_FOR_RETRAIN * 3) {
    return { sampled: 0, feedbackGenerated: 0, promoted: 0, suppressed: 0, skipped: 0 };
  }

  // Get existing feedback alert IDs to avoid duplicates
  const existingFeedbackAlerts = await policyIntelDb
    .select({ alertId: feedbackLog.alertId })
    .from(feedbackLog);
  const feedbackAlertIds = new Set(existingFeedbackAlerts.map((r) => r.alertId));

  // Sample high-scoring alerts (≥35) for "promoted" labels
  const highAlerts = await policyIntelDb
    .select()
    .from(alerts)
    .where(sql`${alerts.relevanceScore} >= 35 AND ${alerts.reasonsJson}::text LIKE '%evaluator%'`)
    .orderBy(sql`RANDOM()`)
    .limit(Math.ceil(sampleSize * 0.5));

  // Sample low-scoring alerts (≤15) for "suppressed" labels
  const lowAlerts = await policyIntelDb
    .select()
    .from(alerts)
    .where(sql`${alerts.relevanceScore} <= 15 AND ${alerts.relevanceScore} > 0 AND ${alerts.reasonsJson}::text LIKE '%evaluator%'`)
    .orderBy(sql`RANDOM()`)
    .limit(Math.ceil(sampleSize * 0.5));

  const sample = [...highAlerts, ...lowAlerts];
  let feedbackGenerated = 0;
  let promoted = 0;
  let suppressed = 0;
  let skipped = 0;

  // Map evaluator name → agent name
  const EVALUATOR_TO_AGENT: Record<string, string> = {
    procedural_significance: "procedural",
    matter_relevance: "relevance",
    stakeholder_impact: "stakeholder",
    actionability: "actionability",
  };

  // Current champion config for stored weights
  const config = await getChampionConfig();

  for (const alert of sample) {
    if (feedbackAlertIds.has(alert.id)) {
      skipped++;
      continue;
    }

    try {
      // Parse evaluator scores from stored reasonsJson
      const reasons = (alert.reasonsJson ?? []) as Record<string, unknown>[];
      const evaluators = reasons.filter((r) => typeof r.evaluator === "string" && r.evaluator !== "_pipeline");

      // Map old evaluators to new agent format
      const agentScores: Record<string, unknown>[] = [];
      for (const ev of evaluators) {
        const agentName = EVALUATOR_TO_AGENT[ev.evaluator as string];
        if (agentName) {
          const rawScore = (ev.evaluatorScore as number) ?? 0;
          const maxScore = (ev.maxScore as number) ?? 25;
          agentScores.push({
            agent: agentName,
            score: rawScore / maxScore, // normalize to 0-1
            confidence: maxScore > 0 ? Math.min(1, rawScore / maxScore + 0.3) : 0.5,
            rationale: (ev.rationale as string) ?? "",
          });
        }
      }

      // Add defaults for timeliness and regime
      agentScores.push({
        agent: "timeliness",
        score: 0.5,
        confidence: 0.3,
        rationale: "bootstrap default",
      });
      agentScores.push({
        agent: "regime",
        score: 0.4,
        confidence: 0.3,
        rationale: "bootstrap default",
      });

      // Label based on original relevance score
      let outcome: FeedbackOutcome;
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
        regime: "interim", // most data is from interim periods
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
    skipped,
  };
}
