/**
 * Stakeholder Service
 *
 * Manages stakeholder records and observations.
 * Stakeholders are entities (legislators, lobbyists, PACs, orgs)
 * linked to matters via observations referencing source documents.
 */
import { and, eq } from "drizzle-orm";
import { policyIntelDb } from "../db";
import {
  stakeholders,
  stakeholderObservations,
  sourceDocuments,
  type InsertPolicyIntelStakeholder,
} from "@shared/schema-policy-intel";

// ── Types ────────────────────────────────────────────────────────────────────

export interface StakeholderWithObservations {
  stakeholder: typeof stakeholders.$inferSelect;
  observations: (typeof stakeholderObservations.$inferSelect)[];
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Upsert a stakeholder by (workspaceId, name, type).
 * Returns existing record if already present.
 */
export async function upsertStakeholder(
  data: InsertPolicyIntelStakeholder,
): Promise<{ stakeholder: typeof stakeholders.$inferSelect; created: boolean }> {
  const existing = await policyIntelDb
    .select()
    .from(stakeholders)
    .where(
      and(
        eq(stakeholders.workspaceId, data.workspaceId),
        eq(stakeholders.name, data.name),
        eq(stakeholders.type, data.type),
      ),
    );

  if (existing.length > 0) {
    return { stakeholder: existing[0], created: false };
  }

  const [created] = await policyIntelDb
    .insert(stakeholders)
    .values(data)
    .returning();

  return { stakeholder: created, created: true };
}

/**
 * Add an observation linking a stakeholder to a source document and/or matter.
 */
export async function addObservation(data: {
  stakeholderId: number;
  sourceDocumentId?: number;
  matterId?: number;
  observationText: string;
  confidence?: string;
}): Promise<typeof stakeholderObservations.$inferSelect> {
  const [created] = await policyIntelDb
    .insert(stakeholderObservations)
    .values({
      stakeholderId: data.stakeholderId,
      sourceDocumentId: data.sourceDocumentId ?? null,
      matterId: data.matterId ?? null,
      observationText: data.observationText,
      confidence: data.confidence ?? "medium",
    })
    .returning();

  return created;
}

/**
 * Get a stakeholder with all their observations.
 */
export async function getStakeholderWithObservations(
  stakeholderId: number,
): Promise<StakeholderWithObservations | null> {
  const [stakeholder] = await policyIntelDb
    .select()
    .from(stakeholders)
    .where(eq(stakeholders.id, stakeholderId));

  if (!stakeholder) return null;

  const observations = await policyIntelDb
    .select()
    .from(stakeholderObservations)
    .where(eq(stakeholderObservations.stakeholderId, stakeholderId));

  return { stakeholder, observations };
}

/**
 * Get all stakeholders linked to a matter via observations.
 */
export async function getStakeholdersForMatter(
  matterId: number,
): Promise<(typeof stakeholders.$inferSelect)[]> {
  const obs = await policyIntelDb
    .select({ stakeholderId: stakeholderObservations.stakeholderId })
    .from(stakeholderObservations)
    .where(eq(stakeholderObservations.matterId, matterId));

  if (obs.length === 0) return [];

  const uniqueIds = Array.from(new Set(obs.map((o) => o.stakeholderId)));
  const results: (typeof stakeholders.$inferSelect)[] = [];
  for (const id of uniqueIds) {
    const [s] = await policyIntelDb
      .select()
      .from(stakeholders)
      .where(eq(stakeholders.id, id));
    if (s) results.push(s);
  }

  return results;
}
