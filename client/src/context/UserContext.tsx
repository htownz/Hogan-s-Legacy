// @ts-nocheck
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define reminder interface
export interface BillReminder {
  billId: string;
  billTitle: string;
  action: string;
  date: string; // ISO date string
  completed: boolean;
  priority: "low" | "medium" | "high";
}

// Define bill status tracking interface
export interface TrackedBillStatus {
  billId: string;
  billTitle: string;
  currentStatus: string;
  lastUpdated: string; // ISO date string
  hasNotified: boolean; // Whether the user has been notified of this status change
}

// Define notification interface
export interface Notification {
  id: string;
  billId: string;
  billTitle: string;
  message: string;
  type: "status_change" | "action_required" | "deadline" | "info";
  timestamp: string; // ISO date string
  read: boolean;
  actionUrl?: string;
}

// Define user action interface for behavior tracking
export interface UserAction {
  type: "view" | "track" | "share" | "complete";
  billId?: string;
  actionId?: string;
  timestamp: string; // ISO date string
  metadata?: Record<string, any>;
}

// Define the user data interface
export interface UserData {
  zipCode: string;
  interests: string[];
  trackedBills: string[];
  trackedBillStatuses: TrackedBillStatus[];
  notifications: Notification[];
  alerts: any[]; // Optional cache, can be typed more specifically later
  reminders: BillReminder[];
  onboardingComplete: boolean;
  actions: UserAction[]; // Tracking user interactions with bills and actions
}

// Define the context type with userData and setUserData function
interface UserContextType {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
}

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom hook to use the user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Create the provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData>({
    zipCode: "",
    interests: [],
    trackedBills: [],
    trackedBillStatuses: [],
    notifications: [],
    alerts: [],
    reminders: [],
    onboardingComplete: false,
    actions: []
  });

  // Load user data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("actupUser");
    if (stored) {
      try {
        setUserData(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing stored user data:", error);
      }
    }
  }, []);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("actupUser", JSON.stringify(userData));
  }, [userData]);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

// Helper functions for common user data operations
export const setZipCode = (setUserData: React.Dispatch<React.SetStateAction<UserData>>, zipCode: string) => {
  setUserData(prev => ({ ...prev, zipCode }));
};

export const addInterest = (setUserData: React.Dispatch<React.SetStateAction<UserData>>, interest: string) => {
  setUserData(prev => ({
    ...prev,
    interests: [...new Set([...(prev.interests || []), interest])]
  }));
};

export const removeInterest = (setUserData: React.Dispatch<React.SetStateAction<UserData>>, interest: string) => {
  setUserData(prev => ({
    ...prev,
    interests: prev.interests.filter(i => i !== interest)
  }));
};

export const trackBill = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>, 
  billId: string, 
  billTitle: string, 
  currentStatus: string = "Filed"
) => {
  setUserData(prev => {
    // Check if bill is already tracked
    const wasAlreadyTracked = prev.trackedBills.includes(billId);
    
    if (!wasAlreadyTracked) {
      // Check if we already have a status for this bill
      const hasStatus = prev.trackedBillStatuses.some(s => s.billId === billId);
      
      if (!hasStatus) {
        // Add a new status entry
        const newStatusEntry: TrackedBillStatus = {
          billId,
          billTitle,
          currentStatus,
          lastUpdated: new Date().toISOString(),
          hasNotified: true // Set to true so we don't immediately notify for the initial status
        };
        
        // Add a track action
        const trackAction: UserAction = {
          type: "track",
          billId,
          timestamp: new Date().toISOString(),
          metadata: { billTitle, initialStatus: currentStatus }
        };
        
        return {
          ...prev,
          trackedBills: [...prev.trackedBills, billId],
          trackedBillStatuses: [...prev.trackedBillStatuses, newStatusEntry],
          actions: [trackAction, ...prev.actions]
        };
      }
    }
    
    // Even if the bill was already in the trackedBills array,
    // make sure it's added in case of missing data
    return {
      ...prev,
      trackedBills: [...new Set([...prev.trackedBills, billId])]
    };
  });
};

export const untrackBill = (setUserData: React.Dispatch<React.SetStateAction<UserData>>, billId: string) => {
  setUserData(prev => ({
    ...prev,
    trackedBills: prev.trackedBills.filter(id => id !== billId),
    trackedBillStatuses: prev.trackedBillStatuses.filter(s => s.billId !== billId)
  }));
};

export const completeOnboarding = (setUserData: React.Dispatch<React.SetStateAction<UserData>>) => {
  setUserData(prev => ({
    ...prev,
    onboardingComplete: true
  }));
};

export const hasCompletedOnboarding = (): boolean => {
  const stored = localStorage.getItem("actupUser");
  if (stored) {
    try {
      const userData = JSON.parse(stored);
      return !!userData.onboardingComplete;
    } catch (error) {
      return false;
    }
  }
  return false;
};

// Reminder management functions
export const addReminder = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>, 
  reminder: BillReminder
) => {
  setUserData(prev => {
    // Check if we already have a reminder for this bill and action
    const existingIndex = prev.reminders.findIndex(
      r => r.billId === reminder.billId && r.action === reminder.action
    );
    
    if (existingIndex >= 0) {
      // Update the existing reminder
      const updatedReminders = [...prev.reminders];
      updatedReminders[existingIndex] = reminder;
      return {
        ...prev,
        reminders: updatedReminders
      };
    } else {
      // Add a new reminder
      return {
        ...prev,
        reminders: [...prev.reminders, reminder]
      };
    }
  });
};

export const removeReminder = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>, 
  billId: string,
  action?: string
) => {
  setUserData(prev => ({
    ...prev,
    reminders: prev.reminders.filter(r => 
      // If action is specified, remove only that specific reminder
      // Otherwise remove all reminders for the bill
      action ? !(r.billId === billId && r.action === action) : r.billId !== billId
    )
  }));
};

export const markReminderComplete = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>, 
  billId: string,
  action: string
) => {
  setUserData(prev => {
    // Find the reminder
    const reminderIndex = prev.reminders.findIndex(
      r => r.billId === billId && r.action === action
    );
    
    if (reminderIndex >= 0) {
      // Create a copy and update the completed status
      const updatedReminders = [...prev.reminders];
      updatedReminders[reminderIndex] = {
        ...updatedReminders[reminderIndex],
        completed: true
      };
      
      // Add a completion action
      const completeAction: UserAction = {
        type: "complete",
        actionId: action,
        billId,
        timestamp: new Date().toISOString(),
        metadata: { 
          actionName: action,
          billTitle: updatedReminders[reminderIndex].billTitle,
          priority: updatedReminders[reminderIndex].priority
        }
      };
      
      return {
        ...prev,
        reminders: updatedReminders,
        actions: [completeAction, ...prev.actions]
      };
    }
    
    return prev;
  });
};

// Bill status tracking functions
export const updateBillStatus = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  billId: string,
  billTitle: string,
  newStatus: string
) => {
  setUserData(prev => {
    // Check if we already have a status for this bill
    const existingIndex = prev.trackedBillStatuses.findIndex(s => s.billId === billId);
    
    if (existingIndex >= 0) {
      const existingStatus = prev.trackedBillStatuses[existingIndex];
      
      // Only update if status has changed
      if (existingStatus.currentStatus !== newStatus) {
        const updatedStatuses = [...prev.trackedBillStatuses];
        updatedStatuses[existingIndex] = {
          ...existingStatus,
          currentStatus: newStatus,
          lastUpdated: new Date().toISOString(),
          hasNotified: false // Reset notification flag when status changes
        };
        
        // Create a notification for the status change
        const notification: Notification = {
          id: `status-${billId}-${Date.now()}`,
          billId,
          billTitle,
          message: `${billTitle} has moved to "${newStatus}"`,
          type: "status_change",
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: `/bills/${billId}`
        };
        
        return {
          ...prev,
          trackedBillStatuses: updatedStatuses,
          notifications: [notification, ...prev.notifications]
        };
      }
      
      return prev; // No status change
    } else {
      // Add a new status entry
      const newStatusEntry: TrackedBillStatus = {
        billId,
        billTitle,
        currentStatus: newStatus,
        lastUpdated: new Date().toISOString(),
        hasNotified: false
      };
      
      return {
        ...prev,
        trackedBillStatuses: [...prev.trackedBillStatuses, newStatusEntry]
      };
    }
  });
};

// Mark a notification as read
export const markNotificationRead = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  notificationId: string
) => {
  setUserData(prev => {
    const notificationIndex = prev.notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex >= 0) {
      const updatedNotifications = [...prev.notifications];
      updatedNotifications[notificationIndex] = {
        ...updatedNotifications[notificationIndex],
        read: true
      };
      
      return {
        ...prev,
        notifications: updatedNotifications
      };
    }
    
    return prev;
  });
};

// Mark all notifications as read
export const markAllNotificationsRead = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>
) => {
  setUserData(prev => {
    const updatedNotifications = prev.notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    return {
      ...prev,
      notifications: updatedNotifications
    };
  });
};

// Add a notification
export const addNotification = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  notification: Omit<Notification, "id" | "timestamp" | "read">
) => {
  setUserData(prev => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    return {
      ...prev,
      notifications: [newNotification, ...prev.notifications]
    };
  });
};

// Remove a notification
export const removeNotification = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  notificationId: string
) => {
  setUserData(prev => ({
    ...prev,
    notifications: prev.notifications.filter(n => n.id !== notificationId)
  }));
};

// Action History tracking functions
export const trackUserAction = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  action: Omit<UserAction, "timestamp">
) => {
  setUserData(prev => {
    const newAction: UserAction = {
      ...action,
      timestamp: new Date().toISOString()
    };
    
    return {
      ...prev,
      actions: [newAction, ...prev.actions]
    };
  });
};

// Track a bill view action
export const trackBillView = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  billId: string
) => {
  trackUserAction(setUserData, {
    type: "view",
    billId
  });
};

// Track a bill share action
export const trackBillShare = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  billId: string,
  metadata?: Record<string, any>
) => {
  trackUserAction(setUserData, {
    type: "share",
    billId,
    metadata
  });
};

// Track an action completion
export const trackActionCompletion = (
  setUserData: React.Dispatch<React.SetStateAction<UserData>>,
  actionId: string,
  billId?: string,
  metadata?: Record<string, any>
) => {
  trackUserAction(setUserData, {
    type: "complete",
    actionId,
    billId,
    metadata
  });
};