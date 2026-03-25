import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SentimentStatsProps {
  title: string;
  value: number | string;
  change: number;
  icon: LucideIcon;
  isPercentage?: boolean;
  isCount?: boolean;
  trendDirection?: string;
}

export const SentimentStats: React.FC<SentimentStatsProps> = ({
  title,
  value,
  change,
  icon: Icon,
  isPercentage = false,
  isCount = false,
  trendDirection
}) => {
  // Determine the color based on the change value and type of metric
  const getChangeColor = () => {
    // For sentiment scores, positive change is good (green)
    if (!isPercentage && !isCount) {
      return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
    }
    
    // For percentage/count metrics, positive change is usually good (green)
    return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
  };
  
  // Format the change value
  const formattedChange = isPercentage 
    ? `${change > 0 ? '+' : ''}${change}%` 
    : `${change > 0 ? '+' : ''}${change}`;
  
  // Determine sentiment color for the value
  const getValueColor = () => {
    if (isPercentage || isCount) return '';
    
    // For sentiment scores
    if (typeof value === 'number') {
      if (value > 25) return 'text-green-600';
      if (value > 0) return 'text-green-500';
      if (value < -25) return 'text-red-600';
      if (value < 0) return 'text-red-500';
      return 'text-gray-500';
    }
    
    return '';
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${getValueColor()}`}>
              {value}
            </p>
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${getChangeColor()}`}>
                {formattedChange}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                since start of period
              </span>
            </div>
          </div>
          <div className="bg-muted rounded-full p-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};