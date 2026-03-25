import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import confetti from 'canvas-confetti';
import { AlertCircle, CheckCircle2, GavelIcon, Award, BadgeCheck, X } from 'lucide-react';

// Act Up Color Palette
const COLORS = {
  PRIMARY: '#1D2D44', // Dark blue
  ACCENT: '#FF6400',  // Orange
  BACKGROUND: '#FAFAFA', // Off-white
  SUPPORT: '#596475', // Slate gray
  OPTIONAL: '#5DB39E'  // Teal
};

export interface BillCelebrationEvent {
  id: string;
  billId: string;
  billNumber: string; 
  title: string;
  milestone: 'committee_approval' | 'passed_chamber' | 'passed_legislature' | 'signed' | 'effective' | 'custom';
  customMilestone?: string;
  description: string;
  date: string;
  chamber?: 'house' | 'senate';
  committeeInfo?: string;
  voteCounts?: {
    yes: number;
    no: number;
    present: number;
    absent: number;
  };
}

interface BillProgressCelebrationProps {
  celebration: BillCelebrationEvent | null;
  onClose: () => void;
  autoHideDuration?: number;
}

export default function BillProgressCelebration({ 
  celebration, 
  onClose,
  autoHideDuration = 10000
}: BillProgressCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (celebration) {
      setIsVisible(true);
      
      // Set timeout to auto-hide the celebration
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Give time for exit animation before calling onClose
      }, autoHideDuration);
      
      // Trigger confetti
      if (confettiCanvasRef.current) {
        const myConfetti = confetti.create(confettiCanvasRef.current, { 
          resize: true,
          useWorker: true 
        });
        
        // Different confetti for different milestones
        if (celebration.milestone === 'signed' || celebration.milestone === 'effective') {
          // Big celebration for major milestones
          const end = Date.now() + 3000;
          
          const colors = [COLORS.PRIMARY, COLORS.ACCENT, COLORS.OPTIONAL, COLORS.SUPPORT];
          
          (function frame() {
            myConfetti({
              particleCount: 5,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: colors
            });
            
            myConfetti({
              particleCount: 5,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: colors
            });
            
            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        } else {
          // Standard celebration for smaller milestones
          myConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: [COLORS.PRIMARY, COLORS.ACCENT, COLORS.OPTIONAL, COLORS.SUPPORT]
          });
        }
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [celebration, autoHideDuration, onClose]);
  
  if (!celebration) return null;
  
  // Get the appropriate icon based on milestone
  const getMilestoneIcon = () => {
    switch (celebration.milestone) {
      case 'committee_approval':
        return <CheckCircle2 className="h-8 w-8" style={{ color: COLORS.OPTIONAL }} />;
      case 'passed_chamber':
        return <AlertCircle className="h-8 w-8" style={{ color: COLORS.PRIMARY }} />;
      case 'passed_legislature':
        return <GavelIcon className="h-8 w-8" style={{ color: COLORS.ACCENT }} />;
      case 'signed':
        return <Award className="h-8 w-8" style={{ color: COLORS.ACCENT }} />;
      case 'effective':
        return <BadgeCheck className="h-8 w-8" style={{ color: COLORS.OPTIONAL }} />;
      case 'custom':
      default:
        return <CheckCircle2 className="h-8 w-8" style={{ color: COLORS.SUPPORT }} />;
    }
  };
  
  // Get milestone label text
  const getMilestoneLabel = () => {
    if (celebration.milestone === 'custom' && celebration.customMilestone) {
      return celebration.customMilestone;
    }
    
    switch (celebration.milestone) {
      case 'committee_approval':
        return 'Approved in Committee';
      case 'passed_chamber':
        return `Passed the ${celebration.chamber === 'house' ? 'House' : 'Senate'}`;
      case 'passed_legislature':
        return 'Passed the Legislature';
      case 'signed':
        return 'Signed into Law';
      case 'effective':
        return 'Law Now in Effect';
      default:
        return 'Bill Progress Update';
    }
  };
  
  // Get the appropriate color for the card based on milestone
  const getCardStyles = () => {
    let bgColor, borderColor;
    
    switch (celebration.milestone) {
      case 'committee_approval':
        bgColor = COLORS.OPTIONAL + '20'; // 20 = 12.5% opacity in hex
        borderColor = COLORS.OPTIONAL;
        break;
      case 'passed_chamber':
        bgColor = COLORS.PRIMARY + '20';
        borderColor = COLORS.PRIMARY;
        break;
      case 'passed_legislature':
        bgColor = COLORS.ACCENT + '20';
        borderColor = COLORS.ACCENT;
        break;
      case 'signed':
        bgColor = COLORS.ACCENT + '20';
        borderColor = COLORS.ACCENT;
        break;
      case 'effective':
        bgColor = COLORS.OPTIONAL + '20';
        borderColor = COLORS.OPTIONAL;
        break;
      case 'custom':
      default:
        bgColor = COLORS.SUPPORT + '20';
        borderColor = COLORS.SUPPORT;
        break;
    }
    
    return {
      backgroundColor: bgColor,
      borderColor: borderColor
    };
  };
  
  // Get vote badge color based on type
  const getVoteBadgeStyles = (type: 'yes' | 'no' | 'present' | 'absent') => {
    switch (type) {
      case 'yes':
        return {
          bg: COLORS.OPTIONAL + '20',
          text: COLORS.OPTIONAL
        };
      case 'no':
        return {
          bg: COLORS.ACCENT + '20',
          text: COLORS.ACCENT
        };
      case 'present':
      case 'absent':
      default:
        return {
          bg: COLORS.SUPPORT + '20',
          text: COLORS.SUPPORT
        };
    }
  };
  
  return (
    <>
      {/* Hidden canvas for confetti */}
      <canvas 
        ref={confettiCanvasRef} 
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: '100%', height: '100%' }}
      />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed top-4 right-4 z-40 max-w-md"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <Card 
              className="border-2 overflow-hidden shadow-lg" 
              style={getCardStyles()}
            >
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* Header with milestone type */}
                  <div className="flex items-center justify-between p-4 border-b" 
                       style={{ borderColor: getCardStyles().borderColor + '40' }}>
                    <div className="flex items-center gap-3">
                      {getMilestoneIcon()}
                      <h3 className="font-bold text-lg">{getMilestoneLabel()}</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                      }}
                      className="rounded-full p-1 hover:bg-gray-100"
                    >
                      <X className="h-5 w-5" style={{ color: COLORS.SUPPORT }} />
                    </button>
                  </div>
                  
                  {/* Bill info */}
                  <div className="p-4">
                    <h4 className="font-semibold text-base mb-1">
                      {celebration.billNumber}: {celebration.title}
                    </h4>
                    <p className="text-sm mb-3" style={{ color: COLORS.SUPPORT }}>
                      {celebration.description}
                    </p>
                    
                    {/* Committee info (if available) */}
                    {celebration.milestone === 'committee_approval' && celebration.committeeInfo && (
                      <div className="mb-3 text-sm">
                        <span className="font-medium">Committee: </span>{celebration.committeeInfo}
                      </div>
                    )}
                    
                    {/* Vote info (if available) */}
                    {celebration.voteCounts && ['passed_chamber', 'passed_legislature'].includes(celebration.milestone) && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        <div className="px-3 py-1 rounded-full text-sm" 
                             style={{
                               backgroundColor: getVoteBadgeStyles('yes').bg,
                               color: getVoteBadgeStyles('yes').text
                             }}>
                          Yes: {celebration.voteCounts.yes}
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm"
                             style={{
                               backgroundColor: getVoteBadgeStyles('no').bg,
                               color: getVoteBadgeStyles('no').text
                             }}>
                          No: {celebration.voteCounts.no}
                        </div>
                        {celebration.voteCounts.present > 0 && (
                          <div className="px-3 py-1 rounded-full text-sm"
                               style={{
                                 backgroundColor: getVoteBadgeStyles('present').bg,
                                 color: getVoteBadgeStyles('present').text
                               }}>
                            Present: {celebration.voteCounts.present}
                          </div>
                        )}
                        {celebration.voteCounts.absent > 0 && (
                          <div className="px-3 py-1 rounded-full text-sm"
                               style={{
                                 backgroundColor: getVoteBadgeStyles('absent').bg,
                                 color: getVoteBadgeStyles('absent').text
                               }}>
                            Absent: {celebration.voteCounts.absent}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Date footer */}
                  <div className="px-4 py-2 text-xs text-right" 
                       style={{ 
                         backgroundColor: COLORS.BACKGROUND,
                         color: COLORS.SUPPORT
                       }}>
                    {new Date(celebration.date).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}