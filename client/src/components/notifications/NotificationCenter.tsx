import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: number;
  billId: string;
  billTitle: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, isError } = useQuery<any>({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
    staleTime: 1000 * 60, // 1 minute
  });

  // Get unread notification count
  const { data: unreadCountData } = useQuery<any>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
  
  const unreadCount = unreadCountData?.unreadCount || 0;

  // Mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notification as read.',
      });
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/notifications/read-all', {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
      });
    },
  });
  
  // Mark notification as read when clicked
  const handleNotificationClick = (notificationId: number) => {
    if (!notifications.find((n: Notification) => n.id === notificationId)?.read) {
      markAsReadMutation.mutate(notificationId);
    }
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  // When opening the popover, mark notifications as read if they're visible
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      // Auto-mark as read after 3 seconds of being open
      const timer = setTimeout(() => {
        const unreadNotifications = notifications.filter((n: Notification) => !n.read);
        if (unreadNotifications.length > 0) {
          unreadNotifications.forEach((notification: Notification) => {
            markAsReadMutation.mutate(notification.id);
          });
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, notifications]);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
          aria-label="Open notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center" 
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-medium">Notifications</h3>
          {notifications.some((n: Notification) => !n.read) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-sm text-muted-foreground">Failed to load notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 px-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground text-center">
                You don't have any notifications yet.
                <br />
                Start tracking bills to receive updates.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification: Notification) => (
                <div key={notification.id}>
                  <div
                    className={`
                      p-4 cursor-pointer
                      ${notification.read ? 'bg-background' : 'bg-secondary/20'}
                      hover:bg-secondary/30
                    `}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <Link 
                        to={`/legislation?bill=${notification.billId}`} 
                        onClick={() => setIsOpen(false)}
                        className="font-medium hover:underline text-primary"
                      >
                        {notification.billTitle ? notification.billTitle : notification.billId}
                      </Link>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {!notification.read && (
                          <div className="ml-2 h-2 w-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm">{notification.message}</p>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}