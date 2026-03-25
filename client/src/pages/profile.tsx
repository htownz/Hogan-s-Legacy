// @ts-nocheck
import { AppLayout } from "@/components/layout/app-layout";
import { useUser } from "@/context/user-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LevelProgress } from "@/components/super-user/level-progress";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { BadgesAchievementsCard } from "@/components/dashboard/badges-achievements-card";
import { RippleEffect } from "@/components/dashboard/ripple-effect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, MapPin, Mail, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoleDisplayName, getLevelName } from "@/lib/utils";

export default function Profile() {
  const { user, superUser } = useUser();
  
  if (!user || !superUser) return null;
  
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Card>
            <div className="relative h-48 bg-gradient-to-r from-primary to-secondary rounded-t-lg">
              <Button 
                size="sm" 
                variant="outline" 
                className="absolute top-4 right-4 bg-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            
            <div className="px-6 sm:px-8 relative">
              <div className="-mt-16">
                <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                  <AvatarImage src={user.profileImageUrl} alt={user.name} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pb-6 pt-2">
                <div>
                  <h1 className="text-2xl font-bold font-heading text-gray-900">{user.name}</h1>
                  <div className="flex items-center mt-1 space-x-4">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{user.district}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-1" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="text-sm">Joined {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100">
                    <span className={`h-2 w-2 rounded-full bg-${superUser.role} mr-2`}></span>
                    <span className="text-sm font-medium">
                      {getRoleDisplayName(superUser.role)} • Level {superUser.level} ({getLevelName(superUser.level)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="mb-6">
          <Card>
            <CardHeader className="border-b pb-3">
              <h2 className="text-lg font-semibold">Super User Progress</h2>
            </CardHeader>
            <CardContent className="pt-6">
              <LevelProgress />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold mb-3">Actions Completed</h3>
                  <div className="flex items-center">
                    <ProgressRing progress={75} role={superUser.role} size={60}>
                      <span className={`text-sm font-semibold text-${superUser.role}`}>75%</span>
                    </ProgressRing>
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{superUser.actionsCompleted}</p>
                      <p className="text-xs text-gray-500">Total completed actions</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold mb-3">Network Impact</h3>
                  <div className="flex items-center">
                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600">{superUser.totalReach}</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm">Direct: <span className="font-semibold">{superUser.directActivations}</span></p>
                      <p className="text-sm">Secondary: <span className="font-semibold">{superUser.secondaryImpact}</span></p>
                      <p className="text-xs text-gray-500">People reached</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold mb-3">Response Rate</h3>
                  <div className="flex items-center">
                    <ProgressRing progress={superUser.responseRate} role={superUser.role} size={60}>
                      <span className={`text-sm font-semibold text-${superUser.role}`}>{superUser.responseRate}%</span>
                    </ProgressRing>
                    <div className="ml-4">
                      <p className="text-sm font-medium">Above Average</p>
                      <p className="text-xs text-gray-500">Based on district average</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="badges">
          <TabsList className="mb-4">
            <TabsTrigger value="badges">Badges & Achievements</TabsTrigger>
            <TabsTrigger value="network">Network Influence</TabsTrigger>
            <TabsTrigger value="history">Action History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="badges" className="mt-0">
            <BadgesAchievementsCard />
          </TabsContent>
          
          <TabsContent value="network" className="mt-0">
            <Card>
              <CardHeader className="border-b pb-3">
                <h2 className="text-lg font-semibold">Network Influence</h2>
                <p className="text-sm text-gray-500">Your civic impact ripple effect</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/2">
                    <RippleEffect className="h-72" />
                  </div>
                  <div className="md:w-1/2 space-y-4">
                    <h3 className="text-lg font-semibold">Your Influence Stats</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-600">Direct Activations</span>
                          <span className="text-sm font-medium text-gray-900">{superUser.directActivations} people</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${superUser.role} rounded-full`} 
                            style={{ width: `${(superUser.directActivations / 25) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-600">Secondary Impact</span>
                          <span className="text-sm font-medium text-gray-900">{superUser.secondaryImpact} people</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${superUser.role} rounded-full`} 
                            style={{ width: `${(superUser.secondaryImpact / 50) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-600">Total Reach</span>
                          <span className="text-sm font-medium text-gray-900">{superUser.totalReach} people</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${superUser.role} rounded-full`} 
                            style={{ width: `${(superUser.totalReach / 120) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-600">Response Rate</span>
                          <span className="text-sm font-medium text-green-600">{superUser.responseRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${superUser.responseRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader className="border-b pb-3">
                <h2 className="text-lg font-semibold">Action History</h2>
                <p className="text-sm text-gray-500">Record of your civic engagement</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="relative pl-8 pb-6 border-l-2 border-gray-200">
                    <div className="absolute -left-2 top-0 bg-green-500 h-4 w-4 rounded-full"></div>
                    <div className="mb-1">
                      <span className="text-xs text-gray-500">May 15, 2023</span>
                    </div>
                    <h4 className="text-base font-medium">Completed action: Contact Representative</h4>
                    <p className="text-sm text-gray-600">Sent email to Rep. Johnson about School Funding Bill #HB123</p>
                  </div>
                  
                  <div className="relative pl-8 pb-6 border-l-2 border-gray-200">
                    <div className="absolute -left-2 top-0 bg-blue-500 h-4 w-4 rounded-full"></div>
                    <div className="mb-1">
                      <span className="text-xs text-gray-500">May 10, 2023</span>
                    </div>
                    <h4 className="text-base font-medium">Created Education Action Circle</h4>
                    <p className="text-sm text-gray-600">Started a group focused on improving educational resources in Travis County</p>
                  </div>
                  
                  <div className="relative pl-8 pb-6 border-l-2 border-gray-200">
                    <div className="absolute -left-2 top-0 bg-purple-500 h-4 w-4 rounded-full"></div>
                    <div className="mb-1">
                      <span className="text-xs text-gray-500">May 5, 2023</span>
                    </div>
                    <h4 className="text-base font-medium">Invited 3 friends to Act Up</h4>
                    <p className="text-sm text-gray-600">Expanded your network with new civic participants</p>
                  </div>
                  
                  <div className="relative pl-8">
                    <div className="absolute -left-2 top-0 bg-yellow-500 h-4 w-4 rounded-full"></div>
                    <div className="mb-1">
                      <span className="text-xs text-gray-500">May 1, 2023</span>
                    </div>
                    <h4 className="text-base font-medium">Joined Act Up</h4>
                    <p className="text-sm text-gray-600">Started your civic engagement journey as an {getRoleDisplayName(superUser.role)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
