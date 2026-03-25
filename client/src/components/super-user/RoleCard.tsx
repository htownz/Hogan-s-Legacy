// @ts-nocheck
import { cn } from "@/lib/utils";
import { SuperUserRoleType } from "@/lib/types";
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS, ROLE_COLORS, ROLE_ICONS } from "@/lib/constants";
import { RoleBadge } from "@/components/ui/role-badge";
import { Button } from "@/components/ui/button";

interface RoleCardProps {
  role: SuperUserRoleType;
  selected?: boolean;
  skillMatch?: number;
  onSelect?: (role: SuperUserRoleType) => void;
  onViewPath?: (role: SuperUserRoleType) => void;
}

export default function RoleCard({
  role,
  selected = false,
  skillMatch = 50,
  onSelect,
  onViewPath
}: RoleCardProps) {
  const roleColor = ROLE_COLORS[role].primary;
  const roleBg = ROLE_COLORS[role].bg;
  
  const handleViewPath = () => {
    if (onViewPath) {
      onViewPath(role);
    }
  };

  return (
    <div 
      className={cn(
        "border border-gray-200 rounded-lg p-4 relative cursor-pointer bg-white hover:bg-gray-50 transition-all",
        selected ? `border-${roleColor} border-opacity-50` : ""
      )}
      onClick={() => onSelect?.(role)}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <span 
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              `bg-${roleColor} bg-opacity-10`,
              `text-${roleColor}`
            )}
          >
            Selected
          </span>
        </div>
      )}
      
      <div className="flex items-center mb-3">
        <RoleBadge role={role} selected={selected} />
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900">
            {ROLE_DISPLAY_NAMES[role]}
          </h3>
          <p className="text-sm text-gray-500">
            {ROLE_DESCRIPTIONS[role]}
          </p>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {role === "catalyst" && "Catalysts gather, verify, and share critical information that fuels effective civic action."}
        {role === "amplifier" && "Amplifiers spread information through their networks, multiplying impact exponentially."}
        {role === "convincer" && "Convincers inspire belief and action by making civic engagement personal and urgent."}
      </p>
      
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500">
          Skill match: {skillMatch}%
        </span>
        <Button 
          variant="ghost" 
          className={`text-${roleColor} text-sm font-medium hover:text-${roleColor}-dark`}
          onClick={handleViewPath}
        >
          View Path
        </Button>
      </div>
    </div>
  );
}
