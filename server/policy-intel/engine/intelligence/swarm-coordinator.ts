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
import { analyzeForecast, captureSnapshot, computeDelta, type ForecastReport, type DeltaBriefing } from "./forecast-tracker";
import { analyzeSponsorNetwork, type SponsorNetworkReport } from "./sponsor-network";
import { analyzeHistoricalPatterns, type HistoricalPatternsReport } from "./historical-patterns";
import { analyzeLegislatorProfiles, type LegislatorProfileReport } from "./legislator-profiler";
import { analyzeInfluenceMaps, type InfluenceMapReport } from "./influence-map";

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
  /** Sponsor network analysis */
  sponsors: SponsorNetworkReport;
  /** Forecast accuracy & model learning */
  forecast: ForecastReport;
  /** Historical pattern analysis (23 sessions, 107K+ bills) */
  historical: HistoricalPatternsReport;
  /** Legislator intelligence profiles */
  legislators: LegislatorProfileReport;
  /** Bill influence maps — who can change outcomes */
  influenceMap: InfluenceMapReport;
  /** Delta briefing — what changed since last run */
  delta: DeltaBriefing;
  /** How long the full swarm run took (ms) */
  analysisTimeMs: number;
}

// ── Swarm Execution ──────────────────────────────────────────────────────────

export async function runSwarm(): Promise<IntelligenceBriefing> {
  const start = Date.now();

  // Launch core analyzers concurrently — this is the "swarm"
  const [velocity, correlations, influence, risk, anomalies, sponsors, historical, legislators, influenceMap] = await Promise.all([
    analyzeVelocity(),
    analyzeCorrelations(),
    analyzeInfluence(),
    analyzeRisk(),
    detectAnomalies(),
    analyzeSponsorNetwork().catch(() => ({
      analyzedAt: new Date().toISOString(), billAnalyses: [],
      prolificSponsors: [], bipartisanBills: [], leadershipBacked: [],
      networkStats: { totalSponsors: 0, avgCoalitionSize: 0, bipartisanRate: 0, leadershipRate: 0 },
    }) as SponsorNetworkReport),
    analyzeHistoricalPatterns().catch(() => ({
      analyzedAt: new Date().toISOString(), totalBillsAnalyzed: 0, sessionsAnalyzed: 0,
      committeeRates: [], billTypePatterns: [], sessionAnalyses: [], chamberPatterns: [],
      timingPatterns: [], keyFindings: [], overallPassageRate: 0,
    }) as HistoricalPatternsReport),
    analyzeLegislatorProfiles().catch(() => ({
      analyzedAt: new Date().toISOString(), totalLegislators: 0, totalBillsMatched: 0,
      profiles: [], keyPlayers: [], gatekeepers: [], bridgeBuilders: [], blindSpots: [],
      stats: { byParty: {}, byChamber: {}, avgPowerScore: 0, avgBillCount: 0, engagementBreakdown: { high: 0, moderate: 0, low: 0, none: 0 } },
    }) as LegislatorProfileReport),
    analyzeInfluenceMaps().catch(() => ({
      analyzedAt: new Date().toISOString(), maps: [], pivotalLegislators: [], outreachPlan: [],
      stats: { totalBillsAnalyzed: 0, totalTargetsIdentified: 0, avgTargetsPerBill: 0, engagementGapCount: 0 },
    }) as InfluenceMapReport),
  ]);

  const analysisTimeMs = Date.now() - start;

  // ── Pre-compute forecast (needs risk results) ────────────────────────
  const predictions = risk.assessments.map(ra => ({
    billId: ra.billId,
    predictedStage: ra.stage,
    predictedPassageProbability: ra.passageProbability,
    predictedRiskLevel: ra.riskLevel,
    riskScore: ra.riskScore,
  }));

  let forecast: ForecastReport | null = null;
  try {
    forecast = await analyzeForecast(
      predictions,
      risk.regime,
      0, // insight count not yet known; updated on next run via snapshot
      risk.criticalRisks.length,
      anomalies.anomalies.length,
      correlations.clusters.length,
    );
  } catch { /* forecast is optional — system works without it */ }

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

  // 9. Bipartisan bills + surging velocity = HIGHEST PRIORITY OPPORTUNITY
  for (const bpBill of sponsors.bipartisanBills) {
    const isSurging = velocity.topMovers.some(v =>
      v.momentum === "surging" &&
      (bpBill.billId.toLowerCase().includes(v.subject.toLowerCase()) ||
        bpBill.title.toLowerCase().includes(v.subject.toLowerCase())),
    );
    if (isSurging) {
      insights.push({
        priority: 1,
        category: "immediate_action",
        title: `Bipartisan bill ${bpBill.billId} is accelerating`,
        narrative: `${bpBill.billId} has bipartisan support (${bpBill.coalition.parties.join("/")} coalition of ${bpBill.coalition.size}) AND its topic is surging. Bipartisan bills with momentum have the highest passage probability — this demands immediate strategic positioning.`,
        sources: ["sponsor-network", "velocity-analyzer"],
        confidence: 0.9,
        relatedEntities: [{ type: "bill", id: bpBill.billId, label: bpBill.title }],
      });
    }
  }

  // 10. Leadership-backed bills at high risk = COMPOUND SIGNAL
  for (const lbBill of sponsors.leadershipBacked) {
    const riskAssessment = risk.assessments.find(ra => ra.billId === lbBill.billId);
    if (riskAssessment && (riskAssessment.riskLevel === "critical" || riskAssessment.riskLevel === "high")) {
      insights.push({
        priority: 1,
        category: "emerging_threat",
        title: `Leadership-backed ${lbBill.billId} at ${riskAssessment.riskLevel} risk`,
        narrative: `${lbBill.billId} has chamber leadership sponsorship (coalition power: ${lbBill.coalition.coalitionPower}) and scores ${riskAssessment.riskLevel} risk with ${(riskAssessment.passageProbability * 100).toFixed(0)}% passage probability. Leadership-backed bills are structurally favored — the passage probability here may be conservative.`,
        sources: ["sponsor-network", "risk-model"],
        confidence: 0.88,
        relatedEntities: [{ type: "bill", id: lbBill.billId, label: lbBill.title }],
      });
    }
  }

  // 11. Prolific sponsors appearing across multiple risk-assessed bills = POWER BROKER PATTERN
  for (const sp of sponsors.prolificSponsors) {
    if (sp.billCount >= 3) {
      const riskyBills = sp.billIds.filter(bid =>
        risk.assessments.some(ra => ra.billId === bid && (ra.riskLevel === "critical" || ra.riskLevel === "high")),
      );
      if (riskyBills.length >= 2) {
        insights.push({
          priority: 2,
          category: "strategic_recommendation",
          title: `${sp.name} sponsors ${riskyBills.length} high-risk bills`,
          narrative: `${sp.name} (${sp.party}) sponsors ${sp.billCount} bills total, of which ${riskyBills.length} are assessed as high/critical risk. This legislator is a key actor — engagement strategy should prioritize understanding their legislative agenda. ${sp.isLeadership ? "ALERT: This sponsor holds a leadership position." : ""}`,
          sources: ["sponsor-network", "risk-model"],
          confidence: 0.8,
          relatedEntities: [{ type: "stakeholder", id: sp.stakeholderId, label: sp.name }],
        });
      }
    }
  }

  // 12. Velocity anomaly (silence-then-burst) on high-risk bills = WAKE-UP SIGNAL
  const velocityAnomalies = anomalies.anomalies.filter(a => a.type === "velocity_anomaly");
  for (const va of velocityAnomalies) {
    const matchingRisk = risk.assessments.find(ra =>
      va.subject.toLowerCase().includes(ra.billId.toLowerCase()) ||
      ra.title.toLowerCase().includes(va.subject.toLowerCase()),
    );
    if (matchingRisk && (matchingRisk.riskLevel === "critical" || matchingRisk.riskLevel === "high")) {
      insights.push({
        priority: 1,
        category: "immediate_action",
        title: `Silence-then-burst on ${matchingRisk.riskLevel}-risk topic`,
        narrative: `${va.narrative} This watchlist covers a ${matchingRisk.riskLevel}-risk area. After weeks of silence, the sudden burst may indicate behind-the-scenes negotiations have concluded and legislative action is imminent.`,
        sources: ["anomaly-detector", "risk-model"],
        confidence: 0.82,
      });
    }
  }

  // 13. Forecast model drift warning = SYSTEM INTELLIGENCE
  if (forecast && forecast.grade.trendDirection === "degrading") {
    insights.push({
      priority: 3,
      category: "strategic_recommendation",
      title: "Intelligence model accuracy is declining",
      narrative: `${forecast.grade.narrative} The system's predictions are becoming less reliable. Consider reviewing watchlist configurations and scoring weights — the legislative landscape may have shifted in ways the model hasn't adapted to yet.`,
      sources: ["forecast-tracker"],
      confidence: 0.9,
    });
  }

  // 14. Forecast blind spots = COVERAGE GAP
  if (forecast) {
    for (const bs of forecast.grade.blindSpots) {
      if (bs.missCount >= 2) {
        insights.push({
          priority: 3,
          category: "situational_awareness",
          title: `Forecast blind spot: ${bs.category}`,
          narrative: `The system has missed ${bs.missCount} predictions in the "${bs.category}" category. ${bs.description} Examples: ${bs.examples.slice(0, 3).join(", ")}.`,
          sources: ["forecast-tracker"],
          confidence: 0.7,
        });
      }
    }
  }

  // 15. Historical pattern amplifies risk — committee with high historical passage + high risk = COMPOUND
  if (historical.committeeRates.length > 0) {
    for (const ra of risk.assessments.filter(r => r.riskLevel === "critical" || r.riskLevel === "high")) {
      // Try to match committee from the risk assessment narrative or title
      const matchedCommittee = historical.committeeRates.find(cr =>
        ra.narrative.toLowerCase().includes(cr.committee.toLowerCase()) ||
        ra.title.toLowerCase().includes(cr.committee.toLowerCase()),
      );
      if (matchedCommittee && matchedCommittee.passageRate > 0.5) {
        insights.push({
          priority: 1,
          category: "immediate_action",
          title: `${ra.billId} in high-passage committee (${(matchedCommittee.passageRate * 100).toFixed(0)}% historical)`,
          narrative: `${ra.billId} is in ${matchedCommittee.committee}, which historically passes ${(matchedCommittee.passageRate * 100).toFixed(1)}% of referred bills (${matchedCommittee.passedBills}/${matchedCommittee.totalBills} across ${matchedCommittee.sessionTrends.length} sessions). Combined with its ${ra.riskLevel} risk rating, this bill has structurally favorable odds.`,
          sources: ["historical-patterns", "risk-model"],
          confidence: 0.85,
          relatedEntities: [{ type: "bill", id: ra.billId, label: ra.title }],
        });
      }
    }
  }

  // 16. Historical key findings as situational awareness
  for (const finding of historical.keyFindings.slice(0, 3)) {
    insights.push({
      priority: 4,
      category: "situational_awareness",
      title: "Historical pattern insight",
      narrative: finding,
      sources: ["historical-patterns"],
      confidence: 0.9,
    });
  }

  // 17. Legislator blind spots — high-power legislators with no engagement
  for (const bs of legislators.blindSpots.slice(0, 3)) {
    insights.push({
      priority: 3,
      category: "opportunity",
      title: `Unengaged power player: ${bs.name}`,
      narrative: `${bs.name} (${bs.party}, ${bs.chamber}) has a power score of ${bs.powerScore} with ${bs.committees.filter(c => c.role === "chair").length} chair position(s), but zero engagement records in our system. ${bs.sponsorship.watchlistOverlap > 0 ? `They are linked to ${bs.sponsorship.watchlistOverlap} watchlist bill(s) — this is a critical outreach gap.` : "They may influence bills in our tracked areas."}`,
      sources: ["legislator-profiler"],
      confidence: 0.8,
      relatedEntities: [{ type: "stakeholder", id: bs.stakeholderId, label: bs.name }],
    });
  }

  // 18. Bridge builders — bipartisan legislators on high-risk bills
  for (const bb of legislators.bridgeBuilders.slice(0, 2)) {
    const crossPartyAllies = bb.allies.filter(a => a.isCrossParty);
    if (crossPartyAllies.length > 0) {
      insights.push({
        priority: 3,
        category: "strategic_recommendation",
        title: `Bipartisan bridge: ${bb.name}`,
        narrative: `${bb.name} (${bb.party}) frequently collaborates across party lines with ${crossPartyAllies.map(a => a.name).slice(0, 3).join(", ")}. On ${bb.sponsorship.totalBills} bill(s), they demonstrate bipartisan reach. Consider leveraging this for bills needing cross-party support.`,
        sources: ["legislator-profiler"],
        confidence: 0.75,
        relatedEntities: [{ type: "stakeholder", id: bb.stakeholderId, label: bb.name }],
      });
    }
  }

  // 19. Influence map — outreach gaps on high-priority bills
  const unengagedMaps = influenceMap.maps.filter(m => m.engagedCount === 0 && m.targets.length > 0);
  if (unengagedMaps.length > 0) {
    const topGap = unengagedMaps[0];
    insights.push({
      priority: 2,
      category: "strategic_recommendation",
      title: `Outreach gap: ${topGap.billId} has ${topGap.targets.length} uncontacted targets`,
      narrative: `${topGap.billId} (${topGap.stage}, ${(topGap.passageProbability * 100).toFixed(0)}% passage est.) has ${topGap.targets.length} identified influence targets but NONE have been engaged. Top leverage: ${topGap.targets.slice(0, 3).map(t => `${t.name} (${t.leverage}pts)`).join(", ")}. ${topGap.recommendations[0] ?? ""}`,
      sources: ["influence-map"],
      confidence: 0.82,
      relatedEntities: [{ type: "bill", id: topGap.billId, label: topGap.title }],
    });
  }

  // 20. Pivotal legislators — appear across multiple high-priority bills
  for (const pivotal of influenceMap.pivotalLegislators.slice(0, 2)) {
    if (pivotal.billCount >= 3) {
      insights.push({
        priority: 2,
        category: "strategic_recommendation",
        title: `Pivotal legislator: ${pivotal.name} influences ${pivotal.billCount} bills`,
        narrative: `${pivotal.name} (${pivotal.party}) appears as an influence target across ${pivotal.billCount} tracked bills (avg leverage: ${pivotal.avgLeverage}). Engaging this single legislator could impact: ${pivotal.billIds.slice(0, 5).join(", ")}. This is a high-efficiency outreach opportunity.`,
        sources: ["influence-map"],
        confidence: 0.8,
        relatedEntities: [{ type: "stakeholder", id: pivotal.name, label: pivotal.name }],
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
  const bipartisanCount = sponsors.bipartisanBills.length;

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
  if (bipartisanCount > 0) {
    summaryParts.push(`${bipartisanCount} bipartisan bill${bipartisanCount !== 1 ? "s" : ""} identified`);
  }

  const modelStatus = forecast?.grade.trendDirection === "degrading" ? " ⚠ Model accuracy declining." : "";
  const executiveSummary = summaryParts.length > 0
    ? `Intelligence briefing identified ${summaryParts.join(", ")}. The legislative landscape is ${risk.regime === "floor_action" || risk.regime === "sine_die" ? "in a high-activity phase" : "in a " + risk.regime.replace(/_/g, " ") + " phase"}. ${insights.length} total strategic insight${insights.length !== 1 ? "s" : ""} generated from cross-referencing ${velocity.vectors.length} velocity vectors, ${correlations.clusters.length} bill clusters, ${influence.profiles.length} stakeholder profiles, ${risk.assessments.length} risk assessments, ${sponsors.networkStats.totalSponsors} sponsor profiles, ${legislators.totalLegislators} legislator intelligence profiles, ${influenceMap.maps.length} bill influence maps, and ${anomalies.anomalies.length} anomaly detections in ${analysisTimeMs}ms.${modelStatus}`
    : `No critical situations detected. The legislative landscape is in a ${risk.regime.replace(/_/g, " ")} phase. System monitoring ${velocity.vectors.length} activity vectors across ${risk.assessments.length} assessed bills. Sponsor network tracking ${sponsors.networkStats.totalSponsors} legislators. ${legislators.totalLegislators} legislator profiles generated. Analysis completed in ${analysisTimeMs}ms.${modelStatus}`;

  const insightCounts: Record<string, number> = {};
  for (const ins of insights) {
    insightCounts[ins.category] = (insightCounts[ins.category] ?? 0) + 1;
  }

  // ── Delta computation ───────────────────────────────────────────────────
  const delta: DeltaBriefing = forecast?.delta ?? {
    previousSnapshotId: null,
    previousCapturedAt: null,
    newRisks: [],
    resolvedRisks: [],
    escalatedRisks: [],
    deescalatedRisks: [],
    newAnomalies: 0,
    resolvedAnomalies: 0,
    newClusters: 0,
    threatTrend: "stable",
    narrative: "First briefing — no comparison available yet. Future briefings will track changes automatically.",
  };

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
    sponsors,
    historical,
    legislators,
    influenceMap,
    forecast: forecast ?? {
      analyzedAt: new Date().toISOString(),
      currentSnapshot: { snapshotId: "", capturedAt: "", predictions: [], regime: risk.regime, totalInsights: 0, criticalRiskCount: 0, anomalyCount: 0 },
      delta,
      grade: { windowStart: "", windowEnd: "", totalPredictions: 0, verifiablePredictions: 0, accuracy: { overall: 0, calibration: [], rankingAccuracy: 0 }, blindSpots: [], trendDirection: "insufficient_data", narrative: "Forecast system initializing." },
      historyDepth: 0,
    },
    delta,
    analysisTimeMs,
  };
}
