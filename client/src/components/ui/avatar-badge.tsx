import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getRoleColor, getLevelName } from "@/lib/utils";

interface AvatarBadgeProps {
  src?: string;
  name: string;
  role: string;
  level: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarBadge({
  src,
  name,
  role,
  level,
  className,
  size = "md"
}: AvatarBadgeProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  
  const roleColor = getRoleColor(role);
  
  const sizeClasses = {
    sm: {
      avatar: "h-8 w-8",
      badge: "text-xs px-1.5 py-0.5",
      level: "text-xs",
    },
    md: {
      avatar: "h-9 w-9",
      badge: "text-xs px-2 py-0.5",
      level: "text-xs",
    },
    lg: {
      avatar: "h-10 w-10",
      badge: "text-xs px-2.5 py-1",
      level: "text-sm",
    },
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Avatar className={sizeClasses[size].avatar}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="ml-3">
        <p className={cn("font-medium text-gray-700", size === "lg" ? "text-base" : "text-sm")}>{name}</p>
        <div className="flex items-center">
          <span className={cn(
            "inline-flex items-center rounded text-xs font-medium text-white",
            roleColor === "text-catalyst" ? "bg-catalyst" : 
            roleColor === "text-amplifier" ? "bg-amplifier" : 
            roleColor === "text-convincer" ? "bg-convincer" : "bg-primary",
            sizeClasses[size].badge
          )}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
          <span className={cn("ml-1 text-gray-500", sizeClasses[size].level)}>Level {level} ({getLevelName(level)})</span>
        </div>
      </div>
    </div>
  );
}
