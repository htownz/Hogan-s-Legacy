/**
 * Script to test point of order detection on a sample bill
 * 
 * This script:
 * 1. Takes a specific bill ID as input
 * 2. Runs the bill analyzer to detect potential points of order
 * 3. Prints the analysis results
 */

import { db } from "../server/db";
import { bills } from "../shared/schema";
import { eq } from "drizzle-orm";
import { billPOOAnalyzer } from "../server/services/bill-point-of-order-analyzer";

// The bill to analyze (you can change this to any bill ID)
const BILL_ID = "TX-HB1234"; // One of our bills with full text content

async function main() {
  try {
    console.log(`Fetching bill ${BILL_ID}...`);
    
    // Get the bill
    const bill = await db.query.bills.findFirst({
      where: eq(bills.id, BILL_ID),
    });
    
    if (!bill) {
      console.error(`Bill ${BILL_ID} not found.`);
      return;
    }
    
    console.log(`Found bill: ${bill.title}`);
    
    if (!bill.fullText) {
      console.error(`Bill ${BILL_ID} doesn't have full text available for analysis.`);
      return;
    }
    
    console.log(`Full text is available (${bill.fullText.length} characters). Running analysis...`);
    
    // Run the analyzer
    const analysisResults = await billPOOAnalyzer.analyzeBill(BILL_ID);
    
    // Display the results
    if (analysisResults.analysis && Array.isArray(analysisResults.analysis)) {
      console.log(`\nAnalysis Results (${analysisResults.analysis.length} issues found):`);
      
      if (analysisResults.analysis.length === 0) {
        console.log("No potential points of order detected.");
      } else if (analysisResults.analysis[0].error) {
        console.log(`Error: ${analysisResults.analysis[0].error}`);
      } else {
        // Format and print each detected issue
        analysisResults.analysis.forEach((issue, index) => {
          console.log(`\nIssue #${index + 1}:`);
          console.log(`Type: ${issue.type}`);
          console.log(`Severity: ${issue.severity}`);
          console.log(`Rule Reference: ${issue.ruleReference}`);
          console.log(`Description: ${issue.description}`);
          console.log(`Location: ${issue.textLocation}`);
          if (issue.suggestedFix) {
            console.log(`Suggested Fix: ${issue.suggestedFix}`);
          }
        });
        
        // Ask if we should store the results
        const storeResults = process.argv.includes("--store");
        if (storeResults) {
          console.log("\nStoring results in the database...");
          const stored = await billPOOAnalyzer.storePointsOfOrderResults(analysisResults);
          console.log(`Storage result: ${stored.success ? "Success" : "Failed"} - ${stored.message}`);
        } else {
          console.log("\nResults were not stored. Run with --store to save to database.");
        }
      }
    } else {
      console.log("No analysis results received.");
    }
    
  } catch (error) {
    console.error("Error in test script:", error);
  }
}

// Run the main function
main()
  .then(() => {
    console.log("\nScript completed.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Script failed with error:", err);
    process.exit(1);
  });