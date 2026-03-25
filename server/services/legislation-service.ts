import { dynamoService } from '../aws/dynamoService';
import { Bill } from '../../client/src/components/legislation/BillCard';

// Table name for legislation data
const LEGISLATION_TABLE = 'act-up-legislation';
const USER_TRACKED_BILLS_TABLE = 'act-up-user-tracked-bills';

/**
 * Service for legislation-related operations
 */
export class LegislationService {
  /**
   * Get all bills
   * @returns Promise resolving to array of bills
   */
  async getAllBills(): Promise<Bill[]> {
    try {
      // Check if table exists, if not return mock data
      const tableExists = await dynamoService.tableExists(LEGISLATION_TABLE);
      if (!tableExists) {
        console.log('Legislation table does not exist, returning mock data');
        return this.getMockBills();
      }
      
      const bills = await dynamoService.scan<Bill>(LEGISLATION_TABLE);
      return bills;
    } catch (error: any) {
      console.error('Error getting all bills:', error);
      // Return mock data in case of error
      return this.getMockBills();
    }
  }
  
  /**
   * Get bills tracked by a user
   * @param userId - User ID
   * @returns Promise resolving to array of tracked bills
   */
  async getTrackedBills(userId: number): Promise<Bill[]> {
    try {
      // Check if table exists, if not return mock data
      const tableExists = await dynamoService.tableExists(USER_TRACKED_BILLS_TABLE);
      if (!tableExists) {
        console.log('User tracked bills table does not exist, returning mock data');
        return this.getMockBills().slice(0, 2);  // Return subset of mock bills as tracked
      }
      
      // Get tracked bill IDs for the user
      const trackedItems = await dynamoService.queryItems<{ billId: string }>(
        USER_TRACKED_BILLS_TABLE,
        'userId = :userId',
        { ':userId': userId }
      );
      
      if (!trackedItems || trackedItems.length === 0) {
        return [];
      }
      
      // Get bill details for each tracked bill
      const trackedBillIds = trackedItems.map(item => item.billId);
      
      // For the actual implementation, we would query each bill by ID
      // For now, just filter mock bills to simulate tracked bills
      const allBills = await this.getAllBills();
      return allBills.filter(bill => trackedBillIds.includes(bill.id));
    } catch (error: any) {
      console.error('Error getting tracked bills:', error);
      return this.getMockBills().slice(0, 2);  // Return subset of mock bills as tracked
    }
  }
  
  /**
   * Track a bill for a user
   * @param userId - User ID
   * @param billId - Bill ID to track
   * @returns Promise resolving when bill is tracked
   */
  async trackBill(userId: number, billId: string): Promise<void> {
    try {
      // Check if table exists, create if it doesn't (in a real implementation)
      const tableExists = await dynamoService.tableExists(USER_TRACKED_BILLS_TABLE);
      if (!tableExists) {
        console.log('User tracked bills table does not exist');
        // In a real implementation, we would create the table here
        return;
      }
      
      // Track the bill
      await dynamoService.putItem(USER_TRACKED_BILLS_TABLE, {
        userId,
        billId,
        trackedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error tracking bill:', error);
      throw error;
    }
  }
  
  /**
   * Untrack a bill for a user
   * @param userId - User ID
   * @param billId - Bill ID to untrack
   * @returns Promise resolving when bill is untracked
   */
  async untrackBill(userId: number, billId: string): Promise<void> {
    try {
      // Check if table exists
      const tableExists = await dynamoService.tableExists(USER_TRACKED_BILLS_TABLE);
      if (!tableExists) {
        console.log('User tracked bills table does not exist');
        return;
      }
      
      // Untrack the bill
      await dynamoService.deleteItem(USER_TRACKED_BILLS_TABLE, {
        userId,
        billId
      });
    } catch (error: any) {
      console.error('Error untracking bill:', error);
      throw error;
    }
  }
  
  /**
   * Search for bills by query
   * @param query - Search query
   * @returns Promise resolving to array of matching bills
   */
  async searchBills(query: string): Promise<Bill[]> {
    try {
      // Get all bills and filter by query
      const allBills = await this.getAllBills();
      const lowerQuery = query.toLowerCase();
      
      return allBills.filter(bill => 
        bill.title.toLowerCase().includes(lowerQuery) || 
        bill.description.toLowerCase().includes(lowerQuery) ||
        bill.topics.some(topic => topic.toLowerCase().includes(lowerQuery))
      );
    } catch (error: any) {
      console.error('Error searching bills:', error);
      return [];
    }
  }
  
  /**
   * Check if a bill is tracked by a user
   * @param userId - User ID
   * @param billId - Bill ID to check
   * @returns Promise resolving to boolean indicating if bill is tracked
   */
  async isBillTracked(userId: number, billId: string): Promise<boolean> {
    try {
      // Check if table exists
      const tableExists = await dynamoService.tableExists(USER_TRACKED_BILLS_TABLE);
      if (!tableExists) {
        return false;
      }
      
      // Check if bill is tracked
      const item = await dynamoService.getItem(USER_TRACKED_BILLS_TABLE, {
        userId,
        billId
      });
      
      return !!item;
    } catch (error: any) {
      console.error('Error checking if bill is tracked:', error);
      return false;
    }
  }
  
  /**
   * Get a bill by ID
   * @param billId - Bill ID
   * @returns Promise resolving to bill if found, undefined otherwise
   */
  async getBillById(billId: string): Promise<Bill | undefined> {
    try {
      // Check if table exists, if not return mock data
      const tableExists = await dynamoService.tableExists(LEGISLATION_TABLE);
      if (!tableExists) {
        console.log('Legislation table does not exist, checking mock data');
        return this.getMockBills().find(bill => bill.id === billId);
      }
      
      // Get the bill by ID
      const bill = await dynamoService.getItem<Bill>(LEGISLATION_TABLE, { id: billId });
      return bill;
    } catch (error: any) {
      console.error('Error getting bill by ID:', error);
      return this.getMockBills().find(bill => bill.id === billId);
    }
  }
  
  /**
   * Generate mock bills for development and testing
   * @returns Array of mock bills
   */
  private getMockBills(): Bill[] {
    return [
      {
        id: "tx-hr-1234",
        title: "Texas Clean Energy Act",
        description: "A bill to incentivize renewable energy development and reduce carbon emissions through tax incentives for clean energy production.",
        status: "in_committee",
        chamber: "house",
        introducedAt: "2023-01-15T00:00:00.000Z",
        lastActionAt: "2023-02-28T00:00:00.000Z",
        sponsors: ["Rep. Maria Rodriguez", "Rep. John Smith"],
        topics: ["Energy", "Environment", "Economy"]
      },
      {
        id: "tx-sr-5678",
        title: "Educational Opportunity Expansion",
        description: "Establishes new funding mechanisms for public schools and expands scholarship opportunities for low-income students.",
        status: "passed_senate",
        chamber: "senate",
        introducedAt: "2023-02-10T00:00:00.000Z",
        lastActionAt: "2023-04-05T00:00:00.000Z",
        sponsors: ["Sen. Robert Johnson", "Sen. Linda Garcia"],
        topics: ["Education", "Budget", "Social Services"]
      },
      {
        id: "tx-hr-9012",
        title: "Infrastructure Development and Jobs Act",
        description: "Authorizes $15 billion for infrastructure improvements throughout Texas, focusing on roads, bridges, and public transportation systems.",
        status: "introduced",
        chamber: "house",
        introducedAt: "2023-03-05T00:00:00.000Z",
        lastActionAt: "2023-03-05T00:00:00.000Z",
        sponsors: ["Rep. David Wilson", "Rep. Sarah Martinez", "Rep. Michael Lee"],
        topics: ["Infrastructure", "Jobs", "Transportation", "Economy"]
      },
      {
        id: "tx-sr-3456",
        title: "Healthcare Access Improvement",
        description: "Expands Medicaid eligibility and implements new programs to improve healthcare access in rural areas of Texas.",
        status: "introduced",
        chamber: "senate",
        introducedAt: "2023-03-10T00:00:00.000Z",
        lastActionAt: "2023-03-20T00:00:00.000Z",
        sponsors: ["Sen. Elizabeth Brown"],
        topics: ["Healthcare", "Rural Development", "Social Services"]
      },
      {
        id: "tx-hr-7890",
        title: "Water Conservation and Management",
        description: "Establishes new regulations and incentives for water conservation, addressing drought concerns across the state.",
        status: "passed_house",
        chamber: "house",
        introducedAt: "2023-01-20T00:00:00.000Z",
        lastActionAt: "2023-04-02T00:00:00.000Z",
        sponsors: ["Rep. Thomas Garcia", "Rep. Jennifer Adams", "Rep. Andrew Scott"],
        topics: ["Environment", "Agriculture", "Water Resources"]
      },
      {
        id: "tx-sr-2468",
        title: "Criminal Justice Reform Act",
        description: "Implements comprehensive reforms to sentencing guidelines, bail procedures, and provides funding for rehabilitation programs.",
        status: "in_committee",
        chamber: "senate",
        introducedAt: "2023-02-15T00:00:00.000Z",
        lastActionAt: "2023-03-25T00:00:00.000Z",
        sponsors: ["Sen. Marcus Davis", "Sen. Rachel Williams"],
        topics: ["Criminal Justice", "Public Safety", "Legal Reform"]
      },
      {
        id: "tx-hr-1357",
        title: "Small Business Support and Recovery",
        description: "Creates tax incentives and grants for small businesses impacted by economic hardships and establishes a small business development office.",
        status: "signed",
        chamber: "house",
        introducedAt: "2022-11-10T00:00:00.000Z",
        lastActionAt: "2023-01-05T00:00:00.000Z",
        sponsors: ["Rep. Daniel Lopez", "Rep. Emily Chen", "Rep. Ryan Taylor"],
        topics: ["Business", "Economy", "Jobs"]
      },
      {
        id: "tx-sr-8642",
        title: "Public School Teacher Pay Increase",
        description: "Mandates a minimum 5% increase in teacher salaries statewide and establishes a performance-based bonus system.",
        status: "vetoed",
        chamber: "senate",
        introducedAt: "2022-12-05T00:00:00.000Z",
        lastActionAt: "2023-03-30T00:00:00.000Z",
        sponsors: ["Sen. Victoria Adams", "Sen. Christopher Johnson", "Sen. Lauren Miller"],
        topics: ["Education", "Budget", "Labor"]
      }
    ];
  }
}

export const legislationService = new LegislationService();