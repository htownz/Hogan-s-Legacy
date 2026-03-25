import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  badge?: {
    text: string;
    color: string;
  };
  className?: string;
}

export function MetricCard({ title, value, subtitle, badge, className }: MetricCardProps) {
  return (
    <div className={cn("bg-gray-50 p-4 rounded-lg border border-gray-200", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {badge && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            `bg-${badge.color}-100 text-${badge.color}-800`
          )}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-dark mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
