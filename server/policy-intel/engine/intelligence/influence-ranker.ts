/**
 * Stakeholder Influence Ranker — computes a composite power/influence
 * score for every stakeholder based on structural position, activity,
 * and network centrality.
 *
 * This goes beyond "who is a legislator" to answer:
 * - Who are the most powerful people touching our issues?
 * - Who is a gatekeeper (committee chair on a bill we care about)?
 * - Who has the most observations / meeting notes (we know them well)?
 * - Who is a connector (appears across multiple matters/issue rooms)?
 */
import { policyIntelDb } from "../../db";
import {
  stakeholders, stakeholderObservations, committeeMembers,
  meetingNotes, alerts, issueRooms,
} from "@shared/schema-policy-intel";
import { eq, count, sql, desc } from "drizzle-orm";

export interface InfluenceProfile {
  stakeholderId: number;
  name: string;
  type: string;
  party?: string;
  chamber?: string;
  /** Composite influence score 0-100 */
  influenceScore: number;
  /** Breakdown of score components */
  breakdown: {
    positionalPower: number;   // 0-30 (committee roles, leadership)
    activityLevel: number;     // 0-25 (observations, meeting notes)
    networkReach: number;      // 0-25 (cross-matter, cross-issue-room presence)
    recency: number;           // 0-20 (how recently active)
  };
  /** Role-based tags */
  roles: string[];
  /** Key relationships */
  touchpoints: {
    committeeCount: number;
    observationCount: number;
    meetingNoteCount: number;
    issueRoomCount: number;
    chairPositions: string[];
  };
  /** Strategic assessment */
  assessment: string;
}

export interface InfluenceReport {
  analyzedAt: string;
  profiles: InfluenceProfile[];
  powerBrokers: InfluenceProfile[];    // top 10 by influence
  gatekeepers: InfluenceProfile[];     // committee chairs on active issues
  wellConnected: InfluenceProfile[];   // highest network reach
  underEngaged: InfluenceProfile[];    // high power but low meeting notes
}

export async function analyzeInfluence(): Promise<InfluenceReport> {
  // ── Fetch all stakeholders ──────────────────────────────────────────
  const allStakeholders = await policyIntelDb.select().from(stakeholders);

  // ── Committee memberships ───────────────────────────────────────────
  const allCommittees = await policyIntelDb.select().from(committeeMembers);

  const stakeholderCommittees = new Map<number, typeof allCommittees>();
  for (const cm of allCommittees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }

  // ── Observation counts per stakeholder ──────────────────────────────
  const obsCounts = await policyIntelDb
    .select({ stakeholderId: stakeholderObservations.stakeholderId, cnt: count(), latestAt: sql<string>`MAX(${stakeholderObservations.createdAt})` })
    .from(stakeholderObservations)
    .groupBy(stakeholderObservations.stakeholderId);

  const obsMap = new Map(obsCounts.map(r => [r.stakeholderId, { count: r.cnt, latestAt: r.latestAt }]));

  // ── Meeting note counts ─────────────────────────────────────────────
  const noteCounts = await policyIntelDb
    .select({ stakeholderId: meetingNotes.stakeholderId, cnt: count(), latestAt: sql<string>`MAX(${meetingNotes.createdAt})` })
    .from(meetingNotes)
    .groupBy(meetingNotes.stakeholderId);

  const noteMap = new Map(noteCounts.map(r => [r.stakeholderId, { count: r.cnt, latestAt: r.latestAt }]));

  // ── Issue room presence (cross-references) ──────────────────────────
  const issueRoomPresence = await policyIntelDb
    .select({ stakeholderId: stakeholderObservations.stakeholderId, distinctMatters: sql<number>`COUNT(DISTINCT ${stakeholderObservations.matterId})` })
    .from(stakeholderObservations)
    .groupBy(stakeholderObservations.stakeholderId);

  const matterReachMap = new Map(issueRoomPresence.map(r => [r.stakeholderId, r.distinctMatters ?? 0]));

  // ── Compute influence profiles ──────────────────────────────────────
  const profiles: InfluenceProfile[] = [];

  for (const s of allStakeholders) {
    const committees = stakeholderCommittees.get(s.id) ?? [];
    const obs = obsMap.get(s.id) ?? { count: 0, latestAt: null };
    const notes = noteMap.get(s.id) ?? { count: 0, latestAt: null };
    const matterReach = matterReachMap.get(s.id) ?? 0;

    // ── Positional Power (0-30) ─────────────────────────────────────
    let positionalPower = 0;
    const roles: string[] = [];
    const chairPositions: string[] = [];

    if (s.type === "legislator") {
      positionalPower += 10; // base for elected official
      for (const cm of committees) {
        if (cm.role === "chair") {
          positionalPower += 8;
          chairPositions.push(cm.committeeName);
          roles.push(`Chair: ${cm.committeeName}`);
        } else if (cm.role === "vice_chair") {
          positionalPower += 4;
          roles.push(`Vice Chair: ${cm.committeeName}`);
        } else {
          positionalPower += 1;
        }
      }
      // Party leadership indicators
      if (s.title?.toLowerCase().includes("speaker") || s.title?.toLowerCase().includes("president")) {
        positionalPower += 10;
        roles.push("Chamber Leadership");
      }
    } else if (s.type === "lobbyist") {
      positionalPower += 5;
      roles.push("Lobbyist");
    } else if (s.type === "agency_official") {
      positionalPower += 8;
      roles.push("Agency Official");
    } else if (s.type === "pac") {
      positionalPower += 3;
      roles.push("PAC");
    }

    positionalPower = Math.min(30, positionalPower);

    // ── Activity Level (0-25) ───────────────────────────────────────
    const activityLevel = Math.min(25,
      Math.min(12, obs.count * 3) +     // observations, 3pts each up to 12
      Math.min(13, notes.count * 5)      // meeting notes, 5pts each up to 13
    );

    // ── Network Reach (0-25) ────────────────────────────────────────
    const networkReach = Math.min(25,
      Math.min(10, committees.length * 3) +   // committee memberships
      Math.min(15, matterReach * 5)           // matters touched
    );

    // ── Recency (0-20) ──────────────────────────────────────────────
    const now = Date.now();
    const latestActivity = [obs.latestAt, notes.latestAt].filter(Boolean).map(d => new Date(d!).getTime());
    const mostRecent = latestActivity.length > 0 ? Math.max(...latestActivity) : 0;
    const daysSince = mostRecent > 0 ? (now - mostRecent) / 86400000 : 999;

    const recency = daysSince < 7 ? 20 :
                    daysSince < 14 ? 16 :
                    daysSince < 30 ? 12 :
                    daysSince < 90 ? 6 :
                    daysSince < 180 ? 2 : 0;

    const influenceScore = positionalPower + activityLevel + networkReach + recency;

    // ── Strategic Assessment ────────────────────────────────────────
    let assessment: string;
    if (influenceScore >= 70) {
      assessment = `${s.name} is a top-tier power broker. ${chairPositions.length > 0 ? `Chairs ${chairPositions.join(", ")} — a gatekeeper for bills in those areas.` : "Well-connected across multiple matters."} Prioritize relationship maintenance.`;
    } else if (influenceScore >= 50) {
      assessment = `${s.name} has significant influence. ${obs.count > 0 ? `${obs.count} observations recorded.` : "Limited observation data — consider increasing engagement tracking."} ${notes.count === 0 ? "No meeting notes — consider scheduling a touchpoint." : ""}`;
    } else if (positionalPower >= 15 && activityLevel <= 5) {
      assessment = `${s.name} holds structural power (${roles.join(", ")}) but is under-engaged in our tracking. This is a gap — we may be missing their influence on our issues.`;
    } else {
      assessment = `${s.name} has moderate relevance. ${committees.length > 0 ? `Member of ${committees.length} committee(s).` : ""} Monitor for changes in position or activity.`;
    }

    profiles.push({
      stakeholderId: s.id,
      name: s.name,
      type: s.type,
      party: s.party ?? undefined,
      chamber: s.chamber ?? undefined,
      influenceScore,
      breakdown: { positionalPower, activityLevel, networkReach, recency },
      roles,
      touchpoints: {
        committeeCount: committees.length,
        observationCount: obs.count,
        meetingNoteCount: notes.count,
        issueRoomCount: matterReach,
        chairPositions,
      },
      assessment,
    });
  }

  // Sort by influence score
  profiles.sort((a, b) => b.influenceScore - a.influenceScore);

  return {
    analyzedAt: new Date().toISOString(),
    profiles,
    powerBrokers: profiles.slice(0, 10),
    gatekeepers: profiles.filter(p => p.touchpoints.chairPositions.length > 0).slice(0, 10),
    wellConnected: [...profiles].sort((a, b) => b.breakdown.networkReach - a.breakdown.networkReach).slice(0, 10),
    underEngaged: profiles.filter(p => p.breakdown.positionalPower >= 15 && p.breakdown.activityLevel <= 5).slice(0, 10),
  };
}
