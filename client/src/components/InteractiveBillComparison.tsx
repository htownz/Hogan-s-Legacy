import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, User, MapPin, Gavel, GitCompare } from 'lucide-react';

interface Bill {
  id: string;
  title: string;
  number: string;
  chamber: string;
  status: string;
  summary: string;
  sponsor: string;
  party: string;
  district: string;
  dateIntroduced: string;
  lastAction: string;
  votes: {
    for: number;
    against: number;
    abstain: number;
  };
  keywords: string[];
  category: string;
}

interface ComparisonMetrics {
  similarity: number;
  differences: string[];
  commonElements: string[];
  conflictingProvisions: string[];
}

export function InteractiveBillComparison() {
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [comparisonView, setComparisonView] = useState<'side-by-side' | 'overlay' | 'differences'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState([50]);
  const [showMetrics, setShowMetrics] = useState(true);

  // Fetch available bills for comparison
  const { data: bills = [], isLoading: billsLoading } = useQuery<any>({
    queryKey: ['/api/bills']
  });

  // Fetch comparison analysis when bills are selected
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery<any>({
    queryKey: ['/api/bills/compare', selectedBills],
    enabled: selectedBills.length >= 2
  });

  // Type the bills data properly
  const typedBills = Array.isArray(bills) ? bills as Bill[] : [];
  const typedComparisonData = comparisonData as { metrics?: ComparisonMetrics; detailedAnalysis?: string } || {};

  const handleBillSelect = (billId: string) => {
    if (selectedBills.includes(billId)) {
      setSelectedBills(selectedBills.filter(id => id !== billId));
    } else if (selectedBills.length < 3) {
      setSelectedBills([...selectedBills, billId]);
    }
  };

  const renderBillCard = (bill: Bill, index: number) => (
    <Card key={bill.id} className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {bill.number}
          </CardTitle>
          <Badge variant={bill.status === 'Passed' ? 'default' : 'secondary'}>
            {bill.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          {bill.title}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sponsor Information */}
        <div className="flex items-center space-x-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{bill.sponsor}</span>
          <Badge variant="outline" className="text-xs">
            {bill.party}
          </Badge>
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">District {bill.district}</span>
          </div>
        </div>

        {/* Bill Details */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Introduced:</span>
            <span>{bill.dateIntroduced}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Gavel className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Chamber:</span>
            <span>{bill.chamber}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Summary</h4>
          <ScrollArea className="h-20">
            <p className="text-sm text-muted-foreground">
              {bill.summary}
            </p>
          </ScrollArea>
        </div>

        {/* Voting Results */}
        {bill.votes && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Latest Vote</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-600">{bill.votes.for}</div>
                <div className="text-muted-foreground">For</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">{bill.votes.against}</div>
                <div className="text-muted-foreground">Against</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600">{bill.votes.abstain}</div>
                <div className="text-muted-foreground">Abstain</div>
              </div>
            </div>
          </div>
        )}

        {/* Keywords */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Keywords</h4>
          <div className="flex flex-wrap gap-1">
            {bill.keywords?.map((keyword, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderComparisonMetrics = () => {
    if (!comparisonData || !showMetrics) return null;

    const metrics: ComparisonMetrics = typedComparisonData.metrics || {
      similarity: 0,
      differences: [],
      commonElements: [],
      conflictingProvisions: []
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitCompare className="h-5 w-5" />
            <span>Comparison Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Similarity Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Similarity Score</span>
              <span className="font-medium">{metrics.similarity}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${metrics.similarity}%` }}
              />
            </div>
          </div>

          {/* Common Elements */}
          {metrics.commonElements.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-green-700">Common Elements</h4>
              <div className="space-y-1">
                {metrics.commonElements.map((element, i) => (
                  <div key={i} className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    {element}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Differences */}
          {metrics.differences.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-blue-700">Key Differences</h4>
              <div className="space-y-1">
                {metrics.differences.map((difference, i) => (
                  <div key={i} className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    {difference}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflicting Provisions */}
          {metrics.conflictingProvisions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-red-700">Conflicting Provisions</h4>
              <div className="space-y-1">
                {metrics.conflictingProvisions.map((conflict, i) => (
                  <div key={i} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {conflict}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderInteractiveSlider = () => {
    if (selectedBills.length !== 2 || comparisonView !== 'overlay') return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Interactive Comparison Slider</CardTitle>
          <p className="text-sm text-muted-foreground">
            Drag the slider to compare bill provisions side-by-side
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{bills.find((b: any) => b.id === selectedBills[0])?.number}</span>
              <span className="font-medium">{bills.find((b: any) => b.id === selectedBills[1])?.number}</span>
            </div>
            <Slider
              value={sliderPosition}
              onValueChange={setSliderPosition}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-muted-foreground">
              {sliderPosition[0]}% - {100 - sliderPosition[0]}%
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interactive Bill Comparison</h1>
          <p className="text-muted-foreground mt-2">
            Compare Texas bills side-by-side with detailed analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={comparisonView} onValueChange={(value: any) => setComparisonView(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="side-by-side">Side by Side</SelectItem>
              <SelectItem value="overlay">Overlay View</SelectItem>
              <SelectItem value="differences">Differences</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowMetrics(!showMetrics)}
          >
            {showMetrics ? 'Hide' : 'Show'} Metrics
          </Button>
        </div>
      </div>

      {/* Bill Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Bills to Compare (Choose 2-3)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Selected: {selectedBills.length} of 3 maximum
          </p>
        </CardHeader>
        <CardContent>
          {billsLoading ? (
            <div className="text-center py-8">Loading bills...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bills.slice(0, 12).map((bill: Bill) => (
                <Card 
                  key={bill.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedBills.includes(bill.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleBillSelect(bill.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{bill.number}</h3>
                      <Badge variant="outline" className="text-xs">
                        {bill.chamber}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {bill.title}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Sponsor: {bill.sponsor}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedBills.length >= 2 && (
        <>
          {renderComparisonMetrics()}
          {renderInteractiveSlider()}

          <div className="space-y-6">
            {comparisonView === 'side-by-side' && (
              <div className={`grid gap-6 ${selectedBills.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                {selectedBills.map((billId, index) => {
                  const bill = bills.find((b: any) => b.id === billId);
                  return bill ? renderBillCard(bill, index) : null;
                })}
              </div>
            )}

            {comparisonView === 'overlay' && selectedBills.length === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Overlay Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div 
                      className="transition-all duration-300 overflow-hidden"
                      style={{ 
                        clipPath: `polygon(0 0, ${sliderPosition[0]}% 0, ${sliderPosition[0]}% 100%, 0 100%)` 
                      }}
                    >
                      {bills.find((b: any) => b.id === selectedBills[0]) && 
                        renderBillCard(bills.find((b: any) => b.id === selectedBills[0])!, 0)}
                    </div>
                    <div 
                      className="absolute top-0 left-0 w-full transition-all duration-300 overflow-hidden"
                      style={{ 
                        clipPath: `polygon(${sliderPosition[0]}% 0, 100% 0, 100% 100%, ${sliderPosition[0]}% 100%)` 
                      }}
                    >
                      {bills.find((b: any) => b.id === selectedBills[1]) && 
                        renderBillCard(bills.find((b: any) => b.id === selectedBills[1])!, 1)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {comparisonView === 'differences' && comparisonData && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Differences Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {comparisonLoading ? (
                    <div className="text-center py-8">Analyzing differences...</div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        AI-powered analysis of key differences between selected bills
                      </p>
                      <Separator />
                      <div className="space-y-4">
                        {comparisonData.detailedAnalysis || 'Detailed analysis not available'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {selectedBills.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select Bills to Compare</h3>
            <p className="text-muted-foreground">
              Choose 2-3 bills from the list above to start comparing them side-by-side
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}