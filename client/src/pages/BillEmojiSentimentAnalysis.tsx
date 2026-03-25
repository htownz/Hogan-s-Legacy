import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Heart, 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  Target,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Zap
} from "lucide-react";

interface EmojiSentiment {
  overall: string;
  impact: string;
  complexity: string;
  urgency: string;
  publicSentiment: string;
  economicImpact: string;
  socialImpact: string;
  environmentalImpact: string;
}

interface BillAnalysis {
  id: string;
  title: string;
  description: string;
  sentiment: EmojiSentiment;
  scores: {
    positivity: number;
    negativity: number;
    neutrality: number;
    complexity: number;
    urgency: number;
    impact: number;
  };
  keywords: string[];
  emotionalTone: string[];
  recommendedAction: string;
  citizenImpact: string;
}

export default function BillEmojiSentimentAnalysis() {
  const [selectedBillId, setSelectedBillId] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch available bills for analysis
  const { data: bills, isLoading: billsLoading } = useQuery<any>({
    queryKey: ["/api/bills", { limit: 50 }],
  });

  // Fetch emoji sentiment analysis for selected bill
  const { data: analysis, isLoading: analysisLoading, refetch } = useQuery<any>({
    queryKey: ["/api/emoji-sentiment-analysis", selectedBillId],
    enabled: !!selectedBillId,
  });

  // Analyze custom text
  const [customAnalysis, setCustomAnalysis] = useState<BillAnalysis | null>(null);
  const [analyzingCustom, setAnalyzingCustom] = useState(false);

  const analyzeCustomText = async () => {
    if (!customText.trim()) return;

    setAnalyzingCustom(true);
    try {
      const response = await fetch("/api/emoji-sentiment-analysis/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: customText }),
      });
      const result = await response.json();
      setCustomAnalysis(result);
    } catch (error) {
      console.error("Failed to analyze custom text:", error);
    } finally {
      setAnalyzingCustom(false);
    }
  };

  const filteredBills = bills?.bills?.filter((bill: any) =>
    bill.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getEmojiMeaning = (emoji: string) => {
    const meanings: Record<string, string> = {
      "😊": "Positive impact",
      "😟": "Concerning aspects",
      "😐": "Neutral stance",
      "🚀": "High impact potential",
      "🐌": "Low impact expected",
      "🧠": "Complex legislation",
      "✅": "Simple and clear",
      "🚨": "Urgent action needed",
      "⏰": "Time-sensitive",
      "📅": "Standard timeline",
      "💰": "Economic benefits",
      "💸": "Economic costs",
      "👥": "Social benefits",
      "⚠️": "Social concerns",
      "🌱": "Environmental benefits",
      "🏭": "Environmental concerns",
      "❤️": "Highly favorable",
      "💔": "Highly unfavorable",
      "🤝": "Bipartisan support",
      "⚡": "Controversial",
    };
    return meanings[emoji] || "Impact indicator";
  };

  const renderSentimentCard = (analysis: BillAnalysis) => (
    <div className="space-y-6">
      {/* Overall Sentiment Dashboard */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Emoji Sentiment Analysis
          </CardTitle>
          <CardDescription>
            Visual representation of bill sentiment and impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">{analysis.sentiment.overall}</div>
              <div className="text-sm font-medium">Overall</div>
              <div className="text-xs text-muted-foreground">
                {getEmojiMeaning(analysis.sentiment.overall)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">{analysis.sentiment.impact}</div>
              <div className="text-sm font-medium">Impact</div>
              <div className="text-xs text-muted-foreground">
                {getEmojiMeaning(analysis.sentiment.impact)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">{analysis.sentiment.complexity}</div>
              <div className="text-sm font-medium">Complexity</div>
              <div className="text-xs text-muted-foreground">
                {getEmojiMeaning(analysis.sentiment.complexity)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">{analysis.sentiment.urgency}</div>
              <div className="text-sm font-medium">Urgency</div>
              <div className="text-xs text-muted-foreground">
                {getEmojiMeaning(analysis.sentiment.urgency)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Impact Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">{analysis.sentiment.economicImpact}</div>
              <div className="text-sm font-medium">Economic</div>
              <div className="text-xs text-muted-foreground">
                {getEmojiMeaning(analysis.sentiment.economicImpact)}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">{analysis.sentiment.socialImpact}</div>
              <div className="text-sm font-medium">Social</div>
              <div className="text-xs text-muted-foreground">
                {getEmojiMeaning(analysis.sentiment.socialImpact)}
              </div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-3xl mb-2">{analysis.sentiment.environmentalImpact}</div>
              <div className="text-sm font-medium">Environmental</div>
              <div className="text-xs text-muted-foreground">
                {getEmojiMeaning(analysis.sentiment.environmentalImpact)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Sentiment Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                Positivity
              </span>
              <span className="text-sm text-muted-foreground">
                {analysis.scores.positivity}%
              </span>
            </div>
            <Progress value={analysis.scores.positivity} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-600" />
                Negativity
              </span>
              <span className="text-sm text-muted-foreground">
                {analysis.scores.negativity}%
              </span>
            </div>
            <Progress value={analysis.scores.negativity} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600" />
                Complexity
              </span>
              <span className="text-sm text-muted-foreground">
                {analysis.scores.complexity}%
              </span>
            </div>
            <Progress value={analysis.scores.complexity} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                Impact Potential
              </span>
              <span className="text-sm text-muted-foreground">
                {analysis.scores.impact}%
              </span>
            </div>
            <Progress value={analysis.scores.impact} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Keywords and Emotional Tone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords?.map((keyword: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emotional Tone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.emotionalTone?.map((tone: string, index: number) => (
                <Badge key={index} variant="outline">
                  {tone}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-amber-600" />
            Citizen Impact & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">How This Affects You:</h4>
            <p className="text-sm text-muted-foreground">
              {analysis.citizenImpact}
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Recommended Action:</h4>
            <p className="text-sm text-muted-foreground">
              {analysis.recommendedAction}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            📊 Emoji-Based Sentiment Analysis
          </h1>
          <p className="text-lg text-muted-foreground">
            Understanding bills through visual emoji sentiment indicators and emotional analysis
          </p>
        </div>

        <Tabs defaultValue="bills" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bills">Analyze Bills</TabsTrigger>
            <TabsTrigger value="custom">Custom Text Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="bills" className="space-y-6">
            {/* Bill Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Select a Bill for Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {billsLoading ? (
                      <div className="text-center py-4">Loading bills...</div>
                    ) : (
                      filteredBills.map((bill: any) => (
                        <Card
                          key={bill.id}
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedBillId === bill.id ? "bg-blue-50 border-blue-200" : ""
                          }`}
                          onClick={() => setSelectedBillId(bill.id)}
                        >
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">{bill.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {bill.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{bill.chamber}</Badge>
                              <Badge variant="secondary">{bill.status}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {selectedBillId && (
              <div>
                {analysisLoading ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p>Analyzing bill sentiment...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : analysis ? (
                  renderSentimentCard(analysis)
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-muted-foreground">
                        No analysis available for this bill
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Analyze Custom Text
                </CardTitle>
                <CardDescription>
                  Paste any legislative text to get emoji-based sentiment analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste legislative text here for analysis..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={6}
                />
                <Button 
                  onClick={analyzeCustomText}
                  disabled={!customText.trim() || analyzingCustom}
                  className="w-full"
                >
                  {analyzingCustom ? "Analyzing..." : "Analyze Text"}
                </Button>
              </CardContent>
            </Card>

            {customAnalysis && renderSentimentCard(customAnalysis)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}