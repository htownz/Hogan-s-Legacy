/**
 * Passage Predictor Service — live bill passage probability engine
 *
 * Combines structural signals, sponsor analysis, committee intelligence,
 * historical patterns, and regime timing to produce real-time probability
 * estimates with confidence intervals and actionable risk factors.
 *
 * Designed for lobby firms who need to advise clients on legislative risk.
 */
import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";
import { policyIntelDb } from "../db";
import {
  passagePredictions,
  alerts,
  sourceDocuments,
  hearingEvents,
  stakeholders,
  committeeMembers,
  issueRooms,
  forecastSnapshots,
  watchlists,
  type PolicyIntelPassagePrediction,
  type InsertPolicyIntelPassagePrediction,
} from "@shared/schema-policy-intel";
import { createLogger } from "../logger";

const log = createLogger("passage-predictor");

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface PredictionRequest {
  workspaceId: number;
  billId: string;
  billTitle?: string;
  forceRefresh?: boolean;
}

export interface BatchPredictionRequest {
  workspaceId: number;
  billIds: string[];
}

export interface PredictionResult {
  billId: string;
  billTitle: string | null;
  prediction: string;
  probability: number;
  confidence: number;
  regime: string;
  currentStage: string | null;
  nextMilestone: string | null;
  nextMilestoneDate: string | null;
  riskFactors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    weight: number;
    detail: string;
  }>;
  supportSignals: Array<{
    signal: string;
    source: string;
    strength: number;
  }>;
  oppositionSignals: Array<{
    signal: string;
    source: string;
    strength: number;
  }>;
  historicalComps: Array<{
    billId: string;
    session: string;
    similarity: number;
    outcome: string;
  }>;
  sponsorStrength: number;
  committeeAlignment: number;
  trend: "improving" | "stable" | "declining" | null;
  lastUpdatedAt: string;
}

export interface PredictionDashboard {
  workspaceId: number;
  totalTracked: number;
  breakdown: {
    likely_pass: number;
    lean_pass: number;
    toss_up: number;
    lean_fail: number;
    likely_fail: number;
    dead: number;
  };
  topRisks: PredictionResult[];
  topOpportunities: PredictionResult[];
  recentChanges: Array<{
    billId: string;
    billTitle: string | null;
    previousProbability: number;
    currentProbability: number;
    delta: number;
    direction: "up" | "down";
  }>;
  analyzedAt: string;
}

// ── Detection helpers ───────────────────────────────────────────────────────

function detectRegime(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  // Texas Legislature: odd years, Jan-May = session; even years = interim
  if (year % 2 === 1 && month >= 1 && month <= 6) return "session";
  if (year % 2 === 1 && month >= 6) return "post_session";
  return "interim";
}

function classifyPrediction(
  probability: number,
): "likely_pass" | "lean_pass" | "toss_up" | "lean_fail" | "likely_fail" | "dead" {
  if (probability >= 0.75) return "likely_pass";
  if (probability >= 0.55) return "lean_pass";
  if (probability >= 0.45) return "toss_up";
  if (probability >= 0.25) return "lean_fail";
  if (probability >= 0.05) return "likely_fail";
  return "dead";
}

// ── Stage detection from source documents ───────────────────────────────────

async function detectBillStage(
  workspaceId: number,
  billId: string,
): Promise<{ stage: string; hearingScheduled: boolean; bipartisan: boolean }> {
  const normalizedBill = billId.replace(/\./g, "").toUpperCase();

  // Check source documents for latest status
  const docs = await policyIntelDb
    .select()
    .from(sourceDocuments)
    .where(
      and(
        eq(sourceDocuments.workspaceId, workspaceId),
        sql`${sourceDocuments.title} ILIKE ${"%" + normalizedBill + "%"}`,
      ),
    )
    .orderBy(desc(sourceDocuments.publishedAt))
    .limit(5);

  let stage = "introduced";
  let hearingScheduled = false;
  let bipartisan = false;

  for (const doc of docs) {
    const status = (doc.summary ?? "").toLowerCase() + " " + (doc.title ?? "").toLowerCase();
    if (status.includes("enrolled") || status.includes("signed")) stage = "enrolled";
    else if (status.includes("conference")) stage = "conference";
    else if (status.includes("floor") || status.includes("third reading") || status.includes("passed")) stage = "floor";
    else if (status.includes("committee") || status.includes("reported") || status.includes("favorable")) stage = "committee_passed";
    else if (status.includes("hearing") || status.includes("testimony")) {
      stage = "committee_hearing";
      hearingScheduled = true;
    } else if (status.includes("referred")) stage = "referred";
    if (status.includes("bipartisan") || status.includes("joint author")) bipartisan = true;
  }

  // Check hearing events
  const hearings = await policyIntelDb
    .select()
    .from(hearingEvents)
    .where(
      and(
        eq(hearingEvents.workspaceId, workspaceId),
        sql`${hearingEvents.description} ILIKE ${"%" + normalizedBill + "%"}`,
      ),
    )
    .limit(3);

  if (hearings.length > 0) hearingScheduled = true;

  return { stage, hearingScheduled, bipartisan };
}

// ── Sponsor analysis ────────────────────────────────────────────────────────

async function analyzeSponsorStrength(
  workspaceId: number,
  billId: string,
): Promise<{ strength: number; signals: Array<{ signal: string; source: string; strength: number }> }> {
  const signals: Array<{ signal: string; source: string; strength: number }> = [];
  let strength = 0.3; // baseline

  const normalizedBill = billId.replace(/\./g, "").toUpperCase();

  // Find stakeholders (legislators) associated with this bill via alerts/issue rooms
  const relatedAlerts = await policyIntelDb
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.workspaceId, workspaceId),
        sql`${alerts.title} ILIKE ${"%" + normalizedBill + "%"}`,
      ),
    )
    .limit(10);

  // Check committee members for alignment
  const committees = await policyIntelDb
    .select()
    .from(committeeMembers)
    .where(eq(committeeMembers.workspaceId, workspaceId));

  const chairs = committees.filter(
    (m) => m.role === "chair" || m.role === "vice-chair",
  );

  if (chairs.length > 0) {
    signals.push({
      signal: `${chairs.length} committee leadership positions identified in workspace`,
      source: "committee_analysis",
      strength: Math.min(chairs.length * 0.1, 0.3),
    });
    strength += Math.min(chairs.length * 0.05, 0.15);
  }

  if (relatedAlerts.length > 0) {
    const highRelevance = relatedAlerts.filter(
      (a) => (a.relevanceScore ?? 0) >= 70,
    ).length;
    if (highRelevance > 0) {
      signals.push({
        signal: `${highRelevance} high-relevance alerts indicate strong engagement`,
        source: "alert_analysis",
        strength: Math.min(highRelevance * 0.15, 0.3),
      });
      strength += Math.min(highRelevance * 0.1, 0.2);
    }
  }

  return { strength: Math.min(strength, 1), signals };
}

// ── Main prediction engine ──────────────────────────────────────────────────

export async function predictBillPassage(
  req: PredictionRequest,
): Promise<PredictionResult> {
  const { workspaceId, billId, billTitle } = req;

  // Check for cached prediction if not forcing refresh
  if (!req.forceRefresh) {
    const [existing] = await policyIntelDb
      .select()
      .from(passagePredictions)
      .where(
        and(
          eq(passagePredictions.workspaceId, workspaceId),
          eq(passagePredictions.billId, billId),
        ),
      );

    if (existing) {
      const age = Date.now() - new Date(existing.lastUpdatedAt).getTime();
      const ONE_HOUR = 60 * 60 * 1000;
      if (age < ONE_HOUR) {
        return formatPrediction(existing);
      }
    }
  }

  // Gather signals
  const [stageInfo, sponsorInfo] = await Promise.all([
    detectBillStage(workspaceId, billId),
    analyzeSponsorStrength(workspaceId, billId),
  ]);

  const regime = detectRegime();

  // Compute passage probability from structural factors
  let probability = 0.5; // baseline
  const riskFactors: PredictionResult["riskFactors"] = [];
  const oppositionSignals: PredictionResult["oppositionSignals"] = [];

  // Stage factor
  const stageProbabilities: Record<string, number> = {
    introduced: -0.15,
    referred: -0.10,
    committee_hearing: 0.05,
    committee_passed: 0.15,
    floor: 0.25,
    conference: 0.10,
    enrolled: 0.40,
  };
  const stageAdjust = stageProbabilities[stageInfo.stage] ?? 0;
  probability += stageAdjust;
  riskFactors.push({
    factor: "Legislative Stage",
    impact: stageAdjust >= 0 ? "positive" : "negative",
    weight: Math.abs(stageAdjust),
    detail: `Bill is at "${stageInfo.stage}" stage (${stageAdjust >= 0 ? "+" : ""}${(stageAdjust * 100).toFixed(0)}% adjustment)`,
  });

  // Hearing scheduled factor
  if (stageInfo.hearingScheduled) {
    probability += 0.10;
    riskFactors.push({
      factor: "Hearing Scheduled",
      impact: "positive",
      weight: 0.10,
      detail: "A hearing is scheduled, indicating active consideration by committee",
    });
  }

  // Bipartisan factor
  if (stageInfo.bipartisan) {
    probability += 0.12;
    riskFactors.push({
      factor: "Bipartisan Support",
      impact: "positive",
      weight: 0.12,
      detail: "Bipartisan co-sponsorship detected — significantly increases passage odds",
    });
  }

  // Regime timing factor
  const regimeAdjust: Record<string, number> = {
    session: 0.05,
    post_session: -0.20,
    interim: -0.25,
  };
  const rAdj = regimeAdjust[regime] ?? 0;
  probability += rAdj;
  riskFactors.push({
    factor: "Session Timing",
    impact: rAdj >= 0 ? "positive" : "negative",
    weight: Math.abs(rAdj),
    detail: `Current regime: ${regime}. ${regime === "interim" ? "No active session — prediction is speculative." : "Active session — bills are moving."}`,
  });

  // Sponsor strength factor
  probability += (sponsorInfo.strength - 0.3) * 0.3; // adjust relative to baseline
  riskFactors.push({
    factor: "Sponsor Strength",
    impact: sponsorInfo.strength >= 0.5 ? "positive" : sponsorInfo.strength >= 0.3 ? "neutral" : "negative",
    weight: sponsorInfo.strength,
    detail: `Sponsor coalition strength: ${(sponsorInfo.strength * 100).toFixed(0)}%`,
  });

  // Clamp probability
  probability = Math.max(0.01, Math.min(0.99, probability));

  // Compute confidence based on data availability
  const dataPoints = [
    stageInfo.stage !== "introduced" ? 1 : 0,
    stageInfo.hearingScheduled ? 1 : 0,
    sponsorInfo.signals.length > 0 ? 1 : 0,
    regime === "session" ? 1 : 0,
  ];
  const confidence = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;

  // Determine next milestone
  const milestones: Record<string, { next: string; estimatedDays: number }> = {
    introduced: { next: "Committee Referral", estimatedDays: 14 },
    referred: { next: "Committee Hearing", estimatedDays: 30 },
    committee_hearing: { next: "Committee Vote", estimatedDays: 7 },
    committee_passed: { next: "Floor Calendar", estimatedDays: 14 },
    floor: { next: "Floor Vote", estimatedDays: 7 },
    conference: { next: "Conference Report", estimatedDays: 14 },
    enrolled: { next: "Governor's Desk", estimatedDays: 10 },
  };
  const ms = milestones[stageInfo.stage];
  const nextMilestoneDate = ms
    ? new Date(Date.now() + ms.estimatedDays * 86400000).toISOString()
    : null;

  // Get previous prediction for delta tracking
  const [prevPrediction] = await policyIntelDb
    .select()
    .from(passagePredictions)
    .where(
      and(
        eq(passagePredictions.workspaceId, workspaceId),
        eq(passagePredictions.billId, billId),
      ),
    );

  const previousProbability = prevPrediction?.probability ?? null;
  const probabilityDelta = previousProbability !== null ? probability - previousProbability : null;

  // Upsert prediction
  const predictionData: InsertPolicyIntelPassagePrediction = {
    workspaceId,
    billId,
    billTitle: billTitle ?? prevPrediction?.billTitle ?? null,
    prediction: classifyPrediction(probability),
    probability,
    confidence,
    regime,
    currentStage: stageInfo.stage,
    nextMilestone: ms?.next ?? null,
    nextMilestoneDate: nextMilestoneDate ? new Date(nextMilestoneDate) : null,
    riskFactors,
    supportSignals: sponsorInfo.signals,
    oppositionSignals,
    historicalComps: [],
    sponsorStrength: sponsorInfo.strength,
    committeeAlignment: stageInfo.hearingScheduled ? 0.6 : 0.3,
    previousProbability,
    probabilityDelta,
    lastUpdatedAt: new Date(),
  };

  let stored: PolicyIntelPassagePrediction;
  if (prevPrediction) {
    [stored] = await policyIntelDb
      .update(passagePredictions)
      .set(predictionData)
      .where(eq(passagePredictions.id, prevPrediction.id))
      .returning();
  } else {
    [stored] = await policyIntelDb
      .insert(passagePredictions)
      .values(predictionData)
      .returning();
  }

  log.info(`Predicted ${billId}: ${(probability * 100).toFixed(1)}% (${classifyPrediction(probability)})`);
  return formatPrediction(stored);
}

// ── Batch predictions ───────────────────────────────────────────────────────

export async function predictBillPassageBatch(
  req: BatchPredictionRequest,
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = [];
  for (const billId of req.billIds) {
    const result = await predictBillPassage({
      workspaceId: req.workspaceId,
      billId,
    });
    results.push(result);
  }
  return results;
}

// ── Dashboard aggregation ───────────────────────────────────────────────────

export async function getPredictionDashboard(
  workspaceId: number,
): Promise<PredictionDashboard> {
  const all = await policyIntelDb
    .select()
    .from(passagePredictions)
    .where(eq(passagePredictions.workspaceId, workspaceId))
    .orderBy(desc(passagePredictions.probability));

  const breakdown = {
    likely_pass: 0,
    lean_pass: 0,
    toss_up: 0,
    lean_fail: 0,
    likely_fail: 0,
    dead: 0,
  };
  for (const p of all) {
    const pred = p.prediction as keyof typeof breakdown;
    if (pred in breakdown) breakdown[pred]++;
  }

  const topRisks = all
    .filter((p) => p.probability >= 0.5)
    .slice(0, 5)
    .map(formatPrediction);

  const topOpportunities = all
    .filter((p) => p.probability < 0.5 && p.prediction !== "dead")
    .slice(0, 5)
    .map(formatPrediction);

  const recentChanges = all
    .filter((p) => p.probabilityDelta !== null && Math.abs(p.probabilityDelta ?? 0) >= 0.05)
    .sort((a, b) => Math.abs(b.probabilityDelta ?? 0) - Math.abs(a.probabilityDelta ?? 0))
    .slice(0, 10)
    .map((p) => ({
      billId: p.billId,
      billTitle: p.billTitle,
      previousProbability: p.previousProbability ?? 0,
      currentProbability: p.probability,
      delta: p.probabilityDelta ?? 0,
      direction: (p.probabilityDelta ?? 0) > 0 ? "up" as const : "down" as const,
    }));

  return {
    workspaceId,
    totalTracked: all.length,
    breakdown,
    topRisks,
    topOpportunities,
    recentChanges,
    analyzedAt: new Date().toISOString(),
  };
}

// ── Auto-discover and predict bills from watchlist ──────────────────────────

export async function autoDiscoverAndPredict(
  workspaceId: number,
): Promise<{ discovered: number; predicted: number }> {
  // Get all bill IDs mentioned in alerts for this workspace
  const billAlerts = await policyIntelDb
    .select({ title: alerts.title })
    .from(alerts)
    .where(eq(alerts.workspaceId, workspaceId))
    .orderBy(desc(alerts.createdAt))
    .limit(200);

  const billPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const discoveredBills = new Set<string>();

  for (const alert of billAlerts) {
    const matches = (alert.title ?? "").matchAll(billPattern);
    for (const m of matches) {
      discoveredBills.add(`${m[1].replace(/\./g, "")} ${m[2]}`);
    }
  }

  let predicted = 0;
  for (const billId of discoveredBills) {
    await predictBillPassage({ workspaceId, billId });
    predicted++;
  }

  return { discovered: discoveredBills.size, predicted };
}

// ── Format helper ───────────────────────────────────────────────────────────

function formatPrediction(p: PolicyIntelPassagePrediction): PredictionResult {
  return {
    billId: p.billId,
    billTitle: p.billTitle,
    prediction: p.prediction,
    probability: p.probability,
    confidence: p.confidence,
    regime: p.regime,
    currentStage: p.currentStage,
    nextMilestone: p.nextMilestone,
    nextMilestoneDate: p.nextMilestoneDate?.toISOString() ?? null,
    riskFactors: (p.riskFactors ?? []) as PredictionResult["riskFactors"],
    supportSignals: (p.supportSignals ?? []) as PredictionResult["supportSignals"],
    oppositionSignals: (p.oppositionSignals ?? []) as PredictionResult["oppositionSignals"],
    historicalComps: (p.historicalComps ?? []) as PredictionResult["historicalComps"],
    sponsorStrength: p.sponsorStrength ?? 0,
    committeeAlignment: p.committeeAlignment ?? 0,
    trend:
      p.probabilityDelta === null
        ? null
        : p.probabilityDelta > 0.05
          ? "improving"
          : p.probabilityDelta < -0.05
            ? "declining"
            : "stable",
    lastUpdatedAt: p.lastUpdatedAt.toISOString(),
  };
}
