import { db } from "./db";
import {
  eq,
  asc,
  desc,
  and,
  or,
  like,
  inArray,
  sql,
  count,
  ilike,
  not,
  isNotNull,
  isNull
} from "drizzle-orm";
import {
  users, 
  bills, 
  userBillTracking, 
  billFollows,
  representatives, 
  repResponses, 
  userRepTracking,
  legislativeSessions,
  billHistoryEvents,
  pointsOfOrder,
  billNotes,
  billHighlights,
  billShares,
  // Ethics module imports
  lobbyists, 
  lobbyFirms, 
  lobbyingActivities, 
  campaignFinance, 
  newsFlags, 
  ethicsViolations, 
  honestyIndex,
  type User, 
  type InsertUser, 
  type Bill, 
  type Representative, 
  type InsertRepresentative, 
  type UserRepTracking, 
  type InsertUserRepTracking, 
  type UserBillTracking, 
  type InsertUserBillTracking,
  type BillFollow,
  type InsertBillFollow,
  type RepResponse, 
  type InsertRepResponse,
  type LegislativeSession, 
  type InsertLegislativeSession
} from "@shared/schema";

import { 
  type Legislator, 
  type InsertLegislator 
} from "@shared/schema-legislators";

import {
  billVersions,
  billAmendments,
  type BillVersion,
  type InsertBillVersion,
  type BillAmendment,
  type InsertBillAmendment
} from "@shared/schema-bill-versions";

import { 
  type Lobbyist, 
  type InsertLobbyist, 
  type LobbyFirm, 
  type InsertLobbyFirm,
  type LobbyingActivity, 
  type InsertLobbyingActivity,
  type CampaignFinance, 
  type InsertCampaignFinance,
  type NewsFlag, 
  type InsertNewsFlag,
  type EthicsViolation, 
  type InsertEthicsViolation, 
  type HonestyIndex, 
  type InsertHonestyIndex
} from "@shared/schema-ethics";

import {
  politicalEntities,
  financialTransactions,
  committees,
  candidates,
  entityRelationships,
  type PoliticalEntity, 
  type InsertPoliticalEntity,
  type FinancialTransaction, 
  type InsertFinancialTransaction,
  type Committee, 
  type InsertCommittee,
  type Candidate, 
  type InsertCandidate,
  type EntityRelationship, 
  type InsertEntityRelationship
} from "@shared/schema-campaign-finance";

// Define BillFilters interface since it's not exported from schema.ts
export interface BillFilters {
  search?: string;
  status?: string;
  chamber?: string;
  subject?: string;
  author?: string;
  stage?: string;
  tracked?: boolean;
  userId?: number;
  limit?: number;
  page?: number;
}

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Bill methods
  getBillById(id: string): Promise<Bill | undefined>;
  getBill(id: string): Promise<Bill | undefined>; // Alias for getBillById for bill comparison
  searchBills(filters: BillFilters): Promise<Bill[]>;
  searchBills(query: string): Promise<Bill[]>; // Overload for simple string query searches
  getTrackedBillsCount(userId: number): Promise<number>;
  getTotalBillsCount(filters: Omit<BillFilters, "limit" | "page">): Promise<number>;
  getRecentBills(limit?: number): Promise<Bill[]>;
  getPopularBills(limit?: number): Promise<Bill[]>;
  
  // Bill Versions methods
  getBillVersions(billId: string): Promise<BillVersion[]>;
  createBillVersion(version: InsertBillVersion): Promise<BillVersion>;
  
  // Bill Amendments methods
  getBillAmendments(billId: string): Promise<BillAmendment[]>;
  createBillAmendment(amendment: InsertBillAmendment): Promise<BillAmendment>;
  
  // Bill tracking methods
  getUserBillTracking(userId: number): Promise<(UserBillTracking & { bill: Bill })[]>;
  trackBill(userId: number, billId: string): Promise<UserBillTracking>;
  untrackBill(userId: number, billId: string): Promise<void>;
  isUserTrackingBill(userId: number, billId: string): Promise<boolean>;
  
  // Bill follows methods
  getUserBillFollows(userId: number): Promise<(BillFollow & { bill: Bill })[]>;
  followBill(userId: number, billId: string): Promise<BillFollow>;
  unfollowBill(userId: number, billId: string): Promise<void>;
  isUserFollowingBill(userId: number, billId: string): Promise<boolean>;
  
  // Representative methods
  createRepresentative(rep: InsertRepresentative): Promise<Representative>;
  getRepresentativeById(id: number): Promise<Representative | undefined>;
  getAllRepresentatives(): Promise<Representative[]>;
  getRepresentativesByDistrict(district: string): Promise<Representative[]>;
  
  // Legislator methods
  getLegislatorById(id: number): Promise<Legislator | undefined>;
  getAllLegislators(): Promise<Legislator[]>;
  getLegislatorsByDistrict(district: string): Promise<Legislator[]>;
  
  // Rep response methods
  getRepResponsesByRepId(repId: number): Promise<RepResponse[]>;
  
  // User rep tracking methods
  createUserRepTracking(tracking: InsertUserRepTracking): Promise<UserRepTracking>;
  getUserRepTracking(userId: number, repId: number): Promise<UserRepTracking | undefined>;
  
  // Ethics methods
  getAllLobbyists(options?: { limit?: number; offset?: number }): Promise<Lobbyist[]>;
  getLobbyistById(id: number): Promise<Lobbyist | undefined>;
  getLobbyistsByNameSearch(query: string): Promise<Lobbyist[]>;
  createLobbyist(data: InsertLobbyist): Promise<Lobbyist>;
  updateLobbyist(id: number, data: Partial<Lobbyist>): Promise<Lobbyist | undefined>;
  getAllLobbyFirms(options?: { limit?: number; offset?: number }): Promise<LobbyFirm[]>;
  getLobbyFirmById(id: number): Promise<LobbyFirm | undefined>;
  getLobbyistsByFirmId(firmId: number): Promise<Lobbyist[]>;
  createLobbyFirm(data: InsertLobbyFirm): Promise<LobbyFirm>;
  updateLobbyFirm(id: number, data: Partial<LobbyFirm>): Promise<LobbyFirm | undefined>;
  getLobbyingActivitiesByLobbyistId(lobbyistId: number): Promise<LobbyingActivity[]>;
  getLobbyingActivitiesByBillId(billId: string): Promise<LobbyingActivity[]>;
  getLobbyingActivitiesByRepresentativeId(repId: number): Promise<LobbyingActivity[]>;
  createLobbyingActivity(data: InsertLobbyingActivity): Promise<LobbyingActivity>;
  getCampaignFinanceByRepId(repId: number): Promise<CampaignFinance[]>;
  getCampaignFinanceByDonorName(donorName: string): Promise<CampaignFinance[]>;
  createCampaignFinance(data: InsertCampaignFinance): Promise<CampaignFinance>;
  getNewsFlagsByRepId(repId: number): Promise<NewsFlag[]>;
  createNewsFlag(data: InsertNewsFlag): Promise<NewsFlag>;
  getEthicsViolationsByRepId(repId: number): Promise<EthicsViolation[]>;
  createEthicsViolation(data: InsertEthicsViolation): Promise<EthicsViolation>;
  getHonestyIndexByRepId(repId: number): Promise<HonestyIndex | undefined>;
  createHonestyIndex(data: InsertHonestyIndex): Promise<HonestyIndex>;
  updateHonestyIndex(repId: number, data: Partial<HonestyIndex>): Promise<HonestyIndex | undefined>;
  
  // Campaign Finance methods
  // Political Entities
  createPoliticalEntity(data: InsertPoliticalEntity): Promise<PoliticalEntity>;
  getPoliticalEntityById(id: string): Promise<PoliticalEntity | undefined>;
  getPoliticalEntitiesByType(entityType: string, options?: { limit?: number, offset?: number }): Promise<PoliticalEntity[]>;
  getPoliticalEntitiesByName(name: string): Promise<PoliticalEntity[]>;
  updatePoliticalEntity(id: string, data: Partial<PoliticalEntity>): Promise<PoliticalEntity | undefined>;
  
  // Financial Transactions
  createFinancialTransaction(data: InsertFinancialTransaction): Promise<FinancialTransaction>;
  getFinancialTransactionById(id: string): Promise<FinancialTransaction | undefined>;
  getFinancialTransactionsBySourceEntityId(sourceEntityId: string): Promise<FinancialTransaction[]>;
  getFinancialTransactionsByTargetEntityId(targetEntityId: string): Promise<FinancialTransaction[]>;
  getFinancialTransactionsByType(transactionType: string, options?: { limit?: number, offset?: number }): Promise<FinancialTransaction[]>;
  
  // Committees
  createCommittee(data: InsertCommittee): Promise<Committee>;
  getCommitteeById(id: string): Promise<Committee | undefined>;
  getCommitteesByEntityId(entityId: string): Promise<Committee[]>;
  getCommitteesByType(committeeType: string): Promise<Committee[]>;
  
  // Candidates
  createCandidate(data: InsertCandidate): Promise<Candidate>;
  getCandidateById(id: string): Promise<Candidate | undefined>;
  getCandidatesByEntityId(entityId: string): Promise<Candidate[]>;
  getCandidatesByOffice(office: string): Promise<Candidate[]>;
  getCandidatesByDistrict(district: string): Promise<Candidate[]>;
  
  // Entity Relationships
  createEntityRelationship(data: InsertEntityRelationship): Promise<EntityRelationship>;
  getEntityRelationshipById(id: string): Promise<EntityRelationship | undefined>;
  getEntityRelationshipsBySourceId(sourceEntityId: string): Promise<EntityRelationship[]>;
  getEntityRelationshipsByTargetId(targetEntityId: string): Promise<EntityRelationship[]>;
  getEntityRelationshipsByType(relationshipType: string): Promise<EntityRelationship[]>;
}

// Export the DatabaseStorage class
export class DatabaseStorage implements IStorage {
  // Bill Versions methods
  async getBillVersions(billId: string): Promise<BillVersion[]> {
    return db.select()
      .from(billVersions).$dynamic()
      .where(eq(billVersions.billId, billId))
      .orderBy(desc(billVersions.date));
  }
  
  async createBillVersion(version: InsertBillVersion): Promise<BillVersion> {
    const [billVersion] = await db
      .insert(billVersions)
      .values(version)
      .returning();
    return billVersion;
  }
  
  // Bill Amendments methods
  async getBillAmendments(billId: string): Promise<BillAmendment[]> {
    return db.select()
      .from(billAmendments).$dynamic()
      .where(eq(billAmendments.billId, billId))
      .orderBy(desc(billAmendments.date));
  }
  
  async createBillAmendment(amendment: InsertBillAmendment): Promise<BillAmendment> {
    const [billAmendment] = await db
      .insert(billAmendments)
      .values(amendment)
      .returning();
    return billAmendment;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).$dynamic().where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).$dynamic().where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(
    id: number,
    userData: Partial<User>
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
  
  // Authentication helper method
  async checkUserPassword(password: string, hashedPassword: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, hashedPassword);
  }
  
  // CAMPAIGN FINANCE METHODS - POLITICAL ENTITIES
  async createPoliticalEntity(data: InsertPoliticalEntity): Promise<PoliticalEntity> {
    const [entity] = await db.insert(politicalEntities).values(data as any).returning();
    return entity;
  }
  
  async getPoliticalEntityById(id: string): Promise<PoliticalEntity | undefined> {
    const result = await db.select().from(politicalEntities).$dynamic().where(eq(politicalEntities.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async getPoliticalEntitiesByType(entityType: string, options?: { limit?: number, offset?: number }): Promise<PoliticalEntity[]> {
    let query = db.select().from(politicalEntities).$dynamic()
      .where(eq(politicalEntities.entity_type, entityType as any))
      .orderBy(asc(politicalEntities.name));
    
    if (options) {
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }
    }
    
    return query;
  }
  
  async getPoliticalEntitiesByName(name: string): Promise<PoliticalEntity[]> {
    return db.select().from(politicalEntities).$dynamic()
      .where(ilike(politicalEntities.name, `%${name}%`))
      .orderBy(asc(politicalEntities.name));
  }
  
  async updatePoliticalEntity(id: string, data: Partial<PoliticalEntity>): Promise<PoliticalEntity | undefined> {
    const [updated] = await db.update(politicalEntities)
      .set({...data, updated_at: new Date()})
      .where(eq(politicalEntities.id, id))
      .returning();
    return updated;
  }
  
  // FINANCIAL TRANSACTIONS
  async createFinancialTransaction(data: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [transaction] = await db.insert(financialTransactions).values(data as any).returning();
    return transaction;
  }
  
  async getFinancialTransactionById(id: string): Promise<FinancialTransaction | undefined> {
    const result = await db.select().from(financialTransactions).$dynamic().where(eq(financialTransactions.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async getFinancialTransactionsBySourceEntityId(sourceEntityId: string): Promise<FinancialTransaction[]> {
    return db.select().from(financialTransactions).$dynamic()
      .where(eq(financialTransactions.source_entity_id, sourceEntityId))
      .orderBy(desc(financialTransactions.transaction_date));
  }
  
  async getFinancialTransactionsByTargetEntityId(targetEntityId: string): Promise<FinancialTransaction[]> {
    return db.select().from(financialTransactions).$dynamic()
      .where(eq(financialTransactions.target_entity_id, targetEntityId))
      .orderBy(desc(financialTransactions.transaction_date));
  }
  
  async getFinancialTransactionsByType(transactionType: string, options?: { limit?: number, offset?: number }): Promise<FinancialTransaction[]> {
    let query = db.select().from(financialTransactions).$dynamic()
      .where(eq(financialTransactions.transaction_type, transactionType as any))
      .orderBy(desc(financialTransactions.transaction_date));
    
    if (options) {
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }
    }
    
    return query;
  }
  
  // COMMITTEES
  async createCommittee(data: InsertCommittee): Promise<Committee> {
    const [committee] = await db.insert(committees).values(data).returning();
    return committee;
  }
  
  async getCommitteeById(id: string): Promise<Committee | undefined> {
    const result = await db.select().from(committees).$dynamic().where(eq(committees.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async getCommitteesByEntityId(entityId: string): Promise<Committee[]> {
    return db.select().from(committees).$dynamic()
      .where(eq(committees.entity_id, entityId))
      .orderBy(asc(committees.committee_type));
  }
  
  async getCommitteesByType(committeeType: string): Promise<Committee[]> {
    return db.select().from(committees).$dynamic()
      .where(eq(committees.committee_type, committeeType))
      .orderBy(asc(committees.entity_id));
  }
  
  // CANDIDATES
  async createCandidate(data: InsertCandidate): Promise<Candidate> {
    const [candidate] = await db.insert(candidates).values(data).returning();
    return candidate;
  }
  
  async getCandidateById(id: string): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).$dynamic().where(eq(candidates.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async getCandidatesByEntityId(entityId: string): Promise<Candidate[]> {
    return db.select().from(candidates).$dynamic()
      .where(eq(candidates.entity_id, entityId))
      .orderBy(desc(candidates.election_year));
  }
  
  async getCandidatesByOffice(office: string): Promise<Candidate[]> {
    return db.select().from(candidates).$dynamic()
      .where(eq(candidates.office, office))
      .orderBy(asc(candidates.state), asc(candidates.district));
  }
  
  async getCandidatesByDistrict(district: string): Promise<Candidate[]> {
    return db.select().from(candidates).$dynamic()
      .where(eq(candidates.district, district))
      .orderBy(asc(candidates.office), desc(candidates.election_year));
  }
  
  // ENTITY RELATIONSHIPS
  async createEntityRelationship(data: InsertEntityRelationship): Promise<EntityRelationship> {
    const [relationship] = await db.insert(entityRelationships).values(data).returning();
    return relationship;
  }
  
  async getEntityRelationshipById(id: string): Promise<EntityRelationship | undefined> {
    const result = await db.select().from(entityRelationships).$dynamic().where(eq(entityRelationships.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async getEntityRelationshipsBySourceId(sourceEntityId: string): Promise<EntityRelationship[]> {
    return db.select().from(entityRelationships).$dynamic()
      .where(eq(entityRelationships.source_entity_id, sourceEntityId))
      .orderBy(asc(entityRelationships.relationship_type));
  }
  
  async getEntityRelationshipsByTargetId(targetEntityId: string): Promise<EntityRelationship[]> {
    return db.select().from(entityRelationships).$dynamic()
      .where(eq(entityRelationships.target_entity_id, targetEntityId))
      .orderBy(asc(entityRelationships.relationship_type));
  }
  
  async getEntityRelationshipsByType(relationshipType: string): Promise<EntityRelationship[]> {
    return db.select().from(entityRelationships).$dynamic()
      .where(eq(entityRelationships.relationship_type, relationshipType))
      .orderBy(asc(entityRelationships.source_entity_id));
  }

  // BILL METHODS
  async getAllBills(): Promise<Bill[]> {
    return db.select().from(bills).orderBy(desc(bills.lastActionAt));
  }
  
  async getBillById(id: string): Promise<Bill | undefined> {
    const result = await db.select().from(bills).$dynamic().where(eq(bills.id, id));
    return result.length ? result[0] : undefined;
  }
  
  // Alias for getBillById used in bill comparison feature
  async getBill(id: string): Promise<Bill | undefined> {
    return this.getBillById(id);
  }
  
  async getBillsByStatus(status: string): Promise<Bill[]> {
    if (status === 'all') {
      return this.getAllBills();
    }
    return db.select().from(bills).$dynamic().where(eq(bills.status, status))
      .orderBy(desc(bills.lastActionAt));
  }
  
  async getBillsByChamber(chamber: string): Promise<Bill[]> {
    if (chamber === 'all') {
      return this.getAllBills();
    }
    return db.select().from(bills).$dynamic().where(eq(bills.chamber, chamber))
      .orderBy(desc(bills.lastActionAt));
  }
  
  // Overloaded searchBills method that handles both BillFilters and simple string searches
  async searchBills(filtersOrQuery: BillFilters | string): Promise<Bill[]> {
    // If it's a string, convert it to a BillFilters object
    if (typeof filtersOrQuery === 'string') {
      return this.searchBills({
        search: filtersOrQuery
      });
    }
    
    // Otherwise, treat it as BillFilters
    const filters = filtersOrQuery as BillFilters;
    let query = db.select().from(bills).$dynamic();
    
    if (filters.search) {
      query = query.where(
        or(
          like(bills.title, `%${filters.search}%`),
          like(bills.description, `%${filters.search}%`),
          like(bills.id, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.status) {
      query = query.where(eq(bills.status, filters.status));
    }
    
    if (filters.chamber) {
      query = query.where(eq(bills.chamber, filters.chamber));
    }
    
    if (filters.subject) {
      // Assuming 'topics' is an array field and we want to find bills where any topic matches
      query = query.where(sql`${filters.subject} = ANY(${bills.topics})`);
    }
    
    if (filters.author) {
      // Assuming 'sponsors' is an array field and we want to find bills where any sponsor matches
      query = query.where(sql`${filters.author} = ANY(${bills.sponsors})`);
    }
    
    if (filters.stage) {
      query = query.where(eq(bills.status, filters.stage));
    }
    
    if (filters.tracked && filters.userId) {
      const trackedBillIds = await db
        .select({ billId: userBillTracking.billId })
        .from(userBillTracking).$dynamic()
        .where(eq(userBillTracking.userId, filters.userId));
      
      if (trackedBillIds.length > 0) {
        const trackedIds = trackedBillIds.map(row => row.billId);
        query = query.where(inArray(bills.id, trackedIds));
      } else {
        // If there are no tracked bills, return empty array
        return [];
      }
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.offset(offset);
    }
    
    return query.orderBy(desc(bills.lastActionAt));
  }
  
  async getTrackedBillsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(userBillTracking).$dynamic()
      .where(eq(userBillTracking.userId, userId));
    
    return parseInt(result[0].count as string);
  }
  
  async getTotalBillsCount(filters: Omit<BillFilters, "limit" | "page">): Promise<number> {
    let query = db.select({ count: sql`count(*)` }).from(bills).$dynamic();
    
    if (filters.search) {
      query = query.where(
        or(
          like(bills.title, `%${filters.search}%`),
          like(bills.description, `%${filters.search}%`),
          like(bills.id, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.status) {
      query = query.where(eq(bills.status, filters.status));
    }
    
    if (filters.chamber) {
      query = query.where(eq(bills.chamber, filters.chamber));
    }
    
    if (filters.subject) {
      // Assuming 'topics' is an array field and we want to find bills where any topic matches
      query = query.where(sql`${filters.subject} = ANY(${bills.topics})`);
    }
    
    if (filters.author) {
      // Assuming 'sponsors' is an array field and we want to find bills where any sponsor matches
      query = query.where(sql`${filters.author} = ANY(${bills.sponsors})`);
    }
    
    if (filters.stage) {
      query = query.where(eq(bills.status, filters.stage));
    }
    
    if (filters.tracked && filters.userId) {
      const trackedBillIds = await db
        .select({ billId: userBillTracking.billId })
        .from(userBillTracking).$dynamic()
        .where(eq(userBillTracking.userId, filters.userId));
      
      if (trackedBillIds.length > 0) {
        const trackedIds = trackedBillIds.map(row => row.billId);
        query = query.where(inArray(bills.id, trackedIds));
      } else {
        return 0;
      }
    }
    
    const result = await query;
    return parseInt(result[0].count as string);
  }
  
  async getRecentBills(limit: number = 10): Promise<Bill[]> {
    return db
      .select()
      .from(bills)
      .orderBy(desc(bills.lastActionAt))
      .limit(limit);
  }
  
  async getPopularBills(limit: number = 10): Promise<Bill[]> {
    return db
      .select()
      .from(bills)
      .orderBy(desc(bills.communityComments))
      .limit(limit);
  }
  
  // BILL TRACKING METHODS
  async getUserBillTracking(userId: number): Promise<(UserBillTracking & { bill: Bill })[]> {
    const result = await db
      .select({
        userBillTracking: userBillTracking,
        bill: bills,
      })
      .from(userBillTracking)
      .innerJoin(bills, eq(userBillTracking.billId, bills.id))
      .where(eq(userBillTracking.userId, userId));

    return result.map((r) => ({
      ...r.userBillTracking,
      bill: r.bill,
    }));
  }

  async trackBill(userId: number, billId: string): Promise<UserBillTracking> {
    // Check if already tracking
    const existing = await db
      .select()
      .from(userBillTracking).$dynamic()
      .where(
        and(
          eq(userBillTracking.userId, userId),
          eq(userBillTracking.billId, billId)
        )
      );

    if (existing.length) {
      return existing[0];
    }

    // If not tracking, create new entry
    const [tracked] = await db
      .insert(userBillTracking)
      .values({
        userId,
        billId,
      })
      .returning();

    return tracked;
  }

  async untrackBill(userId: number, billId: string): Promise<void> {
    await db
      .delete(userBillTracking)
      .where(
        and(
          eq(userBillTracking.userId, userId),
          eq(userBillTracking.billId, billId)
        )
      );
  }

  async isUserTrackingBill(userId: number, billId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(userBillTracking).$dynamic()
      .where(
        and(
          eq(userBillTracking.userId, userId),
          eq(userBillTracking.billId, billId)
        )
      );
    return result.length > 0;
  }
  
  // BILL FOLLOWS METHODS
  async getUserBillFollows(userId: number): Promise<(BillFollow & { bill: Bill })[]> {
    const result = await db
      .select({
        billFollow: billFollows,
        bill: bills,
      })
      .from(billFollows)
      .innerJoin(bills, eq(billFollows.billId, bills.id))
      .where(eq(billFollows.userId, userId));

    return result.map((r) => ({
      ...r.billFollow,
      bill: r.bill,
    }));
  }

  async followBill(userId: number, billId: string): Promise<BillFollow> {
    // Check if already following
    const existing = await db
      .select()
      .from(billFollows).$dynamic()
      .where(
        and(
          eq(billFollows.userId, userId),
          eq(billFollows.billId, billId)
        )
      );

    if (existing.length) {
      return existing[0];
    }

    // If not following, create new entry
    const [followed] = await db
      .insert(billFollows)
      .values({
        userId,
        billId,
      })
      .returning();

    return followed;
  }

  async unfollowBill(userId: number, billId: string): Promise<void> {
    await db
      .delete(billFollows)
      .where(
        and(
          eq(billFollows.userId, userId),
          eq(billFollows.billId, billId)
        )
      );
  }

  async isUserFollowingBill(userId: number, billId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(billFollows).$dynamic()
      .where(
        and(
          eq(billFollows.userId, userId),
          eq(billFollows.billId, billId)
        )
      );
    
    return result.length > 0;
  }

  // REPRESENTATIVE METHODS
  async createRepresentative(rep: InsertRepresentative): Promise<Representative> {
    const [createdRep] = await db.insert(representatives).values(rep).returning();
    return createdRep;
  }

  async getRepresentativeById(id: number): Promise<Representative | undefined> {
    const [rep] = await db
      .select()
      .from(representatives).$dynamic()
      .where(eq(representatives.id, id));
    return rep;
  }

  async getAllRepresentatives(): Promise<Representative[]> {
    return db.select().from(representatives);
  }

  async getRepresentativesByDistrict(district: string): Promise<Representative[]> {
    return db
      .select()
      .from(representatives).$dynamic()
      .where(eq(representatives.district, district));
  }
  
  // LEGISLATOR METHODS
  async getLegislatorById(id: number): Promise<Legislator | undefined> {
    // This is a stub implementation - you'll need to replace with actual implementation
    // once you have a legislators table in your schema
    return { 
      id, 
      name: "Placeholder Legislator", 
      cartoonAvatarUrl: "",
      imageUrl: "",
      party: "Independent",
      chamber: "House",
      district: "1",
      term: "",
      biography: "",
      email: "",
      phone: "",
      committees: [],
      topDonors: [],
      donorCategories: []
    } as any;
  }

  async getAllLegislators(): Promise<Legislator[]> {
    // This is a stub implementation - you'll need to replace with actual implementation
    // once you have a legislators table in your schema
    return [
      { 
        id: 1, 
        name: "Placeholder Legislator 1", 
        cartoonAvatarUrl: "",
        imageUrl: "",
        party: "Independent",
        chamber: "House",
        district: "1",
        term: "",
        biography: "",
        email: "",
        phone: "",
        committees: [],
        topDonors: [],
        donorCategories: []
      } as any
    ];
  }

  async getLegislatorsByDistrict(district: string): Promise<Legislator[]> {
    // This is a stub implementation - you'll need to replace with actual implementation
    // once you have a legislators table in your schema
    return [
      { 
        id: 1, 
        name: `Placeholder Legislator for District ${district}`, 
        cartoonAvatarUrl: "",
        imageUrl: "",
        party: "Independent",
        chamber: "House",
        district,
        term: "",
        biography: "",
        email: "",
        phone: "",
        committees: [],
        topDonors: [],
        donorCategories: []
      } as any
    ];
  }

  async getRepResponsesByRepId(repId: number): Promise<RepResponse[]> {
    return db
      .select()
      .from(repResponses).$dynamic()
      .where(eq(repResponses.repId, repId))
      .orderBy(desc(repResponses.createdAt));
  }

  async createUserRepTracking(tracking: InsertUserRepTracking): Promise<UserRepTracking> {
    const [newTracking] = await db.insert(userRepTracking).values(tracking).returning();
    return newTracking;
  }

  async getUserRepTracking(userId: number, repId: number): Promise<UserRepTracking | undefined> {
    const [tracking] = await db
      .select()
      .from(userRepTracking).$dynamic()
      .where(
        and(
          eq(userRepTracking.userId, userId),
          eq(userRepTracking.repId, repId)
        )
      );
    return tracking;
  }

  // ETHICS METHODS
  // Lobbyist methods
  async getAllLobbyists(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Lobbyist[]> {
    const { limit = 50, offset = 0 } = options;
    return db.select().from(lobbyists).limit(limit).offset(offset);
  }

  async getLobbyistById(id: number): Promise<Lobbyist | undefined> {
    const [lobbyist] = await db.select().from(lobbyists).$dynamic().where(eq(lobbyists.id, id));
    return lobbyist || undefined;
  }

  async getLobbyistsByNameSearch(query: string): Promise<Lobbyist[]> {
    return db.select().from(lobbyists).$dynamic().where(
      or(
        like(lobbyists.name, `%${query}%`),
        // Assuming there's a registrationNumber field, adjust if needed
        like(lobbyists.firm, `%${query}%`)
      )
    );
  }

  async createLobbyist(data: InsertLobbyist): Promise<Lobbyist> {
    const [newLobbyist] = await db.insert(lobbyists).values(data).returning();
    return newLobbyist;
  }

  async updateLobbyist(id: number, data: Partial<Lobbyist>): Promise<Lobbyist | undefined> {
    const [updatedLobbyist] = await db
      .update(lobbyists)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(lobbyists.id, id))
      .returning();
    
    return updatedLobbyist || undefined;
  }

  // Lobby Firm methods
  async getAllLobbyFirms(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<LobbyFirm[]> {
    const { limit = 50, offset = 0 } = options;
    return db.select().from(lobbyFirms).limit(limit).offset(offset);
  }

  async getLobbyFirmById(id: number): Promise<LobbyFirm | undefined> {
    const [firm] = await db.select().from(lobbyFirms).$dynamic().where(eq(lobbyFirms.id, id));
    return firm || undefined;
  }

  async getLobbyistsByFirmId(firmId: number): Promise<Lobbyist[]> {
    // This assumes there's a firm field in lobbyists that matches firm name in lobbyFirms
    // You may need to adjust this query based on your actual schema relationship
    const [firm] = await db.select().from(lobbyFirms).$dynamic().where(eq(lobbyFirms.id, firmId));
    
    if (!firm) {
      return [];
    }
    
    return db.select().from(lobbyists).$dynamic().where(eq(lobbyists.firm, firm.name));
  }

  async createLobbyFirm(data: InsertLobbyFirm): Promise<LobbyFirm> {
    const [newFirm] = await db.insert(lobbyFirms).values(data).returning();
    return newFirm;
  }

  async updateLobbyFirm(id: number, data: Partial<LobbyFirm>): Promise<LobbyFirm | undefined> {
    const [updatedFirm] = await db
      .update(lobbyFirms)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(lobbyFirms.id, id))
      .returning();
    
    return updatedFirm || undefined;
  }

  // Lobbying Activity methods
  async getLobbyingActivitiesByLobbyistId(lobbyistId: number): Promise<LobbyingActivity[]> {
    return db.select().from(lobbyingActivities).$dynamic().where(eq(lobbyingActivities.lobbyistId, lobbyistId));
  }

  async getLobbyingActivitiesByBillId(billId: string): Promise<LobbyingActivity[]> {
    return db.select().from(lobbyingActivities).$dynamic().where(eq(lobbyingActivities.billId, billId));
  }

  async getLobbyingActivitiesByRepresentativeId(repId: number): Promise<LobbyingActivity[]> {
    return db.select().from(lobbyingActivities).$dynamic().where(eq(lobbyingActivities.legislatorId, repId));
  }
  
  async createLobbyingActivity(data: InsertLobbyingActivity): Promise<LobbyingActivity> {
    const [newActivity] = await db.insert(lobbyingActivities).values(data).returning();
    return newActivity;
  }

  // Campaign Finance methods
  async getCampaignFinanceByRepId(repId: number): Promise<CampaignFinance[]> {
    return db.select().from(campaignFinance).$dynamic().where(eq(campaignFinance.legislatorId, repId));
  }

  async getCampaignFinanceByDonorName(donorName: string): Promise<CampaignFinance[]> {
    return db.select().from(campaignFinance).$dynamic().where(like(campaignFinance.donorName, `%${donorName}%`));
  }

  async createCampaignFinance(data: InsertCampaignFinance): Promise<CampaignFinance> {
    const [newRecord] = await db.insert(campaignFinance).values(data).returning();
    return newRecord;
  }

  // News Flag methods
  async getNewsFlagsByRepId(repId: number): Promise<NewsFlag[]> {
    // This assumes there's a way to link newsFlags to representatives, adjust as needed
    // If there's no direct link, you might need to filter by relevantParties which contains repId
    return db.select().from(newsFlags).$dynamic().where(
      sql`${newsFlags.relevantParties} @> ${JSON.stringify([repId])}`
    );
  }

  async createNewsFlag(data: InsertNewsFlag): Promise<NewsFlag> {
    const [newFlag] = await db.insert(newsFlags).values(data).returning();
    return newFlag;
  }

  // Ethics Violation methods
  async getEthicsViolationsByRepId(repId: number): Promise<EthicsViolation[]> {
    return db.select().from(ethicsViolations).$dynamic().where(
      and(
        eq(ethicsViolations.subjectId, repId),
        eq(ethicsViolations.subjectType, 'legislator')
      )
    );
  }

  async createEthicsViolation(data: InsertEthicsViolation): Promise<EthicsViolation> {
    const [newViolation] = await db.insert(ethicsViolations).values(data).returning();
    return newViolation;
  }

  // Honesty Index methods
  async getHonestyIndexByRepId(repId: number): Promise<HonestyIndex | undefined> {
    const [index] = await db
      .select()
      .from(honestyIndex).$dynamic()
      .where(eq(honestyIndex.legislatorId, repId));
    return index || undefined;
  }

  async createHonestyIndex(data: InsertHonestyIndex): Promise<HonestyIndex> {
    const [newIndex] = await db.insert(honestyIndex).values(data).returning();
    return newIndex;
  }

  async updateHonestyIndex(repId: number, data: Partial<HonestyIndex>): Promise<HonestyIndex | undefined> {
    const [updatedIndex] = await db
      .update(honestyIndex)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(honestyIndex.legislatorId, repId))
      .returning();
    
    return updatedIndex || undefined;
  }
}

// Create a single instance
export const storage = new DatabaseStorage();