// @ts-nocheck
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Target, 
  Users, 
  MapPin, 
  Lightbulb, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Mail,
  Phone,
  Calendar,
  Star
} from 'lucide-react';

interface LegislatorAnalysis {
  legislator: {
    name: string;
    party: string;
    chamber: string;
    district: string;
    email: string;
  };
  analysis: {
    outreachApproach: string;
    messagingStrategy: any;
    contactStrategy: any;
    likelihood: number;
    keyPoints: string[];
  };
}

interface BillTargeting {
  billsFound: number;
  targetingStrategy: any;
  relevantBills: any[];
}

interface DistrictAnalysis {
  district: string;
  impactAnalysis: any;
  legislators: any[];
}

interface AdvocacyStrategy {
  strategy: any;
  yourLegislators: any[];
}

export default function EnhancedScoutBot() {
  const [activeTab, setActiveTab] = useState<'legislator' | 'bills' | 'district' | 'strategy'>('legislator');
  const [legislatorName, setLegislatorName] = useState('');
  const [targetIssue, setTargetIssue] = useState('');
  const [billKeywords, setBillKeywords] = useState('');
  const [advocacyPosition, setAdvocacyPosition] = useState('');
  const [district, setDistrict] = useState('');
  const [chamber, setChamber] = useState('');
  const [issueArea, setIssueArea] = useState('');
  const [userDistrict, setUserDistrict] = useState('');
  const [advocacyGoal, setAdvocacyGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');

  // Enhanced Scout Bot mutations
  const legislatorAnalysis = useMutation({
    mutationFn: async (data: { legislatorName: string; targetIssue: string; constituencyFocus?: string }) => {
      const response = await fetch('/api/scout-bot/analyze-legislator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    }
  });

  const billTargeting = useMutation({
    mutationFn: async (data: { billKeywords: string; advocacyPosition: string; urgencyLevel: string }) => {
      const response = await fetch('/api/scout-bot/target-bill-sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Targeting failed');
      return response.json();
    }
  });

  const districtAnalysis = useMutation({
    mutationFn: async (data: { district: string; chamber: string; issueArea: string }) => {
      const response = await fetch('/api/scout-bot/district-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('District analysis failed');
      return response.json();
    }
  });

  const strategyGeneration = useMutation({
    mutationFn: async (data: { userDistrict: string; issueArea: string; advocacyGoal: string; experienceLevel: string }) => {
      const response = await fetch('/api/scout-bot/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Strategy generation failed');
      return response.json();
    }
  });

  const handleLegislatorAnalysis = () => {
    if (!legislatorName || !targetIssue) return;
    legislatorAnalysis.mutate({ legislatorName, targetIssue });
  };

  const handleBillTargeting = () => {
    if (!billKeywords || !advocacyPosition) return;
    billTargeting.mutate({ 
      billKeywords, 
      advocacyPosition, 
      urgencyLevel: 'standard' 
    });
  };

  const handleDistrictAnalysis = () => {
    if (!district || !chamber || !issueArea) return;
    districtAnalysis.mutate({ district, chamber, issueArea });
  };

  const handleStrategyGeneration = () => {
    if (!userDistrict || !issueArea || !advocacyGoal) return;
    strategyGeneration.mutate({ 
      userDistrict, 
      issueArea, 
      advocacyGoal, 
      experienceLevel 
    });
  };

  const TabButton = ({ 
    id, 
    icon: Icon, 
    label, 
    description 
  }: { 
    id: 'legislator' | 'bills' | 'district' | 'strategy';
    icon: any;
    label: string;
    description: string;
  }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        activeTab === id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => setActiveTab(id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Icon className={`h-6 w-6 ${activeTab === id ? 'text-blue-600' : 'text-gray-600'}`} />
          <div>
            <h3 className="font-semibold">{label}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <Bot className="h-8 w-8 text-blue-600" />
          <span>Enhanced Scout Bot Intelligence</span>
        </h1>
        <p className="text-muted-foreground">
          Powered by authentic Texas legislator data for targeted civic engagement
        </p>
        <Badge variant="outline" className="bg-green-50">
          Using Real OpenStates & LegiScan Data
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TabButton
          id="legislator"
          icon={Users}
          label="Legislator Analysis"
          description="Analyze specific legislators for targeted outreach"
        />
        <TabButton
          id="bills"
          icon={Target}
          label="Bill Targeting"
          description="Target bills and their sponsors strategically"
        />
        <TabButton
          id="district"
          icon={MapPin}
          label="District Impact"
          description="Analyze district-level political dynamics"
        />
        <TabButton
          id="strategy"
          icon={Lightbulb}
          label="Advocacy Strategy"
          description="Generate personalized advocacy plans"
        />
      </div>

      {/* Legislator Analysis Tab */}
      {activeTab === 'legislator' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Legislator Intelligence Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legislator-name">Legislator Name</Label>
                <Input
                  id="legislator-name"
                  value={legislatorName}
                  onChange={(e) => setLegislatorName(e.target.value)}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div>
                <Label htmlFor="target-issue">Target Issue</Label>
                <Input
                  id="target-issue"
                  value={targetIssue}
                  onChange={(e) => setTargetIssue(e.target.value)}
                  placeholder="e.g., education funding"
                />
              </div>
            </div>
            <Button 
              onClick={handleLegislatorAnalysis} 
              disabled={legislatorAnalysis.isPending}
              className="w-full"
            >
              {legislatorAnalysis.isPending ? 'Analyzing...' : 'Analyze Legislator'}
            </Button>

            {legislatorAnalysis.data && (
              <div className="mt-6 space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Analysis complete using authentic Texas legislator data!
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Legislator Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Name:</span>
                          <span>{legislatorAnalysis.data.legislator.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Party:</span>
                          <Badge variant={legislatorAnalysis.data.legislator.party === 'Republican' ? 'destructive' : 'default'}>
                            {legislatorAnalysis.data.legislator.party}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Chamber:</span>
                          <span>{legislatorAnalysis.data.legislator.chamber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">District:</span>
                          <span>{legislatorAnalysis.data.legislator.district}</span>
                        </div>
                        {legislatorAnalysis.data.legislator.email && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Email:</span>
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">{legislatorAnalysis.data.legislator.email}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Success Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Success Likelihood:</span>
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{legislatorAnalysis.data.analysis.likelihood}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Contact Strategy:</span>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="h-3 w-3" />
                              <span>{legislatorAnalysis.data.analysis.contactStrategy.primaryContact}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{legislatorAnalysis.data.analysis.contactStrategy.timing}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Outreach Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Recommended Approach:</h4>
                        <p className="text-sm text-muted-foreground">
                          {legislatorAnalysis.data.analysis.outreachApproach}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Key Talking Points:</h4>
                        <ul className="space-y-1">
                          {legislatorAnalysis.data.analysis.keyPoints.map((point: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <span className="text-blue-600">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bill Targeting Tab */}
      {activeTab === 'bills' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Bill Targeting Intelligence</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bill-keywords">Bill Keywords</Label>
                <Input
                  id="bill-keywords"
                  value={billKeywords}
                  onChange={(e) => setBillKeywords(e.target.value)}
                  placeholder="e.g., education, healthcare, tax"
                />
              </div>
              <div>
                <Label htmlFor="advocacy-position">Advocacy Position</Label>
                <Select value={advocacyPosition} onValueChange={setAdvocacyPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="oppose">Oppose</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleBillTargeting} 
              disabled={billTargeting.isPending}
              className="w-full"
            >
              {billTargeting.isPending ? 'Analyzing Bills...' : 'Generate Targeting Strategy'}
            </Button>

            {billTargeting.data && (
              <div className="mt-6 space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {billTargeting.data.billsFound} relevant bills in your authentic LegiScan collection!
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Sponsors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {billTargeting.data.targetingStrategy.keySponsors.map((sponsor: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{sponsor.sponsor}</span>
                            <Badge variant="outline">{sponsor.billsSponsored} bills</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Action Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(billTargeting.data.targetingStrategy.actionTimeline).map(([week, action]) => (
                          <div key={week} className="flex items-start space-x-2">
                            <Calendar className="h-4 w-4 mt-0.5 text-blue-600" />
                            <div>
                              <span className="font-medium text-sm">{week.toUpperCase()}:</span>
                              <p className="text-sm text-muted-foreground">{action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Priority Bills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-3">
                        {billTargeting.data.relevantBills.map((bill: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm">{bill.title}</h4>
                              <Badge variant="outline">{bill.chamber}</Badge>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Sponsor: {bill.sponsor}</span>
                              <span>Status: {bill.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* District Analysis Tab */}
      {activeTab === 'district' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>District Impact Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="district-number">District Number</Label>
                <Input
                  id="district-number"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>
              <div>
                <Label htmlFor="chamber-select">Chamber</Label>
                <Select value={chamber} onValueChange={setChamber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chamber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Senate">Senate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="issue-area">Issue Area</Label>
                <Input
                  id="issue-area"
                  value={issueArea}
                  onChange={(e) => setIssueArea(e.target.value)}
                  placeholder="e.g., education"
                />
              </div>
            </div>
            <Button 
              onClick={handleDistrictAnalysis} 
              disabled={districtAnalysis.isPending}
              className="w-full"
            >
              {districtAnalysis.isPending ? 'Analyzing District...' : 'Analyze District Impact'}
            </Button>

            {districtAnalysis.data && (
              <div className="mt-6 space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    District analysis complete using authentic legislator data!
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Political Composition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          {districtAnalysis.data.impactAnalysis.districtProfile}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {districtAnalysis.data.impactAnalysis.politicalComposition.competitiveness}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Influence Potential:</span>
                          <span>{districtAnalysis.data.impactAnalysis.influencePotential.responsiveness}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>District Legislators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {districtAnalysis.data.legislators.map((leg: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{leg.name}</span>
                            <Badge variant={leg.party === 'Republican' ? 'destructive' : 'default'}>
                              {leg.party}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Priority Targeting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {districtAnalysis.data.impactAnalysis.priorityLegislators.map((leg: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{leg.name}</span>
                            <Badge variant={leg.priority === 'High' ? 'default' : 'secondary'}>
                              {leg.priority} Priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{leg.approach}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advocacy Strategy Tab */}
      {activeTab === 'strategy' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>Personalized Advocacy Strategy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user-district">Your District</Label>
                <Input
                  id="user-district"
                  value={userDistrict}
                  onChange={(e) => setUserDistrict(e.target.value)}
                  placeholder="e.g., 25"
                />
              </div>
              <div>
                <Label htmlFor="strategy-issue">Issue Area</Label>
                <Input
                  id="strategy-issue"
                  value={issueArea}
                  onChange={(e) => setIssueArea(e.target.value)}
                  placeholder="e.g., healthcare"
                />
              </div>
              <div>
                <Label htmlFor="advocacy-goal">Advocacy Goal</Label>
                <Input
                  id="advocacy-goal"
                  value={advocacyGoal}
                  onChange={(e) => setAdvocacyGoal(e.target.value)}
                  placeholder="e.g., increase funding"
                />
              </div>
              <div>
                <Label htmlFor="experience-level">Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleStrategyGeneration} 
              disabled={strategyGeneration.isPending}
              className="w-full"
            >
              {strategyGeneration.isPending ? 'Generating Strategy...' : 'Generate Personalized Strategy'}
            </Button>

            {strategyGeneration.data && (
              <div className="mt-6 space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Personalized strategy generated using your district's authentic legislator data!
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Legislators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {strategyGeneration.data.yourLegislators.map((leg: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{leg.name}</span>
                              <Badge variant={leg.party === 'Republican' ? 'destructive' : 'default'}>
                                {leg.party}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {leg.chamber} District {leg.district}
                            </div>
                            {leg.email && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Mail className="h-3 w-3" />
                                <span className="text-xs">{leg.email}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Success Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Short-term Goals:</h4>
                          <ul className="space-y-1">
                            {strategyGeneration.data.strategy.successMetrics.shortTerm.map((metric: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2 text-sm">
                                <CheckCircle className="h-3 w-3 mt-0.5 text-green-600" />
                                <span>{metric}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Long-term Goals:</h4>
                          <ul className="space-y-1">
                            {strategyGeneration.data.strategy.successMetrics.longTerm.map((metric: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2 text-sm">
                                <TrendingUp className="h-3 w-3 mt-0.5 text-blue-600" />
                                <span>{metric}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Action Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {strategyGeneration.data.strategy.actionPlan.map((step: string, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-2 border rounded">
                          <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personalized Talking Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-4">
                        {strategyGeneration.data.strategy.personalizedTalkingPoints.map((points: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <h4 className="font-medium text-sm">{points.legislator}:</h4>
                            <ul className="space-y-1 ml-4">
                              {points.points.map((point: string, pointIndex: number) => (
                                <li key={pointIndex} className="flex items-start space-x-2 text-sm">
                                  <span className="text-blue-600">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}