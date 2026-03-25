import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FileText, Brain, Users, Lightbulb, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Bill {
  id: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  sponsor: string;
  party: string;
  introducedAt: string;
  lastActionAt: string;
  complexity?: number;
  readingLevel?: string;
}

interface Legislator {
  id: string;
  name: string;
  party: string;
  chamber: string;
  district: string;
  email: string;
  image: string;
  committees: string[];
  votingPattern: {
    totalVotes: number;
    partyLineVotes: number;
    bipartisanVotes: number;
  };
  billsSponsored: number;
  effectiveness: 'High' | 'Medium' | 'Low';
}

interface TranslationResult {
  originalText: string;
  simplifiedText: string;
  keyPoints: string[];
  impact: {
    personal: string[];
    community: string[];
    economy: string[];
  };
  readingLevel: {
    before: string;
    after: string;
  };
  complexityScore: {
    before: number;
    after: number;
  };
  glossary: Array<{
    term: string;
    definition: string;
  }>;
  nextSteps: string[];
  sponsorAnalysis?: {
    legislator: Legislator;
    trackRecord: string;
    similarBills: string[];
    credibilityScore: number;
    constituencyImpact: string;
  };
}

export function BillComplexityTranslator() {
  const [selectedBill, setSelectedBill] = useState<string>('');
  const [translationLevel, setTranslationLevel] = useState([5]); // 1-10 scale
  const [focusArea, setFocusArea] = useState<'general' | 'personal' | 'business' | 'community'>('general');

  const queryClient = useQueryClient();

  // Fetch available bills from authentic Texas collection
  const { data: bills = [], isLoading: billsLoading } = useQuery<any>({
    queryKey: ['/api/bills/texas-authentic']
  });

  // Fetch bill translation
  const translateMutation = useMutation({
    mutationFn: async (params: { billId: string; level: number; focus: string }) => {
      const response = await fetch('/api/bills/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Translation failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills/translate'] });
    }
  });

  const handleTranslate = () => {
    if (!selectedBill) return;
    
    translateMutation.mutate({
      billId: selectedBill,
      level: translationLevel[0],
      focus: focusArea
    });
  };

  const translationResult: TranslationResult | null = translateMutation.data?.translation || null;
  const selectedBillData = Array.isArray(bills) ? bills.find((bill: Bill) => bill.id === selectedBill) : null;

  const getReadingLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'elementary': return 'bg-green-100 text-green-800';
      case 'middle school': return 'bg-blue-100 text-blue-800';
      case 'high school': return 'bg-yellow-100 text-yellow-800';
      case 'college': return 'bg-orange-100 text-orange-800';
      case 'graduate': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderTranslationSettings = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Translation Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bill Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Texas Bill</label>
          <Select value={selectedBill} onValueChange={setSelectedBill}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a bill to translate..." />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(bills) && bills.slice(0, 20).map((bill: Bill) => (
                <SelectItem key={bill.id} value={bill.id}>
                  {bill.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Translation Level */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Reading Level (1 = Elementary, 10 = Graduate)</label>
          <div className="space-y-2">
            <Slider
              value={translationLevel}
              onValueChange={setTranslationLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Elementary</span>
              <span className="font-medium">Level {translationLevel[0]}</span>
              <span>Graduate</span>
            </div>
          </div>
        </div>

        {/* Focus Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Focus Area</label>
          <Select value={focusArea} onValueChange={(value: any) => setFocusArea(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Public</SelectItem>
              <SelectItem value="personal">Personal Impact</SelectItem>
              <SelectItem value="business">Business Impact</SelectItem>
              <SelectItem value="community">Community Impact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleTranslate} 
          disabled={!selectedBill || translateMutation.isPending}
          className="w-full"
        >
          {translateMutation.isPending ? 'Translating...' : 'Translate Bill'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderOriginalBill = () => {
    if (!selectedBillData) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Original Bill</span>
            </div>
            {selectedBillData.complexity && (
              <Badge variant="outline" className={getComplexityColor(selectedBillData.complexity)}>
                Complexity: {selectedBillData.complexity}/10
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">{selectedBillData.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Sponsor: {selectedBillData.sponsor}</span>
              <span>Chamber: {selectedBillData.chamber}</span>
              <span>Status: {selectedBillData.status}</span>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium">Original Text</h4>
            <ScrollArea className="h-32">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedBillData.description}
              </p>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTranslationResult = () => {
    if (!translationResult) return null;

    return (
      <div className="space-y-6">
        {/* Translation Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>Plain English Translation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reading Level Improvement */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Reading Level:</span>
              <div className="flex items-center space-x-2">
                <Badge className={getReadingLevelColor(translationResult.readingLevel.before)}>
                  {translationResult.readingLevel.before}
                </Badge>
                <span>→</span>
                <Badge className={getReadingLevelColor(translationResult.readingLevel.after)}>
                  {translationResult.readingLevel.after}
                </Badge>
              </div>
            </div>

            {/* Complexity Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Complexity Score:</span>
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${getComplexityColor(translationResult.complexityScore.before)}`}>
                  {translationResult.complexityScore.before}/10
                </span>
                <span>→</span>
                <span className={`font-bold ${getComplexityColor(translationResult.complexityScore.after)}`}>
                  {translationResult.complexityScore.after}/10
                </span>
              </div>
            </div>

            <Separator />

            {/* Simplified Text */}
            <div className="space-y-2">
              <h4 className="font-medium">What This Bill Actually Does</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {translationResult.simplifiedText}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Sponsor Analysis with Authentic Legislator Data */}
        {translationResult.sponsorAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Sponsor Intelligence</span>
                <Badge variant="outline" className="ml-2">
                  Authentic Texas Data
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Legislator Profile */}
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {translationResult.sponsorAnalysis.legislator.image ? (
                    <img 
                      src={translationResult.sponsorAnalysis.legislator.image} 
                      alt={translationResult.sponsorAnalysis.legislator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">
                    {translationResult.sponsorAnalysis.legislator.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Badge variant={translationResult.sponsorAnalysis.legislator.party === 'Republican' ? 'destructive' : 'default'}>
                      {translationResult.sponsorAnalysis.legislator.party}
                    </Badge>
                    <span>•</span>
                    <span>{translationResult.sponsorAnalysis.legislator.chamber}</span>
                    <span>•</span>
                    <span>District {translationResult.sponsorAnalysis.legislator.district}</span>
                  </div>
                  {translationResult.sponsorAnalysis.legislator.email && (
                    <p className="text-sm text-blue-600 mt-1">
                      {translationResult.sponsorAnalysis.legislator.email}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">Effectiveness:</span>
                    <Badge variant={
                      translationResult.sponsorAnalysis.legislator.effectiveness === 'High' ? 'default' :
                      translationResult.sponsorAnalysis.legislator.effectiveness === 'Medium' ? 'secondary' : 'outline'
                    }>
                      {translationResult.sponsorAnalysis.legislator.effectiveness}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Credibility: {translationResult.sponsorAnalysis.credibilityScore}/100
                  </div>
                </div>
              </div>

              <Separator />

              {/* Voting Pattern Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {translationResult.sponsorAnalysis.legislator.votingPattern.totalVotes}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Votes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((translationResult.sponsorAnalysis.legislator.votingPattern.bipartisanVotes / 
                    translationResult.sponsorAnalysis.legislator.votingPattern.totalVotes) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Bipartisan</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {translationResult.sponsorAnalysis.legislator.billsSponsored}
                  </div>
                  <div className="text-sm text-muted-foreground">Bills Sponsored</div>
                </div>
              </div>

              {/* Committee Memberships */}
              {translationResult.sponsorAnalysis.legislator.committees.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium">Committee Memberships</h5>
                  <div className="flex flex-wrap gap-2">
                    {translationResult.sponsorAnalysis.legislator.committees.map((committee, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {committee}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Track Record & Similar Bills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium">Legislative Track Record</h5>
                  <p className="text-sm text-muted-foreground">
                    {translationResult.sponsorAnalysis.trackRecord}
                  </p>
                </div>
                {translationResult.sponsorAnalysis.similarBills.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium">Similar Bills Sponsored</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {translationResult.sponsorAnalysis.similarBills.slice(0, 3).map((bill, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-xs text-blue-600">•</span>
                          <span>{bill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Constituency Impact */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Impact on Your District:</strong> {translationResult.sponsorAnalysis.constituencyImpact}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Key Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Key Points</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {translationResult.keyPoints.map((point, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{point}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Impact Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>How This Affects You</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personal Impact */}
            {translationResult.impact.personal.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-700">Personal Impact</h4>
                <div className="space-y-1">
                  {translationResult.impact.personal.map((impact, index) => (
                    <Alert key={index} className="border-green-200">
                      <Info className="h-4 w-4" />
                      <AlertDescription>{impact}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Community Impact */}
            {translationResult.impact.community.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-700">Community Impact</h4>
                <div className="space-y-1">
                  {translationResult.impact.community.map((impact, index) => (
                    <Alert key={index} className="border-blue-200">
                      <Info className="h-4 w-4" />
                      <AlertDescription>{impact}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Economic Impact */}
            {translationResult.impact.economy.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-orange-700">Economic Impact</h4>
                <div className="space-y-1">
                  {translationResult.impact.economy.map((impact, index) => (
                    <Alert key={index} className="border-orange-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{impact}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Glossary */}
        {translationResult.glossary && translationResult.glossary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Terms to Know</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {translationResult.glossary.map((item, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium">{item.term}</h4>
                    <p className="text-sm text-muted-foreground">{item.definition}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {translationResult.nextSteps && translationResult.nextSteps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>What Can You Do?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {translationResult.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">AI Bill Translator</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transform complex Texas legislation into plain English that everyone can understand. 
          Get personalized explanations of how bills affect your daily life.
        </p>
      </div>

      {renderTranslationSettings()}
      {renderOriginalBill()}

      {translateMutation.isError && (
        <Alert className="border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to translate bill. Please try again or select a different bill.
          </AlertDescription>
        </Alert>
      )}

      {renderTranslationResult()}

      {!selectedBill && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Bill to Get Started</h3>
            <p className="text-muted-foreground">
              Choose any Texas bill from the dropdown above to see it translated into plain English
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}