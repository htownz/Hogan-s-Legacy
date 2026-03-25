import { useState, useEffect } from "react";
import { MovementMetrics } from "@/lib/types";
import { formatMovementPercentage, calculateProgressTowardsTarget } from "@/lib/utils/progressUtils";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  className?: string;
}

function StatCard({ title, value, subText, className }: StatCardProps) {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm ${className}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-center">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        {subText && (
          <span className="ml-2 text-sm font-medium text-success">{subText}</span>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {title === "Active Super Users" && "Super users driving engagement and growth"}
        {title === "Recent Growth" && "Driven by water rights and education campaigns"}
        {title === "Your Contribution" && "Your direct and indirect influence impact"}
      </p>
    </div>
  );
}

export default function TippingPointProgress() {
  const { user } = useUser();
  const [movementProgress, setMovementProgress] = useState<MovementMetrics>({
    id: 1,
    currentPercentage: 42, // 4.2%
    formattedCurrentPercentage: "4.2%",
    targetPercentage: 250, // 25.0%
    activeSuperUsers: 2734,
    recentGrowthPercentage: 3, // 0.3%
    formattedRecentGrowthPercentage: "+0.3%",
    progressTowardsTarget: 16.8,
    updatedAt: new Date()
  });
  
  // Format the percentages for display
  useEffect(() => {
    const formatted = {
      ...movementProgress,
      formattedCurrentPercentage: formatMovementPercentage(movementProgress.currentPercentage),
      formattedRecentGrowthPercentage: "+" + formatMovementPercentage(movementProgress.recentGrowthPercentage),
      progressTowardsTarget: calculateProgressTowardsTarget(
        movementProgress.currentPercentage,
        movementProgress.targetPercentage
      )
    };
    setMovementProgress(formatted);
  }, []);

  // In a real app, we would fetch this data from the API
  // useEffect(() => {
  //   fetch("/api/movement-progress")
  //     .then(res => res.json())
  //     .then(data => {
  //       const formatted = {
  //         ...data,
  //         formattedCurrentPercentage: formatMovementPercentage(data.currentPercentage),
  //         formattedRecentGrowthPercentage: "+" + formatMovementPercentage(data.recentGrowthPercentage),
  //         progressTowardsTarget: calculateProgressTowardsTarget(
  //           data.currentPercentage,
  //           data.targetPercentage
  //         )
  //       };
  //       setMovementProgress(formatted);
  //     });
  // }, []);

  const handleViewAnalytics = () => {
    console.log("View movement analytics");
    // In a real app, navigate to analytics page
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Movement Progress</h2>
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900">{movementProgress.formattedCurrentPercentage}</div>
          <p className="text-sm text-gray-600">of voting-age Texans engaged through Act Up</p>
          <p className="text-xs text-gray-500 mt-1">Target: 25% for societal tipping point</p>
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500">Current</span>
            <span className="text-xs font-medium text-gray-500">Target</span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary bg-opacity-10">
                  {movementProgress.formattedCurrentPercentage}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary bg-opacity-10">
                  25%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary bg-opacity-10">
              <div 
                style={{ width: `${movementProgress.progressTowardsTarget}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
              ></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Active Super Users" 
            value={movementProgress.activeSuperUsers.toLocaleString()}
          />
          <StatCard 
            title="Recent Growth" 
            value={movementProgress.formattedRecentGrowthPercentage}
            subText="this month"
          />
          <StatCard 
            title="Your Contribution" 
            value="184"
            subText="people"
          />
        </div>
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            className="text-primary bg-primary bg-opacity-10 hover:bg-opacity-20 border-0"
            onClick={handleViewAnalytics}
          >
            View Movement Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
