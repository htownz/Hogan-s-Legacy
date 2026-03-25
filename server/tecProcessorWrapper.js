
/**
 * ES Module wrapper for tecProcessor.js
 * 
 * This wrapper file allows the ES Module tecProcessor to be imported
 * from other ES Module files in the codebase.
 */

// Import and re-export from the ES Module
import { processTECReports } from './tecProcessor.js';

// Re-export the function
export { processTECReports };
