import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Search, 
  TrendingUp, 
  Users, 
  Building2,
  ArrowRight,
  Eye,
  AlertCircle
} from "lucide-react";

export default function TexasCampaignFinance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const { data: campaignData, isLoading } = useQuery<any>({
    queryKey: ['/api/texas/campaign-finance'],
    retry: false,
  });

  const candidates = campaignData?.data?.candidates || [];
  const committees = campaignData?.data?.committees || [];

  const filteredCandidates = candidates.filter((candidate: any) =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.office.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getPartyColor = (party: string) => {
    switch (party?.toUpperCase()) {
      case 'REP':
      case 'REPUBLICAN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DEM':
      case 'DEMOCRATIC':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LIB':
      case 'LIBERTARIAN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-amber-600 animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">Loading Campaign Finance Data</h2>
          <p className="text-gray-600">Connecting to Federal Election Commission...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Follow the Money</h1>
              <p className="text-gray-600">Official campaign finance data from the Federal Election Commission</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
              <div className="text-2xl font-bold">{candidates.length}</div>
              <div className="text-green-100">Active Candidates</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
              <div className="text-2xl font-bold">{committees.length}</div>
              <div className="text-blue-100">Committees</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl p-4 text-white">
              <div className="text-2xl font-bold">
                {formatCurrency(candidates.reduce((sum: number, c: any) => sum + (c.totalRaised || 0), 0))}
              </div>
              <div className="text-purple-100">Total Raised</div>
            </div>
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-4 text-white">
              <div className="text-2xl font-bold">Live</div>
              <div className="text-rose-100">FEC Data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Candidates & Committees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by candidate name, office, or committee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Candidates List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Texas Candidates</h2>
              <Badge className="bg-green-100 text-green-800">
                {filteredCandidates.length} found
              </Badge>
            </div>

            <div className="space-y-4">
              {filteredCandidates.map((candidate: any) => (
                <Card 
                  key={candidate.fecId} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-amber-300"
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {candidate.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPartyColor(candidate.party)}>
                            {candidate.party}
                          </Badge>
                          <Badge variant="outline">
                            {candidate.office} {candidate.district ? `District ${candidate.district}` : ''}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="hover:bg-amber-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(candidate.totalRaised || 0)}
                        </div>
                        <div className="text-xs text-gray-500">Total Raised</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(candidate.totalSpent || 0)}
                        </div>
                        <div className="text-xs text-gray-500">Total Spent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(candidate.cashOnHand || 0)}
                        </div>
                        <div className="text-xs text-gray-500">Cash on Hand</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCandidates.length === 0 && searchTerm && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
                  <p className="text-gray-600">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Candidate Details */}
            {selectedCandidate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Candidate Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">{selectedCandidate.name}</h4>
                      <p className="text-sm text-gray-600">
                        {selectedCandidate.office} {selectedCandidate.district ? `District ${selectedCandidate.district}` : ''}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Party</span>
                        <Badge className={getPartyColor(selectedCandidate.party)}>
                          {selectedCandidate.party}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="text-sm font-medium">{selectedCandidate.incumbentChallenger}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">FEC ID</span>
                        <span className="text-sm font-mono">{selectedCandidate.fecId}</span>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      View Full Financial Report
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Committees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Top Committees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {committees.slice(0, 5).map((committee: any) => (
                    <div key={committee.fecId} className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {committee.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {committee.committeeType}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-sm font-semibold">
                          {formatCurrency(committee.totalRaised || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Source */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Official FEC Data</h4>
                    <p className="text-sm text-green-700">
                      All financial data comes directly from the Federal Election Commission's official database.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}