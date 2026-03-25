// @ts-nocheck
import { Request, Response, Express } from "express";
import { v4 as uuidv4 } from "uuid";
import { CustomRequest } from "./types";
import { isAuthenticated } from "./auth";
import { db } from "./db";
import * as scoutBotStorage from "./storage-scout-bot";
import * as extendedScoutBotStorage from "./storage-scout-bot-extended";

/**
 * Character Profile type based on schema data
 */
export type CharacterProfile = {
  id: string;
  name: string;
  type: "consultant" | "influencer" | "strategist" | "corporate";
  photo_url?: string;
  known_aliases?: string[];
  associated_firms?: {
    name: string;
    role: string;
    years_active: string;
  }[];
  known_clients_or_affiliations?: {
    entity_name: string;
    type: string;
    timeframe: string;
    notes?: string;
  }[];
  donations?: {
    total_amount: number;
    top_recipients: {
      legislator_name: string;
      amount: number;
      date: string;
      district: string;
    }[];
  };
  influence_map?: {
    key_issues: string[];
    committee_targets: string[];
    linked_legislation: {
      bill_id: string;
      bill_title: string;
      action: "support" | "oppose" | "neutral";
      year: number;
    }[];
  };
  public_statements_or_quotes?: {
    source: string;
    quote: string;
    date: string;
  }[];
  media_mentions?: {
    source: string;
    headline: string;
    date: string;
    url: string;
  }[];
  transparency_score?: number;
  flag_count?: number;
  last_updated: string;
};

/**
 * Flag type for ethics and transparency flags
 */
export type Flag = {
  id: string;
  type: string;
  description: string;
  severity: number;
  date: string;
  status: "active" | "reviewed" | "resolved";
};

/**
 * Create a character profile from a scout bot profile and its related data
 */
async function createCharacterProfileFromScoutBotProfile(profileId: string): Promise<CharacterProfile | null> {
  try {
    // Get the complete profile data from Scout Bot storage
    const profileData = await extendedScoutBotStorage.getCompleteExtendedProfile(profileId);
    
    if (!profileData) {
      return null;
    }
    
    // Get profile affiliations
    const affiliations = await scoutBotStorage.getProfileAffiliations(profileId);
    
    // Get profile media mentions
    const mediaMentions = await scoutBotStorage.getProfileMediaMentions(profileId);
    
    // Build the character profile object
    const characterProfile: CharacterProfile = {
      id: profileData.id,
      name: profileData.name,
      type: profileData.type as any,
      // Use the first source URL as photo URL if available
      photo_url: profileData.source_urls[0]?.includes('jpg') || profileData.source_urls[0]?.includes('png') 
        ? profileData.source_urls[0]
        : undefined,
      known_aliases: [], // To be filled from relationships
      transparency_score: profileData.transparency_score || 50,
      flag_count: profileData.flag_count || 0,
      last_updated: profileData.updated_at.toISOString(),
      
      // Map affiliations to associated firms
      associated_firms: affiliations?.map((affiliation: any) => ({
        name: affiliation.organization,
        role: affiliation.role,
        years_active: affiliation.dates || "Unknown"
      })),
      
      // Map media mentions
      media_mentions: mediaMentions?.map((mention: any) => ({
        source: mention.source,
        headline: mention.headline,
        date: mention.date,
        url: mention.url
      })),
      
      // Initialize empty relationships that will be populated from extended data
      known_clients_or_affiliations: [],
      influence_map: {
        key_issues: profileData.influence_topics as string[] || [],
        committee_targets: [],
        linked_legislation: []
      },
      public_statements_or_quotes: []
    };
    
    // Add entity relationships as clients/affiliations
    if (profileData.entity_relationships && profileData.entity_relationships.length > 0) {
      characterProfile.known_clients_or_affiliations = profileData.entity_relationships
        .filter((rel: any) => rel.relationship_type === 'client' || rel.relationship_type === 'employer')
        .map((rel: any) => ({
          entity_name: rel.target_entity_name,
          type: rel.relationship_type === 'client' ? 'Client' : 'Employer',
          timeframe: rel.start_date && rel.end_date
            ? `${new Date(rel.start_date).getFullYear()}–${rel.end_date ? new Date(rel.end_date).getFullYear() : 'present'}`
            : 'Unknown',
          notes: rel.relationship_description || undefined
        }));
    }
    
    // Add pac leadership as affiliations if available
    if (profileData.pac_leadership && profileData.pac_leadership.length > 0) {
      const pacAffiliations = profileData.pac_leadership.map((pac: any) => ({
        entity_name: pac.pac_name,
        type: 'PAC',
        timeframe: pac.appointment_date && pac.term_end_date
          ? `${new Date(pac.appointment_date).getFullYear()}–${pac.term_end_date ? new Date(pac.term_end_date).getFullYear() : 'present'}`
          : 'Unknown',
        notes: `${pac.role} - ${pac.pac_focus || 'General political activities'}`
      }));
      
      if (!characterProfile.known_clients_or_affiliations) {
        characterProfile.known_clients_or_affiliations = pacAffiliations;
      } else {
        characterProfile.known_clients_or_affiliations = [
          ...characterProfile.known_clients_or_affiliations,
          ...pacAffiliations
        ];
      }
    }
    
    // Add lobbyist reports as donations data if available
    if (profileData.lobbyist_reports && profileData.lobbyist_reports.length > 0) {
      // Calculate total amount
      const totalAmount = profileData.lobbyist_reports.reduce((sum: any, report: any) => {
        return sum + (report.amount ? Number(report.amount) : 0);
      }, 0);
      
      // Create top recipients from client names
      const topRecipients = profileData.lobbyist_reports
        .filter((report: any) => report.amount)
        .sort((a: any, b: any) => Number(b.amount) - Number(a.amount))
        .slice(0, 5)
        .map((report: any) => ({
          legislator_name: report.client_name,
          amount: Number(report.amount),
          date: report.filing_date ? new Date(report.filing_date).toISOString() : new Date().toISOString(),
          district: "Unknown"
        }));
      
      characterProfile.donations = {
        total_amount: totalAmount,
        top_recipients: topRecipients
      };
    }
    
    // Add legislative appearances as linked legislation if available
    if (profileData.legislative_appearances && profileData.legislative_appearances.length > 0) {
      const linkedLegislation = profileData.legislative_appearances
        .filter((appearance: any) => appearance.bill_id) // Only include those with bill IDs
        .map((appearance: any) => ({
          bill_id: appearance.bill_id || 'Unknown',
          bill_title: appearance.event_name || 'Unknown',
          action: (appearance.position as "support" | "oppose" | "neutral") || "neutral",
          year: appearance.appearance_date 
            ? new Date(appearance.appearance_date).getFullYear()
            : new Date().getFullYear()
        }));
      
      if (characterProfile.influence_map) {
        characterProfile.influence_map.linked_legislation = linkedLegislation;
        
        // Add committees to targets if they exist
        const committees = new Set<string>();
        profileData.legislative_appearances.forEach((appearance: any) => {
          if (appearance.committee) {
            committees.add(appearance.committee);
          }
        });
        
        if (committees.size > 0) {
          characterProfile.influence_map.committee_targets = Array.from(committees);
        }
      }
    }
    
    return characterProfile;
  } catch (error: any) {
    console.error("Error creating character profile:", error);
    return null;
  }
}

/**
 * Register character profiles routes
 */
export function registerCharacterProfileRoutes(app: Express) {
  /**
   * Get all character profiles
   */
  app.get("/api/scout-bot/character-profiles", async (req: Request, res: Response) => {
    try {
      // Get all approved profiles from Scout Bot
      const scoutBotProfiles = await scoutBotStorage.getProfiles({ status: "approved" });
      
      // Create character profiles array
      const characterProfiles: CharacterProfile[] = [];
      
      // Process each profile to create a character profile
      for (const profile of scoutBotProfiles) {
        const characterProfile = await createCharacterProfileFromScoutBotProfile(profile.id);
        if (characterProfile) {
          characterProfiles.push(characterProfile);
        }
      }
      
      res.json(characterProfiles);
    } catch (error: any) {
      console.error("Error fetching character profiles:", error);
      res.status(500).json({ error: "Failed to fetch character profiles" });
    }
  });
  
  /**
   * Get a single character profile by ID
   */
  app.get("/api/scout-bot/character-profiles/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Create character profile from Scout Bot profile
      const characterProfile = await createCharacterProfileFromScoutBotProfile(id);
      
      if (!characterProfile) {
        return res.status(404).json({ error: "Character profile not found" });
      }
      
      res.json(characterProfile);
    } catch (error: any) {
      console.error(`Error fetching character profile ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch character profile" });
    }
  });
  
  /**
   * Get flags for a character profile
   */
  app.get("/api/scout-bot/character-profiles/:id/flags", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get all flags for the profile
      const profileFlags = await extendedScoutBotStorage.getFlags(id);
      
      if (!profileFlags || profileFlags.length === 0) {
        return res.json([]);
      }
      
      // Map database flags to API response
      const flags: Flag[] = profileFlags.map(flag => ({
        id: flag.id,
        type: flag.flag_type,
        description: flag.description,
        severity: flag.severity || 1,
        date: flag.detection_date.toISOString(),
        status: flag.reviewed ? (flag.resolution_notes ? "resolved" : "reviewed") : "active"
      }));
      
      res.json(flags);
    } catch (error: any) {
      console.error(`Error fetching flags for profile ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch profile flags" });
    }
  });
  
  /**
   * Search character profiles
   */
  app.get("/api/scout-bot/character-profiles/search", async (req: Request, res: Response) => {
    try {
      const { query, type } = req.query;
      
      // Search profiles in Scout Bot storage based on query and type
      let scoutBotProfiles;
      if (query && type) {
        scoutBotProfiles = await scoutBotStorage.searchProfiles({
          name: query as string,
          type: type as string,
          status: "approved"
        });
      } else if (query) {
        scoutBotProfiles = await scoutBotStorage.searchProfiles({
          name: query as string,
          status: "approved"
        });
      } else if (type) {
        scoutBotProfiles = await scoutBotStorage.getProfiles({
          type: type as string,
          status: "approved"
        });
      } else {
        scoutBotProfiles = await scoutBotStorage.getProfiles({ status: "approved" });
      }
      
      // Create character profiles array
      const characterProfiles: CharacterProfile[] = [];
      
      // Process each profile to create a character profile
      for (const profile of scoutBotProfiles) {
        const characterProfile = await createCharacterProfileFromScoutBotProfile(profile.id);
        if (characterProfile) {
          characterProfiles.push(characterProfile);
        }
      }
      
      res.json(characterProfiles);
    } catch (error: any) {
      console.error("Error searching character profiles:", error);
      res.status(500).json({ error: "Failed to search character profiles" });
    }
  });
}