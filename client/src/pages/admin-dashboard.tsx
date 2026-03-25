import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Database, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Bell,
  Shield,
  Server
} from "lucide-react";

interface SystemStatus {
  migration: {
    totalMigrations: number;
    completedMigrations: number;
    dataSources: any[];
    lastSync?: Date;
  };
  sync: any[];
  dataSources: any[];
  recentSyncs: any[];
}

interface QualityMetrics {
  healthScore: number;
  metrics: any[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export default function AdminDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [rateLimits, setRateLimits] = useState<any[]>([]);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/live-data/status');
      const data = await response.json();
      
      if (data.success) {
        setSystemStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  // Fetch quality metrics
  const fetchQualityMetrics = async () => {
    try {
      const response = await fetch('/api/live-data/quality');
      const data = await response.json();
      
      if (data.success) {
        setQualityMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch quality metrics:', error);
    }
  };

  // Fetch rate limits
  const fetchRateLimits = async () => {
    try {
      const response = await fetch('/api/live-data/rate-limits');
      const data = await response.json();
      
      if (data.success) {
        setRateLimits(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rate limits:', error);
    }
  };

  // Fetch notification stats
  const fetchNotificationStats = async () => {
    try {
      const response = await fetch('/api/live-data/notifications');
      const data = await response.json();
      
      if (data.success) {
        setNotificationStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  };

  // Trigger manual sync
  const triggerSync = async (source?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/live-data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Sync Started",
          description: data.message,
        });
        
        // Refresh status after a short delay
        setTimeout(fetchSystemStatus, 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Run migrations
  const runMigrations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/live-data/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Migrations Complete",
          description: data.message,
        });
        fetchSystemStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process notifications
  const processNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/live-data/notifications/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Notifications Processed",
          description: data.message,
        });
        fetchNotificationStats();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSystemStatus(),
        fetchQualityMetrics(),
        fetchRateLimits(),
        fetchNotificationStats()
      ]);
    };
    
    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': 
      case 'connected': 
      case 'pass': 
        return 'bg-green-500';
      case 'error': 
      case 'failed': 
      case 'fail': 
        return 'bg-red-500';
      case 'pending': 
      case 'warning': 
        return 'bg-yellow-500';
      default: 
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': 
      case 'connected': 
      case 'pass': 
        return <CheckCircle className="h-4 w-4" />;
      case 'error': 
      case 'failed': 
      case 'fail': 
        return <AlertCircle className="h-4 w-4" />;
      case 'pending': 
      case 'warning': 
        return <Clock className="h-4 w-4" />;
      default: 
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-muted-foreground">
            Monitor data synchronization, migrations, and system health
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => triggerSync()} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button 
            onClick={runMigrations} 
            disabled={isLoading}
          >
            <Database className="h-4 w-4 mr-2" />
            Run Migrations
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api-limits">API Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {qualityMetrics?.healthScore || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall data quality score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.dataSources?.filter(s => s.status === 'connected').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Data sources online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Notifications</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {notificationStats?.pendingCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting delivery
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Migration Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.migration.completedMigrations || 0}/
                  {systemStatus?.migration.totalMigrations || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Migrations complete
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
              <CardDescription>Latest data synchronization results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStatus?.recentSyncs?.slice(0, 5).map((sync, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(sync.status)}
                      <div>
                        <p className="text-sm font-medium">{sync.source}</p>
                        <p className="text-xs text-muted-foreground">
                          {sync.records_processed || 0} records processed
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(sync.status)}>
                      {sync.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Source Status</CardTitle>
              <CardDescription>Connection status and sync information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemStatus?.dataSources?.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(source.status)}
                      <div>
                        <p className="font-medium">{source.source}</p>
                        <p className="text-sm text-muted-foreground">
                          {source.error || 'Connected successfully'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(source.status)}>
                        {source.status}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => triggerSync(source.source)}
                        disabled={isLoading}
                      >
                        Sync
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Metrics</CardTitle>
              <CardDescription>Quality assessment across all data sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Overall Health Score</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={qualityMetrics?.healthScore || 0} className="w-32" />
                    <span className="text-sm font-medium">{qualityMetrics?.healthScore || 0}%</span>
                  </div>
                </div>
                
                {qualityMetrics?.summary && (
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{qualityMetrics.summary.passed}</div>
                      <div className="text-sm text-muted-foreground">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{qualityMetrics.summary.warnings}</div>
                      <div className="text-sm text-muted-foreground">Warnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{qualityMetrics.summary.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{qualityMetrics.summary.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notification Queue</CardTitle>
                <CardDescription>Manage pending and failed notifications</CardDescription>
              </div>
              <Button 
                onClick={processNotifications}
                disabled={isLoading}
              >
                Process Queue
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationStats?.stats?.map((stat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="capitalize">{stat.status}</span>
                    <Badge variant="secondary">{stat.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Rate Limits</CardTitle>
              <CardDescription>Current usage and limits for external APIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rateLimits.map((limit, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{limit.api_source}</span>
                      <span className="text-sm text-muted-foreground">
                        {limit.request_count}/{limit.limit_max}
                      </span>
                    </div>
                    <Progress 
                      value={(limit.request_count / limit.limit_max) * 100} 
                      className="h-2"
                    />
                    {limit.is_blocked && (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}