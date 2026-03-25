import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, User, Building, DollarSign, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScoutBotResult {
  summary: string;
  keyFindings: string[];
  entities: string[];
  sources: string[];
  confidence: number;
}

interface InvestigationRequest {
  topic: string;
  scope: 'local' | 'state' | 'federal';
  focus: 'policy' | 'financial' | 'political' | 'ethics';
}

export default function ScoutBotDemo() {
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [investigationResult, setInvestigationResult] = useState<ScoutBotResult | null>(null);
  const [entityResult, setEntityResult] = useState<ScoutBotResult | null>(null);
  const [investigationForm, setInvestigationForm] = useState<InvestigationRequest>({
    topic: '',
    scope: 'state',
    focus: 'ethics'
  });
  const [entityName, setEntityName] = useState('');
  const { toast } = useToast();

  const handleInvestigation = async () => {
    if (!investigationForm.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic to investigate",
        variant: "destructive",
      });
      return;
    }

    setIsInvestigating(true);
    setInvestigationResult(null);

    try {
      const response = await fetch('/api/scout-bot/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(investigationForm),
      });

      const data = await response.json();

      if (data.success) {
        setInvestigationResult(data.data);
        toast({
          title: "Investigation Complete",
          description: "Successfully analyzed the topic",
        });
      } else {
        throw new Error(data.error || 'Investigation failed');
      }
    } catch (error) {
      toast({
        title: "Investigation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleEntityAnalysis = async () => {
    if (!entityName.trim()) {
      toast({
        title: "Entity Name Required",
        description: "Please enter a name to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setEntityResult(null);

    try {
      const response = await fetch('/api/scout-bot/analyze-entity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entityName }),
      });

      const data = await response.json();

      if (data.success) {
        setEntityResult(data.data);
        toast({
          title: "Analysis Complete",
          description: "Successfully analyzed the entity",
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "text-green-600";
    if (confidence >= 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.7) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (confidence >= 0.4) return <Clock className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Search className="w-10 h-10 text-blue-600" />
            Scout Bot Investigative Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Uncover transparency issues, research political connections, and analyze entities in Texas politics with AI-powered investigations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Topic Investigation */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Topic Investigation
              </CardTitle>
              <CardDescription>
                Research any topic in Texas politics with AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Investigation Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., Campaign finance in the Texas House, Lobbying influence on energy bills..."
                  value={investigationForm.topic}
                  onChange={(e) => setInvestigationForm(prev => ({ ...prev, topic: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investigation Scope</Label>
                  <Select
                    value={investigationForm.scope}
                    onValueChange={(value: 'local' | 'state' | 'federal') => 
                      setInvestigationForm(prev => ({ ...prev, scope: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="federal">Federal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Focus Area</Label>
                  <Select
                    value={investigationForm.focus}
                    onValueChange={(value: 'policy' | 'financial' | 'political' | 'ethics') => 
                      setInvestigationForm(prev => ({ ...prev, focus: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="political">Political</SelectItem>
                      <SelectItem value="ethics">Ethics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleInvestigation} 
                disabled={isInvestigating}
                className="w-full"
              >
                {isInvestigating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Investigating...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Start Investigation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Entity Analysis */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Entity Analysis
              </CardTitle>
              <CardDescription>
                Analyze legislators, lobbyists, organizations, and political figures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entityName">Entity Name</Label>
                <Input
                  id="entityName"
                  placeholder="e.g., Greg Abbott, Texas Oil & Gas Association, Dan Patrick..."
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Analysis includes:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Role and political position</li>
                  <li>• Financial connections and campaign finance</li>
                  <li>• Ethics records and transparency</li>
                  <li>• Influence networks and relationships</li>
                </ul>
              </div>

              <Button 
                onClick={handleEntityAnalysis} 
                disabled={isAnalyzing}
                className="w-full"
                variant="outline"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Analyze Entity
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Investigation Results */}
        {investigationResult && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Investigation Results
                </span>
                <div className="flex items-center gap-2">
                  {getConfidenceIcon(investigationResult.confidence)}
                  <span className={`text-sm font-medium ${getConfidenceColor(investigationResult.confidence)}`}>
                    {Math.round(investigationResult.confidence * 100)}% Confidence
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700 leading-relaxed">{investigationResult.summary}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Key Findings</h3>
                <div className="space-y-2">
                  {investigationResult.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Related Entities</h3>
                  <div className="flex flex-wrap gap-2">
                    {investigationResult.entities.map((entity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Sources</h3>
                  <div className="space-y-1">
                    {investigationResult.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entity Analysis Results */}
        {entityResult && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Entity Analysis Results
                </span>
                <div className="flex items-center gap-2">
                  {getConfidenceIcon(entityResult.confidence)}
                  <span className={`text-sm font-medium ${getConfidenceColor(entityResult.confidence)}`}>
                    {Math.round(entityResult.confidence * 100)}% Confidence
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Analysis Summary</h3>
                <p className="text-gray-700 leading-relaxed">{entityResult.summary}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Key Findings</h3>
                <div className="space-y-2">
                  {entityResult.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Connected Entities</h3>
                  <div className="flex flex-wrap gap-2">
                    {entityResult.entities.map((entity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Data Sources</h3>
                  <div className="space-y-1">
                    {entityResult.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}