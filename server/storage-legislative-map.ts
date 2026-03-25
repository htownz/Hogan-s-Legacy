// @ts-nocheck
import { db } from './db';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { 
  legislativeDistricts, 
  billDistrictImpacts, 
  billActivityHeatmap, 
  committeeMeetingLocations,
  LegislativeDistrict,
  InsertLegislativeDistrict,
  BillDistrictImpact,
  InsertBillDistrictImpact,
  BillActivityHeatmap,
  InsertBillActivityHeatmap,
  CommitteeMeetingLocation,
  InsertCommitteeMeetingLocation
} from '@shared/schema-legislative-map';

/**
 * Interface for legislative map storage operations
 */
export interface LegislativeMapStorage {
  // Legislative district operations
  createLegislativeDistrict(data: InsertLegislativeDistrict): Promise<LegislativeDistrict>;
  getLegislativeDistricts(type?: string): Promise<LegislativeDistrict[]>;
  getLegislativeDistrictById(id: number): Promise<LegislativeDistrict | null>;
  updateLegislativeDistrict(id: number, data: Partial<InsertLegislativeDistrict>): Promise<LegislativeDistrict | null>;
  deleteLegislativeDistrict(id: number): Promise<boolean>;
  
  // Bill district impact operations
  createBillDistrictImpact(data: InsertBillDistrictImpact): Promise<BillDistrictImpact>;
  getBillDistrictImpacts(billId: string): Promise<BillDistrictImpact[]>;
  getBillDistrictImpactById(id: number): Promise<BillDistrictImpact | null>;
  updateBillDistrictImpact(id: number, data: Partial<InsertBillDistrictImpact>): Promise<BillDistrictImpact | null>;
  deleteBillDistrictImpact(id: number): Promise<boolean>;
  
  // Bill activity heatmap operations
  createBillActivityHeatmap(data: InsertBillActivityHeatmap): Promise<BillActivityHeatmap>;
  getBillActivityHeatmap(billId: string, startDate?: Date, endDate?: Date): Promise<BillActivityHeatmap[]>;
  getTotalBillActivity(billId: string): Promise<number>;
  deleteBillActivityHeatmap(id: number): Promise<boolean>;
  
  // Committee meeting location operations
  createCommitteeMeetingLocation(data: InsertCommitteeMeetingLocation): Promise<CommitteeMeetingLocation>;
  getCommitteeMeetingLocations(): Promise<CommitteeMeetingLocation[]>;
  getCommitteeMeetingLocationById(id: number): Promise<CommitteeMeetingLocation | null>;
  updateCommitteeMeetingLocation(id: number, data: Partial<InsertCommitteeMeetingLocation>): Promise<CommitteeMeetingLocation | null>;
  deleteCommitteeMeetingLocation(id: number): Promise<boolean>;
}

/**
 * PostgreSQL implementation of the legislative map storage
 */
export class PostgresLegislativeMapStorage implements LegislativeMapStorage {
  /**
   * Create a new legislative district
   */
  async createLegislativeDistrict(data: InsertLegislativeDistrict): Promise<LegislativeDistrict> {
    try {
      const [district] = await db.insert(legislativeDistricts)
        .values(data)
        .returning();
        
      return district;
    } catch (error: any) {
      console.error('Error creating legislative district:', error);
      throw new Error('Failed to create legislative district');
    }
  }

  /**
   * Get all legislative districts, optionally filtered by type
   */
  async getLegislativeDistricts(type?: string): Promise<LegislativeDistrict[]> {
    try {
      let query = db.select().from(legislativeDistricts).$dynamic();
      
      if (type) {
        query = query.where(eq(legislativeDistricts.type, type));
      }
      
      return await query.orderBy(legislativeDistricts.type, legislativeDistricts.districtNumber);
    } catch (error: any) {
      console.error('Error fetching legislative districts:', error);
      throw new Error('Failed to fetch legislative districts');
    }
  }

  /**
   * Get a legislative district by ID
   */
  async getLegislativeDistrictById(id: number): Promise<LegislativeDistrict | null> {
    try {
      const districts = await db.select()
        .from(legislativeDistricts).$dynamic()
        .where(eq(legislativeDistricts.id, id))
        .limit(1);
        
      return districts.length > 0 ? districts[0] : null;
    } catch (error: any) {
      console.error('Error fetching legislative district:', error);
      throw new Error('Failed to fetch legislative district');
    }
  }

  /**
   * Update a legislative district
   */
  async updateLegislativeDistrict(id: number, data: Partial<InsertLegislativeDistrict>): Promise<LegislativeDistrict | null> {
    try {
      const [updated] = await db.update(legislativeDistricts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(legislativeDistricts.id, id))
        .returning();
        
      return updated || null;
    } catch (error: any) {
      console.error('Error updating legislative district:', error);
      throw new Error('Failed to update legislative district');
    }
  }

  /**
   * Delete a legislative district
   */
  async deleteLegislativeDistrict(id: number): Promise<boolean> {
    try {
      const result = await db.delete(legislativeDistricts)
        .where(eq(legislativeDistricts.id, id))
        .returning({ id: legislativeDistricts.id });
        
      return result.length > 0;
    } catch (error: any) {
      console.error('Error deleting legislative district:', error);
      throw new Error('Failed to delete legislative district');
    }
  }

  /**
   * Create a new bill district impact
   */
  async createBillDistrictImpact(data: InsertBillDistrictImpact): Promise<BillDistrictImpact> {
    try {
      const [impact] = await db.insert(billDistrictImpacts)
        .values(data)
        .returning();
        
      return impact;
    } catch (error: any) {
      console.error('Error creating bill district impact:', error);
      throw new Error('Failed to create bill district impact');
    }
  }

  /**
   * Get all bill district impacts for a bill
   */
  async getBillDistrictImpacts(billId: string): Promise<BillDistrictImpact[]> {
    try {
      return await db.select()
        .from(billDistrictImpacts).$dynamic()
        .where(eq(billDistrictImpacts.billId, billId))
        .orderBy(desc(billDistrictImpacts.impactScore));
    } catch (error: any) {
      console.error('Error fetching bill district impacts:', error);
      throw new Error('Failed to fetch bill district impacts');
    }
  }

  /**
   * Get a bill district impact by ID
   */
  async getBillDistrictImpactById(id: number): Promise<BillDistrictImpact | null> {
    try {
      const impacts = await db.select()
        .from(billDistrictImpacts).$dynamic()
        .where(eq(billDistrictImpacts.id, id))
        .limit(1);
        
      return impacts.length > 0 ? impacts[0] : null;
    } catch (error: any) {
      console.error('Error fetching bill district impact:', error);
      throw new Error('Failed to fetch bill district impact');
    }
  }

  /**
   * Update a bill district impact
   */
  async updateBillDistrictImpact(id: number, data: Partial<InsertBillDistrictImpact>): Promise<BillDistrictImpact | null> {
    try {
      const [updated] = await db.update(billDistrictImpacts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(billDistrictImpacts.id, id))
        .returning();
        
      return updated || null;
    } catch (error: any) {
      console.error('Error updating bill district impact:', error);
      throw new Error('Failed to update bill district impact');
    }
  }

  /**
   * Delete a bill district impact
   */
  async deleteBillDistrictImpact(id: number): Promise<boolean> {
    try {
      const result = await db.delete(billDistrictImpacts)
        .where(eq(billDistrictImpacts.id, id))
        .returning({ id: billDistrictImpacts.id });
        
      return result.length > 0;
    } catch (error: any) {
      console.error('Error deleting bill district impact:', error);
      throw new Error('Failed to delete bill district impact');
    }
  }

  /**
   * Create a new bill activity heatmap point
   */
  async createBillActivityHeatmap(data: InsertBillActivityHeatmap): Promise<BillActivityHeatmap> {
    try {
      const [activity] = await db.insert(billActivityHeatmap)
        .values(data)
        .returning();
        
      return activity;
    } catch (error: any) {
      console.error('Error creating bill activity heatmap point:', error);
      throw new Error('Failed to create bill activity heatmap point');
    }
  }

  /**
   * Get all bill activity heatmap points for a bill
   */
  async getBillActivityHeatmap(billId: string, startDate?: Date, endDate?: Date): Promise<BillActivityHeatmap[]> {
    try {
      let queryCondition = eq(billActivityHeatmap.billId, billId);
      
      if (startDate && endDate) {
        queryCondition = and(
          queryCondition,
          sql`${billActivityHeatmap.createdAt} BETWEEN ${startDate} AND ${endDate}`
        );
      } else if (startDate) {
        queryCondition = and(
          queryCondition,
          sql`${billActivityHeatmap.createdAt} >= ${startDate}`
        );
      } else if (endDate) {
        queryCondition = and(
          queryCondition,
          sql`${billActivityHeatmap.createdAt} <= ${endDate}`
        );
      }
      
      return await db.select()
        .from(billActivityHeatmap).$dynamic()
        .where(queryCondition);
    } catch (error: any) {
      console.error('Error fetching bill activity heatmap:', error);
      throw new Error('Failed to fetch bill activity heatmap');
    }
  }

  /**
   * Get total bill activity count
   */
  async getTotalBillActivity(billId: string): Promise<number> {
    try {
      const result = await db.select({ count: sql`COUNT(*)` })
        .from(billActivityHeatmap).$dynamic()
        .where(eq(billActivityHeatmap.billId, billId));
        
      return parseInt(result[0].count.toString(), 10);
    } catch (error: any) {
      console.error('Error getting total bill activity:', error);
      throw new Error('Failed to get total bill activity');
    }
  }

  /**
   * Delete a bill activity heatmap point
   */
  async deleteBillActivityHeatmap(id: number): Promise<boolean> {
    try {
      const result = await db.delete(billActivityHeatmap)
        .where(eq(billActivityHeatmap.id, id))
        .returning({ id: billActivityHeatmap.id });
        
      return result.length > 0;
    } catch (error: any) {
      console.error('Error deleting bill activity heatmap point:', error);
      throw new Error('Failed to delete bill activity heatmap point');
    }
  }

  /**
   * Create a new committee meeting location
   */
  async createCommitteeMeetingLocation(data: InsertCommitteeMeetingLocation): Promise<CommitteeMeetingLocation> {
    try {
      const [location] = await db.insert(committeeMeetingLocations)
        .values(data)
        .returning();
        
      return location;
    } catch (error: any) {
      console.error('Error creating committee meeting location:', error);
      throw new Error('Failed to create committee meeting location');
    }
  }

  /**
   * Get all committee meeting locations
   */
  async getCommitteeMeetingLocations(): Promise<CommitteeMeetingLocation[]> {
    try {
      return await db.select()
        .from(committeeMeetingLocations)
        .orderBy(committeeMeetingLocations.name);
    } catch (error: any) {
      console.error('Error fetching committee meeting locations:', error);
      throw new Error('Failed to fetch committee meeting locations');
    }
  }

  /**
   * Get a committee meeting location by ID
   */
  async getCommitteeMeetingLocationById(id: number): Promise<CommitteeMeetingLocation | null> {
    try {
      const locations = await db.select()
        .from(committeeMeetingLocations).$dynamic()
        .where(eq(committeeMeetingLocations.id, id))
        .limit(1);
        
      return locations.length > 0 ? locations[0] : null;
    } catch (error: any) {
      console.error('Error fetching committee meeting location:', error);
      throw new Error('Failed to fetch committee meeting location');
    }
  }

  /**
   * Update a committee meeting location
   */
  async updateCommitteeMeetingLocation(id: number, data: Partial<InsertCommitteeMeetingLocation>): Promise<CommitteeMeetingLocation | null> {
    try {
      const [updated] = await db.update(committeeMeetingLocations)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(committeeMeetingLocations.id, id))
        .returning();
        
      return updated || null;
    } catch (error: any) {
      console.error('Error updating committee meeting location:', error);
      throw new Error('Failed to update committee meeting location');
    }
  }

  /**
   * Delete a committee meeting location
   */
  async deleteCommitteeMeetingLocation(id: number): Promise<boolean> {
    try {
      const result = await db.delete(committeeMeetingLocations)
        .where(eq(committeeMeetingLocations.id, id))
        .returning({ id: committeeMeetingLocations.id });
        
      return result.length > 0;
    } catch (error: any) {
      console.error('Error deleting committee meeting location:', error);
      throw new Error('Failed to delete committee meeting location');
    }
  }
}

// Export the storage instance
export const legislativeMapStorage = new PostgresLegislativeMapStorage();