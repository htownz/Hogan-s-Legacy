import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "../components/shared/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  FileCheck,
  Globe,
  Clock,
  Zap,
  RefreshCw,
  Settings,
  Eye,
  TrendingUp,
  BarChart3
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function SafetyStandardsDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Mock safety standards data
  const safetyMetrics = {
    totalVerifications: 8542,
    successfulVerifications: 8234,
    failedVerifications: 238,
    blockedOperations: 70,
    verificationAccuracy: 96.4,
    dataIntegrityScore: 98.1,
    crossReferenceRate: 94.7,
    averageConfidence: 0.87
  };

  const recentVerifications = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      operation: 'Bill Data Update',
      billId: 'HB 2024',
      status: 'verified',
      confidence: 0.94,
      sources: 3,
      issues: 0
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      operation: 'Ethics Data Verification',
      billId: 'SB 891',
      status: 'flagged',
      confidence: 0.67,
      sources: 2,
      issues: 1
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      operation: 'Legislator Profile Update',
      billId: 'REP-12345',
      status: 'blocked',
      confidence: 0.34,
      sources: 1,
      issues: 3
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
      operation: 'Bill Status Change',
      billId: 'HB 1776',
      status: 'verified',
      confidence: 0.91,
      sources: 4,
      issues: 0
    }
  ];

  const verificationSources = [
    { name: 'LegiScan API', reliability: 95, verifications: 3421, status: 'active' },
    { name: 'Texas Legislature Official', reliability: 93, verifications: 2156, status: 'active' },
    { name: 'Texas Ethics Commission', reliability: 91, verifications: 1876, status: 'active' },
    { name: 'Secretary of State', reliability: 89, verifications: 987, status: 'active' },
    { name: 'Legislative Reference Library', reliability: 87, verifications: 102, status: 'active' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'flagged': return 'text-yellow-600';
      case 'blocked': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'blocked': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'flagged': return 'secondary';
      case 'blocked': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Safety Standards Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor data verification, cross-referencing, and integrity protocols
              </p>
            </div>
          </div>
        </div>

        {/* Safety Status Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Safety Standards: Active & Monitoring</AlertTitle>
          <AlertDescription>
            All data verification protocols are active. {safetyMetrics.dataIntegrityScore}% data integrity maintained across all sources.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verifications">Live Verifications</TabsTrigger>
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
            <TabsTrigger value="controls">Safety Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safetyMetrics.totalVerifications.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +15% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Integrity Score</CardTitle>
                  <Database className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safetyMetrics.dataIntegrityScore}%</div>
                  <p className="text-xs text-muted-foreground">
                    Exceeds safety threshold
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cross-Reference Rate</CardTitle>
                  <Globe className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safetyMetrics.crossReferenceRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Multi-source verification
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Blocked Operations</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safetyMetrics.blockedOperations}</div>
                  <p className="text-xs text-muted-foreground">
                    Safety protocols active
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Pipeline Status</CardTitle>
                  <CardDescription>
                    Real-time status of data verification processes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Primary Source Verification</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cross-Reference Checking</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>AI Consistency Analysis</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Timeliness Validation</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety Protocols</CardTitle>
                  <CardDescription>
                    Active safety measures and their effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Pre-Database Verification</span>
                    </div>
                    <Badge variant="default">100% Coverage</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Real-Time Cross-Referencing</span>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Result Verification</span>
                    </div>
                    <Badge variant="default">Monitoring</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Audit Trail Logging</span>
                    </div>
                    <Badge variant="default">Complete</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Verification Activities</CardTitle>
                <CardDescription>
                  Live monitoring of data verification and cross-referencing operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentVerifications.map((verification) => (
                    <div key={verification.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getStatusIcon(verification.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{verification.operation}</h4>
                          <Badge variant={getStatusBadge(verification.status) as any}>
                            {verification.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <div>Bill/Entity: {verification.billId}</div>
                          <div>Confidence: {(verification.confidence * 100).toFixed(1)}%</div>
                          <div>Sources Verified: {verification.sources}</div>
                          <div>Issues Found: {verification.issues}</div>
                          <div>Time: {verification.timestamp.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Authorized Data Sources</CardTitle>
                <CardDescription>
                  Official sources used for cross-reference verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verificationSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{source.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {source.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <div>Reliability: {source.reliability}%</div>
                          <div>Verifications: {source.verifications.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">{source.reliability}%</div>
                          <div className="text-xs text-muted-foreground">Reliability</div>
                        </div>
                        <Progress value={source.reliability} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Thresholds</CardTitle>
                  <CardDescription>
                    Configure minimum standards for data acceptance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Minimum Confidence Score</label>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>70%</span>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Required Sources</label>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Minimum 2 sources</span>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Auto-block Threshold</label>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Confidence {'<'} 50%</span>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety Protocols Status</CardTitle>
                  <CardDescription>
                    Monitor and control safety standard enforcement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Data Integrity Protection</AlertTitle>
                    <AlertDescription>
                      All database operations require verification before execution.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertTitle>Multi-Source Verification</AlertTitle>
                    <AlertDescription>
                      Cross-referencing with {verificationSources.length} authorized sources ensures accuracy.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertTitle>Real-Time Monitoring</AlertTitle>
                    <AlertDescription>
                      Continuous verification and audit trail for all operations.
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