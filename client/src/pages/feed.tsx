import React, { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { FeedList } from "@/components/feed/feed-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Rss, UserCircle, Settings } from "lucide-react";

export default function FeedPage() {
  const { user } = useAuth();
  const [showPersonalized, setShowPersonalized] = useState(true);
  
  // Query for user interests if logged in
  const userInterestsQuery = useQuery<any>({
    queryKey: ['/api/feed/interests'],
    queryFn: () => apiRequest('/api/feed/interests'),
    enabled: !!user,
  });

  const hasInterests = !!userInterestsQuery.data && (
    (userInterestsQuery.data.topics && userInterestsQuery.data.topics.length > 0) ||
    (userInterestsQuery.data.representatives && userInterestsQuery.data.representatives.length > 0) ||
    (userInterestsQuery.data.locations && userInterestsQuery.data.locations.length > 0) ||
    (userInterestsQuery.data.committees && userInterestsQuery.data.committees.length > 0)
  );

  return (
    <MainLayout>
      <div className="container py-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main feed area */}
          <div className="md:col-span-2">
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <Rss className="h-4 w-4" />
                  Feed
                </TabsTrigger>
                <TabsTrigger value="network" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  My Network
                </TabsTrigger>
              </TabsList>
              
              {/* Feed Content */}
              <TabsContent value="feed" className="mt-4">
                <div className="bg-white dark:bg-gray-950 rounded-lg p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="personalized-mode"
                      checked={showPersonalized && !!user}
                      onCheckedChange={setShowPersonalized}
                      disabled={!user}
                    />
                    <Label htmlFor="personalized-mode">Personalized Feed</Label>
                  </div>
                  {!user && (
                    <p className="text-sm text-gray-500">Sign in to get a personalized feed</p>
                  )}
                  {user && !hasInterests && showPersonalized && (
                    <p className="text-sm text-amber-600">Set up your interests for better recommendations</p>
                  )}
                </div>
                
                <FeedList personalized={showPersonalized && !!user} />
              </TabsContent>
              
              {/* Network Content */}
              <TabsContent value="network" className="mt-4">
                {!user ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sign in to see your network</CardTitle>
                      <CardDescription>
                        Connect with others and see activity from your circles
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>My Network</CardTitle>
                        <CardDescription>Posts from your connections and action circles</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500">This feature is coming soon!</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interests Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">My Interests</CardTitle>
                  <Settings className="h-4 w-4 text-gray-500" />
                </div>
                <CardDescription>
                  Topics and representatives you follow
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <p className="text-sm text-gray-500">Sign in to manage your interests</p>
                ) : !userInterestsQuery.data ? (
                  <p className="text-sm text-gray-500">You haven't set any interests yet</p>
                ) : (
                  <div className="space-y-4">
                    {userInterestsQuery.data.topics?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Topics</h4>
                        <div className="flex flex-wrap gap-1">
                          {userInterestsQuery.data.topics.map((topic: string, i: number) => (
                            <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {userInterestsQuery.data.representatives?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Representatives</h4>
                        <div className="flex flex-wrap gap-1">
                          {userInterestsQuery.data.representatives.map((rep: string, i: number) => (
                            <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                              {rep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {userInterestsQuery.data.committees?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Committees</h4>
                        <div className="flex flex-wrap gap-1">
                          {userInterestsQuery.data.committees.map((committee: string, i: number) => (
                            <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                              {committee}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Trending Topics Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Trending Topics</CardTitle>
                <CardDescription>
                  Popular discussions right now
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Education Reform', 'Healthcare Bills', 'Infrastructure', 'Election Security', 'Tax Policy'].map((topic, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm font-medium">{i + 1}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}