import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Type definitions for notification system
export interface NotificationType {
  id: number;
  name: string;
  description: string;
  iconName: string;
  color: string;
  defaultPriority: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNotificationPreference {
  id: number;
  userId: number;
  notificationTypeId: number;
  enabled: boolean;
  priority: number;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmartNotification {
  id: number;
  userId: number;
  notificationTypeId: number;
  title: string;
  message: string;
  priority: number;
  read: boolean;
  dismissed: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  resourceId: string | null;
  resourceType: string | null;
  metadata: Record<string, any> | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  totalCount: number;
  unreadCount: number;
  highPriorityCount: number;
  recentNotificationsCount: number;
}

export interface NotificationContextValue {
  // Data
  notifications: SmartNotification[];
  notificationTypes: NotificationType[];
  notificationPreferences: UserNotificationPreference[];
  stats: NotificationStats | null;
  
  // Panel state
  isNotificationPanelOpen: boolean;
  openNotificationPanel: () => void;
  closeNotificationPanel: () => void;
  toggleNotificationPanel: () => void;
  
  // Actions
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: number) => void;
  handleNotificationAction: (id: number, action: string) => void;
  updatePreference: (id: number, data: Partial<UserNotificationPreference>) => void;
  
  // State
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

// Create notification context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Create provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  
  // Fetch notification types
  const { 
    data: notificationTypes = [],
    isLoading: isTypesLoading,
    error: typesError,
  } = useQuery<any>({
    queryKey: ['/api/notifications/types'],
    enabled: true,
  });
  
  // Fetch user notifications
  const { 
    data: notifications = [],
    isLoading: isNotificationsLoading,
    isError: isNotificationsError,
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery<any>({
    queryKey: ['/api/notifications'],
    enabled: true,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Fetch notification preferences
  const { 
    data: notificationPreferences = [],
    isLoading: isPreferencesLoading,
    error: preferencesError,
    refetch: refetchPreferences
  } = useQuery<any>({
    queryKey: ['/api/notifications/preferences'],
    enabled: true,
  });
  
  // Fetch notification stats
  const { 
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery<any>({
    queryKey: ['/api/notifications/stats'],
    enabled: true,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/notifications/${id}/actions`, {
        method: 'POST',
        data: { action: 'read' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
      console.error("Failed to mark notification as read:", error);
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/notifications/mark-read', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
      console.error("Failed to mark all notifications as read:", error);
    },
  });
  
  // Dismiss notification
  const dismissNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/notifications/${id}/actions`, {
        method: 'POST',
        data: { action: 'dismissed' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to dismiss notification",
        variant: "destructive",
      });
      console.error("Failed to dismiss notification:", error);
    },
  });
  
  // Handle notification action (clicked, etc.)
  const handleNotificationActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      return await apiRequest(`/api/notifications/${id}/actions`, {
        method: 'POST',
        data: { action },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      console.error("Failed to record notification action:", error);
    },
  });
  
  // Update notification preference
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserNotificationPreference> }) => {
      return await apiRequest(`/api/notifications/preferences/${id}`, {
        method: 'PATCH',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
      console.error("Failed to update notification preferences:", error);
    },
  });
  
  // Panel state functions
  const openNotificationPanel = () => setIsNotificationPanelOpen(true);
  const closeNotificationPanel = () => setIsNotificationPanelOpen(false);
  const toggleNotificationPanel = () => setIsNotificationPanelOpen(!isNotificationPanelOpen);
  
  // Action handlers
  const markAsRead = (id: number) => markAsReadMutation.mutate(id);
  const markAllAsRead = () => markAllAsReadMutation.mutate();
  const dismissNotification = (id: number) => dismissNotificationMutation.mutate(id);
  const handleNotificationAction = (id: number, action: string) => 
    handleNotificationActionMutation.mutate({ id, action });
  const updatePreference = (id: number, data: Partial<UserNotificationPreference>) => 
    updatePreferenceMutation.mutate({ id, data });
  
  // Loading and error states
  const isLoading = 
    isTypesLoading || 
    isNotificationsLoading || 
    isPreferencesLoading || 
    isStatsLoading;
    
  const isError = isNotificationsError;
  
  const error = notificationsError || 
    typesError || 
    preferencesError || 
    statsError || 
    null;
  
  // Context value
  const value: NotificationContextValue = {
    notifications: notifications as SmartNotification[],
    notificationTypes: notificationTypes as NotificationType[],
    notificationPreferences: notificationPreferences as UserNotificationPreference[],
    stats: stats as NotificationStats | null,
    isNotificationPanelOpen,
    openNotificationPanel,
    closeNotificationPanel,
    toggleNotificationPanel,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    handleNotificationAction,
    updatePreference,
    isLoading,
    isError,
    error,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Create custom hook
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}