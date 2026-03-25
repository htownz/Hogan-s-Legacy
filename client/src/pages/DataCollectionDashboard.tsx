import { useState } from "react";
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
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CollectionStatus {
  id: string;
  collection_type: string;
  status: string;
  records_collected: number;
  start_time: string;
  end_time?: string;
  errors_encountered: number;
}

interface DataMetrics {
  table_name: string;
  total_records: number;
  verified_records: number;
  source_authenticated: boolean;
  data_freshness_hours: number;
}

export default function DataCollectionDashboard() {
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query collection status
  const { data: collectionStatus, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/expanded-data/status"],
    refetchInterval: activeCollection ? 2000 : 30000, // Refresh every 2s when active
  });

  // Query data metrics
  const { data: dataMetrics } = useQuery<any>({
    queryKey: ["/api/expanded-data/metrics"],
    refetchInterval: 10000, // Refresh every 10s
  });

  // Mutation for starting comprehensive collection
  const startComprehensiveCollection = useMutation({
    mutationFn: () => apiRequest("/api/expanded-data/collect/comprehensive", "POST", {
      sources: ["committees", "hearings", "voting_records", "ethics_data", "historical_sessions"]
    }),
    onSuccess: () => {
      setActiveCollection("comprehensive");
      queryClient.invalidateQueries({ queryKey: ["/api/expanded-data/status"] });
    },
  });

  // Mutation for starting committee collection
  const startCommitteeCollection = useMutation({
    mutationFn: () => apiRequest("/api/expanded-data/collect/committees", "POST"),
    onSuccess: () => {
      setActiveCollection("committees");
      queryClient.invalidateQueries({ queryKey: ["/api/expanded-data/status"] });
    },
  });

  // Mutation for starting voting records collection
  const startVotingCollection = useMutation({
    mutationFn: () => apiRequest("/api/expanded-data/collect/voting-records", "POST"),
    onSuccess: () => {
      setActiveCollection("voting-records");
      queryClient.invalidateQueries({ queryKey: ["/api/expanded-data/status"] });
    },
  });

  // Mutation for starting ethics data collection
  const startEthicsCollection = useMutation({
    mutationFn: () => apiRequest("/api/expanded-data/collect/ethics-data", "POST"),
    onSuccess: () => {
      setActiveCollection("ethics-data");
      queryClient.invalidateQueries({ queryKey: ["/api/expanded-data/status"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Running": return "bg-blue-500";
      case "Completed": return "bg-green-500";
      case "Failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Running": return <Clock className="h-4 w-4" />;
      case "Completed": return <CheckCircle className="h-4 w-4" />;
      case "Failed": return <AlertCircle className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const collections = [
    {
      id: "comprehensive",
      title: "Comprehensive Collection",
      description: "Collect all Texas government data sources",
      icon: <Database className="h-6 w-6" />,
      mutation: startComprehensiveCollection,
      sources: ["Committees", "Hearings", "Voting Records", "Ethics Data", "Historical Sessions"]
    },
    {
      id: "committees",
      title: "Committee Data",
      description: "Texas House and Senate committees",
      icon: <Building2 className="h-6 w-6" />,
      mutation: startCommitteeCollection,
      sources: ["Committee Information", "Membership", "Leadership"]
    },
    {
      id: "voting-records",
      title: "Voting Records",
      description: "Legislative voting patterns",
      icon: <Gavel className="h-6 w-6" />,
      mutation: startVotingCollection,
      sources: ["Roll Call Votes", "Bill Outcomes", "Legislator Positions"]
    },
    {
      id: "ethics-data",
      title: "Ethics Data",
      description: "Texas Ethics Commission data",
      icon: <Shield className="h-6 w-6" />,
      mutation: startEthicsCollection,
      sources: ["Financial Disclosures", "Lobby Registrations", "Campaign Finance"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Texas Government Data Collection
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Gather authentic legislative data from official Texas government sources
          </p>
        </div>

        {/* Active Collection Status */}
        {activeCollection && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 animate-spin" />
                Active Collection in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-white">
                  <span>Collection Type: {activeCollection}</span>
                  <Badge variant="secondary">Running</Badge>
                </div>
                <Progress value={65} className="h-2" />
                <p className="text-blue-200 text-sm">
                  Collecting data from official Texas government websites...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collection Controls */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <Card key={collection.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="text-blue-400">
                    {collection.icon}
                  </div>
                  <CardTitle className="text-white text-lg">
                    {collection.title}
                  </CardTitle>
                </div>
                <p className="text-blue-200 text-sm">
                  {collection.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {collection.sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-blue-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {source}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => collection.mutation.mutate()}
                  disabled={collection.mutation.isPending || activeCollection !== null}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {collection.mutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Collection
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Collection History */}
        {collectionStatus && Array.isArray(collectionStatus) && collectionStatus.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Collection Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectionStatus.slice(0, 5).map((status: CollectionStatus) => (
                  <div key={status.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getStatusColor(status.status)}`}>
                        {getStatusIcon(status.status)}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {status.collection_type}
                        </p>
                        <p className="text-blue-200 text-sm">
                          Started: {new Date(status.start_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {status.records_collected} records
                      </p>
                      <Badge variant={status.status === "Completed" ? "default" : "secondary"}>
                        {status.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Quality Metrics */}
        {dataMetrics && Array.isArray(dataMetrics) && dataMetrics.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Quality & Authenticity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataMetrics.map((metric: DataMetrics, index: number) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium capitalize">
                        {metric.table_name.replace('_', ' ')}
                      </h4>
                      <Badge variant={metric.source_authenticated ? "default" : "destructive"}>
                        {metric.source_authenticated ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <p className="text-blue-200 text-sm">
                      {metric.total_records} total records
                    </p>
                    <p className="text-blue-200 text-sm">
                      Updated {metric.data_freshness_hours}h ago
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}