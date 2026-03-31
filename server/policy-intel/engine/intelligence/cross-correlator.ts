/**
 * Cross-Bill Correlator — discovers hidden relationships between bills
 * and groups them into legislative "clusters".
 *
 * Instead of treating each bill/alert in isolation, this finds:
 * - Bills that appear together in the same hearings
 * - Bills that share watchlist matches (implying topical linkage)
 * - Amendment chains (companion/substitute/amendment relationships)
 * - Committee overlap patterns
 *
 * Output: clusters of related legislative activity that the user might
 * not realize are connected — "HB 14 and SB 205 are being heard by the
 * same committee, share 3 keyword matches, and both reference ERCOT."
 */
import { policyIntelDb } from "../../db";
import { alerts, sourceDocuments, hearingEvents, watchlists, issueRooms } from "@shared/schema-policy-intel";
import { eq, sql, gte, desc, count } from "drizzle-orm";

export interface BillNode {
  billId: string;
  title: string;
  sourceDocumentId?: number;
  sourceType: string;
  lastSeen: string;
  alertCount: number;
  watchlistIds: number[];
  committees: string[];
}

export interface BillCluster {
  /** Cluster ID (deterministic from sorted bill IDs) */
  id: string;
  /** Descriptive label */
  label: string;
  /** Bills in this cluster */
  bills: BillNode[];
  /** Why these bills are connected */
  linkages: ClusterLinkage[];
  /** Overall strength of the cluster (0-1) */
  cohesion: number;
  /** Strategic significance */
  significance: "critical" | "high" | "moderate" | "low";
  /** Human-readable intelligence narrative */
  narrative: string;
}

export interface ClusterLinkage {
  type: "same_hearing" | "same_watchlist" | "same_committee" | "keyword_overlap" | "same_issue_room";
  detail: string;
  strength: number; // 0-1
}

export interface CorrelationReport {
  analyzedAt: string;
  clusters: BillCluster[];
  isolatedBills: BillNode[];
  isolatedBillCount?: number;
  totalBillsAnalyzed: number;
}

/** Extract bill IDs from text using standard patterns */
function extractBillIds(text: string): string[] {
  const pattern = /\b(H\.?B\.?|S\.?B\.?|H\.?R\.?|S\.?R\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)\s*(\d+)\b/gi;
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const prefix = m[1].replace(/\./g, "").toUpperCase();
    ids.add(`${prefix} ${m[2]}`);
  }
  return [...ids];
}

export async function analyzeCorrelations(): Promise<CorrelationReport> {
  const d90 = new Date(Date.now() - 90 * 86400000);

  // ── Gather bill universe from recent source docs ─────────────────────
  const recentDocs = await policyIntelDb
    .select({
      id: sourceDocuments.id,
      title: sourceDocuments.title,
      sourceType: sourceDocuments.sourceType,
      rawPayload: sourceDocuments.rawPayload,
      normalizedText: sourceDocuments.normalizedText,
      fetchedAt: sourceDocuments.fetchedAt,
    })
    .from(sourceDocuments)
    .where(gte(sourceDocuments.fetchedAt, d90))
    .orderBy(desc(sourceDocuments.fetchedAt))
    .limit(2000);

  // Build bill → document mapping
  const billMap = new Map<string, BillNode>();

  for (const doc of recentDocs) {
    const billIds: string[] = [];

    // From rawPayload
    const payload = doc.rawPayload as Record<string, unknown>;
    if (payload?.billId && typeof payload.billId === "string") {
      billIds.push(payload.billId.replace(/\./g, "").toUpperCase().replace(/\s+/g, " ").trim());
    }

    // From title
    billIds.push(...extractBillIds(doc.title));

    // From text (first 2000 chars to avoid scanning massive documents)
    if (doc.normalizedText) {
      billIds.push(...extractBillIds(doc.normalizedText.slice(0, 2000)));
    }

    for (const billId of new Set(billIds)) {
      const existing = billMap.get(billId);
      if (existing) {
        existing.alertCount++;
        if (doc.fetchedAt && doc.fetchedAt.toISOString() > existing.lastSeen) {
          existing.lastSeen = doc.fetchedAt.toISOString();
        }
      } else {
        const committees: string[] = [];
        if (payload?.committee && typeof payload.committee === "string") {
          committees.push(payload.committee);
        }
        billMap.set(billId, {
          billId,
          title: doc.title,
          sourceDocumentId: doc.id,
          sourceType: doc.sourceType,
          lastSeen: doc.fetchedAt?.toISOString() ?? new Date().toISOString(),
          alertCount: 1,
          watchlistIds: [],
          committees,
        });
      }
    }
  }

  // ── Enrich with alert/watchlist data ─────────────────────────────────
  const alertRows = await policyIntelDb
    .select({
      watchlistId: alerts.watchlistId,
      sourceDocumentId: alerts.sourceDocumentId,
    })
    .from(alerts)
    .where(gte(alerts.createdAt, d90));

  const docToWatchlists = new Map<number, Set<number>>();
  for (const row of alertRows) {
    if (!row.sourceDocumentId || !row.watchlistId) continue;
    const set = docToWatchlists.get(row.sourceDocumentId) ?? new Set();
    set.add(row.watchlistId);
    docToWatchlists.set(row.sourceDocumentId, set);
  }

  for (const bill of billMap.values()) {
    if (bill.sourceDocumentId) {
      bill.watchlistIds = [...(docToWatchlists.get(bill.sourceDocumentId) ?? [])];
    }
  }

  // ── Enrich with hearing co-occurrence ────────────────────────────────
  const hearingRows = await policyIntelDb
    .select({
      id: hearingEvents.id,
      committee: hearingEvents.committee,
      relatedBillIds: hearingEvents.relatedBillIds,
    })
    .from(hearingEvents)
    .where(gte(hearingEvents.hearingDate, d90));

  // Build co-occurrence edges
  const edges = new Map<string, { linkages: ClusterLinkage[]; strength: number }>();

  function addEdge(a: string, b: string, linkage: ClusterLinkage) {
    const key = [a, b].sort().join("||");
    const existing = edges.get(key) ?? { linkages: [], strength: 0 };
    existing.linkages.push(linkage);
    existing.strength += linkage.strength;
    edges.set(key, existing);
  }

  // Hearing co-occurrence
  for (const h of hearingRows) {
    const bills = (h.relatedBillIds ?? []).filter(id => billMap.has(id));
    for (let i = 0; i < bills.length; i++) {
      for (let j = i + 1; j < bills.length; j++) {
        addEdge(bills[i], bills[j], { type: "same_hearing", detail: `Both scheduled for ${h.committee} hearing`, strength: 0.8 });
      }
      // Also record committee
      const node = billMap.get(bills[i]);
      if (node && !node.committees.includes(h.committee)) {
        node.committees.push(h.committee);
      }
    }
  }

  // Watchlist co-occurrence
  const watchlistBills = new Map<number, string[]>();
  for (const [billId, node] of billMap) {
    for (const wid of node.watchlistIds) {
      const list = watchlistBills.get(wid) ?? [];
      list.push(billId);
      watchlistBills.set(wid, list);
    }
  }

  for (const [_wid, bills] of watchlistBills) {
    if (bills.length < 2 || bills.length > 20) continue; // skip noise
    for (let i = 0; i < bills.length; i++) {
      for (let j = i + 1; j < Math.min(bills.length, i + 10); j++) {
        addEdge(bills[i], bills[j], { type: "same_watchlist", detail: "Matched same watchlist rules", strength: 0.5 });
      }
    }
  }

  // Committee co-occurrence
  const committeeBills = new Map<string, string[]>();
  for (const [billId, node] of billMap) {
    for (const comm of node.committees) {
      const list = committeeBills.get(comm) ?? [];
      list.push(billId);
      committeeBills.set(comm, list);
    }
  }

  for (const [comm, bills] of committeeBills) {
    if (bills.length < 2 || bills.length > 30) continue;
    for (let i = 0; i < bills.length; i++) {
      for (let j = i + 1; j < Math.min(bills.length, i + 10); j++) {
        addEdge(bills[i], bills[j], { type: "same_committee", detail: `Both in ${comm}`, strength: 0.4 });
      }
    }
  }

  // ── Cluster connected components (union-find) ───────────────────────
  const parent = new Map<string, string>();

  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
    return parent.get(x)!;
  }

  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  // Only cluster if edge is strong enough
  for (const [key, edge] of edges) {
    if (edge.strength >= 0.4) {
      const [a, b] = key.split("||");
      union(a, b);
    }
  }

  // Group bills by cluster root
  const clusterGroups = new Map<string, string[]>();
  for (const billId of billMap.keys()) {
    const root = find(billId);
    const group = clusterGroups.get(root) ?? [];
    group.push(billId);
    clusterGroups.set(root, group);
  }

  // ── Build cluster objects ────────────────────────────────────────────
  const clusters: BillCluster[] = [];
  const isolatedBills: BillNode[] = [];

  for (const [_root, billIds] of clusterGroups) {
    if (billIds.length < 2) {
      const node = billMap.get(billIds[0]);
      if (node) isolatedBills.push(node);
      continue;
    }

    const bills = billIds.map(id => billMap.get(id)!).filter(Boolean);
    const clusterLinkages: ClusterLinkage[] = [];

    for (const [key, edge] of edges) {
      const [a, b] = key.split("||");
      if (billIds.includes(a) && billIds.includes(b)) {
        clusterLinkages.push(...edge.linkages);
      }
    }

    // Deduplicate linkages by type
    const uniqueLinkages = Array.from(
      new Map(clusterLinkages.map(l => [`${l.type}:${l.detail}`, l])).values()
    );

    const cohesion = Math.min(1, uniqueLinkages.reduce((s, l) => s + l.strength, 0) / (bills.length * 2));
    const totalAlerts = bills.reduce((s, b) => s + b.alertCount, 0);
    const significance: BillCluster["significance"] =
      cohesion > 0.7 && totalAlerts > 10 ? "critical" :
      cohesion > 0.5 || totalAlerts > 5 ? "high" :
      cohesion > 0.3 ? "moderate" : "low";

    const label = bills.slice(0, 3).map(b => b.billId).join(", ") + (bills.length > 3 ? ` +${bills.length - 3} more` : "");
    const committees = [...new Set(bills.flatMap(b => b.committees))];

    const narrative = `Cluster of ${bills.length} related bills (${label}) with ${uniqueLinkages.length} connection(s). ` +
      (committees.length > 0 ? `Active in ${committees.join(", ")}. ` : "") +
      `${totalAlerts} total alerts generated. ` +
      (significance === "critical" ? "This cluster shows strong interconnection and high activity — likely a coordinated legislative push." :
       significance === "high" ? "Significant correlation detected — these bills are likely part of the same policy effort." :
       "Moderate topical relationship detected.");

    clusters.push({
      id: billIds.sort().join("-"),
      label,
      bills,
      linkages: uniqueLinkages,
      cohesion,
      significance,
      narrative,
    });
  }

  clusters.sort((a, b) => {
    const sigOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    return (sigOrder[a.significance] - sigOrder[b.significance]) || (b.cohesion - a.cohesion);
  });

  return {
    analyzedAt: new Date().toISOString(),
    clusters,
    isolatedBills,
    isolatedBillCount: isolatedBills.length,
    totalBillsAnalyzed: billMap.size,
  };
}
