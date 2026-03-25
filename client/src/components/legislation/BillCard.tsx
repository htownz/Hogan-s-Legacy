import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Users, Star, StarOff, Zap, BookMarked } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import BillTrackingAnimation from "./BillTrackingAnimation";
import BellNotification from "./BellNotification";
import PulseEffect from "./PulseEffect";
import Confetti from "./Confetti";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define type for API response
interface ApiResponse {
  ok: boolean;
  status: number;
  data?: any;
}

export interface Bill {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  introducedAt: string;
  lastActionAt: string;
  sponsors: string[];
  topics: string[];
  policyDifficulty?: number; // 1-5 scale
  engagementDifficulty?: number; // 1-5 scale
}

interface BillCardProps {
  bill: Bill;
  isTracked?: boolean;
  onTrackToggle?: (billId: string, isTracked: boolean) => void;
  onViewDetails?: (bill: Bill) => void;
}

// Helper function to get difficulty label
const getDifficultyLabel = (level: number): string => {
  switch (level) {
    case 1: return "Easy";
    case 2: return "Moderate";
    case 3: return "Complex";
    case 4: return "Very Complex";
    case 5: return "Expert";
    default: return "Unknown";
  }
};

// Helper function to get difficulty color
const getDifficultyColor = (level: number, prefix: 'bg' | 'text' = 'bg'): string => {
  switch (level) {
    case 1: return `${prefix}-green-500`;
    case 2: return `${prefix}-teal-500`;
    case 3: return `${prefix}-yellow-500`;
    case 4: return `${prefix}-orange-500`;
    case 5: return `${prefix}-red-500`;
    default: return `${prefix}-gray-500`;
  }
};

export default function BillCard({ bill, isTracked = false, onTrackToggle, onViewDetails }: BillCardProps) {
  const [tracking, setTracking] = useState(isTracked);
  const [isLoading, setIsLoading] = useState(false);
  const [showTrackAnimation, setShowTrackAnimation] = useState(false);
  const [showUntrackAnimation, setShowUntrackAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(Math.random() > 0.7); // Randomly show updates for demo purposes
  const cardRef = useRef<HTMLDivElement>(null);

  // Get status badge color based on status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "introduced": return "bg-blue-500";
      case "in_committee": return "bg-purple-500";
      case "passed_house": return "bg-yellow-500";
      case "passed_senate": return "bg-yellow-500";
      case "signed": return "bg-green-500";
      case "vetoed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
  };

  // Handle track/untrack toggle
  const handleTrackToggle = async () => {
    try {
      setIsLoading(true);
      if (tracking) {
        // Untrack bill
        const response = await apiRequest(
          `/api/legislation/track/${bill.id}`,
          { method: "DELETE" } as any
        ) as ApiResponse;
        
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Authentication required",
              description: "Please log in to track bills",
              variant: "destructive",
            });
            return;
          }
          throw new Error("Failed to untrack bill");
        }
        
        setTracking(false);
        // Show untrack animation
        setShowUntrackAnimation(true);
        
        // Skip toast since we're showing animation
      } else {
        // Track bill
        const response = await apiRequest(
          "/api/legislation/track",
          {
            method: "POST",
            data: {
              billId: bill.id
            }
          } as any
        ) as ApiResponse;
        
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Authentication required",
              description: "Please log in to track bills",
              variant: "destructive",
            });
            return;
          }
          throw new Error("Failed to track bill");
        }
        
        setTracking(true);
        
        // Show tracking animation and confetti
        setShowTrackAnimation(true);
        setShowConfetti(true);
        
        // Activate pulse effect
        setPulseEffect(true);
        setTimeout(() => setPulseEffect(false), 2000);
        
        // Skip toast since we're showing animation
      }
      
      // Call parent handler if provided
      if (onTrackToggle) {
        onTrackToggle(bill.id, !tracking);
      }
    } catch (error) {
      console.error("Error tracking/untracking bill:", error);
      toast({
        title: "Error",
        description: "Failed to update bill tracking status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate time since last action with error handling
  const lastActionTime = (() => {
    try {
      // Check if lastActionAt is valid
      if (!bill.lastActionAt) return "Unknown";
      return formatDistanceToNow(new Date(bill.lastActionAt), { addSuffix: true });
    } catch (error) {
      console.error("Invalid date format for lastActionAt:", bill.lastActionAt);
      return "Unknown";
    }
  })();

  return (
    <motion.div
      ref={cardRef}
      className="relative"
      initial={{ opacity: 1 }}
      animate={{ 
        scale: pulseEffect ? [1, 1.02, 1] : 1,
        transition: { duration: 0.5 }
      }}
    >
      {/* Pulse effect when tracking is activated */}
      {pulseEffect && <PulseEffect color="rgba(59, 130, 246, 0.3)" size={300} />}
      
      <Card className="w-full hover:shadow-md transition-shadow relative overflow-hidden">
        {/* Bell notification for updates */}
        {hasUpdates && (
          <div className="absolute top-2 right-2 z-10">
            <BellNotification 
              hasUpdates={hasUpdates} 
              count={Math.floor(Math.random() * 5) + 1}
              onClick={() => setHasUpdates(false)}
            />
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold line-clamp-2">{bill.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="text-xs">{bill.chamber === "house" ? "House" : "Senate"}</span>
                •
                <span className="text-xs">Last action {lastActionTime}</span>
              </CardDescription>
            </div>
            
            <Badge className={`${getStatusColor(bill.status)} ml-2`}>
              {formatStatus(bill.status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2">
          <p className="text-sm text-gray-600 line-clamp-3 mb-2">
            {bill.description}
          </p>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {bill.topics.slice(0, 3).map((topic, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {bill.topics.length > 3 && (
              <Badge variant="outline" className="text-xs">+{bill.topics.length - 3} more</Badge>
            )}
          </div>
          
          {/* Difficulty indicators */}
          <div className="flex items-center gap-3 mt-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <BookMarked size={14} className="mr-1 text-blue-500" />
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={`policy-${i}`}
                          className={`h-1.5 w-3 rounded-sm mr-0.5 ${
                            i < (bill.policyDifficulty || 1) 
                              ? getDifficultyColor(bill.policyDifficulty || 1, 'bg') 
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Policy Difficulty: {getDifficultyLabel(bill.policyDifficulty || 1)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Zap size={14} className="mr-1 text-purple-500" />
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={`engage-${i}`}
                          className={`h-1.5 w-3 rounded-sm mr-0.5 ${
                            i < (bill.engagementDifficulty || 1) 
                              ? getDifficultyColor(bill.engagementDifficulty || 1, 'bg') 
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Engagement Difficulty: {getDifficultyLabel(bill.engagementDifficulty || 1)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => onViewDetails && onViewDetails(bill)}
            >
              <FileText size={16} />
              Details
            </Button>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant={tracking ? "default" : "outline"} 
                size="sm" 
                className="gap-1"
                onClick={handleTrackToggle}
                disabled={isLoading}
              >
                <motion.div
                  animate={tracking ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {tracking ? <StarOff size={16} /> : <Star size={16} />}
                </motion.div>
                {tracking ? "Untrack" : "Track"}
              </Button>
            </motion.div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Users size={14} className="mr-1" />
            <span>{bill.sponsors.length} sponsor{bill.sponsors.length !== 1 ? "s" : ""}</span>
          </div>
        </CardFooter>
      </Card>
      
      {/* Track/Untrack animations */}
      <BillTrackingAnimation 
        isActive={showTrackAnimation} 
        onComplete={() => setShowTrackAnimation(false)}
        type="track"
      />
      
      <BillTrackingAnimation 
        isActive={showUntrackAnimation} 
        onComplete={() => setShowUntrackAnimation(false)}
        type="untrack"
      />
      
      {/* Confetti animation */}
      <Confetti isActive={showConfetti} count={100} duration={3000} />
    </motion.div>
  );
}