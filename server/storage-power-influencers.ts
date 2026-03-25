// @ts-nocheck
import { db } from './db';
import { and, desc, eq, inArray, isNotNull, isNull, like, lt, sql, count } from 'drizzle-orm';
import { 
  powerInfluencers, 
  consultants, 
  megaInfluencers, 
  consultantClients,
  consultantCampaigns,
  billTopicInfluence,
  billInfluenceRecords,
  influencerConnections,
  influencerDonations,
  influenceHeatmapData,
  InsertPowerInfluencer,
  InsertConsultant,
  InsertMegaInfluencer,
  InsertConsultantClient,
  InsertConsultantCampaign,
  InsertBillTopicInfluence,
  InsertBillInfluenceRecord,
  InsertInfluencerConnection,
  InsertInfluencerDonation,
  InsertInfluenceHeatmapData,
  PowerInfluencer,
  Consultant,
  MegaInfluencer,
  ConsultantClient,
  ConsultantCampaign,
  BillTopicInfluence,
  BillInfluenceRecord,
  InfluencerConnection,
  InfluencerDonation,
  InfluenceHeatmapData
} from '../shared/schema-power-influencers';

/**
 * Interface defining all storage methods for Power Influencers
 */
export interface PowerInfluencersStorage {
  // Base Power Influencer methods
  getAllPowerInfluencers(): Promise<PowerInfluencer[]>;
  getPowerInfluencerById(id: number): Promise<PowerInfluencer | null>;
  getPowerInfluencersByType(type: 'consultant' | 'mega_influencer'): Promise<PowerInfluencer[]>;
  searchPowerInfluencers(query: string): Promise<PowerInfluencer[]>;
  createPowerInfluencer(data: InsertPowerInfluencer): Promise<PowerInfluencer>;
  updatePowerInfluencer(id: number, data: Partial<InsertPowerInfluencer>): Promise<PowerInfluencer | null>;
  deletePowerInfluencer(id: number): Promise<boolean>;
  
  // Consultant methods
  getAllConsultants(): Promise<Consultant[]>;
  getConsultantById(id: number): Promise<Consultant | null>;
  getConsultantByInfluencerId(influencerId: number): Promise<Consultant | null>;
  createConsultant(data: InsertConsultant): Promise<Consultant>;
  updateConsultant(id: number, data: Partial<InsertConsultant>): Promise<Consultant | null>;
  deleteConsultant(id: number): Promise<boolean>;
  
  // Mega Influencer methods
  getAllMegaInfluencers(): Promise<MegaInfluencer[]>;
  getMegaInfluencerById(id: number): Promise<MegaInfluencer | null>;
  getMegaInfluencerByInfluencerId(influencerId: number): Promise<MegaInfluencer | null>;
  createMegaInfluencer(data: InsertMegaInfluencer): Promise<MegaInfluencer>;
  updateMegaInfluencer(id: number, data: Partial<InsertMegaInfluencer>): Promise<MegaInfluencer | null>;
  deleteMegaInfluencer(id: number): Promise<boolean>;
  
  // Consultant Client methods
  getConsultantClientsByConsultantId(consultantId: number): Promise<ConsultantClient[]>;
  createConsultantClient(data: InsertConsultantClient): Promise<ConsultantClient>;
  updateConsultantClient(id: number, data: Partial<InsertConsultantClient>): Promise<ConsultantClient | null>;
  deleteConsultantClient(id: number): Promise<boolean>;
  
  // Consultant Campaign methods
  getConsultantCampaignsByConsultantId(consultantId: number): Promise<ConsultantCampaign[]>;
  createConsultantCampaign(data: InsertConsultantCampaign): Promise<ConsultantCampaign>;
  updateConsultantCampaign(id: number, data: Partial<InsertConsultantCampaign>): Promise<ConsultantCampaign | null>;
  deleteConsultantCampaign(id: number): Promise<boolean>;
  
  // Bill Topic Influence methods
  getBillTopicInfluenceByInfluencerId(influencerId: number): Promise<BillTopicInfluence[]>;
  getBillTopicInfluenceByTopic(topic: string): Promise<BillTopicInfluence[]>;
  createBillTopicInfluence(data: InsertBillTopicInfluence): Promise<BillTopicInfluence>;
  updateBillTopicInfluence(id: number, data: Partial<InsertBillTopicInfluence>): Promise<BillTopicInfluence | null>;
  deleteBillTopicInfluence(id: number): Promise<boolean>;
  
  // Bill Influence Record methods
  getBillInfluenceRecordsByInfluencerId(influencerId: number): Promise<BillInfluenceRecord[]>;
  getBillInfluenceRecordsByBillId(billId: string): Promise<BillInfluenceRecord[]>;
  createBillInfluenceRecord(data: InsertBillInfluenceRecord): Promise<BillInfluenceRecord>;
  updateBillInfluenceRecord(id: number, data: Partial<InsertBillInfluenceRecord>): Promise<BillInfluenceRecord | null>;
  deleteBillInfluenceRecord(id: number): Promise<boolean>;
  
  // Influencer Connection methods
  getInfluencerConnectionsByInfluencerId(influencerId: number): Promise<InfluencerConnection[]>;
  createInfluencerConnection(data: InsertInfluencerConnection): Promise<InfluencerConnection>;
  updateInfluencerConnection(id: number, data: Partial<InsertInfluencerConnection>): Promise<InfluencerConnection | null>;
  deleteInfluencerConnection(id: number): Promise<boolean>;
  
  // Influencer Donation methods
  getInfluencerDonationsByInfluencerId(influencerId: number): Promise<InfluencerDonation[]>;
  createInfluencerDonation(data: InsertInfluencerDonation): Promise<InfluencerDonation>;
  updateInfluencerDonation(id: number, data: Partial<InsertInfluencerDonation>): Promise<InfluencerDonation | null>;
  deleteInfluencerDonation(id: number): Promise<boolean>;
  
  // Influence Heatmap Data methods
  getInfluenceHeatmapDataByInfluencerId(influencerId: number): Promise<InfluenceHeatmapData[]>;
  createInfluenceHeatmapData(data: InsertInfluenceHeatmapData): Promise<InfluenceHeatmapData>;
  updateInfluenceHeatmapData(id: number, data: Partial<InsertInfluenceHeatmapData>): Promise<InfluenceHeatmapData | null>;
  deleteInfluenceHeatmapData(id: number): Promise<boolean>;
  
  // Advanced query methods
  getTopInfluencersByDonationAmount(limit?: number): Promise<{influencer: PowerInfluencer, totalDonations: number}[]>;
  getMostInfluentialConsultantsBySuccessRate(limit?: number): Promise<{consultant: Consultant, influencer: PowerInfluencer, successRate: number}[]>;
  getInfluencersByBillId(billId: string): Promise<PowerInfluencer[]>;
  getInfluencersByLegislatorId(legislatorId: number): Promise<PowerInfluencer[]>;
  getInfluencerNetworkByInfluencerId(influencerId: number, depth?: number): Promise<{nodes: any[], edges: any[]}>;
  getInfluencerCardData(influencerId: number): Promise<{
    influencer: PowerInfluencer, 
    details: Consultant | MegaInfluencer | null,
    clients?: ConsultantClient[],
    campaigns?: ConsultantCampaign[],
    topicInfluence: BillTopicInfluence[],
    donations: InfluencerDonation[],
    connections: InfluencerConnection[],
    billRecords: BillInfluenceRecord[],
    heatmapData: InfluenceHeatmapData[]
  }>;
}

/**
 * Database implementation of PowerInfluencersStorage
 */
export class DatabasePowerInfluencersStorage implements PowerInfluencersStorage {
  // Base Power Influencer methods
  async getAllPowerInfluencers(): Promise<PowerInfluencer[]> {
    return db.select().from(powerInfluencers).orderBy(desc(powerInfluencers.influenceScore));
  }
  
  async getPowerInfluencerById(id: number): Promise<PowerInfluencer | null> {
    const results = await db.select().from(powerInfluencers).$dynamic().where(eq(powerInfluencers.id, id));
    return results.length > 0 ? results[0] : null;
  }
  
  async getPowerInfluencersByType(type: 'consultant' | 'mega_influencer'): Promise<PowerInfluencer[]> {
    return db.select().from(powerInfluencers).$dynamic().where(eq(powerInfluencers.type, type));
  }
  
  async searchPowerInfluencers(query: string): Promise<PowerInfluencer[]> {
    return db.select().from(powerInfluencers).$dynamic().where(like(powerInfluencers.name, `%${query}%`));
  }
  
  async createPowerInfluencer(data: InsertPowerInfluencer): Promise<PowerInfluencer> {
    const result = await db.insert(powerInfluencers).values(data).returning();
    return result[0];
  }
  
  async updatePowerInfluencer(id: number, data: Partial<InsertPowerInfluencer>): Promise<PowerInfluencer | null> {
    const result = await db.update(powerInfluencers).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(powerInfluencers.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deletePowerInfluencer(id: number): Promise<boolean> {
    const result = await db.delete(powerInfluencers).where(eq(powerInfluencers.id, id)).returning();
    return result.length > 0;
  }
  
  // Consultant methods
  async getAllConsultants(): Promise<Consultant[]> {
    return db.select().from(consultants);
  }
  
  async getConsultantById(id: number): Promise<Consultant | null> {
    const results = await db.select().from(consultants).$dynamic().where(eq(consultants.id, id));
    return results.length > 0 ? results[0] : null;
  }
  
  async getConsultantByInfluencerId(influencerId: number): Promise<Consultant | null> {
    const results = await db.select().from(consultants).$dynamic().where(eq(consultants.influencerId, influencerId));
    return results.length > 0 ? results[0] : null;
  }
  
  async createConsultant(data: InsertConsultant): Promise<Consultant> {
    const result = await db.insert(consultants).values(data).returning();
    return result[0];
  }
  
  async updateConsultant(id: number, data: Partial<InsertConsultant>): Promise<Consultant | null> {
    const result = await db.update(consultants).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(consultants.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteConsultant(id: number): Promise<boolean> {
    const result = await db.delete(consultants).where(eq(consultants.id, id)).returning();
    return result.length > 0;
  }
  
  // Mega Influencer methods
  async getAllMegaInfluencers(): Promise<MegaInfluencer[]> {
    return db.select().from(megaInfluencers);
  }
  
  async getMegaInfluencerById(id: number): Promise<MegaInfluencer | null> {
    const results = await db.select().from(megaInfluencers).$dynamic().where(eq(megaInfluencers.id, id));
    return results.length > 0 ? results[0] : null;
  }
  
  async getMegaInfluencerByInfluencerId(influencerId: number): Promise<MegaInfluencer | null> {
    const results = await db.select().from(megaInfluencers).$dynamic().where(eq(megaInfluencers.influencerId, influencerId));
    return results.length > 0 ? results[0] : null;
  }
  
  async createMegaInfluencer(data: InsertMegaInfluencer): Promise<MegaInfluencer> {
    const result = await db.insert(megaInfluencers).values(data).returning();
    return result[0];
  }
  
  async updateMegaInfluencer(id: number, data: Partial<InsertMegaInfluencer>): Promise<MegaInfluencer | null> {
    const result = await db.update(megaInfluencers).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(megaInfluencers.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteMegaInfluencer(id: number): Promise<boolean> {
    const result = await db.delete(megaInfluencers).where(eq(megaInfluencers.id, id)).returning();
    return result.length > 0;
  }
  
  // Consultant Client methods
  async getConsultantClientsByConsultantId(consultantId: number): Promise<ConsultantClient[]> {
    return db.select().from(consultantClients).$dynamic().where(eq(consultantClients.consultantId, consultantId));
  }
  
  async createConsultantClient(data: InsertConsultantClient): Promise<ConsultantClient> {
    const result = await db.insert(consultantClients).values(data).returning();
    return result[0];
  }
  
  async updateConsultantClient(id: number, data: Partial<InsertConsultantClient>): Promise<ConsultantClient | null> {
    const result = await db.update(consultantClients).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(consultantClients.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteConsultantClient(id: number): Promise<boolean> {
    const result = await db.delete(consultantClients).where(eq(consultantClients.id, id)).returning();
    return result.length > 0;
  }
  
  // Consultant Campaign methods
  async getConsultantCampaignsByConsultantId(consultantId: number): Promise<ConsultantCampaign[]> {
    return db.select().from(consultantCampaigns).$dynamic().where(eq(consultantCampaigns.consultantId, consultantId));
  }
  
  async createConsultantCampaign(data: InsertConsultantCampaign): Promise<ConsultantCampaign> {
    const result = await db.insert(consultantCampaigns).values(data).returning();
    return result[0];
  }
  
  async updateConsultantCampaign(id: number, data: Partial<InsertConsultantCampaign>): Promise<ConsultantCampaign | null> {
    const result = await db.update(consultantCampaigns).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(consultantCampaigns.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteConsultantCampaign(id: number): Promise<boolean> {
    const result = await db.delete(consultantCampaigns).where(eq(consultantCampaigns.id, id)).returning();
    return result.length > 0;
  }
  
  // Bill Topic Influence methods
  async getBillTopicInfluenceByInfluencerId(influencerId: number): Promise<BillTopicInfluence[]> {
    return db.select().from(billTopicInfluence).$dynamic().where(eq(billTopicInfluence.influencerId, influencerId));
  }
  
  async getBillTopicInfluenceByTopic(topic: string): Promise<BillTopicInfluence[]> {
    return db.select().from(billTopicInfluence).$dynamic().where(eq(billTopicInfluence.topic, topic));
  }
  
  async createBillTopicInfluence(data: InsertBillTopicInfluence): Promise<BillTopicInfluence> {
    const result = await db.insert(billTopicInfluence).values(data).returning();
    return result[0];
  }
  
  async updateBillTopicInfluence(id: number, data: Partial<InsertBillTopicInfluence>): Promise<BillTopicInfluence | null> {
    const result = await db.update(billTopicInfluence).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(billTopicInfluence.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteBillTopicInfluence(id: number): Promise<boolean> {
    const result = await db.delete(billTopicInfluence).where(eq(billTopicInfluence.id, id)).returning();
    return result.length > 0;
  }
  
  // Bill Influence Record methods
  async getBillInfluenceRecordsByInfluencerId(influencerId: number): Promise<BillInfluenceRecord[]> {
    return db.select().from(billInfluenceRecords).$dynamic().where(eq(billInfluenceRecords.influencerId, influencerId));
  }
  
  async getBillInfluenceRecordsByBillId(billId: string): Promise<BillInfluenceRecord[]> {
    return db.select().from(billInfluenceRecords).$dynamic().where(eq(billInfluenceRecords.billId, billId));
  }
  
  async createBillInfluenceRecord(data: InsertBillInfluenceRecord): Promise<BillInfluenceRecord> {
    const result = await db.insert(billInfluenceRecords).values(data).returning();
    return result[0];
  }
  
  async updateBillInfluenceRecord(id: number, data: Partial<InsertBillInfluenceRecord>): Promise<BillInfluenceRecord | null> {
    const result = await db.update(billInfluenceRecords).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(billInfluenceRecords.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteBillInfluenceRecord(id: number): Promise<boolean> {
    const result = await db.delete(billInfluenceRecords).where(eq(billInfluenceRecords.id, id)).returning();
    return result.length > 0;
  }
  
  // Influencer Connection methods
  async getInfluencerConnectionsByInfluencerId(influencerId: number): Promise<InfluencerConnection[]> {
    return db.select().from(influencerConnections).$dynamic().where(eq(influencerConnections.influencerId, influencerId));
  }
  
  async createInfluencerConnection(data: InsertInfluencerConnection): Promise<InfluencerConnection> {
    const result = await db.insert(influencerConnections).values(data).returning();
    return result[0];
  }
  
  async updateInfluencerConnection(id: number, data: Partial<InsertInfluencerConnection>): Promise<InfluencerConnection | null> {
    const result = await db.update(influencerConnections).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(influencerConnections.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteInfluencerConnection(id: number): Promise<boolean> {
    const result = await db.delete(influencerConnections).where(eq(influencerConnections.id, id)).returning();
    return result.length > 0;
  }
  
  // Influencer Donation methods
  async getInfluencerDonationsByInfluencerId(influencerId: number): Promise<InfluencerDonation[]> {
    return db.select().from(influencerDonations).$dynamic().where(eq(influencerDonations.influencerId, influencerId));
  }
  
  async createInfluencerDonation(data: InsertInfluencerDonation): Promise<InfluencerDonation> {
    const result = await db.insert(influencerDonations).values(data).returning();
    return result[0];
  }
  
  async updateInfluencerDonation(id: number, data: Partial<InsertInfluencerDonation>): Promise<InfluencerDonation | null> {
    const result = await db.update(influencerDonations).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(influencerDonations.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteInfluencerDonation(id: number): Promise<boolean> {
    const result = await db.delete(influencerDonations).where(eq(influencerDonations.id, id)).returning();
    return result.length > 0;
  }
  
  // Influence Heatmap Data methods
  async getInfluenceHeatmapDataByInfluencerId(influencerId: number): Promise<InfluenceHeatmapData[]> {
    return db.select().from(influenceHeatmapData).$dynamic().where(eq(influenceHeatmapData.influencerId, influencerId));
  }
  
  async createInfluenceHeatmapData(data: InsertInfluenceHeatmapData): Promise<InfluenceHeatmapData> {
    const result = await db.insert(influenceHeatmapData).values(data).returning();
    return result[0];
  }
  
  async updateInfluenceHeatmapData(id: number, data: Partial<InsertInfluenceHeatmapData>): Promise<InfluenceHeatmapData | null> {
    const result = await db.update(influenceHeatmapData).set({
      ...data,
      updatedAt: new Date()
    }).where(eq(influenceHeatmapData.id, id)).returning();
    return result.length > 0 ? result[0] : null;
  }
  
  async deleteInfluenceHeatmapData(id: number): Promise<boolean> {
    const result = await db.delete(influenceHeatmapData).where(eq(influenceHeatmapData.id, id)).returning();
    return result.length > 0;
  }
  
  // Advanced query methods
  async getTopInfluencersByDonationAmount(limit: number = 10): Promise<{influencer: PowerInfluencer, totalDonations: number}[]> {
    const result = await db.select({
      influencer: powerInfluencers,
      totalDonations: sql<number>`SUM(${influencerDonations.amount})::numeric`
    })
    .from(powerInfluencers)
    .innerJoin(influencerDonations, eq(powerInfluencers.id, influencerDonations.influencerId))
    .groupBy(powerInfluencers.id)
    .orderBy(desc(sql`SUM(${influencerDonations.amount})`))
    .limit(limit);
    
    return result;
  }
  
  async getMostInfluentialConsultantsBySuccessRate(limit: number = 10): Promise<{consultant: Consultant, influencer: PowerInfluencer, successRate: number}[]> {
    const result = await db.select({
      consultant: consultants,
      influencer: powerInfluencers,
      successRate: sql<number>`AVG(${billInfluenceRecords.successMetric}::int)::numeric * 100`
    })
    .from(consultants)
    .innerJoin(powerInfluencers, eq(consultants.influencerId, powerInfluencers.id))
    .innerJoin(billInfluenceRecords, eq(powerInfluencers.id, billInfluenceRecords.influencerId))
    .groupBy(consultants.id, powerInfluencers.id)
    .orderBy(desc(sql`AVG(${billInfluenceRecords.successMetric}::int)::numeric * 100`))
    .limit(limit);
    
    return result;
  }
  
  async getInfluencersByBillId(billId: string): Promise<PowerInfluencer[]> {
    return db.select({
      influencer: powerInfluencers
    })
    .from(powerInfluencers)
    .innerJoin(billInfluenceRecords, eq(powerInfluencers.id, billInfluenceRecords.influencerId))
    .where(eq(billInfluenceRecords.billId, billId))
    .then(records => records.map(r => r.influencer));
  }
  
  async getInfluencersByLegislatorId(legislatorId: number): Promise<PowerInfluencer[]> {
    // Get influencers who have donated to this legislator
    // This assumes legislator name is stored in recipientName and we'd need to join with legislators table
    // For a real implementation, you'd want to use actual legislator IDs in the donations table
    return db.select({
      influencer: powerInfluencers
    })
    .from(powerInfluencers)
    .innerJoin(influencerDonations, eq(powerInfluencers.id, influencerDonations.influencerId))
    .where(
      and(
        eq(influencerDonations.recipientType, 'candidate'),
        // This is a simplified example; in reality, you would join with legislators table 
        // and match on legislator ID rather than name
        like(influencerDonations.recipientName, `%legislator-${legislatorId}%`)
      )
    )
    .then(records => records.map(r => r.influencer));
  }
  
  async getInfluencerNetworkByInfluencerId(influencerId: number, depth: number = 1): Promise<{nodes: any[], edges: any[]}> {
    // This is a simplified implementation that would need to be expanded
    // to handle multiple levels of connections recursively
    
    // First get the core influencer
    const coreInfluencer = await this.getPowerInfluencerById(influencerId);
    if (!coreInfluencer) {
      return { nodes: [], edges: [] };
    }
    
    // Then get their direct connections
    const connections = await this.getInfluencerConnectionsByInfluencerId(influencerId);
    
    // Get the connected influencers
    const connectedInfluencerIds = connections
      .filter(c => c.connectedToType === 'influencer')
      .map(c => c.connectedToId)
      .filter((id): id is number => id !== undefined);
    
    const connectedInfluencers = connectedInfluencerIds.length > 0 
      ? await db.select()
        .from(powerInfluencers).$dynamic()
        .where(inArray(powerInfluencers.id, connectedInfluencerIds))
      : [];
    
    // Build nodes and edges
    const nodes = [
      { 
        id: coreInfluencer.id, 
        label: coreInfluencer.name, 
        type: coreInfluencer.type,
        size: 20, // Core node is larger
        color: '#e74c3c' // Different color for core
      },
      ...connectedInfluencers.map(inf => ({
        id: inf.id,
        label: inf.name,
        type: inf.type,
        size: 10,
        color: '#3498db'
      })),
      ...connections
        .filter(c => c.connectedToType !== 'influencer') // Only non-influencer entities
        .map(c => ({
          id: `${c.connectedToType}-${c.connectedToId || c.id}`,
          label: c.connectedToName,
          type: c.connectedToType,
          size: 7,
          color: '#2ecc71'
        }))
    ];
    
    const edges = [
      ...connections.map(c => ({
        from: coreInfluencer.id,
        to: c.connectedToType === 'influencer' 
          ? c.connectedToId 
          : `${c.connectedToType}-${c.connectedToId || c.id}`,
        label: c.relationshipType,
        value: c.relationshipStrength || 1,
        title: c.connectionDescription || c.relationshipType
      }))
    ];
    
    return { nodes, edges };
  }
  
  async getInfluencerCardData(influencerId: number): Promise<{
    influencer: PowerInfluencer, 
    details: Consultant | MegaInfluencer | null,
    clients?: ConsultantClient[],
    campaigns?: ConsultantCampaign[],
    topicInfluence: BillTopicInfluence[],
    donations: InfluencerDonation[],
    connections: InfluencerConnection[],
    billRecords: BillInfluenceRecord[],
    heatmapData: InfluenceHeatmapData[]
  }> {
    // Get the base influencer data
    const influencer = await this.getPowerInfluencerById(influencerId);
    if (!influencer) {
      throw new Error(`Influencer with ID ${influencerId} not found`);
    }
    
    // Get type-specific details
    let details: Consultant | MegaInfluencer | null = null;
    let clients: ConsultantClient[] = [];
    let campaigns: ConsultantCampaign[] = [];
    
    if (influencer.type === 'consultant') {
      const consultant = await this.getConsultantByInfluencerId(influencerId);
      if (consultant) {
        details = consultant;
        clients = await this.getConsultantClientsByConsultantId(consultant.id);
        campaigns = await this.getConsultantCampaignsByConsultantId(consultant.id);
      }
    } else if (influencer.type === 'mega_influencer') {
      const megaInfluencer = await this.getMegaInfluencerByInfluencerId(influencerId);
      if (megaInfluencer) {
        details = megaInfluencer;
      }
    }
    
    // Get related data
    const topicInfluence = await this.getBillTopicInfluenceByInfluencerId(influencerId);
    const donations = await this.getInfluencerDonationsByInfluencerId(influencerId);
    const connections = await this.getInfluencerConnectionsByInfluencerId(influencerId);
    const billRecords = await this.getBillInfluenceRecordsByInfluencerId(influencerId);
    const heatmapData = await this.getInfluenceHeatmapDataByInfluencerId(influencerId);
    
    return {
      influencer,
      details,
      ...(influencer.type === 'consultant' ? { clients, campaigns } : {}),
      topicInfluence,
      donations,
      connections,
      billRecords,
      heatmapData
    };
  }
}

export const powerInfluencersStorage = new DatabasePowerInfluencersStorage();