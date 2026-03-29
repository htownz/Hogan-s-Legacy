import { eq } from "drizzle-orm";
import { policyIntelDb } from "../db";
import { watchlists, workspaces, type PolicyIntelWatchlist } from "@shared/schema-policy-intel";

export async function loadActiveWatchlistsByWorkspace(): Promise<{
  allWorkspaces: Array<{ id: number }>;
  watchlistsByWorkspace: Map<number, PolicyIntelWatchlist[]>;
}> {
  const [allWorkspaces, activeWatchlists] = await Promise.all([
    policyIntelDb.select({ id: workspaces.id }).from(workspaces),
    policyIntelDb.select().from(watchlists).where(eq(watchlists.isActive, true)),
  ]);

  const watchlistsByWorkspace = new Map<number, PolicyIntelWatchlist[]>();
  for (const watchlist of activeWatchlists) {
    const existing = watchlistsByWorkspace.get(watchlist.workspaceId) ?? [];
    existing.push(watchlist);
    watchlistsByWorkspace.set(watchlist.workspaceId, existing);
  }

  return { allWorkspaces, watchlistsByWorkspace };
}