// @ts-nocheck
import { and, count, desc, eq, gt, inArray, like, sql } from "drizzle-orm";
import { db } from "./db";
import {
  InsertScoutBotCampaignFinance,
  InsertScoutBotEntityRelationship,
  InsertScoutBotFamilyAppointment,
  InsertScoutBotFilingCorrection,
  InsertScoutBotFirmRegistration,
  InsertScoutBotFlag,
  InsertScoutBotLegislativeAppearance,
  InsertScoutBotLobbyistReport,
  InsertScoutBotPacLeadership,
  ScoutBotCampaignFinance,
  ScoutBotEntityRelationship,
  ScoutBotFamilyAppointment,
  ScoutBotFilingCorrection,
  ScoutBotFirmRegistration,
  ScoutBotFlag,
  ScoutBotLegislativeAppearance,
  ScoutBotLobbyistReport,
  ScoutBotPacLeadership,
  scoutBotCampaignFinance,
  scoutBotEntityRelationships,
  scoutBotFamilyAppointments,
  scoutBotFilingCorrections,
  scoutBotFirmRegistrations,
  scoutBotFlags,
  scoutBotLegislativeAppearances,
  scoutBotLobbyistReports,
  scoutBotPacLeadership,
} from "../shared/schema-scout-bot-extended";
import { scoutBotProfiles } from "../shared/schema-scout-bot";
import { createLogger } from "./logger";
const log = createLogger("storage-scout-bot-extended");


/**
 * Extended Scout Bot Profile Management
 */

// Update the profile with transparency-related metrics
export const updateProfileTransparencyMetrics = async (
  profileId: string,
  transparencyScore?: number | null,
  flagCount?: number | null,
  datasetsFoundIn?: string[]
): Promise<boolean> => {
  try {
    const updates: any = {
      updated_at: new Date(),
    };
    
    if (transparencyScore !== undefined) {
      updates.transparency_score = transparencyScore;
    }
    
    if (flagCount !== undefined) {
      updates.flag_count = flagCount;
    }
    
    if (datasetsFoundIn && datasetsFoundIn.length > 0) {
      updates.datasets_found_in = datasetsFoundIn;
    }
    
    const [updated] = await db
      .update(scoutBotProfiles)
      .set(updates)
      .where(eq(scoutBotProfiles.id, profileId))
      .returning({ id: scoutBotProfiles.id });
      
    return !!updated;
  } catch (error: any) {
    log.error({ err: error }, "Error updating profile transparency metrics");
    return false;
  }
};

/**
 * Lobbyist Report Management
 */
export const addLobbyistReport = async (
  report: InsertScoutBotLobbyistReport
): Promise<ScoutBotLobbyistReport> => {
  const [createdReport] = await db
    .insert(scoutBotLobbyistReports)
    .values(report)
    .returning();
  
  // Update the profile's datasets
  await updateProfileDatasets(report.profile_id, "lobbyist_report");
  
  return createdReport;
};

export const getLobbyistReports = async (
  profileId: string
): Promise<ScoutBotLobbyistReport[]> => {
  return db
    .select()
    .from(scoutBotLobbyistReports).$dynamic()
    .where(eq(scoutBotLobbyistReports.profile_id, profileId))
    .orderBy(desc(scoutBotLobbyistReports.filing_date));
};

export const deleteLobbyistReport = async (
  id: string
): Promise<boolean> => {
  const [deleted] = await db
    .delete(scoutBotLobbyistReports)
    .where(eq(scoutBotLobbyistReports.id, id))
    .returning({ id: scoutBotLobbyistReports.id });
  
  return !!deleted;
};

/**
 * Campaign Finance Management
 */
export const addCampaignFinance = async (
  finance: InsertScoutBotCampaignFinance
): Promise<ScoutBotCampaignFinance> => {
  const [createdFinance] = await db
    .insert(scoutBotCampaignFinance)
    .values(finance)
    .returning();
  
  // Update the profile's datasets
  await updateProfileDatasets(finance.profile_id, "campaign_finance");
  
  return createdFinance;
};

export const getCampaignFinances = async (
  profileId: string
): Promise<ScoutBotCampaignFinance[]> => {
  return db
    .select()
    .from(scoutBotCampaignFinance).$dynamic()
    .where(eq(scoutBotCampaignFinance.profile_id, profileId))
    .orderBy(desc(scoutBotCampaignFinance.filing_date));
};

export const deleteCampaignFinance = async (
  id: string
): Promise<boolean> => {
  const [deleted] = await db
    .delete(scoutBotCampaignFinance)
    .where(eq(scoutBotCampaignFinance.id, id))
    .returning({ id: scoutBotCampaignFinance.id });
  
  return !!deleted;
};

/**
 * Filing Corrections Management
 */
export const addFilingCorrection = async (
  correction: InsertScoutBotFilingCorrection
): Promise<ScoutBotFilingCorrection> => {
  const [createdCorrection] = await db
    .insert(scoutBotFilingCorrections)
    .values(correction)
    .returning();
  
  // Update the profile's datasets and add a flag
  await updateProfileDatasets(correction.profile_id, "filing_correction");
  await createFlag({
    profile_id: correction.profile_id,
    flag_type: "correction",
    description: `Late/corrected filing: ${correction.filing_type}`,
    severity: correction.days_late && correction.days_late > 30 ? 4 : 2,
    source_dataset: "filing_correction",
    confidence_score: 85,
    related_entities: []
  });
  
  return createdCorrection;
};

export const getFilingCorrections = async (
  profileId: string
): Promise<ScoutBotFilingCorrection[]> => {
  return db
    .select()
    .from(scoutBotFilingCorrections).$dynamic()
    .where(eq(scoutBotFilingCorrections.profile_id, profileId))
    .orderBy(desc(scoutBotFilingCorrections.correction_date));
};

export const deleteFilingCorrection = async (
  id: string
): Promise<boolean> => {
  const [deleted] = await db
    .delete(scoutBotFilingCorrections)
    .where(eq(scoutBotFilingCorrections.id, id))
    .returning({ id: scoutBotFilingCorrections.id });
  
  return !!deleted;
};

/**
 * Firm Registration Management
 */
export const addFirmRegistration = async (
  registration: InsertScoutBotFirmRegistration
): Promise<ScoutBotFirmRegistration> => {
  const [createdRegistration] = await db
    .insert(scoutBotFirmRegistrations)
    .values(registration)
    .returning();
  
  // Update the profile's datasets
  await updateProfileDatasets(registration.profile_id, "firm_registration");
  
  return createdRegistration;
};

export const getFirmRegistrations = async (
  profileId: string
): Promise<ScoutBotFirmRegistration[]> => {
  return db
    .select()
    .from(scoutBotFirmRegistrations).$dynamic()
    .where(eq(scoutBotFirmRegistrations.profile_id, profileId))
    .orderBy(desc(scoutBotFirmRegistrations.registration_date));
};

export const deleteFirmRegistration = async (
  id: string
): Promise<boolean> => {
  const [deleted] = await db
    .delete(scoutBotFirmRegistrations)
    .where(eq(scoutBotFirmRegistrations.id, id))
    .returning({ id: scoutBotFirmRegistrations.id });
  
  return !!deleted;
};

/**
 * Family Appointments Management
 */
export const addFamilyAppointment = async (
  appointment: InsertScoutBotFamilyAppointment
): Promise<ScoutBotFamilyAppointment> => {
  const [createdAppointment] = await db
    .insert(scoutBotFamilyAppointments)
    .values(appointment)
    .returning();
  
  // Update the profile's datasets and add a flag
  await updateProfileDatasets(appointment.profile_id, "family_appointment");
  await createFlag({
    profile_id: appointment.profile_id,
    flag_type: "family_connection",
    description: `Family member ${appointment.related_name} appointed to ${appointment.appointed_position}`,
    severity: 3,
    source_dataset: "family_appointment",
    confidence_score: 75,
    related_entities: [{
      id: "",
      name: appointment.related_name,
      type: "family_member"
    }]
  });
  
  return createdAppointment;
};

export const getFamilyAppointments = async (
  profileId: string
): Promise<ScoutBotFamilyAppointment[]> => {
  return db
    .select()
    .from(scoutBotFamilyAppointments).$dynamic()
    .where(eq(scoutBotFamilyAppointments.profile_id, profileId))
    .orderBy(desc(scoutBotFamilyAppointments.appointment_date));
};

export const deleteFamilyAppointment = async (
  id: string
): Promise<boolean> => {
  const [deleted] = await db
    .delete(scoutBotFamilyAppointments)
    .where(eq(scoutBotFamilyAppointments.id, id))
    .returning({ id: scoutBotFamilyAppointments.id });
  
  return !!deleted;
};

/**
 * PAC Leadership Management
 */
export const addPacLeadership = async (
  pacLeadership: InsertScoutBotPacLeadership
): Promise<ScoutBotPacLeadership> => {
  const [createdPacLeadership] = await db
    .insert(scoutBotPacLeadership)
    .values(pacLeadership)
    .returning();
  
  // Update the profile's datasets
  await updateProfileDatasets(pacLeadership.profile_id, "pac_leadership");
  
  return createdPacLeadership;
};

export const getPacLeaderships = async (
  profileId: string
): Promise<ScoutBotPacLeadership[]> => {
  return db
    .select()
    .from(scoutBotPacLeadership).$dynamic()
    .where(eq(scoutBotPacLeadership.profile_id, profileId))
    .orderBy(desc(scoutBotPacLeadership.appointment_date));
};

export const deletePacLeadership = async (
  id: string
): Promise<boolean> => {
  const [deleted] = await db
    .delete(scoutBotPacLeadership)
    .where(eq(scoutBotPacLeadership.id, id))
    .returning({ id: scoutBotPacLeadership.id });
  
  return !!deleted;
};

/**
 * Legislative Appearances Management
 */
export const addLegislativeAppearance = async (
  appearance: InsertScoutBotLegislativeAppearance
): Promise<ScoutBotLegislativeAppearance> => {
  const [createdAppearance] = await db
    .insert(scoutBotLegislativeAppearances)
    .values(appearance)
    .returning();
  
  // Update the profile's datasets
  await updateProfileDatasets(appearance.profile_id, "legislative_calendar");
  
  return createdAppearance;
};

export const getLegislativeAppearances = async (
  profileId: string
): Promise<ScoutBotLegislativeAppearance[]> => {
  return db
    .select()
    .from(scoutBotLegislativeAppearances).$dynamic()
    .where(eq(scoutBotLegislativeAppearances.profile_id, profileId))
    .orderBy(desc(scoutBotLegislativeAppearances.appearance_date));
};

export const deleteLegislativeAppearance = async (
  id: string
): Promise<boolean> => {
  const [deleted] = await db
    .delete(scoutBotLegislativeAppearances)
    .where(eq(scoutBotLegislativeAppearances.id, id))
    .returning({ id: scoutBotLegislativeAppearances.id });
  
  return !!deleted;
};

/**
 * Entity Relationships Management
 */
export const addEntityRelationship = async (
  relationship: InsertScoutBotEntityRelationship
): Promise<ScoutBotEntityRelationship> => {
  const [createdRelationship] = await db
    .insert(scoutBotEntityRelationships)
    .values(relationship)
    .returning();
  
  // Update the profile's related entities count
  await updateRelatedEntitiesCount(relationship.source_profile_id);
  
  // If this is a cross-dataset relationship, potentially flag it
  if (relationship.target_entity_id) {
    // Check for PAC/Firm connection
    const [isPacLeader] = await db
      .select({ count: count() })
      .from(scoutBotPacLeadership).$dynamic()
      .where(eq(scoutBotPacLeadership.profile_id, relationship.source_profile_id));
      
    const [hasFirmRegistration] = await db
      .select({ count: count() })
      .from(scoutBotFirmRegistrations).$dynamic()
      .where(eq(scoutBotFirmRegistrations.profile_id, relationship.target_entity_id));
    
    if (Number(isPacLeader.count) > 0 && Number(hasFirmRegistration.count) > 0) {
      await createFlag({
        profile_id: relationship.source_profile_id,
        flag_type: "pac_firm_connection",
        description: `Entity has connections to both PACs and consulting firms`,
        severity: 4,
        source_dataset: relationship.source_dataset,
        confidence_score: 80,
        related_entities: [{
          id: relationship.target_entity_id,
          name: relationship.target_entity_name,
          type: "firm"
        }]
      });
    }
  }
  
  return createdRelationship;
};

export const getEntityRelationships = async (
  profileId: string,
  includeTargeted = false
): Promise<ScoutBotEntityRelationship[]> => {
  if (includeTargeted) {
    return db
      .select()
      .from(scoutBotEntityRelationships).$dynamic()
      .where(
        or(
          eq(scoutBotEntityRelationships.source_profile_id, profileId),
          eq(scoutBotEntityRelationships.target_entity_id, profileId)
        )
      )
      .orderBy({ updated_at: 'desc' });
  }
  
  return db
    .select()
    .from(scoutBotEntityRelationships).$dynamic()
    .where(eq(scoutBotEntityRelationships.source_profile_id, profileId))
    .orderBy({ updated_at: 'desc' });
};

export const deleteEntityRelationship = async (
  id: string
): Promise<boolean> => {
  // Get the source profile ID before deleting
  const [relationship] = await db
    .select({ sourceId: scoutBotEntityRelationships.source_profile_id })
    .from(scoutBotEntityRelationships).$dynamic()
    .where(eq(scoutBotEntityRelationships.id, id));
  
  if (!relationship) {
    return false;
  }
  
  const sourceId = relationship.sourceId;
  
  // Delete the relationship
  const [deleted] = await db
    .delete(scoutBotEntityRelationships)
    .where(eq(scoutBotEntityRelationships.id, id))
    .returning({ id: scoutBotEntityRelationships.id });
  
  if (deleted) {
    // Update related entities count
    await updateRelatedEntitiesCount(sourceId);
    return true;
  }
  
  return false;
};

/**
 * Flag Management
 */
export const createFlag = async (
  flag: InsertScoutBotFlag
): Promise<ScoutBotFlag> => {
  const [createdFlag] = await db
    .insert(scoutBotFlags)
    .values(flag)
    .returning();
  
  // Update the profile's flag count
  await updateFlagCount(flag.profile_id);
  
  return createdFlag;
};

export const getFlags = async (
  profileId: string
): Promise<ScoutBotFlag[]> => {
  return db
    .select()
    .from(scoutBotFlags).$dynamic()
    .where(eq(scoutBotFlags.profile_id, profileId))
    .orderBy([
      { column: scoutBotFlags.severity, order: 'desc' },
      { column: scoutBotFlags.detection_date, order: 'desc' }
    ]);
};

export const updateFlag = async (
  id: string,
  data: Partial<InsertScoutBotFlag>
): Promise<ScoutBotFlag | null> => {
  const updates = {
    ...data,
    updated_at: new Date()
  };
  
  const [updatedFlag] = await db
    .update(scoutBotFlags)
    .set(updates)
    .where(eq(scoutBotFlags.id, id))
    .returning();
  
  return updatedFlag || null;
};

export const deleteFlag = async (
  id: string
): Promise<boolean> => {
  // Get the profile ID before deleting
  const [flag] = await db
    .select({ profileId: scoutBotFlags.profile_id })
    .from(scoutBotFlags).$dynamic()
    .where(eq(scoutBotFlags.id, id));
  
  if (!flag) {
    return false;
  }
  
  const profileId = flag.profileId;
  
  // Delete the flag
  const [deleted] = await db
    .delete(scoutBotFlags)
    .where(eq(scoutBotFlags.id, id))
    .returning({ id: scoutBotFlags.id });
  
  if (deleted) {
    // Update flag count
    await updateFlagCount(profileId);
    return true;
  }
  
  return false;
};

/**
 * Profile Crawl Trigger Detection
 * This function checks if a profile meets any of the crawl trigger conditions
 */
export const checkCrawlTriggers = async (
  profileId: string
): Promise<{
  shouldCrawl: boolean;
  triggers: string[];
}> => {
  const triggers: string[] = [];
  
  // Trigger 1: Check if present in multiple datasets
  const [profile] = await db
    .select({ datasetsFoundIn: scoutBotProfiles.datasets_found_in })
    .from(scoutBotProfiles).$dynamic()
    .where(eq(scoutBotProfiles.id, profileId));
  
  if (profile?.datasetsFoundIn && (profile.datasetsFoundIn as string[]).length >= 2) {
    triggers.push('multi_dataset_match');
  }
  
  // Trigger 2: Check for late/corrected filings
  const [filingCorrections] = await db
    .select({ count: count() })
    .from(scoutBotFilingCorrections).$dynamic()
    .where(eq(scoutBotFilingCorrections.profile_id, profileId));
  
  if (Number(filingCorrections.count) > 0) {
    triggers.push('late_filing_detected');
  }
  
  // Trigger 3: Check for consultant linked to both PAC + firm
  const [pacConnections] = await db
    .select({ count: count() })
    .from(scoutBotPacLeadership).$dynamic()
    .where(eq(scoutBotPacLeadership.profile_id, profileId));
  
  const [firmConnections] = await db
    .select({ count: count() })
    .from(scoutBotFirmRegistrations).$dynamic()
    .where(eq(scoutBotFirmRegistrations.profile_id, profileId));
  
  if (Number(pacConnections.count) > 0 && Number(firmConnections.count) > 0) {
    triggers.push('pac_firm_connection');
  }
  
  // Trigger 4: Check for family member connections
  const [familyConnections] = await db
    .select({ count: count() })
    .from(scoutBotFamilyAppointments).$dynamic()
    .where(eq(scoutBotFamilyAppointments.profile_id, profileId));
  
  if (Number(familyConnections.count) > 0) {
    triggers.push('family_connection');
  }
  
  return {
    shouldCrawl: triggers.length > 0,
    triggers
  };
};

/**
 * Utility function to update profile's datasets found in
 */
const updateProfileDatasets = async (
  profileId: string,
  newDataset: string
): Promise<void> => {
  // Get current datasets
  const [profile] = await db
    .select({ datasetsFoundIn: scoutBotProfiles.datasets_found_in })
    .from(scoutBotProfiles).$dynamic()
    .where(eq(scoutBotProfiles.id, profileId));
  
  if (!profile) return;
  
  // Add the new dataset if it doesn't exist
  let datasets = profile.datasetsFoundIn as string[] || [];
  if (!datasets.includes(newDataset)) {
    datasets.push(newDataset);
    
    // Update the profile
    await db
      .update(scoutBotProfiles)
      .set({ 
        datasets_found_in: datasets,
        updated_at: new Date(),
        last_crawler_run: new Date()
      })
      .where(eq(scoutBotProfiles.id, profileId));
    
    // If now in multiple datasets, create a flag
    if (datasets.length >= 2) {
      await createFlag({
        profile_id: profileId,
        flag_type: "multi_dataset_match",
        description: `Entity found in multiple datasets: ${datasets.join(", ")}`,
        severity: datasets.length >= 3 ? 3 : 2,
        source_dataset: newDataset as any,
        confidence_score: 75,
        related_entities: []
      });
    }
  }
};

/**
 * Utility function to update profile's flag count
 */
const updateFlagCount = async (
  profileId: string
): Promise<void> => {
  // Count flags
  const [flagCount] = await db
    .select({ count: count() })
    .from(scoutBotFlags).$dynamic()
    .where(eq(scoutBotFlags.profile_id, profileId));
  
  // Update the profile
  await db
    .update(scoutBotProfiles)
    .set({ 
      flag_count: Number(flagCount.count),
      updated_at: new Date()
    })
    .where(eq(scoutBotProfiles.id, profileId));
};

/**
 * Utility function to update profile's related entities count
 */
const updateRelatedEntitiesCount = async (
  profileId: string
): Promise<void> => {
  // Count relationships where this profile is the source
  const [sourceCount] = await db
    .select({ count: count() })
    .from(scoutBotEntityRelationships).$dynamic()
    .where(eq(scoutBotEntityRelationships.source_profile_id, profileId));
  
  // Count relationships where this profile is the target
  const [targetCount] = await db
    .select({ count: count() })
    .from(scoutBotEntityRelationships).$dynamic()
    .where(
      and(
        eq(scoutBotEntityRelationships.target_entity_id, profileId),
        sql`${scoutBotEntityRelationships.target_entity_id} IS NOT NULL`
      )
    );
  
  const totalCount = Number(sourceCount.count) + Number(targetCount.count);
  
  // Update the profile
  await db
    .update(scoutBotProfiles)
    .set({ 
      related_entities_count: totalCount,
      updated_at: new Date()
    })
    .where(eq(scoutBotProfiles.id, profileId));
};

/**
 * Get complete profile with all extended data
 */
export const getCompleteExtendedProfile = async (
  id: string
): Promise<any> => {
  // Get the basic profile info
  const profile = await db
    .select()
    .from(scoutBotProfiles).$dynamic()
    .where(eq(scoutBotProfiles.id, id))
    .then(profiles => profiles[0] || null);
  
  if (!profile) {
    return { profile: null };
  }
  
  // Get all related data
  const [
    lobbyistReports,
    campaignFinances,
    filingCorrections,
    firmRegistrations,
    familyAppointments,
    pacLeaderships,
    legislativeAppearances,
    entityRelationships,
    flags
  ] = await Promise.all([
    getLobbyistReports(id),
    getCampaignFinances(id),
    getFilingCorrections(id),
    getFirmRegistrations(id),
    getFamilyAppointments(id),
    getPacLeaderships(id),
    getLegislativeAppearances(id),
    getEntityRelationships(id, true),
    getFlags(id)
  ]);
  
  return {
    profile,
    lobbyistReports,
    campaignFinances,
    filingCorrections,
    firmRegistrations,
    familyAppointments,
    pacLeaderships,
    legislativeAppearances,
    entityRelationships,
    flags
  };
};

// Helper function for 'OR' condition
export function or(...conditions: any[]) {
  return sql`(${sql.join(conditions, sql` OR `)})`;
}