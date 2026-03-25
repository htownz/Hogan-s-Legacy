// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Users, BarChart3, Map, Download } from 'lucide-react';

import IndividualImpactScore from '@/components/civic-impact/IndividualImpactScore';
import LegislativeInfluenceMap from '@/components/civic-impact/LegislativeInfluenceMap';
import PersonalActionEffectiveness from '@/components/civic-impact/PersonalActionEffectiveness';
import CommunityMilestoneTracker from '@/components/civic-impact/CommunityMilestoneTracker';

// Demo data for the visualizations
const DEMO_DATA = {
  individualImpact: {
    userScore: 78,
    communityAverage: 72,
    userRank: 324,
    totalUsers: 2845,
    userCategoryScores: [
      { category: 'Bill Tracking', score: 85, communityAverage: 70 },
      { category: 'Action Circles', score: 72, communityAverage: 65 },
      { category: 'Knowledge Sharing', score: 64, communityAverage: 60 },
      { category: 'Outreach', score: 80, communityAverage: 55 },
      { category: 'Testimony', score: 45, communityAverage: 35 }
    ]
  },
  
  mapRegions: [
    {
      name: 'Austin',
      coordinates: [-97.7431, 30.2672],
      engagementScore: 87,
      activeBills: 156,
      activeUsers: 783,
      topIssue: 'Education'
    },
    {
      name: 'Houston',
      coordinates: [-95.3698, 29.7604],
      engagementScore: 75,
      activeBills: 143,
      activeUsers: 652,
      topIssue: 'Infrastructure'
    },
    {
      name: 'Dallas',
      coordinates: [-96.7970, 32.7767],
      engagementScore: 82,
      activeBills: 128,
      activeUsers: 590,
      topIssue: 'Criminal Justice'
    },
    {
      name: 'San Antonio',
      coordinates: [-98.4936, 29.4241],
      engagementScore: 68,
      activeBills: 112,
      activeUsers: 473,
      topIssue: 'Healthcare'
    },
    {
      name: 'El Paso',
      coordinates: [-106.4850, 31.7619],
      engagementScore: 63,
      activeBills: 94,
      activeUsers: 281,
      topIssue: 'Immigration'
    },
    {
      name: 'Corpus Christi',
      coordinates: [-97.3964, 27.8006],
      engagementScore: 52,
      activeBills: 76,
      activeUsers: 165,
      topIssue: 'Environment'
    },
    {
      name: 'Lubbock',
      coordinates: [-101.8552, 33.5779],
      engagementScore: 44,
      activeBills: 58,
      activeUsers: 124,
      topIssue: 'Agriculture'
    },
    {
      name: 'Amarillo',
      coordinates: [-101.8313, 35.2220],
      engagementScore: 38,
      activeBills: 45,
      activeUsers: 96,
      topIssue: 'Economy'
    }
  ],
  
  userLocation: [-97.7431, 30.2672], // Austin
  
  actionMetrics: [
    { metric: 'Bill Tracking', personalScore: 85, communityAverage: 70, fullMark: 100 },
    { metric: 'Committee Attendance', personalScore: 45, communityAverage: 35, fullMark: 100 },
    { metric: 'Legislator Outreach', personalScore: 60, communityAverage: 40, fullMark: 100 },
    { metric: 'Issue Advocacy', personalScore: 75, communityAverage: 55, fullMark: 100 },
    { metric: 'Knowledge Sharing', personalScore: 65, communityAverage: 60, fullMark: 100 },
    { metric: 'Network Building', personalScore: 80, communityAverage: 50, fullMark: 100 }
  ],
  
  actionEffectiveness: [
    { action: 'Bill Tracking', effectiveness: 85, count: 42, color: '#1D2D44' },
    { action: 'Testimony', effectiveness: 92, count: 3, color: '#FF6400' },
    { action: 'Action Alerts', effectiveness: 78, count: 15, color: '#5DB39E' },
    { action: 'Social Sharing', effectiveness: 65, count: 28, color: '#8884d8' },
    { action: 'Legislator Contact', effectiveness: 82, count: 7, color: '#ffc658' }
  ],
  
  communityMilestones: [
    {
      id: 'milestone-1',
      title: '10,000 Bills Tracked',
      description: 'Tracking 10,000 bills across all Act Up users to ensure comprehensive legislative coverage.',
      current: 8750,
      target: 10000,
      unit: 'bills',
      completed: false,
      category: 'engagement',
      contributionNeeded: 5
    },
    {
      id: 'milestone-2',
      title: '5,000 Active Users',
      description: 'Growing our active community to 5,000 engaged citizens tracking legislation.',
      current: 2845,
      target: 5000,
      unit: 'users',
      completed: false,
      category: 'engagement',
      reward: 'Unlocks new community forum features and special recognition for early adopters.'
    },
    {
      id: 'milestone-3',
      title: '1,000 Committee Testimonies',
      description: 'Supporting 1,000 community members to provide testimony at legislative committee hearings.',
      current: 624,
      target: 1000,
      unit: 'testimonies',
      completed: false,
      category: 'advocacy',
      contributionNeeded: 1
    },
    {
      id: 'milestone-4',
      title: '500 Local Impact Analyses',
      description: 'Creating 500 detailed analyses of how legislation impacts specific communities.',
      current: 500,
      target: 500,
      unit: 'analyses',
      completed: true,
      category: 'impact',
      reward: 'Unlocked detailed district-level impact reports and visualization tools.'
    },
    {
      id: 'milestone-5',
      title: '100 Advocacy Workshops',
      description: 'Conducting 100 workshops to train community members in effective legislative advocacy.',
      current: 78,
      target: 100,
      unit: 'workshops',
      completed: false,
      category: 'education',
      contributionNeeded: 1
    },
    {
      id: 'milestone-6',
      title: '25,000 Legislator Contacts',
      description: 'Facilitating 25,000 constituent communications with legislators about priority bills.',
      current: 18763,
      target: 25000,
      unit: 'contacts',
      completed: false,
      category: 'advocacy',
      contributionNeeded: 10
    }
  ]
};

export default function ImpactVisualizationsDemoPage() {
  const handleShareMilestone = (milestone: any) => {
    alert(`Sharing milestone: ${milestone.title}`);
  };
  
  const handleContributeMilestone = (milestone: any) => {
    alert(`Contributing to milestone: ${milestone.title}`);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Community Impact Visualizations</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About These Visualizations</CardTitle>
          <CardDescription>
            Advanced data visualizations that bring civic engagement metrics to life
          </CardDescription>
        </CardHeader>
        <CardContent className="prose">
          <p>
            These interactive visualizations provide meaningful insights into both personal and community-wide
            civic engagement. By visualizing impact metrics, users can better understand their contributions,
            identify opportunities for greater influence, and collaborate more effectively on legislative priorities.
          </p>
          
          <h3>Key Features</h3>
          <ul>
            <li><strong>Individual Impact Scoring:</strong> Personal scorecards that measure and visualize civic engagement effectiveness</li>
            <li><strong>Geographic Influence Mapping:</strong> Visualize community engagement and impact across regions</li>
            <li><strong>Action Effectiveness Analysis:</strong> Measure which civic actions create the most meaningful impact</li>
            <li><strong>Community Milestone Tracking:</strong> Collaborative goals that showcase collective progress</li>
            <li><strong>Comparative Metrics:</strong> Contextual data that shows how individual efforts compare to community averages</li>
          </ul>
          
          <p>
            Explore the different visualization widgets below to see how they present civic engagement data
            in intuitive, actionable formats.
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="personal" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="personal" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span>Personal Impact</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            <span>Community Impact</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IndividualImpactScore
              userScore={DEMO_DATA.individualImpact.userScore}
              communityAverage={DEMO_DATA.individualImpact.communityAverage}
              userRank={DEMO_DATA.individualImpact.userRank}
              totalUsers={DEMO_DATA.individualImpact.totalUsers}
              userCategoryScores={DEMO_DATA.individualImpact.userCategoryScores}
            />
            
            <PersonalActionEffectiveness
              metrics={DEMO_DATA.actionMetrics}
              actions={DEMO_DATA.actionEffectiveness}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="community">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LegislativeInfluenceMap
              regions={DEMO_DATA.mapRegions}
              userLocation={DEMO_DATA.userLocation}
            />
            
            <CommunityMilestoneTracker
              milestones={DEMO_DATA.communityMilestones}
              onShareMilestone={handleShareMilestone}
              onContribute={handleContributeMilestone}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Integration with Act Up</CardTitle>
        </CardHeader>
        <CardContent className="prose">
          <p>
            In the full Act Up application, these visualizations will be integrated with real-time civic
            engagement data from our database, allowing users to:
          </p>
          
          <ul>
            <li>Track their personal impact and civic engagement effectiveness over time</li>
            <li>Identify specific actions that have the greatest influence on legislation</li>
            <li>Collaborate with other community members to achieve shared advocacy goals</li>
            <li>Discover geographic areas where additional civic engagement is needed</li>
            <li>Receive personalized recommendations to increase their civic impact</li>
          </ul>
          
          <div className="flex justify-center mt-6">
            <Button className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download Impact Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}