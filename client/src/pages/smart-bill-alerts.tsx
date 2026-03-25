import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Settings,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  Loader2
} from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SmartBillAlertsPage() {
  const [activeTab, setActiveTab] = useState<string>("alerts");
  const [newAlertDialogOpen, setNewAlertDialogOpen] = useState<boolean>(false);
  const [billSearchQuery, setBillSearchQuery] = useState<string>("");
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [alertType, setAlertType] = useState<string>("all");
  const [contextPreferences, setContextPreferences] = useState({
    includeImpactAnalysis: true,
    includePoliticalContext: true,
    includeStakeholderReactions: false,
    notificationMethod: 'push',
    urgencyLevel: 'medium'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for user's active alerts
  const { data: userAlerts, isLoading: alertsLoading } = useQuery<any>({
    queryKey: ['/api/smart-alerts/user'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Query for recent notifications (using demo endpoint)
  const { data: notifications, isLoading: notificationsLoading } = useQuery<any>({
    queryKey: ['/api/smart-alerts/demo'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Mutation for creating new alert
  const createAlertMutation = useMutation({
    mutationFn: async (data: { billId: number; alertType: string; contextPreferences: any }) => {
      const response = await axios.post('/api/alerts/create', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Alert Created",
          description: "You'll be notified when this bill changes status",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/alerts/user'] });
        setNewAlertDialogOpen(false);
        setSelectedBillId(null);
        setBillSearchQuery("");
      } else {
        toast({
          title: "Alert Creation Failed",
          description: data.error || "Failed to create alert",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Alert Creation Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation for deactivating alert
  const deactivateAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await axios.delete(`/api/alerts/${alertId}`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Alert Deactivated",
          description: "You'll no longer receive notifications for this bill",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/alerts/user'] });
      } else {
        toast({
          title: "Deactivation Failed",
          description: data.error || "Failed to deactivate alert",
          variant: "destructive",
        });
      }
    },
  });

  // Search for bills
  const [billSearchResults, setBillSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleSearchBills = async () => {
    if (!billSearchQuery) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/legiscan/search?query=${encodeURIComponent(billSearchQuery)}`);
      if (response.data.success && response.data.data && response.data.data.bills) {
        setBillSearchResults(response.data.data.bills);
      } else {
        setBillSearchResults([]);
        toast({
          title: "Search Failed",
          description: "Failed to retrieve bills. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching bills:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for bills",
        variant: "destructive",
      });
      setBillSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateAlert = () => {
    if (!selectedBillId) {
      toast({
        title: "No Bill Selected",
        description: "Please select a bill to create an alert for",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate({
      billId: selectedBillId,
      alertType,
      contextPreferences
    });
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <Zap className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300';
    }
  };

  const renderAlertsList = () => {
    if (alertsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    const alerts = userAlerts?.data || [];

    if (alerts.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No Active Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first bill alert to stay informed about legislative changes
                </p>
              </div>
              <Button onClick={() => setNewAlertDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {alerts.map((alertRecord: any) => {
          const alert = alertRecord.alert;
          const bill = alertRecord.bill;
          
          return (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <BellRing className="h-4 w-4 text-primary" />
                      <span className="font-medium">{bill?.bill_number || `Bill ${alert.billId}`}</span>
                      <Badge variant="outline" className="text-xs">
                        {alert.alertType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {bill?.title || 'Legislative bill tracking'}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                      {alert.lastNotificationSent && (
                        <span>Last alert: {new Date(alert.lastNotificationSent).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/bills/${alert.billId}`, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deactivateAlertMutation.mutate(alert.id)}
                      disabled={deactivateAlertMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderNotificationsList = () => {
    if (notificationsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    const notificationsList = notifications?.data?.notifications || [];

    if (notificationsList.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No Recent Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  You'll see notifications here when your tracked bills change status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {notificationsList.map((notification: any, index: number) => (
          <Card key={index} className={`border-l-4 ${getUrgencyColor(notification.urgencyLevel)}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getUrgencyIcon(notification.urgencyLevel)}
                  <span className="font-medium">{notification.billNumber}</span>
                  <Badge variant="secondary" className="text-xs">
                    {notification.changeType.replace('_', ' ')}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleString()}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-muted-foreground mb-1">
                  Status changed: <span className="line-through">{notification.previousStatus}</span> → <span className="font-medium">{notification.newStatus}</span>
                </p>
                <p className="text-sm">{notification.contextualExplanation}</p>
              </div>

              {notification.impactAnalysis && (
                <div className="mb-3 p-2 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Impact Analysis:</p>
                  <p className="text-sm text-muted-foreground">{notification.impactAnalysis}</p>
                </div>
              )}

              {notification.actionButtons && notification.actionButtons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {notification.actionButtons.map((action: any, actionIndex: number) => (
                    <Button
                      key={actionIndex}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (action.url) {
                          window.open(action.url, '_blank');
                        }
                      }}
                    >
                      {action.label}
                      {action.url && <ExternalLink className="ml-1 h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Smart Bill Alerts</h1>
              <p className="text-muted-foreground">
                Get instant notifications with context when your tracked bills change
              </p>
            </div>
            <Button onClick={() => setNewAlertDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Alert
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts">My Alerts</TabsTrigger>
            <TabsTrigger value="notifications">Recent Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-6">
            {renderAlertsList()}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {renderNotificationsList()}
          </TabsContent>
        </Tabs>

        {/* New Alert Dialog */}
        <Dialog open={newAlertDialogOpen} onOpenChange={setNewAlertDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Bill Alert</DialogTitle>
              <DialogDescription>
                Set up notifications to stay informed about bill changes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Bill Search */}
              <div>
                <Label className="text-sm font-medium">Select Bill</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    value={billSearchQuery}
                    onChange={(e) => setBillSearchQuery(e.target.value)}
                    placeholder="Search by bill number or keyword"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchBills();
                    }}
                  />
                  <Button 
                    onClick={handleSearchBills} 
                    disabled={isSearching || !billSearchQuery}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {billSearchResults.length > 0 && (
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {billSearchResults.map((bill) => (
                      <div 
                        key={bill.bill_id}
                        className={`p-2 border rounded-md cursor-pointer transition-colors ${
                          selectedBillId === bill.bill_id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedBillId(bill.bill_id)}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{bill.number}</span>
                          <span className="text-sm opacity-70">{bill.state}</span>
                        </div>
                        <p className="text-sm truncate opacity-90">{bill.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alert Type */}
              <div>
                <Label className="text-sm font-medium">Alert Type</Label>
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Changes</SelectItem>
                    <SelectItem value="status_change">Status Changes</SelectItem>
                    <SelectItem value="committee_action">Committee Actions</SelectItem>
                    <SelectItem value="vote_scheduled">Votes Scheduled</SelectItem>
                    <SelectItem value="amendment_added">Amendments Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Context Preferences */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Notification Preferences</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="impact-analysis"
                      checked={contextPreferences.includeImpactAnalysis}
                      onCheckedChange={(checked) => 
                        setContextPreferences(prev => ({ ...prev, includeImpactAnalysis: checked as boolean }))
                      }
                    />
                    <Label htmlFor="impact-analysis" className="text-sm">Include impact analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="political-context"
                      checked={contextPreferences.includePoliticalContext}
                      onCheckedChange={(checked) => 
                        setContextPreferences(prev => ({ ...prev, includePoliticalContext: checked as boolean }))
                      }
                    />
                    <Label htmlFor="political-context" className="text-sm">Include political context</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="stakeholder-reactions"
                      checked={contextPreferences.includeStakeholderReactions}
                      onCheckedChange={(checked) => 
                        setContextPreferences(prev => ({ ...prev, includeStakeholderReactions: checked as boolean }))
                      }
                    />
                    <Label htmlFor="stakeholder-reactions" className="text-sm">Include stakeholder reactions</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNewAlertDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAlert} 
                disabled={createAlertMutation.isPending || !selectedBillId}
              >
                {createAlertMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Create Alert
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}