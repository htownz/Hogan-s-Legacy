/**
 * Relationship Intelligence Service — maps the Texas political influence network
 *
 * Builds and queries a network graph of:
 * - Legislator-to-legislator connections (co-sponsorship, committee overlap, voting blocs)
 * - Lobbyist-to-legislator connections (TEC filings, testimony records)
 * - Funding flows (campaign contributions → committee assignments → bill outcomes)
 * - Opposition/ally networks per issue area
 *
 * Designed for lobby firms who need to know: "Who do we talk to, who's aligned,
 * and who's working against our client's interests?"
 */
import { eq, and, desc, sql, ne, inArray, gte } from "drizzle-orm";
import { policyIntelDb } from "../db";
import {
  relationships,
  stakeholders,
  stakeholderObservations,
  committeeMembers,
  issueRooms,
  alerts,
  sourceDocuments,
  type PolicyIntelRelationship,
  type InsertPolicyIntelRelationship,
} from "@shared/schema-policy-intel";
import { createLogger } from "../logger";

const log = createLogger("relationship-intelligence");

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface NetworkNode {
  id: number;
  name: string;
  type: string; // legislator, lobbyist, organization, committee
  party?: string;
  chamber?: string;
  role?: string;
  influence: number; // 0-100 computed centrality
  connectionCount: number;
}

export interface NetworkEdge {
  id: number;
  fromId: number;
  toId: number;
  relationshipType: string;
  strength: number;
  evidence: string | null;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgConnections: number;
    mostConnected: { name: string; connections: number } | null;
    clusters: number;
  };
}

export interface StakeholderDossier {
  stakeholder: {
    id: number;
    name: string;
    type: string;
    party?: string;
    chamber?: string;
    district?: string;
    role?: string;
  };
  relationships: Array<{
    relatedStakeholder: { id: number; name: string; type: string };
    type: string;
    strength: number;
    evidence: string | null;
  }>;
  observations: Array<{
    type: string;
    summary: string;
    date: string;
  }>;
  committees: Array<{
    committee: string;
    role: string;
    chamber: string;
  }>;
  billConnections: Array<{
    billId: string;
    role: string;
    alert: { title: string; score: number } | null;
  }>;
  influenceScore: number;
  reachability: number; // how many other stakeholders can be reached through this one
}

export interface IssueAlignmentMap {
  issue: string;
  supporters: Array<{ id: number; name: string; strength: number }>;
  opponents: Array<{ id: number; name: string; strength: number }>;
  neutrals: Array<{ id: number; name: string }>;
  fundingFlows: Array<{
    from: { id: number; name: string };
    to: { id: number; name: string };
    amount?: number;
    description: string;
  }>;
}

// ── Relationship CRUD ───────────────────────────────────────────────────────

export async function createRelationship(
  data: InsertPolicyIntelRelationship,
): Promise<PolicyIntelRelationship> {
  const [created] = await policyIntelDb
    .insert(relationships)
    .values(data)
    .onConflictDoNothing()
    .returning();

  if (!created) {
    // Already exists, update instead
    const [existing] = await policyIntelDb
      .select()
      .from(relationships)
      .where(
        and(
          eq(relationships.fromStakeholderId, data.fromStakeholderId),
          eq(relationships.toStakeholderId, data.toStakeholderId),
          eq(relationships.relationshipType, data.relationshipType),
        ),
      );
    if (existing) {
      const [updated] = await policyIntelDb
        .update(relationships)
        .set({
          strength: data.strength ?? existing.strength,
          evidenceSummary: data.evidenceSummary ?? existing.evidenceSummary,
          updatedAt: new Date(),
        })
        .where(eq(relationships.id, existing.id))
        .returning();
      return updated;
    }
    throw new Error("Failed to create or find relationship");
  }
  return created;
}

export async function listRelationships(
  workspaceId: number,
  stakeholderId?: number,
): Promise<PolicyIntelRelationship[]> {
  const conditions = [eq(relationships.workspaceId, workspaceId)];
  if (stakeholderId) {
    return policyIntelDb
      .select()
      .from(relationships)
      .where(
        and(
          eq(relationships.workspaceId, workspaceId),
          sql`(${relationships.fromStakeholderId} = ${stakeholderId} OR ${relationships.toStakeholderId} = ${stakeholderId})`,
        ),
      )
      .orderBy(desc(relationships.strength));
  }

  return policyIntelDb
    .select()
    .from(relationships)
    .where(and(...conditions))
    .orderBy(desc(relationships.strength));
}

// ── Network graph builder ───────────────────────────────────────────────────

export async function buildNetworkGraph(
  workspaceId: number,
  options?: {
    focusStakeholderId?: number;
    relationshipTypes?: string[];
    minStrength?: number;
    maxDepth?: number;
  },
): Promise<NetworkGraph> {
  // Get all relationships for workspace
  let rels = await policyIntelDb
    .select()
    .from(relationships)
    .where(eq(relationships.workspaceId, workspaceId));

  // Apply filters
  if (options?.relationshipTypes?.length) {
    rels = rels.filter((r) =>
      options.relationshipTypes!.includes(r.relationshipType),
    );
  }
  if (options?.minStrength) {
    rels = rels.filter((r) => r.strength >= options.minStrength!);
  }

  // Collect unique stakeholder IDs
  const stakeholderIds = new Set<number>();
  for (const r of rels) {
    stakeholderIds.add(r.fromStakeholderId);
    stakeholderIds.add(r.toStakeholderId);
  }

  if (stakeholderIds.size === 0) {
    return {
      nodes: [],
      edges: [],
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        avgConnections: 0,
        mostConnected: null,
        clusters: 0,
      },
    };
  }

  // Load stakeholder data
  const allStakeholders = await policyIntelDb
    .select()
    .from(stakeholders)
    .where(inArray(stakeholders.id, Array.from(stakeholderIds)));

  const stakeholderMap = new Map(allStakeholders.map((s) => [s.id, s]));

  // Build nodes with connection counts
  const connectionCounts = new Map<number, number>();
  for (const r of rels) {
    connectionCounts.set(
      r.fromStakeholderId,
      (connectionCounts.get(r.fromStakeholderId) ?? 0) + 1,
    );
    connectionCounts.set(
      r.toStakeholderId,
      (connectionCounts.get(r.toStakeholderId) ?? 0) + 1,
    );
  }

  const nodes: NetworkNode[] = Array.from(stakeholderIds).map((id) => {
    const s = stakeholderMap.get(id);
    const connCount = connectionCounts.get(id) ?? 0;
    return {
      id,
      name: s?.name ?? `Stakeholder ${id}`,
      type: s?.type ?? "unknown",
      party: s?.party ?? undefined,
      chamber: s?.chamber ?? undefined,
      role: undefined,
      influence: Math.min(connCount * 10, 100),
      connectionCount: connCount,
    };
  });

  const edges: NetworkEdge[] = rels.map((r) => ({
    id: r.id,
    fromId: r.fromStakeholderId,
    toId: r.toStakeholderId,
    relationshipType: r.relationshipType,
    strength: r.strength,
    evidence: r.evidenceSummary,
  }));

  // Compute stats
  const maxConnNode = nodes.reduce(
    (max, n) => (n.connectionCount > (max?.connectionCount ?? 0) ? n : max),
    null as NetworkNode | null,
  );

  // Simple cluster count via connected components (BFS)
  const visited = new Set<number>();
  let clusters = 0;
  const adjacency = new Map<number, number[]>();
  for (const r of rels) {
    if (!adjacency.has(r.fromStakeholderId))
      adjacency.set(r.fromStakeholderId, []);
    if (!adjacency.has(r.toStakeholderId))
      adjacency.set(r.toStakeholderId, []);
    adjacency.get(r.fromStakeholderId)!.push(r.toStakeholderId);
    adjacency.get(r.toStakeholderId)!.push(r.fromStakeholderId);
  }

  for (const id of stakeholderIds) {
    if (visited.has(id)) continue;
    clusters++;
    const queue = [id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const neighbors = adjacency.get(current) ?? [];
      for (const n of neighbors) {
        if (!visited.has(n)) queue.push(n);
      }
    }
  }

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgConnections:
        nodes.length > 0
          ? nodes.reduce((s, n) => s + n.connectionCount, 0) / nodes.length
          : 0,
      mostConnected: maxConnNode
        ? { name: maxConnNode.name, connections: maxConnNode.connectionCount }
        : null,
      clusters,
    },
  };
}

// ── Stakeholder dossier ─────────────────────────────────────────────────────

export async function getStakeholderDossier(
  workspaceId: number,
  stakeholderId: number,
): Promise<StakeholderDossier> {
  // Load stakeholder
  const [s] = await policyIntelDb
    .select()
    .from(stakeholders)
    .where(eq(stakeholders.id, stakeholderId));

  if (!s) throw new Error(`Stakeholder ${stakeholderId} not found`);

  // Load relationships (both directions)
  const rels = await policyIntelDb
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.workspaceId, workspaceId),
        sql`(${relationships.fromStakeholderId} = ${stakeholderId} OR ${relationships.toStakeholderId} = ${stakeholderId})`,
      ),
    )
    .orderBy(desc(relationships.strength));

  // Load related stakeholders
  const relatedIds = new Set<number>();
  for (const r of rels) {
    relatedIds.add(
      r.fromStakeholderId === stakeholderId
        ? r.toStakeholderId
        : r.fromStakeholderId,
    );
  }

  const relatedStakeholders =
    relatedIds.size > 0
      ? await policyIntelDb
          .select()
          .from(stakeholders)
          .where(inArray(stakeholders.id, Array.from(relatedIds)))
      : [];
  const relMap = new Map(relatedStakeholders.map((rs) => [rs.id, rs]));

  // Load observations
  const observations = await policyIntelDb
    .select()
    .from(stakeholderObservations)
    .where(eq(stakeholderObservations.stakeholderId, stakeholderId))
    .orderBy(desc(stakeholderObservations.createdAt))
    .limit(20);

  // Load committee memberships
  const committees = await policyIntelDb
    .select()
    .from(committeeMembers)
    .where(
      eq(committeeMembers.stakeholderId, stakeholderId),
    );

  // Bill connections via alerts mentioning this stakeholder
  const billAlerts = await policyIntelDb
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.workspaceId, workspaceId),
        sql`${alerts.title} ILIKE ${"%" + s.name + "%"}`,
      ),
    )
    .limit(20);

  const billPattern =
    /\b(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?)\s*(\d+)\b/gi;
  const billConnections: StakeholderDossier["billConnections"] = [];
  const seenBills = new Set<string>();
  for (const a of billAlerts) {
    const matches = (a.title ?? "").matchAll(billPattern);
    for (const m of matches) {
      const bId = `${m[1].replace(/\./g, "")} ${m[2]}`;
      if (seenBills.has(bId)) continue;
      seenBills.add(bId);
      billConnections.push({
        billId: bId,
        role: "associated",
        alert: { title: a.title ?? "", score: a.relevanceScore ?? 0 },
      });
    }
  }

  // Compute influence score: connections + committee roles + observation count
  const influenceScore = Math.min(
    100,
    rels.length * 5 +
      committees.filter((c) => c.role === "chair" || c.role === "vice_chair")
        .length *
        20 +
      committees.length * 3 +
      Math.min(observations.length, 10) * 2,
  );

  return {
    stakeholder: {
      id: s.id,
      name: s.name,
      type: s.type,
      party: s.party ?? undefined,
      chamber: s.chamber ?? undefined,
      district: s.district ?? undefined,
      role: undefined,
    },
    relationships: rels.map((r) => {
      const otherId =
        r.fromStakeholderId === stakeholderId
          ? r.toStakeholderId
          : r.fromStakeholderId;
      const other = relMap.get(otherId);
      return {
        relatedStakeholder: {
          id: otherId,
          name: other?.name ?? `Stakeholder ${otherId}`,
          type: other?.type ?? "unknown",
        },
        type: r.relationshipType,
        strength: r.strength,
        evidence: r.evidenceSummary,
      };
    }),
    observations: observations.map((o) => ({
      type: o.confidence,
      summary: o.observationText,
      date: o.createdAt.toISOString(),
    })),
    committees: committees.map((c) => ({
      committee: c.committeeName,
      role: c.role ?? "member",
      chamber: c.chamber,
    })),
    billConnections,
    influenceScore,
    reachability: relatedIds.size,
  };
}

// ── Auto-discover relationships from existing data ──────────────────────────

export async function autoDiscoverRelationships(
  workspaceId: number,
): Promise<{ discovered: number; created: number }> {
  let created = 0;

  // 1. Committee co-membership → "committee_together"
  const allWorkspaceStakeholders = await policyIntelDb
    .select({ id: stakeholders.id })
    .from(stakeholders)
    .where(eq(stakeholders.workspaceId, workspaceId));
  const wsStakeholderIds = new Set(allWorkspaceStakeholders.map((s) => s.id));

  const members = (await policyIntelDb
    .select()
    .from(committeeMembers))
    .filter((m) => wsStakeholderIds.has(m.stakeholderId));

  const committeeGroups = new Map<string, number[]>();
  for (const m of members) {
    if (!committeeGroups.has(m.committeeName))
      committeeGroups.set(m.committeeName, []);
    committeeGroups.get(m.committeeName)!.push(m.stakeholderId);
  }

  for (const [committee, memberIds] of committeeGroups) {
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        try {
          await createRelationship({
            workspaceId,
            fromStakeholderId: memberIds[i],
            toStakeholderId: memberIds[j],
            relationshipType: "committee_together",
            strength: 0.4,
            evidenceSummary: `Both serve on ${committee}`,
          });
          created++;
        } catch {
          // Skip constraint violations
        }
      }
    }
  }

  // 2. Co-occurrence in alerts → potential "ally" or "co_sponsors"
  const allAlerts = await policyIntelDb
    .select()
    .from(alerts)
    .where(eq(alerts.workspaceId, workspaceId))
    .limit(500);

  const allStakeholderNames = await policyIntelDb
    .select({ id: stakeholders.id, name: stakeholders.name })
    .from(stakeholders)
    .where(eq(stakeholders.workspaceId, workspaceId));

  // Find which stakeholders appear together in alert titles
  const coOccurrences = new Map<string, number>();
  for (const alert of allAlerts) {
    const text = `${alert.title ?? ""} ${alert.whyItMatters ?? ""}`.toLowerCase();
    const mentioned = allStakeholderNames.filter((s) =>
      text.includes(s.name.toLowerCase()),
    );

    for (let i = 0; i < mentioned.length; i++) {
      for (let j = i + 1; j < mentioned.length; j++) {
        const key = [mentioned[i].id, mentioned[j].id].sort().join("-");
        coOccurrences.set(key, (coOccurrences.get(key) ?? 0) + 1);
      }
    }
  }

  for (const [key, count] of coOccurrences) {
    if (count < 2) continue; // need at least 2 co-occurrences
    const [fromId, toId] = key.split("-").map(Number);
    try {
      await createRelationship({
        workspaceId,
        fromStakeholderId: fromId,
        toStakeholderId: toId,
        relationshipType: "ally",
        strength: Math.min(count * 0.15, 0.9),
        evidenceSummary: `Co-mentioned in ${count} legislative alerts`,
      });
      created++;
    } catch {
      // Skip constraint violations
    }
  }

  log.info(`Auto-discovered relationships: ${created} created for workspace ${workspaceId}`);
  return { discovered: coOccurrences.size + committeeGroups.size, created };
}
