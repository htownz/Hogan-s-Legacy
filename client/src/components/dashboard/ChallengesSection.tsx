// @ts-nocheck
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SuperUserRole, Challenge, UserChallenge, ChallengeWithProgress } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { RoleBadge } from "@/components/ui/role-badge";

interface ChallengesSectionProps {
  userRole?: SuperUserRole;
  userChallenges?: UserChallenge[];
  isLoading: boolean;
}

export default function ChallengesSection({ userRole, userChallenges, isLoading }: ChallengesSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const response = await fetch('/api/challenges');
        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const data: Challenge[] = await response.json();
        
        // Add user progress data to challenges
        const enhancedChallenges = data.map(challenge => {
          const userChallenge = userChallenges?.find(uc => uc.challengeId === challenge.id);
          const enhancedChallenge: ChallengeWithProgress = {
            ...challenge,
            userProgress: userChallenge?.progress || 0,
            userTotal: userChallenge?.total || 100,
            userCompleted: userChallenge?.completed || false,
            userStarted: !!userChallenge
          };
          return enhancedChallenge;
        });
        
        setChallenges(enhancedChallenges);
        setLoadingChallenges(false);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        setLoadingChallenges(false);
      }
    }

    if (userRole && !isLoading) {
      fetchChallenges();
    }
  }, [userRole, userChallenges, isLoading]);

  const startChallenge = async (challengeId: number) => {
    try {
      await apiRequest('POST', `/api/users/me/challenges/${challengeId}`, {});
      
      // Invalidate and refetch user challenges
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/challenges'] });
      
      toast({
        title: "Challenge started!",
        description: "You've successfully started a new challenge.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  const continueChallenge = async (challengeId: number) => {
    // In a real application, this might navigate to a challenge detail page
    toast({
      title: "Challenge in progress",
      description: "Continue working on your challenge!",
    });
  };

  if (isLoading || loadingChallenges) {
    return (
      <Card className="shadow mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-80 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-neutral-50 px-6 py-3 flex justify-between items-center">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
      </Card>
    );
  }

  // Get role-specific challenges and others applicable to the user
  const filteredChallenges = challenges
    .filter(challenge => 
      challenge.role === userRole?.role || 
      challenge.role === 'all' || 
      (challenge.requiredLevel <= (userRole?.level || 1))
    )
    .sort((a, b) => {
      // Sort by started/in-progress first, then by required level
      const aStarted = a.userStarted ? 1 : 0;
      const bStarted = b.userStarted ? 1 : 0;
      return bStarted - aStarted || a.requiredLevel - b.requiredLevel;
    })
    .slice(0, 3); // Show only 3 challenges

  return (
    <Card className="shadow mb-8 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800">Challenges & Campaigns</h2>
        <p className="text-sm text-neutral-500 mt-1">Complete challenges to increase your influence and drive civic change</p>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChallenges.map((challenge) => (
            <div 
              key={challenge.id} 
              className="border border-neutral-200 rounded-lg overflow-hidden card-hover-effect"
            >
              <div className={`px-4 py-3 flex items-center ${getRoleBgClass(challenge.role)}`}>
                <RoleBadge role={challenge.role as any} className="text-xs" />
                <span className="ml-auto text-xs text-neutral-700 font-medium">
                  {challenge.userStarted ? (challenge.daysAvailable > 0 ? `${challenge.daysAvailable} days left` : 'Ongoing') : 'Available'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-neutral-800 text-lg mb-2">{challenge.title}</h3>
                <p className="text-sm text-neutral-600 mb-4">{challenge.description}</p>
                
                <div className={`mb-4 ${!challenge.userStarted ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {challenge.userStarted 
                        ? `${challenge.userProgress}/${challenge.userTotal} complete` 
                        : 'Not Started'}
                    </span>
                  </div>
                  <Progress 
                    value={challenge.userStarted ? (challenge.userProgress! / challenge.userTotal!) * 100 : 0} 
                    className="h-2"
                    indicatorClassName={getRoleProgressClass(challenge.role)}
                  />
                </div>
                
                <div className="flex items-center text-sm text-neutral-500 mb-4">
                  <Plus className={`h-5 w-5 mr-2 ${getRoleTextClass(challenge.role)}`} />
                  <span>{getImpactText(challenge)}</span>
                </div>
                
                <div className="flex flex-col">
                  <div className="text-xs text-neutral-500 mb-2">Rewards:</div>
                  <div className="flex items-center mb-2 flex-wrap gap-2">
                    {challenge.rewardBadges.map((badge: any, index: any) => (
                      <span 
                        key={index} 
                        className={`${getRoleBgClass(challenge.role)} ${getRoleDarkTextClass(challenge.role)} text-xs font-medium px-2 py-1 rounded flex items-center`}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {badge}
                      </span>
                    ))}
                    <span className={`${getRoleBgClass(challenge.role)} ${getRoleDarkTextClass(challenge.role)} text-xs font-medium px-2 py-1 rounded`}>
                      +{challenge.rewardPoints} Impact Points
                    </span>
                  </div>
                  <Button 
                    onClick={() => challenge.userStarted 
                      ? continueChallenge(challenge.id) 
                      : startChallenge(challenge.id)
                    }
                    className={getButtonClass(challenge)}
                    variant={challenge.userStarted ? "default" : "outline"}
                    disabled={!isUserEligible(challenge, userRole)}
                  >
                    {getButtonText(challenge, userRole)}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="bg-neutral-50 px-6 py-3 flex justify-between items-center">
        <div className="text-sm text-neutral-500">New challenges available weekly</div>
        <Button variant="link" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
          View All Challenges
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper functions
function getRoleBgClass(role: string): string {
  switch (role) {
    case 'catalyst': return 'bg-primary-50';
    case 'amplifier': return 'bg-secondary-50';
    case 'convincer': return 'bg-alert-50';
    default: return 'bg-neutral-50';
  }
}

function getRoleProgressClass(role: string): string {
  switch (role) {
    case 'catalyst': return 'bg-primary-500';
    case 'amplifier': return 'bg-secondary-500';
    case 'convincer': return 'bg-alert-500';
    default: return 'bg-neutral-500';
  }
}

function getRoleTextClass(role: string): string {
  switch (role) {
    case 'catalyst': return 'text-primary-500';
    case 'amplifier': return 'text-secondary-500';
    case 'convincer': return 'text-alert-500';
    default: return 'text-neutral-500';
  }
}

function getRoleDarkTextClass(role: string): string {
  switch (role) {
    case 'catalyst': return 'text-primary-800';
    case 'amplifier': return 'text-secondary-800';
    case 'convincer': return 'text-alert-800';
    default: return 'text-neutral-800';
  }
}

function getButtonClass(challenge: ChallengeWithProgress): string {
  if (!challenge.userStarted) {
    return "";
  }
  
  switch (challenge.role) {
    case 'catalyst':
      return 'bg-primary-500 hover:bg-primary-600 text-white';
    case 'amplifier':
      return 'bg-secondary-500 hover:bg-secondary-600 text-white';
    case 'convincer':
      return 'bg-alert-500 hover:bg-alert-600 text-white';
    default:
      return 'bg-neutral-500 hover:bg-neutral-600 text-white';
  }
}

function getButtonText(challenge: ChallengeWithProgress, userRole?: SuperUserRole): string {
  if (!isUserEligible(challenge, userRole)) {
    return `Requires ${challenge.role === 'all' ? `Level ${challenge.requiredLevel}` : `${capitalizeFirstLetter(challenge.role)} Role`}`;
  }
  
  return challenge.userStarted ? "Continue Challenge" : "Start Challenge";
}

function isUserEligible(challenge: ChallengeWithProgress, userRole?: SuperUserRole): boolean {
  if (!userRole) return false;
  
  const hasRequiredRole = challenge.role === 'all' || challenge.role === userRole.role;
  const hasRequiredLevel = userRole.level >= challenge.requiredLevel;
  
  return hasRequiredRole && hasRequiredLevel;
}

function getImpactText(challenge: ChallengeWithProgress): string {
  switch (challenge.role) {
    case 'catalyst':
      return 'Knowledge impact multiplier: x2';
    case 'amplifier':
      return 'Network impact multiplier: x2';
    case 'convincer':
      return 'Persuasion impact multiplier: x2';
    default:
      return 'Impact multiplier: x1.5';
  }
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
