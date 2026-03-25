import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  DollarSign,
  Building,
  Gavel,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  Globe,
  Shield,
  Zap
} from "lucide-react";

interface DataCollectionStatus {
  area: string;
  status: 'pending' | 'collecting' | 'completed' | 'error';
  progress: number;
  recordsCollected: number;
  lastUpdated?: string;
  sources: string[];
}

export default function ComprehensiveDataExpansion() {
  const [collectionStatus, setCollectionStatus] = useState<DataCollectionStatus[]>([
    {
      area: 'committees',
      status: 'pending',
      progress: 0,
      recordsCollected: 0,
      sources: ['Texas Legislature Online', 'Committee Schedules']
    },
    {
      area: 'campaignFinance',
      status: 'pending', 
      progress: 0,
      recordsCollected: 0,
      sources: ['Texas Ethics Commission', 'FEC Records']
    },
    {
      area: 'agencies',
      status: 'pending',
      progress: 0,
      recordsCollected: 0,
      sources: ['Texas Register', 'Agency Websites']
    },
    {
      area: 'contracts',
      status: 'pending',
      progress: 0,
      recordsCollected: 0,
      sources: ['Texas Comptroller', 'Procurement Portal']
    },
    {
      area: 'ethics',
      status: 'pending',
      progress: 0,
      recordsCollected: 0,
      sources: ['Texas Ethics Commission', 'Disclosure Forms']
    }
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Individual data collection mutations
  const collectCommitteesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data-expansion/committees');
      if (!response.ok) throw new Error('Failed to collect committee data');
      return response.json();
    },
    onSuccess: (data) => {
      updateCollectionStatus('committees', 'completed', 100, data.committees);
      toast({
        title: "Committee Data Collected",
        description: `Successfully collected ${data.committees} committee records`,
      });
    },
    onError: () => {
      updateCollectionStatus('committees', 'error', 0, 0);
    }
  });

  const collectCampaignFinanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data-expansion/campaign-finance');
      if (!response.ok) throw new Error('Failed to collect campaign finance data');
      return response.json();
    },
    onSuccess: (data) => {
      updateCollectionStatus('campaignFinance', 'completed', 100, data.records);
      toast({
        title: "Campaign Finance Data Collected", 
        description: `Successfully collected ${data.records} finance records`,
      });
    },
    onError: () => {
      updateCollectionStatus('campaignFinance', 'error', 0, 0);
    }
  });

  const collectAgenciesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data-expansion/state-agencies');
      if (!response.ok) throw new Error('Failed to collect agency data');
      return response.json();
    },
    onSuccess: (data) => {
      updateCollectionStatus('agencies', 'completed', 100, data.agencies);
      toast({
        title: "State Agency Data Collected",
        description: `Successfully collected ${data.agencies} agency records`,
      });
    },
    onError: () => {
      updateCollectionStatus('agencies', 'error', 0, 0);
    }
  });

  const collectContractsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data-expansion/contracts');
      if (!response.ok) throw new Error('Failed to collect contract data');
      return response.json();
    },
    onSuccess: (data) => {
      updateCollectionStatus('contracts', 'completed', 100, data.contracts);
      toast({
        title: "Contract Data Collected",
        description: `Successfully collected ${data.contracts} contract records`,
      });
    },
    onError: () => {
      updateCollectionStatus('contracts', 'error', 0, 0);
    }
  });

  const collectEthicsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data-expansion/ethics-violations');
      if (!response.ok) throw new Error('Failed to collect ethics data');
      return response.json();
    },
    onSuccess: (data) => {
      updateCollectionStatus('ethics', 'completed', 100, data.violations);
      toast({
        title: "Ethics Data Collected",
        description: `Successfully collected ${data.violations} ethics records`,
      });
    },
    onError: () => {
      updateCollectionStatus('ethics', 'error', 0, 0);
    }
  });

  // Comprehensive collection mutation
  const comprehensiveCollectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data-expansion/comprehensive-collection');
      if (!response.ok) throw new Error('Failed to complete comprehensive collection');
      return response.json();
    },
    onMutate: () => {
      // Start all collections
      setCollectionStatus(prev => prev.map(item => ({
        ...item,
        status: 'collecting' as const,
        progress: 20
      })));
    },
    onSuccess: (data) => {
      // Update all statuses to completed
      setCollectionStatus(prev => prev.map(item => ({
        ...item,
        status: 'completed' as const,
        progress: 100,
        recordsCollected: data.summary[item.area] || 0,
        lastUpdated: data.collectedAt
      })));
      
      toast({
        title: "Comprehensive Collection Complete",
        description: "All government data sources have been successfully collected!",
      });
    },
    onError: () => {
      setCollectionStatus(prev => prev.map(item => ({
        ...item,
        status: 'error' as const
      })));
    }
  });

  const updateCollectionStatus = (area: string, status: DataCollectionStatus['status'], progress: number, records: number) => {
    setCollectionStatus(prev => prev.map(item => 
      item.area === area 
        ? { ...item, status, progress, recordsCollected: records, lastUpdated: new Date().toISOString() }
        : item
    ));
  };

  const dataAreas = [
    {
      id: 'committees',
      title: 'Committee Data',
      description: 'Committee schedules, meetings, voting records',
      icon: Users,
      color: 'bg-blue-500',
      mutation: collectCommitteesMutation
    },
    {
      id: 'campaignFinance',
      title: 'Campaign Finance',
      description: 'Donations, expenditures, lobbying records',
      icon: DollarSign,
      color: 'bg-green-500',
      mutation: collectCampaignFinanceMutation
    },
    {
      id: 'agencies',
      title: 'State Agencies',
      description: 'Regulatory data, rulemaking, enforcement',
      icon: Building,
      color: 'bg-purple-500',
      mutation: collectAgenciesMutation
    },
    {
      id: 'contracts',
      title: 'State Contracts',
      description: 'Procurement, vendor payments, spending',
      icon: FileText,
      color: 'bg-orange-500',
      mutation: collectContractsMutation
    },
    {
      id: 'ethics',
      title: 'Ethics Records',
      description: 'Violations, disclosures, transparency',
      icon: Gavel,
      color: 'bg-red-500',
      mutation: collectEthicsMutation
    }
  ];

  const getStatusIcon = (status: DataCollectionStatus['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'collecting': return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DataCollectionStatus['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'collecting': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRecords = collectionStatus.reduce((sum, item) => sum + item.recordsCollected, 0);
  const completedAreas = collectionStatus.filter(item => item.status === 'completed').length;
  const overallProgress = (completedAreas / collectionStatus.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🚀 Comprehensive Data Expansion
          </h1>
          <p className="text-lg text-muted-foreground">
            Expanding beyond bills and legislators to collect comprehensive Texas government data
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Data Areas</h3>
              <p className="text-2xl font-bold text-blue-600">{dataAreas.length}</p>
              <p className="text-sm text-muted-foreground">Government sectors</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Records Collected</h3>
              <p className="text-2xl font-bold text-green-600">{totalRecords.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Authentic data points</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Completion</h3>
              <p className="text-2xl font-bold text-purple-600">{completedAreas}/{dataAreas.length}</p>
              <p className="text-sm text-muted-foreground">Areas completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Globe className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Data Sources</h3>
              <p className="text-2xl font-bold text-orange-600">8+</p>
              <p className="text-sm text-muted-foreground">Government APIs</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Collection Overview</TabsTrigger>
            <TabsTrigger value="individual">Individual Collection</TabsTrigger>
            <TabsTrigger value="comprehensive">Comprehensive Collection</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  Collection progress across all government data areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Completion</span>
                    <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {collectionStatus.map((item) => {
                const areaConfig = dataAreas.find(area => area.id === item.area);
                const IconComponent = areaConfig?.icon || Database;
                
                return (
                  <Card key={item.area}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`${areaConfig?.color} p-2 rounded-lg text-white`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{areaConfig?.title}</CardTitle>
                            <CardDescription>{areaConfig?.description}</CardDescription>
                          </div>
                        </div>
                        {getStatusIcon(item.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                          <span className="text-sm font-medium">
                            {item.recordsCollected.toLocaleString()} records
                          </span>
                        </div>
                        
                        <Progress value={item.progress} className="w-full" />
                        
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium mb-1">Data Sources:</div>
                          <div className="flex flex-wrap gap-1">
                            {item.sources.map((source, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {item.lastUpdated && (
                          <div className="text-xs text-muted-foreground">
                            Last updated: {new Date(item.lastUpdated).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Individual Collection Tab */}
          <TabsContent value="individual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Individual Data Collection</CardTitle>
                <CardDescription>
                  Collect data from specific government sectors one at a time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dataAreas.map((area) => {
                    const status = collectionStatus.find(s => s.area === area.id);
                    const IconComponent = area.icon;
                    
                    return (
                      <Card key={area.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6 text-center">
                          <div className={`${area.color} p-3 rounded-full text-white inline-flex mb-3`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold mb-2">{area.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{area.description}</p>
                          
                          <Button
                            onClick={() => area.mutation.mutate()}
                            disabled={area.mutation.isPending || status?.status === 'collecting'}
                            className="w-full"
                          >
                            {area.mutation.isPending ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Collecting...
                              </>
                            ) : status?.status === 'completed' ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Recollect Data
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Collect Data
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comprehensive Collection Tab */}
          <TabsContent value="comprehensive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Comprehensive Collection
                </CardTitle>
                <CardDescription>
                  Collect data from all five government sectors simultaneously for maximum efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">What will be collected:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>Committee schedules and voting records</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span>Campaign finance and lobbying data</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-purple-600" />
                          <span>State agency regulations and enforcement</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-orange-600" />
                          <span>State contracts and procurement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gavel className="h-4 w-4 text-red-600" />
                          <span>Ethics violations and disclosure forms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-indigo-600" />
                          <span>Transparency and accountability records</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      size="lg"
                      onClick={() => comprehensiveCollectionMutation.mutate()}
                      disabled={comprehensiveCollectionMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {comprehensiveCollectionMutation.isPending ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          Collecting All Data...
                        </>
                      ) : (
                        <>
                          <Database className="h-5 w-5 mr-2" />
                          Start Comprehensive Collection
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground text-center">
                    This will collect authentic data from 8+ Texas government sources including
                    Texas Ethics Commission, Texas Comptroller, and state agency databases.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}