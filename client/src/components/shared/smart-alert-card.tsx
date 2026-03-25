import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Clock,
  Users,
  Phone,
  Share2,
  BookOpen,
  Eye,
  Target,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartAlert {
  id: string;
  billId: number;
  billNumber: string;
  title: string;
  alertType: 'status_change' | 'committee_action' | 'vote_scheduled' | 'amendment_added' | 'deadline_approaching' | 'passed' | 'failed';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: {
    whatHappened: string;
    whyItMatters: string;
    whatItMeans: string;
    nextSteps: string[];
    timelineImpact: string;
    citizenImpact: string;
  };
  actionButtons: {
    primary: {
      label: string;
      action: 'contact_representative' | 'share_alert' | 'learn_more' | 'track_bill' | 'join_action';
      url?: string;
      data?: any;
    };
    secondary?: {
      label: string;
      action: 'contact_representative' | 'share_alert' | 'learn_more' | 'track_bill' | 'join_action';
      url?: string;
      data?: any;
    };
  };
  timestamp: Date;
  readStatus: boolean;
  expiresAt?: Date;
}

interface SmartAlertCardProps {
  alert: SmartAlert;
  onActionClick?: (action: string, data?: any) => void;
  onMarkAsRead?: (alertId: string) => void;
  compact?: boolean;
}

export function SmartAlertCard({ 
  alert, 
  onActionClick, 
  onMarkAsRead,
  compact = false 
}: SmartAlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white border-red-600';
      case 'high': return 'bg-orange-500 text-white border-orange-600';
      case 'medium': return 'bg-yellow-500 text-white border-yellow-600';
      case 'low': return 'bg-green-500 text-white border-green-600';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'status_change': return <Zap className="h-4 w-4" />;
      case 'committee_action': return <Users className="h-4 w-4" />;
      case 'vote_scheduled': return <Target className="h-4 w-4" />;
      case 'amendment_added': return <Info className="h-4 w-4" />;
      case 'deadline_approaching': return <Clock className="h-4 w-4" />;
      case 'passed': return <CheckCircle2 className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'contact_representative': return <Phone className="h-4 w-4" />;
      case 'share_alert': return <Share2 className="h-4 w-4" />;
      case 'learn_more': return <BookOpen className="h-4 w-4" />;
      case 'track_bill': return <Eye className="h-4 w-4" />;
      case 'join_action': return <Target className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const handleActionClick = async (action: string, data?: any) => {
    setIsProcessing(action);
    try {
      await onActionClick?.(action, data);
      
      // Mark as read when user takes action
      if (!alert.readStatus) {
        onMarkAsRead?.(alert.id);
      }
    } catch (error) {
      console.error('Error processing action:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      !alert.readStatus && "ring-2 ring-primary/20 bg-blue-50/30",
      compact && "p-3"
    )}>
      <CardHeader className={cn("pb-3", compact && "pb-2")}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Alert Icon & Status */}
            <div className={cn(
              "flex-shrink-0 p-2 rounded-full",
              getUrgencyColor(alert.urgency)
            )}>
              {getAlertIcon(alert.alertType)}
            </div>

            {/* Alert Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-lg font-semibold text-primary">
                  {alert.billNumber}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {alert.alertType.replace('_', ' ')}
                </Badge>
                {!alert.readStatus && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {alert.title}
              </h4>
              
              <p className="text-sm text-gray-700 mb-2">
                {alert.message}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTimeAgo(new Date(alert.timestamp))}</span>
                {alert.expiresAt && (
                  <span>Expires: {new Date(alert.expiresAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            onClick={() => handleActionClick(
              alert.actionButtons.primary.action,
              alert.actionButtons.primary.data
            )}
            disabled={isProcessing === alert.actionButtons.primary.action}
            className="flex items-center space-x-1"
          >
            {getActionIcon(alert.actionButtons.primary.action)}
            <span>{alert.actionButtons.primary.label}</span>
          </Button>

          {alert.actionButtons.secondary && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleActionClick(
                alert.actionButtons.secondary!.action,
                alert.actionButtons.secondary!.data
              )}
              disabled={isProcessing === alert.actionButtons.secondary.action}
              className="flex items-center space-x-1"
            >
              {getActionIcon(alert.actionButtons.secondary.action)}
              <span>{alert.actionButtons.secondary.label}</span>
            </Button>
          )}

          {!alert.readStatus && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead?.(alert.id)}
              className="text-muted-foreground"
            >
              Mark as Read
            </Button>
          )}
        </div>

        {/* Expanded Context */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {/* What Happened */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm flex items-center">
                <Info className="mr-2 h-4 w-4 text-blue-500" />
                What Happened
              </h5>
              <p className="text-sm text-gray-700 pl-6">
                {alert.context.whatHappened}
              </p>
            </div>

            {/* Why It Matters */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                Why It Matters
              </h5>
              <p className="text-sm text-gray-700 pl-6">
                {alert.context.whyItMatters}
              </p>
            </div>

            {/* What It Means */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm flex items-center">
                <Zap className="mr-2 h-4 w-4 text-purple-500" />
                What It Means
              </h5>
              <p className="text-sm text-gray-700 pl-6">
                {alert.context.whatItMeans}
              </p>
            </div>

            {/* Next Steps */}
            {alert.context.nextSteps.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm flex items-center">
                  <Target className="mr-2 h-4 w-4 text-green-500" />
                  Expected Next Steps
                </h5>
                <ul className="text-sm text-gray-700 pl-6 space-y-1">
                  {alert.context.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline Impact */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm flex items-center">
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                Timeline Impact
              </h5>
              <p className="text-sm text-gray-700 pl-6">
                {alert.context.timelineImpact}
              </p>
            </div>

            {/* Citizen Impact */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm flex items-center">
                <Users className="mr-2 h-4 w-4 text-red-500" />
                Impact on You
              </h5>
              <p className="text-sm text-gray-700 pl-6">
                {alert.context.citizenImpact}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}