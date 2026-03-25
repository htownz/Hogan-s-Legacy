import { useState, useMemo } from 'react';
import { useNotifications, SmartNotification, NotificationType } from '@/contexts/notification-context';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckIcon, X, Settings, Calendar, ClipboardList, Users, AlertTriangle, Award, Zap, Info, MessageCircle, TrendingUp, CheckCircle, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationTab } from './NotificationTab';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  className?: string;
}

export default function NotificationPanel({ className }: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const {
    notifications,
    notificationTypes,
    stats,
    markAllAsRead,
    isNotificationPanelOpen,
    closeNotificationPanel,
    isLoading
  } = useNotifications();

  // Get the icon component for a notification type
  const getNotificationIcon = (typeName: string, color: string) => {
    const size = 16;
    
    const iconProps = {
      size,
      className: "shrink-0",
      style: { color }
    };
    
    switch (typeName) {
      case 'bill_movement':
        return <ClipboardList {...iconProps} />;
      case 'action_circle_invite':
        return <Users {...iconProps} />;
      case 'action_required':
        return <AlertTriangle {...iconProps} />;
      case 'committee_meeting':
        return <Calendar {...iconProps} />;
      case 'vote_alert':
        return <ClipboardList {...iconProps} />;
      case 'milestone_achieved':
        return <Award {...iconProps} />;
      case 'new_challenge':
        return <Zap {...iconProps} />;
      case 'system_announcement':
        return <Megaphone {...iconProps} />;
      case 'comment_reply':
        return <MessageCircle {...iconProps} />;
      case 'impact_update':
        return <TrendingUp {...iconProps} />;
      case 'action_completed':
        return <CheckCircle {...iconProps} />;
      case 'app_update':
        return <Info {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  // Group notifications by priority for better organization
  const groupedNotifications = useMemo(() => {
    if (!notifications) return { high: [], medium: [], low: [] };
    
    return {
      high: notifications.filter(n => n.priority <= 2),
      medium: notifications.filter(n => n.priority === 3),
      low: notifications.filter(n => n.priority >= 4)
    };
  }, [notifications]);
  
  // Get notification details including the type info
  const getNotificationDetails = (notification: SmartNotification) => {
    const notificationType = notificationTypes.find(nt => nt.id === notification.notificationTypeId);
    return {
      ...notification,
      typeName: notificationType?.name || 'unknown',
      typeColor: notificationType?.color || '#6B7280',
      typeIcon: notificationType ? 
        getNotificationIcon(notificationType.name, notificationType.color) : 
        <Bell size={16} className="shrink-0" style={{ color: '#6B7280' }} />
    };
  };

  // Process all notifications to include type info
  const processedNotifications = useMemo(() => {
    return notifications.map(notification => getNotificationDetails(notification));
  }, [notifications, notificationTypes]);

  // Loading state for the notification panel
  const renderLoadingState = () => (
    <div className="space-y-4 mt-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-start space-x-4 p-3 border rounded-md">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={isNotificationPanelOpen} onOpenChange={closeNotificationPanel}>
      <SheetContent className={cn("w-full sm:max-w-md pt-10", className)}>
        <SheetHeader className="mb-5 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <SheetTitle>Notifications</SheetTitle>
            {stats && stats.unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              disabled={isLoading || !stats || stats.unreadCount === 0}
              className="text-xs h-8 px-2"
            >
              <CheckIcon className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              asChild
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={closeNotificationPanel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all" className="text-xs">
              All
              {stats && (
                <Badge variant="outline" className="ml-1.5 px-1.5 py-0">
                  {stats.unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="priority" className="text-xs">
              Priority
              {stats && (
                <Badge variant="outline" className="ml-1.5 px-1.5 py-0">
                  {stats.highPriorityCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">
              Recent
              {stats && (
                <Badge variant="outline" className="ml-1.5 px-1.5 py-0">
                  {stats.recentNotificationsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            renderLoadingState()
          ) : (
            <>
              <TabsContent value="all" className="mt-0">
                <NotificationTab 
                  key="all-tab"
                  notifications={processedNotifications}
                  emptyMessage="No notifications to display"
                />
              </TabsContent>
              
              <TabsContent value="priority" className="mt-0">
                <div className="space-y-6">
                  {groupedNotifications.high.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">High Priority</h3>
                      <NotificationTab 
                        key="high-priority-tab"
                        notifications={groupedNotifications.high.map(getNotificationDetails)}
                        compact
                      />
                    </div>
                  )}
                  
                  {groupedNotifications.medium.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Medium Priority</h3>
                      <NotificationTab 
                        key="medium-priority-tab"
                        notifications={groupedNotifications.medium.map(getNotificationDetails)}
                        compact
                      />
                    </div>
                  )}
                  
                  {groupedNotifications.high.length === 0 && 
                   groupedNotifications.medium.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No priority notifications at this time
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-0">
                <NotificationTab 
                  key="recent-tab"
                  notifications={processedNotifications
                    .filter(n => {
                      const createdAt = new Date(n.createdAt);
                      const oneDayAgo = new Date();
                      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
                      return createdAt >= oneDayAgo;
                    })
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  }
                  emptyMessage="No recent notifications in the last 24 hours"
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}