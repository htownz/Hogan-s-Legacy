// @ts-nocheck
import { useState } from "react";
import { BillStage } from "./TrackedTimeline";
import TrackedTimeline from "./TrackedTimeline";
import { AddReminderForm } from "@/components/user/AddReminderForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CalendarPlus } from "lucide-react";
import { useUser, trackBill, untrackBill } from "@/context/UserContext";

interface BillActionCardProps {
  billId: string;
  billTitle: string;
  chamber?: "House" | "Senate";
  currentStage?: string;
  stages?: BillStage[];
  estimatedNextDate?: Date;
}

export function BillActionCard({
  billId,
  billTitle,
  chamber = "House",
  currentStage,
  stages,
  estimatedNextDate,
}: BillActionCardProps) {
  const { userData, setUserData } = useUser();
  const isTracked = userData.trackedBills.includes(billId);
  const [showActionInfo, setShowActionInfo] = useState(false);
  
  // Determine suggested action based on currentStage
  const suggestedAction = currentStage ? getSuggestedAction(currentStage) : "";
  
  // Get action suggestion based on stage
  function getSuggestedAction(stage: string): string {
    switch (stage) {
      case "Filed":
        return "Monitor bill introduction process";
      case "In Committee":
        return "Contact committee members about this bill";
      case "Hearing Scheduled":
        return "Prepare testimony for upcoming hearing";
      case "Floor Vote":
        return "Call your representative before the vote";
      case "Passed Chamber":
        return "Share news about the bill's progress";
      case "In Other Chamber":
        return "Contact legislators in the other chamber";
      case "Passed Both Chambers":
        return "Monitor for governor's signature";
      case "Signed Into Law":
        return "Learn about implementation timeline";
      default:
        return "Stay informed about this bill";
    }
  }
  
  // Handle toggle tracking
  const handleToggleTracking = () => {
    if (isTracked) {
      untrackBill(setUserData, billId);
    } else {
      trackBill(setUserData, billId);
    }
  };

  return (
    <Card className="bg-[#1e2334] border-gray-700 mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-[#f05a28]" />
          Action Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline component */}
        <TrackedTimeline
          billId={billId}
          billTitle={billTitle}
          chamber={chamber}
          stages={stages}
          currentStage={currentStage}
          estimatedNextDate={estimatedNextDate}
          onActionClick={() => setShowActionInfo(!showActionInfo)}
        />
        
        {/* Action information panel */}
        {showActionInfo && (
          <div className="bg-[#121825] p-4 rounded-md border border-gray-700 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-[#f05a28] h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">{getSuggestedAction(currentStage || "Filed")}</h4>
                <p className="text-sm text-gray-400 mt-1">
                  {currentStage === "In Committee" 
                    ? "Committee members have significant influence on whether bills advance. Your communication can make a difference in the outcome."
                    : currentStage === "Hearing Scheduled" 
                    ? "Public testimony is a powerful way to influence legislation. Prepare concise, clear points that focus on your personal perspective."
                    : currentStage === "Floor Vote" 
                    ? "Representatives often track how many constituents contact them about specific bills. Make your voice count before the vote happens."
                    : "Tracking legislation through the process helps you stay informed and take timely action when it matters most."}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant={isTracked ? "default" : "outline"}
            className={isTracked 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-[#121825] border-gray-700 text-white hover:bg-[#283049]"
            }
            onClick={handleToggleTracking}
          >
            {isTracked ? "Bill Tracked ✓" : "Track This Bill"}
          </Button>
          
          <AddReminderForm 
            billId={billId}
            billTitle={billTitle}
            suggestedAction={suggestedAction}
          />
        </div>
      </CardContent>
    </Card>
  );
}