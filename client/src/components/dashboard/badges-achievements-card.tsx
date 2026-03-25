import { ArrowRight, Check, Star, Users } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import { cn, getRoleColor } from "@/lib/utils";
import { Link } from "wouter";
import { ProgressRing } from "./progress-ring";

interface BadgeProps {
  name: string;
  icon: React.ReactNode;
  earned: boolean;
  className?: string;
}

function Badge({ name, icon, earned, className }: BadgeProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={cn(
        "w-14 h-14 flex items-center justify-center rounded-full p-3",
        earned ? className : "bg-gray-200"
      )}>
        {icon}
      </div>
      <span className={cn(
        "mt-2 text-xs font-medium",
        earned ? "text-gray-700" : "text-gray-400"
      )}>
        {name}
      </span>
    </div>
  );
}

export function BadgesAchievementsCard() {
  const { superUser } = useUser();
  
  if (!superUser) return null;
  
  const roleColor = getRoleColor(superUser.role);
  const roleBgLight = `bg-${superUser.role.toLowerCase()} bg-opacity-10`;
  
  // This would come from an API in a real app
  const badges = [
    {
      id: 'network_builder',
      name: 'Network Builder',
      icon: <Check className={cn("w-full h-full", (earned: any) => earned ? `text-${superUser.role}` : "text-gray-400")} />,
      earned: true,
    },
    {
      id: 'first_circle',
      name: 'First Circle',
      icon: <Users className={cn("w-full h-full", (earned: any) => earned ? `text-${superUser.role}` : "text-gray-400")} />,
      earned: true,
    },
    {
      id: 'activations_5',
      name: '5+ Activations',
      icon: <Users className={cn("w-full h-full", (earned: any) => earned ? `text-${superUser.role}` : "text-gray-400")} />,
      earned: true,
    },
    {
      id: 'activations_10',
      name: '10+ Activations',
      icon: <Star className="w-full h-full text-gray-400" />,
      earned: false,
    }
  ];

  return (
    <Card>
      <CardHeader className="p-5 border-b border-gray-200">
        <h3 className="font-heading font-semibold text-lg text-dark">Your Badges & Recognition</h3>
        <p className="text-sm text-gray-600">Achievements and milestones</p>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex flex-wrap gap-3 mb-6">
          {badges.map(badge => (
            <Badge 
              key={badge.id}
              name={badge.name}
              icon={badge.icon}
              earned={badge.earned}
              className={badge.earned ? roleBgLight : ""}
            />
          ))}
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Progress to Next Badge</h4>
          <div className="flex items-center gap-3">
            <ProgressRing progress={60} role={superUser.role}>
              <span className={cn("text-sm font-semibold", roleColor)}>60%</span>
            </ProgressRing>
            <div>
              <h5 className="text-sm font-medium text-gray-900">Action Circle Leader</h5>
              <p className="text-xs text-gray-500">Lead 2 successful action circles</p>
              <p className="text-xs font-medium text-gray-700 mt-1">1/2 complete</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3 rounded-b-lg">
        <Link href="/profile">
          <a className={cn(
            "text-sm font-medium hover:underline inline-flex items-center",
            roleColor
          )}>
            View all badges
            <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
