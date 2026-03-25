import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Calendar,
  Users,
  FileText,
  Vote,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Eye,
  ArrowRight,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  stage: 'introduced' | 'committee' | 'floor_vote' | 'passed_chamber' | 'other_chamber' | 'governor' | 'enacted' | 'vetoed' | 'failed';
  importance: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  actors?: string[];
  voteCount?: {
    yes: number;
    no: number;
    abstain: number;
  };
}

interface RealTimeTimelineProps {
  timeline: {
    billId: number;
    billNumber: string;
    title: string;
    currentStage: string;
    status: string;
    progressPercentage: number;
    lastUpdated: Date;
    events: TimelineEvent[];
    predictions: {
      nextAction: string;
      probability: number;
      estimatedDate: string;
      reasoning: string;
    };
    keyMilestones: {
      milestone: string;
      completed: boolean;
      date?: string;
      estimatedDate?: string;
    }[];
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
  onEventClick?: (event: TimelineEvent) => void;
}

export function RealTimeTimeline({ 
  timeline, 
  autoRefresh = false, 
  refreshInterval = 300000,
  onEventClick 
}: RealTimeTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(autoRefresh);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [visibleEvents, setVisibleEvents] = useState(5);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'introduced': return <FileText className="h-4 w-4" />;
      case 'committee': return <Users className="h-4 w-4" />;
      case 'floor_vote': return <Vote className="h-4 w-4" />;
      case 'passed_chamber': return <CheckCircle2 className="h-4 w-4" />;
      case 'other_chamber': return <ArrowRight className="h-4 w-4" />;
      case 'governor': return <Target className="h-4 w-4" />;
      case 'enacted': return <CheckCircle2 className="h-4 w-4" />;
      case 'vetoed': return <AlertCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'introduced': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'committee': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'floor_vote': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'passed_chamber': return 'text-green-600 bg-green-50 border-green-200';
      case 'other_chamber': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'governor': return 'text-red-600 bg-red-50 border-red-200';
      case 'enacted': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'vetoed': return 'text-red-600 bg-red-50 border-red-200';
      case 'failed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    onEventClick?.(event);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-3">
                <span className="text-primary font-bold">{timeline.billNumber}</span>
                <Badge variant="outline" className="px-2 py-1">
                  {timeline.status}
                </Badge>
              </CardTitle>
              <h3 className="text-lg font-medium text-gray-900">{timeline.title}</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center space-x-1"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? 'Pause' : 'Live'}</span>
              </Button>
              
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Legislative Progress</span>
                <span className="text-muted-foreground">{timeline.progressPercentage}% Complete</span>
              </div>
              <Progress value={timeline.progressPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Introduced</span>
                <span>Committee</span>
                <span>Floor Vote</span>
                <span>Enacted</span>
              </div>
            </div>

            {/* Current Stage */}
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <div className={cn("p-2 rounded-full", getStageColor(timeline.currentStage))}>
                {getStageIcon(timeline.currentStage)}
              </div>
              <div>
                <h4 className="font-medium">Current Stage: {timeline.currentStage}</h4>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(timeline.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Next Prediction */}
            {timeline.predictions && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Predicted Next Action</h4>
                    <p className="text-sm text-yellow-700 mt-1">{timeline.predictions.nextAction}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className="text-yellow-600">
                        Probability: {timeline.predictions.probability}%
                      </span>
                      <span className="text-yellow-600">
                        Est. Date: {formatDate(timeline.predictions.estimatedDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Timeline Events</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {timeline.events.slice(0, visibleEvents).map((event, index) => (
              <div 
                key={event.id}
                className={cn(
                  "relative flex items-start space-x-4 p-4 rounded-lg border cursor-pointer transition-all",
                  selectedEvent?.id === event.id 
                    ? "bg-blue-50 border-blue-200 shadow-md" 
                    : "hover:bg-gray-50 border-gray-200"
                )}
                onClick={() => handleEventClick(event)}
              >
                {/* Timeline Line */}
                {index < timeline.events.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-12 bg-gray-200" />
                )}
                
                {/* Event Icon */}
                <div className={cn(
                  "relative z-10 flex-shrink-0 p-2 rounded-full border-2 bg-white",
                  getStageColor(event.stage)
                )}>
                  {getStageIcon(event.stage)}
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      
                      {event.actors && event.actors.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {event.actors.join(', ')}
                          </span>
                        </div>
                      )}

                      {event.voteCount && (
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <span className="text-green-600">Yes: {event.voteCount.yes}</span>
                          <span className="text-red-600">No: {event.voteCount.no}</span>
                          <span className="text-gray-600">Abstain: {event.voteCount.abstain}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Importance Indicator */}
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        getImportanceColor(event.importance)
                      )} />
                      
                      {/* Date */}
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatDate(event.date)}</div>
                        <Badge variant="secondary" className="text-xs">
                          {event.stage.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedEvent?.id === event.id && event.details && (
                    <div className="mt-3 p-3 bg-white border rounded-md">
                      <p className="text-sm text-gray-700">{event.details}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {visibleEvents < timeline.events.length && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setVisibleEvents(prev => prev + 5)}
                  className="text-sm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Show More Events ({timeline.events.length - visibleEvents} remaining)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Milestones */}
      {timeline.keyMilestones && timeline.keyMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Key Milestones</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {timeline.keyMilestones.map((milestone, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2",
                    milestone.completed 
                      ? "bg-green-500 border-green-500" 
                      : "bg-white border-gray-300"
                  )}>
                    {milestone.completed && (
                      <CheckCircle2 className="w-3 h-3 text-white m-0.5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={cn(
                      "font-medium",
                      milestone.completed ? "text-green-700" : "text-gray-700"
                    )}>
                      {milestone.milestone}
                    </h4>
                    
                    {milestone.date && (
                      <p className="text-sm text-green-600">
                        Completed: {formatDate(milestone.date)}
                      </p>
                    )}
                    
                    {!milestone.completed && milestone.estimatedDate && (
                      <p className="text-sm text-muted-foreground">
                        Expected: {formatDate(milestone.estimatedDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}