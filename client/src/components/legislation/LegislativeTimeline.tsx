// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls, Variants } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronLeft, ChevronRight, Clock, Star, AlertCircle, CheckCircle, Flag, 
  Calendar, Gavel, BarChart4, Users, Landmark, ScrollText, Info, Play, Pause
} from 'lucide-react';

// Act Up Color Palette
const COLORS = {
  PRIMARY: '#1D2D44', // Dark blue
  ACCENT: '#FF6400',  // Orange
  BACKGROUND: '#FAFAFA', // Off-white
  SUPPORT: '#596475', // Slate gray
  OPTIONAL: '#5DB39E',  // Teal
  HOUSE: '#3B82F6',   // Blue
  SENATE: '#8B5CF6',  // Purple
  GOVERNOR: '#10B981', // Green
  SUCCESS: '#22C55E',  // Success green
  WARNING: '#F59E0B',  // Warning yellow
  DANGER: '#EF4444',   // Danger red
};

// Animation variants for timeline milestones
const milestoneVariants: Variants = {
  inactive: {
    scale: 1,
    opacity: 0.7,
    boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.3 }
  },
  active: {
    scale: 1.1,
    opacity: 1,
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: 0.5,
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

// Timeline connection line animation
const lineVariants: Variants = {
  hidden: { width: "0%" },
  visible: (custom) => ({
    width: `${custom}%`,
    transition: { 
      duration: 1,
      ease: "easeOut"
    }
  })
};

// Card animation variants
const cardVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    scale: 0.95,
    transition: { 
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// Card children animation variants
const cardChildrenVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

// Vote chart animation
const voteChartVariants: Variants = {
  initial: { width: 0 },
  animate: (custom) => ({
    width: `${custom}%`,
    transition: { duration: 0.8, delay: 0.3, ease: "easeOut" }
  })
};

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  eventType: 'introduction' | 'committee' | 'floor_vote' | 'amendment' | 'passage' | 'signature' | 'effective';
  chamber?: 'house' | 'senate' | 'governor';
  committeeInfo?: string;
  voteInfo?: {
    yes: number;
    no: number;
    present: number;
    absent: number;
  };
  mediaLink?: string;
  mediaType?: 'image' | 'video' | 'document';
  impactSummary?: string;
}

export interface LegislativeTimelineProps {
  billId: string;
  billNumber: string;
  billTitle: string;
  events: TimelineEvent[];
  className?: string;
}

export default function LegislativeTimeline({
  billId,
  billNumber,
  billTitle,
  events,
  className = ''
}: LegislativeTimelineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playTimer, setPlayTimer] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const progressControls = useAnimationControls();
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const currentEvent = sortedEvents[currentIndex];
  
  const handleNext = () => {
    if (currentIndex < sortedEvents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop back to the beginning when at the end
      setCurrentIndex(0);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Loop to the end when at the beginning
      setCurrentIndex(sortedEvents.length - 1);
    }
  };

  const handleAutoPlay = () => {
    if (isAutoPlaying) {
      // Stop autoplay
      if (playTimer) {
        window.clearInterval(playTimer);
        setPlayTimer(null);
      }
      setIsAutoPlaying(false);
    } else {
      // Start autoplay - advance every 5 seconds
      const timer = window.setInterval(() => {
        handleNext();
      }, 5000);
      setPlayTimer(timer as unknown as number);
      setIsAutoPlaying(true);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playTimer) {
        window.clearInterval(playTimer);
      }
    };
  }, [playTimer]);

  // Update progress and animate timeline when current index changes
  useEffect(() => {
    const progressPercent = sortedEvents.length > 1 
      ? (currentIndex / (sortedEvents.length - 1)) * 100 
      : 100;
    
    setAnimationProgress(progressPercent);
    
    // Smoothly animate the progress
    progressControls.start({
      width: `${progressPercent}%`,
      transition: { duration: 0.5, ease: "easeOut" }
    });
    
    // Scroll to the current milestone in the timeline
    if (timelineRef.current) {
      const timelineNodes = timelineRef.current.querySelectorAll('.timeline-node');
      if (timelineNodes && timelineNodes[currentIndex]) {
        const node = timelineNodes[currentIndex] as HTMLElement;
        const timelineWidth = timelineRef.current.offsetWidth;
        const nodeLeft = node.offsetLeft;
        const nodeWidth = node.offsetWidth;
        
        // Calculate the center position for the current node
        const scrollPosition = nodeLeft - (timelineWidth / 2) + (nodeWidth / 2);
        
        timelineRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, sortedEvents.length, progressControls]);

  // Get event icon based on event type
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.eventType) {
      case 'introduction':
        return <Flag size={22} style={{ color: COLORS.PRIMARY }} />;
      case 'committee':
        return <Users size={22} style={{ color: COLORS.OPTIONAL }} />;
      case 'floor_vote':
        return <Gavel size={22} style={{ color: COLORS.SENATE }} />;
      case 'passage':
        return <CheckCircle size={22} style={{ color: COLORS.SUCCESS }} />;
      case 'amendment':
        return <ScrollText size={22} style={{ color: COLORS.SUPPORT }} />;
      case 'signature':
        return <Landmark size={22} style={{ color: COLORS.GOVERNOR }} />;
      case 'effective':
        return <Calendar size={22} style={{ color: COLORS.PRIMARY }} />;
      default:
        return <Clock size={22} style={{ color: COLORS.SUPPORT }} />;
    }
  };

  // Get event icon for the timeline nodes
  const getTimelineNodeIcon = (event: TimelineEvent) => {
    switch (event.eventType) {
      case 'introduction':
        return <Flag size={14} />;
      case 'committee':
        return <Users size={14} />;
      case 'floor_vote':
        return <Gavel size={14} />;
      case 'passage':
        return <CheckCircle size={14} />;
      case 'amendment':
        return <ScrollText size={14} />;
      case 'signature':
        return <Landmark size={14} />;
      case 'effective':
        return <Calendar size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  // Get chamber color
  const getChamberColor = (chamber?: string) => {
    if (!chamber) return COLORS.SUPPORT;
    
    switch (chamber.toLowerCase()) {
      case 'house':
        return COLORS.HOUSE;
      case 'senate':
        return COLORS.SENATE;
      case 'governor':
        return COLORS.GOVERNOR;
      default:
        return COLORS.SUPPORT;
    }
  };

  // Get event type background color
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'introduction':
        return COLORS.PRIMARY;
      case 'committee':
        return COLORS.OPTIONAL;
      case 'floor_vote':
      case 'passage':
        return COLORS.SUCCESS;
      case 'amendment':
        return COLORS.WARNING;
      case 'signature':
        return COLORS.GOVERNOR;
      case 'effective':
        return COLORS.ACCENT;
      default:
        return COLORS.SUPPORT;
    }
  };

  // Get event title based on event type
  const getEventTitle = (event: TimelineEvent) => {
    // Use provided title if available
    if (event.title) return event.title;

    switch (event.eventType) {
      case 'introduction':
        return `Introduced in ${event.chamber === 'house' ? 'House' : 'Senate'}`;
      case 'committee':
        return `Committee Action: ${event.committeeInfo || 'Unknown Committee'}`;
      case 'floor_vote':
        return `Floor Vote in ${event.chamber === 'house' ? 'House' : 'Senate'}`;
      case 'amendment':
        return 'Amendment Added';
      case 'passage':
        return `Passed by ${event.chamber === 'house' ? 'House' : event.chamber === 'senate' ? 'Senate' : 'Legislature'}`;
      case 'signature':
        return 'Signed by Governor';
      case 'effective':
        return 'Law Takes Effect';
      default:
        return 'Legislative Event';
    }
  };

  // Get short form of the event title for the timeline nodes
  const getShortEventTitle = (event: TimelineEvent) => {
    switch (event.eventType) {
      case 'introduction':
        return 'Introduced';
      case 'committee':
        return 'Committee';
      case 'floor_vote':
        return 'Floor Vote';
      case 'amendment':
        return 'Amendment';
      case 'passage':
        return 'Passed';
      case 'signature':
        return 'Signed';
      case 'effective':
        return 'Effective';
      default:
        return 'Event';
    }
  };

  // Calculate total votes for vote percentage
  const calculateVoteTotal = (voteInfo?: TimelineEvent['voteInfo']) => {
    if (!voteInfo) return 0;
    return voteInfo.yes + voteInfo.no + voteInfo.present + voteInfo.absent;
  };

  // Calculate vote percentage
  const calculateVotePercentage = (count: number, voteInfo?: TimelineEvent['voteInfo']) => {
    const total = calculateVoteTotal(voteInfo);
    if (total === 0) return 0;
    return (count / total) * 100;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-primary">{billNumber}: Journey Through the Legislature</h3>
          <p className="text-sm text-muted-foreground">{billTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAutoPlay}
            className="gap-1"
          >
            {isAutoPlaying ? (
              <>
                <Pause size={16} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Auto Play</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced timeline visualization with progress bar and milestones */}
      <div className="mb-6 relative">
        <div className="flex items-center gap-2 mb-1">
          <Progress value={animationProgress} className="h-2" />
          <span className="text-xs text-muted-foreground font-medium">
            {Math.round(animationProgress)}%
          </span>
        </div>
        
        <div 
          ref={timelineRef}
          className="flex gap-1 md:gap-2 overflow-x-auto py-4 hide-scrollbar" 
          style={{ scrollbarWidth: 'none' }}
        >
          {sortedEvents.map((event, index) => {
            const isActive = index === currentIndex;
            const isPast = index < currentIndex;
            const isFuture = index > currentIndex;
            const eventDate = new Date(event.date);
            const chamberColor = getChamberColor(event.chamber);
            
            return (
              <TooltipProvider key={event.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      variants={milestoneVariants}
                      initial="inactive"
                      animate={isActive ? "active" : "inactive"}
                      className={`timeline-node flex-shrink-0 flex flex-col items-center cursor-pointer
                        ${isActive ? 'z-10' : 'z-0'}`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <div className="text-xs mb-1 font-medium whitespace-nowrap">
                        {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <motion.div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${isActive ? 'ring-2 ring-offset-2' : isPast ? 'opacity-80' : 'opacity-60'}
                        `}
                        style={{ 
                          backgroundColor: isActive ? chamberColor : isPast ? chamberColor : '#e5e7eb',
                          color: isActive || isPast ? 'white' : '#64748b',
                          ringColor: chamberColor
                        }}
                      >
                        {getTimelineNodeIcon(event)}
                      </motion.div>
                      <div className="text-xs mt-1 font-medium text-center whitespace-nowrap" style={{
                        color: isActive ? chamberColor : isPast ? '#374151' : '#9ca3af'
                      }}>
                        {getShortEventTitle(event)}
                      </div>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="text-sm font-medium">{getEventTitle(event)}</div>
                    <div className="text-xs">
                      {eventDate.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        
        {/* Connecting line between events */}
        <motion.div 
          className="absolute top-[4.5rem] left-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-full" 
          style={{ zIndex: -1 }}
          variants={lineVariants}
          initial="hidden"
          animate="visible"
          custom={animationProgress}
        />
      </div>
      
      {/* Enhanced event card with animations */}
      <div className="relative min-h-[370px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEvent.id}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
          >
            <Card className="h-full border shadow-lg overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-2 rounded-full" 
                    style={{ backgroundColor: getChamberColor(currentEvent.chamber) + '20' }}
                  >
                    {getEventIcon(currentEvent)}
                  </div>
                  <div className="flex-1">
                    <motion.div variants={cardChildrenVariants}>
                      <CardTitle className="text-lg">{getEventTitle(currentEvent)}</CardTitle>
                      <div className="flex gap-2 items-center mt-1">
                        <Badge variant="outline" className="font-normal" style={{ 
                          backgroundColor: getEventTypeColor(currentEvent.eventType) + '10',
                          borderColor: getEventTypeColor(currentEvent.eventType),
                          color: getEventTypeColor(currentEvent.eventType)
                        }}>
                          {currentEvent.eventType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="font-normal" style={{ 
                          backgroundColor: getChamberColor(currentEvent.chamber) + '10', 
                          borderColor: getChamberColor(currentEvent.chamber),
                          color: getChamberColor(currentEvent.chamber)
                        }}>
                          {currentEvent.chamber?.charAt(0).toUpperCase() + currentEvent.chamber?.slice(1) || 'Legislature'}
                        </Badge>
                        <CardDescription className="mt-0 ml-auto">
                          {new Date(currentEvent.date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                <motion.div variants={cardChildrenVariants} className="space-y-4">
                  <p className="text-sm leading-relaxed">{currentEvent.description}</p>
                  
                  {/* Enhanced vote visualization with animation */}
                  {currentEvent.voteInfo && (
                    <motion.div 
                      variants={cardChildrenVariants}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-100"
                    >
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BarChart4 size={16} className="text-primary" />
                        Vote Result
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Yes vote bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">Yes</span>
                            <span>{currentEvent.voteInfo.yes} votes</span>
                          </div>
                          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full bg-green-500"
                              variants={voteChartVariants}
                              initial="initial"
                              animate="animate"
                              custom={calculateVotePercentage(currentEvent.voteInfo.yes, currentEvent.voteInfo)}
                            />
                          </div>
                        </div>
                        
                        {/* No vote bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">No</span>
                            <span>{currentEvent.voteInfo.no} votes</span>
                          </div>
                          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full bg-red-500"
                              variants={voteChartVariants}
                              initial="initial"
                              animate="animate"
                              custom={calculateVotePercentage(currentEvent.voteInfo.no, currentEvent.voteInfo)}
                            />
                          </div>
                        </div>
                        
                        {/* Present vote bar (if applicable) */}
                        {currentEvent.voteInfo.present > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">Present</span>
                              <span>{currentEvent.voteInfo.present} votes</span>
                            </div>
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full rounded-full bg-yellow-500"
                                variants={voteChartVariants}
                                initial="initial"
                                animate="animate"
                                custom={calculateVotePercentage(currentEvent.voteInfo.present, currentEvent.voteInfo)}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Absent vote bar (if applicable) */}
                        {currentEvent.voteInfo.absent > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">Absent</span>
                              <span>{currentEvent.voteInfo.absent} votes</span>
                            </div>
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full rounded-full bg-gray-400"
                                variants={voteChartVariants}
                                initial="initial"
                                animate="animate"
                                custom={calculateVotePercentage(currentEvent.voteInfo.absent, currentEvent.voteInfo)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Enhanced impact summary with animation */}
                  {currentEvent.impactSummary && (
                    <motion.div 
                      variants={cardChildrenVariants}
                      className="border-l-4 pl-3 py-3 pr-3 my-3 bg-primary-50 rounded-r-lg"
                      style={{ borderColor: COLORS.PRIMARY }}
                    >
                      <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                        <Info size={16} className="text-primary" />
                        Potential Impact
                      </h4>
                      <p className="text-sm text-muted-foreground">{currentEvent.impactSummary}</p>
                    </motion.div>
                  )}
                  
                  {/* Enhanced media content with animation */}
                  {currentEvent.mediaLink && (
                    <motion.div 
                      variants={cardChildrenVariants}
                      className="mt-4"
                    >
                      {currentEvent.mediaType === 'image' ? (
                        <div className="overflow-hidden rounded-lg shadow-sm">
                          <motion.img 
                            src={currentEvent.mediaLink} 
                            alt={`Media for ${getEventTitle(currentEvent)}`} 
                            className="w-full h-auto max-h-56 object-cover transition-transform hover:scale-105"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                      ) : currentEvent.mediaType === 'video' ? (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border shadow-sm hover:shadow transition-shadow">
                          <span className="text-sm flex items-center gap-2">
                            <Play size={16} />
                            Video content available
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-sm border hover:bg-gray-100 transition-colors flex items-center gap-2">
                          <ScrollText size={16} />
                          Document link available
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </CardContent>
              
              {/* Navigation footer */}
              <CardFooter className="border-t pt-3 pb-2 bg-gray-50">
                <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
                  {currentIndex > 0 ? (
                    <span>Previous: {getShortEventTitle(sortedEvents[currentIndex - 1])}</span>
                  ) : (
                    <span>Start of timeline</span>
                  )}
                  
                  {currentIndex < sortedEvents.length - 1 ? (
                    <span>Next: {getShortEventTitle(sortedEvents[currentIndex + 1])}</span>
                  ) : (
                    <span>End of timeline</span>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation buttons with enhanced styling */}
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-4 top-1/2 transform -translate-y-1/2 rounded-full bg-background shadow-md z-10 hover:shadow-lg transition-all border-gray-200"
          onClick={handlePrevious}
        >
          <ChevronLeft size={18} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 rounded-full bg-background shadow-md z-10 hover:shadow-lg transition-all border-gray-200"
          onClick={handleNext}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
      
      {/* Timeline nav dots with enhanced animation */}
      <div className="flex justify-center gap-1 mt-4">
        {sortedEvents.map((event, index) => (
          <motion.button
            key={event.id}
            initial={{ scale: 0.8 }}
            animate={{ 
              scale: index === currentIndex ? 1.2 : 1,
              backgroundColor: index === currentIndex 
                ? getChamberColor(event.chamber) 
                : index < currentIndex 
                  ? '#94a3b8' // Light version of the completed events
                  : '#d1d5db'  // Uncompleted events
            }}
            whileHover={{ scale: 1.3 }}
            transition={{ duration: 0.2 }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'w-4' : ''
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`View event ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Current position indicator text */}
      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} of {sortedEvents.length} events
      </div>
    </div>
  );
}