/**
 * Job: run-tec
 * Orchestrates: search TEC for filers + lobbyists → create stakeholders
 *   → create source documents → add observations.
 *
 * Two modes:
 *  - **search**: one-off search for a specific term and import results
 *  - **sweep**: iterate all active watchlist keywords and import new matches
 *
 * Call via POST /api/intel/jobs/run-tec-import (search mode)
 * or on a cron schedule via the scheduler (sweep mode).
 */
import { fetchTecData, type TecFilerRecord, type TecLobbyistRecord } from "../connectors/texas/tec-filings";
import { upsertStakeholder, addObservation } from "../services/stakeholder-service";
import { upsertSourceDocument } from "../services/source-document-service";
import { policyIntelDb } from "../db";
import { watchlists } from "@shared/schema-policy-intel";
import { eq } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RunTecResult {
  mode: "search" | "sweep";
  searchTerms: string[];
  stakeholdersCreated: number;
  stakeholdersExisting: number;
  sourceDocsInserted: number;
  sourceDocsSkipped: number;
  observationsCreated: number;
  errors: string[];
}

export interface TecImportOptions {
  mode?: "search" | "sweep";
  /** For "search" mode — the term to look up */
  searchTerm?: string;
  /** Workspace to associate stakeholders with */
  workspaceId: number;
  /** Optional matter link for observations */
  matterId?: number;
}

// ── Core import logic ────────────────────────────────────────────────────────

async function importTecResults(
  searchTerm: string,
  workspaceId: number,
  matterId: number | undefined,
  result: RunTecResult,
) {
  const tecData = await fetchTecData(searchTerm);
  result.errors.push(...tecData.errors);

  // Import filers as stakeholders + source docs
  for (const filer of tecData.filers) {
    try {
      await importFiler(filer, workspaceId, matterId, result);
    } catch (err: any) {
      result.errors.push(`Filer import error (${filer.filerName}): ${err?.message ?? String(err)}`);
    }
  }

  // Import lobbyists as stakeholders + source docs
  for (const lobbyist of tecData.lobbyists) {
    try {
      await importLobbyist(lobbyist, workspaceId, matterId, result);
    } catch (err: any) {
      result.errors.push(`Lobbyist import error (${lobbyist.name}): ${err?.message ?? String(err)}`);
    }
  }
}

async function importFiler(
  filer: TecFilerRecord,
  workspaceId: number,
  matterId: number | undefined,
  result: RunTecResult,
) {
  // Determine stakeholder type from TEC filer type
  const type = filer.filerType.toLowerCase().includes("pac") ? "pac" as const : "organization" as const;

  const { stakeholder, created } = await upsertStakeholder({
    workspaceId,
    type,
    name: filer.filerName,
    title: `TEC Filer (${filer.filerType})`,
    organization: filer.filerName,
    jurisdiction: "texas",
    tagsJson: ["tec", "campaign-finance", filer.filerType.toLowerCase()],
    sourceSummary: `TEC campaign finance filer ID: ${filer.filerId}`,
  });

  if (created) result.stakeholdersCreated++;
  else result.stakeholdersExisting++;

  // Create source document for the TEC filing record
  const { doc: sourceDoc, inserted } = await upsertSourceDocument({
    sourceType: "texas_ethics",
    publisher: "Texas Ethics Commission",
    sourceUrl: filer.sourceUrl,
    externalId: `tec-filer-${filer.filerId}`,
    title: `TEC Filing: ${filer.filerName} (${filer.filerType})`,
    summary: `Campaign finance filer record for ${filer.filerName}. Filer ID: ${filer.filerId}, Type: ${filer.filerType}.`,
    publishedAt: new Date(),
    checksum: null,
    rawPayload: filer,
    normalizedText: `${filer.filerName} ${filer.filerType} campaign finance filer ${filer.filerId}`,
    tagsJson: ["tec", "campaign-finance"],
  });

  if (inserted) result.sourceDocsInserted++;
  else result.sourceDocsSkipped++;

  // Add observation linking stakeholder to source doc
  if (created || inserted) {
    await addObservation({
      stakeholderId: stakeholder.id,
      sourceDocumentId: sourceDoc.id,
      matterId,
      observationText: `TEC campaign finance filer. Type: ${filer.filerType}. Filer ID: ${filer.filerId}.`,
      confidence: "high",
    });
    result.observationsCreated++;
  }
}

async function importLobbyist(
  lobbyist: TecLobbyistRecord,
  workspaceId: number,
  matterId: number | undefined,
  result: RunTecResult,
) {
  const { stakeholder, created } = await upsertStakeholder({
    workspaceId,
    type: "lobbyist",
    name: lobbyist.name,
    title: "Registered Lobbyist",
    organization: lobbyist.clients.length > 0 ? lobbyist.clients.join(", ") : undefined,
    jurisdiction: "texas",
    tagsJson: ["tec", "lobbyist", `reg-${lobbyist.registrationId}`],
    sourceSummary: `TEC lobbyist registration ID: ${lobbyist.registrationId}`,
  });

  if (created) result.stakeholdersCreated++;
  else result.stakeholdersExisting++;

  // Create source document for the TEC lobbyist registration
  const { doc: sourceDoc, inserted } = await upsertSourceDocument({
    sourceType: "texas_ethics",
    publisher: "Texas Ethics Commission",
    sourceUrl: lobbyist.sourceUrl,
    externalId: `tec-lobby-${lobbyist.registrationId}`,
    title: `TEC Lobbyist: ${lobbyist.name}`,
    summary: `Lobbyist registration for ${lobbyist.name}. Registration ID: ${lobbyist.registrationId}.${lobbyist.clients.length > 0 ? ` Clients: ${lobbyist.clients.join(", ")}.` : ""}`,
    publishedAt: new Date(),
    checksum: null,
    rawPayload: lobbyist,
    normalizedText: `${lobbyist.name} lobbyist registration ${lobbyist.registrationId} ${lobbyist.clients.join(" ")}`,
    tagsJson: ["tec", "lobbyist"],
  });

  if (inserted) result.sourceDocsInserted++;
  else result.sourceDocsSkipped++;

  if (created || inserted) {
    await addObservation({
      stakeholderId: stakeholder.id,
      sourceDocumentId: sourceDoc.id,
      matterId,
      observationText: `TEC registered lobbyist. Registration ID: ${lobbyist.registrationId}.${lobbyist.clients.length > 0 ? ` Represents: ${lobbyist.clients.join(", ")}.` : ""}`,
      confidence: "high",
    });
    result.observationsCreated++;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function runTecImportJob(opts: TecImportOptions): Promise<RunTecResult> {
  const mode = opts.mode ?? "search";

  const result: RunTecResult = {
    mode,
    searchTerms: [],
    stakeholdersCreated: 0,
    stakeholdersExisting: 0,
    sourceDocsInserted: 0,
    sourceDocsSkipped: 0,
    observationsCreated: 0,
    errors: [],
  };

  if (mode === "search") {
    if (!opts.searchTerm) {
      throw new Error("searchTerm is required for search mode");
    }
    result.searchTerms.push(opts.searchTerm);
    await importTecResults(opts.searchTerm, opts.workspaceId, opts.matterId, result);
  } else {
    // sweep mode: pull keywords from active watchlists
    const activeWatchlists = await policyIntelDb
      .select()
      .from(watchlists)
      .where(eq(watchlists.isActive, true));

    const terms = new Set<string>();
    for (const wl of activeWatchlists) {
      // Extract keywords from watchlist name and rules
      const words = wl.name.split(/\s+/).filter((w) => w.length > 3);
      words.forEach((w) => terms.add(w));

      const rules = wl.rulesJson as Record<string, unknown> | null;
      if (rules && typeof rules === "object") {
        const kw = (rules as any).keywords;
        if (Array.isArray(kw)) {
          kw.forEach((k: string) => terms.add(k));
        }
      }
    }

    result.searchTerms = Array.from(terms);

    for (const term of result.searchTerms) {
      try {
        await importTecResults(term, opts.workspaceId, opts.matterId, result);
      } catch (err: any) {
        result.errors.push(`Sweep error for "${term}": ${err?.message ?? String(err)}`);
      }
    }
  }

  return result;
}
