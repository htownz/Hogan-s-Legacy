import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Building2, 
  Home, 
  Share2, 
  CheckCircle, 
  BarChart3, 
  UserPlus, 
  ThumbsUp, 
  ThumbsDown,
  AlertCircle,
  TrendingUp,
  LucideIcon
} from "lucide-react";

// Types for impact visualization
interface ImpactMetric {
  id: string;
  label: string;
  value: number;
  changeDirection: 'up' | 'down' | 'neutral';
  changePercent: number;
  icon: LucideIcon;
  color: string;
}

interface GoalProgress {
  id: number;
  title: string;
  progress: number;
  milestoneCount: number;
  completedMilestones: number;
}

interface LobbyingActivity {
  id: number;
  billId: string;
  billTitle: string;
  type: string;
  impact: number;
  date: string;
  result: 'success' | 'pending' | 'failed';
}

interface TeamContribution {
  teamId: number;
  teamName: string;
  assignmentCount: number;
  completedCount: number;
  impactScore: number;
}

const ImpactVisualization = () => {
  const [activeTab, setActiveTab] = useState('personal');
  
  // Fetch user's impact data
  const { data: personalImpact, isLoading: loadingPersonal } = useQuery<any>({
    queryKey: ['/api/lobbying/stats'],
    enabled: activeTab === 'personal'
  });
  
  // Fetch user's goal progress
  const { data: goalProgress, isLoading: loadingGoals } = useQuery<any>({
    queryKey: ['/api/goals/stats'],
    enabled: true
  });
  
  // Fetch user's team contributions
  const { data: teamContributions, isLoading: loadingTeam } = useQuery<any>({
    queryKey: ['/api/users/me/assignments'],
    enabled: activeTab === 'team'
  });
  
  // Sample metrics for visualization
  const impactMetrics: ImpactMetric[] = [
    {
      id: 'bills-influenced',
      label: 'Bills Influenced',
      value: personalImpact?.billsInfluenced || 0,
      changeDirection: 'up',
      changePercent: 12,
      icon: AlertCircle,
      color: 'bg-blue-500'
    },
    {
      id: 'actions-taken',
      label: 'Actions Taken',
      value: personalImpact?.actionsTaken || 0,
      changeDirection: 'up',
      changePercent: 8,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      id: 'people-reached',
      label: 'People Reached',
      value: personalImpact?.peopleReached || 0,
      changeDirection: 'up',
      changePercent: 24,
      icon: Share2,
      color: 'bg-purple-500'
    },
    {
      id: 'community-rank',
      label: 'Community Rank',
      value: personalImpact?.communityRank || 0,
      changeDirection: 'up',
      changePercent: 5,
      icon: TrendingUp,
      color: 'bg-amber-500'
    }
  ];
  
  const renderChangeIndicator = (direction: 'up' | 'down' | 'neutral', percent: number) => {
    const color = direction === 'up' ? 'text-green-500' : direction === 'down' ? 'text-red-500' : 'text-gray-500';
    const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? ThumbsDown : AlertCircle;
    
    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="w-4 h-4 mr-1" />
        <span className="text-sm">{percent}%</span>
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Civic Impact</CardTitle>
        <CardDescription>
          Visualization of how your actions affect legislation and communities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <Home className="mr-2 h-4 w-4" />
              Personal Impact
            </TabsTrigger>
            <TabsTrigger value="family">
              <Users className="mr-2 h-4 w-4" />
              Family Impact
            </TabsTrigger>
            <TabsTrigger value="community">
              <Building2 className="mr-2 h-4 w-4" />
              Community Impact
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {impactMetrics.map((metric) => (
                <Card key={metric.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${metric.color} mr-3`}>
                        <metric.icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                    </div>
                    {renderChangeIndicator(metric.changeDirection, metric.changePercent)}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Goal Progress</h3>
                <Button variant="outline" size="sm">View All Goals</Button>
              </div>
              
              <div className="space-y-4">
                {goalProgress?.goals?.slice(0, 3).map((goal: GoalProgress) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {goal.completedMilestones}/{goal.milestoneCount} milestones
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                )) || (
                  <div className="text-center p-6 text-muted-foreground">
                    <div className="mb-2">No active goals yet</div>
                    <Button size="sm">Create Your First Goal</Button>
                  </div>
                )}
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Lobbying Activities</h3>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              
              <div className="space-y-4">
                {personalImpact?.recentActivities?.slice(0, 3).map((activity: LobbyingActivity) => (
                  <Card key={activity.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">{activity.billTitle}</div>
                        <Badge variant={
                          activity.result === 'success' ? 'default' :
                          activity.result === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {activity.result}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{activity.type}</div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Impact score: {activity.impact}</span>
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="text-center p-6 text-muted-foreground">
                    <div className="mb-2">No lobbying activities yet</div>
                    <Button size="sm">Take Your First Action</Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="family" className="pt-4">
            <div className="text-center p-10">
              <h3 className="text-xl font-semibold mb-4">Family Impact Coming Soon</h3>
              <p className="text-muted-foreground mb-6">
                Soon you'll be able to see how legislation affects your family members and invite them to join your advocacy efforts.
              </p>
              <Button disabled>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Family (Coming Soon)
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="community" className="pt-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Community Support</CardTitle>
                    <CardDescription>How your community views this legislation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ThumbsUp className="h-5 w-5 text-green-500 mr-2" />
                        <span>Support</span>
                      </div>
                      <div className="font-bold">68%</div>
                    </div>
                    <Progress value={68} className="h-2 bg-gray-200" />
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center">
                        <ThumbsDown className="h-5 w-5 text-red-500 mr-2" />
                        <span>Oppose</span>
                      </div>
                      <div className="font-bold">32%</div>
                    </div>
                    <Progress value={32} className="h-2 bg-gray-200" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Community Activity</CardTitle>
                    <CardDescription>Recent engagement in your area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Letters to Representatives</span>
                        <Badge>243</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Public Comments</span>
                        <Badge>156</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Testimony at Hearings</span>
                        <Badge>34</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Local Meetings</span>
                        <Badge>18</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Regional Impact</CardTitle>
                  <CardDescription>How legislation affects your area specifically</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Economic Impact</span>
                      <span className="text-green-500 font-medium">+$4.2M estimated</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Jobs</span>
                      <span className="text-green-500 font-medium">+230 estimated</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Public Services</span>
                      <span className="text-amber-500 font-medium">±0 estimated</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Regulatory Burden</span>
                      <span className="text-red-500 font-medium">+12% estimated</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImpactVisualization;