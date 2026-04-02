/**
 * Search routes — unified search across bills & legislators,
 * search suggestions, and trending searches.
 */
import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { createLogger } from "../logger";

const log = createLogger("routes-search");
const router = Router();

/** Simple relevance score: word overlap ratio. */
function calculateRelevance(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(" ");
  const textLower = text.toLowerCase();
  let score = 0;
  queryWords.forEach((word) => {
    if (textLower.includes(word)) {
      score += word.length;
    }
  });
  return score / text.length;
}

// Unified search (bills + legislators)
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q: query, type, chamber, status, party } = req.query;

    if (!query || typeof query !== "string" || query.length < 2) {
      return res.json({ results: [], total: 0 });
    }

    const results: any[] = [];
    const searchTerm = query.toLowerCase();

    // Search bills
    if (!type || type === "bill") {
      const bills = await storage.getAllBills();
      const matchingBills = bills
        .filter(
          (bill: any) =>
            bill.title.toLowerCase().includes(searchTerm) ||
            bill.description.toLowerCase().includes(searchTerm) ||
            (bill.billNumber && bill.billNumber.toLowerCase().includes(searchTerm))
        )
        .filter((bill: any) => {
          if (chamber && bill.chamber.toLowerCase() !== (chamber as string).toLowerCase()) return false;
          if (status && bill.status.toLowerCase() !== (status as string).toLowerCase()) return false;
          return true;
        });

      results.push(
        ...matchingBills.slice(0, 10).map((bill: any) => ({
          id: bill.id,
          type: "bill",
          title: bill.title,
          description: bill.description,
          relevanceScore: calculateRelevance(searchTerm, bill.title + " " + bill.description),
          metadata: {
            chamber: bill.chamber,
            status: bill.status,
            date: bill.introducedAt?.toISOString?.() || new Date().toISOString(),
            sponsor: bill.sponsors || "Unknown",
            billNumber: bill.billNumber,
          },
        }))
      );
    }

    // Search legislators
    if (!type || type === "legislator") {
      const legislators = await storage.getAllLegislators();
      const matchingLegislators = legislators
        .filter(
          (leg: any) =>
            `${leg.firstName} ${leg.lastName}`.toLowerCase().includes(searchTerm) ||
            (leg.district && leg.district.toString().includes(searchTerm))
        )
        .filter((leg: any) => {
          if (party && leg.party?.toLowerCase() !== (party as string).toLowerCase()) return false;
          if (chamber && leg.chamber?.toLowerCase() !== (chamber as string).toLowerCase()) return false;
          return true;
        });

      results.push(
        ...matchingLegislators.slice(0, 10).map((leg: any) => ({
          id: leg.id,
          type: "legislator",
          title: `${leg.firstName} ${leg.lastName}`,
          description: `${leg.party || "Unknown"} - District ${leg.district || "Unknown"}`,
          relevanceScore: calculateRelevance(
            searchTerm,
            `${leg.firstName} ${leg.lastName} ${leg.party}`
          ),
          metadata: {
            party: leg.party,
            district: leg.district,
            chamber: leg.chamber,
            email: leg.email,
          },
        }))
      );
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      results: results.slice(0, 20),
      total: results.length,
    });
  } catch (error: any) {
    log.error({ err: error }, "Search error");
    res.status(500).json({ error: "Search failed" });
  }
});

// Search suggestions
router.get("/search/suggestions", async (req: Request, res: Response) => {
  try {
    const { q: query } = req.query;

    if (!query || typeof query !== "string" || query.length < 1) {
      return res.json({ suggestions: [] });
    }

    const suggestions: string[] = [];
    const searchTerm = query.toLowerCase();

    const bills = await storage.getAllBills();
    const billSuggestions = bills
      .filter((bill: any) => bill.title.toLowerCase().includes(searchTerm))
      .slice(0, 3)
      .map((bill: any) => bill.title);

    const legislators = await storage.getAllLegislators();
    const legislatorSuggestions = legislators
      .filter((leg: any) =>
        `${leg.firstName} ${leg.lastName}`.toLowerCase().includes(searchTerm)
      )
      .slice(0, 3)
      .map((leg: any) => `${leg.firstName} ${leg.lastName}`);

    suggestions.push(...billSuggestions, ...legislatorSuggestions);

    res.json({ suggestions: suggestions.slice(0, 5) });
  } catch (error: any) {
    log.error({ err: error }, "Suggestions error");
    res.json({ suggestions: [] });
  }
});

// Trending searches
router.get("/search/trending", async (_req: Request, res: Response) => {
  try {
    const trending = [
      "education funding",
      "healthcare reform",
      "infrastructure bill",
      "voting rights",
      "border security",
      "property tax",
      "renewable energy",
      "criminal justice",
    ];
    res.json({ trending });
  } catch (error: any) {
    log.error({ err: error }, "Trending error");
    res.json({ trending: [] });
  }
});

export default router;
