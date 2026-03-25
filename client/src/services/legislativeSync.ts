/**
 * Legislative Sync Service
 * 
 * This service handles real-time synchronization with Texas legislative data.
 * It provides functions to fetch bill status updates and notifies
 * the application when tracked bills change status.
 */

import { UserData } from "@/context/UserContext";

// Define the bill status update interface
export interface BillStatusUpdate {
  billId: string;
  status: string;
  lastUpdated: string; // ISO date string
  chamber: "House" | "Senate";
  metadata?: Record<string, any>;
}

/**
 * Fetches the latest status for a bill from the Texas Legislature API
 * 
 * @param billId The ID of the bill (e.g., "TX-HB0123")
 * @returns Promise with bill status update
 */
export async function fetchBillStatus(billId: string): Promise<BillStatusUpdate | null> {
  try {
    // In a full implementation, this would make a request to the Texas Legislature API
    // or our own proxy API that provides legislative data
    const response = await fetch(`/api/bills/${billId}/status`);
    
    if (!response.ok) {
      console.error(`Failed to fetch bill status for ${billId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching bill status for ${billId}:`, error);
    return null;
  }
}

/**
 * Checks for updates on all tracked bills
 * 
 * @param trackedBills Array of bill IDs currently being tracked by the user
 * @returns Promise with array of bill status updates for bills that have changed status
 */
export async function checkTrackedBillsForUpdates(
  trackedBills: string[]
): Promise<BillStatusUpdate[]> {
  if (!trackedBills.length) return [];
  
  try {
    // In a full implementation, this could be a bulk request to the API
    // For now, we'll simulate it with individual requests to keep it simple
    const updatePromises = trackedBills.map(billId => fetchBillStatus(billId));
    const results = await Promise.all(updatePromises);
    
    // Filter out null results and return only the valid updates
    return results.filter(Boolean) as BillStatusUpdate[];
  } catch (error) {
    console.error("Error checking tracked bills for updates:", error);
    return [];
  }
}

/**
 * Sets up interval polling for tracked bill updates
 * 
 * @param userData The current user data
 * @param onStatusChange Callback to be called when a bill status changes
 * @param refreshInterval Time in ms between checks (default: 60000 = 1 minute)
 * @returns A function to cancel the interval
 */
export function setupBillStatusPolling(
  userData: UserData,
  onStatusChange: (updates: BillStatusUpdate[]) => void,
  refreshInterval: number = 60000
): () => void {
  const intervalId = setInterval(async () => {
    const trackedBills = userData.trackedBills || [];
    if (!trackedBills.length) return;
    
    const updates = await checkTrackedBillsForUpdates(trackedBills);
    
    // Filter to only include bills whose status has changed
    const changedBills = updates.filter(update => {
      const billStatus = userData.trackedBillStatuses.find(s => s.billId === update.billId);
      return billStatus && billStatus.currentStatus !== update.status;
    });
    
    if (changedBills.length > 0) {
      onStatusChange(changedBills);
    }
  }, refreshInterval);
  
  // Return function to cancel the interval
  return () => clearInterval(intervalId);
}

/**
 * Checks if a bill has a new status that should trigger a notification
 * 
 * @param currentStatus Current bill status from user context
 * @param newStatus New bill status from API
 * @returns True if status change should trigger a notification
 */
export function shouldNotifyStatusChange(
  currentStatus: string | undefined,
  newStatus: string
): boolean {
  if (!currentStatus) return false;
  if (currentStatus === newStatus) return false;
  
  // List of status changes that are significant enough to notify the user
  const significantChanges = [
    { from: "Filed", to: "In Committee" },
    { from: "In Committee", to: "Hearing Scheduled" },
    { from: "Hearing Scheduled", to: "Floor Vote" },
    { from: "Floor Vote", to: "Passed Chamber" },
    { from: "In Other Chamber", to: "Passed Both Chambers" },
    { from: "Passed Both Chambers", to: "Signed Into Law" },
  ];
  
  return significantChanges.some(
    change => change.from === currentStatus && change.to === newStatus
  );
}

/**
 * Creates a WebSocket connection for real-time legislative updates
 * 
 * @param onBillStatusChange Callback when a bill status changes
 * @returns A function to close the WebSocket connection
 */
export function createWebSocketConnection(
  onBillStatusChange: (update: BillStatusUpdate) => void
): () => void {
  // Determine the appropriate WebSocket URL based on the current environment
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/legislative-updates`;
  
  // Create WebSocket connection for legislative updates
  const socket = new WebSocket(wsUrl);
  
  // Set up event handlers
  socket.addEventListener("open", () => {
    console.log("WebSocket connection established for legislative updates");
  });
  
  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      if (data.type === "bill_status_update") {
        onBillStatusChange(data.payload);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });
  
  socket.addEventListener("close", () => {
    console.log("WebSocket connection closed");
  });
  
  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });
  
  // Return function to close the connection
  return () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  };
}