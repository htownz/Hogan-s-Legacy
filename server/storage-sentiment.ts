import { pool } from './db';
import { 
  BillSentimentSnapshot,
  DemographicSentimentBreakdown,
  SentimentTrigger,
  UserSentimentVote,
  InsertBillSentimentSnapshot,
  InsertDemographicSentimentBreakdown,
  InsertSentimentTrigger,
  InsertUserSentimentVote
} from '../shared/schema-sentiment';

/**
 * Interface for sentiment visualization storage operations
 */
export interface ISentimentStorage {
  // Bill sentiment snapshots methods
  getBillSentimentSnapshots(billId: string, startDate?: Date, endDate?: Date): Promise<BillSentimentSnapshot[]>;
  getBillSentimentSnapshotById(id: number): Promise<BillSentimentSnapshot | undefined>;
  createBillSentimentSnapshot(data: InsertBillSentimentSnapshot): Promise<BillSentimentSnapshot>;
  
  // Demographic sentiment breakdowns methods
  getDemographicSentimentBreakdowns(billId: string, date?: Date): Promise<DemographicSentimentBreakdown[]>;
  getDemographicSentimentBreakdownById(id: number): Promise<DemographicSentimentBreakdown | undefined>;
  createDemographicSentimentBreakdown(data: InsertDemographicSentimentBreakdown): Promise<DemographicSentimentBreakdown>;
  
  // Sentiment triggers methods
  getSentimentTriggers(billId: string, startDate?: Date, endDate?: Date): Promise<SentimentTrigger[]>;
  getSentimentTriggerById(id: number): Promise<SentimentTrigger | undefined>;
  createSentimentTrigger(data: InsertSentimentTrigger): Promise<SentimentTrigger>;
  
  // User sentiment votes methods
  getUserSentimentVotes(billId: string, userId?: number): Promise<UserSentimentVote[]>;
  getUserSentimentVoteById(id: number): Promise<UserSentimentVote | undefined>;
  createUserSentimentVote(data: InsertUserSentimentVote): Promise<UserSentimentVote>;
  updateUserSentimentVote(id: number, data: Partial<InsertUserSentimentVote>): Promise<UserSentimentVote | undefined>;
  
  // Analytics methods
  getBillSentimentOverTime(billId: string): Promise<any[]>;
  getDemographicSentimentComparison(billId: string, date?: Date): Promise<any[]>;
  getSentimentCorrelations(billId: string): Promise<any>;
}

/**
 * Implementation of sentiment visualization storage operations
 */
export class SentimentStorage implements ISentimentStorage {
  
  // ---- BILL SENTIMENT SNAPSHOTS ----
  
  async getBillSentimentSnapshots(billId: string, startDate?: Date, endDate?: Date): Promise<BillSentimentSnapshot[]> {
    try {
      let query = `
        SELECT * FROM bill_sentiment_snapshots
        WHERE bill_id = $1
      `;
      
      const queryParams: any[] = [billId];
      let paramIndex = 2;
      
      if (startDate) {
        query += ` AND snapshot_date >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        query += ` AND snapshot_date <= $${paramIndex}`;
        queryParams.push(endDate);
      }
      
      query += ` ORDER BY snapshot_date DESC`;
      
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error: any) {
      console.error('Error in getBillSentimentSnapshots:', error);
      return [];
    }
  }
  
  async getBillSentimentSnapshotById(id: number): Promise<BillSentimentSnapshot | undefined> {
    try {
      const query = `
        SELECT * FROM bill_sentiment_snapshots
        WHERE id = $1
        LIMIT 1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error: any) {
      console.error('Error in getBillSentimentSnapshotById:', error);
      return undefined;
    }
  }
  
  async createBillSentimentSnapshot(data: InsertBillSentimentSnapshot): Promise<BillSentimentSnapshot> {
    try {
      const {
        billId,
        snapshotDate,
        overallSentiment,
        communitySupport,
        socialMediaSentiment,
        newsMediaSentiment,
        legislatorSentiment,
        communityEngagement,
        metadata = {}
      } = data;
      
      const query = `
        INSERT INTO bill_sentiment_snapshots (
          bill_id,
          snapshot_date,
          overall_sentiment,
          community_support,
          social_media_sentiment,
          news_media_sentiment,
          legislator_sentiment,
          community_engagement,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        billId,
        snapshotDate,
        overallSentiment,
        communitySupport,
        socialMediaSentiment,
        newsMediaSentiment,
        legislatorSentiment,
        communityEngagement,
        metadata
      ]);
      
      return result.rows[0];
    } catch (error: any) {
      console.error('Error in createBillSentimentSnapshot:', error);
      throw error;
    }
  }
  
  // ---- DEMOGRAPHIC SENTIMENT BREAKDOWNS ----
  
  async getDemographicSentimentBreakdowns(billId: string, date?: Date): Promise<DemographicSentimentBreakdown[]> {
    try {
      let query: string;
      let queryParams: any[];
      
      if (date) {
        // If date is provided, get breakdowns for that specific date
        query = `
          SELECT * FROM demographic_sentiment_breakdowns
          WHERE bill_id = $1 AND snapshot_date = $2
          ORDER BY demographic_group
        `;
        queryParams = [billId, date];
      } else {
        // If no date provided, get the most recent date first
        const latestDateQuery = `
          SELECT snapshot_date FROM demographic_sentiment_breakdowns
          WHERE bill_id = $1
          ORDER BY snapshot_date DESC
          LIMIT 1
        `;
        
        const latestDateResult = await pool.query(latestDateQuery, [billId]);
        
        if (latestDateResult.rows.length === 0) {
          return [];
        }
        
        const latestDate = latestDateResult.rows[0].snapshot_date;
        
        query = `
          SELECT * FROM demographic_sentiment_breakdowns
          WHERE bill_id = $1 AND snapshot_date = $2
          ORDER BY demographic_group
        `;
        queryParams = [billId, latestDate];
      }
      
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error: any) {
      console.error('Error in getDemographicSentimentBreakdowns:', error);
      return [];
    }
  }
  
  async getDemographicSentimentBreakdownById(id: number): Promise<DemographicSentimentBreakdown | undefined> {
    try {
      const query = `
        SELECT * FROM demographic_sentiment_breakdowns
        WHERE id = $1
        LIMIT 1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error: any) {
      console.error('Error in getDemographicSentimentBreakdownById:', error);
      return undefined;
    }
  }
  
  async createDemographicSentimentBreakdown(data: InsertDemographicSentimentBreakdown): Promise<DemographicSentimentBreakdown> {
    try {
      const {
        billId,
        snapshotDate,
        demographicGroup,
        demographicValue,
        sentiment,
        sampleSize
      } = data;
      
      const query = `
        INSERT INTO demographic_sentiment_breakdowns (
          bill_id,
          snapshot_date,
          demographic_group,
          demographic_value,
          sentiment,
          sample_size
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        billId,
        snapshotDate,
        demographicGroup,
        demographicValue,
        sentiment,
        sampleSize
      ]);
      
      return result.rows[0];
    } catch (error: any) {
      console.error('Error in createDemographicSentimentBreakdown:', error);
      throw error;
    }
  }
  
  // ---- SENTIMENT TRIGGERS ----
  
  async getSentimentTriggers(billId: string, startDate?: Date, endDate?: Date): Promise<SentimentTrigger[]> {
    try {
      let query = `
        SELECT * FROM sentiment_triggers
        WHERE bill_id = $1
      `;
      
      const queryParams: any[] = [billId];
      let paramIndex = 2;
      
      if (startDate) {
        query += ` AND trigger_date >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        query += ` AND trigger_date <= $${paramIndex}`;
        queryParams.push(endDate);
      }
      
      query += ` ORDER BY trigger_date DESC`;
      
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error: any) {
      console.error('Error in getSentimentTriggers:', error);
      return [];
    }
  }
  
  async getSentimentTriggerById(id: number): Promise<SentimentTrigger | undefined> {
    try {
      const query = `
        SELECT * FROM sentiment_triggers
        WHERE id = $1
        LIMIT 1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error: any) {
      console.error('Error in getSentimentTriggerById:', error);
      return undefined;
    }
  }
  
  async createSentimentTrigger(data: InsertSentimentTrigger): Promise<SentimentTrigger> {
    try {
      const {
        billId,
        triggerDate,
        triggerType,
        description,
        impact,
        sourceName,
        sourceUrl
      } = data;
      
      const query = `
        INSERT INTO sentiment_triggers (
          bill_id,
          trigger_date,
          trigger_type,
          description,
          impact,
          source_name,
          source_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        billId,
        triggerDate,
        triggerType,
        description,
        impact,
        sourceName,
        sourceUrl
      ]);
      
      return result.rows[0];
    } catch (error: any) {
      console.error('Error in createSentimentTrigger:', error);
      throw error;
    }
  }
  
  // ---- USER SENTIMENT VOTES ----
  
  async getUserSentimentVotes(billId: string, userId?: number): Promise<UserSentimentVote[]> {
    try {
      let query = `
        SELECT * FROM user_sentiment_votes
        WHERE bill_id = $1
      `;
      
      const queryParams: any[] = [billId];
      
      if (userId !== undefined) {
        query += ` AND user_id = $2`;
        queryParams.push(userId);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error: any) {
      console.error('Error in getUserSentimentVotes:', error);
      return [];
    }
  }
  
  async getUserSentimentVoteById(id: number): Promise<UserSentimentVote | undefined> {
    try {
      const query = `
        SELECT * FROM user_sentiment_votes
        WHERE id = $1
        LIMIT 1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error: any) {
      console.error('Error in getUserSentimentVoteById:', error);
      return undefined;
    }
  }
  
  async createUserSentimentVote(data: InsertUserSentimentVote): Promise<UserSentimentVote> {
    try {
      // Check if user already has a vote for this bill
      const checkQuery = `
        SELECT id FROM user_sentiment_votes
        WHERE user_id = $1 AND bill_id = $2
        LIMIT 1
      `;
      
      const checkResult = await pool.query(checkQuery, [data.userId, data.billId]);
      
      if (checkResult.rows.length > 0) {
        // Update existing vote
        return await this.updateUserSentimentVote(
          checkResult.rows[0].id,
          { sentiment: data.sentiment, comment: data.comment }
        ) as UserSentimentVote;
      }
      
      // Create new vote
      const {
        userId,
        billId,
        sentiment,
        comment
      } = data;
      
      const insertQuery = `
        INSERT INTO user_sentiment_votes (
          user_id,
          bill_id,
          sentiment,
          comment
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        userId,
        billId,
        sentiment,
        comment
      ]);
      
      return result.rows[0];
    } catch (error: any) {
      console.error('Error in createUserSentimentVote:', error);
      throw error;
    }
  }
  
  async updateUserSentimentVote(id: number, data: Partial<InsertUserSentimentVote>): Promise<UserSentimentVote | undefined> {
    try {
      // Build the SET part of the query dynamically based on the fields present in data
      const updateFields: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      if (data.sentiment !== undefined) {
        updateFields.push(`sentiment = $${paramIndex++}`);
        queryParams.push(data.sentiment);
      }
      
      if (data.comment !== undefined) {
        updateFields.push(`comment = $${paramIndex++}`);
        queryParams.push(data.comment);
      }
      
      // Always update the updated_at timestamp
      updateFields.push(`updated_at = NOW()`);
      
      // Return early if no fields to update
      if (updateFields.length === 0) {
        return await this.getUserSentimentVoteById(id);
      }
      
      // Append the id parameter
      queryParams.push(id);
      
      const query = `
        UPDATE user_sentiment_votes
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, queryParams);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error: any) {
      console.error('Error in updateUserSentimentVote:', error);
      return undefined;
    }
  }
  
  // ---- ANALYTICS METHODS ----
  
  async getBillSentimentOverTime(billId: string): Promise<any[]> {
    try {
      // Get sentiment snapshots over time
      const snapshots = await this.getBillSentimentSnapshots(billId);
      
      // Format data for visualization
      return snapshots.map(snapshot => ({
        date: snapshot.snapshotDate,
        overallSentiment: snapshot.overallSentiment,
        communitySupport: snapshot.communitySupport,
        socialMediaSentiment: snapshot.socialMediaSentiment,
        newsMediaSentiment: snapshot.newsMediaSentiment,
        legislatorSentiment: snapshot.legislatorSentiment,
        communityEngagement: snapshot.communityEngagement
      }));
    } catch (error: any) {
      console.error('Error in getBillSentimentOverTime:', error);
      return [];
    }
  }
  
  async getDemographicSentimentComparison(billId: string, date?: Date): Promise<any[]> {
    try {
      // Get demographic breakdowns
      const breakdowns = await this.getDemographicSentimentBreakdowns(billId, date);
      
      // Group by demographic group
      const groupedBreakdowns: Record<string, any[]> = {};
      
      breakdowns.forEach(breakdown => {
        if (!groupedBreakdowns[breakdown.demographicGroup]) {
          groupedBreakdowns[breakdown.demographicGroup] = [];
        }
        
        groupedBreakdowns[breakdown.demographicGroup].push({
          value: breakdown.demographicValue,
          sentiment: breakdown.sentiment,
          sampleSize: breakdown.sampleSize
        });
      });
      
      // Format data for visualization
      return Object.keys(groupedBreakdowns).map(group => ({
        group,
        values: groupedBreakdowns[group]
      }));
    } catch (error: any) {
      console.error('Error in getDemographicSentimentComparison:', error);
      return [];
    }
  }
  
  async getSentimentCorrelations(billId: string): Promise<any> {
    try {
      // Get sentiment snapshots
      const snapshots = await this.getBillSentimentSnapshots(billId);
      
      // Get sentiment triggers in the same time period
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (snapshots.length > 0) {
        const dates = snapshots.map(s => new Date(s.snapshotDate));
        startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        endDate = new Date(Math.max(...dates.map(d => d.getTime())));
      }
      
      const triggers = startDate && endDate 
        ? await this.getSentimentTriggers(billId, startDate, endDate)
        : [];
      
      // Calculate correlations between triggers and sentiment changes
      const correlations = {
        triggerImpact: this.calculateTriggerImpact(snapshots, triggers),
        sentimentTrends: this.analyzeSentimentTrends(snapshots),
      };
      
      return correlations;
    } catch (error: any) {
      console.error('Error in getSentimentCorrelations:', error);
      return {
        triggerImpact: [],
        sentimentTrends: {}
      };
    }
  }
  
  // Helper method to calculate the impact of triggers on sentiment
  private calculateTriggerImpact(snapshots: BillSentimentSnapshot[], triggers: SentimentTrigger[]): any[] {
    // Skip if not enough data
    if (snapshots.length < 2 || triggers.length === 0) {
      return [];
    }
    
    const impact: any[] = [];
    
    // Sort snapshots by date (oldest first)
    const sortedSnapshots = [...snapshots].sort((a, b) => 
      new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
    
    triggers.forEach(trigger => {
      // Find the snapshots just before and after the trigger
      const triggerDate = new Date(trigger.triggerDate);
      
      let beforeSnapshot: BillSentimentSnapshot | undefined;
      let afterSnapshot: BillSentimentSnapshot | undefined;
      
      for (let i = 0; i < sortedSnapshots.length - 1; i++) {
        const currDate = new Date(sortedSnapshots[i].snapshotDate);
        const nextDate = new Date(sortedSnapshots[i + 1].snapshotDate);
        
        if (currDate <= triggerDate && triggerDate <= nextDate) {
          beforeSnapshot = sortedSnapshots[i];
          afterSnapshot = sortedSnapshots[i + 1];
          break;
        }
      }
      
      if (beforeSnapshot && afterSnapshot) {
        const sentimentChange = afterSnapshot.overallSentiment - beforeSnapshot.overallSentiment;
        
        impact.push({
          trigger: trigger.description,
          triggerType: trigger.triggerType,
          triggerDate: trigger.triggerDate,
          sentimentBefore: beforeSnapshot.overallSentiment,
          sentimentAfter: afterSnapshot.overallSentiment,
          sentimentChange,
          expectedImpact: trigger.impact,
          actualImpact: sentimentChange,
          correlation: Math.sign(sentimentChange) === Math.sign(trigger.impact) ? 'aligned' : 'divergent'
        });
      }
    });
    
    return impact;
  }
  
  // Helper method to analyze sentiment trends
  private analyzeSentimentTrends(snapshots: BillSentimentSnapshot[]): any {
    // Skip if not enough data
    if (snapshots.length < 2) {
      return {
        trend: 'insufficient_data',
        volatility: 0,
        averageSentiment: 0
      };
    }
    
    // Sort snapshots by date (oldest first)
    const sortedSnapshots = [...snapshots].sort((a, b) => 
      new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
    
    const sentiments = sortedSnapshots.map(s => s.overallSentiment);
    const firstSentiment = sentiments[0];
    const lastSentiment = sentiments[sentiments.length - 1];
    const change = lastSentiment - firstSentiment;
    
    // Calculate trend direction
    let trend: string;
    if (change > 10) trend = 'strongly_positive';
    else if (change > 5) trend = 'positive';
    else if (change < -10) trend = 'strongly_negative';
    else if (change < -5) trend = 'negative';
    else trend = 'stable';
    
    // Calculate volatility (standard deviation of changes)
    const changes = [];
    for (let i = 1; i < sentiments.length; i++) {
      changes.push(sentiments[i] - sentiments[i - 1]);
    }
    
    const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    const volatility = Math.sqrt(
      changes.reduce((sum, val) => sum + Math.pow(val - avgChange, 2), 0) / changes.length
    );
    
    // Calculate average sentiment
    const avgSentiment = sentiments.reduce((sum, val) => sum + val, 0) / sentiments.length;
    
    return {
      trend,
      volatility,
      averageSentiment: avgSentiment,
      totalChange: change,
      firstReading: firstSentiment,
      latestReading: lastSentiment,
      readingCount: sentiments.length
    };
  }
}

export const sentimentStorage = new SentimentStorage();