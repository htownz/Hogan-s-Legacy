// @ts-nocheck
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Challenge } from "@shared/schema";
import { ChallengeType } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/constants";
import { useSuperUser } from "@/contexts/SuperUserContext";
import { Button } from "@/components/ui/button";

interface ChallengeCardProps {
  title: string;
  description: string;
  type: ChallengeType;
  role?: string;
  progress?: number;
  total?: number;
  daysRemaining?: number;
  tags?: string[];
  onAction: () => void;
  actionText: string;
}

function ChallengeCard({
  title,
  description,
  type,
  role,
  progress = 0,
  total = 5,
  daysRemaining,
  tags,
  onAction,
  actionText
}: ChallengeCardProps) {
  const progressPercentage = Math.min(100, Math.round((progress / total) * 100));
  
  let cardClass = "border border-gray-200 rounded-lg p-4 bg-white relative";
  let badgeClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  let actionClass = "text-sm font-medium";
  
  // Style based on type and role
  if (type === "role-specific" && role) {
    const roleColor = ROLE_COLORS[role as keyof typeof ROLE_COLORS];
    cardClass = `border border-${roleColor.primary} border-opacity-50 rounded-lg p-4 bg-${roleColor.primary} bg-opacity-5 relative`;
    badgeClass = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${roleColor.primary} bg-opacity-20 text-${roleColor.primary}`;
    actionClass = `text-${roleColor.primary} text-sm font-medium hover:text-${roleColor.primary}-dark`;
  } else if (type === "community") {
    badgeClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary bg-opacity-10 text-primary";
    actionClass = "text-primary text-sm font-medium hover:text-primary-dark";
  } else if (type === "skill-building") {
    badgeClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent bg-opacity-10 text-accent";
    actionClass = "text-accent text-sm font-medium hover:text-accent-dark";
  }
  
  return (
    <div className={cardClass}>
      <div className="absolute top-3 right-3">
        <span className={badgeClass}>
          {type === "role-specific" ? role : type === "community" ? "Community" : "Skill Building"}
        </span>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      {type !== "skill-building" && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">
              {type === "community" ? "Community Progress" : "Progress"}
            </span>
            <span className="text-xs font-medium text-gray-700">
              {type === "community" ? `${progressPercentage}%` : `${progress}/${total} completed`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full",
                type === "role-specific" && role === "catalyst" ? "bg-success" :
                type === "role-specific" && role === "amplifier" ? "bg-primary" :
                type === "role-specific" && role === "convincer" ? "bg-accent" :
                "bg-primary"
              )} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {daysRemaining ? `${daysRemaining} days remaining` : 
           type === "skill-building" ? "30 min course" : 
           type === "community" ? "143 participants" : ""}
        </span>
        <Button 
          variant="ghost"
          className={actionClass}
          onClick={onAction}
        >
          {actionText}
        </Button>
      </div>
    </div>
  );
}

export default function ChallengesAndCampaigns() {
  const { mainRole } = useSuperUser();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  
  // Mock data for challenges
  const mockChallenges = [
    {
      id: 1,
      title: "Fact Verification Sprint",
      description: "Verify 5 claims about the new water conservation bill in your district.",
      targetRole: "catalyst",
      type: "role-specific",
      requiredActions: 5,
      daysRemaining: 2,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      id: 2,
      title: "Truth in Transit Bill",
      description: "Help Austin residents understand the real impact of the new transit funding bill.",
      targetRole: null,
      type: "community",
      requiredActions: 10,
      daysRemaining: 5,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
    {
      id: 3,
      title: "Research Master Class",
      description: "Learn advanced techniques for analyzing legislation and verifying claims.",
      targetRole: null,
      type: "skill-building",
      requiredActions: 1,
      daysRemaining: 14,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    }
  ];
  
  // In a real app, we would fetch challenges from the API
  useEffect(() => {
    // fetch("/api/challenges").then(res => res.json()).then(setChallenges);
    setChallenges(mockChallenges);
  }, []);
  
  const handleChallengeAction = (challengeId: number, action: string) => {
    console.log(`Challenge ${challengeId} action: ${action}`);
    // In a real app, we would make an API call here
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Current Challenges</h2>
        <div className="mt-2 md:mt-0">
          <Button variant="default" className="bg-primary hover:bg-primary-dark">
            Find More Challenges
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            title={challenge.title}
            description={challenge.description}
            type={challenge.type as ChallengeType}
            role={challenge.targetRole || undefined}
            progress={challenge.id === 1 ? 3 : 0} // Mock progress for first challenge
            total={challenge.requiredActions}
            daysRemaining={challenge.daysRemaining}
            tags={challenge.id === 3 ? ["Research", "Verification", "Analysis"] : undefined}
            onAction={() => handleChallengeAction(
              challenge.id, 
              challenge.id === 1 ? "continue" : 
              challenge.id === 2 ? "join" : 
              "start"
            )}
            actionText={
              challenge.id === 1 ? "Continue Challenge" : 
              challenge.id === 2 ? "Join Challenge" : 
              "Start Learning"
            }
          />
        ))}
      </div>
    </div>
  );
}
