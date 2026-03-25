import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  FileText, 
  Users, 
  DollarSign,
  Quote,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Target,
  Network,
  Scale
} from "lucide-react";

export default function ComprehensiveAnalysisDashboard() {
  const [searchType, setSearchType] = useState<'bill' | 'legislator'>('bill');
  const [searchId, setSearchId] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  // Get analysis summary
  const { data: analysisSummary } = useQuery<any>({
    queryKey: ["/api/analysis/summary"],
  });

  // Search for analysis
  const { data: searchResults, isLoading: isSearching } = useQuery<any>({
    queryKey: ["/api/analysis", searchType, searchId],
    enabled: !!searchId,
  });

  const handleSearch = () => {
    if (searchId.trim()) {
      setSelectedAnalysis(searchResults);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Comprehensive Data Analysis & Citation Engine
          </h1>
          <p className="text-lg text-gray-600">
            Analyze and cite every piece of authentic Texas legislative data - bill language, amendments, campaign donations, and complete source citations
          </p>
        </div>

        {/* Analysis Capabilities Overview */}
        {analysisSummary && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysisSummary.data.availableData.bills.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Texas Bills</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {analysisSummary.data.availableData.legislators.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Legislators</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {analysisSummary.data.availableData.campaignDonations.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Campaign Donations</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {analysisSummary.data.dataSources.length}
                    </p>
                    <p className="text-sm text-gray-600">Data Sources</p>
                  </div>
                  <Quote className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Analyze Legislative Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search ID
                </label>
                <Input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder={searchType === 'bill' ? 'Enter Bill ID (e.g., HB1234)' : 'Enter Legislator ID (e.g., 123)'}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Type
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={searchType === 'bill' ? 'default' : 'outline'}
                    onClick={() => setSearchType('bill')}
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Bill
                  </Button>
                  <Button
                    variant={searchType === 'legislator' ? 'default' : 'outline'}
                    onClick={() => setSearchType('legislator')}
                    size="sm"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Legislator
                  </Button>
                </div>
              </div>
              <Button onClick={handleSearch} disabled={!searchId.trim() || isSearching}>
                {isSearching ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {selectedAnalysis && (
          <div className="space-y-6">
            {searchType === 'bill' ? (
              <BillAnalysisResults analysis={selectedAnalysis} />
            ) : (
              <LegislatorAnalysisResults analysis={selectedAnalysis} />
            )}
          </div>
        )}

        {/* Data Sources & Citation Standards */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Data Sources & Citation Standards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Primary Data Sources</h4>
                <div className="space-y-2">
                  {analysisSummary?.data.dataSources.map((source: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{source}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Analysis Capabilities</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Bill Language Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Amendment Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Campaign Finance Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Voting Pattern Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Complete Citation Generation</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BillAnalysisResults({ analysis }: { analysis: any }) {
  if (!analysis?.data) return null;

  const { languageAnalysis, amendments, campaignConnections, citations } = analysis.data;

  return (
    <Tabs defaultValue="language" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="language">Language Analysis</TabsTrigger>
        <TabsTrigger value="amendments">Amendments</TabsTrigger>
        <TabsTrigger value="campaign">Campaign Connections</TabsTrigger>
        <TabsTrigger value="citations">Citations</TabsTrigger>
      </TabsList>

      <TabsContent value="language">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Bill Language Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Complexity Assessment</h4>
                <Badge variant={
                  languageAnalysis.complexity === 'High' ? 'destructive' :
                  languageAnalysis.complexity === 'Medium' ? 'default' : 'secondary'
                }>
                  {languageAnalysis.complexity} Complexity
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Fiscal Impact</h4>
                <p className="text-sm text-gray-600">{languageAnalysis.fiscalImpact}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Key Provisions</h4>
              <div className="space-y-2">
                {languageAnalysis.keyProvisions.map((provision: string, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{provision}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Legal Terms</h4>
                <div className="flex flex-wrap gap-2">
                  {languageAnalysis.legalTerms.map((term: string, index: number) => (
                    <Badge key={index} variant="outline">{term}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Affected Stakeholders</h4>
                <div className="flex flex-wrap gap-2">
                  {languageAnalysis.stakeholders.map((stakeholder: string, index: number) => (
                    <Badge key={index} variant="secondary">{stakeholder}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="amendments">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Amendment Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {amendments.length > 0 ? (
              <div className="space-y-4">
                {amendments.map((amendment: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">Amendment {amendment.id}</h4>
                      <Badge variant="outline">{amendment.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Author: {amendment.author}</p>
                    <p className="text-sm mb-2">{amendment.impact}</p>
                    <div className="text-xs text-gray-500">
                      Proposed: {new Date(amendment.dateProposed).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No amendments tracked for this bill</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="campaign">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Campaign Finance Connections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaignConnections.sponsorDonations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Sponsor Campaign Finance</h4>
                <div className="space-y-3">
                  {campaignConnections.sponsorDonations.map((sponsor: any, index: number) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{sponsor.legislator}</span>
                        <span className="text-green-700 font-bold">
                          ${sponsor.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-green-800">
                        Top donors: {sponsor.topDonors.slice(0, 3).map((d: any) => d.contributor_name).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaignConnections.industryConnections.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Industry Connections</h4>
                <div className="flex flex-wrap gap-2">
                  {campaignConnections.industryConnections.map((industry: string, index: number) => (
                    <Badge key={index} variant="default">{industry}</Badge>
                  ))}
                </div>
              </div>
            )}

            {campaignConnections.potentialConflicts.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Potential Conflicts of Interest
                </h4>
                <div className="space-y-2">
                  {campaignConnections.potentialConflicts.map((conflict: string, index: number) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800">{conflict}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="citations">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="w-5 h-5" />
              Complete Citations & Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {citations.map((citation: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{citation.source}</h4>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={citation.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Accessed: {new Date(citation.dateAccessed).toLocaleDateString()}
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-1">Relevant Sections:</p>
                    <div className="flex flex-wrap gap-2">
                      {citation.relevantSections.map((section: string, sIndex: number) => (
                        <Badge key={sIndex} variant="outline">{section}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function LegislatorAnalysisResults({ analysis }: { analysis: any }) {
  if (!analysis?.data) return null;

  const { votingPatterns, campaignFinance, billSponsorship, citations } = analysis.data;

  return (
    <Tabs defaultValue="voting" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="voting">Voting Patterns</TabsTrigger>
        <TabsTrigger value="finance">Campaign Finance</TabsTrigger>
        <TabsTrigger value="sponsorship">Bill Sponsorship</TabsTrigger>
        <TabsTrigger value="citations">Citations</TabsTrigger>
      </TabsList>

      <TabsContent value="voting">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Voting Pattern Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {votingPatterns.partyAlignment}%
                </div>
                <div className="text-sm text-blue-700">Party Alignment</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {votingPatterns.independentVotes}
                </div>
                <div className="text-sm text-purple-700">Independent Votes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {votingPatterns.keyIssues.length}
                </div>
                <div className="text-sm text-green-700">Key Issues</div>
              </div>
            </div>
            
            {votingPatterns.keyIssues.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Issue Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {votingPatterns.keyIssues.map((issue: string, index: number) => (
                    <Badge key={index} variant="default">{issue}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="finance">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Campaign Finance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${campaignFinance.totalRaised.toLocaleString()}
              </div>
              <div className="text-sm text-green-700">Total Campaign Funds Raised</div>
            </div>

            {campaignFinance.topDonors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Top Campaign Contributors</h4>
                <div className="space-y-2">
                  {campaignFinance.topDonors.slice(0, 10).map((donor: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{donor.name}</span>
                      <span className="font-medium">${donor.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaignFinance.industryBreakdown.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Industry Contribution Breakdown</h4>
                <div className="space-y-2">
                  {campaignFinance.industryBreakdown.map((industry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">{industry.industry}</span>
                      <span className="font-medium">${industry.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sponsorship">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Bill Sponsorship Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {billSponsorship.totalBills}
                </div>
                <div className="text-sm text-blue-700">Bills Sponsored</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {billSponsorship.passageRate}%
                </div>
                <div className="text-sm text-green-700">Passage Rate</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {billSponsorship.bipartisanEfforts}
                </div>
                <div className="text-sm text-purple-700">Bipartisan Bills</div>
              </div>
            </div>

            {billSponsorship.keyTopics.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Primary Legislative Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {billSponsorship.keyTopics.map((topic: string, index: number) => (
                    <Badge key={index} variant="default">{topic}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="citations">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="w-5 h-5" />
              Complete Citations & Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {citations.map((citation: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{citation.source}</h4>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={citation.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Accessed: {new Date(citation.dateAccessed).toLocaleDateString()}
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-1">Data Points:</p>
                    <div className="flex flex-wrap gap-2">
                      {citation.dataPoints.map((point: string, pIndex: number) => (
                        <Badge key={pIndex} variant="outline">{point}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}