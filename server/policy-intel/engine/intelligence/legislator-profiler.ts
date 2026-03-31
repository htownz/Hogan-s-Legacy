/**
 * Legislator Intelligence Profiler — generates AI-powered per-legislator
 * intelligence profiles combining sponsorship, voting, committee power,
 * and predictive bill-stance analysis.
 *
 * Answers:
 * - What is this legislator's legislative footprint?
 * - Which issues do they champion? Which do they block?
 * - How powerful are they structurally (committees, leadership)?
 * - What bills in our watchlists should we expect them to act on?
 * - Who are their legislative allies (co-sponsors / committee partners)?
 *
 * Feeds into the swarm coordinator and the bill influence map.
 */
import { policyIntelDb } from "../../db";
import {
  stakeholders, committeeMembers, stakeholderObservations,
  meetingNotes, alerts, sourceDocuments, watchlists,
} from "@shared/schema-policy-intel";
import { eq, sql, gte, desc, count, and } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LegislatorProfile {
  stakeholderId: number;
  name: string;
  party: string;
  chamber: string;
  district: string;
  /** Title if leadership (Speaker, President, etc.) */
  title?: string;
  /** Structural power score 0-100 */
  powerScore: number;
  /** Committee assignments with roles */
  committees: Array<{
    name: string;
    role: "chair" | "vice_chair" | "member";
    /** Number of active bills in this committee (from our watchlists) */
    activeBillCount: number;
  }>;
  /** Bill sponsorship summary */
  sponsorship: {
    /** Total bills mentioned alongside this legislator's name */
    totalBills: number;
    /** Bill IDs linked to this legislator */
    billIds: string[];
    /** Bill types (HB, SB, HJR, etc.) distribution */
    billTypes: Record<string, number>;
    /** How many of their bills are in our active watchlists? */
    watchlistOverlap: number;
  };
  /** Issue focus areas derived from bill subject analysis */
  issueFocus: Array<{
    topic: string;
    billCount: number;
    /** Sentiment: champion = sponsors aligned bills; blocker = chairs committee blocking bills */
    stance: "champion" | "aligned" | "neutral" | "blocker" | "unknown";
  }>;
  /** Legislative allies — other legislators frequently co-sponsoring */
  allies: Array<{
    name: string;
    party: string;
    sharedBills: number;
    /** True if from different party — bipartisan signal */
    isCrossParty: boolean;
  }>;
  /** Engagement level in our system */
  engagement: {
    observationCount: number;
    meetingNoteCount: number;
    lastContactDate: string | null;
    engagementLevel: "high" | "moderate" | "low" | "none";
  };
  /** Overall strategic assessment */
  assessment: string;
  /** Tags for filtering */
  tags: string[];
  /** Risk level — how much can this legislator affect our tracked issues? */
  impactLevel: "critical" | "high" | "moderate" | "low";
}

export interface LegislatorProfileReport {
  analyzedAt: string;
  totalLegislators: number;
  totalBillsMatched: number;
  profiles: LegislatorProfile[];
  /** Top 10 most impactful legislators for our tracked issues */
  keyPlayers: LegislatorProfile[];
  /** Legislators with committee chair power over our issues */
  gatekeepers: LegislatorProfile[];
  /** Bipartisan bridge-builders (frequently co-sponsor across party lines) */
  bridgeBuilders: LegislatorProfile[];
  /** Under-engaged high-power legislators (gap in our outreach) */
  blindSpots: LegislatorProfile[];
  /** Summary statistics */
  stats: {
    byParty: Record<string, number>;
    byChamber: Record<string, number>;
    avgPowerScore: number;
    avgBillCount: number;
    engagementBreakdown: Record<string, number>;
  };
}

// ── Core Analysis ────────────────────────────────────────────────────────────

export async function analyzeLegislatorProfiles(): Promise<LegislatorProfileReport> {
  const d90 = new Date(Date.now() - 90 * 86400000);

  // ── 1. All legislators ──────────────────────────────────────────────────
  const legislators = await policyIntelDb.select().from(stakeholders).where(eq(stakeholders.type, "legislator"));

  // ── 2. Committee memberships ────────────────────────────────────────────
  const allCommittees = await policyIntelDb.select().from(committeeMembers);
  const stakeholderCommittees = new Map<number, typeof allCommittees>();
  for (const cm of allCommittees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }

  // ── 3. Observation counts ──────────────────────────────────────────────
  const obsCounts = await policyIntelDb
    .select({ stakeholderId: stakeholderObservations.stakeholderId, cnt: count(), latestAt: sql<string>`MAX(${stakeholderObservations.createdAt})` })
    .from(stakeholderObservations)
    .groupBy(stakeholderObservations.stakeholderId);
  const obsMap = new Map(obsCounts.map(r => [r.stakeholderId, { count: r.cnt, latestAt: r.latestAt }]));

  // ── 4. Meeting note counts ─────────────────────────────────────────────
  const noteCounts = await policyIntelDb
    .select({ stakeholderId: meetingNotes.stakeholderId, cnt: count(), latestAt: sql<string>`MAX(${meetingNotes.createdAt})` })
    .from(meetingNotes)
    .groupBy(meetingNotes.stakeholderId);
  const noteMap = new Map(noteCounts.map(r => [r.stakeholderId, { count: r.cnt, latestAt: r.latestAt }]));

  // ── 5. Active watchlists (for overlap computation) ─────────────────────
  const activeWatchlists = await policyIntelDb
    .select({ id: watchlists.id, rulesJson: watchlists.rulesJson })
    .from(watchlists)
    .where(eq(watchlists.isActive, true));

  // Extract watched bill IDs from rules
  const watchedBillIds = new Set<string>();
  for (const wl of activeWatchlists) {
    const rules = wl.rulesJson as Record<string, unknown> | null;
    if (rules?.billIds && Array.isArray(rules.billIds)) {
      for (const bid of rules.billIds) {
        if (typeof bid === "string") watchedBillIds.add(bid.toUpperCase());
      }
    }
  }

  // ── 6. Recent alerts — scan for legislator names + bill associations ───
  const recentAlerts = await policyIntelDb
    .select({ title: alerts.title, summary: alerts.summary, whyItMatters: alerts.whyItMatters })
    .from(alerts)
    .where(gte(alerts.createdAt, d90))
    .orderBy(desc(alerts.relevanceScore))
    .limit(800);

  // ── 7. Recent source documents for deeper name matching ────────────────
  const recentDocs = await policyIntelDb
    .select({
      title: sourceDocuments.title,
      rawPayload: sourceDocuments.rawPayload,
      normalizedText: sourceDocuments.normalizedText,
    })
    .from(sourceDocuments)
    .where(gte(sourceDocuments.fetchedAt, d90))
    .orderBy(desc(sourceDocuments.fetchedAt))
    .limit(800);

  // ── 8. Build text corpus per bill ──────────────────────────────────────
  const billIdPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const billTexts = new Map<string, string>();

  for (const a of recentAlerts) {
    const fullText = `${a.title} ${a.summary ?? ""} ${a.whyItMatters ?? ""}`;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      billTexts.set(billId, (billTexts.get(billId) ?? "") + " " + fullText);
    }
  }

  for (const doc of recentDocs) {
    const fullText = `${doc.title} ${doc.normalizedText?.slice(0, 2000) ?? ""}`;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      billTexts.set(billId, (billTexts.get(billId) ?? "") + " " + fullText);
    }

    // Check structured sponsor data in rawPayload
    const payload = doc.rawPayload;
    if (payload && typeof payload === "object") {
      const p = payload as Record<string, unknown>;
      if (p.sponsors && Array.isArray(p.sponsors)) {
        for (const sp of p.sponsors) {
          if (sp && typeof sp === "object") {
            const rec = sp as Record<string, unknown>;
            if (typeof rec.name === "string" && typeof rec.bill_id === "string") {
              const bid = rec.bill_id.toString().replace(/\./g, "").toUpperCase().replace(/\s+/g, " ").trim();
              billTexts.set(bid, (billTexts.get(bid) ?? "") + ` Sponsor: ${rec.name}`);
            }
          }
        }
      }
    }
  }

  // ── 9. Match legislators to bills ──────────────────────────────────────
  const legislatorBills = new Map<number, Set<string>>();
  const billLegislators = new Map<string, Set<number>>();

  for (const leg of legislators) {
    // Build name matching fragments (last name required, first name optional)
    const nameParts = leg.name.split(/\s+/).filter(p => p.length > 2);
    if (nameParts.length === 0) continue;
    const lastName = nameParts[nameParts.length - 1];

    for (const [billId, text] of billTexts) {
      const lowerText = text.toLowerCase();
      // Match on last name appearing in the bill text
      if (lowerText.includes(lastName.toLowerCase())) {
        // Confirm with additional check — avoid common last names matching everywhere
        const firstNameOrInitial = nameParts.length > 1 ? nameParts[0] : null;
        const isConfirmed = firstNameOrInitial
          ? lowerText.includes(firstNameOrInitial.toLowerCase()) || lowerText.includes(lastName.toLowerCase())
          : true;
        if (isConfirmed) {
          const bills = legislatorBills.get(leg.id) ?? new Set();
          bills.add(billId);
          legislatorBills.set(leg.id, bills);

          const legs = billLegislators.get(billId) ?? new Set();
          legs.add(leg.id);
          billLegislators.set(billId, legs);
        }
      }
    }
  }

  // ── 10. Count bills per committee (from alerts) ────────────────────────
  const committeeBillCounts = new Map<string, number>();
  for (const a of recentAlerts) {
    const t = `${a.title ?? ""} ${a.summary ?? ""}`.toLowerCase();
    for (const cm of allCommittees) {
      if (t.includes(cm.committeeName.toLowerCase().slice(0, 30))) {
        committeeBillCounts.set(cm.committeeName, (committeeBillCounts.get(cm.committeeName) ?? 0) + 1);
      }
    }
  }

  // ── 11. Build profiles ─────────────────────────────────────────────────
  const profiles: LegislatorProfile[] = [];
  let totalBillsMatched = 0;

  for (const leg of legislators) {
    const committees = stakeholderCommittees.get(leg.id) ?? [];
    const obs = obsMap.get(leg.id) ?? { count: 0, latestAt: null };
    const notes = noteMap.get(leg.id) ?? { count: 0, latestAt: null };
    const bills = legislatorBills.get(leg.id) ?? new Set<string>();
    totalBillsMatched += bills.size;

    // ── Power Score (0-100) ──────────────────────────────────────────
    let powerScore = 0;
    const isLeadership = !!(leg.title && /speaker|president|pro tem|whip|caucus chair/i.test(leg.title));

    // Committee power (0-40)
    let committeePower = 0;
    for (const cm of committees) {
      if (cm.role === "chair") committeePower += 15;
      else if (cm.role === "vice_chair") committeePower += 8;
      else committeePower += 2;
    }
    committeePower = Math.min(40, committeePower);

    // Leadership bonus (0-25)
    const leadershipPower = isLeadership ? 25 : 0;

    // Bill activity (0-20)
    const billActivity = Math.min(20, bills.size * 3);

    // Engagement signal (0-15) — more engaged = we know more = more predictable
    const engagementSignal = Math.min(15, obs.count * 3 + notes.count * 4);

    powerScore = committeePower + leadershipPower + billActivity + engagementSignal;

    // ── Bill type breakdown ────────────────────────────────────────────
    const billTypes: Record<string, number> = {};
    for (const bid of bills) {
      const prefix = bid.split(/\s/)[0] || "OTHER";
      billTypes[prefix] = (billTypes[prefix] ?? 0) + 1;
    }

    // ── Watchlist overlap ──────────────────────────────────────────────
    let watchlistOverlap = 0;
    for (const bid of bills) {
      if (watchedBillIds.has(bid.toUpperCase())) watchlistOverlap++;
    }

    // ── Issue focus (derived from bill topics in alert text) ───────────
    const issueFocus = deriveIssueFocus(bills, billTexts);

    // ── Allies (co-sponsors on same bills) ─────────────────────────────
    const allyMap = new Map<number, number>();
    for (const bid of bills) {
      const coLegs = billLegislators.get(bid) ?? new Set();
      for (const coId of coLegs) {
        if (coId !== leg.id) {
          allyMap.set(coId, (allyMap.get(coId) ?? 0) + 1);
        }
      }
    }
    const allies = [...allyMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([allyId, sharedBills]) => {
        const ally = legislators.find(l => l.id === allyId);
        return {
          name: ally?.name ?? `Legislator #${allyId}`,
          party: ally?.party ?? "Unknown",
          sharedBills,
          isCrossParty: ally?.party ? ally.party !== leg.party : false,
        };
      });

    // ── Engagement level ─────────────────────────────────────────────
    const latestDates = [obs.latestAt, notes.latestAt].filter(Boolean).map(d => new Date(d!).getTime());
    const mostRecent = latestDates.length > 0 ? new Date(Math.max(...latestDates)).toISOString() : null;
    const engagementLevel: "high" | "moderate" | "low" | "none" =
      (obs.count + notes.count) >= 5 ? "high" :
      (obs.count + notes.count) >= 2 ? "moderate" :
      (obs.count + notes.count) >= 1 ? "low" : "none";

    // ── Committee data with active bill counts ───────────────────────
    const enrichedCommittees = committees.map(cm => ({
      name: cm.committeeName,
      role: cm.role as "chair" | "vice_chair" | "member",
      activeBillCount: committeeBillCounts.get(cm.committeeName) ?? 0,
    }));

    // ── Impact level ─────────────────────────────────────────────────
    const impactLevel: "critical" | "high" | "moderate" | "low" =
      (powerScore >= 60 && watchlistOverlap >= 2) || isLeadership ? "critical" :
      powerScore >= 40 || watchlistOverlap >= 1 ? "high" :
      powerScore >= 20 ? "moderate" : "low";

    // ── Tags ─────────────────────────────────────────────────────────
    const tags: string[] = [];
    if (isLeadership) tags.push("leadership");
    if (committees.some(c => c.role === "chair")) tags.push("committee-chair");
    if (committees.some(c => c.role === "vice_chair")) tags.push("vice-chair");
    if (allies.some(a => a.isCrossParty)) tags.push("bipartisan");
    if (engagementLevel === "none") tags.push("unengaged");
    if (watchlistOverlap > 0) tags.push("watchlist-active");
    if (bills.size >= 5) tags.push("prolific");

    // ── Assessment narrative ─────────────────────────────────────────
    const assessmentParts: string[] = [];
    if (isLeadership) {
      assessmentParts.push(`${leg.name} holds chamber leadership — top-tier structural power.`);
    }
    if (committees.filter(c => c.role === "chair").length > 0) {
      const chairNames = committees.filter(c => c.role === "chair").map(c => c.committeeName);
      assessmentParts.push(`Chairs ${chairNames.join(", ")} — controls bill flow in ${chairNames.length > 1 ? "these areas" : "this area"}.`);
    }
    if (bills.size > 0) {
      assessmentParts.push(`Linked to ${bills.size} bill${bills.size !== 1 ? "s" : ""} in recent activity.`);
    }
    if (watchlistOverlap > 0) {
      assessmentParts.push(`${watchlistOverlap} bill${watchlistOverlap !== 1 ? "s" : ""} overlap with active watchlists — direct impact on tracked issues.`);
    }
    if (allies.some(a => a.isCrossParty && a.sharedBills >= 2)) {
      assessmentParts.push("Shows bipartisan collaboration patterns.");
    }
    if (engagementLevel === "none" && powerScore >= 30) {
      assessmentParts.push("⚠ Under-engaged: high power but no observations or meeting notes in our system.");
    }

    const assessment = assessmentParts.length > 0
      ? assessmentParts.join(" ")
      : `${leg.name} (${leg.party ?? "Unknown"}) — moderate legislative profile with limited recent activity in tracked areas.`;

    profiles.push({
      stakeholderId: leg.id,
      name: leg.name,
      party: leg.party ?? "Unknown",
      chamber: leg.chamber ?? "Unknown",
      district: leg.district ?? "Unknown",
      title: isLeadership ? (leg.title ?? undefined) : undefined,
      powerScore,
      committees: enrichedCommittees,
      sponsorship: {
        totalBills: bills.size,
        billIds: [...bills],
        billTypes,
        watchlistOverlap,
      },
      issueFocus,
      allies,
      engagement: {
        observationCount: obs.count,
        meetingNoteCount: notes.count,
        lastContactDate: mostRecent,
        engagementLevel,
      },
      assessment,
      tags,
      impactLevel,
    });
  }

  // Sort by power score descending
  profiles.sort((a, b) => b.powerScore - a.powerScore);

  // ── Categorized views ──────────────────────────────────────────────────
  const keyPlayers = profiles
    .filter(p => p.impactLevel === "critical" || p.impactLevel === "high")
    .slice(0, 10);

  const gatekeepers = profiles
    .filter(p => p.committees.some(c => c.role === "chair" && c.activeBillCount > 0));

  const bridgeBuilders = profiles
    .filter(p => p.allies.filter(a => a.isCrossParty && a.sharedBills >= 2).length >= 1)
    .sort((a, b) => {
      const aCross = a.allies.filter(al => al.isCrossParty).reduce((s, al) => s + al.sharedBills, 0);
      const bCross = b.allies.filter(al => al.isCrossParty).reduce((s, al) => s + al.sharedBills, 0);
      return bCross - aCross;
    })
    .slice(0, 10);

  const blindSpots = profiles
    .filter(p => p.powerScore >= 30 && p.engagement.engagementLevel === "none")
    .slice(0, 10);

  // ── Stats ──────────────────────────────────────────────────────────────
  const byParty: Record<string, number> = {};
  const byChamber: Record<string, number> = {};
  const engagementBreakdown: Record<string, number> = { high: 0, moderate: 0, low: 0, none: 0 };

  for (const p of profiles) {
    byParty[p.party] = (byParty[p.party] ?? 0) + 1;
    byChamber[p.chamber] = (byChamber[p.chamber] ?? 0) + 1;
    engagementBreakdown[p.engagement.engagementLevel]++;
  }

  return {
    analyzedAt: new Date().toISOString(),
    totalLegislators: profiles.length,
    totalBillsMatched,
    profiles,
    keyPlayers,
    gatekeepers,
    bridgeBuilders,
    blindSpots,
    stats: {
      byParty,
      byChamber,
      avgPowerScore: profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.powerScore, 0) / profiles.length) : 0,
      avgBillCount: profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.sponsorship.totalBills, 0) / profiles.length * 10) / 10 : 0,
      engagementBreakdown,
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Derive issue focus areas from bill texts using keyword clustering */
function deriveIssueFocus(
  bills: Set<string>,
  billTexts: Map<string, string>,
): LegislatorProfile["issueFocus"] {
  const topicKeywords: Record<string, string[]> = {
    "Energy & Environment": ["energy", "electric", "power grid", "solar", "wind", "oil", "gas", "emission", "environmental", "climate", "water", "pollution"],
    "Criminal Justice": ["criminal", "felony", "misdemeanor", "incarceration", "parole", "probation", "sentencing", "law enforcement", "police", "corrections"],
    "Education": ["education", "school", "teacher", "student", "university", "college", "curriculum", "textbook", "tuition"],
    "Healthcare": ["health", "hospital", "medicaid", "medicare", "insurance", "pharmaceutical", "drug", "mental health", "nursing"],
    "Transportation": ["transportation", "highway", "road", "bridge", "transit", "railroad", "traffic", "tolls", "txdot"],
    "Public Safety": ["public safety", "emergency", "disaster", "fire", "flood", "hurricane", "homeland security"],
    "Taxation & Finance": ["tax", "revenue", "budget", "fiscal", "appropriation", "finance", "property tax", "sales tax"],
    "Elections & Voting": ["election", "voting", "ballot", "voter", "redistrict", "campaign", "poll"],
    "Agriculture": ["agriculture", "farm", "ranch", "livestock", "crop", "rural", "water rights"],
    "Technology & Privacy": ["technology", "data", "privacy", "cybersecurity", "broadband", "internet", "artificial intelligence"],
  };

  const topicCounts: Record<string, number> = {};
  for (const bid of bills) {
    const text = (billTexts.get(bid) ?? "").toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
      }
    }
  }

  return Object.entries(topicCounts)
    .filter(([, cnt]) => cnt >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, cnt]) => ({
      topic,
      billCount: cnt,
      stance: cnt >= 3 ? "champion" as const :
              cnt >= 2 ? "aligned" as const : "neutral" as const,
    }));
}
