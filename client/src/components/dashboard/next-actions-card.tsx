import { ArrowRight, UserPlus, Megaphone, GraduationCap } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import { cn, getRoleBgLightColor, getRoleColor } from "@/lib/utils";
import { Link } from "wouter";

interface NextActionData {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  url: string;
}

export function NextActionsCard() {
  const { superUser } = useUser();
  
  if (!superUser) return null;

  const roleSpecificActions: Record<string, NextActionData[]> = {
    catalyst: [
      {
        icon: <UserPlus className="h-4 w-4" />,
        title: "Share Research Insights",
        description: "Curate and share verified information on School Funding Bill #HB123",
        action: "Get started",
        url: "/legislation"
      },
      {
        icon: <Megaphone className="h-4 w-4" />,
        title: "Flag Misinformation",
        description: "Review and correct inaccurate information about district policy changes",
        action: "Start reviewing",
        url: "/legislation"
      },
      {
        icon: <GraduationCap className="h-4 w-4" />,
        title: "Complete Knowledge Guide",
        description: "Create an educational guide explaining healthcare legislation impacts",
        action: "Create guide",
        url: "/training"
      }
    ],
    amplifier: [
      {
        icon: <UserPlus className="h-4 w-4" />,
        title: "Start an Action Circle",
        description: "Create a focused group to coordinate advocacy on healthcare issues",
        action: "Get started",
        url: "/action-circles"
      },
      {
        icon: <Megaphone className="h-4 w-4" />,
        title: "Launch Invite Challenge",
        description: "Invite 5 friends to join Act Up in the next 7 days",
        action: "Start challenge",
        url: "/challenges"
      },
      {
        icon: <GraduationCap className="h-4 w-4" />,
        title: "Complete Amplifier Training",
        description: "Learn advanced network-building techniques (2/3 modules complete)",
        action: "Resume training",
        url: "/training"
      }
    ],
    convincer: [
      {
        icon: <UserPlus className="h-4 w-4" />,
        title: "Create Compelling Story",
        description: "Craft a personal narrative about why education funding matters",
        action: "Start writing",
        url: "/training"
      },
      {
        icon: <Megaphone className="h-4 w-4" />,
        title: "Host Conversation Event",
        description: "Organize a small group discussion about local policy changes",
        action: "Plan event",
        url: "/action-circles"
      },
      {
        icon: <GraduationCap className="h-4 w-4" />,
        title: "Complete Persuasion Course",
        description: "Learn advanced techniques for moving people to action (1/3 complete)",
        action: "Resume course",
        url: "/training"
      }
    ]
  };
  
  const actions = roleSpecificActions[superUser.role] || roleSpecificActions.amplifier;
  const roleColorBg = getRoleBgLightColor(superUser.role);
  const roleColorText = getRoleColor(superUser.role);

  return (
    <Card>
      <CardHeader className="p-5 border-b border-gray-200">
        <h3 className="font-heading font-semibold text-lg text-dark">
          Next Steps for {superUser.role.charAt(0).toUpperCase() + superUser.role.slice(1)}s
        </h3>
        <p className="text-sm text-gray-600">Personalized actions to boost your impact</p>
      </CardHeader>
      <CardContent className="p-5">
        <ul className="space-y-4">
          {actions.map((action, index) => (
            <li key={index} className="flex">
              <div className="flex-shrink-0">
                <span className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full",
                  roleColorBg,
                  roleColorText
                )}>
                  {action.icon}
                </span>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                <p className="text-xs text-gray-500">{action.description}</p>
                <Link href={action.url}>
                  <a className={cn(
                    "text-xs font-medium hover:underline inline-flex items-center mt-1",
                    roleColorText
                  )}>
                    {action.action}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </a>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3 rounded-b-lg">
        <Link href="/challenges">
          <a className={cn(
            "text-sm font-medium hover:underline inline-flex items-center",
            roleColorText
          )}>
            View all recommendations
            <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
