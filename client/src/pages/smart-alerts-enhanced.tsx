import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SmartAlertCard } from "../components/shared/smart-alert-card";
import {
  Bell,
  Loader2,
  Zap,
  Plus,
  Filter,
  Settings,
  Smartphone,
  Mail,
  MessageSquare,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SmartAlertsEnhancedPage() {
  const [billId, setBillId] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<string>("committee_vote");
  const [alertFilters, setAlertFilters] = useState({
    urgency: 'all',
    alertType: 'all',
    readStatus: 'all'
  });
  const { toast } = useToast();

  // Query for user alerts
  const { data: alertsData, refetch: refetchAlerts } = useQuery<any>({
    queryKey: ['/api/smart-alerts/user', alertFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (alertFilters.urgency !== 'all') params.append('urgency', alertFilters.urgency);
      if (alertFilters.alertType !== 'all') params.append('alertType', alertFilters.alertType);
      if (alertFilters.readStatus === 'unread') params.append('unreadOnly', 'true');
      
      const response = await axios.get(`/api/smart-alerts/user?${params}`);
      return response.data;
    },
  });

  // Query for alert statistics
  const { data: statsData } = useQuery<any>({
    queryKey: ['/api/smart-alerts/stats'],
    queryFn: async () => {
      const response = await axios.get('/api/smart-alerts/stats');
      return response.data;
    },
  });

  // Mutation for simulating alerts
  const simulateAlertMutation = useMutation({
    mutationFn: async (data: { billId: number; scenario: string }) => {
      const response = await axios.post('/api/smart-alerts/simulate', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Alert Generated!",
          description: `Smart alert created for ${data.data.billNumber}`,
        });
        // In a real app, this would trigger the alert to appear
        // For demo, we can show it immediately
      } else {
        toast({
          title: "Alert Failed",
          description: data.error || "Failed to generate alert",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Alert Error",
        description: error.message || "An error occurred while generating alert",
        variant: "destructive",
      });
    },
  });

  // Mutation for processing alert actions
  const processActionMutation = useMutation({
    mutationFn: async (data: { alertId: string; action: string; actionData?: any }) => {
      const response = await axios.post(`/api/smart-alerts/${data.alertId}/action`, {
        action: data.action,
        data: data.actionData
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast({
          title: "Action Completed!",
          description: getActionSuccessMessage(variables.action),
        });
      }
    },
  });

  // Mutation for marking alerts as read
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await axios.post(`/api/smart-alerts/${alertId}/read`);
      return response.data;
    },
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const handleSimulateAlert = () => {
    if (!billId || isNaN(parseInt(billId, 10))) {
      toast({
        title: "Invalid Bill ID",
        description: "Please enter a valid bill ID",
        variant: "destructive",
      });
      return;
    }

    simulateAlertMutation.mutate({
      billId: parseInt(billId, 10),
      scenario: selectedScenario
    });
  };

  const handleActionClick = (action: string, data?: any) => {
    // For demo, we'll simulate the action
    processActionMutation.mutate({
      alertId: 'demo-alert',
      action,
      actionData: data
    });
  };

  const handleMarkAsRead = (alertId: string) => {
    markAsReadMutation.mutate(alertId);
  };

  const getActionSuccessMessage = (action: string) => {
    switch (action) {
      case 'contact_representative': return 'Contact information retrieved';
      case 'share_alert': return 'Shareable content generated';
      case 'learn_more': return 'Educational resources loaded';
      case 'track_bill': return 'Bill added to watch list';
      case 'join_action': return 'Action opportunities found';
      default: return 'Action completed successfully';
    }
  };

  // Sample alert for demo (since we don't have real data)
  const sampleAlert = {
    id: 'demo-alert-1',
    billId: 12345,
    billNumber: 'HB 2024',
    title: 'Education Funding Reform Act',
    alertType: 'committee_action' as const,
    urgency: 'high' as const,
    message: 'Committee vote scheduled for tomorrow! Your voice matters.',
    context: {
      whatHappened: 'The House Education Committee has scheduled HB 2024 for a final vote tomorrow at 2:00 PM.',
      whyItMatters: 'This bill would increase education funding by $2.3 billion and directly impact local schools in your district.',
      whatItMeans: 'If passed, this moves the bill to a full House vote. If it fails, the bill dies in committee.',
      nextSteps: [
        'Committee vote tomorrow at 2:00 PM',
        'If passed, full House vote within 5 days',
        'Public comment period ends tonight at midnight'
      ],
      timelineImpact: 'This is a critical decision point. The bill must pass committee to continue through the legislative process.',
      citizenImpact: 'Success could mean increased funding for local schools, smaller class sizes, and expanded educational programs in your community.'
    },
    actionButtons: {
      primary: {
        label: 'Contact Your Rep',
        action: 'contact_representative' as const,
        data: { billId: 12345, position: 'support' }
      },
      secondary: {
        label: 'Share Alert',
        action: 'share_alert' as const,
        data: { billNumber: 'HB 2024', change: 'committee vote scheduled' }
      }
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    readStatus: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Smart Bill Alerts</h1>
              <p className="text-muted-foreground">
                Get instant notifications with context when your tracked bills move
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts">My Alerts</TabsTrigger>
            <TabsTrigger value="demo">Try Demo</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-6">
            {/* Alert Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{statsData?.data?.totalAlerts || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{statsData?.data?.unreadAlerts || 0}</p>
                      <p className="text-xs text-muted-foreground">Unread</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{statsData?.data?.criticalAlerts || 0}</p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{statsData?.data?.responseRate || 0}%</p>
                      <p className="text-xs text-muted-foreground">Response Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alert Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 h-5 w-5" />
                  Filter Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Urgency</label>
                    <Select 
                      value={alertFilters.urgency} 
                      onValueChange={(value) => setAlertFilters(prev => ({ ...prev, urgency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Urgency</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Alert Type</label>
                    <Select 
                      value={alertFilters.alertType} 
                      onValueChange={(value) => setAlertFilters(prev => ({ ...prev, alertType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="status_change">Status Change</SelectItem>
                        <SelectItem value="committee_action">Committee Action</SelectItem>
                        <SelectItem value="vote_scheduled">Vote Scheduled</SelectItem>
                        <SelectItem value="amendment_added">Amendment Added</SelectItem>
                        <SelectItem value="deadline_approaching">Deadline Approaching</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Read Status</label>
                    <Select 
                      value={alertFilters.readStatus} 
                      onValueChange={(value) => setAlertFilters(prev => ({ ...prev, readStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Alerts</SelectItem>
                        <SelectItem value="unread">Unread Only</SelectItem>
                        <SelectItem value="read">Read Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts List */}
            <div className="space-y-4">
              {alertsData?.data && alertsData.data.length > 0 ? (
                alertsData.data.map((alert: any) => (
                  <SmartAlertCard
                    key={alert.id}
                    alert={alert}
                    onActionClick={handleActionClick}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))
              ) : (
                <div className="space-y-4">
                  {/* Show sample alert for demo */}
                  <SmartAlertCard
                    alert={sampleAlert}
                    onActionClick={handleActionClick}
                    onMarkAsRead={handleMarkAsRead}
                  />
                  
                  <Card className="text-center py-8">
                    <CardContent>
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No More Alerts</h3>
                      <p className="text-muted-foreground mb-4">
                        You're all caught up! We'll notify you when your tracked bills have updates.
                      </p>
                      <Button onClick={() => {
                        // Switch to demo tab
                        const tab = document.querySelector('[value="demo"]') as HTMLElement;
                        tab?.click();
                      }}>
                        Try Demo Alert
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            {/* Demo Alert Generator */}
            <Card>
              <CardHeader>
                <CardTitle>Try Smart Alerts Demo</CardTitle>
                <CardDescription>
                  Generate sample alerts to see how contextual notifications work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Bill ID</label>
                    <Input
                      value={billId}
                      onChange={(e) => setBillId(e.target.value)}
                      placeholder="Enter bill ID (e.g., 12345)"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Alert Scenario</label>
                    <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="committee_vote">Committee Vote Scheduled</SelectItem>
                        <SelectItem value="passed_house">Bill Passed House</SelectItem>
                        <SelectItem value="amendment_added">Amendment Added</SelectItem>
                        <SelectItem value="deadline_approaching">Deadline Approaching</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleSimulateAlert}
                  disabled={simulateAlertMutation.isPending || !billId}
                  className="w-full"
                >
                  {simulateAlertMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Alert...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Smart Alert
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Feature Showcase */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold">Smart Contextual Alerts</h3>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    Get instant notifications when your tracked bills move, with AI-powered explanations 
                    of what changed, why it matters, and immediate action buttons to help you respond.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Instant Context</h4>
                      <p className="text-xs text-muted-foreground">AI explains what happened and why</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Smart Actions</h4>
                      <p className="text-xs text-muted-foreground">One-tap actions to respond</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <CheckCircle2 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">Urgency Levels</h4>
                      <p className="text-xs text-muted-foreground">Prioritized by importance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Customize how and when you receive smart alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Delivery Methods */}
                <div>
                  <h4 className="font-medium mb-3">Delivery Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Instant alerts on your device</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Email Alerts</p>
                          <p className="text-sm text-muted-foreground">Detailed summaries via email</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">SMS Alerts</p>
                          <p className="text-sm text-muted-foreground">Critical updates via text</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Setup</Button>
                    </div>
                  </div>
                </div>

                {/* Alert Frequency */}
                <div>
                  <h4 className="font-medium mb-3">Alert Frequency</h4>
                  <Select defaultValue="instant">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant (Recommended)</SelectItem>
                      <SelectItem value="hourly">Hourly Summary</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Urgency Threshold */}
                <div>
                  <h4 className="font-medium mb-3">Minimum Urgency Level</h4>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">All Alerts (Low and above)</SelectItem>
                      <SelectItem value="medium">Important (Medium and above)</SelectItem>
                      <SelectItem value="high">Urgent (High and above)</SelectItem>
                      <SelectItem value="critical">Critical Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}