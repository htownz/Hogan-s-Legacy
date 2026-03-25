// Implementation of trending bills and passage probability storage
import { db } from './db';
import { 
  bills, 
  billHistoryEvents 
} from '@shared/schema';
import { 
  billPassageProbabilities, 
  trendingBillMetrics,
  InsertBillPassageProbability,
  InsertTrendingBillMetric,
  BillPassageProbability,
  TrendingBillMetric
} from '@shared/schema-trending';
import { eq, sql, desc, and, gt, gte, lte } from 'drizzle-orm';

export interface TrendingStorage {
  // Passage probability operations
  getBillPassageProbability(billId: string): Promise<BillPassageProbability | null>;
  getMultipleBillsPassageProbabilities(billIds: string[]): Promise<BillPassageProbability[]>;
  createOrUpdateBillPassageProbability(data: InsertBillPassageProbability): Promise<BillPassageProbability>;
  
  // Trending metrics operations
  getBillTrendingMetrics(billId: string): Promise<TrendingBillMetric | null>;
  getMultipleBillsTrendingMetrics(billIds: string[]): Promise<TrendingBillMetric[]>;
  createOrUpdateBillTrendingMetrics(data: InsertTrendingBillMetric): Promise<TrendingBillMetric>;
  getMostLikelyToPassBills(limit?: number): Promise<any[]>;
  getLeastLikelyToPassBills(limit?: number): Promise<any[]>;
  getRisingMomentumBills(limit?: number): Promise<any[]>;
  getTopTrendingBills(limit?: number): Promise<any[]>;
}

export class DbTrendingStorage implements TrendingStorage {
  // Passage probability operations
  async getBillPassageProbability(billId: string): Promise<BillPassageProbability | null> {
    const results = await db
      .select()
      .from(billPassageProbabilities).$dynamic()
      .where(eq(billPassageProbabilities.billId, billId))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  async getMultipleBillsPassageProbabilities(billIds: string[]): Promise<BillPassageProbability[]> {
    if (billIds.length === 0) return [];

    return db
      .select()
      .from(billPassageProbabilities).$dynamic()
      .where(sql`${billPassageProbabilities.billId} IN ${billIds}`);
  }

  async createOrUpdateBillPassageProbability(data: InsertBillPassageProbability): Promise<BillPassageProbability> {
    // Check if a record exists
    const existing = await this.getBillPassageProbability(data.billId);

    if (existing) {
      // Update the existing record
      const [updated] = await db
        .update(billPassageProbabilities)
        .set({
          ...data,
          lastUpdated: new Date()
        })
        .where(eq(billPassageProbabilities.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create a new record
      const [created] = await db
        .insert(billPassageProbabilities)
        .values({
          ...data,
          lastUpdated: new Date()
        })
        .returning();
      
      return created;
    }
  }

  // Trending metrics operations
  async getBillTrendingMetrics(billId: string): Promise<TrendingBillMetric | null> {
    const results = await db
      .select()
      .from(trendingBillMetrics).$dynamic()
      .where(eq(trendingBillMetrics.billId, billId))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  async getMultipleBillsTrendingMetrics(billIds: string[]): Promise<TrendingBillMetric[]> {
    if (billIds.length === 0) return [];

    return db
      .select()
      .from(trendingBillMetrics).$dynamic()
      .where(sql`${trendingBillMetrics.billId} IN ${billIds}`);
  }

  async createOrUpdateBillTrendingMetrics(data: InsertTrendingBillMetric): Promise<TrendingBillMetric> {
    // Check if a record exists
    const existing = await this.getBillTrendingMetrics(data.billId);

    if (existing) {
      // Update the existing record
      const [updated] = await db
        .update(trendingBillMetrics)
        .set({
          ...data,
          lastCalculated: new Date()
        })
        .where(eq(trendingBillMetrics.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create a new record
      const [created] = await db
        .insert(trendingBillMetrics)
        .values({
          ...data,
          lastCalculated: new Date()
        })
        .returning();
      
      return created;
    }
  }

  // Analytics queries
  async getMostLikelyToPassBills(limit: number = 5): Promise<any[]> {
    // Join with bills table to get bill details along with passage probability
    const result = await db
      .select({
        bill: bills,
        probability: billPassageProbabilities,
      })
      .from(bills)
      .innerJoin(
        billPassageProbabilities,
        eq(bills.id, billPassageProbabilities.billId)
      )
      .orderBy(desc(billPassageProbabilities.passageProbability))
      .limit(limit);

    return result;
  }

  async getLeastLikelyToPassBills(limit: number = 5): Promise<any[]> {
    // Join with bills table to get bill details along with passage probability
    const result = await db
      .select({
        bill: bills,
        probability: billPassageProbabilities,
      })
      .from(bills)
      .innerJoin(
        billPassageProbabilities,
        eq(bills.id, billPassageProbabilities.billId)
      )
      .orderBy(billPassageProbabilities.passageProbability)
      .limit(limit);

    return result;
  }

  async getRisingMomentumBills(limit: number = 5): Promise<any[]> {
    // Get bills with positive momentum, ordered by momentum
    const result = await db
      .select({
        bill: bills,
        probability: billPassageProbabilities,
      })
      .from(bills)
      .innerJoin(
        billPassageProbabilities,
        eq(bills.id, billPassageProbabilities.billId)
      )
      .where(gt(billPassageProbabilities.momentum, 0))
      .orderBy(desc(billPassageProbabilities.momentum))
      .limit(limit);

    return result;
  }

  async getTopTrendingBills(limit: number = 5): Promise<any[]> {
    // Get bills with highest trending scores
    const result = await db
      .select({
        bill: bills,
        trending: trendingBillMetrics,
      })
      .from(bills)
      .innerJoin(
        trendingBillMetrics,
        eq(bills.id, trendingBillMetrics.billId)
      )
      .orderBy(desc(trendingBillMetrics.trendingScore))
      .limit(limit);

    return result;
  }
}

// Create an instance to be used throughout the application
export const trendingStorage = new DbTrendingStorage();