// @ts-nocheck
import { db } from "./db";
import {
  scoutBotNetworkConnections,
  scoutBotInfluenceNetworks,
  scoutBotNetworkMembers,
  scoutBotInfluencePatterns,
  scoutBotTemporalInfluence,
  scoutBotProfiles,
  type InsertScoutBotNetworkConnection,
  type ScoutBotNetworkConnection,
  type InsertScoutBotInfluenceNetwork,
  type ScoutBotInfluenceNetwork,
  type InsertScoutBotNetworkMember,
  type ScoutBotNetworkMember,
  type InsertScoutBotInfluencePattern,
  type ScoutBotInfluencePattern,
  type InsertScoutBotTemporalInfluence,
  type ScoutBotTemporalInfluence
} from "../shared/schema-scout-bot-network";
import { 
  eq, 
  and, 
  or, 
  desc, 
  gte, 
  lte, 
  inArray,
  like, 
  sql 
} from "drizzle-orm";
import { getScoutBotProfileById } from "./storage-scout-bot";
import { createId } from "@paralleldrive/cuid2";

// Network Connections
export const addNetworkConnection = async (
  connection: InsertScoutBotNetworkConnection
): Promise<ScoutBotNetworkConnection> => {
  const createdConnection = {
    id: createId(),
    ...connection,
    created_at: new Date(),
    updated_at: new Date()
  };

  const [newConnection] = await db
    .insert(scoutBotNetworkConnections)
    .values(createdConnection)
    .returning();

  return newConnection;
};

export const getNetworkConnections = async (
  profileId: string,
  includeIncoming: boolean = false
): Promise<ScoutBotNetworkConnection[]> => {
  if (includeIncoming) {
    return db
      .select()
      .from(scoutBotNetworkConnections).$dynamic()
      .where(
        or(
          eq(scoutBotNetworkConnections.source_profile_id, profileId),
          eq(scoutBotNetworkConnections.target_profile_id, profileId)
        )
      )
      .orderBy(desc(scoutBotNetworkConnections.updated_at));
  }

  return db
    .select()
    .from(scoutBotNetworkConnections).$dynamic()
    .where(eq(scoutBotNetworkConnections.source_profile_id, profileId))
    .orderBy(desc(scoutBotNetworkConnections.updated_at));
};

export const updateNetworkConnection = async (
  id: string,
  data: Partial<InsertScoutBotNetworkConnection>
): Promise<ScoutBotNetworkConnection | undefined> => {
  const [updatedConnection] = await db
    .update(scoutBotNetworkConnections)
    .set({
      ...data,
      updated_at: new Date()
    })
    .where(eq(scoutBotNetworkConnections.id, id))
    .returning();

  return updatedConnection;
};

export const deleteNetworkConnection = async (id: string): Promise<boolean> => {
  const [deletedConnection] = await db
    .delete(scoutBotNetworkConnections)
    .where(eq(scoutBotNetworkConnections.id, id))
    .returning({ id: scoutBotNetworkConnections.id });

  return !!deletedConnection;
};

// Influence Networks
interface NetworksQueryParams {
  limit: number;
  offset: number;
  networkType?: string;
  minEntityCount?: number;
  verified?: number;
}

export const createInfluenceNetwork = async (
  network: InsertScoutBotInfluenceNetwork
): Promise<ScoutBotInfluenceNetwork> => {
  const createdNetwork = {
    id: createId(),
    ...network,
    entity_count: 0,
    first_detected: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  };

  const [newNetwork] = await db
    .insert(scoutBotInfluenceNetworks)
    .values(createdNetwork)
    .returning();

  return newNetwork;
};

export const getInfluenceNetworks = async ({
  limit = 20,
  offset = 0,
  networkType,
  minEntityCount,
  verified
}: NetworksQueryParams): Promise<ScoutBotInfluenceNetwork[]> => {
  let query = db.select().from(scoutBotInfluenceNetworks).$dynamic();

  if (networkType) {
    query = query.where(eq(scoutBotInfluenceNetworks.network_type, networkType));
  }

  if (minEntityCount !== undefined) {
    query = query.where(gte(scoutBotInfluenceNetworks.entity_count, minEntityCount));
  }

  if (verified !== undefined) {
    query = query.where(eq(scoutBotInfluenceNetworks.verified, verified));
  }

  return query
    .orderBy(desc(scoutBotInfluenceNetworks.updated_at))
    .limit(limit)
    .offset(offset);
};

export const getInfluenceNetwork = async (id: string): Promise<ScoutBotInfluenceNetwork | undefined> => {
  const [network] = await db
    .select()
    .from(scoutBotInfluenceNetworks).$dynamic()
    .where(eq(scoutBotInfluenceNetworks.id, id));

  return network;
};

export const updateInfluenceNetwork = async (
  id: string,
  data: Partial<InsertScoutBotInfluenceNetwork>
): Promise<ScoutBotInfluenceNetwork | undefined> => {
  const [updatedNetwork] = await db
    .update(scoutBotInfluenceNetworks)
    .set({
      ...data,
      updated_at: new Date()
    })
    .where(eq(scoutBotInfluenceNetworks.id, id))
    .returning();

  return updatedNetwork;
};

export const deleteInfluenceNetwork = async (id: string): Promise<boolean> => {
  // First, delete all network members
  await db
    .delete(scoutBotNetworkMembers)
    .where(eq(scoutBotNetworkMembers.network_id, id));

  // Then delete the network itself
  const [deletedNetwork] = await db
    .delete(scoutBotInfluenceNetworks)
    .where(eq(scoutBotInfluenceNetworks.id, id))
    .returning({ id: scoutBotInfluenceNetworks.id });

  return !!deletedNetwork;
};

// Network Members
export const addNetworkMember = async (
  member: InsertScoutBotNetworkMember
): Promise<ScoutBotNetworkMember> => {
  const createdMember = {
    id: createId(),
    ...member,
    created_at: new Date(),
    updated_at: new Date()
  };

  const [newMember] = await db
    .insert(scoutBotNetworkMembers)
    .values(createdMember)
    .returning();

  // Update entity count in the network
  await updateNetworkEntityCount(member.network_id);

  return newMember;
};

export const getNetworkMembers = async (networkId: string): Promise<ScoutBotNetworkMember[]> => {
  return db
    .select()
    .from(scoutBotNetworkMembers).$dynamic()
    .where(eq(scoutBotNetworkMembers.network_id, networkId))
    .orderBy(desc(scoutBotNetworkMembers.joined_date));
};

export const getProfileNetworks = async (
  profileId: string
): Promise<(ScoutBotNetworkMember & { network: ScoutBotInfluenceNetwork })[]> => {
  const result = await db
    .select({
      member: scoutBotNetworkMembers,
      network: scoutBotInfluenceNetworks
    })
    .from(scoutBotNetworkMembers)
    .innerJoin(
      scoutBotInfluenceNetworks,
      eq(scoutBotNetworkMembers.network_id, scoutBotInfluenceNetworks.id)
    )
    .where(eq(scoutBotNetworkMembers.profile_id, profileId))
    .orderBy(desc(scoutBotNetworkMembers.joined_date));

  return result.map(r => ({
    ...r.member,
    network: r.network
  }));
};

export const updateNetworkMember = async (
  networkId: string,
  data: InsertScoutBotNetworkMember
): Promise<ScoutBotNetworkMember> => {
  // Check if member already exists
  const existingMember = await db
    .select()
    .from(scoutBotNetworkMembers).$dynamic()
    .where(
      and(
        eq(scoutBotNetworkMembers.network_id, networkId),
        eq(scoutBotNetworkMembers.profile_id, data.profile_id)
      )
    )
    .limit(1);

  // If member exists, update it
  if (existingMember.length > 0) {
    const [updatedMember] = await db
      .update(scoutBotNetworkMembers)
      .set({
        role: data.role,
        role_description: data.role_description,
        joined_date: data.joined_date,
        influence_level: data.influence_level,
        updated_at: new Date()
      })
      .where(eq(scoutBotNetworkMembers.id, existingMember[0].id))
      .returning();

    return updatedMember;
  }

  // Otherwise, create a new member
  return addNetworkMember(data);
};

export const removeNetworkMember = async (memberId: string): Promise<boolean> => {
  const [memberToDelete] = await db
    .select({
      id: scoutBotNetworkMembers.id,
      networkId: scoutBotNetworkMembers.network_id
    })
    .from(scoutBotNetworkMembers).$dynamic()
    .where(eq(scoutBotNetworkMembers.id, memberId))
    .limit(1);

  if (!memberToDelete) {
    return false;
  }

  const [deletedMember] = await db
    .delete(scoutBotNetworkMembers)
    .where(eq(scoutBotNetworkMembers.id, memberId))
    .returning({ id: scoutBotNetworkMembers.id });

  if (memberToDelete.networkId) {
    // Update entity count in the network
    await updateNetworkEntityCount(memberToDelete.networkId);
  }

  return !!deletedMember;
};

// Influence Patterns
interface PatternsQueryParams {
  limit: number;
  offset: number;
  patternType?: string;
  minSeverity?: number;
  minConfidence?: number;
  verified?: number;
  profileId?: string;
}

export const createInfluencePattern = async (
  pattern: InsertScoutBotInfluencePattern
): Promise<ScoutBotInfluencePattern> => {
  const createdPattern = {
    id: createId(),
    ...pattern,
    first_detected: new Date(),
    last_detected: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  };

  const [newPattern] = await db
    .insert(scoutBotInfluencePatterns)
    .values(createdPattern)
    .returning();

  return newPattern;
};

export const getInfluencePatterns = async ({
  limit = 20,
  offset = 0,
  patternType,
  minSeverity,
  minConfidence,
  verified,
  profileId
}: PatternsQueryParams): Promise<ScoutBotInfluencePattern[]> => {
  let query = db.select().from(scoutBotInfluencePatterns).$dynamic();

  if (patternType) {
    query = query.where(eq(scoutBotInfluencePatterns.pattern_type, patternType));
  }

  if (minSeverity !== undefined) {
    query = query.where(gte(scoutBotInfluencePatterns.severity, minSeverity));
  }

  if (minConfidence !== undefined) {
    query = query.where(gte(scoutBotInfluencePatterns.confidence, minConfidence));
  }

  if (verified !== undefined) {
    query = query.where(eq(scoutBotInfluencePatterns.verified, verified));
  }

  if (profileId) {
    query = query.where(
      or(
        like(scoutBotInfluencePatterns.involved_profiles, `%${profileId}%`),
        like(scoutBotInfluencePatterns.primary_entities, `%${profileId}%`)
      )
    );
  }

  return query
    .orderBy([
      { column: scoutBotInfluencePatterns.severity, order: 'desc' },
      { column: scoutBotInfluencePatterns.confidence, order: 'desc' }
    ])
    .limit(limit)
    .offset(offset);
};

export const getInfluencePatternsInvolvingProfile = async (
  profileId: string
): Promise<ScoutBotInfluencePattern[]> => {
  return db
    .select()
    .from(scoutBotInfluencePatterns).$dynamic()
    .where(
      or(
        like(scoutBotInfluencePatterns.involved_profiles, `%${profileId}%`),
        like(scoutBotInfluencePatterns.primary_entities, `%${profileId}%`)
      )
    )
    .orderBy([
      { column: scoutBotInfluencePatterns.severity, order: 'desc' },
      { column: scoutBotInfluencePatterns.last_detected, order: 'desc' }
    ]);
};

export const getInfluencePattern = async (id: string): Promise<ScoutBotInfluencePattern | undefined> => {
  const [pattern] = await db
    .select()
    .from(scoutBotInfluencePatterns).$dynamic()
    .where(eq(scoutBotInfluencePatterns.id, id));

  return pattern;
};

export const updateInfluencePattern = async (
  id: string,
  data: Partial<InsertScoutBotInfluencePattern>
): Promise<ScoutBotInfluencePattern | undefined> => {
  const [updatedPattern] = await db
    .update(scoutBotInfluencePatterns)
    .set({
      ...data,
      updated_at: new Date(),
      last_detected: new Date()
    })
    .where(eq(scoutBotInfluencePatterns.id, id))
    .returning();

  return updatedPattern;
};

export const deleteInfluencePattern = async (id: string): Promise<boolean> => {
  const [deletedPattern] = await db
    .delete(scoutBotInfluencePatterns)
    .where(eq(scoutBotInfluencePatterns.id, id))
    .returning({ id: scoutBotInfluencePatterns.id });

  return !!deletedPattern;
};

// Temporal Influence
interface TemporalInfluenceQueryParams {
  startPeriod?: string;
  endPeriod?: string;
  limit?: number;
}

export const getTemporalInfluence = async (
  profileId: string,
  { startPeriod, endPeriod, limit = 8 }: TemporalInfluenceQueryParams
): Promise<ScoutBotTemporalInfluence[]> => {
  let query = db.select().from(scoutBotTemporalInfluence).$dynamic()
    .where(eq(scoutBotTemporalInfluence.profile_id, profileId));

  if (startPeriod) {
    const startDate = getTimePeriodStartDate(startPeriod);
    if (startDate) {
      query = query.where(gte(scoutBotTemporalInfluence.time_period_start, startDate));
    }
  }

  if (endPeriod) {
    const endDate = getTimePeriodEndDate(endPeriod);
    if (endDate) {
      query = query.where(lte(scoutBotTemporalInfluence.time_period_end, endDate));
    }
  }

  return query
    .orderBy(desc(scoutBotTemporalInfluence.time_period_start))
    .limit(limit);
};

export const generateTemporalInfluenceData = async (
  profileId: string,
  timePeriod: string
): Promise<ScoutBotTemporalInfluence | undefined> => {
  // Check if profile exists
  const profile = await getScoutBotProfileById(profileId);
  if (!profile) {
    return undefined;
  }

  // Get time period dates
  const startDate = getTimePeriodStartDate(timePeriod);
  const endDate = getTimePeriodEndDate(timePeriod);
  if (!startDate || !endDate) {
    return undefined;
  }

  // Check if this time period already exists
  const existingRecords = await db
    .select()
    .from(scoutBotTemporalInfluence).$dynamic()
    .where(
      and(
        eq(scoutBotTemporalInfluence.profile_id, profileId),
        eq(scoutBotTemporalInfluence.time_period, timePeriod)
      )
    );

  if (existingRecords.length > 0) {
    return existingRecords[0];
  }

  // Create new temporal influence record with some sample data
  // In a real implementation, this would analyze various data sources
  const temporalData = {
    id: createId(),
    profile_id: profileId,
    time_period: timePeriod,
    time_period_start: startDate,
    time_period_end: endDate,
    influence_score: Math.floor(Math.random() * 100),
    connections_count: Math.floor(Math.random() * 50),
    financial_activities: Math.floor(Math.random() * 20),
    legislative_actions: Math.floor(Math.random() * 10),
    public_statements: Math.floor(Math.random() * 15),
    key_relationships: [
      { id: createId(), name: "Example Person 1", role: "Donor" },
      { id: createId(), name: "Example Organization", role: "Employer" }
    ],
    notable_events: "Sample notable events during this time period",
    influence_change_factors: "Sample influence change factors",
    created_at: new Date(),
    updated_at: new Date()
  };

  const [newRecord] = await db
    .insert(scoutBotTemporalInfluence)
    .values(temporalData)
    .returning();

  return newRecord;
};

export const deleteTemporalInfluenceRecord = async (id: string): Promise<boolean> => {
  const [deletedRecord] = await db
    .delete(scoutBotTemporalInfluence)
    .where(eq(scoutBotTemporalInfluence.id, id))
    .returning({ id: scoutBotTemporalInfluence.id });

  return !!deletedRecord;
};

// Network Analysis
export const analyzeEntityRelationshipsForNetworks = async (
  profileId: string
): Promise<{ networks_created: number; patterns_detected: number }> => {
  // This is a placeholder for what would be a more complex analysis in a real implementation
  // It would analyze various data sources and create networks and patterns based on detected relationships
  let networksCreated = 0;
  let patternsDetected = 0;

  // Create a sample influence network
  const networkName = `${profileId.substring(0, 8)}-network-${Date.now()}`;
  const network = await createInfluenceNetwork({
    name: `Network for ${profileId}`,
    description: `Automatically generated network centered around profile ${profileId}`,
    network_type: "mixed",
    central_entities: [
      { id: profileId, name: "Central Entity", role: "Primary" }
    ],
    source_data: {
      data_sources: ["campaign_finance", "voting_records", "affiliations"],
      analysis_timestamp: new Date().toISOString()
    },
    confidence: 80,
    verified: 0
  });

  if (network) {
    networksCreated++;
    
    // Add the profile as a network member
    await addNetworkMember({
      network_id: network.id,
      profile_id: profileId,
      role: "central",
      role_description: "Network center",
      joined_date: new Date(),
      influence_level: 10
    });

    // Create a sample influence pattern
    const pattern = await createInfluencePattern({
      name: `Pattern for ${profileId}`,
      description: `Automatically detected influence pattern involving ${profileId}`,
      pattern_type: "circular_funding",
      primary_entities: [
        { id: profileId, name: "Primary Entity", role: "Initiator" }
      ],
      involved_profiles: JSON.stringify([profileId]),
      detected_data: {
        detection_method: "automated_analysis",
        confidence_factors: ["repeated_transactions", "timing_correlation"],
        detection_timestamp: new Date().toISOString()
      },
      severity: 7,
      confidence: 75,
      verified: 0,
      verification_notes: "Auto-generated pattern, needs verification"
    });

    if (pattern) {
      patternsDetected++;
    }
  }

  return {
    networks_created: networksCreated,
    patterns_detected: patternsDetected
  };
};

// Helper Functions
function mapRelationshipToStrength(relationshipType: string): 'weak' | 'moderate' | 'strong' | 'very_strong' {
  // Map different relationship types to strength values
  switch (relationshipType.toLowerCase()) {
    case 'family_member':
    case 'partner':
    case 'spouse':
      return 'very_strong';
    case 'close_associate':
    case 'business_partner':
    case 'major_donor':
    case 'employer':
      return 'strong';
    case 'colleague':
    case 'donor':
    case 'client':
      return 'moderate';
    default:
      return 'weak';
  }
}

async function updateNetworkEntityCount(networkId: string): Promise<void> {
  const members = await db
    .select({ count: sql<number>`count(*)` })
    .from(scoutBotNetworkMembers).$dynamic()
    .where(eq(scoutBotNetworkMembers.network_id, networkId));

  if (members.length > 0) {
    const entityCount = members[0].count;
    await db
      .update(scoutBotInfluenceNetworks)
      .set({ entity_count: entityCount, updated_at: new Date() })
      .where(eq(scoutBotInfluenceNetworks.id, networkId));
  }
}

function getTimePeriodStartDate(timePeriod: string): Date | null {
  // Parse time periods in formats like "2023Q1", "2022H2", "2021"
  if (/^\d{4}Q[1-4]$/.test(timePeriod)) {
    // Quarterly period (e.g., 2023Q1)
    const year = parseInt(timePeriod.substring(0, 4));
    const quarter = parseInt(timePeriod.substring(5, 6));
    const month = (quarter - 1) * 3;
    return new Date(year, month, 1);
  } else if (/^\d{4}H[1-2]$/.test(timePeriod)) {
    // Half-year period (e.g., 2023H1)
    const year = parseInt(timePeriod.substring(0, 4));
    const half = parseInt(timePeriod.substring(5, 6));
    const month = (half - 1) * 6;
    return new Date(year, month, 1);
  } else if (/^\d{4}$/.test(timePeriod)) {
    // Yearly period (e.g., 2023)
    const year = parseInt(timePeriod);
    return new Date(year, 0, 1);
  }
  return null;
}

function getTimePeriodEndDate(timePeriod: string): Date | null {
  // Parse time periods in formats like "2023Q1", "2022H2", "2021"
  if (/^\d{4}Q[1-4]$/.test(timePeriod)) {
    // Quarterly period (e.g., 2023Q1)
    const year = parseInt(timePeriod.substring(0, 4));
    const quarter = parseInt(timePeriod.substring(5, 6));
    const month = quarter * 3;
    return new Date(year, month, 0); // Last day of previous month
  } else if (/^\d{4}H[1-2]$/.test(timePeriod)) {
    // Half-year period (e.g., 2023H1)
    const year = parseInt(timePeriod.substring(0, 4));
    const half = parseInt(timePeriod.substring(5, 6));
    const month = half * 6;
    return new Date(year, month, 0); // Last day of previous month
  } else if (/^\d{4}$/.test(timePeriod)) {
    // Yearly period (e.g., 2023)
    const year = parseInt(timePeriod);
    return new Date(year, 11, 31);
  }
  return null;
}