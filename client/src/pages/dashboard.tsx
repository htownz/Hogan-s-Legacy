import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AlertCard from "@/components/legislation/AlertCard";
import Timeline from "@/components/legislation/Timeline";
import AIExplain from "@/components/legislation/AIExplain";
import MobileNav from "@/components/shared/mobile-nav";
import { RemindersPanel } from "@/components/user/RemindersPanel";
import ImpactHistory from "@/components/user/ImpactHistory";
import { useUser } from "@/context/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PolicyIntelBridgeWidget } from "@/components/PolicyIntelBridgeWidget";

// Sample alerts data to demonstrate the components
const SAMPLE_ALERTS = [
  {
    id: "TX-HB0123",
    billTitle: "HB 123: Education Funding Act",
    billStatus: "Passed Committee",
    billSummary: "Adds 48-hour notification period for school budget changes affecting more than 5% of annual funding.",
    importance: "high" as const,
    category: "education",
    actionText: "Take Action",
    actionUrl: "#",
    zipCodes: ["75001", "75002", "75003"],
    tags: ["education", "school funding", "budget", "public schools"],
    regions: ["75001", "75002", "75003", "75080"]
  },
  {
    id: "TX-SB0456",
    billTitle: "SB 456: Healthcare Access Initiative",
    billStatus: "Introduced",
    billSummary: "Expands telehealth services to rural areas with limited healthcare facilities.",
    importance: "medium" as const,
    category: "healthcare",
    actionText: "Contact Representative",
    actionUrl: "#",
    zipCodes: ["75001", "76201", "77001"],
    tags: ["healthcare", "telehealth", "rural", "medical services"],
    regions: ["76201", "77001", "78701"]
  },
  {
    id: "TX-HB0789",
    billTitle: "HB 789: Environmental Protection Act",
    billStatus: "Committee Review",
    billSummary: "Increases penalties for corporations violating state emission standards.",
    importance: "low" as const,
    category: "environment",
    actionText: "Learn More",
    actionUrl: "#",
    zipCodes: ["77001", "78701", "79901"],
    tags: ["environment", "climate", "emissions", "pollution"],
    regions: ["77001", "78701", "79901"]
  },
  {
    id: "TX-SB0234",
    billTitle: "SB 234: Gun Safety Measures",
    billStatus: "Floor Vote Scheduled",
    billSummary: "Requires enhanced background checks for firearm purchases at gun shows.",
    importance: "high" as const,
    category: "guns",
    actionText: "Urgent Action",
    actionUrl: "#",
    zipCodes: ["75001", "75080", "76201"],
    tags: ["guns", "public safety", "background checks"],
    regions: ["75001", "75080", "76201"]
  },
  {
    id: "TX-HB0567",
    billTitle: "HB 567: Housing Affordability Act",
    billStatus: "Passed House",
    billSummary: "Creates tax incentives for developers building affordable housing units in urban areas.",
    importance: "medium" as const,
    category: "housing",
    actionText: "Support Now",
    actionUrl: "#",
    zipCodes: ["75001", "75002", "75003"],
    tags: ["housing", "affordability", "urban development", "taxes"],
    regions: ["75001", "75002", "75003", "77001"]
  },
  {
    id: "TX-HB0678",
    billTitle: "HB 678: Transportation Infrastructure Bill",
    billStatus: "Introduced",
    billSummary: "Allocates additional funding for highway maintenance and public transit development in urban centers.",
    importance: "medium" as const,
    category: "transportation",
    actionText: "Learn More",
    actionUrl: "#",
    zipCodes: ["75080", "76201"],
    tags: ["transportation", "infrastructure", "public transit", "highways"],
    regions: ["75080", "76201", "78701"]
  },
  {
    id: "TX-SB0345",
    billTitle: "SB 345: Small Business Tax Relief",
    billStatus: "Committee Review",
    billSummary: "Provides tax exemptions for small businesses with under 50 employees to stimulate economic growth.",
    importance: "medium" as const,
    category: "economy",
    actionText: "Contact Legislator",
    actionUrl: "#",
    zipCodes: ["77001", "78701"],
    tags: ["economy", "small business", "taxes", "jobs"],
    regions: ["77001", "78701", "79901"]
  }
];

const TIMELINE_DATA = {
  billNumber: "HB 123",
  billTitle: "Education Funding Act",
  steps: [
    {
      id: "step-1",
      title: "Filed with Secretary of State",
      description: "Bill filed by Representative John Smith",
      date: new Date("2025-01-15"),
      status: "completed" as const,
      type: "filing" as const,
    },
    {
      id: "step-2",
      title: "Referred to Education Committee",
      description: "Assigned to House Education Committee for review",
      date: new Date("2025-01-22"),
      status: "completed" as const,
      type: "committee" as const,
    },
    {
      id: "step-3",
      title: "Committee Hearing",
      description: "Public testimony and committee amendments",
      date: new Date("2025-02-05"),
      status: "completed" as const,
      type: "committee" as const,
    },
    {
      id: "step-4",
      title: "House Floor Vote",
      description: "Scheduled for debate and vote on House floor",
      date: new Date("2025-02-12"),
      status: "current" as const,
      type: "floor" as const,
    },
    {
      id: "step-5",
      title: "Senate Consideration",
      status: "upcoming" as const,
      type: "committee" as const,
    },
  ],
};

export default function DashboardPage() {
  const [_, setLocation] = useLocation();
  const { userData } = useUser();
  const [relevantAlerts, setRelevantAlerts] = useState<typeof SAMPLE_ALERTS>([]);
  const [allAlerts, setAllAlerts] = useState<typeof SAMPLE_ALERTS>([]);
  const [trackedBills, setTrackedBills] = useState<typeof SAMPLE_ALERTS>([]);
  const [showSmartAlertsOnly, setShowSmartAlertsOnly] = useState<boolean>(true);
  
  // Get user preferences from context
  const zipCode = userData.zipCode || "75001"; // Default to a Texas ZIP code if not set
  const interests = userData.interests || [];
  const trackedBillIds = userData.trackedBills || [];
  
  // Check if the user has completed onboarding
  useEffect(() => {
    if (!userData.onboardingComplete) {
      // Redirect to onboarding if not completed
      setLocation("/onboarding");
    }
  }, [userData.onboardingComplete, setLocation]);

  // Filter alerts based on user preferences (ZIP code and interests)
  useEffect(() => {
    // Smart Alerts filtering logic
    const isRelevantAlert = (alert: (typeof SAMPLE_ALERTS)[0]) => {
      // Check if bill's regions match the user's ZIP code
      const zipMatch = alert.regions.includes(zipCode);
      
      // Check if any of the bill's tags match the user's interests
      const tagMatch = alert.tags.some(tag => interests.includes(tag));
      
      // A bill is relevant if it matches EITHER the ZIP code OR at least one interest
      return zipMatch || tagMatch;
    };
    
    // Apply the smart filter
    const smartFiltered = SAMPLE_ALERTS.filter(isRelevantAlert);
    setRelevantAlerts(smartFiltered);
    
    // Keep track of all alerts for the toggle feature
    setAllAlerts(SAMPLE_ALERTS);
    
    // Filter tracked bills
    const tracked = SAMPLE_ALERTS.filter(alert => 
      trackedBillIds.includes(alert.id)
    );
    
    setTrackedBills(tracked);
  }, [zipCode, interests, trackedBillIds]);

  return (
    <div className="min-h-screen bg-[#121825] text-white pb-24">
      {/* Header */}
      <div className="p-6 text-center">
        <h1 className="text-4xl font-bold text-white tracking-wide">
          Act Up, TX-{zipCode}
        </h1>
      </div>

      {/* Welcome message with user preferences */}
      <div className="px-4 mb-8">
        <Card className="bg-[#1e2334] border-gray-700">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Welcome to your personalized dashboard</h2>
                <p className="text-gray-400">
                  Showing legislation relevant to ZIP code <span className="text-blue-400">{zipCode}</span>
                  {interests.length > 0 && (
                    <> and your interests: <span className="text-blue-400">{interests.join(", ")}</span></>
                  )}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs border-gray-600 hover:bg-gray-700"
                onClick={() => setLocation("/onboarding")}
              >
                Update My Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mb-4">
        <PolicyIntelBridgeWidget dark compact />
      </div>

      {/* Smart Alerts Toggle */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between bg-[#1e2334] rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Label htmlFor="smart-alerts" className="text-white font-medium">
              Show: {showSmartAlertsOnly ? 'Smart Alerts Only' : 'All Alerts'}
            </Label>
            <Switch
              id="smart-alerts"
              checked={showSmartAlertsOnly}
              onCheckedChange={setShowSmartAlertsOnly}
              className="data-[state=checked]:bg-[#f05a28]"
            />
          </div>
          <div className="text-xs text-gray-400">
            {showSmartAlertsOnly 
              ? `Filtering ${relevantAlerts.length} of ${allAlerts.length} alerts`
              : `Showing all ${allAlerts.length} alerts`}
          </div>
        </div>
      </div>

      {/* Bills Tabs Section */}
      <div className="px-4 mb-8">
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1a1f2e]">
            <TabsTrigger value="alerts" className="data-[state=active]:bg-[#f05a28] data-[state=active]:text-white">
              {showSmartAlertsOnly ? 'Smart Alerts' : 'All Alerts'}
              {(showSmartAlertsOnly ? relevantAlerts : allAlerts).length > 0 && 
                ` (${(showSmartAlertsOnly ? relevantAlerts : allAlerts).length})`}
            </TabsTrigger>
            <TabsTrigger value="tracked" className="data-[state=active]:bg-[#f05a28] data-[state=active]:text-white">
              Tracked Bills{trackedBills.length > 0 && ` (${trackedBills.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="mt-4 space-y-4">
            {/* Show either smart-filtered alerts or all alerts based on toggle */}
            {(showSmartAlertsOnly ? relevantAlerts : allAlerts).length > 0 ? (
              (showSmartAlertsOnly ? relevantAlerts : allAlerts).map((alert) => (
                <AlertCard 
                  key={alert.id}
                  billId={alert.id}
                  billTitle={alert.billTitle}
                  billStatus={alert.billStatus}
                  billSummary={alert.billSummary}
                  importance={alert.importance}
                  actionText={alert.actionText}
                  actionUrl={alert.actionUrl}
                />
              ))
            ) : (
              <div className="bg-[#1e2334] rounded-lg p-6 text-center text-gray-400">
                <p>No {showSmartAlertsOnly ? "relevant" : ""} alerts {showSmartAlertsOnly ? "based on your preferences" : "available"}.</p>
                {showSmartAlertsOnly && (
                  <p className="mt-2">Try updating your interests in profile settings or toggle to see all alerts.</p>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tracked" className="mt-4 space-y-4">
            {trackedBills.length > 0 ? (
              trackedBills.map((bill) => (
                <AlertCard 
                  key={bill.id}
                  billId={bill.id}
                  billTitle={bill.billTitle}
                  billStatus={bill.billStatus}
                  billSummary={bill.billSummary}
                  importance={bill.importance}
                  actionText={bill.actionText}
                  actionUrl={bill.actionUrl}
                />
              ))
            ) : (
              <div className="bg-[#1e2334] rounded-lg p-6 text-center text-gray-400">
                <p>You haven't tracked any bills yet.</p>
                <p className="mt-2">Star a bill from the alerts tab to track it here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Legislative Timeline Section */}
      <div className="px-4 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Legislative Timeline</h2>
        <Timeline
          billNumber={TIMELINE_DATA.billNumber}
          steps={TIMELINE_DATA.steps}
        />
      </div>
      
      {/* Action Reminders Section */}
      <div className="px-4 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Action Reminders</h2>
        <RemindersPanel />
      </div>

      {/* AI Impact Explainer Section */}
      <div className="px-4 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Impact Summary</h2>
        <AIExplain
          billNumber="TX-HB0123"
          billTitle="Education Funding Act"
          zipCode={zipCode}
          interests={interests}
        />
      </div>
      
      {/* User Impact History Section */}
      <div className="px-4 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Your Civic Impact</h2>
        <ImpactHistory />
      </div>

      {/* Empty space to account for the bottom nav */}
      <div className="h-16"></div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}