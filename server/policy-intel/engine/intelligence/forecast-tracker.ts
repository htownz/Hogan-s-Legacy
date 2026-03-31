/**
 * Forecast Tracker — the system's learning engine.
 *
 * This is what separates a reporting tool from an intelligence system.
 * It answers: "Are we getting smarter?"
 *
 * Capabilities:
 * - Stores snapshots of each briefing's predictions for later grading
 * - Tracks forecast accuracy: did high-risk bills actually pass?
 * - Measures calibration: when we say 70% passage, does it pass ~70% of the time?
 * - Detects model drift: is the risk model becoming less accurate over time?
 * - Identifies blind spots: categories of bills we consistently miss
 * - Computes delta between current briefing and previous for "what changed"
 *
 * This creates an institutional memory — the system learns from its own history.
 */
import { policyIntelDb, queryClient } from "../../db";
import {
  billOutcomeSnapshots,
  forecastSnapshots,
  learningMetrics,
  sourceDocuments,
} from "@shared/schema-policy-intel";
import { desc, count, eq } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ForecastSnapshot {
  /** Unique snapshot ID (ISO date-based) */
  snapshotId: string;
  capturedAt: string;
  /** Bill-level predictions at snapshot time */
  predictions: BillPrediction[];
  /** Model metadata */
  regime: string;
  totalInsights: number;
  criticalRiskCount: number;
  anomalyCount: number;
}

export interface BillPrediction {
  billId: string;
  predictedStage: string;
  predictedPassageProbability: number;
  predictedRiskLevel: string;
  riskScore: number;
  /** Populated later when we grade the forecast */
  actualOutcome?: "active" | "passed" | "failed" | "stalled" | "amended" | "unknown";
  wasAccurate?: boolean;
}

export interface ForecastGrade {
  /** Time window graded */
  windowStart: string;
  windowEnd: string;
  /** How many predictions were made */
  totalPredictions: number;
  /** How many we could verify (had actual outcome data) */
  verifiablePredictions: number;
  /** Accuracy metrics */
  accuracy: {
    /** Overall: correct / verifiable */
    overall: number;
    /** Calibration: for predictions in each bucket, what % actually occurred? */
    calibration: CalibrationBucket[];
    /** Did we correctly rank higher-risk bills above lower-risk ones? */
    rankingAccuracy: number;
  };
  /** Which categories of bills do we miss most? */
  blindSpots: BlindSpot[];
  /** Is the model getting better or worse? */
  trendDirection: "improving" | "stable" | "degrading" | "insufficient_data";
  /** Human-readable assessment */
  narrative: string;
}

export interface CalibrationBucket {
  /** Predicted probability range label */
  range: string;
  /** Lower bound of bucket */
  lower: number;
  /** Upper bound of bucket */
  upper: number;
  /** How many predictions fell in this bucket */
  count: number;
  /** What fraction actually occurred (actual rate) */
  actualRate: number;
  /** Perfect calibration = actualRate equals midpoint of range */
  calibrationError: number;
}

export interface BlindSpot {
  category: string;
  description: string;
  missCount: number;
  examples: string[];
}

export interface DeltaBriefing {
  /** Compared against this previous snapshot */
  previousSnapshotId: string | null;
  previousCapturedAt: string | null;
  /** What changed since last analysis */
  newRisks: string[];
  resolvedRisks: string[];
  escalatedRisks: Array<{ billId: string; previousLevel: string; currentLevel: string }>;
  deescalatedRisks: Array<{ billId: string; previousLevel: string; currentLevel: string }>;
  newAnomalies: number;
  resolvedAnomalies: number;
  newClusters: number;
  /** Net change in threat level */
  threatTrend: "escalating" | "stable" | "deescalating";
  /** Summary narrative */
  narrative: string;
}

export interface ForecastReport {
  analyzedAt: string;
  currentSnapshot: ForecastSnapshot;
  delta: DeltaBriefing;
  grade: ForecastGrade;
  /** How many historical snapshots we have */
  historyDepth: number;
}

export interface ForecastDriftSummary {
  metricType: "forecast_calibration";
  points: Array<{
    capturedAt: string;
    regime: string;
    accuracy: number;
    rankingAccuracy: number;
    verifiablePredictions: number;
  }>;
  latestAccuracy: number | null;
  baselineAccuracy: number | null;
  deltaAccuracy: number | null;
  latestRankingAccuracy: number | null;
  deltaRankingAccuracy: number | null;
  trend: "improving" | "stable" | "degrading" | "insufficient_data";
  driftAlert: boolean;
  narrative: string;
}

interface BillOutcomeTruth {
  billId: string;
  stage: string;
  outcome: "active" | "passed" | "failed" | "stalled" | "amended" | "unknown";
  statusText: string;
  sourceDocumentId: number | null;
  publishedAt: string | null;
}

const BILL_ID_PATTERN = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/i;
const OUTCOME_SNAPSHOT_STALE_HOURS = 18;
let outcomeTruthPersistenceReady = false;

async function ensureOutcomeTruthPersistence(): Promise<void> {
  if (outcomeTruthPersistenceReady) return;

  await queryClient.unsafe(`
    do $$
    begin
      create type policy_intel_bill_outcome as enum ('active', 'passed', 'failed', 'stalled', 'amended', 'unknown');
    exception
      when duplicate_object then null;
    end
    $$;
  `);

  await queryClient.unsafe(`
    create table if not exists policy_intel_bill_outcome_snapshots (
      id serial primary key,
      snapshot_key varchar(16) not null,
      captured_at timestamptz not null default now(),
      bill_id varchar(64) not null,
      stage varchar(64) not null default 'unknown',
      outcome policy_intel_bill_outcome not null default 'unknown',
      status_text text,
      source_document_id integer references policy_intel_source_documents(id) on delete set null,
      published_at timestamptz,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);

  await queryClient.unsafe(`
    create unique index if not exists policy_intel_bill_outcome_snapshot_bill_idx
    on policy_intel_bill_outcome_snapshots (snapshot_key, bill_id)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_bill_outcome_snapshot_idx
    on policy_intel_bill_outcome_snapshots (snapshot_key, captured_at)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_bill_outcome_outcome_idx
    on policy_intel_bill_outcome_snapshots (outcome)
  `);

  outcomeTruthPersistenceReady = true;
}

function utcSnapshotKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeBillId(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .replace(/\./g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  return normalized || null;
}

function extractBillIdFromTitle(title: string | null | undefined): string | null {
  const text = title ?? "";
  const match = text.match(BILL_ID_PATTERN);
  if (!match) return null;
  return normalizeBillId(`${match[1]} ${match[2]}`);
}

function getPayloadRecord(rawPayload: unknown): Record<string, unknown> {
  if (rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)) {
    return rawPayload as Record<string, unknown>;
  }
  return {};
}

function classifyOutcome(statusText: string, lastActionText: string): BillOutcomeTruth["outcome"] {
  const text = `${statusText} ${lastActionText}`.toLowerCase();

  if (/\b(amended|committee substitute|substitute adopted|engrossed as amended)\b/.test(text)) {
    return "amended";
  }

  if (/\b(signed|enrolled|chaptered|effective|became law|sent to governor|governor signed|passed both|adopted final)\b/.test(text)) {
    return "passed";
  }

  if (/\b(failed|defeated|killed|died|vetoed|withdrawn|stricken|lost|rejected)\b/.test(text)) {
    return "failed";
  }

  if (/\b(left pending|held in committee|stalled|tabled|postponed indefinitely)\b/.test(text)) {
    return "stalled";
  }

  if (/\b(referred|reported|considered|in committee|on floor|calendar)\b/.test(text)) {
    return "active";
  }

  return "unknown";
}

function classifyStage(statusText: string, lastActionText: string): string {
  const text = `${statusText} ${lastActionText}`.toLowerCase();

  if (/\b(governor|signed|veto|chaptered|effective|became law)\b/.test(text)) return "governor";
  if (/\b(passed both|final passage|conference|concurrence)\b/.test(text)) return "final_passage";
  if (/\b(second reading|third reading|on floor|calendar|engrossed)\b/.test(text)) return "floor";
  if (/\b(referred|committee|public hearing|left pending|reported favorably)\b/.test(text)) return "committee";
  if (/\b(prefiled|filed|introduced|read first time)\b/.test(text)) return "introduced";
  return "unknown";
}

function resolveBillIdFromDocument(doc: {
  title: string | null;
  rawPayload: unknown;
}): string | null {
  const payload = getPayloadRecord(doc.rawPayload);
  const payloadBillId =
    (typeof payload.billId === "string" ? payload.billId : null) ??
    (typeof payload.billNumber === "string" ? payload.billNumber : null);

  return normalizeBillId(payloadBillId) ?? extractBillIdFromTitle(doc.title);
}

function resolveStatusText(payload: Record<string, unknown>): string {
  const status = typeof payload.status === "string" ? payload.status : "";
  const statusCode = payload.statusCode !== undefined && payload.statusCode !== null ? String(payload.statusCode) : "";
  return `${status} ${statusCode}`.trim();
}

function resolveLastActionText(payload: Record<string, unknown>): string {
  const raw = payload.lastAction;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const action = (raw as Record<string, unknown>).action;
    if (typeof action === "string") return action;
  }
  return "";
}

function outcomeToBinary(outcome: BillOutcomeTruth["outcome"]): 1 | 0 | null {
  if (outcome === "passed" || outcome === "amended") return 1;
  if (outcome === "failed" || outcome === "stalled") return 0;
  return null;
}

async function latestOutcomeSnapshotMeta(): Promise<{ snapshotKey: string; capturedAt: Date } | null> {
  await ensureOutcomeTruthPersistence();
  const [row] = await policyIntelDb
    .select({
      snapshotKey: billOutcomeSnapshots.snapshotKey,
      capturedAt: billOutcomeSnapshots.capturedAt,
    })
    .from(billOutcomeSnapshots)
    .orderBy(desc(billOutcomeSnapshots.snapshotKey), desc(billOutcomeSnapshots.capturedAt))
    .limit(1);

  if (!row) return null;
  return row;
}

export async function refreshOutcomeTruthSnapshot(snapshotKey = utcSnapshotKey(new Date())): Promise<{
  snapshotKey: string;
  capturedAt: string;
  billsCaptured: number;
}> {
  await ensureOutcomeTruthPersistence();
  const capturedAt = new Date();
  const docs = await policyIntelDb
    .select({
      id: sourceDocuments.id,
      title: sourceDocuments.title,
      rawPayload: sourceDocuments.rawPayload,
      publishedAt: sourceDocuments.publishedAt,
    })
    .from(sourceDocuments)
    .where(eq(sourceDocuments.sourceType, "texas_legislation"))
    .orderBy(desc(sourceDocuments.publishedAt), desc(sourceDocuments.id));

  const latestByBill = new Map<string, BillOutcomeTruth>();
  for (const doc of docs) {
    const billId = resolveBillIdFromDocument(doc);
    if (!billId || latestByBill.has(billId)) continue;

    const payload = getPayloadRecord(doc.rawPayload);
    const statusText = resolveStatusText(payload);
    const lastActionText = resolveLastActionText(payload);

    latestByBill.set(billId, {
      billId,
      stage: classifyStage(statusText, lastActionText),
      outcome: classifyOutcome(statusText, lastActionText),
      statusText: `${statusText} ${lastActionText}`.trim(),
      sourceDocumentId: doc.id,
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    });
  }

  await policyIntelDb
    .delete(billOutcomeSnapshots)
    .where(eq(billOutcomeSnapshots.snapshotKey, snapshotKey));

  const rows = Array.from(latestByBill.values()).map((entry) => ({
    snapshotKey,
    capturedAt,
    billId: entry.billId,
    stage: entry.stage,
    outcome: entry.outcome,
    statusText: entry.statusText || null,
    sourceDocumentId: entry.sourceDocumentId,
    publishedAt: entry.publishedAt ? new Date(entry.publishedAt) : null,
    metadataJson: {},
  }));

  const batchSize = 500;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    await policyIntelDb.insert(billOutcomeSnapshots).values(batch);
  }

  return {
    snapshotKey,
    capturedAt: capturedAt.toISOString(),
    billsCaptured: rows.length,
  };
}

async function ensureOutcomeTruthSnapshot(): Promise<{
  snapshotKey: string;
  outcomes: Map<string, BillOutcomeTruth>;
}> {
  const now = new Date();
  const targetKey = utcSnapshotKey(now);
  const latest = await latestOutcomeSnapshotMeta();

  const latestAgeMs = latest ? now.getTime() - latest.capturedAt.getTime() : Number.POSITIVE_INFINITY;
  const shouldRefresh =
    !latest
    || latest.snapshotKey !== targetKey
    || latestAgeMs > OUTCOME_SNAPSHOT_STALE_HOURS * 60 * 60 * 1000;

  const snapshotKey = shouldRefresh
    ? (await refreshOutcomeTruthSnapshot(targetKey)).snapshotKey
    : latest!.snapshotKey;

  const rows = await policyIntelDb
    .select()
    .from(billOutcomeSnapshots)
    .where(eq(billOutcomeSnapshots.snapshotKey, snapshotKey));

  const outcomes = new Map<string, BillOutcomeTruth>();
  for (const row of rows) {
    outcomes.set(row.billId, {
      billId: row.billId,
      stage: row.stage,
      outcome: row.outcome,
      statusText: row.statusText ?? "",
      sourceDocumentId: row.sourceDocumentId ?? null,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    });
  }

  return { snapshotKey, outcomes };
}

export async function getLatestOutcomeTruthSnapshotSummary(): Promise<{
  snapshotKey: string | null;
  capturedAt: string | null;
  totalBills: number;
  outcomeCounts: Record<string, number>;
}> {
  await ensureOutcomeTruthPersistence();
  const latest = await latestOutcomeSnapshotMeta();
  if (!latest) {
    return {
      snapshotKey: null,
      capturedAt: null,
      totalBills: 0,
      outcomeCounts: {},
    };
  }

  const rows = await policyIntelDb
    .select({ outcome: billOutcomeSnapshots.outcome, cnt: count() })
    .from(billOutcomeSnapshots)
    .where(eq(billOutcomeSnapshots.snapshotKey, latest.snapshotKey))
    .groupBy(billOutcomeSnapshots.outcome);

  const outcomeCounts: Record<string, number> = {};
  for (const row of rows) {
    outcomeCounts[row.outcome] = Number(row.cnt ?? 0);
  }

  const totalBills = Object.values(outcomeCounts).reduce((acc, next) => acc + next, 0);
  return {
    snapshotKey: latest.snapshotKey,
    capturedAt: latest.capturedAt.toISOString(),
    totalBills,
    outcomeCounts,
  };
}

function metricNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function getForecastDriftSummary(limit = 24): Promise<ForecastDriftSummary> {
  const normalizedLimit = Math.max(2, Math.min(120, Math.floor(Number(limit) || 24)));
  const rows = await policyIntelDb
    .select()
    .from(learningMetrics)
    .where(eq(learningMetrics.metricType, "forecast_calibration"))
    .orderBy(desc(learningMetrics.capturedAt))
    .limit(normalizedLimit);

  const points = rows
    .slice()
    .reverse()
    .map((row) => {
      const values = row.valuesJson ?? {};
      return {
        capturedAt: row.capturedAt.toISOString(),
        regime: row.regime,
        accuracy: metricNumber(values.accuracy) ?? 0,
        rankingAccuracy: metricNumber(values.rankingAccuracy) ?? 0,
        verifiablePredictions: Math.max(0, Math.floor(metricNumber(values.verifiablePredictions) ?? 0)),
      };
    });

  if (points.length < 2) {
    return {
      metricType: "forecast_calibration",
      points,
      latestAccuracy: points[0]?.accuracy ?? null,
      baselineAccuracy: points[0]?.accuracy ?? null,
      deltaAccuracy: null,
      latestRankingAccuracy: points[0]?.rankingAccuracy ?? null,
      deltaRankingAccuracy: null,
      trend: "insufficient_data",
      driftAlert: false,
      narrative: "Not enough calibration history yet to detect drift; at least 2 forecast calibration points are required.",
    };
  }

  const baseline = points[0];
  const latest = points[points.length - 1];
  const deltaAccuracy = latest.accuracy - baseline.accuracy;
  const deltaRankingAccuracy = latest.rankingAccuracy - baseline.rankingAccuracy;

  const trend: ForecastDriftSummary["trend"] =
    deltaAccuracy > 0.05
      ? "improving"
      : deltaAccuracy < -0.05
        ? "degrading"
        : "stable";

  const recentWindow = points.slice(-Math.min(4, points.length));
  const recentDeclines = recentWindow
    .slice(1)
    .filter((point, idx) => point.accuracy < recentWindow[idx].accuracy).length;
  const driftAlert = trend === "degrading" && (latest.accuracy < 0.55 || recentDeclines >= 2);

  const narrative =
    `Calibration trend is ${trend.toUpperCase()} over ${points.length} checkpoints ` +
    `(accuracy delta ${(deltaAccuracy * 100).toFixed(1)}pp, ranking delta ${(deltaRankingAccuracy * 100).toFixed(1)}pp).` +
    (driftAlert
      ? " Drift alert: recent forecast quality is deteriorating and should trigger model review."
      : " No drift alert threshold is currently exceeded.");

  return {
    metricType: "forecast_calibration",
    points,
    latestAccuracy: latest.accuracy,
    baselineAccuracy: baseline.accuracy,
    deltaAccuracy,
    latestRankingAccuracy: latest.rankingAccuracy,
    deltaRankingAccuracy,
    trend,
    driftAlert,
    narrative,
  };
}

// ── DB-Backed Snapshot Store ─────────────────────────────────────────────────
// Persists forecast snapshots to PostgreSQL so prediction grading survives
// server restarts — critical for the learning loop.

const MAX_SNAPSHOTS = 200;

async function storeSnapshot(snapshot: ForecastSnapshot): Promise<void> {
  await policyIntelDb.insert(forecastSnapshots).values({
    snapshotId: snapshot.snapshotId,
    capturedAt: new Date(snapshot.capturedAt),
    predictionsJson: snapshot.predictions as unknown as Record<string, unknown>[],
    regime: snapshot.regime,
    totalInsights: snapshot.totalInsights,
    criticalRiskCount: snapshot.criticalRiskCount,
    anomalyCount: snapshot.anomalyCount,
  });

  // Prune old snapshots beyond MAX_SNAPSHOTS
  const countResult = await policyIntelDb
    .select({ cnt: count() })
    .from(forecastSnapshots);
  const total = Number(countResult[0]?.cnt ?? 0);
  if (total > MAX_SNAPSHOTS) {
    const oldest = await policyIntelDb
      .select({ id: forecastSnapshots.id })
      .from(forecastSnapshots)
      .orderBy(forecastSnapshots.capturedAt)
      .limit(total - MAX_SNAPSHOTS);
    for (const row of oldest) {
      await policyIntelDb.delete(forecastSnapshots).where(eq(forecastSnapshots.id, row.id));
    }
  }
}

async function getLatestSnapshot(): Promise<ForecastSnapshot | null> {
  const [row] = await policyIntelDb
    .select()
    .from(forecastSnapshots)
    .orderBy(desc(forecastSnapshots.capturedAt))
    .limit(1);
  if (!row) return null;
  return dbRowToSnapshot(row);
}

async function getAllSnapshots(): Promise<ForecastSnapshot[]> {
  const rows = await policyIntelDb
    .select()
    .from(forecastSnapshots)
    .orderBy(forecastSnapshots.capturedAt)
    .limit(MAX_SNAPSHOTS);
  return rows.map(dbRowToSnapshot);
}

function dbRowToSnapshot(row: typeof forecastSnapshots.$inferSelect): ForecastSnapshot {
  return {
    snapshotId: row.snapshotId,
    capturedAt: row.capturedAt.toISOString(),
    predictions: (row.predictionsJson ?? []) as unknown as BillPrediction[],
    regime: row.regime,
    totalInsights: row.totalInsights,
    criticalRiskCount: row.criticalRiskCount,
    anomalyCount: row.anomalyCount,
  };
}

// ── Core Analysis ────────────────────────────────────────────────────────────

/**
 * Grade historical forecasts by checking if predicted bill outcomes matched reality.
 * Uses bill outcome-truth snapshots instead of alert-activity proxies.
 */
async function gradePredictions(): Promise<ForecastGrade> {
  const snapshots = await getAllSnapshots();
  const { snapshotKey, outcomes } = await ensureOutcomeTruthSnapshot();

  if (snapshots.length < 2) {
    return {
      windowStart: new Date().toISOString(),
      windowEnd: new Date().toISOString(),
      totalPredictions: 0,
      verifiablePredictions: 0,
      accuracy: {
        overall: 0,
        calibration: buildEmptyCalibration(),
        rankingAccuracy: 0,
      },
      blindSpots: [],
      trendDirection: "insufficient_data",
      narrative: `Insufficient forecast history — need at least 2 briefings to begin tracking accuracy. Outcome-truth snapshot ${snapshotKey} is ready for grading once more predictions accumulate.`,
    };
  }

  // Look at predictions from older snapshots (not the most recent)
  // and see if the bill progressed as predicted
  const olderSnapshots = snapshots.slice(0, -1);
  const allPredictions: BillPrediction[] = [];

  for (const snap of olderSnapshots) {
    allPredictions.push(...snap.predictions);
  }

  // Deduplicate by billId — use the earliest prediction for each bill
  const uniquePredictions = new Map<string, BillPrediction>();
  for (const p of allPredictions) {
    if (!uniquePredictions.has(p.billId)) {
      uniquePredictions.set(p.billId, { ...p });
    }
  }

  // Grade each prediction
  let correct = 0;
  let verifiable = 0;
  const buckets = buildEmptyCalibration();
  const missedBills: string[] = [];

  for (const [billId, pred] of uniquePredictions) {
    const normalizedBillId = normalizeBillId(billId) ?? billId;
    const truth = outcomes.get(normalizedBillId);
    const actual = truth ? outcomeToBinary(truth.outcome) : null;
    if (actual === null) {
      pred.actualOutcome = truth?.outcome ?? "unknown";
      continue;
    }

    const predictedPass = pred.predictedPassageProbability >= 0.5;
    const didPass = actual === 1;
    verifiable++;
    pred.actualOutcome = truth?.outcome ?? "unknown";

    if ((predictedPass && didPass) || (!predictedPass && !didPass)) {
      correct++;
      pred.wasAccurate = true;
    } else {
      pred.wasAccurate = false;
      if (!predictedPass && didPass) {
        missedBills.push(billId);
      }
    }

    // Update calibration buckets
    for (const bucket of buckets) {
      if (pred.predictedPassageProbability >= bucket.lower && pred.predictedPassageProbability < bucket.upper) {
        bucket.count++;
        if (didPass) bucket.actualRate = (bucket.actualRate * (bucket.count - 1) + 1) / bucket.count;
        else bucket.actualRate = (bucket.actualRate * (bucket.count - 1)) / bucket.count;
        bucket.calibrationError = Math.abs(bucket.actualRate - (bucket.lower + bucket.upper) / 2);
        break;
      }
    }
  }

  const overallAccuracy = verifiable > 0 ? correct / verifiable : 0;

  // Check trend: compare accuracy of recent vs. older predictions
  let trendDirection: ForecastGrade["trendDirection"] = "insufficient_data";
  if (snapshots.length >= 4) {
    const midpoint = Math.floor(snapshots.length / 2);
    const olderAccuracy = computeSubsetAccuracy(snapshots.slice(0, midpoint), outcomes);
    const newerAccuracy = computeSubsetAccuracy(snapshots.slice(midpoint, -1), outcomes);

    if (newerAccuracy > olderAccuracy + 0.05) trendDirection = "improving";
    else if (newerAccuracy < olderAccuracy - 0.05) trendDirection = "degrading";
    else trendDirection = "stable";
  }

  // Build blind spots
  const blindSpots: BlindSpot[] = [];
  if (missedBills.length > 0) {
    blindSpots.push({
      category: "Under-predicted bills",
      description: `${missedBills.length} bill(s) were assessed as low risk but showed continued high activity — these may have been under-monitored.`,
      missCount: missedBills.length,
      examples: missedBills.slice(0, 5),
    });
  }

  // Compute ranking accuracy (Kendall-style: do higher predictions correspond to active bills?)
  let concordant = 0;
  let discordant = 0;
  const predsArray = Array.from(uniquePredictions.values());
  for (let i = 0; i < Math.min(predsArray.length, 50); i++) {
    for (let j = i + 1; j < Math.min(predsArray.length, 50); j++) {
      const pi = predsArray[i];
      const pj = predsArray[j];

      const ti = outcomes.get(normalizeBillId(pi.billId) ?? pi.billId);
      const tj = outcomes.get(normalizeBillId(pj.billId) ?? pj.billId);
      const ai = ti ? outcomeToBinary(ti.outcome) : null;
      const aj = tj ? outcomeToBinary(tj.outcome) : null;
      if (ai === null || aj === null) continue;

      if ((pi.predictedPassageProbability > pj.predictedPassageProbability && ai > aj) ||
          (pi.predictedPassageProbability < pj.predictedPassageProbability && ai < aj)) {
        concordant++;
      } else if ((pi.predictedPassageProbability > pj.predictedPassageProbability && ai < aj) ||
                 (pi.predictedPassageProbability < pj.predictedPassageProbability && ai > aj)) {
        discordant++;
      }
    }
  }
  const rankingAccuracy = (concordant + discordant) > 0 ? concordant / (concordant + discordant) : 0.5;

  const narrative = verifiable === 0
    ? `No predictions are yet verifiable against outcome truth snapshot ${snapshotKey}.`
    : `Graded ${verifiable} predictions: ${(overallAccuracy * 100).toFixed(0)}% accuracy. ` +
      `Ranking accuracy ${(rankingAccuracy * 100).toFixed(0)}% (higher predicted passage aligned with actual outcomes). ` +
      (trendDirection === "improving" ? "Model accuracy is improving over time. " :
       trendDirection === "degrading" ? "Warning: model accuracy is declining — check for data quality issues. " :
       trendDirection === "stable" ? "Model accuracy is stable. " : "") +
      (missedBills.length > 0
        ? `${missedBills.length} blind spot(s) detected — bills under-predicted for passage but later passed/amended.`
        : `No major blind spots detected in outcome snapshot ${snapshotKey}.`);

  return {
    windowStart: snapshots[0].capturedAt,
    windowEnd: snapshots[snapshots.length - 1].capturedAt,
    totalPredictions: uniquePredictions.size,
    verifiablePredictions: verifiable,
    accuracy: {
      overall: Math.round(overallAccuracy * 100) / 100,
      calibration: buckets,
      rankingAccuracy: Math.round(rankingAccuracy * 100) / 100,
    },
    blindSpots,
    trendDirection,
    narrative,
  };
}

/**
 * Compute delta between current and previous briefing.
 */
export async function computeDelta(
  currentPredictions: BillPrediction[],
  currentAnomalyCount: number,
  currentClusterCount: number,
): Promise<DeltaBriefing> {
  const previous = await getLatestSnapshot();

  if (!previous) {
    return {
      previousSnapshotId: null,
      previousCapturedAt: null,
      newRisks: currentPredictions.filter(p => p.riskScore >= 40).map(p => p.billId),
      resolvedRisks: [],
      escalatedRisks: [],
      deescalatedRisks: [],
      newAnomalies: currentAnomalyCount,
      resolvedAnomalies: 0,
      newClusters: currentClusterCount,
      threatTrend: "stable",
      narrative: "First analysis — no previous briefing to compare against. Future briefings will track changes automatically.",
    };
  }

  const prevBills = new Map(previous.predictions.map(p => [p.billId, p]));
  const currBills = new Map(currentPredictions.map(p => [p.billId, p]));

  const newRisks: string[] = [];
  const resolvedRisks: string[] = [];
  const escalated: DeltaBriefing["escalatedRisks"] = [];
  const deescalated: DeltaBriefing["deescalatedRisks"] = [];

  const riskOrder: Record<string, number> = { critical: 4, high: 3, elevated: 2, moderate: 1, low: 0 };

  for (const [billId, curr] of currBills) {
    const prev = prevBills.get(billId);
    if (!prev) {
      if (curr.riskScore >= 40) newRisks.push(billId);
    } else {
      const prevOrd = riskOrder[prev.predictedRiskLevel] ?? 0;
      const currOrd = riskOrder[curr.predictedRiskLevel] ?? 0;
      if (currOrd > prevOrd) {
        escalated.push({ billId, previousLevel: prev.predictedRiskLevel, currentLevel: curr.predictedRiskLevel });
      } else if (currOrd < prevOrd) {
        deescalated.push({ billId, previousLevel: prev.predictedRiskLevel, currentLevel: curr.predictedRiskLevel });
      }
    }
  }

  for (const [billId, prev] of prevBills) {
    if (!currBills.has(billId) && prev.riskScore >= 40) {
      resolvedRisks.push(billId);
    }
  }

  const resolvedAnomalies = Math.max(0, previous.anomalyCount - currentAnomalyCount);
  const newAnomalies = Math.max(0, currentAnomalyCount - previous.anomalyCount);

  const threatTrend: DeltaBriefing["threatTrend"] =
    (escalated.length > deescalated.length + 2 || newRisks.length > resolvedRisks.length + 2) ? "escalating" :
    (deescalated.length > escalated.length + 2 || resolvedRisks.length > newRisks.length + 2) ? "deescalating" :
    "stable";

  const parts: string[] = [];
  if (newRisks.length > 0) parts.push(`${newRisks.length} new risk(s) emerged`);
  if (resolvedRisks.length > 0) parts.push(`${resolvedRisks.length} risk(s) resolved`);
  if (escalated.length > 0) parts.push(`${escalated.length} bill(s) escalated in risk level`);
  if (deescalated.length > 0) parts.push(`${deescalated.length} bill(s) de-escalated`);
  if (newAnomalies > 0) parts.push(`${newAnomalies} new anomalies`);
  if (resolvedAnomalies > 0) parts.push(`${resolvedAnomalies} anomalies resolved`);

  const narrative = parts.length === 0
    ? `No significant changes since last analysis (${new Date(previous.capturedAt).toLocaleDateString()}). The legislative landscape is stable.`
    : `Since last analysis (${new Date(previous.capturedAt).toLocaleDateString()}): ${parts.join("; ")}. ` +
      `Overall threat trend: ${threatTrend.toUpperCase()}.`;

  return {
    previousSnapshotId: previous.snapshotId,
    previousCapturedAt: previous.capturedAt,
    newRisks,
    resolvedRisks,
    escalatedRisks: escalated,
    deescalatedRisks: deescalated,
    newAnomalies,
    resolvedAnomalies,
    newClusters: currentClusterCount - (previous.predictions.length > 0 ? 0 : 0), // rough
    threatTrend,
    narrative,
  };
}

/**
 * Capture a snapshot from the current risk assessments for future grading.
 */
export async function captureSnapshot(
  predictions: BillPrediction[],
  regime: string,
  insightCount: number,
  criticalRiskCount: number,
  anomalyCount: number,
): Promise<ForecastSnapshot> {
  const snapshot: ForecastSnapshot = {
    snapshotId: `snap-${Date.now()}`,
    capturedAt: new Date().toISOString(),
    predictions,
    regime,
    totalInsights: insightCount,
    criticalRiskCount,
    anomalyCount,
  };
  await storeSnapshot(snapshot);
  return snapshot;
}

/**
 * Run the full forecast analysis.
 */
export async function analyzeForecast(
  predictions: BillPrediction[],
  regime: string,
  insightCount: number,
  criticalRiskCount: number,
  anomalyCount: number,
  clusterCount: number,
): Promise<ForecastReport> {
  // 1. Compute delta against previous snapshot
  const delta = await computeDelta(predictions, anomalyCount, clusterCount);

  // 2. Grade historical predictions
  const grade = await gradePredictions();

  // 3. Store the current snapshot for future grading
  const snapshot = await captureSnapshot(predictions, regime, insightCount, criticalRiskCount, anomalyCount);

  // 4. Persist calibration data for risk model auto-adjustment
  if (grade.verifiablePredictions > 0) {
    await policyIntelDb.insert(learningMetrics).values({
      metricType: "forecast_calibration",
      regime,
      valuesJson: {
        accuracy: grade.accuracy.overall,
        rankingAccuracy: grade.accuracy.rankingAccuracy,
        calibrationBuckets: grade.accuracy.calibration,
        blindSpotCount: grade.blindSpots.length,
        trendDirection: grade.trendDirection,
        verifiablePredictions: grade.verifiablePredictions,
      } as unknown as Record<string, unknown>,
    });
  }

  const allSnaps = await getAllSnapshots();

  return {
    analyzedAt: new Date().toISOString(),
    currentSnapshot: snapshot,
    delta,
    grade,
    historyDepth: allSnaps.length,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildEmptyCalibration(): CalibrationBucket[] {
  return [
    { range: "0-20%", lower: 0, upper: 0.2, count: 0, actualRate: 0, calibrationError: 0 },
    { range: "20-40%", lower: 0.2, upper: 0.4, count: 0, actualRate: 0, calibrationError: 0 },
    { range: "40-60%", lower: 0.4, upper: 0.6, count: 0, actualRate: 0, calibrationError: 0 },
    { range: "60-80%", lower: 0.6, upper: 0.8, count: 0, actualRate: 0, calibrationError: 0 },
    { range: "80-100%", lower: 0.8, upper: 1.01, count: 0, actualRate: 0, calibrationError: 0 },
  ];
}

function computeSubsetAccuracy(snapshots: ForecastSnapshot[], outcomes: Map<string, BillOutcomeTruth>): number {
  let correct = 0;
  let total = 0;
  for (const snap of snapshots) {
    for (const pred of snap.predictions) {
      const truth = outcomes.get(normalizeBillId(pred.billId) ?? pred.billId);
      const actual = truth ? outcomeToBinary(truth.outcome) : null;
      if (actual === null) continue;

      const predictedPass = pred.predictedPassageProbability >= 0.5;
      const didPass = actual === 1;
      total++;
      if ((predictedPass && didPass) || (!predictedPass && !didPass)) correct++;
    }
  }
  return total > 0 ? correct / total : 0;
}
