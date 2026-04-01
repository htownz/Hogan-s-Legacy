import { db } from "../db";
import { 
  legislators, 
  Legislator, 
  InsertLegislator,
  legislatorVotes, 
  legislatorAccessories,
  legislatorRatings,
  bills
} from "@shared/schema";
import { eq, inArray, and, or, sql } from "drizzle-orm";
import axios from "axios";
import { SERVER_CONFIG } from "../config";
import { createLogger } from "../logger";
const log = createLogger("legislator-service");


export class LegislatorService {
  async getAllLegislators(): Promise<Legislator[]> {
    return await db.select().from(legislators);
  }

  async getLegislatorById(id: number): Promise<Legislator | null> {
    const result = await db.select().from(legislators).$dynamic().where(eq(legislators.id, id));
    return result.length > 0 ? result[0] : null;
  }

  async getLegislatorsByParty(party: string): Promise<Legislator[]> {
    return await db.select().from(legislators).$dynamic().where(eq(legislators.party, party));
  }

  async getLegislatorsByIds(ids: number[]): Promise<Legislator[]> {
    return await db.select().from(legislators).$dynamic().where(inArray(legislators.id, ids));
  }

  async getLegislatorsByChamber(chamber: string): Promise<Legislator[]> {
    return await db.select().from(legislators).$dynamic().where(eq(legislators.chamber, chamber));
  }

  async getLegislatorVotes(legislatorId: number) {
    return await db.select()
      .from(legislatorVotes).$dynamic()
      .where(eq(legislatorVotes.legislatorId, legislatorId));
  }

  async getLegislatorAccessories(legislatorId: number) {
    return await db.select()
      .from(legislatorAccessories).$dynamic()
      .where(eq(legislatorAccessories.legislatorId, legislatorId));
  }

  async getLegislatorRatings(legislatorId: number) {
    return await db.select()
      .from(legislatorRatings).$dynamic()
      .where(eq(legislatorRatings.legislatorId, legislatorId));
  }

  async getBillsFromLegislator(legislatorId: number) {
    // Get the legislator to check name
    const legislator = await this.getLegislatorById(legislatorId);
    if (!legislator) return [];

    // Find bills where this legislator is a sponsor or co-sponsor
    return await db.select()
      .from(bills).$dynamic()
      .where(
        or(
          sql`${bills.sponsors}::text[] @> ARRAY[${legislator.name}]::text[]`,
          sql`${bills.cosponsors}::text[] @> ARRAY[${legislator.name}]::text[]`
        )
      );
  }

  async fetchLegislatorFromExternalApi(texasId: string): Promise<Partial<InsertLegislator> | null> {
    try {
      // In production, this would connect to the Texas Tribune API, Ballotpedia, OpenStates, etc.
      // For demonstration purposes, we're simulating this with a placeholder response
      log.info(`[LegislatorService] Fetching legislator data for ID: ${texasId} from external APIs`);
      
      // Mockup of data we might receive from an API
      const legislatorData = {
        name: `Legislator ${texasId}`,
        fullName: `Legislator Full Name ${texasId}`,
        chamber: Math.random() > 0.5 ? "house" : "senate",
        district: String(Math.floor(Math.random() * 150) + 1),
        party: Math.random() > 0.7 ? "D" : Math.random() > 0.5 ? "R" : "I",
        biography: "Biography would be fetched from external sources.",
        committees: [],
        topDonors: [],
        donorCategories: [],
        ideologyScore: Math.floor(Math.random() * 100),
        term: "2023-2025",
      };
      
      return legislatorData;
    } catch (error: any) {
      log.error({ err: error }, "[LegislatorService] Error fetching legislator data");
      return null;
    }
  }

  async createOrUpdateLegislator(data: InsertLegislator): Promise<Legislator> {
    // Check if legislator already exists (by name and district)
    const existingLegislator = await db.select()
      .from(legislators).$dynamic()
      .where(
        and(
          eq(legislators.name, data.name),
          eq(legislators.district, data.district)
        )
      );
    
    if (existingLegislator.length > 0) {
      // Update
      const [updated] = await db.update(legislators)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(legislators.id, existingLegislator[0].id))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db.insert(legislators)
        .values(data)
        .returning();
      return created;
    }
  }
}

export const legislatorService = new LegislatorService();