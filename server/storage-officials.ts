// @ts-nocheck
import { db } from './db';
import { 
  stateOfficials, 
  districts, 
  campaignFinances, 
  lobbyingEntities, 
  lobbyingRelationships,
  advocacyArguments,
  type StateOfficial,
  type District,
  type CampaignFinance,
  type LobbyingEntity,
  type LobbyingRelationship,
  type AdvocacyArgument,
  type InsertStateOfficial,
  type InsertDistrict,
  type InsertCampaignFinance,
  type InsertLobbyingEntity,
  type InsertLobbyingRelationship,
  type InsertAdvocacyArgument
} from '@shared/schema-officials';
import { eq, desc, asc, and, or, sql, inArray } from 'drizzle-orm';

export interface IOfficialsStorage {
  // State Officials
  getOfficialById(id: number): Promise<StateOfficial | undefined>;
  getOfficialByName(name: string): Promise<StateOfficial | undefined>;
  getOfficialsByDistrict(districtId: number): Promise<StateOfficial[]>;
  getOfficialsByType(officialType: string): Promise<StateOfficial[]>;
  getOfficialsByStatus(status: string): Promise<StateOfficial[]>;
  getOfficialsByParty(party: string): Promise<StateOfficial[]>;
  getAllOfficials(
    limit?: number, 
    offset?: number, 
    orderBy?: string
  ): Promise<StateOfficial[]>;
  countOfficials(): Promise<number>;
  createOfficial(data: InsertStateOfficial): Promise<StateOfficial>;
  updateOfficial(id: number, data: Partial<InsertStateOfficial>): Promise<StateOfficial | undefined>;
  deleteOfficial(id: number): Promise<boolean>;
  
  // Districts
  getDistrictById(id: number): Promise<District | undefined>;
  getDistrictByName(name: string): Promise<District | undefined>;
  getAllDistricts(
    limit?: number, 
    offset?: number
  ): Promise<District[]>;
  createDistrict(data: InsertDistrict): Promise<District>;
  updateDistrict(id: number, data: Partial<InsertDistrict>): Promise<District | undefined>;
  deleteDistrict(id: number): Promise<boolean>;
  
  // Campaign Finances
  getCampaignFinanceByOfficialId(officialId: number): Promise<CampaignFinance[]>;
  createCampaignFinance(data: InsertCampaignFinance): Promise<CampaignFinance>;
  updateCampaignFinance(id: number, data: Partial<InsertCampaignFinance>): Promise<CampaignFinance | undefined>;
  deleteCampaignFinance(id: number): Promise<boolean>;
  
  // Lobbying Entities
  getLobbyingEntityById(id: number): Promise<LobbyingEntity | undefined>;
  getLobbyingEntitiesByIndustry(industry: string): Promise<LobbyingEntity[]>;
  getAllLobbyingEntities(
    limit?: number, 
    offset?: number
  ): Promise<LobbyingEntity[]>;
  createLobbyingEntity(data: InsertLobbyingEntity): Promise<LobbyingEntity>;
  updateLobbyingEntity(id: number, data: Partial<InsertLobbyingEntity>): Promise<LobbyingEntity | undefined>;
  deleteLobbyingEntity(id: number): Promise<boolean>;
  
  // Lobbying Relationships
  getLobbyingRelationshipsForOfficial(officialId: number): Promise<LobbyingRelationship[]>;
  getLobbyingRelationshipsForEntity(entityId: number): Promise<LobbyingRelationship[]>;
  createLobbyingRelationship(data: InsertLobbyingRelationship): Promise<LobbyingRelationship>;
  updateLobbyingRelationship(id: number, data: Partial<InsertLobbyingRelationship>): Promise<LobbyingRelationship | undefined>;
  deleteLobbyingRelationship(id: number): Promise<boolean>;
  
  // Advocacy Arguments
  getAdvocacyArgumentsForOfficial(officialId: number): Promise<AdvocacyArgument[]>;
  getAdvocacyArgumentsByIssue(issueArea: string): Promise<AdvocacyArgument[]>;
  createAdvocacyArgument(data: InsertAdvocacyArgument): Promise<AdvocacyArgument>;
  updateAdvocacyArgument(id: number, data: Partial<InsertAdvocacyArgument>): Promise<AdvocacyArgument | undefined>;
  deleteAdvocacyArgument(id: number): Promise<boolean>;
}

export class DBOfficialsStorage implements IOfficialsStorage {
  // State Officials
  async getOfficialById(id: number): Promise<StateOfficial | undefined> {
    const result = await db.select().from(stateOfficials).$dynamic().where(eq(stateOfficials.id, id));
    return result[0];
  }
  
  async getOfficialByName(name: string): Promise<StateOfficial | undefined> {
    const result = await db.select().from(stateOfficials).$dynamic().where(eq(stateOfficials.name, name));
    return result[0];
  }
  
  async getOfficialsByDistrict(districtId: number): Promise<StateOfficial[]> {
    return await db.select().from(stateOfficials).$dynamic().where(eq(stateOfficials.districtId, districtId));
  }
  
  async getOfficialsByType(officialType: string): Promise<StateOfficial[]> {
    return await db.select().from(stateOfficials).$dynamic().where(eq(stateOfficials.officialType, officialType));
  }
  
  async getOfficialsByStatus(status: string): Promise<StateOfficial[]> {
    return await db.select().from(stateOfficials).$dynamic().where(eq(stateOfficials.officialStatus, status));
  }
  
  async getOfficialsByParty(party: string): Promise<StateOfficial[]> {
    return await db.select().from(stateOfficials).$dynamic().where(eq(stateOfficials.party, party));
  }
  
  async getAllOfficials(
    limit: number = 50, 
    offset: number = 0, 
    orderBy: string = 'name'
  ): Promise<StateOfficial[]> {
    let query = db.select().from(stateOfficials).$dynamic();
    
    if (orderBy === 'name') {
      query = query.orderBy(asc(stateOfficials.name));
    } else if (orderBy === 'type') {
      query = query.orderBy(asc(stateOfficials.officialType));
    } else if (orderBy === 'party') {
      query = query.orderBy(asc(stateOfficials.party));
    }
    
    return await query.limit(limit).offset(offset);
  }
  
  async countOfficials(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(stateOfficials);
    return Number(result[0].count);
  }
  
  async createOfficial(data: InsertStateOfficial): Promise<StateOfficial> {
    const result = await db.insert(stateOfficials).values(data).returning();
    return result[0];
  }
  
  async updateOfficial(id: number, data: Partial<InsertStateOfficial>): Promise<StateOfficial | undefined> {
    const result = await db.update(stateOfficials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(stateOfficials.id, id))
      .returning();
    return result[0];
  }
  
  async deleteOfficial(id: number): Promise<boolean> {
    const result = await db.delete(stateOfficials).where(eq(stateOfficials.id, id));
    return !!result;
  }
  
  // Districts
  async getDistrictById(id: number): Promise<District | undefined> {
    const result = await db.select().from(districts).$dynamic().where(eq(districts.id, id));
    return result[0];
  }
  
  async getDistrictByName(name: string): Promise<District | undefined> {
    const result = await db.select().from(districts).$dynamic().where(eq(districts.name, name));
    return result[0];
  }
  
  async getAllDistricts(
    limit: number = 50, 
    offset: number = 0
  ): Promise<District[]> {
    return await db.select().from(districts).orderBy(asc(districts.name)).limit(limit).offset(offset);
  }
  
  async createDistrict(data: InsertDistrict): Promise<District> {
    const result = await db.insert(districts).values(data).returning();
    return result[0];
  }
  
  async updateDistrict(id: number, data: Partial<InsertDistrict>): Promise<District | undefined> {
    const result = await db.update(districts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(districts.id, id))
      .returning();
    return result[0];
  }
  
  async deleteDistrict(id: number): Promise<boolean> {
    const result = await db.delete(districts).where(eq(districts.id, id));
    return !!result;
  }
  
  // Campaign Finances
  async getCampaignFinanceByOfficialId(officialId: number): Promise<CampaignFinance[]> {
    return await db.select().from(campaignFinances).$dynamic()
      .where(eq(campaignFinances.officialId, officialId))
      .orderBy(desc(campaignFinances.reportingPeriod));
  }
  
  async createCampaignFinance(data: InsertCampaignFinance): Promise<CampaignFinance> {
    const result = await db.insert(campaignFinances).values(data).returning();
    return result[0];
  }
  
  async updateCampaignFinance(id: number, data: Partial<InsertCampaignFinance>): Promise<CampaignFinance | undefined> {
    const result = await db.update(campaignFinances)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(campaignFinances.id, id))
      .returning();
    return result[0];
  }
  
  async deleteCampaignFinance(id: number): Promise<boolean> {
    const result = await db.delete(campaignFinances).where(eq(campaignFinances.id, id));
    return !!result;
  }
  
  // Lobbying Entities
  async getLobbyingEntityById(id: number): Promise<LobbyingEntity | undefined> {
    const result = await db.select().from(lobbyingEntities).$dynamic().where(eq(lobbyingEntities.id, id));
    return result[0];
  }
  
  async getLobbyingEntitiesByIndustry(industry: string): Promise<LobbyingEntity[]> {
    return await db.select().from(lobbyingEntities).$dynamic().where(eq(lobbyingEntities.industry, industry));
  }
  
  async getAllLobbyingEntities(
    limit: number = 50, 
    offset: number = 0
  ): Promise<LobbyingEntity[]> {
    return await db.select().from(lobbyingEntities)
      .orderBy(asc(lobbyingEntities.name))
      .limit(limit)
      .offset(offset);
  }
  
  async createLobbyingEntity(data: InsertLobbyingEntity): Promise<LobbyingEntity> {
    const result = await db.insert(lobbyingEntities).values(data).returning();
    return result[0];
  }
  
  async updateLobbyingEntity(id: number, data: Partial<InsertLobbyingEntity>): Promise<LobbyingEntity | undefined> {
    const result = await db.update(lobbyingEntities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lobbyingEntities.id, id))
      .returning();
    return result[0];
  }
  
  async deleteLobbyingEntity(id: number): Promise<boolean> {
    const result = await db.delete(lobbyingEntities).where(eq(lobbyingEntities.id, id));
    return !!result;
  }
  
  // Lobbying Relationships
  async getLobbyingRelationshipsForOfficial(officialId: number): Promise<LobbyingRelationship[]> {
    return await db.select().from(lobbyingRelationships).$dynamic()
      .where(eq(lobbyingRelationships.officialId, officialId))
      .orderBy(desc(lobbyingRelationships.strength));
  }
  
  async getLobbyingRelationshipsForEntity(entityId: number): Promise<LobbyingRelationship[]> {
    return await db.select().from(lobbyingRelationships).$dynamic()
      .where(eq(lobbyingRelationships.entityId, entityId))
      .orderBy(desc(lobbyingRelationships.strength));
  }
  
  async createLobbyingRelationship(data: InsertLobbyingRelationship): Promise<LobbyingRelationship> {
    const result = await db.insert(lobbyingRelationships).values(data).returning();
    return result[0];
  }
  
  async updateLobbyingRelationship(id: number, data: Partial<InsertLobbyingRelationship>): Promise<LobbyingRelationship | undefined> {
    const result = await db.update(lobbyingRelationships)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lobbyingRelationships.id, id))
      .returning();
    return result[0];
  }
  
  async deleteLobbyingRelationship(id: number): Promise<boolean> {
    const result = await db.delete(lobbyingRelationships).where(eq(lobbyingRelationships.id, id));
    return !!result;
  }
  
  // Advocacy Arguments
  async getAdvocacyArgumentsForOfficial(officialId: number): Promise<AdvocacyArgument[]> {
    return await db.select().from(advocacyArguments).$dynamic()
      .where(eq(advocacyArguments.officialId, officialId))
      .orderBy(asc(advocacyArguments.issueArea));
  }
  
  async getAdvocacyArgumentsByIssue(issueArea: string): Promise<AdvocacyArgument[]> {
    return await db.select().from(advocacyArguments).$dynamic()
      .where(eq(advocacyArguments.issueArea, issueArea));
  }
  
  async createAdvocacyArgument(data: InsertAdvocacyArgument): Promise<AdvocacyArgument> {
    const result = await db.insert(advocacyArguments).values(data).returning();
    return result[0];
  }
  
  async updateAdvocacyArgument(id: number, data: Partial<InsertAdvocacyArgument>): Promise<AdvocacyArgument | undefined> {
    const result = await db.update(advocacyArguments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(advocacyArguments.id, id))
      .returning();
    return result[0];
  }
  
  async deleteAdvocacyArgument(id: number): Promise<boolean> {
    const result = await db.delete(advocacyArguments).where(eq(advocacyArguments.id, id));
    return !!result;
  }
}

// Export an instance of the storage implementation
export const officialsStorage = new DBOfficialsStorage();