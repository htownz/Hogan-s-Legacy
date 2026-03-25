import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls, Variants } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  ChevronLeft, ChevronRight, Clock, CheckCircle, Flag, Link as LinkIcon,
  Calendar, Gavel, BarChart4, Users, Landmark, ScrollText, AlertCircle,
  ExternalLink, Video, Image, FileText, Check, Play, Pause
} from 'lucide-react';
import { TimelineEvent } from './LegislativeTimeline';
import { Separator } from '@/components/ui/separator';
import { useMediaQuery } from '../../hooks/use-media-query';

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

// Line variants for vertical timeline
const verticalLineVariants: Variants = {
  hidden: { height: "0%" },
  visible: (custom) => ({
    height: `${custom}%`,
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

// Node animation for vertical timeline
const verticalNodeVariants: Variants = {
  initial: { 
    scale: 0.8, 
    opacity: 0 
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      duration: 0.5, 
      ease: "easeOut" 
    }
  }
};

// Content animation for vertical timeline
const verticalContentVariants: Variants = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 }
    }
  },
  expanded: { 
    height: "auto", 
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.3, delay: 0.1 }
    }
  }
};

export interface EnhancedLegislativeTimelineProps {
  billId: string;
  billNumber: string;
  billTitle: string;
  events: TimelineEvent[];
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'auto'; // Default to auto which uses responsive design
}

export default function EnhancedLegislativeTimeline({
  billId,
  billNumber,
  billTitle,
  events,
  className = '',
  layout = 'auto' // Default to responsive
}: EnhancedLegislativeTimelineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playTimer, setPlayTimer] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);
  const [activeEventDetails, setActiveEventDetails] = useState<string | null>(null);
  const progressControls = useAnimationControls();
  const timelineRef = useRef<HTMLDivElement>(null);
  const verticalTimelineRef = useRef<HTMLDivElement>(null);
  
  // Check if mobile view using media query
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Determine current layout based on props and device
  const currentLayout = layout === 'auto' 
    ? (isMobile ? 'vertical' : 'horizontal')
    : layout;

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
  
  // Toggle expanded state for vertical timeline events
  const toggleEventExpand = (eventId: string) => {
    setExpandedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId) 
        : [...prev, eventId]
    );
  };
  
  // Set active event detail for dialog
  const showEventDetails = (eventId: string) => {
    setActiveEventDetails(eventId);
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
    
    // Scroll to the current milestone in the timeline for horizontal layout
    if (currentLayout === 'horizontal' && timelineRef.current) {
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
    
    // For vertical layout, scroll to the current event
    if (currentLayout === 'vertical' && verticalTimelineRef.current) {
      const eventNodes = verticalTimelineRef.current.querySelectorAll('.vertical-timeline-node');
      if (eventNodes && eventNodes[currentIndex]) {
        const node = eventNodes[currentIndex] as HTMLElement;
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ensure this event is expanded
        if (!expandedEvents.includes(sortedEvents[currentIndex].id)) {
          setExpandedEvents(prev => [...prev, sortedEvents[currentIndex].id]);
        }
      }
    }
  }, [currentIndex, sortedEvents.length, progressControls, currentLayout, expandedEvents]);

  // Get event icon based on event type
  const getEventIcon = (event: TimelineEvent, size: number = 22) => {
    switch (event.eventType) {
      case 'introduction':
        return <Flag size={size} style={{ color: COLORS.PRIMARY }} />;
      case 'committee':
        return <Users size={size} style={{ color: COLORS.OPTIONAL }} />;
      case 'floor_vote':
        return <Gavel size={size} style={{ color: COLORS.SENATE }} />;
      case 'passage':
        return <CheckCircle size={size} style={{ color: COLORS.SUCCESS }} />;
      case 'amendment':
        return <ScrollText size={size} style={{ color: COLORS.SUPPORT }} />;
      case 'signature':
        return <Landmark size={size} style={{ color: COLORS.GOVERNOR }} />;
      case 'effective':
        return <Calendar size={size} style={{ color: COLORS.PRIMARY }} />;
      default:
        return <Clock size={size} style={{ color: COLORS.SUPPORT }} />;
    }
  };

  // Get media icon based on media type
  const getMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'image':
        return <Image size={16} />;
      case 'video':
        return <Video size={16} />;
      case 'document':
        return <FileText size={16} />;
      default:
        return <LinkIcon size={16} />;
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

  // Format date with options
  const formatDate = (dateString: string, includeTime: boolean = false) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    
    return date.toLocaleDateString(undefined, options);
  };
  
  // Render the horizontal timeline view
  const renderHorizontalTimeline = () => {
    return (
      <>
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
                            ...(isActive && { boxShadow: `0 0 0 2px ${chamberColor}` })
                          }}
                        >
                          {getEventIcon(event, 16)}
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
                      <motion.div variants={cardChildrenVariants} className="flex flex-col">
                        <CardTitle className="text-lg font-bold">{getEventTitle(currentEvent)}</CardTitle>
                        <CardDescription className="text-sm">
                          {formatDate(currentEvent.date, true)}
                        </CardDescription>
                      </motion.div>
                    </div>
                    <Badge 
                      className="capitalize" 
                      style={{ 
                        backgroundColor: getChamberColor(currentEvent.chamber) + '20',
                        color: getChamberColor(currentEvent.chamber),
                        borderColor: getChamberColor(currentEvent.chamber) + '40'
                      }}
                    >
                      {currentEvent.chamber}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4 overflow-y-auto" style={{ maxHeight: '270px' }}>
                  <motion.div variants={cardChildrenVariants} className="space-y-4">
                    {/* Description */}
                    <div className="text-gray-700">
                      <p>{currentEvent.description}</p>
                    </div>
                    
                    {/* Committee info if available */}
                    {currentEvent.committeeInfo && (
                      <div className="mt-3 bg-blue-50 p-3 rounded-md border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                          <Users size={16} />
                          <span>Committee Information</span>
                        </div>
                        <p className="text-sm text-blue-700">{currentEvent.committeeInfo}</p>
                      </div>
                    )}
                    
                    {/* Vote information if available */}
                    {currentEvent.voteInfo && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                          <BarChart4 size={16} />
                          <span>Vote Results</span>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-green-700">
                                Yes: {currentEvent.voteInfo.yes}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(calculateVotePercentage(currentEvent.voteInfo.yes, currentEvent.voteInfo))}%
                              </span>
                            </div>
                            <motion.div 
                              className="h-2 bg-green-500 rounded"
                              variants={voteChartVariants}
                              initial="initial"
                              animate="animate"
                              custom={calculateVotePercentage(currentEvent.voteInfo.yes, currentEvent.voteInfo)}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-red-700">
                                No: {currentEvent.voteInfo.no}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(calculateVotePercentage(currentEvent.voteInfo.no, currentEvent.voteInfo))}%
                              </span>
                            </div>
                            <motion.div 
                              className="h-2 bg-red-500 rounded"
                              variants={voteChartVariants}
                              initial="initial"
                              animate="animate"
                              custom={calculateVotePercentage(currentEvent.voteInfo.no, currentEvent.voteInfo)}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Present: {currentEvent.voteInfo.present}</span>
                            <span>Absent: {currentEvent.voteInfo.absent}</span>
                            <span>Total: {calculateVoteTotal(currentEvent.voteInfo)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Impact summary if available */}
                    {currentEvent.impactSummary && (
                      <div className="mt-3 bg-amber-50 p-3 rounded-md border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                          <AlertCircle size={16} />
                          <span>Potential Impact</span>
                        </div>
                        <p className="text-sm text-amber-700">{currentEvent.impactSummary}</p>
                      </div>
                    )}
                    
                    {/* Media link if available */}
                    {currentEvent.mediaLink && (
                      <motion.div variants={cardChildrenVariants} className="mt-4">
                        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <LinkIcon size={14} />
                          <span>Related Media</span>
                        </div>
                        
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
                          <a 
                            href={currentEvent.mediaLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            <Video size={18} className="text-blue-700" />
                            <span className="text-blue-800 font-medium">Watch Committee Video</span>
                            <ExternalLink size={14} className="text-blue-500 ml-1" />
                          </a>
                        ) : (
                          <a 
                            href={currentEvent.mediaLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                          >
                            <FileText size={18} className="text-gray-700" />
                            <span className="text-gray-800 font-medium">View Document</span>
                            <ExternalLink size={14} className="text-gray-500 ml-1" />
                          </a>
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
              aria-label={`Go to ${getEventTitle(event)}`}
            />
          ))}
        </div>
      </>
    );
  };
  
  // Render the vertical timeline view
  const renderVerticalTimeline = () => {
    return (
      <div 
        ref={verticalTimelineRef}
        className="space-y-0 relative pt-2"
      >
        {/* Vertical progress line */}
        <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200 z-0"></div>
        <motion.div 
          className="absolute top-0 left-6 w-0.5 bg-gradient-to-b from-primary via-accent to-primary z-[1]"
          variants={verticalLineVariants}
          initial="hidden"
          animate="visible"
          custom={animationProgress}
        />
        
        {sortedEvents.map((event, index) => {
          const isExpanded = expandedEvents.includes(event.id);
          const isPast = new Date(event.date) <= new Date();
          const chamberColor = getChamberColor(event.chamber);
          const isCurrentEvent = index === currentIndex;
          
          return (
            <div 
              key={event.id}
              className={`vertical-timeline-node relative pl-16 pr-4 py-3 group
                ${isExpanded ? '' : 'hover:bg-gray-50'} 
                ${isCurrentEvent ? 'bg-blue-50' : ''}`}
            >
              {/* Node */}
              <motion.div
                variants={verticalNodeVariants}
                initial="initial"
                animate="animate"
                className={`absolute left-4 w-5 h-5 rounded-full border-2 z-10
                  flex items-center justify-center
                  ${isPast ? 'bg-white' : 'bg-gray-100'}`}
                style={{ 
                  top: '1.25rem', 
                  borderColor: chamberColor,
                  backgroundColor: isCurrentEvent ? chamberColor : isPast ? 'white' : '#f3f4f6'
                }}
              >
                {isPast && (
                  <Check 
                    size={12} 
                    className="text-green-600" 
                    style={{ 
                      color: isCurrentEvent ? 'white' : chamberColor 
                    }}
                  />
                )}
              </motion.div>
              
              {/* Line to next event */}
              {index < sortedEvents.length - 1 && (
                <div 
                  className="absolute left-6 w-0.5 bg-gray-200 z-0"
                  style={{ 
                    top: '2rem',
                    bottom: '-1rem',
                    transform: 'translateX(-50%)'
                  }}
                ></div>
              )}
              
              {/* Event header (always visible) */}
              <div 
                className="flex items-center gap-2 mb-1 cursor-pointer"
                onClick={() => {
                  toggleEventExpand(event.id);
                  setCurrentIndex(index);
                }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {getEventTitle(event)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(event.date)}
                  </div>
                </div>
                
                <Badge 
                  className="capitalize text-xs" 
                  style={{ 
                    backgroundColor: chamberColor + '10',
                    color: chamberColor,
                    borderColor: chamberColor + '30'
                  }}
                >
                  {getShortEventTitle(event)}
                </Badge>
                
                <ChevronRight 
                  size={16} 
                  className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                />
              </div>
              
              {/* Expanded content */}
              <motion.div
                variants={verticalContentVariants}
                initial="collapsed"
                animate={isExpanded ? "expanded" : "collapsed"}
                className="overflow-hidden"
              >
                {isExpanded && (
                  <div className="pt-2 pl-1">
                    <Separator className="mb-3" />
                    
                    <div className="text-sm text-gray-700 mb-3">
                      <p>{event.description}</p>
                    </div>
                    
                    {/* Committee info if available */}
                    {event.committeeInfo && (
                      <div className="mb-3 bg-blue-50 p-2 rounded-md border border-blue-100 text-xs">
                        <div className="flex items-center gap-1 text-blue-800 font-medium mb-1">
                          <Users size={14} />
                          <span>Committee</span>
                        </div>
                        <p className="text-blue-700">{event.committeeInfo}</p>
                      </div>
                    )}
                    
                    {/* Vote information if available */}
                    {event.voteInfo && (
                      <div className="mb-3 pt-2 border-t space-y-1">
                        <div className="flex items-center gap-1 text-gray-700 font-medium mb-2 text-xs">
                          <BarChart4 size={14} />
                          <span>Vote Results</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-green-700">Yes</span>
                              <span>{event.voteInfo.yes}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-green-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${calculateVotePercentage(event.voteInfo.yes, event.voteInfo)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-red-700">No</span>
                              <span>{event.voteInfo.no}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-red-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${calculateVotePercentage(event.voteInfo.no, event.voteInfo)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Media link if available */}
                    {event.mediaLink && (
                      <div className="mb-3">
                        <div className="flex gap-1 items-center text-xs text-gray-700 font-medium mb-1">
                          {getMediaIcon(event.mediaType)}
                          <span>Media</span>
                        </div>
                        <a 
                          href={event.mediaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {event.mediaType === 'image' ? 'View Image' : 
                            event.mediaType === 'video' ? 'Watch Video' : 'View Document'}
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                    
                    {/* Impact if available */}
                    {event.impactSummary && (
                      <div className="mb-1 bg-amber-50 p-2 rounded-md border border-amber-100 text-xs">
                        <div className="flex items-center gap-1 text-amber-800 font-medium mb-1">
                          <AlertCircle size={14} />
                          <span>Impact</span>
                        </div>
                        <p className="text-amber-700">{event.impactSummary}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`relative space-y-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-primary mb-1">{billNumber}</h3>
          <p className="text-sm text-gray-500">{billTitle}</p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleAutoPlay}
        >
          {isAutoPlaying ? (
            <>
              <Pause size={14} /> Pause
            </>
          ) : (
            <>
              <Play size={14} /> Auto-Play
            </>
          )}
        </Button>
      </div>
      
      {currentLayout === 'horizontal' ? renderHorizontalTimeline() : renderVerticalTimeline()}
    </div>
  );
}