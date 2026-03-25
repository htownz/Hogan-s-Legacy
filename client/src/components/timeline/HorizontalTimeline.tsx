import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Define the timeline item types from the existing schema
interface TimelineStage {
  id: number;
  billId: string;
  stageType: string;
  stageTitle: string;
  stageDescription?: string;
  stageAction?: string;
  stageOrder: number;
  stageDate?: Date;
  completed?: boolean;
  active?: boolean;
  voteData?: {
    yeas?: number;
    nays?: number;
    present?: number;
    absent?: number;
    abstain?: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  itemType: 'stage';
}

interface TimelineEvent {
  id: string;
  billId: string;
  userId?: number;
  title: string;
  description?: string;
  eventDate: Date;
  eventType: string;
  isPublic: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  itemType: 'event';
}

type TimelineItem = TimelineStage | TimelineEvent;

interface HorizontalTimelineProps {
  billId: string;
  billNumber?: string;
  billTitle?: string;
  timelineItems: TimelineItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function HorizontalTimeline({
  billNumber = 'Unknown Bill',
  timelineItems = [],
  isLoading = false,
  onRefresh
}: HorizontalTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  
  // Sort timeline items by date/order
  const sortedItems = [...timelineItems].sort((a, b) => {
    if (a.itemType === 'stage' && b.itemType === 'stage') {
      return a.stageOrder - b.stageOrder;
    }
    
    const aDate = a.itemType === 'stage' ? a.stageDate : a.eventDate;
    const bDate = b.itemType === 'stage' ? b.stageDate : b.eventDate;
    
    if (aDate && bDate) {
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    }
    
    if (a.itemType === 'stage') return -1;
    if (b.itemType === 'stage') return 1;
    
    return 0;
  });
  
  // Find the current/active stage
  const currentStage = sortedItems.find(
    item => item.itemType === 'stage' && item.active
  ) as TimelineStage | undefined;
  
  // Find key events (important milestones)
  const keyEvents = sortedItems.filter(
    item => item.itemType === 'event' && item.eventType === 'milestone'
  ) as TimelineEvent[];
  
  // Check scroll capabilities
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    }
  };
  
  // Scroll handlers
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };
  
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };
  
  // Auto-scroll to current stage on initial load
  useEffect(() => {
    if (scrollContainerRef.current && currentStage) {
      const currentStageElement = document.getElementById(`stage-${currentStage.id}`);
      if (currentStageElement) {
        // Center the element in the scroll view
        const containerWidth = scrollContainerRef.current.clientWidth;
        const targetPosition = currentStageElement.offsetLeft - (containerWidth / 2) + (currentStageElement.offsetWidth / 2);
        
        scrollContainerRef.current.scrollTo({
          left: targetPosition,
          behavior: 'smooth'
        });
      }
    }
    
    // Initialize scroll check
    checkScroll();
    
    // Setup scroll event listener
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScroll);
      return () => scrollContainer.removeEventListener('scroll', checkScroll);
    }
  }, [currentStage, timelineItems]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Select first item by default
  useEffect(() => {
    if (timelineItems.length > 0 && !selectedItem) {
      setSelectedItem(currentStage || sortedItems[0]);
    }
  }, [timelineItems, currentStage, selectedItem]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-r-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (timelineItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
        <AlertCircle className="w-12 h-12 mb-4 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">No Timeline Data Available</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          There are no timeline stages or events recorded for this bill yet.
        </p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            Refresh Timeline
          </Button>
        )}
      </div>
    );
  }
  
  // Count completed stages for progress calculation
  const stageCount = sortedItems.filter(item => item.itemType === 'stage').length;
  const completedCount = sortedItems.filter(item => item.itemType === 'stage' && item.completed).length;
  const progressPercentage = stageCount > 0 ? (completedCount / stageCount) * 100 : 0;
  
  // Format date for display
  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return 'No date';
    return format(new Date(date), 'MMM d, yyyy');
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold">{billNumber} Timeline</h3>
          <div className="text-sm text-muted-foreground">
            Progress: {Math.round(progressPercentage)}% Complete
          </div>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <Clock className="w-4 h-4 mr-1" /> Refresh
          </Button>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Timeline Navigation */}
      <div className="relative">
        <div className="flex items-center space-x-2 absolute -top-2 left-0 z-10">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={scrollLeft} 
            disabled={!canScrollLeft}
            className="h-8 w-8 rounded-full bg-background shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 absolute -top-2 right-0 z-10">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={scrollRight} 
            disabled={!canScrollRight}
            className="h-8 w-8 rounded-full bg-background shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 pt-2 px-2 no-scrollbar mask-sides"
          onScroll={checkScroll}
        >
          <div className="flex min-w-max">
            {/* Timeline line */}
            <div className="absolute top-[35px] left-0 right-0 h-0.5 bg-muted z-0" />
            
            {/* Timeline items */}
            <div className="flex space-x-12 py-4 px-4 relative items-center">
              {sortedItems
                .filter(item => item.itemType === 'stage')
                .map((stage) => {
                  const isCompleted = (stage as TimelineStage).completed;
                  const isActive = (stage as TimelineStage).active;
                  const isSelected = selectedItem?.id === stage.id && selectedItem?.itemType === 'stage';
                  
                  // Find key events between this stage and the next
                  const nextStage = sortedItems.find(
                    (item, i) => item.itemType === 'stage' && i > sortedItems.indexOf(stage)
                  );
                  
                  const stageEvents = keyEvents.filter(event => {
                    const eventDate = new Date(event.eventDate);
                    const stageDate = stage.itemType === 'stage' && stage.stageDate 
                      ? new Date(stage.stageDate) 
                      : null;
                    const nextStageDate = nextStage && nextStage.itemType === 'stage' && nextStage.stageDate 
                      ? new Date(nextStage.stageDate) 
                      : null;
                      
                    if (!stageDate) return false;
                    
                    return nextStageDate 
                      ? eventDate >= stageDate && eventDate < nextStageDate
                      : eventDate >= stageDate;
                  });
                  
                  return (
                    <React.Fragment key={`stage-${stage.id}`}>
                      <div 
                        id={`stage-${stage.id}`}
                        className="flex flex-col items-center z-10 cursor-pointer"
                        onClick={() => setSelectedItem(stage)}
                      >
                        {/* Stage marker */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div 
                                className={`
                                  w-6 h-6 rounded-full flex items-center justify-center
                                  ${isActive ? 'bg-primary animate-pulse' : ''}
                                  ${isCompleted ? 'bg-primary' : 'bg-muted'}
                                  ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''}
                                  transition-all duration-200
                                `}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="w-3 h-3 text-primary-foreground" />
                                ) : isActive ? (
                                  <Clock className="w-3 h-3 text-primary-foreground" />
                                ) : null}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{(stage as TimelineStage).stageTitle}</p>
                              <p className="text-xs text-muted-foreground">
                                {(stage as TimelineStage).stageDate
                                  ? formatDateDisplay((stage as TimelineStage).stageDate)
                                  : 'Date pending'
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {/* Stage label */}
                        <div className={`
                          mt-2 text-xs font-medium max-w-[80px] text-center whitespace-normal 
                          ${isActive || isCompleted ? 'text-primary' : 'text-muted-foreground'}
                        `}>
                          {(stage as TimelineStage).stageTitle}
                        </div>
                        
                        {/* Stage date */}
                        {(stage as TimelineStage).stageDate && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {formatDateDisplay((stage as TimelineStage).stageDate)}
                          </div>
                        )}
                      </div>
                      
                      {/* Events between stages */}
                      {stageEvents.length > 0 && (
                        <div className="flex items-center absolute">
                          {stageEvents.map((event, eventIndex) => (
                            <div 
                              key={`event-${event.id}`}
                              className="flex flex-col items-center cursor-pointer mx-2"
                              style={{ 
                                position: 'absolute',
                                left: `${(eventIndex + 1) * 40}px`
                              }}
                              onClick={() => setSelectedItem(event)}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div 
                                      className={`
                                        w-4 h-4 rounded-full flex items-center justify-center bg-amber-500
                                        ${selectedItem?.id === event.id ? 'ring-2 ring-offset-1 ring-amber-500' : ''}
                                      `}
                                    >
                                      <AlertCircle className="w-2 h-2 text-white" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{event.title}</p>
                                    <p className="text-xs">{formatDateDisplay(event.eventDate)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected item details */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedItem.itemType === 'stage' 
                      ? (selectedItem as TimelineStage).stageTitle 
                      : (selectedItem as TimelineEvent).title
                    }
                  </h3>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <CalendarDays className="w-3 h-3 mr-1" />
                    {selectedItem.itemType === 'stage' 
                      ? formatDateDisplay((selectedItem as TimelineStage).stageDate)
                      : formatDateDisplay((selectedItem as TimelineEvent).eventDate)
                    }
                  </div>
                </div>
                
                <Badge variant={selectedItem.itemType === 'stage' ? 'outline' : 'secondary'}>
                  {selectedItem.itemType === 'stage' ? 'Stage' : 'Event'}
                </Badge>
              </div>
              
              <div className="mt-4 text-sm">
                {selectedItem.itemType === 'stage' 
                  ? (selectedItem as TimelineStage).stageDescription || 'No description available'
                  : (selectedItem as TimelineEvent).description || 'No description available'
                }
              </div>
              
              {/* Vote data if available */}
              {selectedItem.itemType === 'stage' && (selectedItem as TimelineStage).voteData && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Vote Results</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="flex flex-col items-center p-2 bg-green-100 rounded-md">
                      <span className="font-bold text-green-700">
                        {(selectedItem as TimelineStage).voteData?.yeas || 0}
                      </span>
                      <span className="text-green-700">Yeas</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-red-100 rounded-md">
                      <span className="font-bold text-red-700">
                        {(selectedItem as TimelineStage).voteData?.nays || 0}
                      </span>
                      <span className="text-red-700">Nays</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-blue-100 rounded-md">
                      <span className="font-bold text-blue-700">
                        {(selectedItem as TimelineStage).voteData?.present || 0}
                      </span>
                      <span className="text-blue-700">Present</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-100 rounded-md">
                      <span className="font-bold text-gray-700">
                        {(selectedItem as TimelineStage).voteData?.absent || 0}
                      </span>
                      <span className="text-gray-700">Absent</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-yellow-100 rounded-md">
                      <span className="font-bold text-yellow-700">
                        {(selectedItem as TimelineStage).voteData?.abstain || 0}
                      </span>
                      <span className="text-yellow-700">Abstain</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stage action button if available */}
              {selectedItem.itemType === 'stage' && (selectedItem as TimelineStage).stageAction && (
                <div className="mt-4">
                  <Button size="sm" variant="secondary" className="w-full">
                    {(selectedItem as TimelineStage).stageAction}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Add custom CSS for masking the sides of the scrollable timeline
const style = document.createElement('style');
style.textContent = `
  .mask-sides {
    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  }
  
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(style);