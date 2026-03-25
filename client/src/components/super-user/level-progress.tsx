// @ts-nocheck
import { useUser } from "@/context/user-context";
import { cn, getProgressColor, getProgressToNextLevel, getLevelName } from "@/lib/utils";

interface LevelProgressProps {
  className?: string;
}

export function LevelProgress({ className }: LevelProgressProps) {
  const { superUser } = useUser();
  
  if (!superUser) return null;

  return (
    <div className={cn("flex flex-col mb-4", className)}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <span className="text-lg font-medium text-dark">
            Level {superUser.level}: {getLevelName(superUser.level)}
          </span>
          <div className={cn(
            "ml-2 px-2 py-1 rounded-full text-xs font-medium",
            `bg-${superUser.role} bg-opacity-10 text-${superUser.role}`
          )}>
            {superUser.role.charAt(0).toUpperCase() + superUser.role.slice(1)} Path
          </div>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {getProgressToNextLevel(superUser.level, superUser.levelProgress)}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={cn("h-2 rounded-full", getProgressColor(superUser.role))} 
          style={{ width: `${superUser.levelProgress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Advocate</span>
        <span>Influencer</span>
        <span>Super Spreader</span>
        <span>Movement Builder</span>
      </div>
    </div>
  );
}
