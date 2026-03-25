import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocialNetwork } from "@/hooks/use-social-network";
import { Loader2, UserPlus, Clock, Link2, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserConnection, ConnectionActivity } from "@/lib/types";

/**
 * Component to display user's connections and recent social network activity
 */
export function ConnectionNetwork() {
  const {
    connections,
    isLoadingConnections,
    connectionActivities,
    isLoadingActivities,
    removeConnection,
  } = useSocialNetwork();

  const [selectedConnection, setSelectedConnection] = React.useState<UserConnection | null>(null);

  if (isLoadingConnections || isLoadingActivities) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Function to group activities by date
  const groupActivitiesByDate = (activities: ConnectionActivity[] = []) => {
    return activities.reduce((groups, activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    }, {} as Record<string, ConnectionActivity[]>);
  };

  // Get grouped activities
  const groupedActivities = groupActivitiesByDate(connectionActivities);
  
  // Get dates in descending order
  const activityDates = Object.keys(groupedActivities).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Connections */}
        <div className="md:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                Your Connections
              </CardTitle>
              <CardDescription>
                People you're connected with on Act Up
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections && connections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {connections.map((connection) => (
                    <div 
                      key={connection.id}
                      className="flex items-start space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${connection.connectedUser?.name || 'User'}&background=random`} />
                        <AvatarFallback>
                          {(connection.connectedUser?.name || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{connection.connectedUser?.name || 'User'}</div>
                          <Badge variant="outline">
                            {connection.strength > 8 ? 'Strong' : 
                              connection.strength > 4 ? 'Medium' : 'New'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Connected since {new Date(connection.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedConnection(connection)}
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeConnection.mutate(connection.id)}
                            disabled={removeConnection.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium mb-1">No connections yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your connections will appear here when people accept your invitations.
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Invite People</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Someone to Act Up</DialogTitle>
                        <DialogDescription>
                          Send an invitation to a friend or colleague to join Act Up.
                        </DialogDescription>
                      </DialogHeader>
                      {/* Add InvitationForm component here */}
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest interactions with your connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectionActivities && connectionActivities.length > 0 ? (
                <div className="space-y-6">
                  {activityDates.map((date) => (
                    <div key={date}>
                      <h4 className="text-sm font-medium mb-2">{date}</h4>
                      <div className="space-y-3">
                        {groupedActivities[date].map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 text-sm">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`https://ui-avatars.com/api/?name=${activity.connectedUser?.name || 'User'}&background=random`} />
                              <AvatarFallback>
                                {(activity.connectedUser?.name || 'U').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{activity.connectedUser?.name}</span>
                              <span className="text-muted-foreground"> {activity.description}</span>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connection Detail Dialog */}
      {selectedConnection && (
        <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && setSelectedConnection(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Connection Details
              </DialogTitle>
              <DialogDescription>
                Your relationship with {selectedConnection.connectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 pt-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${selectedConnection.connectedUser?.name || 'User'}&background=random`} />
                    <AvatarFallback>
                      {(selectedConnection.connectedUser?.name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConnection.connectedUser?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConnection.connectedUser?.email}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Connection Strength</div>
                    <div className="text-lg">{selectedConnection.strength}/10</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Connected Since</div>
                    <div className="text-lg">
                      {new Date(selectedConnection.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4 pt-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {connectionActivities
                    ?.filter(activity => activity.connectedUserId === selectedConnection.connectedUserId)
                    .map(activity => (
                      <div key={activity.id} className="p-3 rounded-md bg-muted/50">
                        <div className="text-sm">{activity.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4 pt-4">
                <Button variant="default" className="w-full">
                  Invite to Action Circle
                </Button>
                <Button variant="outline" className="w-full">
                  Share Legislation
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    removeConnection.mutate(selectedConnection.id);
                    setSelectedConnection(null);
                  }}
                  disabled={removeConnection.isPending}
                >
                  Remove Connection
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}