// @ts-nocheck

import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AlertCard from "@/components/legislation/AlertCard";
import Timeline from "@/components/legislation/Timeline";
import AIExplain from "@/components/legislation/AIExplain";
import { ArrowLeft } from "lucide-react";

// Mock data for Alert Cards
const MOCK_ALERTS = [
  {
    id: "alert-1",
    billTitle: "HB 123: Education Funding Act",
    billStatus: "Passed Committee",
    billSummary: "Adds 48-hour notification period for school budget changes affecting more than 5% of annual funding.",
    importance: "high" as const,
    actionText: "Take Action",
    actionUrl: "#",
  },
  {
    id: "alert-2",
    billTitle: "SB 456: Healthcare Reform",
    billStatus: "Floor Vote Scheduled",
    billSummary: "Introduces new requirements for telehealth services and insurance coverage extensions.",
    importance: "medium" as const,
    actionText: "Learn More",
    actionUrl: "#",
  },
  {
    id: "alert-3",
    billTitle: "HB 789: Transportation Bill",
    billStatus: "Introduced",
    billSummary: "Allocates $450M to highway infrastructure and public transportation improvements.",
    importance: "low" as const,
    actionText: "Track Bill",
    actionUrl: "#",
  },
];

// Mock data for Bill Timeline
const MOCK_TIMELINE = {
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

// Mock data for AI Explain
const MOCK_AI_EXPLAINS = [
  {
    id: "explain-1",
    billNumber: "TX-HB0123",
    billTitle: "Education Funding Act",
    zipCode: "77040",
    interests: ["education", "reproductive rights", "guns"],
  },
  {
    id: "explain-2",
    billNumber: "TX-SB0456",
    billTitle: "Healthcare Reform",
    zipCode: "77040",
    interests: ["education", "guns"],
  },
  {
    id: "explain-3",
    billNumber: "TX-HB0789",
    billTitle: "Transportation Bill",
    zipCode: "77040",
    interests: ["transportation", "taxes", "environment"],
  },
];

export default function ComponentDemo() {
  return (
    <div className="container max-w-7xl py-10">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Component Demo</h1>
      </div>

      <Tabs defaultValue="aiexplain">
        <TabsList className="mb-4">
          <TabsTrigger value="alerts">Bill Alert Cards</TabsTrigger>
          <TabsTrigger value="timeline">Bill Timeline</TabsTrigger>
          <TabsTrigger value="aiexplain">AI Explain</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Bill Alert Cards</CardTitle>
              <CardDescription>
                These alerts notify users of important bill status changes and updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {MOCK_ALERTS.map(alert => (
                  <AlertCard 
                    key={alert.id}
                    billTitle={alert.billTitle}
                    billStatus={alert.billStatus}
                    billSummary={alert.billSummary}
                    importance={alert.importance}
                    actionText={alert.actionText}
                    actionUrl={alert.actionUrl}
                  />
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Implementation Notes</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Alert cards visually differentiate by importance (high, medium, low)</li>
                  <li>Each card includes the bill title, current status, and a summary of changes</li>
                  <li>Action buttons can be customized based on alert type and user preferences</li>
                  <li>In the full app, these will be generated based on user's tracked bills</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Bill Timeline</CardTitle>
              <CardDescription>
                Shows the legislative journey of a bill through the Texas Legislature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <Timeline
                  billNumber={MOCK_TIMELINE.billNumber}
                  billTitle={MOCK_TIMELINE.billTitle}
                  steps={MOCK_TIMELINE.steps}
                />
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Implementation Notes</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Visual indicators show completed, current, and upcoming steps</li>
                  <li>Icons represent different types of legislative actions</li>
                  <li>The timeline provides context with dates and descriptions</li>
                  <li>In the full app, this will be automatically generated and updated from bill data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aiexplain">
          <Card>
            <CardHeader>
              <CardTitle>AI Impact Explainer</CardTitle>
              <CardDescription>
                Personalized explanations of how legislation impacts users based on location and interests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {MOCK_AI_EXPLAINS.map(item => (
                  <AIExplain 
                    key={item.id}
                    billNumber={item.billNumber}
                    billTitle={item.billTitle}
                    zipCode={item.zipCode}
                    interests={item.interests}
                  />
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Implementation Notes</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>AI-generated explanations personalized by ZIP code and user interests</li>
                  <li>Provides contextual information on how legislation affects specific communities</li>
                  <li>Displays user's selected interest areas as tags for context</li>
                  <li>In the full app, this will use OpenAI to generate personalized explanations based on bill text and user data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}