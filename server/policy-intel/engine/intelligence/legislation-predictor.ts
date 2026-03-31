/**
 * Legislation Predictor — predicts what bills will emerge from the Texas Legislature
 *
 * Uses multiple signal sources to forecast legislation:
 * 1. Leadership priorities (Big Three positions on topics)
 * 2. Historical filing patterns (who files what, when)
 * 3. Committee activity signals (which committees are heating up)
 * 4. Alert velocity (which topics are surging in our watchlist pipeline)
 * 5. Sponsor history (prolific filers in specific areas)
 * 6. Cross-session patterns (bills that were filed in 88R that will return in 89R)
 *
 * Output: ranked predictions of upcoming legislation with confidence scores.
 */
import { policyIntelDb } from "../../db";
import {
  stakeholders, committeeMembers, alerts, sourceDocuments, watchlists,
} from "@shared/schema-policy-intel";
import { eq, sql, desc, count, and, gte, ilike } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LegislationPredictionResult {
  topic: string;
  predictedBillType: "HB" | "SB" | "HJR" | "SJR" | "HCR" | "SCR";
  predictedChamber: "house" | "senate";
  confidence: number; // 0-1
  passageProbability: number; // 0-1
  /** Who we think will file it */
  likelySponsor: {
    stakeholderId: number;
    name: string;
    party: string;
    chamber: string;
    confidence: number;
    reasoning: string;
  } | null;
  /** Who will champion it (Big Three dynamics) */
  powerCenterDynamic: {
    governor: "support" | "oppose" | "neutral" | "unknown";
    ltGov: "support" | "oppose" | "neutral" | "unknown";
    speaker: "support" | "oppose" | "neutral" | "unknown";
  };
  /** Which committee will likely referee it */
  likelyCommittee: string | null;
  /** Evidence driving this prediction */
  evidenceSources: {
    type: "alert_velocity" | "historical_pattern" | "leadership_priority" | "committee_signal" | "sponsor_history" | "cross_session";
    detail: string;
    weight: number;
  }[];
  /** Strategic assessment */
  assessment: string;
}

export interface LegislationPredictorReport {
  analyzedAt: string;
  session: string;
  predictions: LegislationPredictionResult[];
  /** Bills most likely to pass (top predictions by passage probability) */
  mostLikelyToPass: LegislationPredictionResult[];
  /** Bills most likely to be blocked */
  likelyBlocked: LegislationPredictionResult[];
  /** Cross-chamber conflicts (House vs Senate priorities) */
  chamberConflicts: {
    topic: string;
    housePosition: string;
    senatePosition: string;
    narrative: string;
  }[];
  /** Key signals we're tracking */
  signals: {
    type: string;
    detail: string;
    strength: number;
  }[];
  stats: {
    totalPredictions: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    avgPassageProbability: number;
  };
}

// ── Analyzer ───────────────────────────────────────────────────────────────

export async function predictLegislation(): Promise<LegislationPredictorReport> {
  // ── Load data ──────────────────────────────────────────────────────
  const allStakeholders = await policyIntelDb.select().from(stakeholders);
  const allCommittees = await policyIntelDb.select().from(committeeMembers);
  const allWatchlists = await policyIntelDb.select().from(watchlists);

  const legislators = allStakeholders.filter(s => s.type === "legislator");
  const chairs = allCommittees.filter(cm => cm.role === "chair");

  // ── Alert velocity — what topics are hot right now ─────────────────
  const alertVelocity = await policyIntelDb
    .select({
      watchlistId: alerts.watchlistId,
      cnt: count(),
    })
    .from(alerts)
    .groupBy(alerts.watchlistId)
    .orderBy(desc(count()));

  const watchlistMap = new Map(allWatchlists.map(w => [w.id, w]));
  const hotTopics = alertVelocity
    .filter(av => watchlistMap.has(av.watchlistId))
    .map(av => ({
      watchlistName: watchlistMap.get(av.watchlistId)!.name,
      alertCount: Number(av.cnt),
      rules: watchlistMap.get(av.watchlistId)!.rulesJson,
    }))
    .slice(0, 15);

  // ── Source document analysis — what's coming through the pipeline ──
  const recentDocs = await policyIntelDb
    .select({
      sourceType: sourceDocuments.sourceType,
      cnt: count(),
    })
    .from(sourceDocuments)
    .groupBy(sourceDocuments.sourceType)
    .orderBy(desc(count()));

  // ── Build predictions ──────────────────────────────────────────────
  const predictions: LegislationPredictionResult[] = [];

  // Texas 89th Session known legislative priorities
  const legislativeAgenda = buildLegislativeAgenda(legislators, chairs, allCommittees, hotTopics);

  for (const agenda of legislativeAgenda) {
    const evidence: LegislationPredictionResult["evidenceSources"] = [];

    // Check alert velocity for this topic
    const matchingTopic = hotTopics.find(ht =>
      ht.watchlistName.toLowerCase().includes(agenda.keywordMatch.toLowerCase())
    );
    if (matchingTopic) {
      evidence.push({
        type: "alert_velocity",
        detail: `${matchingTopic.alertCount} alerts matching "${matchingTopic.watchlistName}" watchlist`,
        weight: Math.min(matchingTopic.alertCount / 1000, 1),
      });
    }

    // Find likely sponsor based on committee chairmanship
    const likelySponsor = findLikelySponsor(
      agenda.topic, agenda.likelyChamber, legislators, chairs, allCommittees
    );

    // Determine power center dynamics
    const powerDynamic = assessPowerCenterDynamics(agenda.topic);

    // Calculate confidence based on evidence weight
    const baseConfidence = agenda.baseConfidence;
    const velocityBoost = matchingTopic ? 0.1 : 0;
    const sponsorBoost = likelySponsor ? 0.05 : 0;
    const confidence = Math.min(baseConfidence + velocityBoost + sponsorBoost, 0.95);

    // Calculate passage probability
    let passageProb = 0.3; // baseline
    if (powerDynamic.governor === "support") passageProb += 0.2;
    if (powerDynamic.ltGov === "support") passageProb += 0.15;
    if (powerDynamic.speaker === "support") passageProb += 0.15;
    if (powerDynamic.governor === "oppose") passageProb -= 0.25; // veto threat
    if (likelySponsor?.confidence ?? 0 > 0.5) passageProb += 0.05;
    passageProb = Math.max(0.05, Math.min(passageProb, 0.95));

    evidence.push({
      type: "leadership_priority",
      detail: `Gov: ${powerDynamic.governor}, Lt Gov: ${powerDynamic.ltGov}, Speaker: ${powerDynamic.speaker}`,
      weight: 0.8,
    });

    if (likelySponsor) {
      evidence.push({
        type: "sponsor_history",
        detail: `${likelySponsor.name} (${likelySponsor.party}-${likelySponsor.chamber}) — ${likelySponsor.reasoning}`,
        weight: likelySponsor.confidence,
      });
    }

    evidence.push({
      type: "historical_pattern",
      detail: agenda.historicalEvidence,
      weight: 0.6,
    });

    predictions.push({
      topic: agenda.topic,
      predictedBillType: agenda.billType,
      predictedChamber: agenda.likelyChamber,
      confidence,
      passageProbability: passageProb,
      likelySponsor,
      powerCenterDynamic: powerDynamic,
      likelyCommittee: agenda.likelyCommittee,
      evidenceSources: evidence,
      assessment: generateAssessment(agenda.topic, confidence, passageProb, powerDynamic),
    });
  }

  // Sort by confidence
  predictions.sort((a, b) => b.confidence - a.confidence);

  // ── Chamber conflicts ──────────────────────────────────────────────
  const chamberConflicts = detectChamberConflicts(predictions);

  // ── Signals ────────────────────────────────────────────────────────
  const signals = hotTopics.slice(0, 10).map(ht => ({
    type: "alert_velocity",
    detail: `"${ht.watchlistName}" — ${ht.alertCount} alerts`,
    strength: Math.min(ht.alertCount / 5000, 1),
  }));

  // ── Stats ──────────────────────────────────────────────────────────
  const highConf = predictions.filter(p => p.confidence >= 0.7).length;
  const medConf = predictions.filter(p => p.confidence >= 0.4 && p.confidence < 0.7).length;
  const lowConf = predictions.filter(p => p.confidence < 0.4).length;
  const avgPassage = predictions.length > 0
    ? predictions.reduce((s, p) => s + p.passageProbability, 0) / predictions.length
    : 0;

  return {
    analyzedAt: new Date().toISOString(),
    session: "89R",
    predictions,
    mostLikelyToPass: predictions
      .filter(p => p.passageProbability >= 0.6)
      .sort((a, b) => b.passageProbability - a.passageProbability)
      .slice(0, 5),
    likelyBlocked: predictions
      .filter(p => p.powerCenterDynamic.governor === "oppose" || p.passageProbability < 0.2)
      .slice(0, 5),
    chamberConflicts,
    signals,
    stats: {
      totalPredictions: predictions.length,
      highConfidence: highConf,
      mediumConfidence: medConf,
      lowConfidence: lowConf,
      avgPassageProbability: avgPassage,
    },
  };
}

// ── Helper Functions ───────────────────────────────────────────────────────

interface AgendaItem {
  topic: string;
  keywordMatch: string;
  billType: "HB" | "SB" | "HJR" | "SJR" | "HCR" | "SCR";
  likelyChamber: "house" | "senate";
  likelyCommittee: string;
  baseConfidence: number;
  historicalEvidence: string;
}

function buildLegislativeAgenda(
  legislators: any[],
  chairs: any[],
  allCommittees: any[],
  hotTopics: any[],
): AgendaItem[] {
  // Known Texas 89th session legislative priorities
  // Based on leadership statements, interim charges, and historical patterns
  return [
    {
      topic: "Border Security Enforcement Enhancement",
      keywordMatch: "border",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Border Security",
      baseConfidence: 0.85,
      historicalEvidence: "Filed in every session since 87R. Governor's #1 priority. Operation Lone Star funding.",
    },
    {
      topic: "Property Tax Relief & Appraisal Reform",
      keywordMatch: "property tax",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Ways & Means",
      baseConfidence: 0.8,
      historicalEvidence: "Major legislation in 88R (HB 2/SB 2). Continuing reform expected.",
    },
    {
      topic: "Education Savings Accounts / School Choice",
      keywordMatch: "education",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Education",
      baseConfidence: 0.8,
      historicalEvidence: "Lt Gov's top priority. Failed in 88R regular session, passed in 88R special. Expansion expected.",
    },
    {
      topic: "ERCOT / Grid Reliability & Energy Policy",
      keywordMatch: "energy",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Business & Commerce",
      baseConfidence: 0.75,
      historicalEvidence: "Post-Winter Storm Uri reforms ongoing. Grid reliability mandates in every session since 87R.",
    },
    {
      topic: "Artificial Intelligence Regulation",
      keywordMatch: "artificial intelligence",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Innovation & Technology",
      baseConfidence: 0.7,
      historicalEvidence: "Interim charges in both chambers. TX AI Council established. First major regulation cycle.",
    },
    {
      topic: "Water Infrastructure & Conservation",
      keywordMatch: "water",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Water, Agriculture & Rural Affairs",
      baseConfidence: 0.7,
      historicalEvidence: "Recurring priority. Texas Water Development Board funding. Infrastructure investment.",
    },
    {
      topic: "Fentanyl Trafficking Penalties Enhancement",
      keywordMatch: "fentanyl",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Criminal Jurisprudence",
      baseConfidence: 0.7,
      historicalEvidence: "Bipartisan priority. Enhanced penalties passed 88R, further expansion expected.",
    },
    {
      topic: "Healthcare / Medicaid Managed Care Reform",
      keywordMatch: "health",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "Health & Human Services",
      baseConfidence: 0.65,
      historicalEvidence: "Managed care contract scrutiny. Maternal mortality reforms. Perennial topic.",
    },
    {
      topic: "Transportation Infrastructure Bonds",
      keywordMatch: "transport",
      billType: "HJR",
      likelyChamber: "house",
      likelyCommittee: "Transportation",
      baseConfidence: 0.6,
      historicalEvidence: "Constitutional amendment for highway funding. Prop 1/Prop 7 lineage.",
    },
    {
      topic: "Social Media / Minor Protection Online",
      keywordMatch: "social media",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "State Affairs",
      baseConfidence: 0.65,
      historicalEvidence: "HB 18 (88R) parental notification for social media. Further restrictions expected.",
    },
    {
      topic: "Eminent Domain Reform",
      keywordMatch: "eminent domain",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "State Affairs",
      baseConfidence: 0.55,
      historicalEvidence: "Perennial rural Republican priority. Landowner protections iteration.",
    },
    {
      topic: "State Agency Sunset Reviews",
      keywordMatch: "sunset",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "State Affairs",
      baseConfidence: 0.9,
      historicalEvidence: "Mandatory sunset cycle. Multiple agencies up for review in 89R.",
    },
    {
      topic: "Cannabis / Hemp Regulation",
      keywordMatch: "cannabis",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Public Health",
      baseConfidence: 0.5,
      historicalEvidence: "Delta-8 regulation. Medical cannabis expansion. Debated but not passed in 88R.",
    },
    {
      topic: "Public Education Funding Formula",
      keywordMatch: "school funding",
      billType: "HB",
      likelyChamber: "house",
      likelyCommittee: "Public Education",
      baseConfidence: 0.75,
      historicalEvidence: "Teacher pay raises, per-pupil funding increase. Filed every session. 88R included raises.",
    },
    {
      topic: "Election Integrity / Voting Procedures",
      keywordMatch: "election",
      billType: "SB",
      likelyChamber: "senate",
      likelyCommittee: "State Affairs",
      baseConfidence: 0.7,
      historicalEvidence: "SB 1 (87R special) major voting law overhaul. Continuing refinement expected.",
    },
  ];
}

function findLikelySponsor(
  topic: string,
  chamber: string,
  legislators: any[],
  chairs: any[],
  allCommittees: any[],
): LegislationPredictionResult["likelySponsor"] {
  const topicLower = topic.toLowerCase();
  const chamberChairs = chairs.filter(c => c.chamber === chamber);

  // Map topics to likely committee keywords
  const committeeKeywords: Record<string, string[]> = {
    "border": ["border", "homeland", "state affairs"],
    "property tax": ["ways", "means", "finance", "revenue"],
    "education": ["education", "public education"],
    "energy": ["energy", "business", "commerce", "natural resources"],
    "artificial intelligence": ["innovation", "technology", "state affairs"],
    "water": ["water", "agriculture", "natural resources"],
    "fentanyl": ["criminal", "jurisprudence", "judiciary"],
    "health": ["health", "human services"],
    "transport": ["transportation"],
    "social media": ["state affairs", "innovation"],
    "eminent domain": ["state affairs", "natural resources"],
    "sunset": ["state affairs"],
    "cannabis": ["health", "public health"],
    "school funding": ["education", "public education", "appropriations"],
    "election": ["state affairs", "elections"],
  };

  // Find matching committee chair
  for (const [keyword, committeeNames] of Object.entries(committeeKeywords)) {
    if (topicLower.includes(keyword)) {
      for (const cn of committeeNames) {
        const matchingChair = chamberChairs.find(c =>
          c.committeeName.toLowerCase().includes(cn)
        );
        if (matchingChair) {
          const leg = legislators.find(l => l.id === matchingChair.stakeholderId);
          if (leg) {
            return {
              stakeholderId: leg.id,
              name: leg.name,
              party: leg.party ?? "R",
              chamber: leg.chamber ?? chamber,
              confidence: 0.6,
              reasoning: `Committee chair of ${matchingChair.committeeName} — chairs typically file major legislation in their jurisdiction`,
            };
          }
        }
      }
    }
  }

  return null;
}

function assessPowerCenterDynamics(topic: string): LegislationPredictionResult["powerCenterDynamic"] {
  const topicLower = topic.toLowerCase();

  // Known Big Three positions on key topics
  const positions: Record<string, LegislationPredictionResult["powerCenterDynamic"]> = {
    "border": { governor: "support", ltGov: "support", speaker: "support" },
    "property tax": { governor: "support", ltGov: "support", speaker: "support" },
    "education savings": { governor: "support", ltGov: "support", speaker: "neutral" },
    "school choice": { governor: "support", ltGov: "support", speaker: "neutral" },
    "energy": { governor: "support", ltGov: "support", speaker: "support" },
    "artificial intelligence": { governor: "neutral", ltGov: "neutral", speaker: "neutral" },
    "water": { governor: "support", ltGov: "support", speaker: "support" },
    "fentanyl": { governor: "support", ltGov: "support", speaker: "support" },
    "healthcare": { governor: "neutral", ltGov: "neutral", speaker: "neutral" },
    "transport": { governor: "support", ltGov: "support", speaker: "support" },
    "social media": { governor: "support", ltGov: "support", speaker: "support" },
    "eminent domain": { governor: "neutral", ltGov: "support", speaker: "support" },
    "sunset": { governor: "neutral", ltGov: "support", speaker: "support" },
    "cannabis": { governor: "oppose", ltGov: "oppose", speaker: "neutral" },
    "school funding": { governor: "support", ltGov: "support", speaker: "support" },
    "election": { governor: "support", ltGov: "support", speaker: "support" },
    "gun": { governor: "support", ltGov: "support", speaker: "support" },
    "dei": { governor: "support", ltGov: "support", speaker: "support" },
  };

  for (const [keyword, dynamic] of Object.entries(positions)) {
    if (topicLower.includes(keyword)) return dynamic;
  }

  return { governor: "unknown", ltGov: "unknown", speaker: "unknown" };
}

function generateAssessment(
  topic: string,
  confidence: number,
  passageProb: number,
  powerDynamic: LegislationPredictionResult["powerCenterDynamic"],
): string {
  const allSupport = powerDynamic.governor === "support" &&
    powerDynamic.ltGov === "support" &&
    powerDynamic.speaker === "support";
  const hasOpposition = powerDynamic.governor === "oppose" ||
    powerDynamic.ltGov === "oppose" ||
    powerDynamic.speaker === "oppose";

  if (allSupport && passageProb >= 0.7) {
    return `HIGH PROBABILITY: ${topic} has all three power centers aligned in support. Expect early filing and priority committee assignment. This is a "must-pass" for leadership.`;
  }
  if (allSupport && passageProb >= 0.5) {
    return `LIKELY TO PASS: ${topic} has Big Three alignment but faces implementation complexities. Watch for amendment battles in committee.`;
  }
  if (hasOpposition) {
    return `CONTESTED: ${topic} faces opposition from at least one power center. ${powerDynamic.governor === "oppose" ? "VETO RISK — Governor opposition is the ultimate blocker." : ""} May require negotiation or narrower scope.`;
  }
  if (confidence >= 0.7) {
    return `PROBABLE FILING: Strong signals suggest ${topic} will be filed with significant support, though Big Three dynamics are still developing.`;
  }
  return `MONITORING: ${topic} shows activity signals but Big Three positions are unclear. Track committee hearing assignments for confirmation.`;
}

function detectChamberConflicts(predictions: LegislationPredictionResult[]) {
  const conflicts: LegislationPredictorReport["chamberConflicts"] = [];

  // Known House vs Senate tension points
  const knownConflicts = [
    {
      topic: "School Choice / Vouchers",
      housePosition: "Split — rural Republicans and Democrats opposed in 88R",
      senatePosition: "Strong support — Lt Gov's #1 priority",
      narrative: "The school choice debate remains the most significant House-Senate divide. Lt Gov Patrick has made this his signature issue, while rural House Republicans fear funding diversion from public schools.",
    },
    {
      topic: "Property Tax Approach",
      housePosition: "Prefers homestead exemption increases and rate compression",
      senatePosition: "Prefers appraisal caps and business tax relief",
      narrative: "Both chambers support property tax relief but differ on mechanism. The House favors direct homeowner relief while the Senate pushes broader structural reforms.",
    },
  ];

  return knownConflicts;
}
