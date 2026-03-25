// @ts-nocheck
import { Express, Request, Response } from "express";
import { legislativeUpdatesStorage } from "./storage-legislative-updates";
import { legislativeUpdateQuerySchema } from "@shared/schema-legislative-updates";
import { createId } from "@paralleldrive/cuid2";
import axios from "axios";
import { parseStringPromise } from "xml2js";

// RSS Feed URLs
const RSS_FEEDS = [
  {
    url: "https://capitol.texas.gov/tlodocs/rss/allhfilings.xml",
    category: "House",
    sourceName: "House Bill Filings"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/allsfilings.xml",
    category: "Senate",
    sourceName: "Senate Bill Filings"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/hcalendar.xml",
    category: "House",
    sourceName: "House Calendar"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/scalendar.xml",
    category: "Senate",
    sourceName: "Senate Calendar"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/schamend.xml",
    category: "Senate",
    sourceName: "Senate Chamber Amendments"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/hchamend.xml",
    category: "House",
    sourceName: "House Chamber Amendments"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/scomamend.xml",
    category: "Senate",
    sourceName: "Senate Committee Amendments"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/hcomamend.xml",
    category: "House",
    sourceName: "House Committee Amendments"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/hcommittee.xml",
    category: "House",
    sourceName: "House Committee Activity"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/scommittee.xml",
    category: "Senate",
    sourceName: "Senate Committee Activity"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/allcommittee.xml",
    category: "Legislature",
    sourceName: "All Committee Activity"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/hlookahead.xml",
    category: "House",
    sourceName: "House Look Ahead"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/slookahead.xml",
    category: "Senate",
    sourceName: "Senate Look Ahead"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/alllookahead.xml",
    category: "Legislature",
    sourceName: "All Look Ahead"
  },
  {
    url: "https://capitol.texas.gov/tlodocs/rss/lastaction.xml",
    category: "Legislature",
    sourceName: "Last Action"
  }
];

// Helper functions
function extractBillId(text: string): string | null {
  // Match patterns like HB 123, SB 456, etc.
  const billRegex = /\b([HS][BR]\s?\d+)\b/i;
  const match = text.match(billRegex);
  return match ? match[1].replace(/\s+/g, '') : null;
}

async function fetchRssFeed(url: string, category: string, sourceName: string) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const parsedXml = await parseStringPromise(response.data);
    
    if (!parsedXml.rss || !parsedXml.rss.channel || !parsedXml.rss.channel[0].item) {
      console.log(`No items found in RSS feed: ${url}`);
      return [];
    }
    
    const items = parsedXml.rss.channel[0].item;
    const updates = items.map((item: any) => {
      const title = item.title ? item.title[0] : "";
      const description = item.description ? item.description[0] : "";
      const link = item.link ? item.link[0] : "";
      const pubDate = item.pubDate ? item.pubDate[0] : "";
      const billId = extractBillId(title) || extractBillId(description);
      
      return {
        id: createId(),
        title,
        description,
        link,
        sourceType: "rss",
        sourceName,
        category,
        billId,
        publicationDate: new Date(pubDate),
        isRead: false
      };
    });
    
    return updates;
  } catch (error: any) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return [];
  }
}

// Register routes
export function registerLegislativeUpdatesRoutes(app: Express) {
  // Get legislative updates with pagination and filtering
  app.get("/api/legislative-updates", async (req: Request, res: Response) => {
    try {
      const validatedQuery = legislativeUpdateQuerySchema.parse({
        page: req.query.page,
        limit: req.query.limit,
        q: req.query.q,
        category: req.query.category,
        billId: req.query.billId,
        unreadOnly: req.query.unreadOnly,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      });
      
      const result = await legislativeUpdatesStorage.getLegislativeUpdates(validatedQuery);
      res.json(result);
    } catch (error: any) {
      console.error("Error getting legislative updates:", error);
      res.status(500).json({ error: "Failed to get legislative updates" });
    }
  });
  
  // Get legislative update stats
  app.get("/api/legislative-updates/stats", async (req: Request, res: Response) => {
    try {
      const stats = await legislativeUpdatesStorage.getStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error getting legislative update stats:", error);
      res.status(500).json({ error: "Failed to get legislative update statistics" });
    }
  });
  
  // Get a specific legislative update by ID
  app.get("/api/legislative-updates/:id", async (req: Request, res: Response) => {
    try {
      const update = await legislativeUpdatesStorage.getLegislativeUpdateById(req.params.id);
      
      if (!update) {
        res.status(404).json({ error: "Legislative update not found" });
        return;
      }
      
      res.json(update);
    } catch (error: any) {
      console.error("Error getting legislative update:", error);
      res.status(500).json({ error: "Failed to get legislative update" });
    }
  });
  
  // Mark a legislative update as read
  app.post("/api/legislative-updates/:id/read", async (req: Request, res: Response) => {
    try {
      const success = await legislativeUpdatesStorage.markAsRead(req.params.id);
      
      if (!success) {
        res.status(404).json({ error: "Legislative update not found" });
        return;
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking legislative update as read:", error);
      res.status(500).json({ error: "Failed to mark legislative update as read" });
    }
  });
  
  // Mark all legislative updates as read
  app.post("/api/legislative-updates/mark-all-read", async (req: Request, res: Response) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const count = await legislativeUpdatesStorage.markAllAsRead(category);
      
      res.json({ success: true, count });
    } catch (error: any) {
      console.error("Error marking all legislative updates as read:", error);
      res.status(500).json({ error: "Failed to mark all legislative updates as read" });
    }
  });
  
  // Refresh RSS feeds
  app.post("/api/legislative-updates/refresh", async (req: Request, res: Response) => {
    try {
      // Run the refresh in the background
      refreshRssFeeds().catch(error => {
        console.error("Error in background RSS refresh:", error);
      });
      
      res.json({ success: true, message: "RSS feed refresh started" });
    } catch (error: any) {
      console.error("Error starting RSS feed refresh:", error);
      res.status(500).json({ error: "Failed to start RSS feed refresh" });
    }
  });
}

// Function to refresh RSS feeds
export async function refreshRssFeeds() {
  console.log("Starting RSS feed update");
  
  try {
    let totalUpdates = 0;
    
    for (const feed of RSS_FEEDS) {
      const updates = await fetchRssFeed(feed.url, feed.category, feed.sourceName);
      
      for (const update of updates) {
        try {
          // Check if this update already exists by title and link
          const existingUpdates = await legislativeUpdatesStorage.getLegislativeUpdates({
            page: 1,
            limit: 1,
            q: update.title
          });
          
          const exists = existingUpdates.data.some(existing => 
            existing.title === update.title && 
            existing.link === update.link
          );
          
          if (!exists) {
            await legislativeUpdatesStorage.createLegislativeUpdate(update);
            totalUpdates++;
          }
        } catch (error: any) {
          console.error("Error saving update:", error);
        }
      }
    }
    
    console.log(`RSS feed update completed. Added ${totalUpdates} new updates`);
    return totalUpdates;
  } catch (error: any) {
    console.error("Error refreshing RSS feeds:", error);
    throw error;
  }
}