/**
 * Job: run-legiscan
 * Orchestrates: fetch LegiScan bills → checksum dedupe → upsert source documents
 *   → match against watchlists → generate alerts.
 *
 * Two modes:
 *  - **recent** (default): fetches bills changed in the last 7 days
 *  - **full**: fetches ALL bills in the current session (initial hydration — slow)
 *
 * Designed to be called:
 *  - manually via POST /api/intel/jobs/run-legiscan
 *  - on a daily cron schedule once node-cron is wired
 *
 * Idempotent: checksums prevent duplicate source documents,
 * dedup guards prevent duplicate alerts.
 */
import {
  fetchLegiscanBills,
  fetchLegiscanMasterListBackfill,
  type LegiscanOrderBy,
} from "../connectors/texas/legiscan";
import { upsertSourceDocument } from "../services/source-document-service";
import { processDocumentAlerts } from "../services/alert-service";
import { loadActiveWatchlistsByWorkspace } from "./load-active-watchlists";

export interface RunLegiscanResult {
  mode: "recent" | "full" | "backfill";
  sessionId: number;
  sessionName: string;
  totalInMaster: number;
  totalCandidates: number;
  chunk: {
    offset: number;
    limit: number | null;
    orderBy: LegiscanOrderBy;
  };
  fetched: number;
  inserted: number;
  skipped: number;
  fetchErrors: Array<{ billId: number; error: string }>;
  upsertErrors: Array<{ title: string; error: string }>;
  alerts: {
    created: number;
    skippedDuplicate: number;
    skippedCooldown: number;
    details: Array<{ alertId: number; watchlist: string; score: number }>;
  };
}

export interface LegiscanJobOptions {
  /** "recent" = last 7 days (default); "full" = detail fetch; "backfill" = master-list only */
  mode?: "recent" | "full" | "backfill";
  /** Override number of days for "recent" mode (default: 7) */
  sinceDays?: number;
  /** Cap number of bills to fetch detail for (useful for testing) */
  limit?: number;
  /** Number of master-list candidates to skip before processing */
  offset?: number;
  /** Deterministic candidate ordering for chunked replay */
  orderBy?: LegiscanOrderBy;
  /** Specific LegiScan session ID (default: current session) */
  sessionId?: number;
  /** Number of parallel LegiScan detail fetches (default: env or 6) */
  detailConcurrency?: number;
}

export async function runLegiscanJob(
  opts: LegiscanJobOptions = {},
): Promise<RunLegiscanResult> {
  const mode = opts.mode ?? "recent";
  const sinceDays = opts.sinceDays ?? 7;

  // Build the `since` date for recent mode
  let since: string | undefined;
  if (mode === "recent") {
    const d = new Date();
    d.setDate(d.getDate() - sinceDays);
    since = d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  const result: RunLegiscanResult = {
    mode,
    sessionId: 0,
    sessionName: "",
    totalInMaster: 0,
    totalCandidates: 0,
    chunk: {
      offset: Math.max(0, Math.floor(Number(opts.offset) || 0)),
      limit: opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : null,
      orderBy: opts.orderBy ?? "bill_id_asc",
    },
    fetched: 0,
    inserted: 0,
    skipped: 0,
    fetchErrors: [],
    upsertErrors: [],
    alerts: { created: 0, skippedDuplicate: 0, skippedCooldown: 0, details: [] },
  };

  // 1. Fetch from LegiScan API
  let documents = [] as Awaited<ReturnType<typeof fetchLegiscanMasterListBackfill>>["documents"];

  if (mode === "backfill") {
    const fetchResult = await fetchLegiscanMasterListBackfill({
      since,
      limit: opts.limit,
      offset: opts.offset,
      orderBy: opts.orderBy,
      sessionId: opts.sessionId,
    });

    result.sessionId = fetchResult.sessionId;
    result.sessionName = fetchResult.sessionName;
    result.totalInMaster = fetchResult.totalInMaster;
    result.totalCandidates = fetchResult.totalCandidates;
    result.chunk.offset = fetchResult.offset;
    result.chunk.orderBy = fetchResult.orderBy;
    result.fetched = fetchResult.documents.length;
    result.fetchErrors = [];
    documents = fetchResult.documents;
  } else {
    const fetchResult = await fetchLegiscanBills({
      since,
      limit: opts.limit,
      offset: opts.offset,
      orderBy: opts.orderBy,
      sessionId: opts.sessionId,
      detailConcurrency: opts.detailConcurrency,
    });

    result.sessionId = fetchResult.sessionId;
    result.sessionName = fetchResult.sessionName;
    result.totalInMaster = fetchResult.totalInMaster;
    result.totalCandidates = fetchResult.totalCandidates;
    result.chunk.offset = fetchResult.offset;
    result.chunk.orderBy = fetchResult.orderBy;
    result.fetched = fetchResult.documents.length;
    result.fetchErrors = fetchResult.errors;
    documents = fetchResult.documents;
  }

  if (documents.length === 0) {
    return result;
  }

  // 2. Load all workspaces for cross-workspace matching
  const { allWorkspaces, watchlistsByWorkspace } = await loadActiveWatchlistsByWorkspace();

  // 3. Upsert documents → match watchlists → create alerts
  for (const doc of documents) {
    try {
      const { doc: savedDoc, inserted } = await upsertSourceDocument(doc);
      if (inserted) {
        result.inserted++;
      } else {
        result.skipped++;
        continue; // already processed — skip alert matching
      }

      // Run matching against every workspace's watchlists
      for (const ws of allWorkspaces) {
        const workspaceWatchlists = watchlistsByWorkspace.get(ws.id) ?? [];
        if (workspaceWatchlists.length === 0) {
          continue;
        }

        const alertResult = await processDocumentAlerts(savedDoc, ws.id, workspaceWatchlists);
        result.alerts.created += alertResult.created;
        result.alerts.skippedDuplicate += alertResult.skippedDuplicate;
        result.alerts.skippedCooldown += alertResult.skippedCooldown;
        result.alerts.details.push(...alertResult.details);
      }
    } catch (err: any) {
      result.upsertErrors.push({
        title: doc.title,
        error: err?.message ?? String(err),
      });
    }
  }

  return result;
}
