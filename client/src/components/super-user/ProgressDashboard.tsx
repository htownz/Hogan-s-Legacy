// @ts-nocheck
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SuperUserRoleWithLevel, SuperUserRoleType } from "@/lib/types";
import { formatLevelDisplay, getRemainingActionsMessage, getNextLevelName } from "@/lib/utils/progressUtils";
import { ROLE_COLORS } from "@/lib/constants";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  subText?: string;
  children?: ReactNode;
}

function StatCard({ title, value, subValue, subText, children }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-end">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        {subValue && <span className="ml-2 text-sm font-medium text-success">{subValue}</span>}
      </div>
      {subText && <div className="mt-4 text-sm text-gray-600">{subText}</div>}
      {children}
    </div>
  );
}

function ProgressionStep({
  text,
  subText,
  status,
  current = false,
}: {
  text: string;
  subText: string;
  status: "completed" | "current" | "upcoming";
  current?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={cn(
          "flex items-center justify-center w-12 h-12 rounded-full",
          status === "completed" ? "bg-success text-white" : 
          status === "current" ? "bg-success text-white relative" : 
          "bg-gray-200 text-gray-400"
        )}
      >
        {status === "completed" && (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        )}
        {status === "current" && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-20"></span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
            </svg>
          </>
        )}
        {status === "upcoming" && status === "super-spreader" && (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        )}
        {status === "upcoming" && status === "movement-builder" && (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        )}
      </div>
      <span className={cn(
        "mt-2 text-sm font-medium",
        status === "completed" || status === "current" ? "text-gray-900" : "text-gray-500"
      )}>
        {text}
      </span>
      <span className={cn(
        "text-xs",
        status === "completed" ? "text-gray-500" : 
        status === "current" ? "text-success" : 
        "text-gray-400"
      )}>
        {subText}
      </span>
    </div>
  );
}

interface ProgressDashboardProps {
  role: SuperUserRoleWithLevel;
}

export default function ProgressDashboard({ role }: ProgressDashboardProps) {
  const roleType = role.role as SuperUserRoleType;
  const roleColor = ROLE_COLORS[roleType];
  const progressPercentage = role.progressPercentage;
  const remainingPercentage = 100 - progressPercentage;
  const remainingActionsMessage = getRemainingActionsMessage(roleType, progressPercentage);
  
  // Role-specific metrics
  const metrics = role.metrics || {};
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Your {ROLE_COLORS[roleType]} Journey</h2>
        <div className="mt-2 md:mt-0 flex items-center">
          <span 
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
              `bg-${roleColor.primary} bg-opacity-10`,
              `text-${roleColor.primary}`
            )}
          >
            {formatLevelDisplay(role.level, roleType)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Level Progress */}
        <StatCard 
          title={`Progress to ${getNextLevelName(role.level)}`}
          value={`${progressPercentage}%`}
          subValue={`${remainingPercentage}% remaining`}
          subText={remainingActionsMessage}
        >
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className={`bg-${roleColor.primary} h-2.5 rounded-full`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </StatCard>

        {/* Role-specific metrics cards */}
        {roleType === "catalyst" && (
          <>
            <StatCard 
              title="Knowledge Contributions"
              value={metrics.knowledgeContributions || 28}
              subValue="+12 this month"
            >
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Verified Facts</span>
                  <span className="text-xs font-medium text-gray-800">{metrics.verifiedFacts || 15}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Resources Shared</span>
                  <span className="text-xs font-medium text-gray-800">{metrics.resourcesShared || 8}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Misinformation Identified</span>
                  <span className="text-xs font-medium text-gray-800">{metrics.misinformationIdentified || 5}</span>
                </div>
              </div>
            </StatCard>
          </>
        )}

        {/* Common metrics cards for all roles */}
        <StatCard 
          title="Influence Impact"
          value="152"
          subValue="people informed"
        >
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Knowledge Views</span>
              <span className="text-xs font-medium text-gray-800">437</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Resource Downloads</span>
              <span className="text-xs font-medium text-gray-800">89</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Fact Verification Rate</span>
              <span className="text-xs font-medium text-gray-800">92%</span>
            </div>
          </div>
        </StatCard>

        <StatCard 
          title="Movement Contribution"
          value="4.2%"
          subValue="of 25% goal"
        >
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Actions Inspired</span>
              <span className="text-xs font-medium text-gray-800">43</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Policies Influenced</span>
              <span className="text-xs font-medium text-gray-800">2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Community Rank</span>
              <span className="text-xs font-medium text-gray-800">Top 15%</span>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Progression Visualization */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Your {ROLE_COLORS[roleType]} Progression Path</h3>
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-between">
            <ProgressionStep 
              text="Advocate" 
              subText="Completed" 
              status="completed" 
            />
            
            <ProgressionStep 
              text="Influencer" 
              subText="Current level" 
              status="current" 
              current={true} 
            />
            
            <ProgressionStep 
              text="Super Spreader" 
              subText={`${progressPercentage}% complete`} 
              status="upcoming" 
            />
            
            <ProgressionStep 
              text="Movement Builder" 
              subText="Locked" 
              status="upcoming" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
