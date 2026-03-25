import { Button } from "@/components/ui/button";
import { useUser, trackBill } from "@/context/UserContext";
import { StarIcon, ArrowRight, Share2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import ShareDialog from "./ShareDialog";

export type AlertImportance = 'low' | 'medium' | 'high';

interface AlertCardProps {
  billId: string;    // Unique identifier for the bill
  billTitle: string;
  billStatus: string;
  billSummary: string;
  importance: AlertImportance;
  actionText?: string;
  actionUrl?: string;
  impactSummary?: string;
}

export default function AlertCard({
  billId,
  billTitle,
  billStatus,
  billSummary,
  importance,
  actionText = "Take Action",
  actionUrl = "#",
  impactSummary
}: AlertCardProps) {
  const { userData, setUserData } = useUser();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  // Check if this bill is already being tracked by the user
  const isTracked = userData.trackedBills.includes(billId);
  
  // Function to toggle tracking status
  const toggleTracking = () => {
    if (isTracked) {
      // Remove bill from tracked bills
      setUserData(prev => ({
        ...prev,
        trackedBills: prev.trackedBills.filter(id => id !== billId)
      }));
    } else {
      // Add bill to tracked bills with status tracking
      trackBill(setUserData, billId, billTitle, billStatus);
    }
  };
  
  // Toggle share dialog
  const toggleShareDialog = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    setIsShareDialogOpen(!isShareDialogOpen);
  };

  // Simplified for dark theme
  const [_, setLocation] = useLocation();
  
  // Navigate to bill detail page
  const navigateToBill = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers from firing
    setLocation(`/bills/${billId}`);
  };

  return (
    <div 
      className="bg-[#1e2334] rounded-lg p-5 text-white cursor-pointer hover:bg-[#232b43] transition-colors"
      onClick={navigateToBill}
    >
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="inline-block px-4 py-1 rounded-full font-bold text-sm text-white bg-[#f05a28] uppercase">
            {importance === 'high' ? 'HIGH' : importance === 'medium' ? 'MEDIUM' : 'LOW'}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`p-2 ${isTracked ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-400`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from triggering
              toggleTracking();
            }}
            title={isTracked ? "Untrack this bill" : "Track this bill"}
          >
            {isTracked ? <StarIcon className="h-5 w-5 fill-current" /> : <StarIcon className="h-5 w-5" />}
          </Button>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-1">
          {billTitle.split(':')[0]}
        </h3>
        
        <div className="text-lg mb-3 text-gray-300">
          {billStatus}
        </div>
        
        <p className="text-gray-400">
          {billSummary}
        </p>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          className="bg-[#1a1f2e] text-white hover:bg-[#2a3040] flex-grow"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click from triggering
          }}
        >
          <a 
            href={actionUrl} 
            className="flex items-center justify-center w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {actionText}
          </a>
        </Button>
        
        <Button 
          variant="outline"
          className="bg-transparent border-gray-700 text-white hover:bg-[#2a3040]"
          onClick={navigateToBill}
        >
          <span className="flex items-center">
            View <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        </Button>
        
        <Button 
          variant="ghost"
          className="bg-transparent text-white hover:bg-[#2a3040] px-2"
          onClick={toggleShareDialog}
          title="Share this bill"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Share Dialog */}
      {isShareDialogOpen && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          billId={billId}
          billTitle={billTitle}
          summary={billSummary}
          status={billStatus}
          impactSummary={impactSummary}
          zipCode={userData.zipCode}
          tags={userData.interests}
        />
      )}
    </div>
  );
}