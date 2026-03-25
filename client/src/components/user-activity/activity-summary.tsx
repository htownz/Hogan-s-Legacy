import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Activity, Trophy, ArrowUpRight, LineChart, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

// Define types for our data structures
interface UserActivity {
  id: number;
  userId: number;
  activityType: string;
  activityCategory: string;
  points: number;
  metadata?: {
    billId?: string;
    [key: string]: any;
  };
  createdAt: string;
}

interface UserAchievement {
  id: number;
  userId: number;
  title: string;
  description: string;
  level: number;
  earnedAt: string;
}

interface UserStreak {
  id: number;
  userId: number;
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  nextRequiredActivityDate: string;
}

interface TimeActivity {
  hour: number;
  count: number;
}

const ActivitySummary = ({ userId }: { userId?: number }) => {
  const { toast } = useToast();
  
  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery<UserActivity[]>({
    queryKey: ['/api/user-activities', { limit: 5 }],
    enabled: !!userId,
  });
  
  // Fetch user achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery<UserAchievement[]>({
    queryKey: ['/api/user-achievements'],
    enabled: !!userId,
  });
  
  // Fetch streak information
  const { data: engagementStreak, isLoading: streakLoading } = useQuery<UserStreak>({
    queryKey: ['/api/user-streaks/daily_engagement'],
    enabled: !!userId,
  });
  
  // Fetch activity analytics
  const { data: activityAnalytics, isLoading: analyticsLoading } = useQuery<TimeActivity[]>({
    queryKey: ['/api/analytics/activity-by-time'],
    enabled: !!userId,
  });
  
  if (activitiesLoading || achievementsLoading || streakLoading || analyticsLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>Loading your civic engagement data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-24 bg-muted rounded w-full"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const formatActivityType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Summary
        </CardTitle>
        <CardDescription>Your recent civic engagement activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent">
          <TabsList className="mb-4">
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity: any, index: number) => (
                  <motion.div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{formatActivityType(activity.activityType)}</h4>
                        <Badge variant="outline">{activity.activityCategory}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.metadata?.billId && (
                          <span>Bill: {activity.metadata.billId} • </span>
                        )}
                        <span>{formatDistanceToNow(new Date(activity.createdAt))} ago</span>
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded px-2 py-1 text-sm font-medium text-primary">
                      +{activity.points} pts
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Start engaging with bills, contacting representatives, or joining action circles to see your activity here.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-4">
            {achievements && achievements.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {achievements.map((achievement: any, index: number) => (
                  <motion.div 
                    key={achievement.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-full">
                      <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          Level {achievement.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Earned {formatDistanceToNow(new Date(achievement.earnedAt))} ago
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Keep engaging with Act Up to earn achievements and recognition for your civic action.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="streaks" className="space-y-4">
            {engagementStreak ? (
              <div className="space-y-6">
                <motion.div 
                  className="p-4 border rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" /> 
                      Daily Engagement Streak
                    </h3>
                    <Badge variant={engagementStreak.currentStreak > 0 ? "default" : "outline"}>
                      {engagementStreak.currentStreak} days
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={engagementStreak.currentStreak % 7 === 0 ? 100 : (engagementStreak.currentStreak % 7) * 100 / 7} 
                    className="h-2 mb-2"
                  />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Current: {engagementStreak.currentStreak} days</span>
                    <span>Longest: {engagementStreak.longestStreak} days</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Next milestone: {7 - (engagementStreak.currentStreak % 7)} more days</span>
                      {engagementStreak.nextRequiredActivityDate && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Next check-in: {formatDistanceToNow(new Date(engagementStreak.nextRequiredActivityDate))}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
                
                <div className="grid grid-cols-7 gap-2 mt-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <motion.div 
                      key={i}
                      className={`h-10 rounded-md flex items-center justify-center ${
                        i < (engagementStreak.currentStreak % 7) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {i < (engagementStreak.currentStreak % 7) ? '✓' : ''}
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Streak Milestones</h4>
                  <div className="space-y-2">
                    {[3, 7, 14, 30, 60, 90].map((days) => (
                      <div key={days} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          engagementStreak.longestStreak >= days
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          {engagementStreak.longestStreak >= days ? '✓' : ''}
                        </div>
                        <span className={engagementStreak.longestStreak >= days ? 'font-medium' : 'text-muted-foreground'}>
                          {days}-day streak
                        </span>
                        {engagementStreak.currentStreak < days && engagementStreak.longestStreak < days && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {days - engagementStreak.currentStreak} days to go
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">No Active Streaks</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Visit Act Up daily to build your engagement streak and earn special achievements.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <LineChart className="h-4 w-4" /> Activity Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activityAnalytics && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Activities</span>
                          <span className="font-medium">{activityAnalytics.reduce((sum: number, item: any) => sum + item.count, 0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Most Active Time</span>
                          <span className="font-medium">
                            {activityAnalytics.length > 0 
                              ? `${activityAnalytics.reduce((max: any, current: any) => 
                                  current.count > max.count ? current : max
                                ).hour}:00` 
                              : 'N/A'}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Activity Distribution</span>
                          <span className="font-medium">
                            {activityAnalytics.length > 0 
                              ? `${activityAnalytics.filter((a: any) => a.count > 0).length} hours/day` 
                              : 'N/A'}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Engagement Rate</span>
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-green-500">+12%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Activity Categories Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Activity Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['engagement', 'advocacy', 'education', 'community'].map((category, index) => (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{category}</span>
                            <span className="font-medium">{30 - index * 5}%</span>
                          </div>
                          <Progress 
                            value={30 - index * 5} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Impact Visualization */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base font-medium">Your Civic Impact</CardTitle>
                  <CardDescription>Based on your activities and actions taken</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Bills Followed', value: '12', icon: 'document' },
                      { label: 'Actions Taken', value: '23', icon: 'check-circle' },
                      { label: 'Impact Points', value: '145', icon: 'zap' },
                    ].map((stat, index) => (
                      <motion.div 
                        key={stat.label}
                        className="bg-primary/5 rounded-lg p-4 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </motion.div>
                    ))}
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

export default ActivitySummary;