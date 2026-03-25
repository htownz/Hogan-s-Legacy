import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BillInsightCard } from '@/components/BillInsightCard';
import { SocialShareButton } from '@/components/SocialShareButton';
import { 
  TrendingUp, 
  Search, 
  Share2, 
  Sparkles, 
  Clock,
  Users,
  Heart
} from 'lucide-react';

interface TrendingBill {
  id: string;
  title: string;
  billNumber?: string;
  status: string;
  chamber: string;
  sponsors: string[];
  introducedAt: string;
  lastActionAt: string;
  description: string;
  socialInsights: {
    complexity: string;
    impactScore: number;
    shareHook: string;
    callToAction: string;
  };
}

export default function SocialSharingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<TrendingBill | null>(null);

  // Fetch trending bills for social sharing
  const { data: trendingData, isLoading } = useQuery<any>({
    queryKey: ['/api/bills/trending/social'],
    enabled: true
  });

  const trendingBills = trendingData?.bills || [];

  // Filter bills based on search
  const filteredBills = trendingBills.filter((bill: TrendingBill) =>
    bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.sponsors.some(sponsor => sponsor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generateQuickShareContent = (bill: TrendingBill) => {
    return {
      billTitle: bill.title,
      billNumber: bill.billNumber || bill.id.slice(0, 8),
      keyInsight: bill.socialInsights.shareHook,
      impactSummary: `Impact Score: ${bill.socialInsights.impactScore}/10 - ${bill.socialInsights.complexity} complexity`,
      callToAction: bill.socialInsights.callToAction,
      url: `${window.location.origin}/bills/${bill.id}`
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Share2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              One-Click Social Sharing
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share compelling bill insights from authentic Texas legislative data with just one click. 
            Help spread civic awareness across social media platforms.
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search bills by title, description, or sponsor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {filteredBills.length} Bills
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Trending Bills Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredBills.length > 0 ? (
            filteredBills.map((bill: TrendingBill) => (
              <Card key={bill.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {bill.title}
                    </CardTitle>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {bill.chamber}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(bill.lastActionAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>{bill.socialInsights.impactScore}/10</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {bill.description}
                  </p>

                  {bill.sponsors && bill.sponsors.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {bill.sponsors.slice(0, 2).join(', ')}
                        {bill.sponsors.length > 2 && ` +${bill.sponsors.length - 2} more`}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm text-blue-800 mb-1">
                        Social Media Hook:
                      </h4>
                      <p className="text-sm text-blue-700">
                        {bill.socialInsights.shareHook}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={bill.socialInsights.complexity === 'High' ? 'destructive' : 
                                 bill.socialInsights.complexity === 'Medium' ? 'default' : 'secondary'}
                        >
                          {bill.socialInsights.complexity}
                        </Badge>
                        <span className="text-sm text-gray-600">complexity</span>
                      </div>
                      
                      <SocialShareButton 
                        billInsight={generateQuickShareContent(bill)}
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bills found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or clear the search to see all trending bills.
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Selected Bill Details */}
        {selectedBill && (
          <div className="space-y-4">
            <Separator />
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Featured Bill Insight
            </h2>
            <BillInsightCard
              bill={{
                id: selectedBill.id,
                title: selectedBill.title,
                billNumber: selectedBill.billNumber,
                status: selectedBill.status,
                chamber: selectedBill.chamber,
                sponsors: selectedBill.sponsors,
                introducedAt: new Date(selectedBill.introducedAt),
                lastActionAt: new Date(selectedBill.lastActionAt),
                description: selectedBill.description,
                summary: selectedBill.description
              }}
              aiInsights={{
                complexity: selectedBill.socialInsights.complexity as 'Low' | 'Medium' | 'High',
                impactScore: selectedBill.socialInsights.impactScore,
                keyPoints: [
                  selectedBill.socialInsights.shareHook,
                  selectedBill.socialInsights.callToAction,
                  `${selectedBill.socialInsights.complexity} complexity bill requiring civic attention`
                ],
                publicImpact: `This ${selectedBill.socialInsights.complexity.toLowerCase()}-complexity bill has an impact score of ${selectedBill.socialInsights.impactScore}/10 and could significantly affect Texas residents.`,
                stakeholders: selectedBill.sponsors
              }}
              className="max-w-4xl mx-auto"
            />
          </div>
        )}

        {/* Feature Info */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold">
                Powered by Authentic Texas Legislative Data
              </h3>
              <p className="text-blue-100">
                All bill insights are generated from real LegiScan data (1,017 bills) and OpenStates legislator profiles (20 authentic profiles). 
                Share accurate, AI-enhanced civic information that helps your community stay informed.
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  ✓ 1,017 Authentic Bills
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  ✓ 20 Real Legislators
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  ✓ AI-Enhanced Insights
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}