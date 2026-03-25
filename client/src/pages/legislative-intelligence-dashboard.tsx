// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  Network, 
  DollarSign, 
  Users, 
  FileText, 
  TrendingUp,
  Eye,
  Link2,
  Database,
  Target,
  Zap,
  Brain,
  BarChart3,
  GitBranch,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { EnhancedBillCard } from "@/components/EnhancedBillCard";
import { EnhancedLegislatorCard } from "@/components/EnhancedLegislatorCard";
import { AdvancedSearchIntelligence } from "@/components/AdvancedSearchIntelligence";
import { InteractiveNetworkVisualization } from "@/components/InteractiveNetworkVisualization";

interface Bill {
  id: string;
  title: string;
  description: string;
  chamber: string;
  status: string;
  sponsors: string;
  introducedAt: string;
  subjects: string[];
  committee?: string;
  billNumber?: string;
}

interface Legislator {
  id: string;
  name: string;
  chamber: string;
  district: string;
  party: string;
  committees: string[];
  email?: string;
  phone?: string;
}

export default function LegislativeIntelligenceDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLegislator, setSelectedLegislator] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [filterChamber, setFilterChamber] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch authentic Texas bills data
  const { data: billsData, isLoading: billsLoading } = useQuery<any>({
    queryKey: ['/api/bills/texas-authentic'],
    enabled: true
  });

  // Fetch authentic Texas legislators data
  const { data: legislatorsData, isLoading: legislatorsLoading } = useQuery<any>({
    queryKey: ['/api/legislators/texas-authentic'],
    enabled: true
  });

  const bills: Bill[] = Array.isArray(billsData) ? billsData : [];
  const legislators: Legislator[] = Array.isArray(legislatorsData) ? legislatorsData : [];

  // Advanced search and filtering logic
  const filteredBills = bills.filter(bill => {
    const matchesSearch = searchQuery === "" || 
      bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.sponsors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.billNumber && bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesChamber = filterChamber === "all" || bill.chamber.toLowerCase().includes(filterChamber.toLowerCase());
    const matchesStatus = filterStatus === "all" || bill.status === filterStatus;
    
    return matchesSearch && matchesChamber && matchesStatus;
  });

  const filteredLegislators = legislators.filter(legislator => {
    return searchQuery === "" || 
      legislator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      legislator.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      legislator.committees.join(" ").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Connection analysis functions
  const findLegislatorBills = (legislatorName: string) => {
    return bills.filter(bill => 
      bill.sponsors.toLowerCase().includes(legislatorName.toLowerCase())
    );
  };

  const findBillConnections = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return { legislators: [], relatedBills: [] };

    const relatedLegislators = legislators.filter(leg => 
      bill.sponsors.toLowerCase().includes(leg.name.toLowerCase())
    );

    const relatedBills = bills.filter(b => 
      b.id !== billId && 
      (b.subjects.some(subject => bill.subjects.includes(subject)) ||
       b.committee === bill.committee)
    ).slice(0, 5);

    return { legislators: relatedLegislators, relatedBills };
  };

  const analyzeNetworkConnections = () => {
    const connections = new Map();
    
    bills.forEach(bill => {
      const sponsorNames = bill.sponsors.split(',').map(s => s.trim());
      sponsorNames.forEach(sponsor => {
        if (!connections.has(sponsor)) {
          connections.set(sponsor, {
            billCount: 0,
            subjects: new Set(),
            committees: new Set(),
            cosponsors: new Set()
          });
        }
        
        const data = connections.get(sponsor);
        data.billCount++;
        bill.subjects.forEach(subject => data.subjects.add(subject));
        if (bill.committee) data.committees.add(bill.committee);
        
        // Track co-sponsors
        sponsorNames.forEach(cosponsor => {
          if (cosponsor !== sponsor) {
            data.cosponsors.add(cosponsor);
          }
        });
      });
    });

    return Array.from(connections.entries()).map(([name, data]) => ({
      name,
      billCount: data.billCount,
      subjects: Array.from(data.subjects),
      committees: Array.from(data.committees),
      cosponsors: Array.from(data.cosponsors),
      influence: data.billCount * data.cosponsors.size
    })).sort((a, b) => b.influence - a.influence);
  };

  const networkAnalysis = analyzeNetworkConnections();

  if (billsLoading || legislatorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-xl">Loading legislative intelligence data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #1e40af 50%, #3730a3 75%, #4c1d95 100%)'
    }}>
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">
                Legislative Intelligence Dashboard
              </h1>
              <p className="text-slate-300 text-lg">
                Connect the dots between {bills.length} bills, {legislators.length} legislators, and policy networks
              </p>
            </div>
            <div className="flex gap-4">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Advanced Search Intelligence */}
        <AdvancedSearchIntelligence 
          onSearchResults={(results) => {
            // Update filtered bills with search results
            setSearchQuery(''); // Clear the simple search since we're using advanced search
          }}
          onFilterChange={(filters) => {
            // Handle filter changes from advanced search
            console.log('Advanced filters applied:', filters);
          }}
        />

        {/* Legacy Filters for Chamber and Status */}
        <Card className="mb-8 border-0 shadow-2xl" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <CardContent className="py-4">
            <div className="flex gap-4 items-center">
              <span className="text-slate-300 font-medium">Additional Filters:</span>
              <Select value={filterChamber} onValueChange={setFilterChamber}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Chamber" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chambers</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="senate">Senate</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-black/30 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 text-white">
              <Database className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bills" className="data-[state=active]:bg-blue-600 text-white">
              <FileText className="w-4 h-4 mr-2" />
              Bills Analysis
            </TabsTrigger>
            <TabsTrigger value="legislators" className="data-[state=active]:bg-purple-600 text-white">
              <Users className="w-4 h-4 mr-2" />
              Legislators
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-orange-600 text-white">
              <Network className="w-4 h-4 mr-2" />
              Network Analysis
            </TabsTrigger>
            <TabsTrigger value="visualization" className="data-[state=active]:bg-cyan-600 text-white">
              <GitBranch className="w-4 h-4 mr-2" />
              Network Graph
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-pink-600 text-white">
              <GitBranch className="w-4 h-4 mr-2" />
              Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-2xl" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))',
                backdropFilter: 'blur(10px)'
              }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Total Bills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-400">{bills.length}</div>
                  <p className="text-sm text-slate-400">Authentic Texas legislation</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                backdropFilter: 'blur(10px)'
              }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Active Legislators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">{legislators.length}</div>
                  <p className="text-sm text-slate-400">House & Senate members</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl" style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                backdropFilter: 'blur(10px)'
              }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">{filteredBills.length}</div>
                  <p className="text-sm text-slate-400">Matching current filters</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-2xl" style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.1))',
                backdropFilter: 'blur(10px)'
              }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Network Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-400">{networkAnalysis.length}</div>
                  <p className="text-sm text-slate-400">Sponsor relationships</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <Card className="border-0 shadow-2xl" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Brain className="w-6 h-6 text-emerald-400" />
                  Key Insights from Current Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Most Active Sponsors</h3>
                    <div className="space-y-2">
                      {networkAnalysis.slice(0, 5).map((sponsor, index) => (
                        <div key={sponsor.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <span className="text-white">{sponsor.name}</span>
                          <Badge className="bg-emerald-600">{sponsor.billCount} bills</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Popular Subjects</h3>
                    <div className="space-y-2">
                      {Array.from(new Set(filteredBills.flatMap(bill => bill.subjects)))
                        .slice(0, 5)
                        .map((subject, index) => (
                          <div key={subject} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <span className="text-white">{subject}</span>
                            <Badge className="bg-blue-600">
                              {filteredBills.filter(bill => bill.subjects.includes(subject)).length}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="space-y-6">
            <div className="grid gap-6">
              {filteredBills.slice(0, 20).map((bill) => (
                <EnhancedBillCard
                  key={bill.id}
                  bill={bill}
                  onSelect={setSelectedBill}
                  isSelected={selectedBill === bill.id}
                  showConnections={true}
                  relatedLegislators={findBillConnections(bill.id).legislators}
                  relatedBills={findBillConnections(bill.id).relatedBills}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="legislators" className="space-y-6">
            <div className="grid gap-6">
              {filteredLegislators.map((legislator) => (
                <Card 
                  key={legislator.id}
                  className={`border-0 shadow-2xl cursor-pointer transition-all duration-300 ${
                    selectedLegislator === legislator.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={() => setSelectedLegislator(selectedLegislator === legislator.id ? null : legislator.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-white mb-2">{legislator.name}</CardTitle>
                        <div className="flex gap-2 mb-3">
                          <Badge className="bg-blue-600">{legislator.chamber}</Badge>
                          <Badge className="bg-purple-600">{legislator.party}</Badge>
                          <Badge className="bg-emerald-600">District {legislator.district}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        {legislator.email && <p>{legislator.email}</p>}
                        {legislator.phone && <p>{legislator.phone}</p>}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {selectedLegislator === legislator.id && (
                    <CardContent className="border-t border-white/10 pt-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-bold text-white mb-3">Committees</h4>
                          <div className="space-y-1">
                            {legislator.committees.map((committee, index) => (
                              <Badge key={index} className="bg-orange-600 mr-2 mb-1">{committee}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white mb-3">Sponsored Bills</h4>
                          <div className="space-y-2">
                            {findLegislatorBills(legislator.name).slice(0, 5).map((bill) => (
                              <div key={bill.id} className="p-2 rounded bg-white/5">
                                <p className="text-white font-medium">{bill.title}</p>
                                <p className="text-slate-400 text-sm">{bill.status}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <Card className="border-0 shadow-2xl" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Network className="w-6 h-6 text-orange-400" />
                  Legislative Network Analysis
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Influence rankings based on bill sponsorship and collaboration patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {networkAnalysis.slice(0, 15).map((sponsor, index) => (
                    <div key={sponsor.name} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{sponsor.name}</h3>
                            <p className="text-slate-400 text-sm">Influence Score: {sponsor.influence}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-emerald-600 mb-1">{sponsor.billCount} bills</Badge>
                          <br />
                          <Badge className="bg-blue-600">{sponsor.cosponsors.length} collaborators</Badge>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-300 mb-2">Key Subject Areas</h4>
                          <div className="flex flex-wrap gap-1">
                            {sponsor.subjects.slice(0, 5).map((subject, idx) => (
                              <Badge key={idx} className="bg-purple-600 text-xs">{subject}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-300 mb-2">Top Collaborators</h4>
                          <div className="flex flex-wrap gap-1">
                            {sponsor.cosponsors.slice(0, 3).map((cosponsor, idx) => (
                              <Badge key={idx} className="bg-cyan-600 text-xs">{cosponsor}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visualization" className="space-y-6">
            <InteractiveNetworkVisualization 
              onNodeSelect={(node) => {
                console.log('Selected node:', node);
                // You can add additional logic here to show node details
              }}
            />
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <Card className="border-0 shadow-2xl" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <GitBranch className="w-6 h-6 text-pink-400" />
                  Connection Explorer
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Explore relationships between bills, legislators, and policy areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-lg">
                    <GitBranch className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Interactive Connection Map</h3>
                    <p className="text-slate-300 mb-6">
                      Select a bill or legislator above to explore their network connections
                    </p>
                    
                    {(selectedBill || selectedLegislator) && (
                      <div className="mt-6 p-4 bg-white/5 rounded-lg">
                        <h4 className="text-lg font-bold text-white mb-4">
                          {selectedBill ? 'Bill Connections' : 'Legislator Network'}
                        </h4>
                        
                        {selectedBill && (
                          <div>
                            {(() => {
                              const connections = findBillConnections(selectedBill);
                              return (
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="text-white font-bold mb-2">Connected Legislators</h5>
                                    {connections.legislators.map(leg => (
                                      <div key={leg.id} className="p-2 mb-2 bg-white/5 rounded">
                                        <p className="text-white">{leg.name}</p>
                                        <p className="text-slate-400 text-sm">{leg.party} - District {leg.district}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <h5 className="text-white font-bold mb-2">Related Bills</h5>
                                    {connections.relatedBills.map(bill => (
                                      <div key={bill.id} className="p-2 mb-2 bg-white/5 rounded">
                                        <p className="text-white text-sm">{bill.title.substring(0, 60)}...</p>
                                        <p className="text-slate-400 text-xs">{bill.status}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {selectedLegislator && (
                          <div>
                            {(() => {
                              const legislator = legislators.find(l => l.id === selectedLegislator);
                              const sponsoredBills = findLegislatorBills(legislator?.name || '');
                              return (
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="text-white font-bold mb-2">Sponsored Bills</h5>
                                    {sponsoredBills.slice(0, 5).map(bill => (
                                      <div key={bill.id} className="p-2 mb-2 bg-white/5 rounded">
                                        <p className="text-white text-sm">{bill.title.substring(0, 60)}...</p>
                                        <p className="text-slate-400 text-xs">{bill.status}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <h5 className="text-white font-bold mb-2">Committee Assignments</h5>
                                    {legislator?.committees.map((committee, idx) => (
                                      <div key={idx} className="p-2 mb-2 bg-white/5 rounded">
                                        <p className="text-white text-sm">{committee}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
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