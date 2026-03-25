import { forwardRef, ReactNode } from 'react';
import { SmartNotification } from '@/contexts/notification-context';
import { useNotifications } from '@/contexts/notification-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { X, ArrowRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface NotificationItemProps {
  notification: SmartNotification & {
    typeName: string;
    typeColor: string;
    typeIcon: ReactNode;
  };
  compact?: boolean;
}

const NotificationItem = forwardRef<HTMLDivElement, NotificationItemProps>(
  ({ notification, compact = false }, ref) => {
    const [_, setLocation] = useLocation();
    const {
      markAsRead,
      dismissNotification,
      handleNotificationAction
    } = useNotifications();
    
    const formattedTime = formatDistanceToNow(new Date(notification.createdAt), { 
      addSuffix: true 
    });

    const handleActionClick = () => {
      if (notification.actionUrl) {
        handleNotificationAction(notification.id, 'clicked');
        setLocation(notification.actionUrl);
      }
    };

    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      dismissNotification(notification.id);
    };

    const handleMarkAsRead = (e: React.MouseEvent) => {
      e.stopPropagation();
      markAsRead(notification.id);
    };
    
    const priorityNames = {
      1: 'Urgent',
      2: 'High',
      3: 'Medium',
      4: 'Low',
      5: 'Info'
    };
    
    return (
      <Card
        ref={ref}
        className={cn(
          "p-3 w-full cursor-pointer transition-all transform hover:bg-muted/30",
          notification.read ? "opacity-70" : "border-l-4",
          notification.read ? "" : `border-l-[${notification.typeColor}]`,
          compact ? "p-2" : "p-3"
        )}
        style={{
          borderLeftColor: notification.read ? undefined : notification.typeColor
        }}
        onClick={() => {
          if (!notification.read) {
            markAsRead(notification.id);
          }
          
          if (notification.actionUrl) {
            handleActionClick();
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {notification.typeIcon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-1.5 py-0 text-xs rounded",
                      notification.priority <= 2 && "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                      notification.priority === 3 && "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
                      notification.priority >= 4 && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    )}
                  >
                    {priorityNames[notification.priority as keyof typeof priorityNames] || 'Medium'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-normal">
                    {formattedTime}
                  </span>
                </div>
                
                <h4 className={cn(
                  "font-medium",
                  compact ? "text-sm" : "text-base mt-1"
                )}>
                  {notification.title}
                </h4>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.read && (
                    <DropdownMenuItem onClick={handleMarkAsRead}>
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDismiss}>
                    Dismiss
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className={cn(
              "text-muted-foreground",
              compact ? "text-xs mt-1" : "text-sm mt-2"
            )}>
              {notification.message}
            </p>
            
            {notification.actionLabel && notification.actionUrl && (
              <Button
                variant="link"
                className={cn(
                  "px-0 h-auto font-medium",
                  compact ? "text-xs mt-1.5" : "text-sm mt-3"
                )}
                onClick={handleActionClick}
              >
                {notification.actionLabel}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }
);

NotificationItem.displayName = 'NotificationItem';

interface NotificationTabProps {
  notifications: (SmartNotification & {
    typeName: string;
    typeColor: string;
    typeIcon: ReactNode;
  })[];
  emptyMessage?: string;
  compact?: boolean;
}

export function NotificationTab({ 
  notifications, 
  emptyMessage = "No notifications",
  compact = false
}: NotificationTabProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id}
          notification={notification}
          compact={compact}
        />
      ))}
    </div>
  );
}