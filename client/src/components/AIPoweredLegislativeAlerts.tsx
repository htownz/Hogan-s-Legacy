import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  X, 
  Brain,
  Zap,
  TrendingUp,
  Target,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  ExternalLink,
  VolumeX,
  Volume2
} from "lucide-react";

interface AIEnhancedAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  urgency: string;
  source: string;
  timestamp: string;
  actionUrl?: string;
  // AI enhancements
  aiEnhanced: boolean;
  impactScore: number;
  personalRelevance: number;
  actionPriority: string;
  smartSummary: string;
  suggestedActions: string[];
  relatedTopics: string[];
}

interface SmartInsights {
  trends: string[];
  hotTopics: string[];
  urgentAreas: string[];
  opportunities: string[];
  recommendations: string[];
}

export default function AIPoweredLegislativeAlerts() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const { toast } = useToast();

  // Fetch AI-enhanced real-time alerts
  const { data: alertData, isLoading: alertsLoading } = useQuery<any>({
    queryKey: ["/api/alerts/real-time-legislative"],
    refetchInterval: 30000,
    retry: false,
  });

  // Fetch advanced AI-powered insights
  const { data: insightsData, isLoading: insightsLoading } = useQuery<any>({
    queryKey: ["/api/alerts/smart-insights"],
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: false,
  });

  // Fetch AI predictive analysis
  const { data: predictionsData } = useQuery<any>({
    queryKey: ["/api/alerts/predictive-analysis"],
    refetchInterval: 600000, // Refresh every 10 minutes
    retry: false,
  });

  // Fetch AI sentiment analysis
  const { data: sentimentData } = useQuery<any>({
    queryKey: ["/api/alerts/sentiment-analysis"],
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: false,
  });

  // Generate personalized alerts
  const personalizedAlertsMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await fetch('/api/alerts/personalized-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      if (!response.ok) throw new Error('Failed to generate personalized alerts');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🎯 Personalized Alerts Generated!",
        description: "AI has created alerts tailored to your interests",
      });
    }
  });

  const alerts: AIEnhancedAlert[] = alertData?.alerts || [];
  const insights: SmartInsights = insightsData?.insights || {
    trends: [], hotTopics: [], urgentAreas: [], opportunities: [], recommendations: []
  };
  const predictions = predictionsData?.predictions || {};
  const sentiment = sentimentData?.sentiment || {};

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));
  const unreadCount = activeAlerts.filter(alert => alert.impactScore >= 7).length;

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50';
    if (score >= 6) return 'text-orange-600 bg-orange-50';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <Zap className="h-4 w-4 text-red-500" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
        >
          <div className="relative">
            <Brain className="h-8 w-8 text-white" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Header */}
      <Card className="mb-2 shadow-xl border-2 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Alerts
              </span>
              <Sparkles className="h-4 w-4 text-yellow-500" />
              {unreadCount > 0 && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">
                  {unreadCount} High Impact
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
                className="text-purple-600"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {alertData?.aiPrioritization && (
            <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
              🧠 AI Priority: {alertData.aiPrioritization}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced AI Intelligence Panel */}
      {showInsights && (
        <Card className="mb-2 shadow-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
                Advanced AI Intelligence
              </span>
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* AI Sentiment Analysis */}
            {sentiment.overallSentiment && (
              <div className="bg-white p-2 rounded border">
                <h4 className="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
                  😊 Legislative Sentiment Analysis
                  <Badge className={`text-xs ${
                    sentiment.overallSentiment === 'positive' ? 'bg-green-500' :
                    sentiment.overallSentiment === 'negative' ? 'bg-red-500' :
                    'bg-yellow-500'
                  } text-white`}>
                    {sentiment.overallSentiment}
                  </Badge>
                </h4>
                <div className="text-xs text-muted-foreground">
                  {sentiment.publicMood} • Engagement: {sentiment.engagementLevel}
                </div>
              </div>
            )}

            {/* AI Predictions */}
            {predictions.predictions && predictions.predictions.length > 0 && (
              <div className="bg-white p-2 rounded border">
                <h4 className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                  🔮 AI Predictions
                  <Badge className="text-xs bg-blue-500 text-white">
                    {predictions.confidence || 'Medium'} Confidence
                  </Badge>
                </h4>
                <div className="text-xs text-muted-foreground">
                  {predictions.predictions[0]}
                </div>
                {predictions.hotCommittees && predictions.hotCommittees.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {predictions.hotCommittees.slice(0, 2).map((committee: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {committee}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Smart Insights */}
            {insights.trends.length > 0 && (
              <div className="bg-white p-2 rounded border">
                <h4 className="text-xs font-semibold text-red-600 mb-1">🔥 Hot Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {insights.hotTopics.slice(0, 3).map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded border">
              <h4 className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
                🎯 AI Strategic Recommendation
                <Sparkles className="h-3 w-3 text-yellow-500" />
              </h4>
              <div className="text-xs text-muted-foreground">
                {insights.recommendations[0] || sentiment.recommendations?.[0] || 'Stay engaged with legislative developments'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Alert Bubbles */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alertsLoading ? (
          <Card className="shadow-xl">
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 text-purple-400 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-gray-500">AI analyzing legislative activity...</p>
            </CardContent>
          </Card>
        ) : activeAlerts.length === 0 ? (
          <Card className="shadow-xl">
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No high-priority alerts</p>
              <p className="text-xs text-gray-400">AI monitoring Texas Legislature...</p>
            </CardContent>
          </Card>
        ) : (
          activeAlerts.slice(0, 4).map((alert) => (
            <Card
              key={alert.id}
              className={`shadow-xl border-l-4 transition-all duration-300 hover:shadow-2xl ${
                alert.impactScore >= 8 ? 'border-l-red-500 bg-red-50' :
                alert.impactScore >= 6 ? 'border-l-orange-500 bg-orange-50' :
                alert.impactScore >= 4 ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-blue-500 bg-blue-50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(alert.actionPriority)}
                    <Badge className={`text-xs ${getImpactColor(alert.impactScore)}`}>
                      Impact: {alert.impactScore}/10
                    </Badge>
                    {alert.aiEnhanced && (
                      <Sparkles className="h-3 w-3 text-purple-500" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                  {alert.title}
                </h4>
                
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {alert.smartSummary || alert.message}
                </p>

                {alert.suggestedActions.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-purple-600 mb-1">
                      🎯 AI Suggests:
                    </h5>
                    <div className="space-y-1">
                      {alert.suggestedActions.slice(0, 2).map((action, i) => (
                        <div key={i} className="text-xs text-gray-600 flex items-center gap-1">
                          <ArrowRight className="h-3 w-3 text-purple-500" />
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Relevance: {alert.personalRelevance}/10</span>
                  </div>
                  
                  {alert.actionUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200"
                      onClick={() => window.location.href = alert.actionUrl!}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Act
                    </Button>
                  )}
                </div>

                {alert.relatedTopics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {alert.relatedTopics.slice(0, 3).map((topic, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400">
                  Source: {alert.source}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* AI Actions Footer */}
      <Card className="mt-2 shadow-xl border-2 border-purple-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => personalizedAlertsMutation.mutate({
                interests: ['Education', 'Healthcare'],
                location: 'Texas'
              })}
              disabled={personalizedAlertsMutation.isPending}
              className="text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700"
            >
              {personalizedAlertsMutation.isPending ? (
                <Brain className="h-3 w-3 mr-1 animate-pulse" />
              ) : (
                <Target className="h-3 w-3 mr-1" />
              )}
              Personalize
            </Button>

            <div className="text-xs text-gray-500">
              AI Enhanced • {activeAlerts.length} alerts
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}