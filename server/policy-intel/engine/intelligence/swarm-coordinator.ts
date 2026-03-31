/**
 * Swarm Coordinator — orchestrates all intelligence analyzers in parallel
 * and synthesizes a unified strategic briefing.
 *
 * This is the "Hogan brain" — a multi-agent swarm that:
 * 1. Launches all 5 analyzers concurrently (velocity, correlation,
 *    influence, risk, anomaly)
 * 2. Cross-references their outputs for compounding insights
 * 3. Generates a priority-ranked intelligence briefing with
 *    strategic recommendations
 *
 * Think of it as a war-room situation board, auto-generated.
 */
import { analyzeVelocity, type VelocityReport } from "./velocity-analyzer";
import { analyzeCorrelations, type CorrelationReport } from "./cross-correlator";
import { analyzeInfluence, type InfluenceReport } from "./influence-ranker";
import { analyzeRisk, type RiskReport } from "./risk-model";
import { detectAnomalies, type AnomalyReport } from "./anomaly-detector";

// ── Types ────────────────────────────────────────────────────────────────────

export interface StrategicInsight {
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest
  category:
    | "immediate_action"
    | "emerging_threat"
    | "opportunity"
    | "situational_awareness"
    | "strategic_recommendation";
  title: string;
  narrative: string;
  /** Which analyzer(s) contributed to this insight */
  sources: string[];
  /** Confidence (0-1) */
  confidence: number;
  /** Related entity IDs for linking in the UI */
  relatedEntities?: Array<{ type: string; id: string | number; label: string }>;
}

export interface IntelligenceBriefing {
  generatedAt: string;
  /** Overall assessment of the intel landscape */
  executiveSummary: string;
  /** Priority-ranked insights from cross-referencing all analyzers */
  insights: StrategicInsight[];
  /** Counts by category */
  insightCounts: Record<string, number>;
  /** Raw analyzer outputs for drill-down */
  velocity: VelocityReport;
  correlations: CorrelationReport;
  influence: InfluenceReport;
  risk: RiskReport;
  anomalies: AnomalyReport;
  /** How long the full swarm run took (ms) */
  analysisTimeMs: number;
}

// ── Swarm Execution ──────────────────────────────────────────────────────────

export async function runSwarm(): Promise<IntelligenceBriefing> {
  const start = Date.now();

  // Launch all analyzers concurrently — this is the "swarm"
  const [velocity, correlations, influence, risk, anomalies] = await Promise.all([
    analyzeVelocity(),
    analyzeCorrelations(),
    analyzeInfluence(),
    analyzeRisk(),
    detectAnomalies(),
  ]);

  const analysisTimeMs = Date.now() - start;

  // ── Cross-Reference & Synthesize ─────────────────────────────────────
  const insights: StrategicInsight[] = [];

  // 1. Critical risks with surging velocity = IMMEDIATE ACTION
  const surgingSubjects = new Set(
    velocity.topMovers
      .filter(v => v.momentum === "surging")
      .map(v => v.subject.toLowerCase()),
  );
  for (const ra of risk.criticalRisks) {
    const isSurging = surgingSubjects.has(ra.billId.toLowerCase()) ||
      velocity.topMovers.some(v =>
        v.momentum === "surging" && ra.title.toLowerCase().includes(v.subject.toLowerCase()),
      );
    if (isSurging) {
      insights.push({
        priority: 1,
        category: "immediate_action",
        title: `${ra.billId} is critical AND accelerating`,
        narrative: `${ra.billId} (${ra.stage}) has a ${(ra.passageProbability * 100).toFixed(0)}% passage probability AND activity on related topics is surging. This combination demands immediate attention — the bill is moving fast through a favorable legislative environment. ${ra.recommendations[0] ?? ""}`,
        sources: ["risk-model", "velocity-analyzer"],
        confidence: Math.min(ra.confidence === "high" ? 0.9 : ra.confidence === "medium" ? 0.7 : 0.5, 1),
        relatedEntities: [{ type: "bill", id: ra.billId, label: ra.title }],
      });
    }
  }

  // 2. Anomalies on high-influence stakeholders = EMERGING THREAT
  const powerBrokerNames = new Set(
    influence.powerBrokers.map(p => p.name.toLowerCase()),
  );
  for (const anomaly of anomalies.anomalies.filter(a => a.severity === "critical" || a.severity === "high")) {
    // Check if anomaly involves a power broker
    const involvesPowerBroker = influence.powerBrokers.some(pb =>
      anomaly.subject.toLowerCase().includes(pb.name.toLowerCase()) ||
      anomaly.narrative.toLowerCase().includes(pb.name.toLowerCase()),
    );
    if (involvesPowerBroker) {
      insights.push({
        priority: 1,
        category: "emerging_threat",
        title: `Anomalous activity involving key stakeholder`,
        narrative: `${anomaly.narrative} This is especially significant because it involves stakeholders with high influence scores in your network.`,
        sources: ["anomaly-detector", "influence-ranker"],
        confidence: 0.8,
      });
    }
  }

  // 3. Bill clusters that overlap with critical risks = STRATEGIC
  for (const cluster of correlations.clusters.filter(c => c.significance === "critical" || c.significance === "high")) {
    const clusterBillIds = cluster.bills.map(b => b.billId);
    const riskyBills = risk.assessments.filter(ra =>
      clusterBillIds.includes(ra.billId) && (ra.riskLevel === "critical" || ra.riskLevel === "high"),
    );
    if (riskyBills.length >= 2) {
      insights.push({
        priority: 2,
        category: "emerging_threat",
        title: `Bill cluster "${cluster.label}" contains ${riskyBills.length} high-risk bills`,
        narrative: `This cluster of ${cluster.bills.length} related bills includes ${riskyBills.length} that individually score as high or critical risk. Together they may represent a coordinated legislative push. Bills: ${riskyBills.map(b => b.billId).join(", ")}. ${cluster.narrative}`,
        sources: ["cross-correlator", "risk-model"],
        confidence: 0.85,
        relatedEntities: riskyBills.map(b => ({ type: "bill", id: b.billId, label: b.title })),
      });
    }
  }

  // 4. Surging topics with no corresponding risk assessment = BLIND SPOT
  for (const mover of velocity.topMovers.filter(v => v.momentum === "surging" || v.momentum === "heating")) {
    const hasRiskAssessment = risk.assessments.some(ra =>
      ra.title.toLowerCase().includes(mover.subject.toLowerCase()) ||
      ra.billId.toLowerCase().includes(mover.subject.toLowerCase()),
    );
    if (!hasRiskAssessment && mover.significance > 0.5) {
      insights.push({
        priority: 2,
        category: "situational_awareness",
        title: `Rising activity on "${mover.subject}" — no risk assessment available`,
        narrative: `${mover.narrative} However, no bills from this topic have been risk-assessed yet. Consider whether new watchlist terms or manual review is needed to ensure coverage.`,
        sources: ["velocity-analyzer"],
        confidence: 0.6,
      });
    }
  }

  // 5. Under-engaged gatekeepers on critical bills = OPPORTUNITY
  for (const gk of influence.gatekeepers) {
    const isUnderEngaged = influence.underEngaged.some(u => u.stakeholderId === gk.stakeholderId);
    if (isUnderEngaged) {
      insights.push({
        priority: 3,
        category: "opportunity",
        title: `Committee gatekeeper "${gk.name}" is under-engaged`,
        narrative: `${gk.name} holds a committee leadership position (influence score: ${gk.influenceScore}) but has low engagement in your system. Proactive outreach to this gatekeeper could create leverage on bills moving through their committee.`,
        sources: ["influence-ranker"],
        confidence: 0.7,
        relatedEntities: [{ type: "stakeholder", id: gk.stakeholderId, label: gk.name }],
      });
    }
  }

  // 6. Critical anomalies as standalone insights
  for (const anomaly of anomalies.anomalies.filter(a => a.severity === "critical")) {
    // Only add if not already captured by a cross-reference insight
    const duplicate = insights.some(i =>
      i.title.toLowerCase().includes(anomaly.subject.toLowerCase()),
    );
    if (!duplicate) {
      insights.push({
        priority: 2,
        category: "emerging_threat",
        title: `Anomaly: ${anomaly.type.replace(/_/g, " ")} — ${anomaly.subject}`,
        narrative: anomaly.narrative,
        sources: ["anomaly-detector"],
        confidence: 0.75,
      });
    }
  }

  // 7. Decaying topics that had critical risk assessments = STRATEGIC SHIFT
  for (const decaying of velocity.decayingTopics) {
    const wasRisky = risk.assessments.some(ra =>
      (ra.riskLevel === "critical" || ra.riskLevel === "high") &&
      (ra.title.toLowerCase().includes(decaying.subject.toLowerCase()) ||
        ra.billId.toLowerCase().includes(decaying.subject.toLowerCase())),
    );
    if (wasRisky) {
      insights.push({
        priority: 3,
        category: "situational_awareness",
        title: `Previously critical topic "${decaying.subject}" is losing momentum`,
        narrative: `${decaying.narrative} This topic was previously assessed as high or critical risk. The declining activity may signal that the legislative push is stalling — but confirm before deprioritizing.`,
        sources: ["velocity-analyzer", "risk-model"],
        confidence: 0.65,
      });
    }
  }

  // 8. Ghost bills (from anomalies) that appear in clusters = HIDDEN THREAT
  const ghostBills = anomalies.anomalies.filter(a => a.type === "ghost_bill");
  for (const ghost of ghostBills) {
    const inCluster = correlations.clusters.some(c =>
      c.bills.some(b => b.billId === ghost.subject),
    );
    if (inCluster) {
      insights.push({
        priority: 1,
        category: "emerging_threat",
        title: `Ghost bill ${ghost.subject} found inside a related bill cluster`,
        narrative: `${ghost.narrative} Additionally, this bill appears in a cluster of related legislation — it's connected to bills you ARE tracking but slipped through monitoring. This is a high-priority coverage gap.`,
        sources: ["anomaly-detector", "cross-correlator"],
        confidence: 0.85,
        relatedEntities: [{ type: "bill", id: ghost.subject, label: ghost.subject }],
      });
    }
  }

  // Sort by priority
  insights.sort((a, b) => a.priority - b.priority);

  // ── Executive Summary ──────────────────────────────────────────────────
  const criticalBills = risk.criticalRisks.length;
  const surgingTopics = velocity.topMovers.filter(v => v.momentum === "surging").length;
  const criticalAnomalies = anomalies.criticalCount;
  const p1Insights = insights.filter(i => i.priority === 1).length;

  const summaryParts: string[] = [];
  if (p1Insights > 0) {
    summaryParts.push(`${p1Insights} situation${p1Insights !== 1 ? "s" : ""} requiring immediate attention`);
  }
  if (criticalBills > 0) {
    summaryParts.push(`${criticalBills} bill${criticalBills !== 1 ? "s" : ""} at critical risk of passage`);
  }
  if (surgingTopics > 0) {
    summaryParts.push(`${surgingTopics} topic${surgingTopics !== 1 ? "s" : ""} with surging activity`);
  }
  if (criticalAnomalies > 0) {
    summaryParts.push(`${criticalAnomalies} critical anomal${criticalAnomalies !== 1 ? "ies" : "y"} detected`);
  }

  const executiveSummary = summaryParts.length > 0
    ? `Intelligence briefing identified ${summaryParts.join(", ")}. The legislative landscape is ${risk.regime === "floor_action" || risk.regime === "sine_die" ? "in a high-activity phase" : "in a " + risk.regime.replace(/_/g, " ") + " phase"}. ${insights.length} total strategic insight${insights.length !== 1 ? "s" : ""} generated from cross-referencing ${velocity.vectors.length} velocity vectors, ${correlations.clusters.length} bill clusters, ${influence.profiles.length} stakeholder profiles, ${risk.assessments.length} risk assessments, and ${anomalies.anomalies.length} anomaly detections in ${analysisTimeMs}ms.`
    : `No critical situations detected. The legislative landscape is in a ${risk.regime.replace(/_/g, " ")} phase. System monitoring ${velocity.vectors.length} activity vectors across ${risk.assessments.length} assessed bills. Analysis completed in ${analysisTimeMs}ms.`;

  const insightCounts: Record<string, number> = {};
  for (const ins of insights) {
    insightCounts[ins.category] = (insightCounts[ins.category] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    executiveSummary,
    insights,
    insightCounts,
    velocity,
    correlations,
    influence,
    risk,
    anomalies,
    analysisTimeMs,
  };
}
