/**
 * Risk Model — estimates bill passage probability and client risk
 * using a Bayesian-inspired model that combines structural signals.
 *
 * This answers: "How likely is this bill to actually become law, and
 * how much should we worry about it?"
 *
 * Factors:
 * - Legislative stage (introduced → committee → floor → enrolled)
 * - Regime timing (where are we in the session calendar?)
 * - Sponsor power (committee chair? party leadership?)
 * - Hearing scheduled (has it been calendared?)
 * - Bipartisan signals (sponsors from both parties?)
 * - Historical velocity (how fast has it moved?)
 * - Committee bottleneck (is the committee it's in known to be slow?)
 */
import { policyIntelDb } from "../../db";
import {
  alerts, sourceDocuments, hearingEvents, watchlists,
  stakeholders, committeeMembers, issueRooms,
} from "@shared/schema-policy-intel";
import { eq, sql, gte, desc, count, and, ilike } from "drizzle-orm";
import { detectRegime } from "../agent-pipeline";
import { analyzeSponsorNetwork, type BillSponsorAnalysis } from "./sponsor-network";

export interface RiskAssessment {
  billId: string;
  title: string;
  /** Estimated probability of passage (0-1) */
  passageProbability: number;
  /** Risk level for the client */
  riskLevel: "critical" | "high" | "elevated" | "moderate" | "low";
  /** Current legislative stage */
  stage: string;
  /** Factors that increase risk */
  riskFactors: RiskFactor[];
  /** Factors that decrease risk */
  mitigatingFactors: RiskFactor[];
  /** Net risk score (0-100) */
  riskScore: number;
  /** Human-readable intelligence */
  narrative: string;
  /** Recommended actions */
  recommendations: string[];
  /** Data quality flag */
  confidence: "high" | "medium" | "low";
  /** Sponsor coalition power (0-100), if available */
  sponsorPower?: number;
  /** Whether bipartisan support was detected */
  bipartisanSupport?: boolean;
}

export interface RiskFactor {
  factor: string;
  impact: number; // -1 to +1 (positive = increases risk)
  detail: string;
}

export interface RiskReport {
  analyzedAt: string;
  regime: string;
  assessments: RiskAssessment[];
  criticalRisks: RiskAssessment[];
  risingRisks: RiskAssessment[];
}

/** Detect bill stage from text signals */
function detectStage(text: string): { stage: string; weight: number } {
  const lower = (text ?? "").toLowerCase();
  if (/enrolled|signed by governor|sent to governor/i.test(lower)) return { stage: "enrolled", weight: 0.95 };
  if (/passed (both|senate and house|house and senate)/i.test(lower)) return { stage: "passed_both", weight: 0.9 };
  if (/passed (senate|house)|third reading/i.test(lower)) return { stage: "passed_chamber", weight: 0.6 };
  if (/conference committee/i.test(lower)) return { stage: "conference", weight: 0.65 };
  if (/reported favorably|voted from committee/i.test(lower)) return { stage: "reported", weight: 0.45 };
  if (/floor vote|calendar|set for/i.test(lower)) return { stage: "calendared", weight: 0.4 };
  if (/hearing scheduled|public hearing|committee hearing/i.test(lower)) return { stage: "hearing", weight: 0.25 };
  if (/referred to committee|committee referral/i.test(lower)) return { stage: "referred", weight: 0.15 };
  if (/introduced|filed|prefiled/i.test(lower)) return { stage: "filed", weight: 0.08 };
  return { stage: "unknown", weight: 0.1 };
}

/** Extract bill IDs from text */
function extractBillIds(text: string): string[] {
  const pattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?)\s*(\d+)\b/gi;
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    ids.add(`${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`);
  }
  return [...ids];
}

// Re-export detectRegime for use by the risk model
export { detectRegime };

export async function analyzeRisk(): Promise<RiskReport> {
  const d90 = new Date(Date.now() - 90 * 86400000);
  const now = new Date();

  const regime = detectRegime("", now);

  // Regime multipliers — how much does the session timing affect passage probability?
  const regimeMultiplier: Record<string, number> = {
    pre_filing: 0.3,    // bills filed but session hasn't started
    early_session: 0.5,  // early days, many bills die
    committee_season: 0.7, // committees are filtering
    floor_action: 0.85,   // if it got here, it's serious
    conference: 0.9,      // very likely to pass if in conference
    sine_die: 0.95,       // final push
    special_session: 0.85, // governor wants it
    interim: 0.1,         // no bills moving
  };

  // ── Gather bill data ────────────────────────────────────────────────
  const recentAlerts = await policyIntelDb
    .select({
      id: alerts.id,
      title: alerts.title,
      summary: alerts.summary,
      whyItMatters: alerts.whyItMatters,
      relevanceScore: alerts.relevanceScore,
      reasonsJson: alerts.reasonsJson,
      watchlistId: alerts.watchlistId,
      sourceDocumentId: alerts.sourceDocumentId,
      createdAt: alerts.createdAt,
    })
    .from(alerts)
    .where(gte(alerts.createdAt, d90))
    .orderBy(desc(alerts.relevanceScore))
    .limit(500);

  // Get unique bill IDs from alerts
  const billAlerts = new Map<string, typeof recentAlerts>();
  for (const a of recentAlerts) {
    const billIds = extractBillIds(`${a.title} ${a.summary ?? ""}`);
    for (const billId of billIds) {
      const list = billAlerts.get(billId) ?? [];
      list.push(a);
      billAlerts.set(billId, list);
    }
  }

  // ── Get hearing data for passage signals ────────────────────────────
  const upcomingHearings = await policyIntelDb
    .select({
      committee: hearingEvents.committee,
      hearingDate: hearingEvents.hearingDate,
      relatedBillIds: hearingEvents.relatedBillIds,
      status: hearingEvents.status,
    })
    .from(hearingEvents)
    .where(gte(hearingEvents.hearingDate, d90));

  const billHearings = new Map<string, typeof upcomingHearings>();
  for (const h of upcomingHearings) {
    for (const billId of (h.relatedBillIds ?? [])) {
      const list = billHearings.get(billId) ?? [];
      list.push(h);
      billHearings.set(billId, list);
    }
  }

  // ── Committee chair data ────────────────────────────────────────────
  const chairs = await policyIntelDb
    .select({
      committeeName: committeeMembers.committeeName,
      stakeholderId: committeeMembers.stakeholderId,
      chamber: committeeMembers.chamber,
    })
    .from(committeeMembers)
    .where(eq(committeeMembers.role, "chair"));

  const committeeChairs = new Map(chairs.map(c => [c.committeeName.toLowerCase(), c]));

  // ── Sponsor network analysis (enriches risk with coalition power) ────
  let sponsorAnalyses: BillSponsorAnalysis[] = [];
  try {
    const sponsorReport = await analyzeSponsorNetwork();
    sponsorAnalyses = sponsorReport.billAnalyses;
  } catch {
    // Sponsor analysis is enrichment — proceed without it if it fails
  }
  const sponsorMap = new Map(sponsorAnalyses.map(s => [s.billId, s]));

  // ── Build risk assessments ──────────────────────────────────────────
  const assessments: RiskAssessment[] = [];

  for (const [billId, billAlertList] of billAlerts) {
    const riskFactors: RiskFactor[] = [];
    const mitigatingFactors: RiskFactor[] = [];

    // Combined text for analysis
    const combinedText = billAlertList.map(a => `${a.title} ${a.summary ?? ""} ${a.whyItMatters ?? ""}`).join(" ");
    const bestTitle = billAlertList[0].title;

    // ── Stage detection ─────────────────────────────────────────────
    const { stage, weight: stageWeight } = detectStage(combinedText);
    const stageFactor: RiskFactor = {
      factor: "Legislative Stage",
      impact: stageWeight,
      detail: `Bill is at "${stage}" stage (${(stageWeight * 100).toFixed(0)}% base probability)`,
    };
    if (stageWeight >= 0.4) riskFactors.push(stageFactor);
    else mitigatingFactors.push({ ...stageFactor, impact: -stageFactor.impact });

    // ── Regime timing ───────────────────────────────────────────────
    const regimeMult = regimeMultiplier[regime] ?? 0.5;
    if (regimeMult >= 0.7) {
      riskFactors.push({ factor: "Session Timing", impact: regimeMult * 0.5, detail: `Legislature is in "${regime}" phase — bills moving faster` });
    } else {
      mitigatingFactors.push({ factor: "Session Timing", impact: -(1 - regimeMult) * 0.3, detail: `Legislature is in "${regime}" phase — low bill movement expected` });
    }

    // ── Hearing scheduled ───────────────────────────────────────────
    const hearings = billHearings.get(billId) ?? [];
    const futureHearings = hearings.filter(h => h.hearingDate >= now);
    if (futureHearings.length > 0) {
      riskFactors.push({ factor: "Hearing Scheduled", impact: 0.3, detail: `${futureHearings.length} upcoming hearing(s) — active consideration` });
    }

    // ── Alert velocity ──────────────────────────────────────────────
    const d7 = new Date(now.getTime() - 7 * 86400000);
    const d14 = new Date(now.getTime() - 14 * 86400000);
    const recentCount = billAlertList.filter(a => a.createdAt >= d7).length;
    const prevWeekCount = billAlertList.filter(a => a.createdAt >= d14 && a.createdAt < d7).length;

    if (recentCount >= 3) {
      riskFactors.push({ factor: "High Recent Activity", impact: 0.2, detail: `${recentCount} alerts in past 7 days — accelerating activity` });
    }

    // ── Alert acceleration (velocity of velocity) ───────────────────
    if (prevWeekCount > 0 && recentCount > prevWeekCount * 2) {
      riskFactors.push({
        factor: "Activity Acceleration",
        impact: 0.15,
        detail: `Alert volume doubled from ${prevWeekCount} to ${recentCount} week-over-week — exponential growth detected`,
      });
    }

    // ── Multi-source engagement ─────────────────────────────────────
    const sourceTypes = new Set(billAlertList.map(a => a.watchlistId).filter(Boolean));
    if (sourceTypes.size >= 3) {
      riskFactors.push({
        factor: "Multi-Watchlist Alert",
        impact: 0.15,
        detail: `Triggered ${sourceTypes.size} different watchlists — broad cross-domain relevance`,
      });
    }

    // ── Average relevance score ─────────────────────────────────────
    const avgScore = billAlertList.reduce((s, a) => s + a.relevanceScore, 0) / billAlertList.length;
    if (avgScore >= 60) {
      riskFactors.push({ factor: "High Relevance", impact: 0.15, detail: `Average relevance score ${avgScore.toFixed(0)} — strong watchlist match` });
    }

    // ── Stakeholder signals ─────────────────────────────────────────
    const govSignal = /governor|abbott/i.test(combinedText);
    const speakerSignal = /speaker|phelan/i.test(combinedText);
    const ltGovSignal = /lieutenant governor|lt\.\s*gov/i.test(combinedText);
    if (govSignal) riskFactors.push({ factor: "Governor Involvement", impact: 0.25, detail: "Governor referenced — executive priority signal" });
    if (speakerSignal) riskFactors.push({ factor: "Speaker Involvement", impact: 0.2, detail: "Speaker referenced — leadership priority" });
    if (ltGovSignal) riskFactors.push({ factor: "Lt. Governor Involvement", impact: 0.2, detail: "Lt. Governor referenced — Senate leadership priority" });

    // ── Sponsor coalition power (from sponsor-network analyzer) ─────
    const sponsorData = sponsorMap.get(billId);
    let sponsorPower: number | undefined;
    let bipartisanSupport: boolean | undefined;

    if (sponsorData) {
      sponsorPower = sponsorData.coalition.coalitionPower;
      bipartisanSupport = sponsorData.coalition.isBipartisan;

      if (sponsorData.coalition.coalitionPower >= 60) {
        riskFactors.push({
          factor: "Strong Sponsor Coalition",
          impact: 0.25,
          detail: `Coalition power ${sponsorData.coalition.coalitionPower}/100 — ${sponsorData.coalition.size} sponsor(s)${sponsorData.coalition.hasLeadership ? " including leadership" : ""}`,
        });
      } else if (sponsorData.coalition.coalitionPower <= 20 && sponsorData.coalition.size <= 1) {
        mitigatingFactors.push({
          factor: "Weak Sponsor Base",
          impact: -0.1,
          detail: `Only ${sponsorData.coalition.size} identified sponsor(s) — limited political support`,
        });
      }

      if (sponsorData.coalition.isBipartisan) {
        riskFactors.push({
          factor: "Bipartisan Support",
          impact: 0.2,
          detail: `Sponsors from ${sponsorData.coalition.parties.join(" & ")} — bipartisan bills pass at significantly higher rates`,
        });
      }

      if (sponsorData.coalition.hasCommitteeChair) {
        riskFactors.push({
          factor: "Committee Chair Backing",
          impact: 0.2,
          detail: "A sponsor chairs the committee where this bill is assigned — provides gate control",
        });
      }
    }

    // ── Amendment / companion bill signals ───────────────────────────
    const amendmentSignal = /amendment|substitute|companion|engrossed|committee substitute/i.test(combinedText);
    if (amendmentSignal) {
      riskFactors.push({
        factor: "Amendment Activity",
        impact: 0.1,
        detail: "Amendment or substitute bill language detected — indicates active negotiation and forward momentum",
      });
    }

    // ── Opposition signals ──────────────────────────────────────────
    const oppositionSignal = /oppose|opposition|against|testified against|registered against/i.test(combinedText);
    if (oppositionSignal) {
      mitigatingFactors.push({
        factor: "Opposition Detected",
        impact: -0.1,
        detail: "Opposition language detected in alert text — may slow or block passage",
      });
    }

    // ── Calculate final scores ──────────────────────────────────────
    const baseProb = stageWeight;
    const riskBoost = riskFactors.reduce((s, f) => s + f.impact * 0.3, 0);
    const mitigate = mitigatingFactors.reduce((s, f) => s + Math.abs(f.impact) * 0.2, 0);
    // Sponsor coalition acts as a multiplier — strong coalitions amplify base probability
    const sponsorMult = sponsorPower !== undefined ? (0.7 + (sponsorPower / 100) * 0.6) : 1.0;
    const passageProbability = Math.min(0.99, Math.max(0.01, (baseProb + riskBoost - mitigate) * regimeMult * sponsorMult));

    const riskScore = Math.round(passageProbability * avgScore); // combine likelihood with severity
    const riskLevel: RiskAssessment["riskLevel"] =
      riskScore >= 80 ? "critical" :
      riskScore >= 60 ? "high" :
      riskScore >= 40 ? "elevated" :
      riskScore >= 20 ? "moderate" : "low";

    // ── Recommendations ─────────────────────────────────────────────
    const recommendations: string[] = [];
    if (riskLevel === "critical" || riskLevel === "high") {
      recommendations.push("Prepare client communication on potential impact");
      if (futureHearings.length > 0) recommendations.push("Consider filing testimony or registering position");
      if (bipartisanSupport) recommendations.push("Bipartisan bill — consider engaging sponsors from both parties");
    }
    if (govSignal) recommendations.push("Monitor executive action — governor involvement increases passage odds");
    if (stage === "hearing" || stage === "referred") {
      recommendations.push("Track committee actions closely — this is the key decision point");
    }
    if (sponsorData?.coalition.hasCommitteeChair) {
      recommendations.push("Committee chair is a sponsor — direct outreach to chair's office may be most effective");
    }
    if (recommendations.length === 0) recommendations.push("Continue standard monitoring");

    // ── Confidence assessment ───────────────────────────────────────
    const dataPoints = billAlertList.length + hearings.length + (govSignal ? 1 : 0) + (sponsorData ? sponsorData.sponsors.length : 0);
    const confidence: RiskAssessment["confidence"] = dataPoints >= 5 ? "high" : dataPoints >= 2 ? "medium" : "low";

    // ── Narrative ───────────────────────────────────────────────────
    const narrative = `${billId}: ${riskLevel.toUpperCase()} risk (score ${riskScore}/100, ${(passageProbability * 100).toFixed(0)}% passage probability). ` +
      `Currently at "${stage}" stage during "${regime}" regime. ` +
      (riskFactors.length > 0 ? `Key risk factors: ${riskFactors.map(f => f.factor).join(", ")}. ` : "") +
      (bipartisanSupport ? "Bipartisan support detected. " : "") +
      (recommendations[0] !== "Continue standard monitoring" ? `Recommended: ${recommendations[0]}.` : "No immediate action required.");

    assessments.push({
      billId,
      title: bestTitle,
      passageProbability,
      riskLevel,
      stage,
      riskFactors,
      mitigatingFactors,
      riskScore,
      narrative,
      recommendations,
      confidence,
      sponsorPower,
      bipartisanSupport,
    });
  }

  assessments.sort((a, b) => b.riskScore - a.riskScore);

  return {
    analyzedAt: now.toISOString(),
    regime,
    assessments,
    criticalRisks: assessments.filter(a => a.riskLevel === "critical" || a.riskLevel === "high").slice(0, 10),
    risingRisks: assessments.filter(a => a.riskFactors.some(f => f.factor === "High Recent Activity")).slice(0, 10),
  };
}
