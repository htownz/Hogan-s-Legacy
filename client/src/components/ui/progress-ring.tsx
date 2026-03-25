// @ts-nocheck
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SuperUserRoleType } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/constants";

interface ProgressRingProps {
  progress: number;
  role: SuperUserRoleType;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  progress,
  role,
  size = 120,
  strokeWidth = 8,
  children,
  className
}: ProgressRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  const roleColor = ROLE_COLORS[role].primary;
  const roleBg = "bg-gray-200";
  
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDasharray = `${circumference} ${circumference}`;
      circleRef.current.style.strokeDashoffset = `${offset}`;
    }
  }, [progress, circumference, offset]);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
        />
        <circle
          ref={circleRef}
          className={`text-${roleColor} transition-all duration-500 ease-in-out`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeLinecap="round"
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: offset
          }}
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
