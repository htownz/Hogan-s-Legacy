/**
 * Job: run-tlo-rss
 * Orchestrates: fetch TLO RSS feeds → checksum dedupe → upsert source documents
 *   → match against watchlists → generate alerts.
 *
 * Designed to be called:
 *  - manually via POST /api/intel/jobs/run-tlo-rss (dev + operations)
 *  - on a cron schedule once node-cron is wired in app.ts
 *
 * Idempotent: running this job twice in a row produces zero duplicate rows
 * and zero duplicate alerts.
 */
import { fetchAllTloFeeds } from "../connectors/texas/tlo-rss";
import { upsertSourceDocument } from "../services/source-document-service";
import { processDocumentAlerts } from "../services/alert-service";
import { loadActiveWatchlistsByWorkspace } from "./load-active-watchlists";

export interface RunTloRssResult {
  feedsAttempted: number;
  feedErrors: { feedType: string; error: string }[];
  totalFetched: number;
  inserted: number;
  skipped: number;
  errors: { title: string; error: string }[];
  alerts: {
    created: number;
    skippedDuplicate: number;
    skippedCooldown: number;
    details: { alertId: number; watchlist: string; score: number }[];
  };
}

export async function runTloRssJob(): Promise<RunTloRssResult> {
  const result: RunTloRssResult = {
    feedsAttempted: 0,
    feedErrors: [],
    totalFetched: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
    alerts: { created: 0, skippedDuplicate: 0, skippedCooldown: 0, details: [] },
  };

  // Load all workspace ids so we match across all workspaces
  const { allWorkspaces, watchlistsByWorkspace } = await loadActiveWatchlistsByWorkspace();

  const feedResults = await fetchAllTloFeeds();
  result.feedsAttempted = feedResults.length;

  for (const feedResult of feedResults) {
    if (feedResult.error) {
      result.feedErrors.push({ feedType: feedResult.feedType, error: feedResult.error });
      continue;
    }

    result.totalFetched += feedResult.documents.length;

    for (const doc of feedResult.documents) {
      try {
        const { doc: savedDoc, inserted } = await upsertSourceDocument(doc);
        if (inserted) {
          result.inserted++;
        } else {
          result.skipped++;
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
        result.errors.push({
          title: doc.title,
          error: err?.message ?? String(err),
        });
      }
    }
  }

  return result;
}
