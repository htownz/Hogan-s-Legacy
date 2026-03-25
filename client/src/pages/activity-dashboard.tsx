import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";

// Import our new enhanced components
import ActivityTimeline from "@/components/user-activity/ActivityTimeline";
import AchievementSection from "@/components/user-activity/AchievementSection";
import ChallengeSection from "@/components/user-activity/ChallengeSection";
import { AchievementCard, type Achievement } from "@/components/user-activity/AchievementCard";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2,
  RefreshCw,
  PlusCircle,
  BarChart,
  LineChart,
  Activity,
  Calendar,
  BookOpen,
  Users,
  Trophy,
  Award,
  UserCheck,
  Target,
  GanttChartSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define interfaces
interface CurrentUser {
  id: number;
  username: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface UserStats {
  totalActivities: number;
  actionsTaken: number;
  currentStreak: number;
  longestStreak: number;
  impactScore: number;
  totalPoints: number;
  level: number;
  levelProgress: number;
  completedChallenges: number;
  achievements: {
    total: number;
    unlocked: number;
  };
}

const MOCK_ACTIONS = [
  { type: "view_bill", category: "engagement", points: 1 },
  { type: "share_bill", category: "community", points: 2 },
  { type: "contact_rep", category: "advocacy", points: 5 },
  { type: "join_action_circle", category: "community", points: 3 },
  { type: "read_article", category: "education", points: 1 },
  { type: "comment_on_bill", category: "engagement", points: 2 },
  { type: "attend_event", category: "advocacy", points: 4 },
  { type: "complete_quiz", category: "education", points: 3 },
];

export default function ActivityDashboard() {
  const { user, superUserRole } = useUser();
  const { toast } = useToast();
  const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  
  // Fetch current user if not available from useUser() hook
  const { data: currentUser, isLoading: userLoading } = useQuery<CurrentUser>({
    queryKey: ['/api/users/me'],
    enabled: !user?.id,
  });
  
  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/user-activities/stats', userId],
    enabled: !!userId,
  });
  
  // Fetch featured achievements (most recent or significant)
  const { data: featuredAchievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/user-achievements/featured', userId],
    enabled: !!userId,
  });
  
  // Set user ID once user is loaded either from useUser hook or from query
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    } else if (currentUser?.id) {
      setUserId(currentUser.id);
    }
  }, [user, currentUser]);
  
  // Track a mock activity for demo purposes
  const trackMockActivity = async () => {
    try {
      setIsGeneratingActivity(true);
      // Select a random activity type
      const randomActivity = MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)];
      
      await apiRequest('/api/user-activities', 'POST', {
        activityType: randomActivity.type,
        activityCategory: randomActivity.category,
        points: randomActivity.points,
        metadata: {
          demo: true,
          billId: `HB${Math.floor(1000 + Math.random() * 9000)}`,
        }
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-activities/stats'] });
      
      toast({
        title: "Activity Recorded",
        description: `Tracked "${randomActivity.type}" activity (+${randomActivity.points} points)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record activity",
        variant: "destructive"
      });
      console.error("Error tracking activity:", error);
    } finally {
      setIsGeneratingActivity(false);
    }
  };

  // Handle loading state
  const isLoading = userLoading || statsLoading;
  if (isLoading && !userId) {
    return (
      <ScrollArea className="container max-w-screen-xl mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading your activity data...</p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="container max-w-screen-xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Personal Impact Dashboard</h1>
        <p className="text-muted-foreground">
          Track and visualize your civic engagement activities and impact
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Civic Engagement Stats
              </CardTitle>
              <CardDescription>
                Your progress and impact across all activities
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { 
                    label: 'Activities', 
                    value: userStats?.totalActivities || '0', 
                    icon: Activity, 
                    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                  },
                  { 
                    label: 'Actions Taken', 
                    value: userStats?.actionsTaken || '0', 
                    icon: UserCheck, 
                    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                  },
                  { 
                    label: 'Daily Streak', 
                    value: userStats?.currentStreak || '0', 
                    icon: RefreshCw, 
                    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
                  },
                  { 
                    label: 'Impact Score', 
                    value: userStats?.impactScore || '0', 
                    icon: Target, 
                    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                  },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center p-3 rounded-lg border hover:shadow-sm transition-shadow">
                    <div className={`p-2 rounded-full ${item.color} mb-2`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold">{item.value}</span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              
              {superUserRole && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-medium text-sm flex items-center">
                        <Trophy className="h-4 w-4 mr-1 text-primary" />
                        {superUserRole.role.charAt(0).toUpperCase() + superUserRole.role.slice(1)} Level Progress
                      </h3>
                      <p className="text-xs text-muted-foreground">Level {superUserRole.level}: {superUserRole.progressToNextLevel}% to next level</p>
                    </div>
                    <Badge variant="outline" className="font-normal">
                      {userStats?.totalPoints || 0} points total
                    </Badge>
                  </div>
                  <Progress value={superUserRole.progressToNextLevel} className="h-2" />
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={trackMockActivity} 
                  disabled={isGeneratingActivity || !userId}
                >
                  {isGeneratingActivity ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Record Demo Activity
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Featured Achievements Card */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Recent Achievements
              </CardTitle>
              <CardDescription>
                Your latest accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {achievementsLoading ? (
                <div className="space-y-3">
                  {Array(2).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border rounded-lg animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-muted"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : featuredAchievements && featuredAchievements.length > 0 ? (
                <div className="space-y-2">
                  {featuredAchievements.slice(0, 2).map((achievement: Achievement, index: number) => (
                    <AchievementCard 
                      key={achievement.id} 
                      achievement={achievement}
                      variant="compact"
                      animationDelay={index * 0.1}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Award className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Complete activities to earn achievements</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full text-primary">
                View All Achievements
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="activity" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Activity Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex items-center gap-1">
              <LineChart className="h-4 w-4" />
              <span>Impact Analytics</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Activity Timeline Tab */}
          <TabsContent value="activity">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <ActivityTimeline 
                  userId={userId || undefined}
                  limit={15}
                  maxHeight="600px"
                  highlightCategories={["advocacy", "achievement"]}
                />
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GanttChartSquare className="h-5 w-5 text-primary" />
                      Activity Breakdown
                    </CardTitle>
                    <CardDescription>
                      How you're making an impact
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { category: 'Engagement', value: 40, color: 'bg-blue-500' },
                        { category: 'Advocacy', value: 25, color: 'bg-green-500' },
                        { category: 'Education', value: 20, color: 'bg-purple-500' },
                        { category: 'Community', value: 15, color: 'bg-amber-500' },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.category}</span>
                            <span className="font-medium">{item.value}%</span>
                          </div>
                          <Progress value={item.value} className={`h-2 ${item.color}`} />
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-3">Top Activities</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'Bill tracking', count: 12 },
                          { label: 'Comments', count: 8 },
                          { label: 'Education completed', count: 6 },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <Badge variant="secondary" className="font-normal">
                              {item.count} activities
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <AchievementSection userId={userId || undefined} />
          </TabsContent>
          
          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <ChallengeSection userId={userId || undefined} />
          </TabsContent>
          
          {/* Impact Analytics Tab */}
          <TabsContent value="impact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Over Time</CardTitle>
                  <CardDescription>Your engagement pattern</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center p-4">
                    <BarChart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium">Analytics Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md">
                      Detailed analytics about your civic engagement patterns and impact will be available here soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Impact</CardTitle>
                  <CardDescription>How your actions affect others</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                  <div className="text-center p-4">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium">Impact Data Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md">
                      Soon you'll be able to see how your civic actions influence your community and drive policy changes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}