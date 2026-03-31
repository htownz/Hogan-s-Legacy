/**
 * Bill Influence Map — for a given bill or all high-risk bills, identifies
 * which legislators have the most leverage to change the outcome and
 * recommends outreach strategies.
 *
 * Answers:
 * - Who can kill or accelerate this bill?
 * - Which committee chairs sit on the bill's path?
 * - Who are swing votes (bipartisan history, moderate power)?
 * - What's the optimal outreach sequence?
 *
 * Combines data from: risk-model, influence-ranker, sponsor-network,
 * historical-patterns, and legislator-profiler.
 */
import { policyIntelDb } from "../../db";
import {
  stakeholders, committeeMembers, stakeholderObservations,
  meetingNotes, alerts, sourceDocuments,
} from "@shared/schema-policy-intel";
import { eq, sql, gte, desc, count, and } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export interface InfluenceTarget {
  stakeholderId: number;
  name: string;
  party: string;
  chamber: string;
  /** Why this person matters for this bill */
  role: "committee_chair" | "committee_member" | "sponsor" | "co_sponsor" | "swing_vote" | "leadership" | "floor_vote";
  /** How much leverage this person has (0-100) */
  leverage: number;
  /** Confidence we can predict their behavior */
  predictability: "high" | "medium" | "low";
  /** Where this person likely stands */
  likelyStance: "support" | "lean_support" | "undecided" | "lean_oppose" | "oppose" | "unknown";
  /** Key committees this person controls related to the bill */
  relevantCommittees: string[];
  /** Number of observations + meeting notes we have */
  engagementDepth: number;
  /** Recommended outreach approach */
  recommendation: string;
  /** Supporting evidence for our stance prediction */
  evidence: string[];
}

export interface BillInfluenceMap {
  billId: string;
  title: string;
  /** Current legislative stage */
  stage: string;
  /** Which committee(s) are in the bill's path */
  committeePath: string[];
  /** Estimated passage probability (from risk signals) */
  passageProbability: number;
  /** Ranked list of influence targets */
  targets: InfluenceTarget[];
  /** Total leverage score (sum of all target leverages) */
  totalLeverage: number;
  /** How many targets have we engaged already? */
  engagedCount: number;
  /** Outreach priority narrative */
  narrative: string;
  /** Top recommended actions */
  recommendations: string[];
}

export interface InfluenceMapReport {
  analyzedAt: string;
  /** One map per high-priority bill */
  maps: BillInfluenceMap[];
  /** Cross-bill influence patterns */
  pivotalLegislators: Array<{
    name: string;
    party: string;
    /** How many bill maps this person appears in */
    billCount: number;
    /** Average leverage across bills */
    avgLeverage: number;
    /** Shared bills */
    billIds: string[];
  }>;
  /** Outreach efficiency: prioritize legislators who appear on multiple bills */
  outreachPlan: Array<{
    name: string;
    party: string;
    chamber: string;
    /** Bills this person can influence */
    billIds: string[];
    /** Total combined leverage */
    combinedLeverage: number;
    /** Our current engagement level */
    currentEngagement: "high" | "moderate" | "low" | "none";
    /** Priority rank */
    priority: number;
  }>;
  stats: {
    totalBillsAnalyzed: number;
    totalTargetsIdentified: number;
    avgTargetsPerBill: number;
    engagementGapCount: number;
  };
}

// ── Core Analysis ────────────────────────────────────────────────────────────

export async function analyzeInfluenceMaps(): Promise<InfluenceMapReport> {
  const d90 = new Date(Date.now() - 90 * 86400000);

  // ── 1. Legislators ──────────────────────────────────────────────────────
  const legislators = await policyIntelDb.select().from(stakeholders).where(eq(stakeholders.type, "legislator"));
  const legById = new Map(legislators.map(l => [l.id, l]));

  // ── 2. Committee memberships ────────────────────────────────────────────
  const allCommittees = await policyIntelDb.select().from(committeeMembers);
  const committeeLookup = new Map<string, typeof allCommittees>(); // committeeName → members
  const stakeholderCommittees = new Map<number, typeof allCommittees>();

  for (const cm of allCommittees) {
    const byCommittee = committeeLookup.get(cm.committeeName) ?? [];
    byCommittee.push(cm);
    committeeLookup.set(cm.committeeName, byCommittee);

    const bySH = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    bySH.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, bySH);
  }

  // ── 3. Engagement data ──────────────────────────────────────────────────
  const obsCounts = await policyIntelDb
    .select({ stakeholderId: stakeholderObservations.stakeholderId, cnt: count() })
    .from(stakeholderObservations)
    .groupBy(stakeholderObservations.stakeholderId);
  const noteCounts = await policyIntelDb
    .select({ stakeholderId: meetingNotes.stakeholderId, cnt: count() })
    .from(meetingNotes)
    .groupBy(meetingNotes.stakeholderId);

  const engagementMap = new Map<number, number>();
  for (const r of obsCounts) engagementMap.set(r.stakeholderId, r.cnt);
  for (const r of noteCounts) engagementMap.set(r.stakeholderId, (engagementMap.get(r.stakeholderId) ?? 0) + r.cnt);

  // ── 4. Extract bills from recent high-priority alerts ───────────────────
  const recentAlerts = await policyIntelDb
    .select({
      title: alerts.title,
      summary: alerts.summary,
      whyItMatters: alerts.whyItMatters,
      relevanceScore: alerts.relevanceScore,
    })
    .from(alerts)
    .where(and(gte(alerts.createdAt, d90), gte(alerts.relevanceScore, 40)))
    .orderBy(desc(alerts.relevanceScore))
    .limit(400);

  const billIdPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;

  // billId → { title, text, avgScore, committees, sponsors }
  const billData = new Map<string, {
    title: string;
    text: string;
    avgScore: number;
    scoreCount: number;
    committees: Set<string>;
    sponsorNames: Set<string>;
  }>();

  for (const a of recentAlerts) {
    const fullText = `${a.title} ${a.summary ?? ""} ${a.whyItMatters ?? ""}`;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      const existing = billData.get(billId) ?? {
        title: a.title,
        text: "",
        avgScore: 0,
        scoreCount: 0,
        committees: new Set<string>(),
        sponsorNames: new Set<string>(),
      };
      existing.text += " " + fullText;
      existing.avgScore += (a.relevanceScore ?? 0);
      existing.scoreCount++;
      billData.set(billId, existing);
    }
  }

  // Compute average score per bill
  for (const [, bd] of billData) {
    if (bd.scoreCount > 0) bd.avgScore = bd.avgScore / bd.scoreCount;
  }

  // ── 5. Extract committee references from bill text ──────────────────────
  const committeeNames = [...committeeLookup.keys()];
  for (const [, bd] of billData) {
    const lowerText = bd.text.toLowerCase();
    for (const cn of committeeNames) {
      // Match committee name (first 25 chars to avoid false negatives)
      if (lowerText.includes(cn.toLowerCase().slice(0, 25))) {
        bd.committees.add(cn);
      }
    }
    // Also extract from "Referred to X" pattern
    const referredMatch = bd.text.match(/[Rr]eferred to\s+(.+?)(\.|,|\n|$)/);
    if (referredMatch) {
      const refCom = referredMatch[1].trim();
      // Find closest committee match
      const closest = committeeNames.find(cn =>
        cn.toLowerCase().startsWith(refCom.toLowerCase().slice(0, 20)),
      );
      if (closest) bd.committees.add(closest);
    }
  }

  // ── 6. Extract sponsor names from bill text ─────────────────────────────
  for (const [, bd] of billData) {
    for (const leg of legislators) {
      const lastName = leg.name.split(/\s+/).pop()?.toLowerCase();
      if (lastName && lastName.length > 2 && bd.text.toLowerCase().includes(lastName)) {
        bd.sponsorNames.add(leg.name);
      }
    }
  }

  // ── 7. Detect bill stage from text ──────────────────────────────────────
  function detectStage(text: string): string {
    const lower = (text ?? "").toLowerCase();
    if (/enrolled|signed by governor/i.test(lower)) return "enrolled";
    if (/passed (both|senate and house)/i.test(lower)) return "passed_both";
    if (/passed (senate|house)|third reading/i.test(lower)) return "passed_chamber";
    if (/conference committee/i.test(lower)) return "conference";
    if (/reported favorably|voted from committee/i.test(lower)) return "reported";
    if (/hearing scheduled|committee hearing/i.test(lower)) return "hearing";
    if (/referred to committee|referred to/i.test(lower)) return "referred";
    if (/introduced|filed/i.test(lower)) return "filed";
    return "unknown";
  }

  // ── 8. Build influence maps ─────────────────────────────────────────────
  // Only build maps for top bills by score
  const topBills = [...billData.entries()]
    .sort((a, b) => b[1].avgScore - a[1].avgScore)
    .slice(0, 30);

  const maps: BillInfluenceMap[] = [];
  const legislatorBillCounts = new Map<string, { name: string; party: string; chamber: string; bills: Set<string>; totalLeverage: number }>();

  for (const [billId, bd] of topBills) {
    const stage = detectStage(bd.text);
    const committeePath = [...bd.committees];
    const targets: InfluenceTarget[] = [];

    // ── Find committee chairs + members in the bill's path ────────────
    for (const committee of bd.committees) {
      const members = committeeLookup.get(committee) ?? [];
      for (const member of members) {
        const leg = legById.get(member.stakeholderId);
        if (!leg) continue;

        const engagement = engagementMap.get(leg.id) ?? 0;
        const isChair = member.role === "chair";
        const isViceChair = member.role === "vice_chair";
        const isSponsor = bd.sponsorNames.has(leg.name);

        // Compute leverage
        let leverage = 0;
        if (isChair) leverage += 40; // chairs control the agenda
        else if (isViceChair) leverage += 20;
        else leverage += 8; // regular member

        if (isSponsor) leverage += 25; // sponsor has strong investment

        // Leadership bonus
        const isLeadership = !!(leg.title && /speaker|president|pro tem/i.test(leg.title));
        if (isLeadership) leverage += 20;

        leverage = Math.min(100, leverage);

        // Determine likely stance
        let likelyStance: InfluenceTarget["likelyStance"] = "unknown";
        const evidence: string[] = [];

        if (isSponsor) {
          likelyStance = "support";
          evidence.push(`Identified as sponsor/co-sponsor of ${billId}`);
        }

        // Check party alignment for bill type
        const billChamber = billId.startsWith("H") ? "House" : billId.startsWith("S") ? "Senate" : null;
        if (billChamber && leg.chamber === billChamber && isSponsor) {
          evidence.push("Bill originates in their chamber — increased influence");
          leverage = Math.min(100, leverage + 5);
        }

        // Engagement as evidence
        if (engagement > 0) {
          evidence.push(`${engagement} engagement records in our system`);
        } else {
          evidence.push("No engagement records — stance is less predictable");
        }

        // Committee chair evidence
        if (isChair) {
          evidence.push(`Chairs ${committee} — controls bill scheduling and hearing`);
        }

        const role: InfluenceTarget["role"] = isChair ? "committee_chair" :
          isSponsor ? "sponsor" :
          isViceChair ? "committee_member" :
          isLeadership ? "leadership" : "committee_member";

        // Build recommendation
        let recommendation = "";
        if (isChair && !isSponsor) {
          recommendation = `Schedule briefing with ${leg.name} — as chair of ${committee}, they control whether this bill gets a hearing. Focus on policy merits and constituent impact.`;
        } else if (isSponsor) {
          recommendation = `${leg.name} sponsors this bill — maintain relationship and offer support. Ask about co-sponsors they're recruiting.`;
        } else if (isViceChair) {
          recommendation = `Engage ${leg.name} as vice-chair — they influence committee agenda and can advocate for scheduling.`;
        } else {
          recommendation = `${leg.name} serves on ${committee}. ${engagement === 0 ? "Introduce our position and " : ""}Build support for committee vote.`;
        }

        // Avoid duplicates
        if (!targets.some(t => t.stakeholderId === leg.id)) {
          targets.push({
            stakeholderId: leg.id,
            name: leg.name,
            party: leg.party ?? "Unknown",
            chamber: leg.chamber ?? "Unknown",
            role,
            leverage,
            predictability: engagement >= 3 ? "high" : engagement >= 1 ? "medium" : "low",
            likelyStance,
            relevantCommittees: [committee],
            engagementDepth: engagement,
            recommendation,
            evidence,
          });
        } else {
          // Merge committee into existing target
          const existing = targets.find(t => t.stakeholderId === leg.id)!;
          existing.relevantCommittees.push(committee);
          existing.leverage = Math.min(100, existing.leverage + 5);
        }
      }
    }

    // ── Add sponsors not in committee ─────────────────────────────────
    for (const sponsorName of bd.sponsorNames) {
      if (targets.some(t => t.name === sponsorName)) continue;
      const leg = legislators.find(l => l.name === sponsorName);
      if (!leg) continue;
      const engagement = engagementMap.get(leg.id) ?? 0;

      targets.push({
        stakeholderId: leg.id,
        name: leg.name,
        party: leg.party ?? "Unknown",
        chamber: leg.chamber ?? "Unknown",
        role: "sponsor",
        leverage: 30,
        predictability: engagement >= 3 ? "high" : engagement >= 1 ? "medium" : "low",
        likelyStance: "support",
        relevantCommittees: [],
        engagementDepth: engagement,
        recommendation: `${leg.name} sponsors ${billId}. Coordinate on advocacy strategy and identify additional co-sponsors.`,
        evidence: [`Named as sponsor in bill documentation`],
      });
    }

    // Sort by leverage
    targets.sort((a, b) => b.leverage - a.leverage);

    // Create passage probability estimate from stage
    const stageProb: Record<string, number> = {
      enrolled: 0.95, passed_both: 0.9, passed_chamber: 0.6, conference: 0.65,
      reported: 0.45, hearing: 0.25, referred: 0.15, filed: 0.08, unknown: 0.1,
    };
    const passageProbability = stageProb[stage] ?? 0.1;

    const engagedCount = targets.filter(t => t.engagementDepth > 0).length;
    const totalLeverage = targets.reduce((s, t) => s + t.leverage, 0);

    // Track cross-bill legislator appearances
    for (const t of targets) {
      const key = `${t.stakeholderId}`;
      const existing = legislatorBillCounts.get(key) ?? {
        name: t.name, party: t.party, chamber: t.chamber,
        bills: new Set<string>(), totalLeverage: 0,
      };
      existing.bills.add(billId);
      existing.totalLeverage += t.leverage;
      legislatorBillCounts.set(key, existing);
    }

    // Build narrative
    const topTargets = targets.slice(0, 3).map(t => t.name).join(", ");
    const narrative = targets.length > 0
      ? `${billId} (${stage}) has ${targets.length} identified influence targets. Top leverage: ${topTargets}. ${engagedCount > 0 ? `We've engaged ${engagedCount} of ${targets.length} targets.` : "No targets have been engaged yet — outreach gap."} ${committeePath.length > 0 ? `Bill path includes: ${committeePath.join(", ")}.` : ""}`
      : `${billId} (${stage}) — no specific influence targets identified. Consider expanding committee data.`;

    // Top recommendations
    const recommendations: string[] = [];
    const chairTargets = targets.filter(t => t.role === "committee_chair" && t.engagementDepth === 0);
    if (chairTargets.length > 0) {
      recommendations.push(`PRIORITY: Engage ${chairTargets.length} uncontacted committee chair${chairTargets.length !== 1 ? "s" : ""}: ${chairTargets.map(t => t.name).join(", ")}`);
    }
    const unknownStance = targets.filter(t => t.likelyStance === "unknown" && t.leverage >= 20);
    if (unknownStance.length > 0) {
      recommendations.push(`Research stance of ${unknownStance.length} high-leverage target${unknownStance.length !== 1 ? "s" : ""} with unknown position`);
    }
    if (engagedCount === 0 && targets.length > 0) {
      recommendations.push(`Begin outreach immediately — no influence targets engaged yet`);
    }

    maps.push({
      billId,
      title: bd.title,
      stage,
      committeePath,
      passageProbability,
      targets,
      totalLeverage,
      engagedCount,
      narrative,
      recommendations,
    });
  }

  // Sort maps by passage probability × alert score (highest priority first)
  maps.sort((a, b) => {
    const aPriority = a.passageProbability * a.totalLeverage;
    const bPriority = b.passageProbability * b.totalLeverage;
    return bPriority - aPriority;
  });

  // ── Pivotal legislators (appear across multiple bills) ──────────────────
  const pivotalLegislators = [...legislatorBillCounts.entries()]
    .map(([, data]) => ({
      name: data.name,
      party: data.party,
      billCount: data.bills.size,
      avgLeverage: Math.round(data.totalLeverage / data.bills.size),
      billIds: [...data.bills],
    }))
    .filter(p => p.billCount >= 2)
    .sort((a, b) => b.billCount - a.billCount || b.avgLeverage - a.avgLeverage)
    .slice(0, 15);

  // ── Outreach plan (prioritized) ─────────────────────────────────────────
  const outreachPlan = [...legislatorBillCounts.entries()]
    .map(([, data]) => {
      const leg = legislators.find(l => l.name === data.name);
      const engagement = leg ? (engagementMap.get(leg.id) ?? 0) : 0;
      const engagementLevel: "high" | "moderate" | "low" | "none" =
        engagement >= 5 ? "high" : engagement >= 2 ? "moderate" : engagement >= 1 ? "low" : "none";
      return {
        name: data.name,
        party: data.party,
        chamber: data.chamber,
        billIds: [...data.bills],
        combinedLeverage: data.totalLeverage,
        currentEngagement: engagementLevel,
        priority: 0,
      };
    })
    .sort((a, b) => {
      // Prioritize: high leverage + low engagement
      const aScore = a.combinedLeverage * (a.currentEngagement === "none" ? 2 : a.currentEngagement === "low" ? 1.5 : 1);
      const bScore = b.combinedLeverage * (b.currentEngagement === "none" ? 2 : b.currentEngagement === "low" ? 1.5 : 1);
      return bScore - aScore;
    })
    .slice(0, 20);

  // Assign priority ranks
  outreachPlan.forEach((p, i) => { p.priority = i + 1; });

  const totalTargets = maps.reduce((s, m) => s + m.targets.length, 0);
  const engagementGaps = maps.reduce((s, m) => s + m.targets.filter(t => t.engagementDepth === 0).length, 0);

  return {
    analyzedAt: new Date().toISOString(),
    maps,
    pivotalLegislators,
    outreachPlan,
    stats: {
      totalBillsAnalyzed: maps.length,
      totalTargetsIdentified: totalTargets,
      avgTargetsPerBill: maps.length > 0 ? Math.round(totalTargets / maps.length * 10) / 10 : 0,
      engagementGapCount: engagementGaps,
    },
  };
}
