import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  AlertCircle,
  AlertTriangle,
  Award,
  BadgeCheck,
  ChevronRight, 
  Crown, 
  FilterIcon,
  Lock, 
  MoreHorizontal, 
  Search, 
  Trophy
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AchievementCard, type Achievement } from "./AchievementCard";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Define achievement categories
const ACHIEVEMENT_CATEGORIES = [
  { id: "all", label: "All", icon: <BadgeCheck className="h-4 w-4" /> },
  { id: "learning", label: "Learning", icon: <Award className="h-4 w-4" /> },
  { id: "engagement", label: "Engagement", icon: <Crown className="h-4 w-4" /> },
  { id: "advocacy", label: "Advocacy", icon: <AlertCircle className="h-4 w-4" /> },
  { id: "community", label: "Community", icon: <Trophy className="h-4 w-4" /> }
];

// Demo data for user status progress - in a real app, this would come from the API
interface UserStats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  currentPoints: number;
  totalProgress: number;
}

// Interface for component props
interface AchievementSectionProps {
  userId?: number;
  limit?: number;
  showFilters?: boolean;
  title?: string;
  description?: string;
}

export default function AchievementSection({
  userId,
  limit,
  showFilters = true,
  title = "Achievements & Recognition",
  description = "Track your civic engagement achievements and milestones"
}: AchievementSectionProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");

  // Fetch user's achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/user-achievements', userId],
    enabled: !!userId,
  });

  // Fetch user's achievement stats
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/user-achievements/stats', userId],
    enabled: !!userId,
  });

  // If either data is loading, show loading state
  const isLoading = achievementsLoading || statsLoading;

  // Filter achievements based on selected category and search query
  const filteredAchievements = achievements
    ? achievements.filter(achievement => {
        const matchesCategory = activeCategory === "all" || achievement.category === activeCategory;
        const matchesSearch = !searchQuery || 
          achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesCategory && matchesSearch;
      })
    : [];

  // Sort achievements: first by unlocked (unlocked first), then by most recently earned
  const sortedAchievements = [...(filteredAchievements || [])].sort((a, b) => {
    // Sort by unlocked status first
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    
    // For unlocked achievements, sort by most recently earned
    if (a.unlocked && b.unlocked && a.earnedAt && b.earnedAt) {
      return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
    }
    
    // For locked achievements, sort by points (higher points first)
    return (b.points || 0) - (a.points || 0);
  });

  // Apply limit if specified
  const displayedAchievements = limit 
    ? sortedAchievements.slice(0, limit) 
    : sortedAchievements;

  return (
    <div className="space-y-6">
      {/* Achievement Overview */}
      {userStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-amber-100 text-amber-600 p-3 rounded-full mb-3">
                  <Trophy className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-1">
                  {userStats.unlockedAchievements} / {userStats.totalAchievements}
                </h3>
                <p className="text-muted-foreground text-sm">Achievements Unlocked</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary-100 text-primary-600 p-3 rounded-full mb-3">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-1">
                  {userStats.totalPoints}
                </h3>
                <p className="text-muted-foreground text-sm">Total Points Earned</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Level {userStats.level}</span>
                  <span className="text-sm font-medium">{userStats.currentPoints} / {userStats.nextLevelPoints} points</span>
                </div>
                <Progress value={userStats.totalProgress} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {userStats.nextLevelPoints - userStats.currentPoints} points until next level
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      {/* Search and filter bar */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search achievements..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveCategory("all")}>
                  All Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveCategory("learning")}>
                  Learning Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveCategory("engagement")}>
                  Engagement Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveCategory("advocacy")}>
                  Advocacy Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveCategory("community")}>
                  Community Achievements
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={cn(
                  "p-2 transition-colors",
                  displayMode === "grid" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent hover:bg-muted"
                )}
                onClick={() => setDisplayMode("grid")}
                aria-label="Grid view"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 1h4v4h-4V1zm8 0h4v4h-4V1zm-8 8h4v4h-4V9zm8 0h4v4h-4V9z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </button>
              
              <button
                className={cn(
                  "p-2 transition-colors",
                  displayMode === "list" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent hover:bg-muted"
                )}
                onClick={() => setDisplayMode("list")}
                aria-label="List view"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 3h12v1h-12V3zm0 4h12v1h-12V7zm0 4h12v1h-12v-1z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs for categories */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-4">
          {ACHIEVEMENT_CATEGORIES.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
              {category.icon}
              <span>{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeCategory} forceMount>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Card key={i} className="bg-muted/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-muted rounded w-1/4 animate-pulse"></div>
                          <div className="h-3 bg-muted rounded w-1/4 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {displayedAchievements.length === 0 ? (
                <Card className="bg-muted/20">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-muted rounded-full mb-3">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Achievements Found</h3>
                    <p className="text-muted-foreground max-w-md">
                      {searchQuery 
                        ? "No achievements match your search criteria. Try a different search term." 
                        : activeCategory !== "all" 
                          ? `You don't have any ${activeCategory} achievements yet. Continue engaging to unlock more!`
                          : "Continue your civic engagement journey to unlock achievements!"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className={
                  displayMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
                    : "flex flex-col gap-3"
                }>
                  {displayedAchievements.map((achievement, index) => (
                    <AchievementCard 
                      key={achievement.id}
                      achievement={achievement}
                      animationDelay={index * 0.05}
                      variant={displayMode === "list" ? "compact" : "default"}
                      showCategory={activeCategory === "all"}
                    />
                  ))}
                </div>
              )}
              
              {!limit && achievements && achievements.length > 8 && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline">
                    View All {achievements.length} Achievements
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}