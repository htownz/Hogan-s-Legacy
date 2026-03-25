/**
 * Script to analyze bills for potential points of order using historical context
 * 
 * This script:
 * 1. Fetches bills from the current session
 * 2. Analyzes them using the billPOOAnalyzer service
 * 3. Stores potential points of order in the database
 */

import { db } from "../server/db";
import { bills } from "../shared/schema";
import { eq, and, isNull, not } from "drizzle-orm";
import { billPOOAnalyzer } from "../server/services/bill-point-of-order-analyzer";

async function main() {
  console.log("Starting bill point of order analysis...");

  // Determine which bills to analyze - prioritize bills with content but no existing analysis
  const billsToAnalyze = await db.query.bills.findMany({
    where: and(
      not(isNull(bills.fullText)),
      eq(bills.session, "89R")
    ),
    limit: 5, // Start with a small batch to test
  });

  console.log(`Found ${billsToAnalyze.length} bills to analyze`);

  if (billsToAnalyze.length === 0) {
    console.log("No bills to analyze. Exiting.");
    process.exit(0);
  }

  // Extract bill IDs
  const billIds = billsToAnalyze.map(bill => bill.id);
  
  // Run the analysis
  console.log(`Analyzing bills: ${billIds.join(", ")}`);
  const results = await billPOOAnalyzer.analyzeBillBatch(billIds, true);

  // Print results summary
  for (const result of results) {
    const issues = Array.isArray(result.analysis) ? result.analysis.length : 0;
    console.log(`Bill ${result.billId}: ${issues} potential points of order identified`);
  }

  console.log("Analysis complete!");
}

// Run the script
main()
  .catch(e => {
    console.error("Error running bill analysis:", e);
    process.exit(1);
  })
  .finally(() => {
    // Close DB connection when done
    setTimeout(() => process.exit(0), 1000);
  });