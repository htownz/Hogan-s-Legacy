// @ts-nocheck
import { useEffect, useRef } from "react";
import { cn, getRoleColor } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  role?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  role = "amplifier",
  className,
  children
}: ProgressRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  
  // Calculate properties
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const roleColor = role === 'catalyst' ? '#3182CE' : role === 'amplifier' ? '#805AD5' : '#DD6B20';

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = strokeDashoffset.toString();
    }
  }, [progress, strokeDashoffset]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg className="progress-ring" width={size} height={size}>
        <circle
          className="progress-ring__circle"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          ref={circleRef}
          className="progress-ring__circle"
          stroke={roleColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
      
      <style jsx>{`
        .progress-ring {
          transform: rotate(-90deg);
          transform-origin: center;
        }
        .progress-ring__circle {
          transition: stroke-dashoffset 0.5s;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
