import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, BookOpen, Sparkles, Zap, Users, Target, Megaphone, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  earnedAt?: string;
  level: number;
  points: number;
  iconName: string;
  unlocked: boolean;
}

// Helper to render the appropriate icon based on the icon name
const renderIcon = (iconName: string, className = "h-5 w-5") => {
  const iconProps = { className };

  switch (iconName) {
    case 'award':
      return <Award {...iconProps} />;
    case 'book':
      return <BookOpen {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'target':
      return <Target {...iconProps} />;
    case 'megaphone':
      return <Megaphone {...iconProps} />;
    case 'trophy':
      return <Trophy {...iconProps} />;
    default:
      return <Award {...iconProps} />;
  }
};

// Format achievement date
const formatDate = (dateString?: string) => {
  if (!dateString) return "Not yet earned";
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

// Single achievement card component
const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden ${achievement.unlocked ? "bg-white" : "bg-neutral-50 border-dashed"}`}>
        <CardContent className="p-4">
          <div className="flex items-start">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
              achievement.unlocked 
                ? "bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600" 
                : "bg-neutral-100 text-neutral-400"
            }`}>
              {renderIcon(achievement.iconName, "h-6 w-6")}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold ${achievement.unlocked ? "text-neutral-900" : "text-neutral-500"}`}>
                  {achievement.title}
                </h3>
                {achievement.level > 1 && (
                  <Badge variant={achievement.unlocked ? "default" : "secondary"} className="font-normal">
                    Level {achievement.level}
                  </Badge>
                )}
              </div>
              <p className={`text-sm mb-2 ${achievement.unlocked ? "text-neutral-600" : "text-neutral-400"}`}>
                {achievement.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge 
                  variant={achievement.unlocked ? "outline" : "secondary"} 
                  className={`font-normal ${achievement.unlocked ? "text-primary-600" : ""}`}
                >
                  {achievement.points} points
                </Badge>
                <span className={`text-xs ${achievement.unlocked ? "text-neutral-500" : "text-neutral-400"}`}>
                  {achievement.unlocked ? formatDate(achievement.earnedAt) : "Locked"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Loading skeleton for achievements
const AchievementSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start">
        <Skeleton className="w-12 h-12 rounded-full mr-3 flex-shrink-0" />
        <div className="w-full">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Main component
export default function AchievementsList({ userId }: { userId?: number }) {
  // Query achievements from API
  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements', userId],
    queryFn: async () => {
      try {
        const url = userId 
          ? `/api/achievements/user/${userId}` 
          : '/api/achievements/me';
        
        const response = await fetch(url);
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch achievements:", error);
        // Fallback sample achievements if API call fails
        return [
          {
            id: "civic_scholar",
            title: "Civic Scholar",
            description: "Completed your first learning module",
            category: "learning",
            earnedAt: "2025-03-15T10:30:00Z",
            level: 1,
            points: 25,
            iconName: "book",
            unlocked: true
          },
          {
            id: "bill_tracker",
            title: "Bill Tracker",
            description: "Tracked your first 5 bills",
            category: "engagement",
            earnedAt: "2025-03-16T14:45:00Z",
            level: 1,
            points: 20,
            iconName: "target",
            unlocked: true
          },
          {
            id: "action_taker",
            title: "Action Taker",
            description: "Completed your first civic action",
            category: "advocacy",
            earnedAt: "2025-03-18T09:15:00Z",
            level: 1,
            points: 30,
            iconName: "zap",
            unlocked: true
          },
          {
            id: "networker",
            title: "Networker",
            description: "Joined your first Action Circle",
            category: "community",
            earnedAt: "2025-03-20T16:30:00Z",
            level: 1,
            points: 25,
            iconName: "users",
            unlocked: true
          },
          {
            id: "community_educator",
            title: "Community Educator",
            description: "Shared 10 bills with your network",
            category: "advocacy",
            level: 1,
            points: 35,
            iconName: "megaphone",
            unlocked: false
          },
          {
            id: "super_user",
            title: "Super User",
            description: "Reached Level 2 in your Super User role",
            category: "special",
            level: 2,
            points: 100,
            iconName: "sparkles",
            unlocked: false
          },
          {
            id: "civic_expert",
            title: "Civic Expert",
            description: "Completed all basic learning modules",
            category: "learning",
            level: 2,
            points: 50,
            iconName: "book",
            unlocked: false
          },
          {
            id: "persistent_advocate",
            title: "Persistent Advocate",
            description: "Maintained a 7-day activity streak",
            category: "engagement",
            level: 1,
            points: 40,
            iconName: "trophy",
            unlocked: false
          }
        ];
      }
    }
  });

  const categories = [
    { id: "all", label: "All" },
    { id: "learning", label: "Learning" },
    { id: "engagement", label: "Engagement" },
    { id: "advocacy", label: "Advocacy" },
    { id: "community", label: "Community" },
    { id: "special", label: "Special" }
  ];

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <AchievementSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Count unlocked achievements
  const unlockedCount = achievements?.filter(a => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;
  const totalPoints = achievements?.reduce((sum, a) => a.unlocked ? sum + a.points : sum, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Trophy className="h-6 w-6 text-amber-500 mb-1" />
            <div className="text-2xl font-bold text-neutral-900">{unlockedCount}</div>
            <div className="text-sm text-neutral-500">Achievements Earned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Award className="h-6 w-6 text-primary-500 mb-1" />
            <div className="text-2xl font-bold text-neutral-900">{totalPoints}</div>
            <div className="text-sm text-neutral-500">Total Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Target className="h-6 w-6 text-green-500 mb-1" />
            <div className="text-2xl font-bold text-neutral-900">{Math.round((unlockedCount / totalCount) * 100)}%</div>
            <div className="text-sm text-neutral-500">Completion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements by category */}
      <Tabs defaultValue="all">
        <TabsList className="w-full flex mb-4 overflow-x-auto no-scrollbar">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex-1">
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements
                ?.filter(a => category.id === 'all' || a.category === category.id)
                .sort((a, b) => {
                  // Sort by unlocked status first, then by date earned
                  if (a.unlocked && !b.unlocked) return -1;
                  if (!a.unlocked && b.unlocked) return 1;
                  
                  // For unlocked items, sort by most recently earned
                  if (a.unlocked && b.unlocked && a.earnedAt && b.earnedAt) {
                    return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
                  }
                  
                  // For locked items, sort by points (higher points first)
                  return b.points - a.points;
                })
                .map(achievement => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
            </div>
            
            {achievements?.filter(a => category.id === 'all' || a.category === category.id).length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                No achievements in this category yet.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}