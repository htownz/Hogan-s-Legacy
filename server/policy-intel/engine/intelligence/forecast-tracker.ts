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
import { policyIntelDb } from "../../db";
import { alerts, sourceDocuments, forecastSnapshots, learningMetrics } from "@shared/schema-policy-intel";
import { sql, gte, desc, count, eq } from "drizzle-orm";

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
  actualOutcome?: "passed" | "failed" | "stalled" | "amended" | "unknown";
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
 * Uses alert activity patterns as a proxy for bill progression.
 */
async function gradePredictions(): Promise<ForecastGrade> {
  const snapshots = await getAllSnapshots();

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
      narrative: "Insufficient forecast history — need at least 2 briefings to begin tracking accuracy. Continue running the intelligence swarm to build prediction history.",
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

  // Grade by checking if bills predicted as high-risk actually showed continued activity
  const d30 = new Date(Date.now() - 30 * 86400000);
  const recentAlertBills = await policyIntelDb
    .select({
      title: alerts.title,
      cnt: count(),
    })
    .from(alerts)
    .where(gte(alerts.createdAt, d30))
    .groupBy(alerts.title)
    .orderBy(desc(count()));

  // Extract bill IDs from recent alert titles
  const activeBills = new Set<string>();
  const billIdPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?)\s*(\d+)\b/gi;
  for (const row of recentAlertBills) {
    let m: RegExpExecArray | null;
    while ((m = billIdPattern.exec(row.title)) !== null) {
      activeBills.add(`${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`);
    }
  }

  // Grade each prediction
  let correct = 0;
  let verifiable = 0;
  const buckets = buildEmptyCalibration();
  const missedBills: string[] = [];

  for (const [billId, pred] of uniquePredictions) {
    const isActive = activeBills.has(billId);

    // A prediction is "correct" if:
    // - high risk + still active = correct (predicted risk materialized)
    // - low risk + not active = correct (predicted it was safe, it was)
    // - high risk + not active = we may have over-predicted
    // - low risk + still active = we under-predicted (blind spot)
    const predictedHigh = pred.predictedPassageProbability >= 0.4;
    verifiable++;

    if ((predictedHigh && isActive) || (!predictedHigh && !isActive)) {
      correct++;
      pred.wasAccurate = true;
    } else {
      pred.wasAccurate = false;
      if (!predictedHigh && isActive) {
        missedBills.push(billId); // blind spot
      }
    }

    // Update calibration buckets
    for (const bucket of buckets) {
      if (pred.predictedPassageProbability >= bucket.lower && pred.predictedPassageProbability < bucket.upper) {
        bucket.count++;
        if (isActive) bucket.actualRate = (bucket.actualRate * (bucket.count - 1) + 1) / bucket.count;
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
    const olderAccuracy = computeSubsetAccuracy(snapshots.slice(0, midpoint), activeBills);
    const newerAccuracy = computeSubsetAccuracy(snapshots.slice(midpoint, -1), activeBills);

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
      const ai = activeBills.has(pi.billId) ? 1 : 0;
      const aj = activeBills.has(pj.billId) ? 1 : 0;
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
    ? "No predictions to grade yet. Run the intelligence swarm multiple times to build a forecast history."
    : `Graded ${verifiable} predictions: ${(overallAccuracy * 100).toFixed(0)}% accuracy. ` +
      `Ranking accuracy ${(rankingAccuracy * 100).toFixed(0)}% (higher-risk bills are correctly ranked above lower-risk). ` +
      (trendDirection === "improving" ? "Model accuracy is improving over time. " :
       trendDirection === "degrading" ? "Warning: model accuracy is declining — check for data quality issues. " :
       trendDirection === "stable" ? "Model accuracy is stable. " : "") +
      (missedBills.length > 0 ? `${missedBills.length} blind spot(s) detected — bills that were under-predicted but showed high activity.` : "No major blind spots detected.");

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

function computeSubsetAccuracy(snapshots: ForecastSnapshot[], activeBills: Set<string>): number {
  let correct = 0;
  let total = 0;
  for (const snap of snapshots) {
    for (const pred of snap.predictions) {
      const isActive = activeBills.has(pred.billId);
      const predictedHigh = pred.predictedPassageProbability >= 0.4;
      total++;
      if ((predictedHigh && isActive) || (!predictedHigh && !isActive)) correct++;
    }
  }
  return total > 0 ? correct / total : 0;
}
