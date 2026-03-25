import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Users, 
  FileText, 
  Building2, 
  Gavel, 
  History,
  Shield,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function RealTimeDataDashboard() {
  const [isCollecting, setIsCollecting] = useState(false);
  const queryClient = useQueryClient();

  // Query data status with real-time updates
  const { data: dataStatus, isLoading } = useQuery<any>({
    queryKey: ["/api/expanded-data/status"],
    refetchInterval: 2000, // Update every 2 seconds
  });

  // Query current database counts
  const { data: dbCounts } = useQuery<any>({
    queryKey: ["/api/expanded-data/metrics"],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Start comprehensive collection
  const startCollection = useMutation({
    mutationFn: () => apiRequest("/api/expanded-data/collect/comprehensive", "POST", {
      sources: ["committees", "hearings", "voting_records", "ethics_data", "historical_sessions"],
      useOpenStatesAPI: true,
      useLegiScanAPI: true
    }),
    onSuccess: () => {
      setIsCollecting(true);
      queryClient.invalidateQueries({ queryKey: ["/api/expanded-data/status"] });
    },
  });

  // Individual collection triggers
  const collectCommittees = useMutation({
    mutationFn: () => apiRequest("/api/expanded-data/collect/committees", "POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/expanded-data/status"] }),
  });

  const collectVotingRecords = useMutation({
    mutationFn: () => apiRequest("/api/expanded-data/collect/voting-records", "POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/expanded-data/status"] }),
  });

  const collectEthicsData = useMutation({
    mutationFn: () => apiRequest("/api/expanded-data/collect/ethics-data", "POST"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/expanded-data/status"] }),
  });

  const getStatusColor = (count: number) => {
    if (count === 0) return "text-yellow-400";
    if (count < 50) return "text-blue-400";
    if (count < 200) return "text-green-400";
    return "text-emerald-400";
  };

  const getProgressValue = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const dataTargets = {
    committees: 50,      // Target: 50 committees
    hearings: 500,       // Target: 500 hearings
    votingRecords: 2000, // Target: 2000 votes
    ethicsRecords: 1000, // Target: 1000 ethics records
    historicalSessions: 20 // Target: 20 sessions
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Real-Time Texas Data Collection
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Monitor authentic data collection from official Texas government sources
          </p>
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span>System Active & Collecting Data</span>
          </div>
        </div>

        {/* Real-Time Status Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Committees */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Building2 className="h-6 w-6 text-blue-400" />
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                  Committees
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-white">
                  {dataStatus?.data?.dataCollected?.committees || 0}
                </div>
                <Progress 
                  value={getProgressValue(dataStatus?.data?.dataCollected?.committees || 0, dataTargets.committees)} 
                  className="h-2"
                />
                <p className="text-sm text-blue-200">
                  Target: {dataTargets.committees} committees
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => collectCommittees.mutate()}
                  disabled={collectCommittees.isPending}
                  className="w-full bg-blue-600/20 border-blue-400/30 text-blue-200 hover:bg-blue-600/30"
                >
                  {collectCommittees.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Collect Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hearings */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <FileText className="h-6 w-6 text-green-400" />
                <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                  Hearings
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-white">
                  {dataStatus?.data?.dataCollected?.hearings || 0}
                </div>
                <Progress 
                  value={getProgressValue(dataStatus?.data?.dataCollected?.hearings || 0, dataTargets.hearings)} 
                  className="h-2"
                />
                <p className="text-sm text-blue-200">
                  Target: {dataTargets.hearings} hearings
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-green-600/20 border-green-400/30 text-green-200 hover:bg-green-600/30"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voting Records */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Gavel className="h-6 w-6 text-purple-400" />
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                  Votes
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-white">
                  {dataStatus?.data?.dataCollected?.votingRecords || 0}
                </div>
                <Progress 
                  value={getProgressValue(dataStatus?.data?.dataCollected?.votingRecords || 0, dataTargets.votingRecords)} 
                  className="h-2"
                />
                <p className="text-sm text-blue-200">
                  Target: {dataTargets.votingRecords} votes
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => collectVotingRecords.mutate()}
                  disabled={collectVotingRecords.isPending}
                  className="w-full bg-purple-600/20 border-purple-400/30 text-purple-200 hover:bg-purple-600/30"
                >
                  {collectVotingRecords.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Collect Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ethics Data */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Shield className="h-6 w-6 text-orange-400" />
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-200">
                  Ethics
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-white">
                  {dataStatus?.data?.dataCollected?.ethicsRecords || 0}
                </div>
                <Progress 
                  value={getProgressValue(dataStatus?.data?.dataCollected?.ethicsRecords || 0, dataTargets.ethicsRecords)} 
                  className="h-2"
                />
                <p className="text-sm text-blue-200">
                  Target: {dataTargets.ethicsRecords} records
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => collectEthicsData.mutate()}
                  disabled={collectEthicsData.isPending}
                  className="w-full bg-orange-600/20 border-orange-400/30 text-orange-200 hover:bg-orange-600/30"
                >
                  {collectEthicsData.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Collect Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historical Sessions */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <History className="h-6 w-6 text-cyan-400" />
                <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-200">
                  Sessions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-white">
                  {dataStatus?.data?.dataCollected?.historicalSessions || 0}
                </div>
                <Progress 
                  value={getProgressValue(dataStatus?.data?.dataCollected?.historicalSessions || 0, dataTargets.historicalSessions)} 
                  className="h-2"
                />
                <p className="text-sm text-blue-200">
                  Target: {dataTargets.historicalSessions} sessions
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-cyan-600/20 border-cyan-400/30 text-cyan-200 hover:bg-cyan-600/30"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Master Control Panel */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Master Data Collection Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Collection Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Total Records Collected:</span>
                    <span className="text-white font-bold">
                      {dataStatus?.data?.totalRecords || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Collection Status:</span>
                    <Badge variant={dataStatus?.data?.collectionStatus === "Active" ? "default" : "secondary"}>
                      {dataStatus?.data?.collectionStatus || "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">Last Updated:</span>
                    <span className="text-white text-sm">
                      {dataStatus?.data?.lastUpdated ? 
                        new Date(dataStatus.data.lastUpdated).toLocaleTimeString() : 
                        "Never"
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => startCollection.mutate()}
                    disabled={startCollection.isPending || isCollecting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    size="lg"
                  >
                    {startCollection.isPending || isCollecting ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Collection In Progress...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Start Comprehensive Collection
                      </>
                    )}
                  </Button>
                  
                  <div className="text-sm text-blue-200 text-center">
                    Collects from: Texas Legislature, Ethics Commission, OpenStates API
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources Status */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Official Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {dataStatus?.data?.dataSources?.map((source: string, index: number) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-white font-medium text-sm">Connected</span>
                  </div>
                  <p className="text-blue-200 text-sm">{source}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}