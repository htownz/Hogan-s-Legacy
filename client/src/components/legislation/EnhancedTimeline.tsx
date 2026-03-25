import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Clock,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useMobileDetection } from '@/hooks/use-media-query';

// Define timeline item types (imported from BillTimeline component)
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

// Stage icon definition for visual consistency
interface StageIconProps {
  stageType: string;
  completed?: boolean;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StageIcon = ({ stageType, completed, active, size = 'md' }: StageIconProps) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-6 h-6';
      case 'lg': return 'w-10 h-10';
      default: return 'w-8 h-8';
    }
  };
  
  const getIconColor = () => {
    if (active) return 'text-blue-500';
    if (completed) return 'text-green-500';
    return 'text-gray-400';
  };
  
  const getBackgroundColor = () => {
    if (active) return 'bg-blue-100';
    if (completed) return 'bg-green-100';
    return 'bg-gray-100';
  };
  
  const getIcon = (): LucideIcon => {
    switch (stageType) {
      case 'introduced':
        return FileText;
      case 'committee_assigned':
      case 'committee_hearing':
      case 'committee_vote':
        return Users;
      case 'governor_action':
        return AlertCircle;
      case 'effective':
        return CheckCircle;
      default:
        return Calendar;
    }
  };
  
  const Icon = getIcon();
  
  return (
    <div className={`${getSizeClass()} rounded-full ${getBackgroundColor()} flex items-center justify-center`}>
      <Icon className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} ${getIconColor()}`} />
    </div>
  );
};

interface EnhancedTimelineProps {
  billId?: string;
  billNumber?: string;
  billTitle?: string;
  timelineItems?: TimelineItem[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

export function EnhancedTimeline({
  billId,
  timelineItems = [],
  loading = false,
  error = null,
  onRefresh
}: EnhancedTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeItemId, setActiveItemId] = useState<string | number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isMobile = useMobileDetection();
  
  // Sort timeline items by date/order
  const sortedItems = [...timelineItems].sort((a, b) => {
    if (a.itemType === 'stage' && b.itemType === 'stage') {
      return a.stageOrder - b.stageOrder;
    }
    const dateA = a.itemType === 'stage' ? a.stageDate : a.eventDate;
    const dateB = b.itemType === 'stage' ? b.stageDate : b.eventDate;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
  
  // Find active stage (for highlighting current position)
  const activeStage = sortedItems.find(
    item => item.itemType === 'stage' && item.active
  );
  
  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No date';
    return format(new Date(date), 'MMM d, yyyy');
  };
  
  // Handle scroll button clicks
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  
  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  
  // Check if scrolling is possible
  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    }
  };
  
  // Monitor scroll position
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      checkScrollability();
      scrollContainer.addEventListener('scroll', checkScrollability);
      
      // Scroll to active item if exists
      if (activeStage) {
        const activeItem = document.getElementById(`timeline-item-${activeStage.id}`);
        if (activeItem) {
          setTimeout(() => {
            activeItem.scrollIntoView({ 
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
          }, 500);
        }
      }
      
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollability);
      };
    }
  }, [timelineItems, activeStage]);
  
  // Recalculate scrollability when window is resized
  useEffect(() => {
    window.addEventListener('resize', checkScrollability);
    return () => {
      window.removeEventListener('resize', checkScrollability);
    };
  }, []);
  
  // Set active stage ID on first render
  useEffect(() => {
    if (activeStage) {
      setActiveItemId(activeStage.id);
    } else if (sortedItems.length > 0) {
      // If no active stage, select the most recent completed stage
      const completedStages = sortedItems.filter(
        item => item.itemType === 'stage' && item.completed
      );
      
      if (completedStages.length > 0) {
        setActiveItemId(completedStages[completedStages.length - 1].id);
      } else {
        // If no completed stages, select the first item
        setActiveItemId(sortedItems[0].itemType === 'stage' ? sortedItems[0].id : sortedItems[0].id);
      }
    }
  }, [sortedItems, activeStage]);
  
  // Render timeline items in horizontal scrollable view
  const renderHorizontalTimeline = () => {
    if (sortedItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <p className="text-gray-500 mb-4">No timeline information available for this bill.</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              Refresh Timeline
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="relative">
        {/* Scroll buttons (desktop only) */}
        {!isMobile && (
          <>
            {canScrollLeft && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md border-gray-200"
                onClick={handleScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            {canScrollRight && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md border-gray-200"
                onClick={handleScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        {/* Mobile help text (mobile only) */}
        {isMobile && (
          <div className="text-xs text-center text-gray-500 mb-2">
            <p>Swipe left or right to navigate the timeline</p>
          </div>
        )}
        
        {/* Timeline track */}
        <div className="mb-4 relative">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto pb-6 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Connecting line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" 
              style={{ width: `calc(100% - ${isMobile ? 20 : 80}px)`, margin: `0 ${isMobile ? 10 : 40}px` }} />
              
            {/* Timeline items */}
            <div className="flex items-center space-x-16 px-4 md:px-8 py-2">
              {sortedItems.map((item) => (
                <div 
                  key={`${item.itemType}-${item.id}`}
                  id={`timeline-item-${item.id}`}
                  className={`flex flex-col items-center z-10 transition-all duration-200 ${
                    item.id === activeItemId ? 'scale-110' : ''
                  }`}
                  onClick={() => setActiveItemId(item.id)}
                >
                  {/* Icon */}
                  <div className="mb-1">
                    {item.itemType === 'stage' ? (
                      <StageIcon 
                        stageType={item.stageType} 
                        completed={item.completed} 
                        active={item.active}
                        size={isMobile ? 'sm' : 'md'}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className="text-center w-24">
                    <p className={`text-xs font-medium truncate mb-1 ${
                      item.id === activeItemId ? 'text-blue-600' : ''
                    }`}>
                      {item.itemType === 'stage' ? item.stageTitle : item.title}
                    </p>
                    
                    {/* Date */}
                    <p className="text-xs text-gray-500">
                      {formatDate(item.itemType === 'stage' ? item.stageDate : item.eventDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render detailed view of selected timeline item
  const renderDetailView = () => {
    if (!activeItemId) return null;
    
    const selectedItem = sortedItems.find(item => item.id === activeItemId);
    if (!selectedItem) return null;
    
    return (
      <Card className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-1">
            {selectedItem.itemType === 'stage' ? (
              <StageIcon 
                stageType={selectedItem.stageType} 
                completed={selectedItem.completed} 
                active={selectedItem.active}
                size="lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
            )}
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">
                {selectedItem.itemType === 'stage' ? selectedItem.stageTitle : selectedItem.title}
              </h3>
              
              {selectedItem.itemType === 'stage' && (
                <div className="flex space-x-2">
                  {selectedItem.completed && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Completed
                    </Badge>
                  )}
                  {selectedItem.active && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Active
                    </Badge>
                  )}
                </div>
              )}
              
              {selectedItem.itemType === 'event' && !selectedItem.isPublic && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Private
                </Badge>
              )}
            </div>
            
            <p className="text-gray-700 mb-3">
              {selectedItem.itemType === 'stage' 
                ? selectedItem.stageDescription 
                : selectedItem.description}
            </p>
            
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1.5" />
              {formatDate(selectedItem.itemType === 'stage' 
                ? selectedItem.stageDate 
                : selectedItem.eventDate
              )}
            </div>
            
            {/* Voting data (if available) */}
            {selectedItem.itemType === 'stage' && selectedItem.voteData && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {selectedItem.voteData.yeas !== undefined && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Yeas: {selectedItem.voteData.yeas}
                  </Badge>
                )}
                {selectedItem.voteData.nays !== undefined && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Nays: {selectedItem.voteData.nays}
                  </Badge>
                )}
                {selectedItem.voteData.present !== undefined && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Present: {selectedItem.voteData.present}
                  </Badge>
                )}
                {selectedItem.voteData.absent !== undefined && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    Absent: {selectedItem.voteData.absent}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading timeline...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-500 mb-4">{error.message}</p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm">
            Try Again
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {renderHorizontalTimeline()}
      </div>
      
      {/* Detail View */}
      <div className="bg-white rounded-lg overflow-hidden">
        {renderDetailView()}
      </div>
    </div>
  );
}

// End of component