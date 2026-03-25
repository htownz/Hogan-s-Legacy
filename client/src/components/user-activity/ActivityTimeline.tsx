import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle,
  CircleOff,
  ExternalLink,
  Share2,
  Star,
  Users,
  VoteIcon,
  MessageSquareText,
  Clock,
  ZapIcon,
  PenLine
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface UserActivity {
  id: number;
  userId: number;
  activityType: string;
  activityCategory: string;
  relatedRole?: string;
  objectType?: string;
  objectId?: string;
  points: number;
  metadata?: Record<string, any>;
  createdAt: string;
  sessionId?: string;
  platform?: string;
  deviceInfo?: string;
}

interface ActivityTimelineProps {
  userId?: number;
  limit?: number;
  maxHeight?: string;
  showHeader?: boolean;
  title?: string;
  description?: string;
  className?: string;
  highlightCategories?: string[];
}

const activityTypeIcons: Record<string, JSX.Element> = {
  // Engagement activities
  view_bill: <BookOpen className="h-5 w-5" />,
  track_bill: <Star className="h-5 w-5" />,
  comment: <MessageSquareText className="h-5 w-5" />,
  share: <Share2 className="h-5 w-5" />,
  vote: <VoteIcon className="h-5 w-5" />,
  follow: <Users className="h-5 w-5" />,
  react: <Award className="h-5 w-5" />,
  
  // Advocacy activities
  contact_rep: <PenLine className="h-5 w-5" />,
  attend_event: <CalendarClock className="h-5 w-5" />,
  sign_petition: <PenLine className="h-5 w-5" />,
  share_testimony: <ExternalLink className="h-5 w-5" />,
  submit_comment: <PenLine className="h-5 w-5" />,
  
  // Default for any activity type
  default: <Activity className="h-5 w-5" />
};

const activityCategoryColors: Record<string, { bg: string, text: string, icon: string }> = {
  engagement: { 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500'
  },
  advocacy: { 
    bg: 'bg-green-50 dark:bg-green-900/20', 
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-500'
  },
  education: { 
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-500'
  },
  community: { 
    bg: 'bg-amber-50 dark:bg-amber-900/20', 
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500'
  },
  achievement: { 
    bg: 'bg-rose-50 dark:bg-rose-900/20', 
    text: 'text-rose-600 dark:text-rose-400',
    icon: 'text-rose-500'
  },
  default: { 
    bg: 'bg-neutral-50 dark:bg-neutral-800', 
    text: 'text-neutral-600 dark:text-neutral-400',
    icon: 'text-neutral-500'
  }
};

// Helper to format activity type for display
const formatActivityType = (type: string): string => {
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get activity icon based on activity type
const getActivityIcon = (activity: UserActivity): JSX.Element => {
  // Check for specific activity types first
  if (activityTypeIcons[activity.activityType]) {
    return activityTypeIcons[activity.activityType];
  }
  
  // Use category-based fallbacks
  if (activity.activityCategory === 'achievement') {
    return <Award className="h-5 w-5" />;
  } else if (activity.activityCategory === 'education') {
    return <BookOpen className="h-5 w-5" />;
  } else if (activity.activityCategory === 'community') {
    return <Users className="h-5 w-5" />;
  } else if (activity.activityType.includes('earn')) {
    return <Award className="h-5 w-5" />;
  } else if (activity.activityType.includes('complete')) {
    return <CheckCircle className="h-5 w-5" />;
  }
  
  // Default icon
  return activityTypeIcons.default;
};

// Get the right color scheme based on activity category
const getActivityColors = (activity: UserActivity) => {
  return activityCategoryColors[activity.activityCategory] || activityCategoryColors.default;
};

export default function ActivityTimeline({
  userId,
  limit = 10,
  maxHeight = "500px",
  showHeader = true,
  title = "Activity Timeline",
  description = "Your recent civic engagement activities",
  className,
  highlightCategories = []
}: ActivityTimelineProps) {
  // Fetch user activities
  const { data: activities, isLoading } = useQuery<UserActivity[]>({
    queryKey: ['/api/user-activities', userId, { limit }],
    enabled: !!userId,
  });
  
  // Determine if the timeline has data to show
  const hasActivities = activities && activities.length > 0;
  
  return (
    <div className={cn("space-y-4", className)}>
      {showHeader && (
        <div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
      
      <ScrollArea className={cn("pr-4", maxHeight && `max-h-[${maxHeight}]`)}>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        ) : !hasActivities ? (
          <div className="text-center py-8 border rounded-lg">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-lg font-medium text-neutral-700 mb-1">No Recent Activity</h3>
            <p className="text-muted-foreground max-w-md mx-auto px-4">
              Your civic engagement activities will appear here as you interact with the platform.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-muted">
            {activities.map((activity, index) => (
              <ActivityItem 
                key={activity.id}
                activity={activity}
                isFirst={index === 0}
                isLast={index === activities.length - 1}
                index={index}
                highlight={highlightCategories.includes(activity.activityCategory)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      
      {hasActivities && activities && activities.length > 5 && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            View All Activities
          </Button>
        </div>
      )}
    </div>
  );
}

interface ActivityItemProps {
  activity: UserActivity;
  isFirst: boolean;
  isLast: boolean;
  index: number;
  highlight: boolean;
}

function ActivityItem({ activity, isFirst, isLast, index, highlight }: ActivityItemProps) {
  const colors = getActivityColors(activity);
  const icon = getActivityIcon(activity);
  
  // Format the date
  const formattedDate = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
  });
  
  // Get more detailed time for tooltip
  const detailedTime = format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a");
  
  return (
    <motion.div 
      className={cn(
        "relative mb-6 last:mb-0",
        highlight && "bg-muted/20 -ml-6 pl-6 pr-4 py-3 rounded-r-lg border-r border-t border-b"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {/* Timeline dot */}
      <div 
        className={cn(
          "absolute -left-[23px] z-10 rounded-full p-1.5 flex items-center justify-center",
          colors.bg
        )}
      >
        <div className={colors.icon}>
          {icon}
        </div>
      </div>
      
      {/* Activity content */}
      <div className="pl-2">
        <div className="flex flex-wrap items-start justify-between mb-1">
          <h4 className="font-medium text-neutral-800">
            {formatActivityType(activity.activityType)}
          </h4>
          
          <Badge variant="outline" className={cn("ml-auto", colors.text)}>
            {activity.activityCategory.charAt(0).toUpperCase() + activity.activityCategory.slice(1)}
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground mb-1.5">
          {activity.metadata?.billId && (
            <span className="inline-flex items-center gap-1 mr-2">
              <BookOpen className="h-3.5 w-3.5" />
              Bill {activity.metadata.billId}
            </span>
          )}
          
          {activity.relatedRole && (
            <span className="inline-flex items-center gap-1 mr-2">
              <ZapIcon className="h-3.5 w-3.5" />
              {activity.relatedRole.charAt(0).toUpperCase() + activity.relatedRole.slice(1)} role
            </span>
          )}
          
          <span className="inline-flex items-center gap-1" title={detailedTime}>
            <Clock className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          {/* Action button or link if needed */}
          {activity.objectId && (
            <Button variant="ghost" size="sm" className="px-0 h-7 text-xs">
              View Details
            </Button>
          )}
          
          {/* Points earned */}
          <div className="ml-auto flex items-center">
            <div className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              colors.bg,
              colors.text
            )}>
              +{activity.points} pts
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton loader for activities
function ActivitySkeleton() {
  return (
    <div className="relative mb-6 last:mb-0 pl-8">
      <Skeleton className="absolute -left-3 h-6 w-6 rounded-full" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-1/5" />
          <Skeleton className="h-3 w-1/6" />
        </div>
      </div>
    </div>
  );
}