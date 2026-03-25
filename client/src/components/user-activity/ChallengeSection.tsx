import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  AlertTriangle,
  ArrowRight,
  Clock,
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  Target,
  Trophy,
  Zap
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// Challenge types with all necessary properties
export interface Challenge {
  id: number;
  title: string;
  description: string;
  role: string; // 'catalyst', 'amplifier', 'convincer', 'all'
  requiredLevel: number;
  rewardPoints: number;
  rewardBadges: string[];
  daysAvailable: number;
  startedAt?: string;
  endDate?: string;
  isActive: boolean;
  progress?: number;
  total?: number;
  userStarted?: boolean;
  metadata?: Record<string, any>;
}

// Helper functions for role-specific styling
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'catalyst': return 'primary';
    case 'amplifier': return 'indigo';
    case 'convincer': return 'purple';
    default: return 'neutral';
  }
};

const getRoleBgClass = (role: string): string => {
  switch (role) {
    case 'catalyst': return 'bg-primary-50';
    case 'amplifier': return 'bg-indigo-50';
    case 'convincer': return 'bg-purple-50';
    default: return 'bg-neutral-50';
  }
};

const getRoleTextClass = (role: string): string => {
  switch (role) {
    case 'catalyst': return 'text-primary-600';
    case 'amplifier': return 'text-indigo-600';
    case 'convincer': return 'text-purple-600';
    default: return 'text-neutral-600';
  }
};

const getRoleBorderClass = (role: string): string => {
  switch (role) {
    case 'catalyst': return 'border-primary-200';
    case 'amplifier': return 'border-indigo-200';
    case 'convincer': return 'border-purple-200';
    default: return 'border-neutral-200';
  }
};

const getRoleProgressClass = (role: string): string => {
  switch (role) {
    case 'catalyst': return 'bg-primary-500';
    case 'amplifier': return 'bg-indigo-500';
    case 'convincer': return 'bg-purple-500';
    default: return 'bg-neutral-500';
  }
};

const getChallengeIcon = (challenge: Challenge) => {
  if (challenge.role === 'catalyst') {
    return <Zap className="h-5 w-5" />;
  } else if (challenge.role === 'amplifier') {
    return <Trophy className="h-5 w-5" />;
  } else if (challenge.role === 'convincer') {
    return <Target className="h-5 w-5" />;
  } else {
    return <Star className="h-5 w-5" />;
  }
};

// Interface for component props
interface ChallengeSectionProps {
  userId?: number;
  limit?: number;
  showFilters?: boolean;
  showAll?: boolean;
  title?: string;
  description?: string;
}

export default function ChallengeSection({
  userId,
  limit,
  showFilters = true,
  showAll = false,
  title = "Active Challenges",
  description = "Complete challenges to increase your impact and earn rewards"
}: ChallengeSectionProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch user's challenges
  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges', userId],
    enabled: !!userId,
  });

  // Handle starting or continuing a challenge
  const handleChallengeAction = (challenge: Challenge) => {
    if (!challenge.userStarted) {
      toast({
        title: "Challenge Started",
        description: `You've started the "${challenge.title}" challenge!`,
      });
    } else {
      toast({
        title: "Challenge Continued",
        description: `Continue working on the "${challenge.title}" challenge.`,
      });
    }
  };

  // Filter challenges based on the active filter
  const filteredChallenges = challenges
    ? challenges.filter(challenge => {
        // Filter based on active filter
        if (activeFilter === "active") {
          return challenge.isActive && (showAll || challenge.userStarted);
        } else if (activeFilter === "available") {
          return challenge.isActive && !challenge.userStarted;
        } else if (activeFilter === "completed") {
          return challenge.userStarted && challenge.progress === challenge.total;
        }

        // Filter based on search query if needed
        return challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

  // Sort challenges: active first, then by progress
  const sortedChallenges = [...(filteredChallenges || [])].sort((a, b) => {
    // Userstarted first
    if (a.userStarted && !b.userStarted) return -1;
    if (!a.userStarted && b.userStarted) return 1;
    
    // Sort by progress (higher progress first)
    if (a.userStarted && b.userStarted) {
      const aProgress = (a.progress || 0) / (a.total || 1);
      const bProgress = (b.progress || 0) / (b.total || 1);
      return bProgress - aProgress;
    }
    
    // Sort by reward points (higher points first)
    return b.rewardPoints - a.rewardPoints;
  });

  // Apply limit if specified
  const displayedChallenges = limit 
    ? sortedChallenges.slice(0, limit) 
    : sortedChallenges;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-auto">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex border rounded-md overflow-hidden ml-2">
              <button
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent hover:bg-muted"
                )}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              
              <button
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-transparent hover:bg-muted"
                )}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Search bar */}
      {showFilters && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search challenges..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      
      {/* Challenges Grid/List */}
      {challengesLoading ? (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-4"
        }>
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-muted/20">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                  <div className="h-2 bg-muted rounded w-full animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedChallenges.length === 0 ? (
        <Card className="bg-muted/20">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-muted rounded-full mb-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Challenges Found</h3>
            <p className="text-muted-foreground max-w-md">
              {searchQuery 
                ? "No challenges match your search criteria. Try a different search term." 
                : activeFilter === "active" 
                  ? "You don't have any active challenges. Start a new challenge to see it here."
                  : activeFilter === "available"
                    ? "There are no available challenges at the moment. Check back later for new opportunities!"
                    : "You haven't completed any challenges yet. Keep working on your active challenges!"}
            </p>
            {activeFilter === "active" && (
              <Button className="mt-4" variant="outline" onClick={() => setActiveFilter("available")}>
                Browse Available Challenges
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-4"
        }>
          {displayedChallenges.map((challenge, index) => (
            viewMode === "grid" ? (
              <GridChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                onAction={() => handleChallengeAction(challenge)}
                delay={index * 0.05}
              />
            ) : (
              <ListChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                onAction={() => handleChallengeAction(challenge)}
                delay={index * 0.05}
              />
            )
          ))}
        </div>
      )}
      
      {!limit && challenges && challenges.length > 6 && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline">
            View All {challenges.length} Challenges
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Grid view challenge card
interface ChallengeCardProps {
  challenge: Challenge;
  onAction: () => void;
  delay?: number;
}

function GridChallengeCard({ challenge, onAction, delay = 0 }: ChallengeCardProps) {
  const roleColor = getRoleColor(challenge.role);
  const roleBg = getRoleBgClass(challenge.role);
  const roleText = getRoleTextClass(challenge.role);
  const roleBorder = getRoleBorderClass(challenge.role);
  const progressClass = getRoleProgressClass(challenge.role);
  
  const progressPercentage = challenge.userStarted && challenge.progress !== undefined && challenge.total 
    ? Math.min(100, Math.round((challenge.progress / challenge.total) * 100))
    : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={cn(
        "overflow-hidden border transition-all",
        challenge.userStarted ? roleBorder : "border-neutral-200",
        "hover:shadow-md"
      )}>
        <div className={cn(
          "px-4 py-3 flex items-center border-b",
          roleBg
        )}>
          <div className="flex items-center">
            <Badge variant="outline" className={cn("font-normal", roleText)}>
              {challenge.role.charAt(0).toUpperCase() + challenge.role.slice(1)}
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto flex items-center gap-1 text-xs text-neutral-600">
                  <Clock className="h-3 w-3" />
                  <span>{challenge.daysAvailable} days</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time remaining to complete this challenge</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start mb-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-gradient-to-br",
              challenge.role === 'catalyst' 
                ? "from-primary-100 to-primary-50 text-primary-600" 
                : challenge.role === 'amplifier'
                  ? "from-indigo-100 to-indigo-50 text-indigo-600"
                  : challenge.role === 'convincer'
                    ? "from-purple-100 to-purple-50 text-purple-600"
                    : "from-amber-100 to-amber-50 text-amber-600"
            )}>
              {getChallengeIcon(challenge)}
            </div>
            
            <div>
              <h3 className="font-semibold text-neutral-800">{challenge.title}</h3>
              <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
                {challenge.description}
              </p>
            </div>
          </div>
          
          <div className={cn(challenge.userStarted ? "" : "opacity-60")}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-500">Progress</span>
              {challenge.userStarted && challenge.progress !== undefined && challenge.total !== undefined ? (
                <span className="font-medium">
                  {challenge.progress}/{challenge.total} completed
                </span>
              ) : (
                <span>Not started</span>
              )}
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 mb-3"
              indicatorClassName={progressClass}
            />
          </div>
          
          <div className="flex items-start mt-4 mb-4">
            <div className="bg-amber-50 p-1.5 rounded text-amber-600">
              <Star className="h-4 w-4" />
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium">Reward:</p>
              <div className="text-xs text-neutral-600">
                <span className="font-medium">{challenge.rewardPoints} points</span>
                {challenge.rewardBadges && challenge.rewardBadges.length > 0 && (
                  <span> + {challenge.rewardBadges.length} {challenge.rewardBadges.length === 1 ? 'badge' : 'badges'}</span>
                )}
              </div>
            </div>
          </div>
          
          <Button 
            className={cn(
              "w-full",
              challenge.userStarted
                ? `bg-${roleColor}-500 hover:bg-${roleColor}-600 text-white`
                : ""
            )}
            onClick={onAction}
          >
            {challenge.userStarted ? (
              <>
                Continue Challenge
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Start Challenge
                <Plus className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// List view challenge card
function ListChallengeCard({ challenge, onAction, delay = 0 }: ChallengeCardProps) {
  const roleColor = getRoleColor(challenge.role);
  const roleBg = getRoleBgClass(challenge.role);
  const roleText = getRoleTextClass(challenge.role);
  const roleBorder = getRoleBorderClass(challenge.role);
  const progressClass = getRoleProgressClass(challenge.role);
  
  const progressPercentage = challenge.userStarted && challenge.progress !== undefined && challenge.total 
    ? Math.min(100, Math.round((challenge.progress / challenge.total) * 100))
    : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={cn(
        "overflow-hidden border transition-all",
        challenge.userStarted ? roleBorder : "border-neutral-200",
        "hover:shadow-sm"
      )}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-start md:items-center gap-3 flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                challenge.role === 'catalyst' 
                  ? "from-primary-100 to-primary-50 text-primary-600" 
                  : challenge.role === 'amplifier'
                    ? "from-indigo-100 to-indigo-50 text-indigo-600"
                    : challenge.role === 'convincer'
                      ? "from-purple-100 to-purple-50 text-purple-600"
                      : "from-amber-100 to-amber-50 text-amber-600"
              )}>
                {getChallengeIcon(challenge)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-medium text-neutral-800 truncate">{challenge.title}</h3>
                  <Badge variant="outline" className={cn("font-normal", roleText)}>
                    {challenge.role.charAt(0).toUpperCase() + challenge.role.slice(1)}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-neutral-500 ml-auto md:ml-0">
                    <Clock className="h-3 w-3" />
                    <span>{challenge.daysAvailable} days left</span>
                  </div>
                </div>
                
                <p className="text-sm text-neutral-600 line-clamp-1 mb-2 md:mb-0">
                  {challenge.description}
                </p>
                
                <div className="flex md:hidden mt-2 w-full">
                  <div className="w-full">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-500">Progress</span>
                      {challenge.userStarted && challenge.progress !== undefined && challenge.total !== undefined ? (
                        <span className="font-medium">
                          {challenge.progress}/{challenge.total}
                        </span>
                      ) : (
                        <span>Not started</span>
                      )}
                    </div>
                    <Progress 
                      value={progressPercentage} 
                      className="h-2"
                      indicatorClassName={progressClass}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-500">Progress</span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2"
                  indicatorClassName={progressClass}
                />
              </div>
              
              <div className="flex items-center gap-1 text-xs min-w-[80px]">
                <Star className="h-3 w-3 text-amber-500" />
                <span className="text-neutral-700 font-medium">{challenge.rewardPoints} pts</span>
              </div>
              
              <Button 
                className={cn(
                  "min-w-[140px]",
                  challenge.userStarted
                    ? `bg-${roleColor}-500 hover:bg-${roleColor}-600 text-white`
                    : ""
                )}
                size="sm"
                onClick={onAction}
              >
                {challenge.userStarted ? "Continue" : "Start Challenge"}
              </Button>
            </div>
            
            <div className="md:hidden flex justify-end">
              <Button 
                className={cn(
                  challenge.userStarted
                    ? `bg-${roleColor}-500 hover:bg-${roleColor}-600 text-white`
                    : ""
                )}
                size="sm"
                onClick={onAction}
              >
                {challenge.userStarted ? "Continue" : "Start"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}