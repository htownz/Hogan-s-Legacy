/**
 * Sponsor Network Analyzer — maps the power structure behind each bill.
 *
 * This is the intelligence layer that answers:
 * - Who is behind this bill? (sponsor, co-sponsors)
 * - Is this a solo effort or a coalition push?
 * - Do sponsors have committee authority over the bill's path?
 * - Are sponsors from both parties? (bipartisan = higher passage odds)
 * - Which sponsors are connected through committee membership?
 * - What's the "sponsor power score" — aggregate influence of backers?
 *
 * This data feeds directly into the risk model to improve passage predictions.
 */
import { policyIntelDb } from "../../db";
import {
  alerts, sourceDocuments, stakeholders,
  committeeMembers, hearingEvents,
} from "@shared/schema-policy-intel";
import { eq, sql, gte, desc, count, and, ilike } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SponsorProfile {
  stakeholderId: number;
  name: string;
  party: string;
  chamber: string;
  /** Bills this sponsor is attached to (from text analysis) */
  billIds: string[];
  /** Committee positions that give structural power */
  chairPositions: string[];
  /** Total committee count */
  committeeCount: number;
  /** Is this sponsor in a leadership position (speaker, president, whip)? */
  isLeadership: boolean;
  /** Number of bills linked to this sponsor */
  billCount: number;
}

export interface BillSponsorAnalysis {
  billId: string;
  title: string;
  /** Identified sponsors/co-sponsors from text matching */
  sponsors: SponsorProfile[];
  /** Aggregate sponsor characteristics */
  coalition: {
    /** Total sponsor count */
    size: number;
    /** Is there bipartisan support? */
    isBipartisan: boolean;
    /** Parties represented */
    parties: string[];
    /** Chambers represented (bicameral support?) */
    chambers: string[];
    /** Does any sponsor chair the committee this bill is referred to? */
    hasCommitteeChair: boolean;
    /** Does any sponsor hold chamber leadership? */
    hasLeadership: boolean;
    /** Aggregate power score (0-100) */
    coalitionPower: number;
  };
  /** Network density: how interconnected are the sponsors through committees? */
  networkDensity: number;
  /** Strategic implications */
  narrative: string;
}

export interface SponsorNetworkReport {
  analyzedAt: string;
  /** Per-bill sponsor analysis */
  billAnalyses: BillSponsorAnalysis[];
  /** Cross-bill sponsor patterns */
  prolificSponsors: SponsorProfile[];
  /** Cross-party collaborations (bipartisan signals) */
  bipartisanBills: BillSponsorAnalysis[];
  /** Bills with leadership backing */
  leadershipBacked: BillSponsorAnalysis[];
  /** Sponsor connectivity graph summary */
  networkStats: {
    totalSponsors: number;
    avgCoalitionSize: number;
    bipartisanRate: number;
    leadershipRate: number;
  };
}

// ── Core Analysis ────────────────────────────────────────────────────────────

export async function analyzeSponsorNetwork(): Promise<SponsorNetworkReport> {
  const d90 = new Date(Date.now() - 90 * 86400000);

  // ── 1. Gather legislators ──────────────────────────────────────────────
  const legislators = await policyIntelDb
    .select({
      id: stakeholders.id,
      name: stakeholders.name,
      party: stakeholders.party,
      chamber: stakeholders.chamber,
      title: stakeholders.title,
    })
    .from(stakeholders)
    .where(eq(stakeholders.type, "legislator"));

  // ── 2. Gather committee memberships ────────────────────────────────────
  const committees = await policyIntelDb.select().from(committeeMembers);

  // Build per-stakeholder committee data
  const stakeholderCommittees = new Map<number, typeof committees>();
  for (const cm of committees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }

  // ── 3. Build sponsor profiles ──────────────────────────────────────────
  const sponsorProfiles = new Map<number, SponsorProfile>();
  for (const leg of legislators) {
    const comms = stakeholderCommittees.get(leg.id) ?? [];
    const chairPositions = comms.filter(c => c.role === "chair").map(c => c.committeeName);
    const isLeadership = !!(leg.title && /speaker|president|pro tem|whip|caucus chair/i.test(leg.title));

    sponsorProfiles.set(leg.id, {
      stakeholderId: leg.id,
      name: leg.name,
      party: leg.party ?? "Unknown",
      chamber: leg.chamber ?? "Unknown",
      billIds: [],
      chairPositions,
      committeeCount: comms.length,
      isLeadership,
      billCount: 0,
    });
  }

  // ── 4. Match sponsors to bills via alert text ──────────────────────────
  // Pull recent alerts and scan for legislator name mentions near bill IDs
  const recentAlerts = await policyIntelDb
    .select({
      title: alerts.title,
      summary: alerts.summary,
      whyItMatters: alerts.whyItMatters,
    })
    .from(alerts)
    .where(gte(alerts.createdAt, d90))
    .orderBy(desc(alerts.relevanceScore))
    .limit(500);

  // Extract bill IDs and associated text
  const billIdPattern = /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const billTexts = new Map<string, string>(); // billId → combined text mentions

  for (const a of recentAlerts) {
    const fullText = `${a.title} ${a.summary ?? ""} ${a.whyItMatters ?? ""}`;
    let m: RegExpExecArray | null;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      const existing = billTexts.get(billId) ?? "";
      billTexts.set(billId, existing + " " + fullText);
    }
  }

  // Also scan source documents for sponsor names
  const recentDocs = await policyIntelDb
    .select({
      title: sourceDocuments.title,
      rawPayload: sourceDocuments.rawPayload,
      normalizedText: sourceDocuments.normalizedText,
    })
    .from(sourceDocuments)
    .where(gte(sourceDocuments.fetchedAt, d90))
    .orderBy(desc(sourceDocuments.fetchedAt))
    .limit(1000);

  for (const doc of recentDocs) {
    const fullText = `${doc.title} ${doc.normalizedText?.slice(0, 3000) ?? ""}`;
    const localPattern = new RegExp(billIdPattern.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = localPattern.exec(fullText)) !== null) {
      const billId = `${m[1].replace(/\./g, "").toUpperCase()} ${m[2]}`;
      const existing = billTexts.get(billId) ?? "";
      billTexts.set(billId, existing + " " + fullText);
    }

    // Check rawPayload for structured sponsor data
    const payload = doc.rawPayload;
    if (payload?.sponsors && Array.isArray(payload.sponsors)) {
      for (const sponsor of payload.sponsors) {
        if (typeof sponsor === "object" && sponsor !== null) {
          const sName = (sponsor as Record<string, unknown>).name;
          const sBillId = (sponsor as Record<string, unknown>).billId;
          if (typeof sName === "string" && typeof sBillId === "string") {
            const normalized = sBillId.replace(/\./g, "").toUpperCase().replace(/\s+/g, " ").trim();
            const existing = billTexts.get(normalized) ?? "";
            billTexts.set(normalized, existing + " Sponsor: " + sName);
          }
        }
      }
    }
  }

  // Match legislator names to bill texts
  const billSponsors = new Map<string, Set<number>>(); // billId → set of stakeholder IDs

  for (const [billId, text] of billTexts) {
    const textLower = text.toLowerCase();
    const matched = new Set<number>();

    for (const [id, profile] of sponsorProfiles) {
      // Match on last name (most reliable) — require word boundary
      const nameParts = profile.name.split(/\s+/);
      const lastName = nameParts[nameParts.length - 1];
      if (lastName.length >= 3) {
        const lastNamePattern = new RegExp(`\\b${lastName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (lastNamePattern.test(textLower)) {
          matched.add(id);
          if (!profile.billIds.includes(billId)) {
            profile.billIds.push(billId);
            profile.billCount++;
          }
        }
      }
    }

    if (matched.size > 0) {
      billSponsors.set(billId, matched);
    }
  }

  // ── 5. Get hearing data for committee context ──────────────────────────
  const hearings = await policyIntelDb
    .select({
      committee: hearingEvents.committee,
      relatedBillIds: hearingEvents.relatedBillIds,
    })
    .from(hearingEvents)
    .where(gte(hearingEvents.hearingDate, d90));

  const billCommittees = new Map<string, string[]>();
  for (const h of hearings) {
    for (const billId of (h.relatedBillIds ?? [])) {
      const list = billCommittees.get(billId) ?? [];
      if (!list.includes(h.committee)) list.push(h.committee);
      billCommittees.set(billId, list);
    }
  }

  // ── 6. Build per-bill sponsor analysis ─────────────────────────────────
  const billAnalyses: BillSponsorAnalysis[] = [];

  for (const [billId, sponsorIds] of billSponsors) {
    const sponsors = Array.from(sponsorIds)
      .map(id => sponsorProfiles.get(id))
      .filter((s): s is SponsorProfile => s !== undefined);

    if (sponsors.length === 0) continue;

    const parties = [...new Set(sponsors.map(s => s.party).filter(p => p !== "Unknown"))];
    const chambers = [...new Set(sponsors.map(s => s.chamber).filter(c => c !== "Unknown"))];
    const isBipartisan = parties.length >= 2;

    // Check if any sponsor chairs the committee the bill is in
    const comms = billCommittees.get(billId) ?? [];
    const hasCommitteeChair = sponsors.some(s =>
      s.chairPositions.some(cp => comms.some(bc => bc.toLowerCase().includes(cp.toLowerCase()) || cp.toLowerCase().includes(bc.toLowerCase())))
    );

    const hasLeadership = sponsors.some(s => s.isLeadership);

    // Coalition power score
    let coalitionPower = 0;
    coalitionPower += Math.min(20, sponsors.length * 5); // size matters (up to 20)
    coalitionPower += isBipartisan ? 20 : 0;             // bipartisan bonus
    coalitionPower += hasCommitteeChair ? 25 : 0;        // chair has gate control
    coalitionPower += hasLeadership ? 20 : 0;            // leadership backing
    coalitionPower += chambers.length >= 2 ? 15 : 0;     // bicameral support
    coalitionPower = Math.min(100, coalitionPower);

    // Network density: how many sponsor pairs share a committee?
    let sharedPairs = 0;
    let totalPairs = 0;
    for (let i = 0; i < sponsors.length; i++) {
      for (let j = i + 1; j < sponsors.length; j++) {
        totalPairs++;
        const siComms = new Set((stakeholderCommittees.get(sponsors[i].stakeholderId) ?? []).map(c => c.committeeName));
        const sjComms = (stakeholderCommittees.get(sponsors[j].stakeholderId) ?? []).map(c => c.committeeName);
        if (sjComms.some(c => siComms.has(c))) sharedPairs++;
      }
    }
    const networkDensity = totalPairs > 0 ? sharedPairs / totalPairs : 0;

    // Get best title from bill texts
    const firstAlert = recentAlerts.find(a =>
      `${a.title} ${a.summary ?? ""}`.includes(billId) ||
      billId.split(" ").every(part => a.title.includes(part))
    );
    const title = firstAlert?.title ?? billId;

    // Narrative
    const narrativeParts: string[] = [];
    narrativeParts.push(`${billId} has ${sponsors.length} identified sponsor(s)`);
    if (isBipartisan) narrativeParts.push("with BIPARTISAN support — significantly increases passage odds");
    if (hasCommitteeChair) narrativeParts.push("— a key committee chair backs this bill, providing gate control over its path");
    if (hasLeadership) narrativeParts.push("— chamber leadership is involved, signaling priority");
    if (chambers.length >= 2) narrativeParts.push("with sponsors in both chambers (bicameral coalition)");
    if (networkDensity >= 0.5) narrativeParts.push(". Sponsors are highly connected through shared committee memberships");

    const narrative = narrativeParts.join(" ") + ".";

    billAnalyses.push({
      billId,
      title,
      sponsors,
      coalition: {
        size: sponsors.length,
        isBipartisan,
        parties,
        chambers,
        hasCommitteeChair,
        hasLeadership,
        coalitionPower,
      },
      networkDensity: Math.round(networkDensity * 100) / 100,
      narrative,
    });
  }

  // Sort by coalition power
  billAnalyses.sort((a, b) => b.coalition.coalitionPower - a.coalition.coalitionPower);

  // ── 7. Build summary statistics ────────────────────────────────────────
  const allSponsors = Array.from(sponsorProfiles.values()).filter(s => s.billCount > 0);
  allSponsors.sort((a, b) => b.billCount - a.billCount);

  const bipartisanBills = billAnalyses.filter(b => b.coalition.isBipartisan);
  const leadershipBacked = billAnalyses.filter(b => b.coalition.hasLeadership);

  const avgCoalitionSize = billAnalyses.length > 0
    ? billAnalyses.reduce((s, b) => s + b.coalition.size, 0) / billAnalyses.length
    : 0;

  return {
    analyzedAt: new Date().toISOString(),
    billAnalyses,
    prolificSponsors: allSponsors.slice(0, 15),
    bipartisanBills,
    leadershipBacked,
    networkStats: {
      totalSponsors: allSponsors.length,
      avgCoalitionSize: Math.round(avgCoalitionSize * 10) / 10,
      bipartisanRate: billAnalyses.length > 0 ? Math.round((bipartisanBills.length / billAnalyses.length) * 100) / 100 : 0,
      leadershipRate: billAnalyses.length > 0 ? Math.round((leadershipBacked.length / billAnalyses.length) * 100) / 100 : 0,
    },
  };
}
