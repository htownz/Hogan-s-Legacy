import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EnhancedAI from "@/components/EnhancedAI";
import { 
  Brain, 
  Sparkles, 
  Zap,
  MessageSquare,
  TrendingUp,
  Target,
  Users,
  Search
} from "lucide-react";

export default function EnhancedAIDemo() {
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // Fetch authentic Texas bills for AI demonstration
  const { data: billsData, isLoading } = useQuery<any>({
    queryKey: ["/api/bills"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const bills = billsData?.results || [];
  const featuredBills = bills.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Enhanced AI Analysis
            </h1>
            <Sparkles className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience advanced AI capabilities that analyze your authentic Texas legislative data with 
            deep insights, conversational chat, and predictive intelligence.
          </p>
        </div>

        {/* AI Capabilities Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Deep Analysis</h3>
            <p className="text-sm text-gray-600">Comprehensive AI insights on bill complexity, impact, and stakeholders</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">AI Chat</h3>
            <p className="text-sm text-gray-600">Ask questions about any bill and get intelligent, contextual responses</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Impact Prediction</h3>
            <p className="text-sm text-gray-600">Predict short and long-term effects of legislation on Texas communities</p>
          </Card>

          <Card className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <Target className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Smart Recommendations</h3>
            <p className="text-sm text-gray-600">Actionable civic engagement recommendations based on bill analysis</p>
          </Card>
        </div>

        {/* Interactive Demo Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Try Enhanced AI Analysis</h2>
            <p className="text-gray-600">Select any authentic Texas bill below to experience advanced AI insights</p>
          </div>

          {/* Bill Selection Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-8 bg-gray-200 rounded w-32 mt-4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBills.map((bill: any, index: number) => (
                <Card 
                  key={bill.id} 
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                    selectedBill?.id === bill.id 
                      ? 'border-purple-400 bg-purple-50' 
                      : 'hover:border-purple-300'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedBill(bill)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {bill.title || 'Texas Legislative Bill'}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {bill.chamber || 'Legislature'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {bill.status || 'Active'}
                          </Badge>
                        </div>
                      </div>
                      {selectedBill?.id === bill.id && (
                        <Zap className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {bill.description || 'Important Texas legislation that could impact residents statewide.'}
                    </p>
                    
                    {/* AI Analysis Preview */}
                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600">
                          <Brain className="w-3 h-3" />
                          <span className="text-xs font-semibold">AI Ready</span>
                        </div>
                        <div className="text-xs text-gray-600">Analysis</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <MessageSquare className="w-3 h-3" />
                          <span className="text-xs font-semibold">Chat</span>
                        </div>
                        <div className="text-xs text-gray-600">Q&A</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Target className="w-3 h-3" />
                          <span className="text-xs font-semibold">Predict</span>
                        </div>
                        <div className="text-xs text-gray-600">Impact</div>
                      </div>
                    </div>

                    <Button 
                      variant={selectedBill?.id === bill.id ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBill(bill);
                      }}
                    >
                      {selectedBill?.id === bill.id ? (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Selected for AI Analysis
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          Select for AI Analysis
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Enhanced AI Component */}
          {selectedBill && (
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-600" />
                    AI Analysis: {selectedBill.title}
                    <Badge className="bg-purple-100 text-purple-800">
                      Authentic Texas Data
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedAI 
                    billId={selectedBill.id}
                    onAnalysisComplete={(analysis) => {
                      console.log('Analysis completed:', analysis);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Features Showcase */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  Advanced AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Comprehensive Analysis</h4>
                      <p className="text-sm text-gray-600">Deep analysis of bill complexity, impact scores, stakeholder identification, and urgency assessment</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Conversational AI</h4>
                      <p className="text-sm text-gray-600">Ask any question about the legislation and get intelligent, contextual responses</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Predictive Insights</h4>
                      <p className="text-sm text-gray-600">Forecast potential impacts and outcomes based on authentic legislative data</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <Users className="w-6 h-6 text-green-600" />
                  Authentic Data Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold text-xs">{bills.length}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Texas Bills Database</h4>
                      <p className="text-sm text-gray-600">Every analysis uses authentic legislative data from official Texas sources</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Real-Time Context</h4>
                      <p className="text-sm text-gray-600">AI understands current bill status, chamber location, and legislative timeline</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Civic Action Guidance</h4>
                      <p className="text-sm text-gray-600">Actionable recommendations for citizen engagement based on bill analysis</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Card className="inline-block p-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <h3 className="text-2xl font-bold mb-4">Experience Next-Generation Civic AI</h3>
              <p className="mb-6 opacity-90">Transform how you understand and engage with Texas legislation through advanced AI analysis.</p>
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Try AI Analysis Above
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}