import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Severity badge component
const SeverityBadge = ({ severity }: { severity: string }) => {
  switch (severity) {
    case "minor":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Minor</Badge>;
    case "moderate":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Moderate</Badge>;
    case "severe":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Severe</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

// Confidence indicator component
const ConfidenceIndicator = ({ confidence }: { confidence: number }) => {
  let color = "bg-red-500";
  if (confidence >= 70) color = "bg-green-500";
  else if (confidence >= 40) color = "bg-yellow-500";

  return (
    <div className="flex items-center gap-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${confidence}%` }}></div>
      </div>
      <span className="text-xs font-medium text-gray-500">{confidence}%</span>
    </div>
  );
};

// Risk level indicator component
const RiskLevelIndicator = ({ risk }: { risk: string }) => {
  switch (risk) {
    case "low":
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle size={18} />
          <span>Low Risk</span>
        </div>
      );
    case "moderate":
      return (
        <div className="flex items-center gap-2 text-orange-500">
          <AlertCircle size={18} />
          <span>Moderate Risk</span>
        </div>
      );
    case "high":
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={18} />
          <span>High Risk</span>
        </div>
      );
    default:
      return <div>Unknown Risk</div>;
  }
};

// Types for point of order finding
interface PointOfOrderFinding {
  title: string;
  description: string;
  rulesCitations?: string[];
  severity: 'minor' | 'moderate' | 'severe';
  confidence: number;
  suggestedFix?: string;
}

// Types for point of order analysis results
interface PointOfOrderAnalysis {
  summary: string;
  findings: PointOfOrderFinding[];
  overallRisk: 'low' | 'moderate' | 'high';
}

interface PointOfOrderAnalysisProps {
  billId: string;
}

export default function PointOfOrderAnalysis({ billId }: PointOfOrderAnalysisProps) {
  const [includeRuleCitations, setIncludeRuleCitations] = useState(true);
  const [depth, setDepth] = useState<'basic' | 'detailed'>('detailed');
  
  const analysisMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/bills/${billId}/point-of-order-analysis`, {
        method: "POST",
        data: {
          includeRuleCitations,
          depth
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${res.status}`);
      }
      
      return res.json() as Promise<PointOfOrderAnalysis>;
    }
  });
  
  const handleAnalyze = () => {
    analysisMutation.mutate();
  };
  
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Point of Order Analysis
        </CardTitle>
        <CardDescription>
          Identify potential procedural issues that could be raised during the legislative process
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!analysisMutation.isPending && !analysisMutation.data && (
          <div className="flex flex-col gap-4 mb-4">
            <p className="text-sm text-gray-600">
              This tool uses AI to analyze the bill for potential procedural violations under Texas legislative rules, constitution, and precedent that could lead to points of order.
            </p>
            
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="rule-citations" 
                  checked={includeRuleCitations}
                  onCheckedChange={setIncludeRuleCitations}
                />
                <Label htmlFor="rule-citations">Include rule citations</Label>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="analysis-depth">Analysis depth</Label>
                <Tabs 
                  defaultValue={depth} 
                  className="w-[200px]"
                  onValueChange={(value) => setDepth(value as 'basic' | 'detailed')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        )}
        
        {analysisMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-gray-500">Analyzing bill for potential points of order...</p>
          </div>
        )}
        
        {analysisMutation.data && (
          <div className="space-y-6">
            <Alert>
              <RiskLevelIndicator risk={analysisMutation.data.overallRisk} />
              <AlertTitle className="mt-2">Analysis Summary</AlertTitle>
              <AlertDescription>{analysisMutation.data.summary}</AlertDescription>
            </Alert>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Potential Issues</h3>
              <div className="space-y-4">
                {analysisMutation.data.findings.map((finding, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-gray-50 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">{finding.title}</CardTitle>
                      <SeverityBadge severity={finding.severity} />
                    </CardHeader>
                    <CardContent className="py-3 px-4 space-y-3">
                      <p className="text-sm">{finding.description}</p>
                      
                      {finding.rulesCitations && finding.rulesCitations.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-1">Rule Citations</h4>
                          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
                            {finding.rulesCitations.map((citation, idx) => (
                              <li key={idx}>{citation}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">Confidence</h4>
                        <ConfidenceIndicator confidence={finding.confidence} />
                      </div>
                      
                      {finding.suggestedFix && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h4 className="text-sm font-medium mb-1">Suggested Fix</h4>
                          <p className="text-sm text-gray-700">{finding.suggestedFix}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {analysisMutation.isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to analyze bill. Please try again or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {!analysisMutation.isPending && !analysisMutation.data && (
          <Button 
            onClick={handleAnalyze}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Analyze for Points of Order
          </Button>
        )}
        
        {analysisMutation.data && (
          <Button 
            variant="outline"
            onClick={() => analysisMutation.reset()}
          >
            Analyze Again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}