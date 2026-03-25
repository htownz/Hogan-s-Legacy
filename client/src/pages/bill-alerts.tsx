import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { 
  BellIcon, 
  Search, 
  Filter, 
  Settings, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function BillAlertsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch bill notifications
  const { data: notifications, isLoading } = useQuery<any>({
    queryKey: ['/api/notifications/bills'],
    queryFn: async () => {
      const response = await apiRequest('/api/notifications/bills');
      return response.json();
    },
  });
  
  // Format timestamp
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };
  
  // Filter notifications by search query
  const filteredNotifications = searchQuery.trim() === '' 
    ? notifications 
    : notifications?.filter((notification: any) => 
        notification.billId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Mock data for bill alerts preferences
  const alertPreferences = [
    { id: 'bill_movement', label: 'Bill Status Changes', description: 'Get notified when bills move through the legislative process', enabled: true },
    { id: 'committee_hearings', label: 'Committee Hearings', description: 'Get notified about upcoming committee hearings for tracked bills', enabled: true },
    { id: 'floor_votes', label: 'Floor Votes', description: 'Get notified when bills are scheduled for a vote', enabled: true },
    { id: 'amendments', label: 'Amendments', description: 'Get notified when bills are amended', enabled: false },
    { id: 'gov_actions', label: 'Governor Actions', description: 'Get notified when the governor takes action on bills', enabled: true },
  ];
  
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Smart Bill Alerts</h1>
        <p className="text-muted-foreground">
          Stay updated with important changes to legislation you care about
        </p>
      </div>
      
      <Tabs defaultValue="alerts">
        <TabsList className="mb-4">
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
          <TabsTrigger value="preferences">Alert Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alerts">
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search alerts by bill number or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Alerts list */}
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeleton
              Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-5 w-5/6" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-20" />
                  </CardFooter>
                </Card>
              ))
            ) : filteredNotifications && filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification: any) => (
                <Card key={notification.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Badge 
                          variant={notification.priority === 'high' ? 'destructive' : 'default'}
                          className="mr-2"
                        >
                          {notification.billId || 'TX-HB123'}
                        </Badge>
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(notification.timestamp || new Date().toISOString())}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <CardDescription className="text-sm">
                      {notification.description}
                    </CardDescription>
                    
                    {notification.impact && (
                      <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                        <p className="font-semibold mb-1">Impact:</p>
                        <p>{notification.impact}</p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">
                      View Bill
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      Share
                    </Button>
                    
                    {notification.actions?.map((action: string, i: number) => (
                      <Button key={i} size="sm">
                        {action}
                      </Button>
                    ))}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <BellIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No alerts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No alerts match your search criteria' : 'You don\'t have any bill alerts yet'}
                </p>
                <Button>Track Your First Bill</Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
              <CardDescription>
                Customize what types of bill updates you want to receive notifications for
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {alertPreferences.map((pref) => (
                  <div key={pref.id} className="flex items-start space-x-4">
                    <div className="pt-0.5">
                      <Switch id={pref.id} defaultChecked={pref.enabled} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={pref.id} className="text-base">
                        {pref.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {pref.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Delivery Preferences</CardTitle>
              <CardDescription>
                Choose how and when you'd like to receive bill alerts
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="pt-0.5">
                    <Switch id="browser" defaultChecked={true} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="browser" className="text-base">
                      Browser Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in your browser when you're on the site
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="pt-0.5">
                    <Switch id="email" defaultChecked={true} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-base">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily digest emails with your bill alerts
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="pt-0.5">
                    <Switch id="push" defaultChecked={false} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="push" className="text-base">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your mobile device
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline">Test Notification</Button>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}