import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, Share, MessageSquare, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { useNotifications } from '@/contexts/notification-context';

interface SmartBillAlertProps {
  notification: {
    id: number;
    billId: string;
    message: string;
    read: boolean;
    createdAt: string;
    billTitle: string;
    metadata?: {
      changeType?: string;
      previousStatus?: string;
      currentStatus?: string;
      explanation?: string;
      impact?: string;
      nextSteps?: string;
    };
  };
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export default function SmartBillAlert({ 
  notification, 
  expanded = false,
  onToggleExpand 
}: SmartBillAlertProps) {
  const [_, setLocation] = useLocation();
  const { markAsRead } = useNotifications();
  
  const handleView = () => {
    // Mark as read and navigate to bill detail
    markAsRead(notification.id);
    setLocation(`/bills/${notification.billId}`);
  };
  
  const handleContact = () => {
    // Navigate to the contact officials page with this bill pre-selected
    markAsRead(notification.id);
    setLocation(`/contact?billId=${notification.billId}`);
  };
  
  const handleShare = () => {
    // Logic to share bill information
    if (navigator.share) {
      navigator.share({
        title: `Act Up: ${notification.billTitle}`,
        text: `Check out this legislative update: ${notification.message}`,
        url: window.location.origin + `/bills/${notification.billId}`
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers without Web Share API
      const shareUrl = window.location.origin + `/bills/${notification.billId}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };
  
  // Get appropriate badge color based on notification type
  const getBadgeVariant = () => {
    if (!notification.metadata?.changeType) return "default";
    
    switch (notification.metadata.changeType.toLowerCase()) {
      case 'committee_assignment':
        return "secondary";
      case 'hearing_scheduled':
        return "secondary"; // Changed from warning to secondary
      case 'vote_scheduled':
        return "secondary"; // Changed from warning to secondary
      case 'voted':
        return "default";
      case 'passed':
        return "success";
      case 'failed':
        return "destructive";
      case 'amended':
        return "outline";
      default:
        return "default";
    }
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <Card className={cn(
      "w-full transition-all",
      notification.read ? "bg-gray-50" : "bg-white border-l-4 border-l-blue-500",
      expanded ? "shadow-md" : "shadow-sm"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <AlertCircle className="h-5 w-5 text-blue-500" />
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={getBadgeVariant()} className="mb-1.5">
                    {notification.metadata?.changeType 
                      ? notification.metadata.changeType.replace(/_/g, ' ') 
                      : 'Update'}
                  </Badge>
                  <h3 className="font-medium text-sm sm:text-base">
                    {notification.billTitle}
                  </h3>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600">{notification.message}</p>
              
              {expanded && notification.metadata && (
                <div className="mt-2 space-y-3 pt-2 border-t border-gray-100">
                  {notification.metadata.explanation && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">WHAT THIS MEANS</h4>
                      <p className="text-sm">{notification.metadata.explanation}</p>
                    </div>
                  )}
                  
                  {notification.metadata.impact && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">POTENTIAL IMPACT</h4>
                      <p className="text-sm">{notification.metadata.impact}</p>
                    </div>
                  )}
                  
                  {notification.metadata.nextSteps && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">WHAT'S NEXT</h4>
                      <p className="text-sm">{notification.metadata.nextSteps}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="rounded-full"
                  onClick={handleView}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  View Bill
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={handleContact}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Contact
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={handleShare}
                >
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
                
                {notification.metadata && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={onToggleExpand}
                  >
                    {expanded ? 'Less Info' : 'More Info'}
                    <ChevronRight className={cn(
                      "h-4 w-4 ml-1 transition-transform",
                      expanded ? "rotate-90" : ""
                    )} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}