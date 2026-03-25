import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import { useQuery } from "@tanstack/react-query";
import { cn, getRoleColor, getChallengeStatusClass } from "@/lib/utils";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface Challenge {
  id: number;
  name: string;
  description: string;
  progress?: number;
  status: string;
  completed?: boolean;
}

export function ChallengesCard() {
  const { superUser } = useUser();
  
  const { data: userChallenges, isLoading } = useQuery<any>({
    queryKey: ['/api/user-challenges/1'],
    enabled: !!superUser
  });
  
  if (!superUser) return null;
  
  const roleColorText = getRoleColor(superUser.role);
  
  // Fallback challenges when API data isn't available yet
  const fallbackChallenges: Challenge[] = [
    {
      id: 1,
      name: 'Influence Wave Challenge',
      description: 'Activate 3 people who each take at least one action within 72 hours',
      progress: 66,
      status: 'in progress',
      completed: false
    },
    {
      id: 2,
      name: 'District Impact Challenge',
      description: 'Build a network of 10+ active citizens in your district by June 30',
      progress: 60,
      status: '55% complete',
      completed: false
    },
    {
      id: 3,
      name: 'Super Spreader Bootcamp',
      description: 'Complete the full training series to unlock advanced amplifier tools',
      progress: 0,
      status: 'not started',
      completed: false
    }
  ];
  
  const challenges = userChallenges || fallbackChallenges;

  return (
    <Card>
      <CardHeader className="p-5 border-b border-gray-200">
        <h3 className="font-heading font-semibold text-lg text-dark">Active Challenges</h3>
        <p className="text-sm text-gray-600">
          Designed for your {superUser.role.charAt(0).toUpperCase() + superUser.role.slice(1)} strengths
        </p>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-5">
          {challenges.map((challenge: any) => (
            <div key={challenge.id} className="group">
              <div className="flex justify-between items-start">
                <h4 className={cn(
                  "text-sm font-medium text-gray-900 group-hover:text-" + superUser.role
                )}>
                  {challenge.name}
                </h4>
                <Badge className={getChallengeStatusClass(challenge.status)}>
                  {challenge.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {challenge.description}
              </p>
              
              {challenge.progress !== undefined && challenge.progress > 0 && (
                <div className="mt-2">
                  <div className="flex items-center text-xs">
                    <span className="text-gray-500">Progress:</span>
                    <span className="ml-auto font-medium">
                      {challenge.progress === 66 ? '2/3 completed' : 
                       challenge.progress === 60 ? '6/10 people' : 
                       `${challenge.progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={cn(`bg-${superUser.role} h-1.5 rounded-full`)}
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <Link href={`/challenges/${challenge.id}`}>
                <a className={cn(
                  "mt-2 text-xs font-medium hover:underline inline-flex items-center",
                  roleColorText
                )}>
                  {challenge.status === 'not started' ? 'Start bootcamp' : 'View details'}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </a>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3 rounded-b-lg">
        <Link href="/challenges">
          <a className={cn(
            "text-sm font-medium hover:underline inline-flex items-center",
            roleColorText
          )}>
            Browse all challenges
            <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
