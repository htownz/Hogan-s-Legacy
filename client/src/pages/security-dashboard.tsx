import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Users,
  Lock,
  Eye,
  Ban,
  Flag,
  TrendingUp,
  Clock,
  Globe,
  FileText,
  Zap
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function SecurityDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Mock security data for demonstration
  const securityMetrics = {
    totalRequests: 15247,
    blockedRequests: 23,
    flaggedRequests: 8,
    civicEngagementRate: 97.8,
    suspiciousActivityDetected: 2,
    activeUsers: 1834,
    legitimateUsage: 99.2
  };

  const recentSecurityEvents = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      type: 'blocked',
      reason: 'Automated scraping attempt detected',
      ip: '192.168.1.100',
      endpoint: '/api/legiscan/search',
      severity: 'medium'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      type: 'flagged',
      reason: 'High request rate from single user',
      ip: '10.0.0.50',
      endpoint: '/api/translator/text',
      severity: 'low'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      type: 'allowed',
      reason: 'Verified civic engagement content',
      ip: '172.16.0.25',
      endpoint: '/api/smart-alerts/create',
      severity: 'info'
    }
  ];

  const usagePatterns = [
    { category: 'Bill Research', percentage: 45, requests: 6861 },
    { category: 'Legislative Alerts', percentage: 28, requests: 4269 },
    { category: 'Civic Education', percentage: 15, requests: 2287 },
    { category: 'Representative Contact', percentage: 8, requests: 1220 },
    { category: 'Other Legitimate', percentage: 4, requests: 610 }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'info': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
      case 'medium': return 'destructive';
      case 'low': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'blocked': return <Ban className="h-4 w-4 text-red-500" />;
      case 'flagged': return <Flag className="h-4 w-4 text-yellow-500" />;
      case 'allowed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Security Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor platform usage and ensure civic engagement integrity
              </p>
            </div>
          </div>
        </div>

        {/* Security Status Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Platform Security Status: Healthy</AlertTitle>
          <AlertDescription>
            All systems are operating normally. {securityMetrics.legitimateUsage}% of traffic is verified civic engagement.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="usage">Usage Patterns</TabsTrigger>
            <TabsTrigger value="controls">Security Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{securityMetrics.totalRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
                  <Ban className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{securityMetrics.blockedRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    0.15% of total traffic
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Civic Engagement Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{securityMetrics.civicEngagementRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Verified legitimate usage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{securityMetrics.activeUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Engaged citizens
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Purpose Validation</CardTitle>
                  <CardDescription>
                    AI-powered analysis of request purposes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Civic Engagement</span>
                      <span>97.8%</span>
                    </div>
                    <Progress value={97.8} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Educational Research</span>
                      <span>1.9%</span>
                    </div>
                    <Progress value={1.9} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Suspicious/Blocked</span>
                      <span>0.3%</span>
                    </div>
                    <Progress value={0.3} className="h-2 bg-red-100" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Measures</CardTitle>
                  <CardDescription>
                    Active protection systems
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Rate Limiting</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Content Validation</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Input Sanitization</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span className="text-sm">AI Purpose Detection</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>
                  Real-time monitoring of security-related activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSecurityEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{event.reason}</h4>
                          <Badge variant={getSeverityBadgeVariant(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <div>IP: {event.ip}</div>
                          <div>Endpoint: {event.endpoint}</div>
                          <div>Time: {event.timestamp.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage by Category</CardTitle>
                  <CardDescription>
                    Breakdown of legitimate civic engagement activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {usagePatterns.map((pattern, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{pattern.category}</span>
                        <span>{pattern.percentage}% ({pattern.requests.toLocaleString()})</span>
                      </div>
                      <Progress value={pattern.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Integrity</CardTitle>
                  <CardDescription>
                    Ensuring civic engagement mission alignment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {securityMetrics.legitimateUsage}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Verified civic engagement usage
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Legislative Research</span>
                      <span className="font-medium">45.2%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Bill Tracking & Alerts</span>
                      <span className="font-medium">28.1%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Civic Education</span>
                      <span className="font-medium">15.3%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Representative Engagement</span>
                      <span className="font-medium">11.4%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Controls</CardTitle>
                  <CardDescription>
                    Configure security settings and thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rate Limit (requests per 15 min)</label>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Standard Users: 100</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Analysis Threshold</label>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Confidence: 70%</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Auto-block Suspicious Activity</label>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Enabled</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monitoring Alerts</CardTitle>
                  <CardDescription>
                    Set up notifications for security events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Purpose Validation</AlertTitle>
                    <AlertDescription>
                      AI monitors all requests to ensure they align with civic engagement purposes.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Automated Protection</AlertTitle>
                    <AlertDescription>
                      Multiple security layers prevent misuse while preserving legitimate democratic participation.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}