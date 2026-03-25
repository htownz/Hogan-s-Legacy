import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Brain, 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Zap,
  Search,
  TrendingUp,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIAnalysisResult {
  complexity: "Low" | "Medium" | "High";
  impactScore: number;
  keyInsights: string[];
  stakeholders: string[];
  publicImpact: string;
  recommendations: string[];
  urgency: "Low" | "Medium" | "High" | "Critical";
  estimatedReadTime: string;
}

interface EnhancedAIProps {
  billId?: string;
  billText?: string;
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void;
}

export default function EnhancedAI({ billId, billText, onAnalysisComplete }: EnhancedAIProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const { toast } = useToast();

  // Enhanced AI Bill Analysis
  const analyzeWithAI = async () => {
    if (!billId && !billText) {
      toast({
        title: "No Content to Analyze",
        description: "Please provide a bill ID or bill text for AI analysis.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/ai/enhanced-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          billId: billId,
          billText: billText,
          analysisType: "comprehensive"
        })
      });

      if (!response.ok) throw new Error("AI analysis failed");
      
      const result = await response.json();
      setAnalysis(result.analysis);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result.analysis);
      }
      
      toast({
        title: "AI Analysis Complete!",
        description: "Your bill has been analyzed with advanced AI insights."
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not complete AI analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI-Powered Q&A
  const askAI = async () => {
    if (!question.trim()) return;
    
    setIsAsking(true);
    const userMessage = question;
    setQuestion("");
    
    // Add user question to chat
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);
    
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: userMessage,
          billId: billId,
          context: analysis ? JSON.stringify(analysis) : undefined
        })
      });

      if (!response.ok) throw new Error("AI chat failed");
      
      const result = await response.json();
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, { role: "assistant", content: result.answer }]);
      
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I couldn't process your question right now. Please try again." 
      }]);
      
      toast({
        title: "AI Question Failed",
        description: "Could not get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAsking(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "High": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "Critical": return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "High": return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case "Medium": return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600" />
            Enhanced AI Analysis
            <Sparkles className="w-5 h-5 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Analyzing with AI...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Start AI Analysis
                </div>
              )}
            </Button>

            {analysis && (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                {/* Analysis Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600">{analysis.impactScore}/10</div>
                    <div className="text-xs text-gray-600">Impact Score</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <Badge className={getComplexityColor(analysis.complexity)}>
                      {analysis.complexity}
                    </Badge>
                    <div className="text-xs text-gray-600 mt-1">Complexity</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="flex justify-center mb-1">
                      {getUrgencyIcon(analysis.urgency)}
                    </div>
                    <div className="text-xs text-gray-600">{analysis.urgency} Urgency</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="text-sm font-semibold text-blue-600">{analysis.estimatedReadTime}</div>
                    <div className="text-xs text-gray-600">Read Time</div>
                  </div>
                </div>

                {/* Key Insights */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.keyInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Public Impact */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Public Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800">{analysis.publicImpact}</p>
                  </CardContent>
                </Card>

                {/* Stakeholders */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Key Stakeholders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.stakeholders.map((stakeholder, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {stakeholder}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-green-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Ask AI About This Bill
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-white rounded-lg border">
                {chatHistory.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Question Input */}
            <div className="space-y-3">
              <Label htmlFor="ai-question">Ask a question about this legislation:</Label>
              <Textarea
                id="ai-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What are the main benefits of this bill? Who would be most affected? What are the potential drawbacks?"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    askAI();
                  }
                }}
              />
              <Button 
                onClick={askAI}
                disabled={isAsking || !question.trim()}
                className="w-full"
              >
                {isAsking ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    AI is thinking...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Ask AI
                  </div>
                )}
              </Button>
            </div>

            {/* Quick Questions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Questions:</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "What's the main purpose?",
                  "Who benefits from this?",
                  "What are the costs?",
                  "When does this take effect?",
                  "How does this impact me?"
                ].map((quickQ, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestion(quickQ)}
                    className="text-xs"
                  >
                    {quickQ}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}