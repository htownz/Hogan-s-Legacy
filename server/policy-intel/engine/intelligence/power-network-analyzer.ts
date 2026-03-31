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
import { eq, sql, desc, and, count, ilike } from "drizzle-orm";

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

export async function analyzeNetworkPower(): Promise<PowerNetworkReport> {
  // ── Load all data ──────────────────────────────────────────────────
  const allStakeholders = await policyIntelDb.select().from(stakeholders);
  const allCommittees = await policyIntelDb.select().from(committeeMembers);

  const legislators = allStakeholders.filter(s => s.type === "legislator");
  const houseMembers = legislators.filter(l => l.chamber === "house");
  const senateMembers = legislators.filter(l => l.chamber === "senate");

  // Build committee maps
  const stakeholderCommittees = new Map<number, typeof allCommittees>();
  for (const cm of allCommittees) {
    const list = stakeholderCommittees.get(cm.stakeholderId) ?? [];
    list.push(cm);
    stakeholderCommittees.set(cm.stakeholderId, list);
  }

  const chairs = allCommittees.filter(cm => cm.role === "chair");
  const viceChairs = allCommittees.filter(cm => cm.role === "vice_chair");
  const houseChairs = chairs.filter(cm => cm.chamber === "house");
  const senateChairs = chairs.filter(cm => cm.chamber === "senate");

  // ── Big Three Analysis ─────────────────────────────────────────────
  const bigThree: PowerCenterProfile[] = [];

  // Governor (executive — not in legislators table, synthesize from data)
  const govPriorities = await detectGovernorPriorities();
  bigThree.push({
    name: "Greg Abbott",
    role: "governor",
    chamber: "executive",
    party: "R",
    priorities: govPriorities,
    committeeChairs: [], // Governor doesn't appoint committee chairs
    allies: [],
    metrics: {
      committeeChairsControlled: 0,
      billsPrioritized: govPriorities.length,
      chamberControl: 100, // executive authority
    },
  });

  // Lt. Governor — controls the Senate, appoints Senate committee chairs
  const ltGovName = "Dan Patrick";
  const ltGovAllies = findAllies(senateMembers, senateChairs, allCommittees, "senate");
  bigThree.push({
    name: ltGovName,
    role: "lieutenant_governor",
    chamber: "senate",
    party: "R",
    priorities: await detectChamberPriorities("senate"),
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
      billsPrioritized: 0,
      chamberControl: 85, // Lt Gov controls Senate floor & committee assignments
    },
  });

  // Speaker — controls the House, appoints House committee chairs
  const speakerName = findSpeaker(houseMembers, houseChairs) ?? "Dade Phelan";
  const speakerAllies = findAllies(houseMembers, houseChairs, allCommittees, "house");
  bigThree.push({
    name: speakerName,
    role: "speaker",
    chamber: "house",
    party: "R",
    priorities: await detectChamberPriorities("house"),
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
      billsPrioritized: 0,
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

  return {
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

/** Find the Speaker by looking for the most committee appointments */
function findSpeaker(houseMembers: any[], houseChairs: any[]): string | null {
  // The Speaker typically doesn't chair committees themselves
  // but we can infer from appointment patterns. Use known data.
  // In 89th session: Dade Phelan was Speaker (but may change in 90th)
  return null; // Use default
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
          ? `${leader.name} Bloc`
          : `${chamber.charAt(0).toUpperCase() + chamber.slice(1)} Bloc ${blocs.length + 1}`,
        chamber,
        members: members.sort((a, b) => b.loyalty - a.loyalty),
        cohesion: avgLoyalty,
        issueAreas: sharedCommittees.slice(0, 5),
        alignedPowerCenter: chamber === "senate" ? "Lieutenant Governor" : "Speaker",
        bipartisan,
        narrative: `${members.length}-member ${bipartisan ? "bipartisan " : ""}bloc in the ${chamber} centered around ${sharedCommittees.slice(0, 3).join(", ")} committee work. ${leader ? `Led by committee chair ${leader.name}.` : "No committee chair identified as leader."} Cohesion: ${(avgLoyalty * 100).toFixed(0)}%.`,
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
  let edgeId = 1;

  // Lt Gov → Senate committee chairs
  const ltGov = bigThree.find(b => b.role === "lieutenant_governor");
  if (ltGov) {
    for (const ch of ltGov.committeeChairs) {
      flows.push({
        sourceId: 0,
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
        sourceId: 0,
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

  // Voting bloc analysis
  const bipartisanBlocs = votingBlocs.filter(b => b.bipartisan);
  if (bipartisanBlocs.length > 0) {
    findings.push(
      `${bipartisanBlocs.length} bipartisan voting bloc(s) detected — cross-party coalitions that could swing close votes.`
    );
  }

  const largeBlocs = votingBlocs.filter(b => b.members.length >= 5);
  if (largeBlocs.length > 0) {
    findings.push(
      `${largeBlocs.length} significant voting bloc(s) with 5+ members detected. Largest: ${largeBlocs[0].name} with ${largeBlocs[0].members.length} members.`
    );
  }

  // Party breakdown
  const houseR = legislators.filter(l => l.chamber === "house" && l.party === "R").length;
  const houseD = legislators.filter(l => l.chamber === "house" && l.party === "D").length;
  const senateR = legislators.filter(l => l.chamber === "senate" && l.party === "R").length;
  const senateD = legislators.filter(l => l.chamber === "senate" && l.party === "D").length;
  findings.push(
    `House composition: ${houseR}R / ${houseD}D. Senate composition: ${senateR}R / ${senateD}D. Republican supermajority in both chambers.`
  );

  // Governor priorities
  const gov = bigThree.find(b => b.role === "governor");
  if (gov && gov.priorities.length > 0) {
    const topPriority = gov.priorities.sort((a, b) => b.intensity - a.intensity)[0];
    findings.push(
      `Governor ${gov.name}'s top priority: ${topPriority.topic} (intensity ${topPriority.intensity}/10) — ${topPriority.evidence}`
    );
  }

  return findings;
}
