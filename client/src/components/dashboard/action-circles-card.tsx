import { ArrowRight, CheckCircle, Clock, UserPlus, Plus } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import { useQuery } from "@tanstack/react-query";
import { cn, getRoleColor, getStatusClass } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActionItem {
  icon: React.ReactNode;
  text: string;
  status: 'completed' | 'pending' | 'upcoming';
}

interface ActionCircle {
  id: number;
  name: string;
  description: string;
  status: string;
  memberCount: number;
  actions?: ActionItem[];
  nextSteps?: {
    icon: React.ReactNode;
    text: string;
    action: string;
    url: string;
  }[];
}

export function ActionCirclesCard() {
  const { superUser } = useUser();
  
  const { data: circles, isLoading } = useQuery<any>({
    queryKey: ['/api/action-circles'],
    enabled: !!superUser
  });
  
  if (!superUser) return null;
  
  const roleColorText = getRoleColor(superUser.role);
  
  // Fallback data when API data isn't available yet
  const fallbackCircles: ActionCircle[] = [
    {
      id: 1,
      name: 'Education Action Circle',
      description: 'Focused on improving educational resources and policy in Travis County.',
      status: 'active',
      memberCount: 12,
      actions: [
        {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: '8 members contacted representatives about School Funding Bill #HB123',
          status: 'completed'
        },
        {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: '3 members attended county school board meeting on May 15',
          status: 'completed'
        },
        {
          icon: <Clock className="h-4 w-4 text-yellow-500" />,
          text: 'Upcoming: Group public comment submission due June 10',
          status: 'upcoming'
        }
      ]
    },
    {
      id: 2,
      name: 'Healthcare Access Circle',
      description: 'Working to improve healthcare accessibility and affordability in your district.',
      status: 'forming',
      memberCount: 5,
      nextSteps: [
        {
          icon: <UserPlus className="h-4 w-4 text-blue-500" />,
          text: 'Invite 5 more members to reach minimum size',
          action: 'Send invites',
          url: '/action-circles/2/invite'
        }
      ]
    }
  ];
  
  const actionCircles = circles || fallbackCircles;

  return (
    <Card className="col-span-2">
      <CardHeader className="p-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-heading font-semibold text-lg text-dark">Your Action Circles</h3>
            <p className="text-sm text-gray-600">Groups you're coordinating for collective impact</p>
          </div>
          <Button size="sm" className={`bg-${superUser.role}`}>
            <Plus className="h-4 w-4 mr-2" />
            New Circle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-6">
          {actionCircles.map((circle: any) => (
            <div key={circle.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="sm:flex sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-base font-medium text-gray-900">{circle.name}</h4>
                  <div className="mt-1 flex items-center">
                    <Badge className={getStatusClass(circle.status)}>
                      {circle.status === 'active' && (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      )}
                      {circle.status === 'forming' && (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {circle.status.charAt(0).toUpperCase() + circle.status.slice(1)}
                    </Badge>
                    <span className="ml-2 text-xs text-gray-500">{circle.memberCount} members</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{circle.description}</p>
                </div>
                <div className="mt-4 sm:mt-0 flex-shrink-0">
                  <Link href={`/action-circles/${circle.id}`}>
                    <a className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      View Circle
                    </a>
                  </Link>
                </div>
              </div>
              
              {circle.actions && (
                <div className="mt-4">
                  <h5 className="text-xs font-semibold text-gray-700">Recent Actions:</h5>
                  <ul className="mt-2 space-y-2">
                    {circle.actions.map((action: any, index: any) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 h-4 w-4">
                          {action.icon}
                        </div>
                        <p className="ml-2 text-xs text-gray-600">{action.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {circle.nextSteps && (
                <div className="mt-4">
                  <h5 className="text-xs font-semibold text-gray-700">Next Steps:</h5>
                  {circle.nextSteps.map((step: any, index: any) => (
                    <div key={index} className="mt-2 flex">
                      <div className="flex-shrink-0 h-4 w-4">
                        {step.icon}
                      </div>
                      <div className="ml-2">
                        <p className="text-xs text-gray-600">{step.text}</p>
                        <Link href={step.url}>
                          <a className={cn(
                            "text-xs font-medium hover:underline inline-flex items-center mt-1",
                            roleColorText
                          )}>
                            {step.action}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </a>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3 rounded-b-lg">
        <Link href="/action-circles">
          <a className={cn(
            "text-sm font-medium hover:underline inline-flex items-center",
            roleColorText
          )}>
            Manage all action circles
            <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
