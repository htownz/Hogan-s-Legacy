import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SuperUserRole, ProgressionMilestone } from "@/lib/types";

interface SuperUserProgressProps {
  userRole?: SuperUserRole;
  milestones?: ProgressionMilestone[];
  isLoading: boolean;
}

export default function SuperUserProgress({ userRole, milestones, isLoading }: SuperUserProgressProps) {
  if (isLoading || !userRole) {
    return (
      <Card className="shadow mb-8 overflow-hidden">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-4">
              <div className="flex justify-center">
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
              </div>
              <div className="mt-6 text-center">
                <Skeleton className="h-6 w-40 mx-auto mb-2" />
                <Skeleton className="h-4 w-60 mx-auto" />
              </div>
            </div>
            <div className="flex-1 p-4">
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start">
                    <Skeleton className="h-5 w-5 rounded-full mr-3 mt-1" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-full mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <div className="bg-neutral-50 px-6 py-3 flex justify-between items-center">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </Card>
    );
  }

  const progressToNextLevel = userRole.progressToNextLevel || 0;
  const nextLevelLabel = getNextLevelLabel(userRole.level);
  
  return (
    <Card className="shadow mb-8 overflow-hidden">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Your Path to {nextLevelLabel}</h2>
        
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-4">
            <div className="flex justify-center">
              <div className="relative w-[120px] h-[120px]">
                <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="6"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={getRoleColor(userRole.role)}
                    strokeWidth="6"
                    strokeDasharray="339.292"
                    strokeDashoffset={339.292 - (progressToNextLevel / 100) * 339.292}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="block text-3xl font-bold text-neutral-800">{progressToNextLevel}%</span>
                  <span className="text-xs text-neutral-500">to next level</span>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-xl font-semibold text-neutral-800">Level {userRole.level}: {getCurrentLevelLabel(userRole.level)}</h3>
              <p className="text-neutral-500 text-sm mt-1">
                Keep growing your {getRoleDescription(userRole.role)} to reach {nextLevelLabel}
              </p>
            </div>
          </div>

          <div className="flex-1 p-4">
            <h3 className="font-medium text-neutral-700 mb-3">Milestones to {nextLevelLabel}</h3>
            <ul className="space-y-3">
              {milestones?.filter(m => m.targetLevel === userRole.level + 1).map(milestone => (
                <li key={milestone.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle 
                      className={`h-5 w-5 ${
                        milestone.completed 
                          ? getRoleTextColorClass(userRole.role) 
                          : milestone.progress > 0 
                            ? getRoleLightColorClass(userRole.role) 
                            : "text-neutral-300"
                      }`} 
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-neutral-700">{milestone.milestone}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {milestone.progress}/{milestone.total} completed
                    </p>
                    {milestone.progress > 0 && milestone.progress < milestone.total && (
                      <Progress 
                        value={(milestone.progress / milestone.total) * 100} 
                        className="h-1 mt-1" 
                        indicatorClassName={getRoleBgClass(userRole.role)}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-neutral-50 px-6 py-3 flex justify-between items-center">
        <div className="text-sm text-neutral-500">Next Achievement: Network Champion Badge</div>
        <button className={`hover:text-neutral-700 text-sm font-medium focus:outline-none ${getRoleTextColorClass(userRole.role)}`}>
          View Full Progression Path
        </button>
      </CardFooter>
    </Card>
  );
}

function getCurrentLevelLabel(level: number): string {
  switch (level) {
    case 1: return "Advocate";
    case 2: return "Influencer";
    case 3: return "Super Spreader";
    case 4: return "Movement Builder";
    default: return "Advocate";
  }
}

function getNextLevelLabel(level: number): string {
  switch (level) {
    case 1: return "Influencer";
    case 2: return "Super Spreader";
    case 3: return "Movement Builder";
    case 4: return "Movement Builder";
    default: return "Influencer";
  }
}

function getRoleDescription(role: string): string {
  switch (role) {
    case "catalyst": return "knowledge impact";
    case "amplifier": return "network";
    case "convincer": return "influence";
    default: return "impact";
  }
}

function getRoleColor(role: string): string {
  switch (role) {
    case "catalyst": return "#1A4D9F"; // primary-500
    case "amplifier": return "#00A36C"; // secondary-500
    case "convincer": return "#FF8C42"; // alert-500
    default: return "#1A4D9F";
  }
}

function getRoleTextColorClass(role: string): string {
  switch (role) {
    case "catalyst": return "text-primary-500";
    case "amplifier": return "text-secondary-500";
    case "convincer": return "text-alert-500";
    default: return "text-primary-500";
  }
}

function getRoleLightColorClass(role: string): string {
  switch (role) {
    case "catalyst": return "text-primary-300";
    case "amplifier": return "text-secondary-300";
    case "convincer": return "text-alert-300";
    default: return "text-primary-300";
  }
}

function getRoleBgClass(role: string): string {
  switch (role) {
    case "catalyst": return "bg-primary-500";
    case "amplifier": return "bg-secondary-500";
    case "convincer": return "bg-alert-500";
    default: return "bg-primary-500";
  }
}
