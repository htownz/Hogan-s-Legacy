import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface CivicProgressCardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  color: string;
}

/**
 * A card component that displays a civic engagement metric with its value, change, and an icon
 */
export default function CivicProgressCard({
  title,
  value,
  change = 0,
  icon: Icon,
  color
}: CivicProgressCardProps) {
  
  // Determine change indicator
  const ChangeIcon = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;
  const changeText = change !== 0 ? `${Math.abs(change)}` : "0";
  const changeClass = change > 0 
    ? "text-green-600 bg-green-100" 
    : change < 0 
      ? "text-red-600 bg-red-100" 
      : "text-gray-600 bg-gray-100";
  
  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${color}`} />
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          
          <div className={`flex items-center px-1.5 py-0.5 rounded-full text-xs ${changeClass}`}>
            <ChangeIcon className="h-3 w-3 mr-1" />
            <span>{changeText}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}