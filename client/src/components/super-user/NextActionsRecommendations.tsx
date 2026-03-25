// @ts-nocheck
import { useState, useEffect } from "react";
import { RecommendedAction } from "@shared/schema";
import { SuperUserRoleType } from "@/lib/types";
import { ROLE_COLORS, ROLE_ICONS } from "@/lib/constants";
import { useSuperUser } from "@/contexts/SuperUserContext";
import { Button } from "@/components/ui/button";

interface ActionItemProps {
  action: RecommendedAction;
  onAction: (id: number) => void;
}

function ActionItem({ action, onAction }: ActionItemProps) {
  // Determine styling based on action type
  const getTypeClasses = (type: string): { bgColor: string, textColor: string, actionBg: string } => {
    switch (type) {
      case "catalyst":
        return {
          bgColor: "bg-success bg-opacity-5",
          textColor: "text-success",
          actionBg: "bg-success"
        };
      case "community":
        return {
          bgColor: "bg-primary bg-opacity-5",
          textColor: "text-primary",
          actionBg: "bg-primary"
        };
      case "skill-building":
        return {
          bgColor: "bg-accent bg-opacity-5",
          textColor: "text-accent",
          actionBg: "bg-accent"
        };
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          actionBg: "bg-gray-800"
        };
    }
  };

  // Get icon based on action type
  const getActionIcon = (type: string) => {
    switch (type) {
      case "catalyst":
        return (
          <svg className="h-5 w-5 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case "community":
        return (
          <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        );
      case "skill-building":
        return (
          <svg className="h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
    }
  };

  // Get badge text based on action type
  const getTypeDisplayText = (type: string, targetRole?: string): string => {
    if (type === "catalyst" || type === "amplifier" || type === "convincer") {
      return `Perfect for ${targetRole ? targetRole.charAt(0).toUpperCase() + targetRole.slice(1) + "s" : "Catalysts"}`;
    } else if (type === "community") {
      return "Group Project";
    } else if (type === "skill-building") {
      return "Skill Development";
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get button text based on action type
  const getActionButtonText = (type: string): string => {
    switch (type) {
      case "catalyst":
        return "Start Verification";
      case "community":
        return "Join Analysis Team";
      case "skill-building":
        return "Start Course";
      default:
        return "Take Action";
    }
  };

  const typeClasses = getTypeClasses(action.type);
  
  return (
    <div className={`border ${action.type === "catalyst" ? "border-success border-opacity-50" : "border-gray-200"} rounded-lg p-4 ${typeClasses.bgColor}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className={`h-10 w-10 rounded-full ${action.type === "catalyst" ? "bg-success bg-opacity-10" : action.type === "community" ? "bg-primary bg-opacity-10" : "bg-accent bg-opacity-10"} flex items-center justify-center`}>
            {getActionIcon(action.type)}
          </div>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{action.description}</p>
          <div className="mt-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${action.type === "catalyst" ? "bg-success bg-opacity-20 text-success" : action.type === "community" ? "bg-primary bg-opacity-10 text-primary" : "bg-accent bg-opacity-10 text-accent"}`}>
              {getTypeDisplayText(action.type, action.targetRole || undefined)}
            </span>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {action.timeEstimate}
            </span>
            {action.priority === "high" && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                High Priority
              </span>
            )}
          </div>
          <div className="mt-4">
            <Button 
              onClick={() => onAction(action.id)}
              variant="default"
              className={`px-3 py-1.5 ${action.type === "catalyst" ? "bg-success hover:bg-success-dark" : action.type === "community" ? "bg-primary hover:bg-primary-dark" : "bg-accent hover:bg-accent-dark"}`}
            >
              {getActionButtonText(action.type)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NextActionsRecommendations() {
  const { mainRole } = useSuperUser();
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);

  // Mock data for recommended actions
  const mockRecommendedActions: RecommendedAction[] = [
    {
      id: 1,
      title: "Verify Key Claims in HB 234",
      description: "Several claims about this bill's impact on water rights need verification. Your expertise would help inform the community.",
      targetRole: "catalyst",
      type: "catalyst",
      timeEstimate: "~20 minutes",
      priority: "high",
      createdAt: new Date()
    },
    {
      id: 2,
      title: "Contribute to Transportation Bill Analysis",
      description: "Your Austin Action Circle needs help breaking down the new transportation bill's impact on local communities.",
      targetRole: null,
      type: "community",
      timeEstimate: "1-2 hours",
      priority: "high",
      createdAt: new Date()
    },
    {
      id: 3,
      title: "Complete Advanced Research Course",
      description: "Enhance your Catalyst skills with this course on advanced legislative research techniques.",
      targetRole: "catalyst",
      type: "skill-building",
      timeEstimate: "30 minute course",
      priority: "medium",
      createdAt: new Date()
    }
  ];

  // In a real app, we would fetch recommended actions from the API
  useEffect(() => {
    // If we had a mainRole, we would filter by role
    // const role = mainRole?.role as SuperUserRoleType;
    // fetch(`/api/recommended-actions?role=${role}`).then(res => res.json()).then(setRecommendedActions);
    setRecommendedActions(mockRecommendedActions);
  }, [mainRole]);

  const handleActionTaken = (actionId: number) => {
    console.log(`Action taken on recommendation ${actionId}`);
    // In a real app, we would make an API call here
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recommended Actions</h2>
      <div className="space-y-4">
        {recommendedActions.map((action) => (
          <ActionItem
            key={action.id}
            action={action}
            onAction={handleActionTaken}
          />
        ))}
      </div>
    </div>
  );
}
