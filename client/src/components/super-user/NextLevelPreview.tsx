// @ts-nocheck
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SuperUserRoleType, NextLevelFeature } from "@/lib/types";
import { ROLE_COLORS, SUPER_SPREADER_FEATURES } from "@/lib/constants";
import { useSuperUser } from "@/contexts/SuperUserContext";
import { getNextLevelName } from "@/lib/utils/progressUtils";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";

interface FeatureItemProps {
  feature: NextLevelFeature;
}

function FeatureItem({ feature }: FeatureItemProps) {
  return (
    <li className="flex">
      <CheckIcon className="h-5 w-5 text-success flex-shrink-0 mr-2" />
      <span className="text-sm text-gray-700">{feature.title}</span>
    </li>
  );
}

interface NextLevelPreviewProps {
  roleType: SuperUserRoleType;
  progressPercentage: number;
}

export default function NextLevelPreview({ 
  roleType = "catalyst", 
  progressPercentage = 67 
}: NextLevelPreviewProps) {
  const { mainRole } = useSuperUser();
  const [features, setFeatures] = useState<NextLevelFeature[]>(SUPER_SPREADER_FEATURES);
  
  // Use the main role if available, otherwise use the props
  const role = mainRole?.role as SuperUserRoleType || roleType;
  const progress = mainRole?.progressPercentage || progressPercentage;
  const currentLevel = mainRole?.level || 2;
  const nextLevelName = getNextLevelName(currentLevel);
  
  // In a real app, we would fetch features for the next level from the API
  // useEffect(() => {
  //   if (mainRole) {
  //     fetch(`/api/level-features?level=${mainRole.level + 1}&role=${mainRole.role}`)
  //       .then(res => res.json())
  //       .then(setFeatures);
  //   }
  // }, [mainRole]);

  const handleViewPathClick = () => {
    console.log("View path to next level");
    // In a real app, navigate to the role progression path view
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start">
        <div className="flex-shrink-0 mb-4 md:mb-0">
          <ProgressRing progress={progress} role={role}>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{progress}%</div>
              <div className="text-xs text-gray-500">to next level</div>
            </div>
          </ProgressRing>
        </div>
        <div className="md:ml-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Coming at {nextLevelName} Level</h2>
          <p className="text-sm text-gray-600 mb-4">
            You're making great progress! Just a few more actions to unlock these powerful features:
          </p>
          <ul className="space-y-3">
            {features.map((feature) => (
              <FeatureItem key={feature.id} feature={feature} />
            ))}
          </ul>
          <div className="mt-6">
            <Button 
              variant="default"
              className={cn(
                "bg-success hover:bg-success-dark",
                role === "amplifier" && "bg-primary hover:bg-primary-dark",
                role === "convincer" && "bg-accent hover:bg-accent-dark"
              )}
              onClick={handleViewPathClick}
            >
              See How to Reach {nextLevelName}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
