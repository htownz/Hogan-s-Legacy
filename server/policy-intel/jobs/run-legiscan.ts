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
import { fetchLegiscanBills } from "../connectors/texas/legiscan";
import { upsertSourceDocument } from "../services/source-document-service";
import { processDocumentAlerts, type AlertCreationResult } from "../services/alert-service";
import { policyIntelDb } from "../db";
import { workspaces } from "@shared/schema-policy-intel";

export interface RunLegiscanResult {
  mode: "recent" | "full";
  sessionId: number;
  sessionName: string;
  totalInMaster: number;
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
  /** "recent" = last 7 days (default); "full" = everything in session */
  mode?: "recent" | "full";
  /** Override number of days for "recent" mode (default: 7) */
  sinceDays?: number;
  /** Cap number of bills to fetch detail for (useful for testing) */
  limit?: number;
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
    fetched: 0,
    inserted: 0,
    skipped: 0,
    fetchErrors: [],
    upsertErrors: [],
    alerts: { created: 0, skippedDuplicate: 0, skippedCooldown: 0, details: [] },
  };

  // 1. Fetch from LegiScan API
  const legiscanResult = await fetchLegiscanBills({
    since,
    limit: opts.limit,
  });

  result.sessionId = legiscanResult.sessionId;
  result.sessionName = legiscanResult.sessionName;
  result.totalInMaster = legiscanResult.totalInMaster;
  result.fetched = legiscanResult.fetched;
  result.fetchErrors = legiscanResult.errors;

  if (legiscanResult.documents.length === 0) {
    return result;
  }

  // 2. Load all workspaces for cross-workspace matching
  const allWorkspaces = await policyIntelDb
    .select({ id: workspaces.id })
    .from(workspaces);

  // 3. Upsert documents → match watchlists → create alerts
  for (const doc of legiscanResult.documents) {
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
        const alertResult = await processDocumentAlerts(savedDoc, ws.id);
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
