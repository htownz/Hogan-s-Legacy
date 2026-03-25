import * as nodeCron from 'node-cron';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../db';
import { bills, userBillTracking, billHistoryEvents, billMovementNotifications } from '@shared/schema';
import { eq, and, desc, lt, gte } from 'drizzle-orm';
import { SERVER_CONFIG, FEATURES } from '../config';

class BillTrackingService {
  private billUpdateJob: nodeCron.ScheduledTask;
  private trackingUpdateJob: nodeCron.ScheduledTask;
  private isInitialized = false;
  private lastUpdateTimes: Map<string, Date> = new Map();
  private readonly TLO_BASE_URL = 'https://capitol.texas.gov';
  private readonly CURRENT_SESSION = '89R';
  
  constructor() {
    // Log when the service is created
    console.log('Bill tracking service created');
    
    // Add bill update job - runs every 30 minutes
    this.billUpdateJob = nodeCron.schedule('*/30 * * * *', this.updateActiveBills.bind(this), { scheduled: false });
    
    // Add high-priority bill tracking job - runs every 10 minutes
    this.trackingUpdateJob = nodeCron.schedule('*/10 * * * *', this.updateTrackedBills.bind(this), { scheduled: false });
  }
  
  /**
   * Initialize the service and start all jobs
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.log('Bill tracking service already initialized');
      return;
    }
    
    console.log('Bill tracking service temporarily disabled to fix server issues');
    
    try {
      // Disable cron jobs until server issues are fixed
      // this.billUpdateJob.start();
      // this.trackingUpdateJob.start();
      
      console.log('Bill tracking service initialization skipped');
      this.isInitialized = true;
      
      // Disable initial update on startup 
      // if (FEATURES.BILL_SCRAPING_ENABLED) {
      //   this.updateActiveBills();
      // }
    } catch (error: any) {
      console.error('Failed to initialize bill tracking service:', error);
    }
  }
  
  /**
   * Stop all bill tracking jobs
   */
  public shutdown(): void {
    console.log('Shutting down bill tracking service');
    this.billUpdateJob.stop();
    this.trackingUpdateJob.stop();
    this.isInitialized = false;
  }
  
  /**
   * Update all active bills in the database
   */
  private async updateActiveBills(): Promise<void> {
    if (!FEATURES.BILL_SCRAPING_ENABLED) {
      console.log('Bill scraping is disabled in configuration');
      return;
    }
    
    console.log('Starting scheduled update of all active bills');
    
    try {
      // Get all bills from the database
      const existingBills = await db.select({ id: bills.id, updatedAt: bills.updatedAt })
                                   .from(bills)
                                   .orderBy(bills.id);
      
      // Update oldest 50 bills first (based on last update time)
      const billsToUpdate = existingBills
        .sort((a, b) => new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime())
        .slice(0, 50);
      
      console.log(`Updating ${billsToUpdate.length} bills with oldest update timestamp`);
      
      let updatedCount = 0;
      for (const bill of billsToUpdate) {
        const wasUpdated = await this.updateSingleBill(bill.id);
        if (wasUpdated) updatedCount++;
        
        // Small delay to prevent overwhelming the TLO website
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`Completed scheduled bill update. Updated ${updatedCount} bills with new information.`);
    } catch (error: any) {
      console.error('Error during scheduled bill update:', error);
    }
  }
  
  /**
   * Update only tracked bills (higher frequency)
   */
  private async updateTrackedBills(): Promise<void> {
    if (!FEATURES.BILL_SCRAPING_ENABLED) {
      return;
    }
    
    try {
      // Get all tracked bills (across all users)
      const trackedBillRecords = await db
        .select({ billId: userBillTracking.billId })
        .from(userBillTracking)
        .groupBy(userBillTracking.billId);
      
      if (trackedBillRecords.length === 0) {
        return; // No tracked bills
      }
      
      console.log(`Updating ${trackedBillRecords.length} tracked bills`);
      
      let updatedCount = 0;
      for (const record of trackedBillRecords) {
        const wasUpdated = await this.updateSingleBill(record.billId);
        if (wasUpdated) updatedCount++;
        
        // Small delay to prevent overwhelming the TLO website
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} tracked bills with new information`);
      }
    } catch (error: any) {
      console.error('Error updating tracked bills:', error);
    }
  }
  
  /**
   * Update a single bill from the Texas Legislature Online website
   */
  private async updateSingleBill(billId: string): Promise<boolean> {
    try {
      // Extract chamber and number
      const [chamber, number] = this.extractBillComponents(billId);
      if (!chamber || !number) {
        console.error(`Invalid bill ID format: ${billId}`);
        return false;
      }
      
      // Build the TLO URL for this bill
      const url = this.buildBillUrl(chamber, number);
      
      // Fetch the bill page from TLO
      const response = await axios.get(url);
      if (response.status !== 200) {
        console.error(`Failed to fetch bill ${billId}, status: ${response.status}`);
        return false;
      }
      
      // Parse the HTML
      const $ = cheerio.load(response.data);
      
      // Extract bill title and caption
      const title = $('div.billTitleCaption h2').text().trim();
      const description = $('div.billTitleCaption p.caption').text().trim();
      
      // Get bill status
      const status = this.extractBillStatus($);
      
      // Get current author/sponsors
      const authors = this.extractAuthors($);
      
      // Get current committee
      const committee = this.extractCommittee($);
      
      // Get last action date and text
      const { lastActionAt, lastAction } = this.extractLastAction($);
      
      // Check if we have new history events
      const historyEvents = await this.extractHistoryEvents($, billId);
      const hasNewHistoryEvents = historyEvents.length > 0;
      
      // Update bill in database
      if (title || description || status || authors || committee || lastActionAt || lastAction || hasNewHistoryEvents) {
        // Get existing bill
        const existingBill = await db.select().from(bills).$dynamic().where(eq(bills.id, billId)).limit(1);
        
        // Prepare update data
        const updateData: any = {
          updatedAt: new Date()
        };
        
        if (title && title !== existingBill[0]?.title) updateData.title = title;
        if (description && description !== existingBill[0]?.description) updateData.description = description;
        if (status && status !== existingBill[0]?.status) updateData.status = status;
        // Store authors in sponsors array
        if (authors && authors !== existingBill[0]?.sponsors.join(', ')) updateData.sponsors = authors.split(', ');
        // We don't have a committee field in the bills table, but we'll use it for notifications
        if (lastActionAt && (!existingBill[0]?.lastActionAt || new Date(lastActionAt) > new Date(existingBill[0]?.lastActionAt))) {
          updateData.lastActionAt = lastActionAt;
          updateData.lastAction = lastAction;
        }
        
        // Update the bill record
        await db.update(bills)
          .set(updateData)
          .where(eq(bills.id, billId));
        
        // If this bill has meaningful updates, send notifications to users tracking it
        if ((status && status !== existingBill[0]?.status) || 
            (committee && committee.length > 0) || // We don't store committee in bills table, but use it for notifications
            (lastActionAt && (!existingBill[0]?.lastActionAt || new Date(lastActionAt) > new Date(existingBill[0]?.lastActionAt)))) {
          await this.createMovementNotifications(billId, updateData);
        }
        
        console.log(`Updated bill ${billId} with new information`);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error(`Error updating bill ${billId}:`, error);
      return false;
    }
  }
  
  /**
   * Create movement notifications for all users tracking this bill
   */
  private async createMovementNotifications(billId: string, updateData: any): Promise<void> {
    try {
      // Get all users tracking this bill
      const trackingUsers = await db
        .select({ userId: userBillTracking.userId })
        .from(userBillTracking).$dynamic()
        .where(eq(userBillTracking.billId, billId));
      
      if (trackingUsers.length === 0) return;
      
      // Create the notification message based on updates
      let message = '';
      if (updateData.status) {
        message = `Bill ${billId} status changed to ${updateData.status}`;
      } else if (updateData.committee) {
        message = `Bill ${billId} assigned to ${updateData.committee} committee`;
      } else if (updateData.lastAction) {
        message = `New action on bill ${billId}: ${updateData.lastAction}`;
      }
      
      // Create a notification for each tracking user
      for (const user of trackingUsers) {
        await db.insert(billMovementNotifications).values({
          userId: user.userId,
          billId,
          message,
          createdAt: new Date(),
          read: false
        });
      }
      
      console.log(`Created movement notifications for ${trackingUsers.length} users tracking bill ${billId}`);
    } catch (error: any) {
      console.error(`Error creating movement notifications for bill ${billId}:`, error);
    }
  }
  
  /**
   * Extract chamber and number from bill ID
   */
  private extractBillComponents(billId: string): [string, string] {
    // Format: TX-HB0001 or TX-SB0001
    const match = billId.match(/TX-(HB|SB)(\d+)/i);
    if (!match) return ['', ''];
    
    const chamber = match[1].toUpperCase();
    const number = match[2];
    return [chamber, number];
  }
  
  /**
   * Build the URL for a Texas Legislature Online bill page
   */
  private buildBillUrl(chamber: string, number: string): string {
    const billType = chamber === 'HB' ? 'house' : 'senate';
    // Format the number without leading zeros
    const billNum = parseInt(number, 10).toString();
    return `${this.TLO_BASE_URL}/BillLookup/History.aspx?LegSess=${this.CURRENT_SESSION}&Bill=${chamber}${billNum}`;
  }
  
  /**
   * Extract the current status of a bill from its TLO page
   */
  private extractBillStatus($: cheerio.CheerioAPI): string {
    // Try to find status information
    const statusText = $('div.stagesTable .label:contains("Last Action:")').next().text().trim().toLowerCase();
    
    if (statusText.includes('filed') || statusText.includes('introduced')) {
      return 'introduced';
    } else if (statusText.includes('committee')) {
      return 'in_committee';
    } else if (statusText.includes('passed') && statusText.includes('house') && !statusText.includes('senate')) {
      return 'passed_house';
    } else if (statusText.includes('passed') && statusText.includes('senate') && !statusText.includes('house')) {
      return 'passed_senate';
    } else if (statusText.includes('passed') && statusText.includes('house') && statusText.includes('senate')) {
      return 'passed_both';
    } else if (statusText.includes('sent to governor')) {
      return 'sent_to_governor';
    } else if (statusText.includes('signed by governor')) {
      return 'signed';
    } else if (statusText.includes('vetoed')) {
      return 'vetoed';
    } else {
      return 'unknown';
    }
  }
  
  /**
   * Extract authors and sponsors from a bill page
   */
  private extractAuthors($: cheerio.CheerioAPI): string {
    const authors: string[] = [];
    
    // Authors section
    $('div.authors ul li').each((_, elem) => {
      const author = $(elem).text().trim();
      if (author) authors.push(author);
    });
    
    // Sponsors section
    $('div.sponsors ul li').each((_, elem) => {
      const sponsor = $(elem).text().trim();
      if (sponsor) authors.push(sponsor);
    });
    
    return authors.join(', ');
  }
  
  /**
   * Extract committee information from a bill page
   */
  private extractCommittee($: cheerio.CheerioAPI): string {
    // Try to find committee information from the page
    const committeeElem = $('div.stagesTable .label:contains("Committee:")').next();
    return committeeElem.text().trim();
  }
  
  /**
   * Extract the last action date and text
   */
  private extractLastAction($: cheerio.CheerioAPI): { lastActionAt: Date | null, lastAction: string } {
    const lastActionText = $('div.stagesTable .label:contains("Last Action:")').next().text().trim();
    const lastActionDateText = $('div.stagesTable .label:contains("Last Action:")').nextAll('.date').text().trim();
    
    let lastActionAt: Date | null = null;
    if (lastActionDateText) {
      // Parse the date (format: MM/DD/YYYY)
      const dateParts = lastActionDateText.split('/');
      if (dateParts.length === 3) {
        lastActionAt = new Date(
          parseInt(dateParts[2]), // year
          parseInt(dateParts[0]) - 1, // month (0-based)
          parseInt(dateParts[1]) // day
        );
      }
    }
    
    return { lastActionAt, lastAction: lastActionText };
  }
  
  /**
   * Extract history events from a bill page and store them
   */
  private async extractHistoryEvents($: cheerio.CheerioAPI, billId: string): Promise<any[]> {
    const historyEvents: any[] = [];
    
    // Get existing history events for this bill
    const existingEvents = await db
      .select({ 
        date: billHistoryEvents.eventDate, 
        chamber: billHistoryEvents.chamber, 
        description: billHistoryEvents.action 
      })
      .from(billHistoryEvents).$dynamic()
      .where(eq(billHistoryEvents.billId, billId));
    
    // Create a Set of existing events for quick lookup
    const existingEventSet = new Set(
      existingEvents.map(event => `${event.date.toISOString()}-${event.chamber}-${event.description}`)
    );
    
    // Parse history table
    $('table.historyTable tr:not(:first-child)').each((_, row) => {
      const cols = $(row).find('td');
      
      if (cols.length >= 3) {
        const dateText = $(cols[0]).text().trim();
        const chamber = $(cols[1]).text().trim();
        const description = $(cols[2]).text().trim();
        
        if (dateText && chamber && description) {
          // Parse the date (format: MM/DD/YYYY)
          const dateParts = dateText.split('/');
          if (dateParts.length === 3) {
            const date = new Date(
              parseInt(dateParts[2]), // year
              parseInt(dateParts[0]) - 1, // month (0-based)
              parseInt(dateParts[1]) // day
            );
            
            // Check if this event already exists in our database
            const eventKey = `${date.toISOString()}-${chamber}-${description}`;
            if (!existingEventSet.has(eventKey)) {
              // This is a new event, store it
              historyEvents.push({
                billId,
                date,
                chamber,
                description,
                createdAt: new Date()
              });
            }
          }
        }
      }
    });
    
    // Store new history events
    if (historyEvents.length > 0) {
      // Need to map the old fields to the new schema field names
      const eventsToInsert = historyEvents.map(event => ({
        billId: event.billId,
        eventDate: event.date,
        chamber: event.chamber,
        action: event.description,
        createdAt: event.createdAt
      }));
      
      await db.insert(billHistoryEvents).values(eventsToInsert);
      console.log(`Stored ${historyEvents.length} new history events for bill ${billId}`);
    }
    
    return historyEvents;
  }
}

// Create a singleton instance
export const billTrackingService = new BillTrackingService();