// @ts-nocheck
import { 
  generateStructuredBillSummary, 
  generateStructuredBillComparison,
  generateStructuredLegislativeImpact 
} from './enhanced-ai-service';
import { addDocumentsToVectorStore } from './vector-database-service';
import os from 'os';

// Calculate optimal batch size based on available CPU cores
const MAX_CONCURRENT_OPERATIONS = Math.max(1, os.cpus().length - 1);

// Track active batch operations
const activeBatchOperations: Record<string, {
  status: 'in_progress' | 'completed' | 'failed';
  progress: number;
  total: number;
  results: any[];
  errors: any[];
  startTime: Date;
  endTime?: Date;
}> = {};

/**
 * Process batch bill summaries in parallel
 * @param bills Array of bill data with text and id
 * @param batchId Optional batch identifier
 * @returns Batch operation ID to track progress
 */
export async function batchProcessBillSummaries(
  bills: Array<{ billText: string; billId: string }>,
  batchId: string = `summary-${Date.now()}`
): Promise<string> {
  const total = bills.length;
  
  // Initialize batch tracking
  activeBatchOperations[batchId] = {
    status: 'in_progress',
    progress: 0,
    total,
    results: [],
    errors: [],
    startTime: new Date()
  };
  
  // Process in parallel with controlled concurrency
  processBatchWithConcurrencyLimit(
    bills,
    async (bill) => {
      try {
        const summary = await generateStructuredBillSummary(bill.billText, bill.billId);
        return { success: true, billId: bill.billId, data: summary };
      } catch (error: any) {
        console.error(`Error processing bill ${bill.billId}:`, error);
        return { 
          success: false, 
          billId: bill.billId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    (results) => {
      // Update batch operation status
      const operation = activeBatchOperations[batchId];
      if (operation) {
        operation.progress = results.length;
        
        // Separate successful results and errors
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        operation.results = successful.map(r => r.data);
        operation.errors = failed.map(r => ({ billId: r.billId, error: r.error }));
        
        // Check if batch is complete
        if (operation.progress >= operation.total) {
          operation.status = 'completed';
          operation.endTime = new Date();
        }
      }
    },
    batchId
  );
  
  return batchId;
}

/**
 * Process batch bill comparisons in parallel
 * @param comparisons Array of bill comparison data
 * @param batchId Optional batch identifier
 * @returns Batch operation ID to track progress
 */
export async function batchProcessBillComparisons(
  comparisons: Array<{ 
    bill1Text: string; 
    bill1Id: string;
    bill2Text: string;
    bill2Id: string;
  }>,
  batchId: string = `comparison-${Date.now()}`
): Promise<string> {
  const total = comparisons.length;
  
  // Initialize batch tracking
  activeBatchOperations[batchId] = {
    status: 'in_progress',
    progress: 0,
    total,
    results: [],
    errors: [],
    startTime: new Date()
  };
  
  // Process in parallel with controlled concurrency
  processBatchWithConcurrencyLimit(
    comparisons,
    async (comparison) => {
      try {
        const result = await generateStructuredBillComparison(
          comparison.bill1Text, 
          comparison.bill2Text, 
          comparison.bill1Id, 
          comparison.bill2Id
        );
        return { 
          success: true, 
          bill1Id: comparison.bill1Id, 
          bill2Id: comparison.bill2Id,
          data: result 
        };
      } catch (error: any) {
        console.error(`Error comparing bills ${comparison.bill1Id} and ${comparison.bill2Id}:`, error);
        return { 
          success: false, 
          bill1Id: comparison.bill1Id, 
          bill2Id: comparison.bill2Id,
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    (results) => {
      // Update batch operation status
      const operation = activeBatchOperations[batchId];
      if (operation) {
        operation.progress = results.length;
        
        // Separate successful results and errors
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        operation.results = successful.map(r => r.data);
        operation.errors = failed.map(r => ({ 
          bill1Id: r.bill1Id, 
          bill2Id: r.bill2Id, 
          error: r.error 
        }));
        
        // Check if batch is complete
        if (operation.progress >= operation.total) {
          operation.status = 'completed';
          operation.endTime = new Date();
        }
      }
    },
    batchId
  );
  
  return batchId;
}

/**
 * Process batch legislative impact analyses in parallel
 * @param bills Array of bill data with text and id
 * @param batchId Optional batch identifier
 * @returns Batch operation ID to track progress
 */
export async function batchProcessLegislativeImpacts(
  bills: Array<{ billText: string; billId: string }>,
  batchId: string = `impact-${Date.now()}`
): Promise<string> {
  const total = bills.length;
  
  // Initialize batch tracking
  activeBatchOperations[batchId] = {
    status: 'in_progress',
    progress: 0,
    total,
    results: [],
    errors: [],
    startTime: new Date()
  };
  
  // Process in parallel with controlled concurrency
  processBatchWithConcurrencyLimit(
    bills,
    async (bill) => {
      try {
        const impact = await generateStructuredLegislativeImpact(bill.billText, bill.billId);
        return { success: true, billId: bill.billId, data: impact };
      } catch (error: any) {
        console.error(`Error analyzing impact for bill ${bill.billId}:`, error);
        return { 
          success: false, 
          billId: bill.billId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    (results) => {
      // Update batch operation status
      const operation = activeBatchOperations[batchId];
      if (operation) {
        operation.progress = results.length;
        
        // Separate successful results and errors
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        operation.results = successful.map(r => r.data);
        operation.errors = failed.map(r => ({ billId: r.billId, error: r.error }));
        
        // Check if batch is complete
        if (operation.progress >= operation.total) {
          operation.status = 'completed';
          operation.endTime = new Date();
        }
      }
    },
    batchId
  );
  
  return batchId;
}

/**
 * Process batch document ingestion to vector store in parallel
 * @param documents Array of documents to add to vector store
 * @param batchId Optional batch identifier
 * @returns Batch operation ID to track progress
 */
export async function batchProcessDocumentIngestion(
  documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>,
  batchId: string = `ingestion-${Date.now()}`
): Promise<string> {
  const total = documents.length;
  
  // Initialize batch tracking
  activeBatchOperations[batchId] = {
    status: 'in_progress',
    progress: 0,
    total,
    results: [],
    errors: [],
    startTime: new Date()
  };
  
  // Split documents into chunks for batch processing
  const chunkSize = 10; // Process 10 documents at a time
  const documentChunks = [];
  
  for (let i = 0; i < documents.length; i += chunkSize) {
    documentChunks.push(documents.slice(i, i + chunkSize));
  }
  
  // Process document chunks in parallel with controlled concurrency
  processBatchWithConcurrencyLimit(
    documentChunks,
    async (chunk) => {
      try {
        const result = await addDocumentsToVectorStore(chunk);
        return { 
          success: result, 
          documentIds: chunk.map(doc => doc.id),
          count: chunk.length
        };
      } catch (error: any) {
        console.error(`Error ingesting document chunk:`, error);
        return { 
          success: false, 
          documentIds: chunk.map(doc => doc.id),
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    (results) => {
      // Update batch operation status
      const operation = activeBatchOperations[batchId];
      if (operation) {
        // Calculate total documents processed
        const processedCount = results.reduce((acc, r) => acc + (r.count || 0), 0);
        operation.progress = Math.min(processedCount, total);
        
        // Separate successful results and errors
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        operation.results = successful.map(r => ({ 
          documentIds: r.documentIds,
          count: r.count
        }));
        
        operation.errors = failed.map(r => ({ 
          documentIds: r.documentIds, 
          error: r.error 
        }));
        
        // Check if batch is complete
        if (operation.progress >= operation.total) {
          operation.status = 'completed';
          operation.endTime = new Date();
        }
      }
    },
    batchId
  );
  
  return batchId;
}

/**
 * Get the status of a batch operation
 * @param batchId Batch operation ID
 * @returns Batch operation status or null if not found
 */
export function getBatchOperationStatus(batchId: string) {
  if (!activeBatchOperations[batchId]) {
    return null;
  }
  
  const operation = activeBatchOperations[batchId];
  return {
    status: operation.status,
    progress: operation.progress,
    total: operation.total,
    progressPercentage: Math.round((operation.progress / operation.total) * 100),
    resultCount: operation.results.length,
    errorCount: operation.errors.length,
    startTime: operation.startTime,
    endTime: operation.endTime,
    elapsedSeconds: operation.endTime 
      ? Math.round((operation.endTime.getTime() - operation.startTime.getTime()) / 1000) 
      : Math.round((new Date().getTime() - operation.startTime.getTime()) / 1000)
  };
}

/**
 * Get the results of a completed batch operation
 * @param batchId Batch operation ID
 * @returns Operation results or null if not found or not completed
 */
export function getBatchOperationResults(batchId: string) {
  if (!activeBatchOperations[batchId] || activeBatchOperations[batchId].status !== 'completed') {
    return null;
  }
  
  const operation = activeBatchOperations[batchId];
  return {
    status: operation.status,
    progress: operation.progress,
    total: operation.total,
    results: operation.results,
    errors: operation.errors,
    startTime: operation.startTime,
    endTime: operation.endTime,
    elapsedSeconds: operation.endTime 
      ? Math.round((operation.endTime.getTime() - operation.startTime.getTime()) / 1000) 
      : 0
  };
}

/**
 * Process array items in parallel with limited concurrency
 * @param items Array of items to process
 * @param processor Async function to process each item
 * @param progressCallback Callback function to report progress
 * @param operationId Identifier for this batch operation
 */
async function processBatchWithConcurrencyLimit<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  progressCallback: (results: R[]) => void,
  operationId: string
): Promise<void> {
  const allResults: R[] = [];
  const queue = [...items];
  const activePromises = new Set<Promise<void>>();
  
  // Function to process the next item in the queue
  const processNext = async (): Promise<void> => {
    if (queue.length === 0) return;
    
    // Get next item from queue
    const item = queue.shift()!;
    
    try {
      // Process the item
      const result = await processor(item);
      allResults.push(result);
      
      // Report progress after each item
      progressCallback(allResults);
    } catch (error: any) {
      console.error(`Error in batch operation ${operationId}:`, error);
      
      // Update batch operation with error
      const operation = activeBatchOperations[operationId];
      if (operation) {
        operation.errors.push({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Clean up this promise from the active set
    activePromises.delete(processNext());
    
    // If more items in queue, process the next one
    if (queue.length > 0) {
      const nextPromise = processNext();
      activePromises.add(nextPromise);
    }
  };
  
  // Start initial batch of promises up to concurrency limit
  const initialBatchSize = Math.min(MAX_CONCURRENT_OPERATIONS, items.length);
  for (let i = 0; i < initialBatchSize; i++) {
    const promise = processNext();
    activePromises.add(promise);
  }
  
  // Wait for all promises to complete
  await Promise.all(activePromises);
  
  return;
}