// @ts-nocheck
import { and, count, desc, eq, inArray, like, sql } from "drizzle-orm";
import { db } from "./db";
import {
  InsertScoutBotAffiliation,
  InsertScoutBotMediaMention,
  InsertScoutBotProfile,
  ScoutBotAffiliation,
  ScoutBotMediaMention,
  ScoutBotProfile,
  profileStatusEnum,
  scoutBotAffiliations,
  scoutBotMediaMentions,
  scoutBotProfiles,
} from "../shared/schema-scout-bot";

/**
 * Scout Bot Profile Management
 */
export const createScoutBotProfile = async (
  profile: InsertScoutBotProfile
): Promise<ScoutBotProfile> => {
  const [createdProfile] = await db
    .insert(scoutBotProfiles)
    .values(profile)
    .returning();
  return createdProfile;
};

export const getScoutBotProfileById = async (
  id: string
): Promise<ScoutBotProfile | null> => {
  const profiles = await db
    .select()
    .from(scoutBotProfiles).$dynamic()
    .where(eq(scoutBotProfiles.id, id));
  return profiles.length > 0 ? profiles[0] : null;
};

export const getScoutBotProfiles = async (
  status?: string,
  type?: string,
  limit = 20,
  offset = 0
): Promise<{ profiles: ScoutBotProfile[]; total: number }> => {
  let query = db.select().from(scoutBotProfiles).$dynamic();
  let countQuery = db.select({ count: count() }).from(scoutBotProfiles);

  // Apply filters
  const filters = [];
  if (status) {
    filters.push(eq(scoutBotProfiles.status, status as any));
  }
  if (type) {
    filters.push(eq(scoutBotProfiles.type, type as any));
  }

  if (filters.length > 0) {
    const whereClause = and(...filters);
    query = query.where(whereClause);
    countQuery = countQuery.where(whereClause);
  }

  // Pagination
  query = query.limit(limit).offset(offset).orderBy(desc(scoutBotProfiles.submitted_at));

  // Execute queries
  const profiles = await query;
  const [{ count: total }] = await countQuery;

  return { profiles, total: Number(total) };
};

// Backward-compatible helper used by legacy routes.
export const getProfiles = async (filters?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<ScoutBotProfile[]> => {
  const result = await getScoutBotProfiles(
    filters?.status,
    filters?.type,
    filters?.limit ?? 200,
    filters?.offset ?? 0,
  );
  return result.profiles;
};

export const searchScoutBotProfiles = async (
  searchTerm: string,
  limit = 20,
  offset = 0
): Promise<{ profiles: ScoutBotProfile[]; total: number }> => {
  const searchPattern = `%${searchTerm}%`;

  const query = db
    .select()
    .from(scoutBotProfiles).$dynamic()
    .where(like(scoutBotProfiles.name, searchPattern))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(scoutBotProfiles.submitted_at));

  const countQuery = db
    .select({ count: count() })
    .from(scoutBotProfiles).$dynamic()
    .where(like(scoutBotProfiles.name, searchPattern));

  const profiles = await query;
  const [{ count: total }] = await countQuery;

  return { profiles, total: Number(total) };
};

// Backward-compatible helper used by legacy routes.
export const searchProfiles = async (filters: {
  name?: string;
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ScoutBotProfile[]> => {
  const name = (filters?.name ?? "").trim();

  if (!name) {
    return getProfiles(filters);
  }

  const result = await searchScoutBotProfiles(name, filters?.limit ?? 200, filters?.offset ?? 0);

  return result.profiles.filter((profile) => {
    if (filters?.type && profile.type !== filters.type) return false;
    if (filters?.status && profile.status !== filters.status) return false;
    return true;
  });
};

export const updateScoutBotProfile = async (
  id: string,
  data: Partial<InsertScoutBotProfile>
): Promise<ScoutBotProfile | null> => {
  const [updatedProfile] = await db
    .update(scoutBotProfiles)
    .set({ ...data, updated_at: new Date() })
    .where(eq(scoutBotProfiles.id, id))
    .returning();
  return updatedProfile || null;
};

export const updateScoutBotProfileStatus = async (
  id: string,
  status: (typeof profileStatusEnum.enumValues)[number],
  reviewedBy: string,
  reviewNotes?: string
): Promise<ScoutBotProfile | null> => {
  const [updatedProfile] = await db
    .update(scoutBotProfiles)
    .set({
      status,
      reviewed_by: reviewedBy,
      review_notes: reviewNotes,
      updated_at: new Date(),
    })
    .where(eq(scoutBotProfiles.id, id))
    .returning();
  return updatedProfile || null;
};

export const deleteScoutBotProfile = async (
  id: string
): Promise<boolean> => {
  const deleted = await db
    .delete(scoutBotProfiles)
    .where(eq(scoutBotProfiles.id, id))
    .returning({ id: scoutBotProfiles.id });
  return deleted.length > 0;
};

/**
 * Scout Bot Affiliations Management
 */
export const addScoutBotAffiliation = async (
  affiliation: InsertScoutBotAffiliation
): Promise<ScoutBotAffiliation> => {
  const [createdAffiliation] = await db
    .insert(scoutBotAffiliations)
    .values(affiliation)
    .returning();
  return createdAffiliation;
};

export const getScoutBotAffiliations = async (
  profileId: string
): Promise<ScoutBotAffiliation[]> => {
  return db
    .select()
    .from(scoutBotAffiliations).$dynamic()
    .where(eq(scoutBotAffiliations.profile_id, profileId));
};

// Backward-compatible aliases used by legacy route modules.
export const getProfileAffiliations = getScoutBotAffiliations;

export const updateScoutBotAffiliation = async (
  id: string,
  data: Partial<InsertScoutBotAffiliation>
): Promise<ScoutBotAffiliation | null> => {
  const [updatedAffiliation] = await db
    .update(scoutBotAffiliations)
    .set({ ...data, updated_at: new Date() })
    .where(eq(scoutBotAffiliations.id, id))
    .returning();
  return updatedAffiliation || null;
};

export const deleteScoutBotAffiliation = async (
  id: string
): Promise<boolean> => {
  const deleted = await db
    .delete(scoutBotAffiliations)
    .where(eq(scoutBotAffiliations.id, id))
    .returning({ id: scoutBotAffiliations.id });
  return deleted.length > 0;
};

/**
 * Scout Bot Media Mentions Management
 */
export const addScoutBotMediaMention = async (
  mediaMention: InsertScoutBotMediaMention
): Promise<ScoutBotMediaMention> => {
  const [createdMention] = await db
    .insert(scoutBotMediaMentions)
    .values(mediaMention)
    .returning();
  return createdMention;
};

export const getScoutBotMediaMentions = async (
  profileId: string
): Promise<ScoutBotMediaMention[]> => {
  return db
    .select()
    .from(scoutBotMediaMentions).$dynamic()
    .where(eq(scoutBotMediaMentions.profile_id, profileId))
    .orderBy(desc(scoutBotMediaMentions.date));
};

// Backward-compatible aliases used by legacy route modules.
export const getProfileMediaMentions = getScoutBotMediaMentions;

export const updateScoutBotMediaMention = async (
  id: string,
  data: Partial<InsertScoutBotMediaMention>
): Promise<ScoutBotMediaMention | null> => {
  const [updatedMention] = await db
    .update(scoutBotMediaMentions)
    .set({ ...data, updated_at: new Date() })
    .where(eq(scoutBotMediaMentions.id, id))
    .returning();
  return updatedMention || null;
};

export const deleteScoutBotMediaMention = async (
  id: string
): Promise<boolean> => {
  const deleted = await db
    .delete(scoutBotMediaMentions)
    .where(eq(scoutBotMediaMentions.id, id))
    .returning({ id: scoutBotMediaMentions.id });
  return deleted.length > 0;
};

/**
 * Get a complete profile with all related data
 */
export const getCompleteScoutBotProfile = async (
  id: string
): Promise<{
  profile: ScoutBotProfile | null;
  affiliations: ScoutBotAffiliation[];
  mediaMentions: ScoutBotMediaMention[];
}> => {
  const profile = await getScoutBotProfileById(id);
  
  if (!profile) {
    return {
      profile: null,
      affiliations: [],
      mediaMentions: [],
    };
  }

  const affiliations = await getScoutBotAffiliations(id);
  const mediaMentions = await getScoutBotMediaMentions(id);

  return {
    profile,
    affiliations,
    mediaMentions,
  };
};

/**
 * Get overview statistics
 */
export const getScoutBotStatistics = async (): Promise<{
  totalProfiles: number;
  pendingProfiles: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  profilesByType: Record<string, number>;
}> => {
  const [{ count: totalProfiles }] = await db
    .select({ count: count() })
    .from(scoutBotProfiles);

  const [{ count: pendingProfiles }] = await db
    .select({ count: count() })
    .from(scoutBotProfiles).$dynamic()
    .where(eq(scoutBotProfiles.status, "pending"));

  const [{ count: approvedProfiles }] = await db
    .select({ count: count() })
    .from(scoutBotProfiles).$dynamic()
    .where(eq(scoutBotProfiles.status, "approved"));

  const [{ count: rejectedProfiles }] = await db
    .select({ count: count() })
    .from(scoutBotProfiles).$dynamic()
    .where(eq(scoutBotProfiles.status, "rejected"));

  const typeStats = await db
    .select({
      type: scoutBotProfiles.type,
      count: count(),
    })
    .from(scoutBotProfiles)
    .groupBy(scoutBotProfiles.type);

  const profilesByType: Record<string, number> = {};
  typeStats.forEach((stat) => {
    profilesByType[stat.type] = Number(stat.count);
  });

  return {
    totalProfiles: Number(totalProfiles),
    pendingProfiles: Number(pendingProfiles),
    approvedProfiles: Number(approvedProfiles),
    rejectedProfiles: Number(rejectedProfiles),
    profilesByType,
  };
};
