/**
 * Script to analyze bills from the 89th legislative session for potential points of order
 * 
 * This script:
 * 1. Fetches bills from the 89th legislative session
 * 2. Checks if they have full text content
 * 3. Runs the bill analyzer to detect potential points of order
 * 4. Stores the results in the database
 */

import { db } from "../server/db";
import { bills } from "../shared/schema";
import { eq } from "drizzle-orm";
import { billPOOAnalyzer } from "../server/services/bill-point-of-order-analyzer";

const SESSION_ID = "89R"; // 89th Regular Session

/**
 * Process bills in batches to avoid overwhelming the OpenAI API
 * @param billIds Array of bill IDs to process
 * @param batchSize Size of each batch
 */
async function processBillsInBatches(billIds: string[], batchSize: number = 5) {
  const totalBills = billIds.length;
  let processedCount = 0;
  
  console.log(`Starting analysis of ${totalBills} bills from the ${SESSION_ID} session`);
  
  // Process in batches to manage API rate limits
  for (let i = 0; i < totalBills; i += batchSize) {
    const batch = billIds.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalBills / batchSize)}`);
    
    const results = await billPOOAnalyzer.analyzeBillBatch(batch, true);
    
    // Log results summary
    for (const result of results) {
      if (result.analysis && Array.isArray(result.analysis)) {
        const issuesFound = result.analysis.filter(issue => !issue.error).length;
        console.log(`Bill ${result.billId}: ${issuesFound} potential issues found`);
      }
    }
    
    processedCount += batch.length;
    console.log(`Progress: ${processedCount}/${totalBills} bills analyzed (${Math.round(processedCount/totalBills*100)}%)`);
    
    // Add delay between batches to avoid API rate limits
    if (i + batchSize < totalBills) {
      console.log("Waiting before processing next batch...");
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
    }
  }
  
  console.log(`Analysis complete. Processed ${processedCount} bills.`);
}

/**
 * Main function to run the analysis
 */
async function main() {
  try {
    console.log("Fetching bills from the 89th Legislative Session...");
    
    // Get all bills from the 89th session that have full text
    const sessionBills = await db.query.bills.findMany({
      where: eq(bills.session, SESSION_ID),
    });
    
    console.log(`Found ${sessionBills.length} bills from the 89th session`);
    
    // Filter bills with full text content
    const billsWithFullText = sessionBills.filter(bill => bill.fullText);
    console.log(`${billsWithFullText.length} bills have full text content available for analysis`);
    
    if (billsWithFullText.length === 0) {
      console.log("No bills with full text content found. Analysis cannot proceed.");
      return;
    }
    
    // Get bill IDs for processing
    const billIdsToAnalyze = billsWithFullText.map(bill => bill.id);
    
    // Start processing bills in batches
    await processBillsInBatches(billIdsToAnalyze);
    
  } catch (error) {
    console.error("Error in bill analysis script:", error);
  }
}

// Run the main function
main()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch(err => {
    console.error("Script failed with error:", err);
    process.exit(1);
  });