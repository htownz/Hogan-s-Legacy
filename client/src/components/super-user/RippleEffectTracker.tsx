// @ts-nocheck
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RippleEffect, ImpactTimelineItem } from "@/lib/types";
import { MOCK_TIMELINE_ITEMS } from "@/lib/constants";
import { formatNumber, formatTimeAgo, getIconClassName } from "@/lib/utils/rippleEffectUtils";
import { RippleEffect as RippleEffectComponent } from "@/components/ui/ripple-effect";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  valueClassName?: string;
}

function StatCard({ title, value, description, valueClassName }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-center">
        <span className="text-2xl font-bold text-gray-800">{formatNumber(value)}</span>
        <span className={cn("ml-2 text-sm font-medium", valueClassName)}>{description}</span>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {title === "Direct Influence" && "People who took action based on your verified facts and resources"}
        {title === "Secondary Reach" && "People who learned from those you directly influenced"}
        {title === "Total Impact" && "Your combined direct and indirect impact"}
      </p>
    </div>
  );
}

interface TimelineItemProps {
  item: ImpactTimelineItem;
}

function TimelineItem({ item }: TimelineItemProps) {
  const iconClassName = getIconClassName(item.iconType);
  const timeAgo = formatTimeAgo(item.timestamp);
  const impactText = `+${item.impactCount} impact`;
  
  // Map action types to icon paths
  const getIconPath = (actionType: string) => {
    switch (actionType) {
      case "share":
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        );
      case "verify":
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        );
      case "contact":
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        );
      case "resource":
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        );
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        );
    }
  };
  
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", iconClassName)}>
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {getIconPath(item.actionType)}
          </svg>
        </div>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">{item.content}</p>
        <div className="mt-1 flex items-center">
          <span className="text-xs text-gray-500">{timeAgo}</span>
          <span className="ml-2 text-xs font-medium text-success">{impactText}</span>
        </div>
      </div>
    </div>
  );
}

export default function RippleEffectTracker() {
  const { user } = useUser();
  
  const [rippleEffect, setRippleEffect] = useState<RippleEffect>({
    id: 1,
    userId: user?.id || 1,
    directInfluence: 32,
    secondaryReach: 152,
    totalImpact: 184,
    updatedAt: new Date(),
  });
  
  const [timelineItems, setTimelineItems] = useState(MOCK_TIMELINE_ITEMS);
  
  // In a real app, we would fetch this data from the API
  useEffect(() => {
    if (user) {
      // Fetch ripple effect data and timeline
      // fetchRippleEffect(user.id).then(setRippleEffect);
      // fetchTimelineItems(user.id).then(setTimelineItems);
    }
  }, [user]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Ripple Effect</h2>
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex flex-col items-center mb-6">
          <RippleEffectComponent className="mb-4">
            <div className="relative w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center border-2 border-success">
              <img 
                className="h-16 w-16 rounded-full" 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                alt={user?.name || "User"}
              />
            </div>
          </RippleEffectComponent>
          <h3 className="text-lg font-medium text-gray-900">{user?.name || "Sarah Johnson"}</h3>
          <p className="text-sm text-gray-500">Catalyst Influencer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard 
            title="Direct Influence" 
            value={rippleEffect.directInfluence} 
            description="people activated"
            valueClassName="text-success"
          />
          <StatCard 
            title="Secondary Reach" 
            value={rippleEffect.secondaryReach} 
            description="people informed"
            valueClassName="text-primary"
          />
          <StatCard 
            title="Total Impact" 
            value={rippleEffect.totalImpact} 
            description="total influence"
            valueClassName="text-accent"
          />
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Impact Timeline</h3>
          <div className="space-y-4">
            {timelineItems.map((item) => (
              <TimelineItem
                key={item.id}
                item={item}
              />
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="ghost" className="text-primary text-sm font-medium hover:text-primary-dark">
              View Full Impact History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
