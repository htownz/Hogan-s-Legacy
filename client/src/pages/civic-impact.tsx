import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, BarChart3, Target, Users } from "lucide-react";

import ImpactVisualization from '@/components/dashboard/impact-visualization';
import CivicGoalsTracker from '@/components/dashboard/civic-goals-tracker';
import TeamLobbyingDashboard from '@/components/dashboard/team-lobbying-dashboard';

const CivicImpactPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('impact');
  
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Civic Impact</h1>
        <p className="text-muted-foreground">
          Track your impact on legislation and coordinate your civic action efforts
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="h-10">
            <TabsTrigger value="impact" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Impact</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center">
              <Target className="mr-2 h-4 w-4" />
              <span>Goals</span>
            </TabsTrigger>
            <TabsTrigger value="teamwork" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              <span>Teamwork</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="impact" className="space-y-8">
          <ImpactVisualization />
          
          <Card>
            <CardHeader>
              <CardTitle>Impact Recommendations</CardTitle>
              <CardDescription>
                Suggested actions to increase your civic impact
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Build Your Network</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="mb-2 text-muted-foreground">
                    Connecting with other active citizens amplifies your impact on legislation.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full mt-2">
                    Find Action Circles <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Contact Representatives</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="mb-2 text-muted-foreground">
                    Direct contact with legislators is one of the most effective forms of civic engagement.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full mt-2">
                    View Your Representatives <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Share Knowledge</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="mb-2 text-muted-foreground">
                    Sharing information about important legislation helps create informed communities.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full mt-2">
                    Share Tracked Bills <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="goals" className="space-y-8">
          <CivicGoalsTracker />
        </TabsContent>
        
        <TabsContent value="teamwork" className="space-y-8">
          <TeamLobbyingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CivicImpactPage;