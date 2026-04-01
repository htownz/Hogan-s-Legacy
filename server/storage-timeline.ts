// @ts-nocheck
import { db } from './db';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { timelineStages, timelineEvents, bills } from '@shared/schema-timeline';
import { 
  TimelineStage, 
  InsertTimelineStage, 
  TimelineEvent, 
  InsertTimelineEvent 
} from '@shared/schema-timeline';
import { createLogger } from "./logger";
const log = createLogger("storage-timeline");


/**
 * Interface for timeline storage operations
 */
export interface TimelineStorage {
  // Timeline stage operations
  createTimelineStage(data: InsertTimelineStage): Promise<TimelineStage>;
  getTimelineStagesByBillId(billId: string): Promise<TimelineStage[]>;
  updateTimelineStage(id: number, data: Partial<InsertTimelineStage>): Promise<TimelineStage | null>;
  deleteTimelineStage(id: number): Promise<boolean>;
  getTimelineStageById(id: number): Promise<TimelineStage | null>;
  
  // Timeline event operations
  createTimelineEvent(data: InsertTimelineEvent): Promise<TimelineEvent>;
  getTimelineEventsByBillId(billId: string, includePrivate?: boolean, userId?: number): Promise<TimelineEvent[]>;
  updateTimelineEvent(id: string, data: Partial<InsertTimelineEvent>): Promise<TimelineEvent | null>;
  deleteTimelineEvent(id: string): Promise<boolean>;
  getTimelineEventById(id: string): Promise<TimelineEvent | null>;
  
  // Combined timeline operations
  getCompleteBillTimeline(billId: string, includePrivate?: boolean, userId?: number): Promise<(TimelineStage | TimelineEvent)[]>;
}

/**
 * PostgreSQL implementation of the timeline storage
 */
export class PostgresTimelineStorage implements TimelineStorage {
  /**
   * Create a new timeline stage
   */
  async createTimelineStage(data: InsertTimelineStage): Promise<TimelineStage> {
    try {
      // Ensure dates are properly formatted
      const formattedData = {
        ...data,
        stageDate: data.stageDate ? new Date(data.stageDate) : undefined
      };

      const [stage] = await db.insert(timelineStages)
        .values(formattedData)
        .returning();
        
      return stage;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating timeline stage');
      throw new Error('Failed to create timeline stage');
    }
  }

  /**
   * Get all timeline stages for a bill
   */
  async getTimelineStagesByBillId(billId: string): Promise<TimelineStage[]> {
    try {
      const stages = await db.select()
        .from(timelineStages).$dynamic()
        .where(eq(timelineStages.billId, billId))
        .orderBy(timelineStages.stageOrder);
        
      return stages;
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching timeline stages');
      throw new Error('Failed to fetch timeline stages');
    }
  }

  /**
   * Update a timeline stage
   */
  async updateTimelineStage(id: number, data: Partial<InsertTimelineStage>): Promise<TimelineStage | null> {
    try {
      // Ensure dates are properly formatted
      const formattedData = {
        ...data,
        stageDate: data.stageDate ? new Date(data.stageDate) : undefined
      };
      
      const [updatedStage] = await db.update(timelineStages)
        .set({
          ...formattedData,
          updatedAt: new Date()
        })
        .where(eq(timelineStages.id, id))
        .returning();
        
      return updatedStage || null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating timeline stage');
      throw new Error('Failed to update timeline stage');
    }
  }

  /**
   * Delete a timeline stage
   */
  async deleteTimelineStage(id: number): Promise<boolean> {
    try {
      const result = await db.delete(timelineStages)
        .where(eq(timelineStages.id, id))
        .returning({ id: timelineStages.id });
        
      return result.length > 0;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting timeline stage');
      throw new Error('Failed to delete timeline stage');
    }
  }

  /**
   * Get a timeline stage by ID
   */
  async getTimelineStageById(id: number): Promise<TimelineStage | null> {
    try {
      const stage = await db.select()
        .from(timelineStages).$dynamic()
        .where(eq(timelineStages.id, id))
        .limit(1);
        
      return stage.length > 0 ? stage[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching timeline stage');
      throw new Error('Failed to fetch timeline stage');
    }
  }

  /**
   * Create a new timeline event
   */
  async createTimelineEvent(data: InsertTimelineEvent): Promise<TimelineEvent> {
    try {
      // Ensure dates are properly formatted and default values are set
      const formattedData = {
        ...data,
        eventDate: data.eventDate ? new Date(data.eventDate) : new Date(),
        isPublic: data.isPublic !== undefined ? data.isPublic : true
      };

      const [event] = await db.insert(timelineEvents)
        .values(formattedData)
        .returning();
        
      return event;
    } catch (error: any) {
      log.error({ err: error }, 'Error creating timeline event');
      throw new Error('Failed to create timeline event');
    }
  }

  /**
   * Get all timeline events for a bill
   */
  async getTimelineEventsByBillId(billId: string, includePrivate = false, userId?: number): Promise<TimelineEvent[]> {
    try {
      // Build the where condition first
      let whereCondition = eq(timelineEvents.billId, billId);
        
      // If we're not including private events, filter to only public ones
      // or private ones owned by the current user
      if (!includePrivate) {
        if (userId) {
          whereCondition = and(
            whereCondition,
            or(
              eq(timelineEvents.isPublic, true),
              and(
                eq(timelineEvents.isPublic, false),
                eq(timelineEvents.userId, userId)
              )
            )
          );
        } else {
          whereCondition = and(
            whereCondition,
            eq(timelineEvents.isPublic, true)
          );
        }
      }
      
      // Execute the query with the built condition
      const query = db.select()
        .from(timelineEvents).$dynamic()
        .where(whereCondition);
      
      // Order by event date descending (newest first)
      const events = await query.orderBy(desc(timelineEvents.eventDate));
      return events;
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching timeline events');
      throw new Error('Failed to fetch timeline events');
    }
  }

  /**
   * Update a timeline event
   */
  async updateTimelineEvent(id: string, data: Partial<InsertTimelineEvent>): Promise<TimelineEvent | null> {
    try {
      // Ensure dates are properly formatted
      const formattedData = {
        ...data,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined
      };
      
      const [updatedEvent] = await db.update(timelineEvents)
        .set({
          ...formattedData,
          updatedAt: new Date()
        })
        .where(eq(timelineEvents.id, id))
        .returning();
        
      return updatedEvent || null;
    } catch (error: any) {
      log.error({ err: error }, 'Error updating timeline event');
      throw new Error('Failed to update timeline event');
    }
  }

  /**
   * Delete a timeline event
   */
  async deleteTimelineEvent(id: string): Promise<boolean> {
    try {
      const result = await db.delete(timelineEvents)
        .where(eq(timelineEvents.id, id))
        .returning({ id: timelineEvents.id });
        
      return result.length > 0;
    } catch (error: any) {
      log.error({ err: error }, 'Error deleting timeline event');
      throw new Error('Failed to delete timeline event');
    }
  }

  /**
   * Get a timeline event by ID
   */
  async getTimelineEventById(id: string): Promise<TimelineEvent | null> {
    try {
      const event = await db.select()
        .from(timelineEvents).$dynamic()
        .where(eq(timelineEvents.id, id))
        .limit(1);
        
      return event.length > 0 ? event[0] : null;
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching timeline event');
      throw new Error('Failed to fetch timeline event');
    }
  }

  /**
   * Get the complete timeline for a bill, combining stages and events
   */
  async getCompleteBillTimeline(billId: string, includePrivate = false, userId?: number): Promise<(TimelineStage | TimelineEvent)[]> {
    try {
      // Get all stages for the bill
      const stages = await this.getTimelineStagesByBillId(billId);
      
      // Get all events for the bill, filtering private ones if necessary
      const events = await this.getTimelineEventsByBillId(billId, includePrivate, userId);
      
      // Combine and sort the timeline items
      // We'll use the discriminated union pattern by adding a 'type' field
      const timelineItems = [
        ...stages.map(stage => ({ ...stage, itemType: 'stage' as const })),
        ...events.map(event => ({ ...event, itemType: 'event' as const }))
      ].sort((a, b) => {
        // First sort by date if both items have a date
        const aDate = a.itemType === 'stage' ? a.stageDate : a.eventDate;
        const bDate = b.itemType === 'stage' ? b.stageDate : b.eventDate;
        
        if (aDate && bDate) {
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
        
        // For stages without dates, sort by stage order
        if (a.itemType === 'stage' && b.itemType === 'stage') {
          return a.stageOrder - b.stageOrder;
        }
        
        // Events without dates (unlikely) or mixing types without dates
        return 0;
      });
      
      return timelineItems;
    } catch (error: any) {
      log.error({ err: error }, 'Error fetching complete bill timeline');
      throw new Error('Failed to fetch complete bill timeline');
    }
  }
}

// Export the storage instance
export const timelineStorage = new PostgresTimelineStorage();