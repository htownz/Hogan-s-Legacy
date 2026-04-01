// @ts-nocheck
import axios from "axios";
import { parseStringPromise } from "xml2js";
import { createId } from "@paralleldrive/cuid2";
import { 
  rssLegislativeUpdates, 
  type InsertLegislativeUpdate 
} from "@shared/schema-legislative-updates";
import { db } from "../db";
import { eq, or, ilike } from "drizzle-orm";
import { createLogger } from "../logger";
const log = createLogger("rss-feed-service");


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
      log.info(`No items found in RSS feed: ${url}`);
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
    log.error({ err: error }, `Error fetching RSS feed from ${url}`);
    return [];
  }
}

// Function to refresh RSS feeds
export async function refreshRssFeeds() {
  log.info("Starting RSS feed update");
  
  try {
    let totalUpdates = 0;
    
    for (const feed of RSS_FEEDS) {
      try {
        const updates = await fetchRssFeed(feed.url, feed.category, feed.sourceName);
        
        for (const update of updates) {
          try {
            // Check if this update already exists by title and link
            const existingUpdates = await db
              .select()
              .from(rssLegislativeUpdates).$dynamic()
              .where(
                or(
                  eq(rssLegislativeUpdates.title, update.title),
                  eq(rssLegislativeUpdates.link, update.link)
                )
              )
              .limit(1);
            
            if (existingUpdates.length === 0) {
              // Insert the new update
              await db.insert(rssLegislativeUpdates).values(update);
              totalUpdates++;
            }
          } catch (error: any) {
            log.error({ err: error }, "Error saving individual update");
          }
        }
      } catch (feedError: any) {
        log.error({ err: feedError }, `Error processing feed ${feed.url}`);
      }
    }
    
    log.info(`RSS feed update completed. Added ${totalUpdates} new updates`);
    return totalUpdates;
  } catch (error: any) {
    log.error({ err: error }, "Error refreshing RSS feeds");
    throw error;
  }
}

// Function to schedule periodic refresh
export function scheduleRssFeedRefresh(intervalMinutes = 60) {
  log.info(`RSS feed refresh temporarily disabled to fix server issues`);
  
  // Disabled initial refresh
  // refreshRssFeeds().catch(error => {
  //   log.error({ err: error }, "Error in initial RSS feed refresh");
  // });
  
  // Scheduled refreshes (disabled)
  // setInterval(() => {
  //   refreshRssFeeds().catch(error => {
  //     log.error({ err: error }, "Error in scheduled RSS feed refresh");
  //   });
  // }, intervalMinutes * 60 * 1000);
}

// Export the service
export const rssFeedService = {
  refreshRssFeeds,
  scheduleRssFeedRefresh
};