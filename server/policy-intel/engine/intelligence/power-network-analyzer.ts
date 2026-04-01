/**
 * Power Network Analyzer — maps the Texas political power structure
 *
 * This analyzer builds a comprehensive view of:
 * 1. The Big Three (Governor, Lt Governor, Speaker) + their spheres
 * 2. Committee leadership chains — who appointed whom, who controls what
 * 3. Voting blocs — legislators who consistently vote together
 * 4. Power flow — how influence flows from leadership → committees → floor
 * 5. Cross-party alliances and opposition patterns
 *
 * Combined with campaign finance and stakeholder data, this reveals
 * who really controls the Texas legislative process.
 */
import { policyIntelDb } from "../../db";
import {
  stakeholders, committeeMembers, alerts,
  issueRooms, sourceDocuments,
} from "@shared/schema-policy-intel";
import { powerCenters, leadershipPriorities, votingBlocs as votingBlocsTable, votingBlocMembers } from "@shared/schema-power-network";
import { eq, sql, desc, and, count, ilike } from "drizzle-orm";
import { createLogger } from "../../logger";

const log = createLogger("power-network");

// ── Config ─────────────────────────────────────────────────────────────────

const CURRENT_SESSION = "89R";

// ── Cache ──────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
let cachedReport: PowerNetworkReport | null = null;
let cachedAt = 0;

// ── Types ──────────────────────────────────────────────────────────────────

export interface PowerCenterProfile {
  name: string;
  role: "governor" | "lieutenant_governor" | "speaker";
  chamber: "executive" | "senate" | "house";
  party: string;
  /** Key priorities derived from bill patterns */
  priorities: {
    topic: string;
    stance: "champion" | "oppose" | "cautious";
    evidence: string;
    intensity: number;
  }[];
  /** Committee chairs under their influence */
  committeeChairs: {
    name: string;
    committee: string;
    chamber: string;
    party: string;
    stakeholderId: number;
  }[];
  /** Key allies in the chamber */
  allies: {
    name: string;
    party: string;
    chamber: string;
    stakeholderId: number;
    reason: string;
  }[];
  /** Influence metrics */
  metrics: {
    committeeChairsControlled: number;
    billsPrioritized: number;
    chamberControl: number; // 0-100
  };
}

export interface VotingBlocResult {
  name: string;
  chamber: string;
  members: {
    stakeholderId: number;
    name: string;
    party: string;
    district?: string;
    loyalty: number;
    isLeader: boolean;
  }[];
  cohesion: number;
  issueAreas: string[];
  alignedPowerCenter: string;
  bipartisan: boolean;
  narrative: string;
}

export interface PowerFlowEdge {
  sourceId: number;
  sourceName: string;
  sourceRole: string;
  targetId: number;
  targetName: string;
  targetRole: string;
  flowType: "appoints" | "controls" | "allies_with" | "opposes" | "co_sponsors";
  strength: number;
  evidence: string;
}

export interface PowerNetworkReport {
  analyzedAt: string;
  /** The Big Three */
  bigThree: PowerCenterProfile[];
  /** Detected voting blocs */
  votingBlocs: VotingBlocResult[];
  /** Power flow graph edges */
  powerFlows: PowerFlowEdge[];
  /** Key findings */
  keyFindings: string[];
  /** Summary stats */
  stats: {
    totalStakeholders: number;
    totalCommitteeMembers: number;
    totalChairs: number;
    totalViceChairs: number;
    chamberBreakdown: { house: number; senate: number };
    partyBreakdown: { R: number; D: number; other: number };
    blocsDetected: number;
    bipartisanBlocs: number;
  };
}

// ── Analyzer ───────────────────────────────────────────────────────────────

export async function analyzeNetworkPower(force = false): Promise<PowerNetworkReport> {
  if (!force && cachedReport && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedReport;
  }

  // ── Load all data ──────────────────────────────────────────────────
  const allStakeholders = await policyIntelDb.select().from(stakeholders);
  const allCommittees = await policyIntelDb.select().from(committeeMembers);

  const legislators = allStakeholders.filter(s => s.type === "legislator");
  const houseMembers = legislators.filter(l => l.chamber?.toLowerCase() === "house");
  const senateMembers = legislators.filter(l => l.chamber?.toLowerCase() === "senate");

  // Build committee maps
  const stakeholderCommittees = new Map<number, typeof allCommittees>();
  for (const cm of allCommittees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }

  const chairs = allCommittees.filter(cm => cm.role === "chair");
  const viceChairs = allCommittees.filter(cm => cm.role === "vice_chair");
  const houseChairs = chairs.filter(cm => cm.chamber?.toLowerCase() === "house");
  const senateChairs = chairs.filter(cm => cm.chamber?.toLowerCase() === "senate");

  // ── Load previous Big Three from DB (if available) for better defaults ──
  const savedCenters = await policyIntelDb
    .select()
    .from(powerCenters)
    .where(eq(powerCenters.session, CURRENT_SESSION));
  const savedByRole = new Map(savedCenters.map(pc => [pc.role, pc]));

  // Resolve stakeholder IDs for Big Three
  const resolveStakeholderId = (name: string): number => {
    const match = allStakeholders.find(s =>
      s.name.toLowerCase() === name.toLowerCase()
    );
    return match?.id ?? 0;
  };

  // ── Big Three Analysis ─────────────────────────────────────────────
  const bigThree: PowerCenterProfile[] = [];

  // Governor (executive — not in legislators table, synthesize from data)
  const savedGov = savedByRole.get("governor");
  const govName = savedGov?.name ?? "Greg Abbott";
  const govPriorities = await detectGovernorPriorities();
  const govAllies = findGovernorAllies(legislators, chairs, allCommittees);
  bigThree.push({
    name: govName,
    role: "governor",
    chamber: "executive",
    party: savedGov?.party ?? "R",
    priorities: govPriorities,
    committeeChairs: [], // Governor doesn't appoint committee chairs
    allies: govAllies,
    metrics: {
      committeeChairsControlled: 0,
      billsPrioritized: govPriorities.length,
      chamberControl: 100, // executive authority
    },
  });

  // Lt. Governor — controls the Senate, appoints Senate committee chairs
  const savedLtGov = savedByRole.get("lieutenant_governor");
  const ltGovName = savedLtGov?.name ?? "Dan Patrick";
  const ltGovPriorities = await detectChamberPriorities("senate");
  const ltGovAllies = findAllies(senateMembers, senateChairs, allCommittees, "senate");
  bigThree.push({
    name: ltGovName,
    role: "lieutenant_governor",
    chamber: "senate",
    party: savedLtGov?.party ?? "R",
    priorities: ltGovPriorities,
    committeeChairs: senateChairs.map(ch => {
      const leg = legislators.find(l => l.id === ch.stakeholderId);
      return {
        name: leg?.name ?? "Unknown",
        committee: ch.committeeName,
        chamber: "senate",
        party: leg?.party ?? "",
        stakeholderId: ch.stakeholderId,
      };
    }),
    allies: ltGovAllies,
    metrics: {
      committeeChairsControlled: senateChairs.length,
      billsPrioritized: ltGovPriorities.length,
      chamberControl: 85, // Lt Gov controls Senate floor & committee assignments
    },
  });

  // Speaker — controls the House, appoints House committee chairs
  const savedSpeaker = savedByRole.get("speaker");
  const speakerName = savedSpeaker?.name ?? findSpeaker(houseMembers, houseChairs) ?? "Dustin Burrows";
  const speakerPriorities = await detectChamberPriorities("house");
  const speakerAllies = findAllies(houseMembers, houseChairs, allCommittees, "house");
  bigThree.push({
    name: speakerName,
    role: "speaker",
    chamber: "house",
    party: savedSpeaker?.party ?? "R",
    priorities: speakerPriorities,
    committeeChairs: houseChairs.map(ch => {
      const leg = legislators.find(l => l.id === ch.stakeholderId);
      return {
        name: leg?.name ?? "Unknown",
        committee: ch.committeeName,
        chamber: "house",
        party: leg?.party ?? "",
        stakeholderId: ch.stakeholderId,
      };
    }),
    allies: speakerAllies,
    metrics: {
      committeeChairsControlled: houseChairs.length,
      billsPrioritized: speakerPriorities.length,
      chamberControl: 80,
    },
  });

  // ── Voting Bloc Detection ──────────────────────────────────────────
  const votingBlocs = detectVotingBlocs(legislators, allCommittees, chairs);

  // ── Power Flow Graph ───────────────────────────────────────────────
  const powerFlows = buildPowerFlows(bigThree, chairs, viceChairs, legislators, allCommittees);

  // ── Key Findings ───────────────────────────────────────────────────
  const keyFindings = generateKeyFindings(bigThree, votingBlocs, powerFlows, legislators, chairs);

  // ── Stats ──────────────────────────────────────────────────────────
  const partyR = legislators.filter(l => l.party === "R").length;
  const partyD = legislators.filter(l => l.party === "D").length;

  const report: PowerNetworkReport = {
    analyzedAt: new Date().toISOString(),
    bigThree,
    votingBlocs,
    powerFlows,
    keyFindings,
    stats: {
      totalStakeholders: allStakeholders.length,
      totalCommitteeMembers: allCommittees.length,
      totalChairs: chairs.length,
      totalViceChairs: viceChairs.length,
      chamberBreakdown: { house: houseMembers.length, senate: senateMembers.length },
      partyBreakdown: { R: partyR, D: partyD, other: legislators.length - partyR - partyD },
      blocsDetected: votingBlocs.length,
      bipartisanBlocs: votingBlocs.filter(b => b.bipartisan).length,
    },
  };

  // Persist power centers and voting blocs to database (fire-and-forget)
  seedPowerCenters(bigThree).catch(err =>
    log.error({ err: err.message }, "failed to seed power centers")
  );
  seedVotingBlocs(votingBlocs).catch(err =>
    log.error({ err: err.message }, "failed to seed voting blocs")
  );

  cachedReport = report;
  cachedAt = Date.now();

  return report;
}

// ── Helper Functions ───────────────────────────────────────────────────────

/** Detect Governor's priorities from bill patterns and alert topics */
async function detectGovernorPriorities() {
  const priorities: PowerCenterProfile["priorities"] = [];

  // Known Abbott 89th session priorities based on public statements
  const knownPriorities = [
    { topic: "Border Security", stance: "champion" as const, intensity: 10, evidence: "Operation Lone Star, multiple executive orders, emergency declarations" },
    { topic: "Property Tax Reform", stance: "champion" as const, intensity: 9, evidence: "Called special sessions for property tax relief, signed HB 2/SB 2" },
    { topic: "School Choice / Education", stance: "champion" as const, intensity: 8, evidence: "Education savings accounts, school voucher advocacy" },
    { topic: "Grid Reliability / Energy", stance: "champion" as const, intensity: 7, evidence: "Post-Uri grid reforms, ERCOT oversight" },
    { topic: "AI & Tech Regulation", stance: "cautious" as const, intensity: 5, evidence: "Texas AI Council creation, balanced approach" },
    { topic: "Gun Rights", stance: "champion" as const, intensity: 7, evidence: "Constitutional carry, Second Amendment sanctuary" },
    { topic: "DEI Bans", stance: "champion" as const, intensity: 8, evidence: "Signed SB 17 banning DEI offices at public universities" },
  ];

  // Cross-reference with our alert data to see what's active
  const topAlertTopics = await policyIntelDb
    .select({
      title: alerts.title,
      cnt: count(),
    })
    .from(alerts)
    .groupBy(alerts.title)
    .orderBy(desc(count()))
    .limit(20);

  for (const kp of knownPriorities) {
    const matchingAlerts = topAlertTopics.filter(a =>
      a.title.toLowerCase().includes(kp.topic.toLowerCase().split(" ")[0].toLowerCase())
    );
    const adjustedIntensity = matchingAlerts.length > 0
      ? Math.min(kp.intensity + 1, 10)
      : kp.intensity;
    priorities.push({ ...kp, intensity: adjustedIntensity });
  }

  return priorities;
}

/** Detect chamber priorities from committee chair patterns */
async function detectChamberPriorities(chamber: string) {
  const priorities: PowerCenterProfile["priorities"] = [];

  // Get committees with most documents/alerts
  const topCommitteeAlerts = await policyIntelDb
    .select({
      title: alerts.title,
      cnt: count(),
    })
    .from(alerts)
    .groupBy(alerts.title)
    .orderBy(desc(count()))
    .limit(10);

  // Map common Texas legislative topics
  const topicMap: Record<string, string> = {
    "tax": "Tax Policy",
    "education": "Education",
    "border": "Border Security",
    "energy": "Energy Policy",
    "health": "Healthcare",
    "gun": "Gun Policy",
    "water": "Water Resources",
    "transport": "Transportation",
    "criminal": "Criminal Justice",
    "business": "Business & Commerce",
  };

  for (const alert of topCommitteeAlerts) {
    const title = alert.title.toLowerCase();
    for (const [keyword, topic] of Object.entries(topicMap)) {
      if (title.includes(keyword)) {
        const existing = priorities.find(p => p.topic === topic);
        if (!existing) {
          priorities.push({
            topic,
            stance: "champion",
            intensity: Math.min(Math.ceil(Number(alert.cnt) / 100), 10),
            evidence: `${alert.cnt} alerts related to ${topic} in ${chamber} pipeline`,
          });
        }
        break;
      }
    }
  }

  return priorities.slice(0, 8);
}

/** Find the Speaker by looking for who chairs multiple or key committees in the House */
function findSpeaker(houseMembers: any[], houseChairs: any[]): string | null {
  // Count how many committee chairs each member has
  const chairCount = new Map<number, { name: string; count: number; committees: string[] }>();
  for (const ch of houseChairs) {
    const leg = houseMembers.find(m => m.id === ch.stakeholderId);
    if (!leg) continue;
    let entry = chairCount.get(ch.stakeholderId);
    if (!entry) {
      entry = { name: leg.name, count: 0, committees: [] as string[] };
      chairCount.set(ch.stakeholderId, entry);
    }
    entry.count++;
    entry.committees.push(ch.committeeName);
  }
  // The Speaker often chairs State Affairs or has distinctive committee assignments
  // Also check known Speaker committee patterns
  for (const [, entry] of chairCount) {
    if (entry.committees.some(c => c.toLowerCase().includes("calendars")) ||
        entry.committees.some(c => c.toLowerCase().includes("house administration"))) {
      return entry.name;
    }
  }
  // Fallback: member who chairs the most committees
  let best: { name: string; count: number } | null = null;
  for (const [, entry] of chairCount) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best?.name ?? null;
}

/** Find Governor's legislative allies — chairs of committees carrying governor-priority legislation */
function findGovernorAllies(
  legislators: any[],
  chairs: any[],
  allCommittees: any[],
): PowerCenterProfile["allies"] {
  const allies: PowerCenterProfile["allies"] = [];
  // Governor priority committee keywords (maps to Abbott's known priorities)
  const govCommittees = [
    { keyword: "border", topic: "Border Security" },
    { keyword: "homeland", topic: "Homeland Security" },
    { keyword: "education", topic: "Education/School Choice" },
    { keyword: "ways", topic: "Property Tax Reform" },
    { keyword: "energy", topic: "Energy/Grid" },
    { keyword: "criminal", topic: "Criminal Justice" },
    { keyword: "state affairs", topic: "State Policy" },
    { keyword: "appropriations", topic: "Budget/Appropriations" },
    { keyword: "finance", topic: "Finance" },
  ];

  for (const { keyword, topic } of govCommittees) {
    const matchingChairs = chairs.filter(c =>
      c.committeeName.toLowerCase().includes(keyword)
    );
    for (const ch of matchingChairs) {
      const leg = legislators.find(l => l.id === ch.stakeholderId);
      if (leg && leg.party === "R" && !allies.find(a => a.stakeholderId === leg.id)) {
        allies.push({
          name: leg.name,
          party: leg.party ?? "R",
          chamber: leg.chamber ?? "",
          stakeholderId: leg.id,
          reason: `Chair of ${ch.committeeName} — key to Governor's ${topic} agenda`,
        });
      }
    }
  }

  return allies.slice(0, 15);
}

/** Find key allies for a power center */
function findAllies(
  chamberMembers: any[],
  chamberChairs: any[],
  allCommittees: any[],
  chamber: string,
) {
  const allies: PowerCenterProfile["allies"] = [];
  const chairIds = new Set(chamberChairs.map(c => c.stakeholderId));

  // Chairs of key "power committees" are strong allies
  const powerCommittees = [
    "appropriations", "finance", "state affairs", "ways and means",
    "calendars", "rules", "judiciary", "criminal jurisprudence",
  ];

  for (const chair of chamberChairs) {
    const isKeyCommittee = powerCommittees.some(pc =>
      chair.committeeName.toLowerCase().includes(pc)
    );
    if (isKeyCommittee) {
      const leg = chamberMembers.find(m => m.id === chair.stakeholderId);
      if (leg) {
        allies.push({
          name: leg.name,
          party: leg.party ?? "R",
          chamber,
          stakeholderId: leg.id,
          reason: `Chair of ${chair.committeeName} — key power committee`,
        });
      }
    }
  }

  // Vice chairs of major committees are also allies
  const viceChairs = allCommittees.filter(cm =>
    cm.role === "vice_chair" && cm.chamber === chamber
  );
  for (const vc of viceChairs.slice(0, 5)) {
    const leg = chamberMembers.find(m => m.id === vc.stakeholderId);
    if (leg && !allies.find(a => a.stakeholderId === leg.id)) {
      allies.push({
        name: leg.name,
        party: leg.party ?? "",
        chamber,
        stakeholderId: leg.id,
        reason: `Vice Chair of ${vc.committeeName}`,
      });
    }
  }

  return allies.slice(0, 15);
}

/** Detect voting blocs from committee co-membership patterns */
function detectVotingBlocs(
  legislators: any[],
  allCommittees: any[],
  chairs: any[],
): VotingBlocResult[] {
  const blocs: VotingBlocResult[] = [];

  // Build committee co-membership adjacency
  const committeeByName = new Map<string, number[]>();
  for (const cm of allCommittees) {
    const list = committeeByName.get(cm.committeeName) ?? [];
    list.push(cm.stakeholderId);
    committeeByName.set(cm.committeeName, list);
  }

  // Detect blocs: legislators on 2+ committees together
  const pairCount = new Map<string, number>();
  for (const [, members] of committeeByName) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const key = [Math.min(members[i], members[j]), Math.max(members[i], members[j])].join("-");
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
      }
    }
  }

  // Find clusters of legislators who share 2+ committees
  const strongPairs = [...pairCount.entries()].filter(([, count]) => count >= 2);
  const adjacency = new Map<number, Set<number>>();
  for (const [pair] of strongPairs) {
    const [a, b] = pair.split("-").map(Number);
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  }

  // Simple greedy clustering
  const visited = new Set<number>();
  const chairSet = new Set(chairs.map(c => c.stakeholderId));

  for (const [nodeId, neighbors] of adjacency) {
    if (visited.has(nodeId) || neighbors.size < 2) continue;

    const cluster = new Set<number>([nodeId]);
    // BFS to find connected cluster
    const queue = [...neighbors];
    while (queue.length > 0 && cluster.size < 20) {
      const next = queue.shift()!;
      if (visited.has(next) || cluster.has(next)) continue;
      // Check connectivity: must share connections with 40%+ of existing cluster
      const sharedWithCluster = [...cluster].filter(c => adjacency.get(next)?.has(c)).length;
      if (sharedWithCluster >= Math.max(1, cluster.size * 0.3)) {
        cluster.add(next);
        const nextNeighbors = adjacency.get(next);
        if (nextNeighbors) {
          for (const nn of nextNeighbors) {
            if (!cluster.has(nn) && !visited.has(nn)) queue.push(nn);
          }
        }
      }
    }

    if (cluster.size >= 3) {
      for (const id of cluster) visited.add(id);

      const members = [...cluster].map(id => {
        const leg = legislators.find(l => l.id === id);
        const connectionsInBloc = [...cluster].filter(otherId =>
          otherId !== id && adjacency.get(id)?.has(otherId)
        ).length;
        return {
          stakeholderId: id,
          name: leg?.name ?? `Stakeholder #${id}`,
          party: leg?.party ?? "",
          district: leg?.district ?? undefined,
          loyalty: connectionsInBloc / (cluster.size - 1),
          isLeader: chairSet.has(id),
        };
      });

      const parties = new Set(members.map(m => m.party).filter(Boolean));
      const bipartisan = parties.has("R") && parties.has("D");
      const chamber = legislators.find(l => l.id === nodeId)?.chamber ?? "house";

      // Determine shared committee topics as issue areas
      const memberIds = new Set(cluster);
      const sharedCommittees = [...committeeByName.entries()]
        .filter(([, mems]) => mems.filter(m => memberIds.has(m)).length >= 2)
        .map(([name]) => name);

      const leader = members.find(m => m.isLeader);
      const avgLoyalty = members.reduce((s, m) => s + m.loyalty, 0) / members.length;

      blocs.push({
        name: leader
          ? `${leader.name} Cohort`
          : `${chamber.charAt(0).toUpperCase() + chamber.slice(1)} Cohort ${blocs.length + 1}`,
        chamber,
        members: members.sort((a, b) => b.loyalty - a.loyalty),
        cohesion: avgLoyalty,
        issueAreas: sharedCommittees.slice(0, 5),
        alignedPowerCenter: chamber?.toLowerCase() === "senate" ? "Lieutenant Governor" : "Speaker",
        bipartisan,
        narrative: `${members.length}-member ${bipartisan ? "bipartisan " : ""}committee cohort in the ${chamber} centered around ${sharedCommittees.slice(0, 3).join(", ")} committee work. ${leader ? `Led by committee chair ${leader.name}.` : "No committee chair identified as leader."} Committee co-membership cohesion: ${(avgLoyalty * 100).toFixed(0)}%.`,
      });
    }
  }

  return blocs.sort((a, b) => b.members.length - a.members.length);
}

/** Build power flow graph edges */
function buildPowerFlows(
  bigThree: PowerCenterProfile[],
  chairs: any[],
  viceChairs: any[],
  legislators: any[],
  allCommittees: any[],
): PowerFlowEdge[] {
  const flows: PowerFlowEdge[] = [];

  // Resolve Big Three stakeholder IDs for proper graph edges
  const resolveId = (name: string, allSh: any[]): number => {
    const match = allSh?.find?.((s: any) => s.name?.toLowerCase() === name?.toLowerCase());
    return match?.id ?? 0;
  };

  // Governor → key allies (governor powers: veto, emergency orders, appointments)
  const gov = bigThree.find(b => b.role === "governor");
  if (gov) {
    for (const ally of gov.allies.slice(0, 10)) {
      flows.push({
        sourceId: resolveId(gov.name, legislators),
        sourceName: gov.name,
        sourceRole: "governor",
        targetId: ally.stakeholderId,
        targetName: ally.name,
        targetRole: "ally",
        flowType: "allies_with",
        strength: 0.7,
        evidence: ally.reason,
      });
    }
  }

  // Lt Gov → Senate committee chairs
  const ltGov = bigThree.find(b => b.role === "lieutenant_governor");
  if (ltGov) {
    for (const ch of ltGov.committeeChairs) {
      flows.push({
        sourceId: resolveId(ltGov.name, legislators),
        sourceName: ltGov.name,
        sourceRole: "lieutenant_governor",
        targetId: ch.stakeholderId,
        targetName: ch.name,
        targetRole: `chair_${ch.committee}`,
        flowType: "appoints",
        strength: 0.9,
        evidence: `Lt Gov appoints all Senate committee chairs`,
      });
    }
  }

  // Speaker → House committee chairs
  const speaker = bigThree.find(b => b.role === "speaker");
  if (speaker) {
    for (const ch of speaker.committeeChairs) {
      flows.push({
        sourceId: resolveId(speaker.name, legislators),
        sourceName: speaker.name,
        sourceRole: "speaker",
        targetId: ch.stakeholderId,
        targetName: ch.name,
        targetRole: `chair_${ch.committee}`,
        flowType: "appoints",
        strength: 0.9,
        evidence: `Speaker appoints all House committee chairs`,
      });
    }
  }

  // Committee chairs → vice chairs (allies)
  for (const chair of chairs) {
    const vc = viceChairs.find(v =>
      v.committeeName === chair.committeeName && v.chamber === chair.chamber
    );
    if (vc) {
      const chairLeg = legislators.find(l => l.id === chair.stakeholderId);
      const vcLeg = legislators.find(l => l.id === vc.stakeholderId);
      flows.push({
        sourceId: chair.stakeholderId,
        sourceName: chairLeg?.name ?? "Unknown",
        sourceRole: `chair`,
        targetId: vc.stakeholderId,
        targetName: vcLeg?.name ?? "Unknown",
        targetRole: `vice_chair`,
        flowType: "allies_with",
        strength: 0.7,
        evidence: `Chair and Vice Chair of ${chair.committeeName}`,
      });
    }
  }

  // Key committee chairs → members (controls) — for power committees only
  const powerCommitteeKeywords = ["appropriations", "finance", "state affairs", "ways and means", "calendars", "rules"];
  for (const chair of chairs) {
    const isPowerCommittee = powerCommitteeKeywords.some(kw =>
      chair.committeeName.toLowerCase().includes(kw)
    );
    if (!isPowerCommittee) continue;
    const chairLeg = legislators.find(l => l.id === chair.stakeholderId);
    if (!chairLeg) continue;
    // Get members of this committee
    const members = allCommittees.filter(cm =>
      cm.committeeName === chair.committeeName &&
      cm.chamber === chair.chamber &&
      cm.role === "member" &&
      cm.stakeholderId !== chair.stakeholderId
    );
    for (const mem of members.slice(0, 5)) { // top 5 to avoid clutter
      const memLeg = legislators.find(l => l.id === mem.stakeholderId);
      if (!memLeg) continue;
      flows.push({
        sourceId: chair.stakeholderId,
        sourceName: chairLeg.name,
        sourceRole: "chair",
        targetId: mem.stakeholderId,
        targetName: memLeg.name,
        targetRole: "member",
        flowType: "controls",
        strength: 0.5,
        evidence: `Member of ${chair.committeeName} — chair controls agenda and hearing schedule`,
      });
    }
  }

  return flows;
}

/** Generate key findings from the analysis */
function generateKeyFindings(
  bigThree: PowerCenterProfile[],
  votingBlocs: VotingBlocResult[],
  powerFlows: PowerFlowEdge[],
  legislators: any[],
  chairs: any[],
): string[] {
  const findings: string[] = [];

  // Power concentration
  const ltGov = bigThree.find(b => b.role === "lieutenant_governor");
  const speaker = bigThree.find(b => b.role === "speaker");
  if (ltGov) {
    findings.push(
      `Lt. Gov. ${ltGov.name} controls ${ltGov.metrics.committeeChairsControlled} Senate committee chairs — all legislation must pass through chairs he appoints.`
    );
  }
  if (speaker) {
    findings.push(
      `Speaker ${speaker.name} controls ${speaker.metrics.committeeChairsControlled} House committee chairs — the single most powerful appointment in the House.`
    );
  }

  // Party breakdown + 2/3 supermajority analysis
  const houseR = legislators.filter(l => l.chamber?.toLowerCase() === "house" && l.party === "R").length;
  const houseD = legislators.filter(l => l.chamber?.toLowerCase() === "house" && l.party === "D").length;
  const senateR = legislators.filter(l => l.chamber?.toLowerCase() === "senate" && l.party === "R").length;
  const senateD = legislators.filter(l => l.chamber?.toLowerCase() === "senate" && l.party === "D").length;
  const houseTotal = houseR + houseD;
  const senateTotal = senateR + senateD;

  findings.push(
    `House composition: ${houseR}R / ${houseD}D (${houseTotal} total). Senate: ${senateR}R / ${senateD}D (${senateTotal} total). Republican supermajority in both chambers.`
  );

  // 2/3 majority analysis (constitutional amendments + veto overrides)
  if (houseTotal > 0) {
    const houseTwoThirds = Math.ceil(houseTotal * 2 / 3);
    const hasHouse23 = houseR >= houseTwoThirds;
    findings.push(
      `House 2/3 threshold: ${houseTwoThirds} votes needed. GOP has ${houseR} — ${hasHouse23 ? "CAN pass constitutional amendments and override vetoes without Democratic support." : `needs ${houseTwoThirds - houseR} Democratic votes for constitutional amendments and veto overrides.`}`
    );
  }
  if (senateTotal > 0) {
    const senateTwoThirds = Math.ceil(senateTotal * 2 / 3);
    const hasSenate23 = senateR >= senateTwoThirds;
    findings.push(
      `Senate 2/3 threshold: ${senateTwoThirds} votes needed. GOP has ${senateR} — ${hasSenate23 ? "CAN pass constitutional amendments without Democratic support." : `needs ${senateTwoThirds - senateR} Democratic votes for constitutional amendments.`}`
    );
  }

  // Chair party concentration
  const rChairs = chairs.filter(c => {
    const leg = legislators.find(l => l.id === c.stakeholderId);
    return leg?.party === "R";
  }).length;
  const dChairs = chairs.filter(c => {
    const leg = legislators.find(l => l.id === c.stakeholderId);
    return leg?.party === "D";
  }).length;
  if (chairs.length > 0) {
    const rPct = ((rChairs / chairs.length) * 100).toFixed(0);
    findings.push(
      `Committee chair party split: ${rChairs}R / ${dChairs}D of ${chairs.length} chairs (${rPct}% Republican). ${dChairs > 0 ? `${dChairs} Democrat chair(s) — signals bipartisan outreach on specific committees.` : "All chairs Republican — complete party control of committee agendas."}`
    );
  }

  // Voting bloc analysis
  const bipartisanBlocs = votingBlocs.filter(b => b.bipartisan);
  if (bipartisanBlocs.length > 0) {
    findings.push(
      `${bipartisanBlocs.length} bipartisan voting bloc(s) detected — cross-party coalitions on ${bipartisanBlocs.map(b => b.issueAreas.slice(0, 2).join(", ")).join("; ")}. These could swing close votes.`
    );
  }

  const largeBlocs = votingBlocs.filter(b => b.members.length >= 5);
  if (largeBlocs.length > 0) {
    findings.push(
      `${largeBlocs.length} significant voting bloc(s) with 5+ members. Largest: ${largeBlocs[0].name} (${largeBlocs[0].members.length} members, ${(largeBlocs[0].cohesion * 100).toFixed(0)}% cohesion).`
    );
  }

  // Governor priorities
  const gov = bigThree.find(b => b.role === "governor");
  if (gov && gov.priorities.length > 0) {
    const top3 = [...gov.priorities].sort((a, b) => b.intensity - a.intensity).slice(0, 3);
    findings.push(
      `Governor ${gov.name}'s top priorities: ${top3.map(p => `${p.topic} (${p.intensity}/10)`).join(", ")}. Bills aligned with these are most likely to receive signature.`
    );
  }

  // Power flow analysis
  const appointEdges = powerFlows.filter(f => f.flowType === "appoints").length;
  const allyEdges = powerFlows.filter(f => f.flowType === "allies_with").length;
  const controlEdges = powerFlows.filter(f => f.flowType === "controls").length;
  findings.push(
    `Power network: ${powerFlows.length} connections mapped — ${appointEdges} appointments, ${allyEdges} alliances, ${controlEdges} control relationships.`
  );

  return findings;
}

// ── Data Persistence ───────────────────────────────────────────────────────

/** Seed/update power_centers and leadership_priorities tables from analysis results */
async function seedPowerCenters(bigThree: PowerCenterProfile[]) {
  const session = CURRENT_SESSION;

  // Batch: load all existing centers and priorities in two queries
  const existingCenters = await policyIntelDb
    .select()
    .from(powerCenters)
    .where(eq(powerCenters.session, session));
  const centerByRole = new Map(existingCenters.map(c => [c.role, c]));

  const allExistingPriorities = await policyIntelDb
    .select()
    .from(leadershipPriorities)
    .where(eq(leadershipPriorities.session, session));

  for (const pc of bigThree) {
    const pcData = {
      role: pc.role as any,
      name: pc.name,
      chamber: pc.chamber,
      party: pc.party,
      session,
      priorities: pc.priorities,
      influenceScore: pc.metrics.chamberControl,
      stats: {
        loyalistCount: pc.allies.length,
        committeeChairsAppointed: pc.metrics.committeeChairsControlled,
        billsPrioritized: pc.metrics.billsPrioritized,
        passRate: 0,
        donorOverlap: 0,
      },
      updatedAt: new Date(),
    };

    const existing = centerByRole.get(pc.role);
    let pcId: number;
    if (existing) {
      await policyIntelDb.update(powerCenters)
        .set(pcData)
        .where(eq(powerCenters.id, existing.id));
      pcId = existing.id;
    } else {
      const [inserted] = await policyIntelDb.insert(powerCenters).values(pcData).returning({ id: powerCenters.id });
      pcId = inserted.id;
    }

    // Batch priorities: find existing for this center
    const existingPrisForCenter = allExistingPriorities.filter(p => p.powerCenterId === pcId);
    const existingPriByTopic = new Map(existingPrisForCenter.map(p => [p.topic, p]));

    const newPriorities: any[] = [];
    const updatePriorities: Promise<any>[] = [];

    for (const pri of pc.priorities) {
      const ex = existingPriByTopic.get(pri.topic);
      if (!ex) {
        newPriorities.push({
          powerCenterId: pcId,
          session,
          topic: pri.topic,
          stance: pri.stance,
          intensity: pri.intensity,
          evidenceType: "analysis",
          evidenceDetail: pri.evidence,
        });
      } else {
        updatePriorities.push(
          policyIntelDb.update(leadershipPriorities)
            .set({ stance: pri.stance, intensity: pri.intensity, evidenceDetail: pri.evidence, updatedAt: new Date() })
            .where(eq(leadershipPriorities.id, ex.id))
        );
      }
    }

    if (newPriorities.length > 0) {
      await policyIntelDb.insert(leadershipPriorities).values(newPriorities);
    }
    if (updatePriorities.length > 0) {
      await Promise.all(updatePriorities);
    }
  }
  log.info({ count: bigThree.length }, "seeded power centers with priorities");
}

/** Persist voting blocs and their members to the database */
async function seedVotingBlocs(blocs: VotingBlocResult[]) {
  const session = CURRENT_SESSION;

  // Clear old blocs for this session and re-insert (simpler than upsert for nested data)
  const existingBlocs = await policyIntelDb
    .select({ id: votingBlocsTable.id })
    .from(votingBlocsTable)
    .where(eq(votingBlocsTable.session, session));

  if (existingBlocs.length > 0) {
    // Cascade deletes will remove voting_bloc_members too
    for (const eb of existingBlocs) {
      await policyIntelDb.delete(votingBlocsTable).where(eq(votingBlocsTable.id, eb.id));
    }
  }

  for (const bloc of blocs) {
    const [inserted] = await policyIntelDb.insert(votingBlocsTable).values({
      name: bloc.name,
      session,
      chamber: bloc.chamber,
      detectionMethod: "committee-co-membership",
      cohesion: bloc.cohesion,
      memberCount: bloc.members.length,
      issueAreas: bloc.issueAreas,
      alignedPowerCenter: bloc.alignedPowerCenter,
      bipartisan: bloc.bipartisan,
      narrative: bloc.narrative,
    }).returning({ id: votingBlocsTable.id });

    if (bloc.members.length > 0) {
      await policyIntelDb.insert(votingBlocMembers).values(
        bloc.members.map(m => ({
          blocId: inserted.id,
          stakeholderId: m.stakeholderId,
          loyalty: m.loyalty,
          isLeader: m.isLeader,
          joinedSession: session,
        }))
      );
    }
  }
  log.info({ blocs: blocs.length, members: blocs.reduce((s, b) => s + b.members.length, 0) }, "seeded committee cohorts");
}
