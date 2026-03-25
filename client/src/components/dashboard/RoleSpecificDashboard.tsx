import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleBadge } from "@/components/ui/role-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import RippleEffectTracker from "./RippleEffectTracker";
import { SuperUserRole, UserNetworkImpact, ActionCircle } from "@/lib/types";

interface RoleSpecificDashboardProps {
  userRole?: SuperUserRole;
  networkImpact?: UserNetworkImpact;
  actionCircles?: ActionCircle[];
  isLoading: boolean;
}

export default function RoleSpecificDashboard({ 
  userRole, 
  networkImpact, 
  actionCircles, 
  isLoading 
}: RoleSpecificDashboardProps) {
  if (isLoading || !userRole) {
    return (
      <Card className="shadow mb-8 overflow-hidden">
        <div className="border-b border-neutral-200">
          <div className="px-6 py-4 flex items-center">
            <Skeleton className="h-6 w-24 mr-3" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="border-b border-neutral-200">
            <div className="flex px-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-32 mx-2" />
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96 mb-4" />
          <Skeleton className="h-[220px] w-full mb-4 rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow mb-8 overflow-hidden">
      <div className="border-b border-neutral-200">
        <div className="px-6 py-4 flex items-center">
          <RoleBadge role={userRole.role} />
          <h2 className="ml-3 text-lg font-semibold text-neutral-800">
            Your {getRoleTitle(userRole.role)} Impact
          </h2>
        </div>
        <Tabs defaultValue="network" className="w-full">
          <div className="border-b border-neutral-200">
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="network" 
                className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              >
                Network Impact
              </TabsTrigger>
              <TabsTrigger 
                value="circles" 
                className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              >
                Action Circles
              </TabsTrigger>
              <TabsTrigger 
                value="tools" 
                className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              >
                {getRoleToolsLabel(userRole.role)}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="network" className="p-6 mt-0">
            <div className="mb-6">
              <h3 className="text-base font-medium text-neutral-800 mb-3">Ripple Effect Tracker</h3>
              <p className="text-sm text-neutral-500 mb-4">See how far your influence spreads and who you've inspired to take action</p>
              
              <RippleEffectTracker networkImpact={networkImpact} />
              
              <div className="mt-4 bg-neutral-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-neutral-800">Your Network Impact</h4>
                  <span className="text-secondary-500 text-sm font-medium">
                    R₀ = {formatR0Value(networkImpact?.r0Value || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="bg-white rounded p-3 shadow-sm">
                    <div className="text-neutral-500 text-xs">Users Invited</div>
                    <div className="text-neutral-800 text-xl font-semibold">{networkImpact?.usersInvited || 0}</div>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <div className="text-neutral-500 text-xs">Active Users</div>
                    <div className="text-neutral-800 text-xl font-semibold">{networkImpact?.activeUsers || 0}</div>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <div className="text-neutral-500 text-xs">Actions Inspired</div>
                    <div className="text-neutral-800 text-xl font-semibold">{networkImpact?.actionsInspired || 0}</div>
                  </div>
                  <div className="bg-white rounded p-3 shadow-sm">
                    <div className="text-neutral-500 text-xs">Total Reach</div>
                    <div className="text-neutral-800 text-xl font-semibold">{networkImpact?.totalReach || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="circles" className="p-6 mt-0">
            <div className="mb-6">
              <h3 className="text-base font-medium text-neutral-800 mb-3">Your Action Circles</h3>
              <p className="text-sm text-neutral-500 mb-4">Coordinate advocacy with your inner circle of engaged citizens</p>
              
              {actionCircles && actionCircles.length > 0 ? (
                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="bg-primary-50 p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-primary-800">#{actionCircles[0].name}</h4>
                        <p className="text-xs text-primary-600">
                          {actionCircles[0].memberCount || 5} members · Created {formatDate(actionCircles[0].createdAt)}
                        </p>
                      </div>
                      <Button variant="link" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                        Manage Circle
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center mb-4">
                      <div className="flex -space-x-2 mr-3">
                        {/* This would be mapped from actual members */}
                        <Avatar className="h-8 w-8 border-2 border-white">
                          <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330" />
                          <AvatarFallback>TA</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-white">
                          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e" />
                          <AvatarFallback>MC</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-white">
                          <AvatarImage src="https://images.unsplash.com/photo-1519345182560-3f2917c472ef" />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-white">
                          <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80" />
                          <AvatarFallback>SO</AvatarFallback>
                        </Avatar>
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-neutral-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-neutral-500">+1</span>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-500">
                        All members active in the last week
                      </div>
                    </div>
                    
                    <div className="border-t border-neutral-200 pt-4">
                      <h5 className="text-sm font-medium text-neutral-800 mb-2">Current Group Action</h5>
                      <div className="bg-neutral-50 rounded p-3 mb-3">
                        <div className="flex justify-between">
                          <div>
                            <div className="text-sm font-medium text-neutral-800">
                              Contact Representatives about the Clean Water Act
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">Deadline: June 15, 2023</div>
                          </div>
                          <div className="bg-secondary-100 text-secondary-800 text-xs font-medium px-2 py-1 rounded flex items-center h-fit">
                            3/5 Completed
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress value={60} className="h-2" indicatorClassName="bg-secondary-500" />
                        </div>
                      </div>
                      <Button variant="outline" className="w-full text-primary-500 border-primary-500 hover:bg-primary-50">
                        Invite More Members
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
                  <h4 className="font-medium text-lg text-neutral-800 mb-2">Create Your First Action Circle</h4>
                  <p className="text-neutral-600 mb-4">
                    Action Circles help you coordinate with others to multiply your impact on issues you care about.
                  </p>
                  <Button>Create Action Circle</Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tools" className="p-6 mt-0">
            <div className="mb-6">
              <h3 className="text-base font-medium text-neutral-800 mb-3">{getRoleToolsTitle(userRole.role)}</h3>
              <p className="text-sm text-neutral-500 mb-4">{getRoleToolsDescription(userRole.role)}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getRoleTools(userRole.role).map((tool, index) => (
                  <div key={index} className="bg-white border border-neutral-200 rounded-lg p-4">
                    <h4 className="font-medium text-neutral-800 mb-2">{tool.title}</h4>
                    <p className="text-sm text-neutral-600 mb-3">{tool.description}</p>
                    <Button 
                      variant={tool.available ? "default" : "outline"} 
                      disabled={!tool.available}
                      className={!tool.available ? "text-neutral-500" : ""}
                      size="sm"
                    >
                      {tool.available ? "Access Tool" : `Unlocks at Level ${tool.unlocksAtLevel}`}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

function getRoleTitle(role: string): string {
  switch (role) {
    case "catalyst": return "Catalyst";
    case "amplifier": return "Amplifier";
    case "convincer": return "Convincer";
    default: return "Super User";
  }
}

function getRoleToolsLabel(role: string): string {
  switch (role) {
    case "catalyst": return "Research Tools";
    case "amplifier": return "Outreach Tools";
    case "convincer": return "Storytelling Tools";
    default: return "Tools & Resources";
  }
}

function getRoleToolsTitle(role: string): string {
  switch (role) {
    case "catalyst": return "Your Research & Analysis Tools";
    case "amplifier": return "Your Network & Outreach Tools";
    case "convincer": return "Your Narrative & Persuasion Tools";
    default: return "Your Impact Tools";
  }
}

function getRoleToolsDescription(role: string): string {
  switch (role) {
    case "catalyst":
      return "Access specialized tools to research, verify, and share critical policy information.";
    case "amplifier":
      return "Expand your reach and coordinate advocacy with these network-building tools.";
    case "convincer":
      return "Craft compelling narratives and persuasive content with these storytelling resources.";
    default:
      return "Access specialized tools to increase your civic impact.";
  }
}

function getRoleTools(role: string): { title: string; description: string; available: boolean; unlocksAtLevel?: number }[] {
  switch (role) {
    case "catalyst":
      return [
        {
          title: "Policy Research Dashboard",
          description: "Track and analyze legislation with advanced filters and alerts.",
          available: true
        },
        {
          title: "Fact Verification Tool",
          description: "Quickly check claims against trusted sources and public records.",
          available: true
        },
        {
          title: "Legislative Impact Analyzer",
          description: "Visualize the potential impacts of proposed legislation on communities.",
          available: false,
          unlocksAtLevel: 3
        },
        {
          title: "Policy Knowledge Hub",
          description: "Create and share comprehensive policy briefs with your network.",
          available: false,
          unlocksAtLevel: 2
        }
      ];
    case "amplifier":
      return [
        {
          title: "Network Visualizer",
          description: "Map your influence network and identify key connection opportunities.",
          available: true
        },
        {
          title: "Action Circle Manager",
          description: "Create and coordinate advocacy groups around specific causes.",
          available: true
        },
        {
          title: "Campaign Builder",
          description: "Design multi-phase advocacy campaigns that scale your impact.",
          available: false,
          unlocksAtLevel: 2
        },
        {
          title: "Community Organizer Kit",
          description: "Templates and tools for organizing community-level civic action.",
          available: false,
          unlocksAtLevel: 3
        }
      ];
    case "convincer":
      return [
        {
          title: "Narrative Builder",
          description: "Create compelling stories that connect policy to personal impact.",
          available: true
        },
        {
          title: "Persuasion Analytics",
          description: "Track which messages and approaches drive the most action.",
          available: true
        },
        {
          title: "Visual Storytelling Studio",
          description: "Create shareable graphics and visuals that simplify complex issues.",
          available: false,
          unlocksAtLevel: 2
        },
        {
          title: "Influence Accelerator",
          description: "Advanced persuasion frameworks for driving sustained civic action.",
          available: false,
          unlocksAtLevel: 3
        }
      ];
    default:
      return [
        {
          title: "Impact Dashboard",
          description: "Track and visualize your civic engagement impact.",
          available: true
        },
        {
          title: "Action Toolkit",
          description: "Resources and templates for effective civic actions.",
          available: true
        }
      ];
  }
}

function formatR0Value(value: number): string {
  return (value / 10).toFixed(1);
}

function formatDate(dateString?: string): string {
  if (!dateString) return "recently";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
