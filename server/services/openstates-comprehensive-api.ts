import axios from 'axios';
import { createLogger } from "../logger";
const log = createLogger("openstates-comprehensive-api");


/**
 * OpenStates Comprehensive API Service
 * Complete legislative ecosystem: committees, events, people, jurisdictions
 * Using OpenStates v3 API for authentic Texas legislative infrastructure
 */

interface OpenStatesCommittee {
  id: string;
  name: string;
  classification: string;
  chamber: string;
  parent?: {
    id: string;
    name: string;
  };
  memberships: Array<{
    person: {
      id: string;
      name: string;
    };
    role: string;
    start_date?: string;
    end_date?: string;
  }>;
  jurisdiction: {
    id: string;
    name: string;
  };
  sources: Array<{
    url: string;
    note?: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface OpenStatesEvent {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  timezone: string;
  status: string;
  classification: string[];
  location?: {
    name: string;
    url?: string;
  };
  media: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  documents: Array<{
    note: string;
    url: string;
  }>;
  participants: Array<{
    entity_type: string;
    entity_name: string;
    entity_id?: string;
    note?: string;
  }>;
  agenda: Array<{
    description: string;
    classification: string[];
    subjects?: string[];
    related_entities?: Array<{
      entity_type: string;
      entity_id: string;
      entity_name: string;
    }>;
  }>;
  sources: Array<{
    url: string;
    note?: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface OpenStatesPerson {
  id: string;
  name: string;
  family_name?: string;
  given_name?: string;
  image?: string;
  gender?: string;
  birth_date?: string;
  death_date?: string;
  summary?: string;
  biography?: string;
  current_role?: {
    title: string;
    org_classification: string;
    district?: string;
    division_id?: string;
    start_date?: string;
    end_date?: string;
  };
  roles: Array<{
    type: string;
    title: string;
    org_classification: string;
    district?: string;
    start_date?: string;
    end_date?: string;
  }>;
  party: Array<{
    name: string;
    start_date?: string;
    end_date?: string;
  }>;
  contact_details: Array<{
    type: string;
    value: string;
    note?: string;
  }>;
  links: Array<{
    url: string;
    note?: string;
  }>;
  sources: Array<{
    url: string;
    note?: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface OpenStatesJurisdiction {
  id: string;
  name: string;
  url: string;
  classification: string;
  division_id: string;
  latest_session: string;
  legislative_sessions: Array<{
    identifier: string;
    name: string;
    classification: string;
    start_date: string;
    end_date: string;
  }>;
  feature_flags: string[];
  organizations: Array<{
    id: string;
    name: string;
    classification: string;
  }>;
}

class OpenStatesComprehensiveAPI {
  private apiKey: string;
  private baseUrl = 'https://v3.openstates.org';

  constructor() {
    this.apiKey = process.env.OPENSTATES_API_KEY || '';
    if (!this.apiKey) {
      log.warn('⚠️ OPENSTATES_API_KEY not found - comprehensive legislative data will be limited');
    }
  }

  /**
   * Fetch all Texas committees with memberships
   */
  async fetchTexasCommittees(page = 1, perPage = 50): Promise<{
    committees: OpenStatesCommittee[];
    pagination: any;
  }> {
    try {
      log.info(`🏛️ Fetching Texas committees page ${page}...`);

      const response = await axios.get(`${this.baseUrl}/organizations`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          jurisdiction: 'Texas',
          classification: 'committee',
          page: page,
          per_page: perPage,
          include: 'memberships'
        }
      });

      return {
        committees: response.data.results || [],
        pagination: response.data.pagination || {}
      };

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching Texas committees');
      throw new Error(`Failed to fetch Texas committees: ${error.message}`);
    }
  }

  /**
   * Fetch committee details by ID
   */
  async fetchCommitteeDetails(committeeId: string): Promise<OpenStatesCommittee | null> {
    try {
      log.info(`🏛️ Fetching committee details for: ${committeeId}`);

      const response = await axios.get(`${this.baseUrl}/organizations/${committeeId}`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          include: 'memberships'
        }
      });

      return response.data;

    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching committee ${committeeId}`);
      return null;
    }
  }

  /**
   * Fetch Texas legislative events (hearings, sessions, meetings)
   */
  async fetchTexasEvents(page = 1, perPage = 25): Promise<{
    events: OpenStatesEvent[];
    pagination: any;
  }> {
    try {
      log.info(`📅 Fetching Texas legislative events page ${page}...`);

      const response = await axios.get(`${this.baseUrl}/events`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          jurisdiction: 'Texas',
          page: page,
          per_page: perPage,
          include: 'participants,agenda,media,documents'
        }
      });

      return {
        events: response.data.results || [],
        pagination: response.data.pagination || {}
      };

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching Texas events');
      throw new Error(`Failed to fetch Texas events: ${error.message}`);
    }
  }

  /**
   * Fetch upcoming Texas legislative events
   */
  async fetchUpcomingEvents(days = 30): Promise<OpenStatesEvent[]> {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      log.info(`📅 Fetching upcoming Texas events (${startDate} to ${endDate})...`);

      const response = await axios.get(`${this.baseUrl}/events`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          jurisdiction: 'Texas',
          start_date: startDate,
          end_date: endDate,
          include: 'participants,agenda'
        }
      });

      return response.data.results || [];

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching upcoming events');
      throw new Error(`Failed to fetch upcoming events: ${error.message}`);
    }
  }

  /**
   * Fetch detailed person information
   */
  async fetchPersonDetails(personId: string): Promise<OpenStatesPerson | null> {
    try {
      log.info(`👤 Fetching person details for: ${personId}`);

      const response = await axios.get(`${this.baseUrl}/people/${personId}`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return response.data;

    } catch (error: any) {
      log.error({ err: error.message }, `❌ Error fetching person ${personId}`);
      return null;
    }
  }

  /**
   * Search people by name or role
   */
  async searchPeople(query: string, page = 1): Promise<{
    people: OpenStatesPerson[];
    pagination: any;
  }> {
    try {
      log.info(`🔍 Searching for people: "${query}"`);

      const response = await axios.get(`${this.baseUrl}/people`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          jurisdiction: 'Texas',
          name: query,
          page: page,
          per_page: 20
        }
      });

      return {
        people: response.data.results || [],
        pagination: response.data.pagination || {}
      };

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error searching people');
      throw new Error(`Failed to search people: ${error.message}`);
    }
  }

  /**
   * Fetch Texas jurisdiction information
   */
  async fetchTexasJurisdiction(): Promise<OpenStatesJurisdiction | null> {
    try {
      log.info('🗺️ Fetching Texas jurisdiction information...');

      const response = await axios.get(`${this.baseUrl}/jurisdictions/Texas`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return response.data;

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Error fetching Texas jurisdiction');
      return null;
    }
  }

  /**
   * Comprehensive data collection for committees, events, people, jurisdictions
   */
  async performComprehensiveDataCollection(): Promise<{
    success: boolean;
    committeesCollected: number;
    eventsCollected: number;
    peopleCollected: number;
    jurisdictionData: any;
    errors: string[];
    data: {
      committees: any[];
      events: any[];
      people: any[];
      jurisdiction: any;
    };
  }> {
    const results = {
      success: true,
      committeesCollected: 0,
      eventsCollected: 0,
      peopleCollected: 0,
      jurisdictionData: null,
      errors: [] as string[],
      data: {
        committees: [] as any[],
        events: [] as any[],
        people: [] as any[],
        jurisdiction: null as any
      }
    };

    try {
      log.info('🚀 Starting comprehensive Texas legislative infrastructure collection...');

      // 1. Collect jurisdiction information
      try {
        log.info('🗺️ Collecting Texas jurisdiction data...');
        const jurisdiction = await this.fetchTexasJurisdiction();
        if (jurisdiction) {
          results.data.jurisdiction = this.normalizeJurisdictionData(jurisdiction);
          results.jurisdictionData = results.data.jurisdiction;
          log.info('✅ Texas jurisdiction data collected');
        }
      } catch (error: any) {
        log.error({ err: error.message }, '❌ Error collecting jurisdiction');
        results.errors.push(`Jurisdiction: ${error.message}`);
      }

      // 2. Collect committees data
      try {
        log.info('🏛️ Collecting Texas committees...');
        let page = 1;
        let hasMoreCommittees = true;

        while (hasMoreCommittees && page <= 5) { // Limit for initial collection
          const committeesData = await this.fetchTexasCommittees(page, 50);
          
          if (committeesData.committees.length === 0) {
            hasMoreCommittees = false;
            break;
          }

          for (const committee of committeesData.committees) {
            const normalizedCommittee = this.normalizeCommitteeData(committee);
            results.data.committees.push(normalizedCommittee);
            results.committeesCollected++;
          }

          page++;
          if (!committeesData.pagination?.next) {
            hasMoreCommittees = false;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        log.info(`✅ Collected ${results.committeesCollected} committees`);
      } catch (error: any) {
        log.error({ err: error.message }, '❌ Error collecting committees');
        results.errors.push(`Committees: ${error.message}`);
      }

      // 3. Collect upcoming events
      try {
        log.info('📅 Collecting upcoming Texas legislative events...');
        const upcomingEvents = await this.fetchUpcomingEvents(60); // Next 60 days
        
        for (const event of upcomingEvents) {
          const normalizedEvent = this.normalizeEventData(event);
          results.data.events.push(normalizedEvent);
          results.eventsCollected++;
        }

        log.info(`✅ Collected ${results.eventsCollected} upcoming events`);
      } catch (error: any) {
        log.error({ err: error.message }, '❌ Error collecting events');
        results.errors.push(`Events: ${error.message}`);
      }

      log.info(`✅ Comprehensive collection completed: ${results.committeesCollected} committees, ${results.eventsCollected} events`);

    } catch (error: any) {
      log.error({ err: error.message }, '❌ Comprehensive data collection failed');
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Normalize committee data for Act Up platform
   */
  private normalizeCommitteeData(committee: OpenStatesCommittee): any {
    return {
      id: committee.id,
      name: committee.name,
      classification: committee.classification,
      chamber: committee.chamber,
      parent: committee.parent || null,
      members: committee.memberships?.map(membership => ({
        personId: membership.person?.id,
        personName: membership.person?.name,
        role: membership.role,
        startDate: membership.start_date,
        endDate: membership.end_date
      })) || [],
      memberCount: committee.memberships?.length || 0,
      jurisdiction: committee.jurisdiction?.name || 'Texas',
      sources: committee.sources || [],
      createdAt: committee.created_at,
      updatedAt: committee.updated_at,
      source: 'OpenStates API'
    };
  }

  /**
   * Normalize event data for Act Up platform
   */
  private normalizeEventData(event: OpenStatesEvent): any {
    return {
      id: event.id,
      name: event.name,
      description: event.description || '',
      startDate: event.start_date,
      endDate: event.end_date,
      timezone: event.timezone,
      status: event.status,
      classification: event.classification,
      location: event.location || null,
      participants: event.participants?.map(participant => ({
        entityType: participant.entity_type,
        entityName: participant.entity_name,
        entityId: participant.entity_id,
        note: participant.note
      })) || [],
      agenda: event.agenda?.map(item => ({
        description: item.description,
        classification: item.classification,
        subjects: item.subjects || [],
        relatedEntities: item.related_entities || []
      })) || [],
      media: event.media || [],
      documents: event.documents || [],
      sources: event.sources || [],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      source: 'OpenStates API'
    };
  }

  /**
   * Normalize jurisdiction data for Act Up platform
   */
  private normalizeJurisdictionData(jurisdiction: OpenStatesJurisdiction): any {
    return {
      id: jurisdiction.id,
      name: jurisdiction.name,
      url: jurisdiction.url,
      classification: jurisdiction.classification,
      divisionId: jurisdiction.division_id,
      latestSession: jurisdiction.latest_session,
      sessions: jurisdiction.legislative_sessions?.map(session => ({
        identifier: session.identifier,
        name: session.name,
        classification: session.classification,
        startDate: session.start_date,
        endDate: session.end_date
      })) || [],
      featureFlags: jurisdiction.feature_flags || [],
      organizations: jurisdiction.organizations?.map(org => ({
        id: org.id,
        name: org.name,
        classification: org.classification
      })) || [],
      source: 'OpenStates API'
    };
  }
}

export const openStatesComprehensiveAPI = new OpenStatesComprehensiveAPI();

log.info('🏛️ OpenStates Comprehensive API initialized');