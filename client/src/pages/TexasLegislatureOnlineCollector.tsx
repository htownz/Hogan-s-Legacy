import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Download, 
  RefreshCw,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  Vote,
  MapPin,
  Crown,
  FileText,
  Globe
} from "lucide-react";

interface TexasLegislatureData {
  committees: any[];
  meetings: any[];
  members: any[];
  sessions: any[];
  votes: any[];
  calendar: any[];
  leadership: any[];
  districts: any[];
}

interface CollectionResult {
  success: boolean;
  message: string;
  totalRecords: number;
  summary: {
    committees: number;
    meetings: number;
    members: number;
    sessions: number;
    votes: number;
    calendar: number;
    leadership: number;
    districts: number;
  };
  data: TexasLegislatureData;
  sources: string[];
  collectedAt: string;
}

export default function TexasLegislatureOnlineCollector() {
  const [collectionResult, setCollectionResult] = useState<CollectionResult | null>(null);
  const { toast } = useToast();

  const collectDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data-expansion/texas-legislature-online');
      if (!response.ok) throw new Error('Failed to collect Texas Legislature Online data');
      return response.json();
    },
    onSuccess: (data: CollectionResult) => {
      setCollectionResult(data);
      toast({
        title: "Collection Complete!",
        description: `Successfully collected ${data.totalRecords} records from Texas Legislature Online`,
      });
    },
    onError: () => {
      toast({
        title: "Collection Failed",
        description: "Unable to collect data from Texas Legislature Online. Please try again.",
        variant: "destructive"
      });
    }
  });

  const dataCategories = [
    {
      key: 'committees',
      title: 'Committees',
      description: 'House & Senate committees with chairs and jurisdiction',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      key: 'meetings',
      title: 'Committee Meetings',
      description: 'Scheduled meetings with agendas and livestreams',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      key: 'members',
      title: 'Legislative Members',
      description: 'Representatives and Senators by district',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      key: 'sessions',
      title: 'Session Information',
      description: 'Current session data and bill statistics',
      icon: FileText,
      color: 'bg-orange-500'
    },
    {
      key: 'votes',
      title: 'Voting Records',
      description: 'Committee and floor voting records',
      icon: Vote,
      color: 'bg-red-500'
    },
    {
      key: 'calendar',
      title: 'Legislative Calendar',
      description: 'Floor sessions and scheduled events',
      icon: Calendar,
      color: 'bg-indigo-500'
    },
    {
      key: 'leadership',
      title: 'Leadership',
      description: 'Speaker, Lieutenant Governor, and committee chairs',
      icon: Crown,
      color: 'bg-yellow-500'
    },
    {
      key: 'districts',
      title: 'District Information',
      description: 'Legislative districts with population data',
      icon: MapPin,
      color: 'bg-teal-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🏛️ Texas Legislature Online Collector
          </h1>
          <p className="text-lg text-muted-foreground">
            Targeted collection from official Texas Legislature sources: capitol.texas.gov, house.texas.gov, senate.texas.gov
          </p>
        </div>

        {/* Collection Control */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Start Texas Legislature Online Collection
            </CardTitle>
            <CardDescription>
              Connect directly to official Texas Legislature websites and collect comprehensive legislative data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-sm">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>capitol.texas.gov</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span>house.texas.gov</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <span>senate.texas.gov</span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => collectDataMutation.mutate()}
                disabled={collectDataMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {collectDataMutation.isPending ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Collecting from Texas Legislature Online...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Start Collection
                  </>
                )}
              </Button>

              {collectDataMutation.isPending && (
                <div className="w-full">
                  <Progress value={75} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Collecting data from Texas Legislature Online sources...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Collection Results */}
        {collectionResult && (
          <>
            {/* Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Collection Complete
                </CardTitle>
                <CardDescription>
                  Successfully collected {collectionResult.totalRecords} records from Texas Legislature Online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{collectionResult.totalRecords}</div>
                    <div className="text-sm text-muted-foreground">Total Records</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{collectionResult.sources.length}</div>
                    <div className="text-sm text-muted-foreground">Data Sources</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">8</div>
                    <div className="text-sm text-muted-foreground">Data Categories</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      <Clock className="h-6 w-6 mx-auto" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(collectionResult.collectedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dataCategories.map((category) => {
                const IconComponent = category.icon;
                const count = collectionResult.summary[category.key as keyof typeof collectionResult.summary];
                
                return (
                  <Card key={category.key} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`${category.color} p-3 rounded-full text-white`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className="text-lg font-bold">
                          {count}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold mb-2">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                      
                      {count > 0 && (
                        <div className="mt-4">
                          <Progress value={100} className="h-2" />
                          <p className="text-xs text-green-600 mt-1">✓ Collected</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Data Sources */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
                <CardDescription>Official Texas Legislature websites accessed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collectionResult.sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{source}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!collectionResult && !collectDataMutation.isPending && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Collect Texas Legislature Data</h3>
              <p className="text-muted-foreground mb-6">
                Connect directly to official Texas Legislature sources and collect comprehensive legislative information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">What will be collected:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Committee information and schedules</li>
                    <li>• Legislative member details</li>
                    <li>• Voting records and session data</li>
                    <li>• Leadership and district information</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Authentic sources:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Texas Capitol website</li>
                    <li>• House of Representatives</li>
                    <li>• Texas Senate</li>
                    <li>• Official legislative databases</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}