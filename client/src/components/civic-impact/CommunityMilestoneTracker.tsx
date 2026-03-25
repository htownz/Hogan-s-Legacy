import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Milestone, Share2, Trophy } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

// Act Up Color Palette
const COLORS = {
  PRIMARY: '#1D2D44', // Dark blue
  ACCENT: '#FF6400',  // Orange
  BACKGROUND: '#FAFAFA', // Off-white
  SUPPORT: '#596475', // Slate gray
  OPTIONAL: '#5DB39E'  // Teal
};

interface Milestone {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
  category: 'engagement' | 'impact' | 'advocacy' | 'education';
  reward?: string;
  contributionNeeded?: number;
}

interface CommunityMilestoneTrackerProps {
  milestones: Milestone[];
  className?: string;
  onShareMilestone?: (milestone: Milestone) => void;
  onContribute?: (milestone: Milestone) => void;
}

export default function CommunityMilestoneTracker({
  milestones,
  className = '',
  onShareMilestone,
  onContribute
}: CommunityMilestoneTrackerProps) {
  const [expandedMilestone, setExpandedMilestone] = React.useState<string | null>(null);
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'engagement': return COLORS.ACCENT;
      case 'impact': return COLORS.OPTIONAL;
      case 'advocacy': return '#8884d8';
      case 'education': return '#ffc658';
      default: return COLORS.PRIMARY;
    }
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Sort milestones: completed last, then by progress percentage (descending)
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    const aProgress = a.current / a.target;
    const bProgress = b.current / b.target;
    return bProgress - aProgress;
  });

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5" style={{ color: COLORS.ACCENT }} />
          Community Milestone Tracker
        </CardTitle>
        <CardDescription>
          Track progress on collective civic engagement goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-h-[450px] overflow-y-auto pr-1">
          {sortedMilestones.map((milestone) => {
            const progress = Math.min(100, Math.round((milestone.current / milestone.target) * 100));
            const isExpanded = expandedMilestone === milestone.id;
            
            return (
              <div 
                key={milestone.id} 
                className={`border rounded-lg transition-all duration-300 ${
                  milestone.completed ? 'bg-gray-50' : ''
                } ${
                  isExpanded ? 'shadow-md' : ''
                }`}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: getCategoryColor(milestone.category) }}
                      ></div>
                      <h3 className={`font-medium ${milestone.completed ? 'line-through text-gray-500' : ''}`}>
                        {milestone.title}
                      </h3>
                    </div>
                    {milestone.completed && (
                      <div className="flex items-center text-sm text-green-600">
                        <Trophy className="h-4 w-4 mr-1" />
                        <span>Completed!</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">
                        {formatNumber(milestone.current)} of {formatNumber(milestone.target)} {milestone.unit}
                      </span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2" 
                      style={{ 
                        background: milestone.completed ? '#e5e7eb' : undefined,
                        '--progress-color': getCategoryColor(milestone.category)
                      } as any}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {milestone.description}
                  </p>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-dashed">
                      {milestone.reward && (
                        <div className="flex items-start text-sm">
                          <Trophy className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
                          <div>
                            <h4 className="font-medium">Community Reward</h4>
                            <p className="text-gray-600">{milestone.reward}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {!milestone.completed && milestone.contributionNeeded && onContribute && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              onContribute(milestone);
                            }}
                            style={{ backgroundColor: getCategoryColor(milestone.category) }}
                          >
                            <Milestone className="h-4 w-4 mr-1" />
                            Contribute {milestone.contributionNeeded} {milestone.unit}
                          </Button>
                        )}
                        
                        {onShareMilestone && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareMilestone(milestone);
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.ACCENT }}></div>
              <span className="text-xs">Engagement</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.OPTIONAL }}></div>
              <span className="text-xs">Impact</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#8884d8' }}></div>
              <span className="text-xs">Advocacy</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#ffc658' }}></div>
              <span className="text-xs">Education</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}