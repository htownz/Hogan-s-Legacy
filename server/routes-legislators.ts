import { Express, Request, Response } from "express";
import { legislatorService } from "./services/legislator-service";
import { isAuthenticated } from "./auth";
import { CustomRequest } from "./types";
import {
  getLegislatorNews,
  getLegislatorDistrict,
  getLegislatorConstituents,
  getLegislatorFinance,
  getLegislatorVotingHistory,
  getLegislatorEthics,
  getLegislatorAiSummary
} from "./routes-legislator-advanced";

/**
 * Register legislator API routes
 */
export function registerLegislatorRoutes(app: Express): void {
  /**
   * Direct data pull for current Texas state legislators from OpenStates API
   */
  app.get('/api/legislators', async (req: Request, res: Response) => {
    try {
      console.log('🏛️ EXECUTING DIRECT DATA PULL: Current Texas State Legislators from OpenStates API...');
      
      // Import OpenStates API service
      const { openStatesAPI } = await import('./services/openstates-api');
      
      if (!openStatesAPI.isConfigured()) {
        console.log('❌ OpenStates API key not configured');
        return res.status(400).json({
          success: false,
          error: 'OpenStates API key not configured'
        });
      }

      console.log('🔄 Calling OpenStates API for authentic Texas legislative data...');
      const legislators = await openStatesAPI.getTexasLegislators();
      
      console.log(`✅ DIRECT PULL SUCCESSFUL: ${legislators.length} current Texas legislators retrieved`);
      console.log(`📋 Sample legislator: ${legislators[0]?.name} (${legislators[0]?.party}, District ${legislators[0]?.district})`);
      
      // Return the authentic Texas legislative data
      res.json(legislators);
      
    } catch (error: any) {
      console.error('❌ ERROR in direct Texas legislator data pull:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve current Texas legislators from OpenStates',
        details: error.message
      });
    }
  });

  /**
   * Get legislators by chamber (house or senate)
   */
  app.get('/api/legislators/chamber/:chamber', async (req: Request, res: Response) => {
    try {
      const { chamber } = req.params;
      if (!chamber || (chamber !== 'house' && chamber !== 'senate')) {
        return res.status(400).json({ error: "Invalid chamber type. Must be 'house' or 'senate'" });
      }

      const legislators = await legislatorService.getLegislatorsByChamber(chamber);
      res.json(legislators);
    } catch (error: any) {
      console.error("Error fetching legislators by chamber:", error);
      res.status(500).json({ error: "Failed to fetch legislators by chamber" });
    }
  });

  /**
   * Get legislators by party
   */
  app.get('/api/legislators/party/:party', async (req: Request, res: Response) => {
    try {
      const { party } = req.params;
      if (!party || !['D', 'R', 'I'].includes(party)) {
        return res.status(400).json({ error: "Invalid party. Must be 'D', 'R', or 'I'" });
      }

      const legislators = await legislatorService.getLegislatorsByParty(party);
      res.json(legislators);
    } catch (error: any) {
      console.error("Error fetching legislators by party:", error);
      res.status(500).json({ error: "Failed to fetch legislators by party" });
    }
  });

  /**
   * Get a legislator by ID
   */
  app.get('/api/legislators/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid legislator ID" });
      }

      const legislator = await legislatorService.getLegislatorById(id);
      if (!legislator) {
        return res.status(404).json({ error: "Legislator not found" });
      }

      res.json(legislator);
    } catch (error: any) {
      console.error("Error fetching legislator:", error);
      res.status(500).json({ error: "Failed to fetch legislator" });
    }
  });

  /**
   * Get votes by legislator ID
   */
  app.get('/api/legislators/:id/votes', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid legislator ID" });
      }

      const votes = await legislatorService.getLegislatorVotes(id);
      res.json(votes);
    } catch (error: any) {
      console.error("Error fetching legislator votes:", error);
      res.status(500).json({ error: "Failed to fetch legislator votes" });
    }
  });

  /**
   * Get accessories by legislator ID (for cartoon avatars)
   */
  app.get('/api/legislators/:id/accessories', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid legislator ID" });
      }

      const accessories = await legislatorService.getLegislatorAccessories(id);
      res.json(accessories);
    } catch (error: any) {
      console.error("Error fetching legislator accessories:", error);
      res.status(500).json({ error: "Failed to fetch legislator accessories" });
    }
  });

  /**
   * Get ratings by legislator ID
   */
  app.get('/api/legislators/:id/ratings', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid legislator ID" });
      }

      const ratings = await legislatorService.getLegislatorRatings(id);
      res.json(ratings);
    } catch (error: any) {
      console.error("Error fetching legislator ratings:", error);
      res.status(500).json({ error: "Failed to fetch legislator ratings" });
    }
  });

  /**
   * Get bills sponsored by legislator ID
   */
  app.get('/api/legislators/:id/bills', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid legislator ID" });
      }

      const bills = await legislatorService.getBillsFromLegislator(id);
      res.json(bills);
    } catch (error: any) {
      console.error("Error fetching legislator's bills:", error);
      res.status(500).json({ error: "Failed to fetch legislator's bills" });
    }
  });

  /**
   * ADVANCED LEGISLATOR PROFILE ENDPOINTS
   * These endpoints provide detailed data for the advanced legislator profile view
   */

  /**
   * Get news articles related to legislator
   */
  app.get('/api/legislators/:id/news', getLegislatorNews);

  /**
   * Get district data for legislator
   */
  app.get('/api/legislators/:id/district', getLegislatorDistrict);

  /**
   * Get constituent data for legislator
   */
  app.get('/api/legislators/:id/constituents', getLegislatorConstituents);

  /**
   * Get campaign finance data for legislator
   */
  app.get('/api/legislators/:id/finance', getLegislatorFinance);

  /**
   * Get detailed voting history for legislator
   */
  app.get('/api/legislators/:id/voting-history', getLegislatorVotingHistory);

  /**
   * Get ethics and transparency data for legislator
   */
  app.get('/api/legislators/:id/ethics', getLegislatorEthics);

  /**
   * Get AI-generated summary for legislator
   */
  app.get('/api/legislators/:id/ai-summary', getLegislatorAiSummary);
}