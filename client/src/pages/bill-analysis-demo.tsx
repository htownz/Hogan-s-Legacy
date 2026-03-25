import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, BarChart3, Share2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BillImpactAnalysis {
  overallScore: number;
  economicImpact: {
    score: number;
    description: string;
    affectedSectors: string[];
  };
  socialImpact: {
    score: number;
    description: string;
    affectedGroups: string[];
  };
  environmentalImpact: {
    score: number;
    description: string;
  };
  implementationComplexity: {
    score: number;
    timeline: string;
    challenges: string[];
  };
  stakeholderAnalysis: {
    supporters: string[];
    opponents: string[];
    neutralGroups: string[];
  };
}

interface LegislativeTrends {
  trendScore: number;
  momentum: 'increasing' | 'decreasing' | 'stable';
  relatedBills: Array<{
    title: string;
    status: string;
    similarity: number;
  }>;
  publicSentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  mediaAttention: {
    score: number;
    recentMentions: number;
  };
}

interface BillComplexity {
  complexityScore: number;
  readabilityScore: number;
  legalJargonLevel: number;
  estimatedReadingTime: number;
  simplificationSuggestions: string[];
}

interface SummaryCard {
  shortSummary: string;
  keyPoints: string[];
  citizenAction: string[];
  shareableQuote: string;
  hashtags: string[];
}

export default function BillAnalysisDemo() {
  const [billTitle, setBillTitle] = useState("Texas Property Tax Relief Act");
  const [billText, setBillText] = useState(`AN ACT relating to ad valorem taxation. BE IT ENACTED BY THE LEGISLATURE OF THE STATE OF TEXAS: SECTION 1. This Act may be cited as the Property Tax Relief Act. SECTION 2. The legislature finds that property tax burdens in Texas have grown substantially, creating financial hardship for homeowners, seniors on fixed incomes, and small businesses. SECTION 3. HOMESTEAD EXEMPTION INCREASE. Section 11.13(b), Tax Code, is amended to read as follows: (b) An adult is entitled to exemption from taxation of $50,000 of the appraised value of the adult's residence homestead, increased from the current $25,000 exemption. SECTION 4. SENIOR CITIZEN ADDITIONAL EXEMPTION. A person 65 years of age or older is entitled to an additional exemption from taxation of $20,000 of the appraised value of the person's residence homestead. SECTION 5. SMALL BUSINESS EXEMPTION. A business with gross receipts of less than $500,000 annually is entitled to a 25% reduction in property tax assessment on business property. SECTION 6. EFFECTIVE DATE. This Act takes effect January 1 of the year following the year in which this Act is enacted.`);
  
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState<BillImpactAnalysis | null>(null);
  const [trends, setTrends] = useState<LegislativeTrends | null>(null);
  const [complexity, setComplexity] = useState<BillComplexity | null>(null);
  const [summaryCard, setSummaryCard] = useState<SummaryCard | null>(null);
  const { toast } = useToast();

  const runComprehensiveAnalysis = async () => {
    if (!billTitle.trim() || !billText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both bill title and text",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/advanced-analysis/comprehensive-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billTitle: billTitle.trim(),
          billText: billText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setImpact(data.analysis.impact);
        setTrends(data.analysis.trends);
        setComplexity(data.analysis.complexity);
        setSummaryCard(data.analysis.summaryCard);
        
        toast({
          title: "Analysis Complete!",
          description: "Your bill has been analyzed successfully",
        });
      } else {
        throw new Error('Analysis returned error');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Unable to analyze the bill. Please check your AI service configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'increasing': return "📈";
      case 'decreasing': return "📉";
      default: return "➡️";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Bill Analysis Testing Lab</h1>
        <p className="text-muted-foreground">
          Test your advanced AI analysis capabilities with real Texas legislation
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Legislative Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Bill Title</label>
            <Input
              value={billTitle}
              onChange={(e) => setBillTitle(e.target.value)}
              placeholder="Enter bill title..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Bill Text</label>
            <Textarea
              value={billText}
              onChange={(e) => setBillText(e.target.value)}
              placeholder="Paste the full bill text here..."
              rows={8}
            />
          </div>

          <Button 
            onClick={runComprehensiveAnalysis}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with Claude AI...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Run Comprehensive Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {(impact || trends || complexity || summaryCard) && (
        <Tabs defaultValue="impact" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
            <TabsTrigger value="trends">Legislative Trends</TabsTrigger>
            <TabsTrigger value="complexity">Complexity Score</TabsTrigger>
            <TabsTrigger value="summary">Summary Card</TabsTrigger>
          </TabsList>

          {/* Impact Analysis Tab */}
          <TabsContent value="impact">
            {impact && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Overall Impact Score: {impact.overallScore}/100
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={impact.overallScore} className="mb-4" />
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-blue-600 mb-2">Economic Impact</h4>
                          <div className={`text-2xl font-bold ${getScoreColor(impact.economicImpact.score)}`}>
                            {impact.economicImpact.score}/100
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {impact.economicImpact.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {impact.economicImpact.affectedSectors.map((sector, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {sector}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-green-600 mb-2">Social Impact</h4>
                          <div className={`text-2xl font-bold ${getScoreColor(impact.socialImpact.score)}`}>
                            {impact.socialImpact.score}/100
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {impact.socialImpact.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {impact.socialImpact.affectedGroups.map((group, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-emerald-600 mb-2">Environmental Impact</h4>
                          <div className={`text-2xl font-bold ${getScoreColor(impact.environmentalImpact.score)}`}>
                            {impact.environmentalImpact.score}/100
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {impact.environmentalImpact.description}
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg">
                          <h4 className="font-medium text-purple-600 mb-2">Implementation Complexity</h4>
                          <div className={`text-2xl font-bold ${getScoreColor(impact.implementationComplexity.score)}`}>
                            {impact.implementationComplexity.score}/100
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Timeline: {impact.implementationComplexity.timeline}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {impact.implementationComplexity.challenges.slice(0, 3).map((challenge, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {challenge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-3">Stakeholder Analysis</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-green-600 mb-2">Supporters</h5>
                          <ul className="text-sm space-y-1">
                            {impact.stakeholderAnalysis.supporters.map((supporter, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {supporter}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-red-600 mb-2">Opponents</h5>
                          <ul className="text-sm space-y-1">
                            {impact.stakeholderAnalysis.opponents.map((opponent, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <AlertCircle className="w-3 h-3 text-red-500" />
                                {opponent}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-600 mb-2">Neutral Groups</h5>
                          <ul className="text-sm space-y-1">
                            {impact.stakeholderAnalysis.neutralGroups.map((neutral, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-400 rounded-full" />
                                {neutral}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Legislative Trends Tab */}
          <TabsContent value="trends">
            {trends && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Legislative Trend Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          Trend Score: {trends.trendScore}/100
                          <span className="text-2xl">{getMomentumIcon(trends.momentum)}</span>
                        </h4>
                        <Progress value={trends.trendScore} className="mb-2" />
                        <p className="text-sm text-muted-foreground capitalize">
                          Momentum: {trends.momentum}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-3">Public Sentiment</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Positive</span>
                            <span className="text-sm font-medium text-green-600">
                              {trends.publicSentiment.positive}%
                            </span>
                          </div>
                          <Progress value={trends.publicSentiment.positive} className="h-2" />
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Negative</span>
                            <span className="text-sm font-medium text-red-600">
                              {trends.publicSentiment.negative}%
                            </span>
                          </div>
                          <Progress value={trends.publicSentiment.negative} className="h-2" />
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Neutral</span>
                            <span className="text-sm font-medium text-gray-600">
                              {trends.publicSentiment.neutral}%
                            </span>
                          </div>
                          <Progress value={trends.publicSentiment.neutral} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Media Attention</h4>
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {trends.mediaAttention.score}/100
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trends.mediaAttention.recentMentions} recent mentions
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-3">Related Bills</h4>
                        <div className="space-y-2">
                          {trends.relatedBills.slice(0, 3).map((bill, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                              <div>
                                <p className="text-sm font-medium">{bill.title}</p>
                                <p className="text-xs text-muted-foreground">{bill.status}</p>
                              </div>
                              <Badge variant="outline">
                                {Math.round(bill.similarity * 100)}% similar
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Complexity Tab */}
          <TabsContent value="complexity">
            {complexity && (
              <Card>
                <CardHeader>
                  <CardTitle>Bill Complexity Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Complexity Score</h4>
                        <div className={`text-3xl font-bold ${getScoreColor(complexity.complexityScore)}`}>
                          {complexity.complexityScore}/100
                        </div>
                        <Progress value={complexity.complexityScore} className="mt-2" />
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Readability Score</h4>
                        <div className={`text-3xl font-bold ${getScoreColor(100 - complexity.readabilityScore)}`}>
                          {complexity.readabilityScore}/100
                        </div>
                        <Progress value={complexity.readabilityScore} className="mt-2" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Legal Jargon Level</h4>
                        <div className={`text-3xl font-bold ${getScoreColor(complexity.legalJargonLevel)}`}>
                          {complexity.legalJargonLevel}/100
                        </div>
                        <Progress value={complexity.legalJargonLevel} className="mt-2" />
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Reading Time</h4>
                        <div className="text-3xl font-bold text-blue-600">
                          {complexity.estimatedReadingTime} min
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Estimated for average reader
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-3">Simplification Suggestions</h4>
                    <ul className="space-y-2">
                      {complexity.simplificationSuggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Summary Card Tab */}
          <TabsContent value="summary">
            {summaryCard && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Shareable Summary Card
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 border-2 border-dashed rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{billTitle}</h3>
                        <p className="text-gray-700">{summaryCard.shortSummary}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Key Points:</h4>
                        <ul className="space-y-1">
                          {summaryCard.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-white rounded border-l-4 border-blue-500">
                        <p className="text-lg italic font-medium text-gray-800">
                          "{summaryCard.shareableQuote}"
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {summaryCard.hashtags.map((hashtag, i) => (
                          <Badge key={i} variant="secondary" className="text-blue-600">
                            {hashtag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Citizen Action Items:</h4>
                    <div className="grid gap-2">
                      {summaryCard.citizenAction.map((action, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                          </div>
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}