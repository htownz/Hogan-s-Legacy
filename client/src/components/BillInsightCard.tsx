import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SocialShareButton } from './SocialShareButton';
import { Calendar, Users, TrendingUp, AlertCircle } from 'lucide-react';

interface BillInsightCardProps {
  bill: {
    id: string;
    title: string;
    billNumber?: string;
    status: string;
    chamber: string;
    sponsors: string[];
    introducedAt: Date;
    lastActionAt: Date;
    description: string;
    summary?: string;
  };
  aiInsights?: {
    complexity: 'Low' | 'Medium' | 'High';
    impactScore: number;
    keyPoints: string[];
    publicImpact: string;
    stakeholders: string[];
  };
  className?: string;
}

export function BillInsightCard({ bill, aiInsights, className }: BillInsightCardProps) {
  // Generate compelling insights from authentic bill data
  const generateShareableInsights = () => {
    const billNumber = bill.billNumber || bill.id;
    const complexity = aiInsights?.complexity || 'Medium';
    const impact = aiInsights?.publicImpact || 'This bill could affect Texas residents in significant ways.';
    const keyPoint = aiInsights?.keyPoints?.[0] || 'Important legislative development';
    
    // Create action-oriented call to action
    const callToAction = bill.status === 'active' 
      ? `📞 Contact your representative about ${billNumber} - your voice matters!`
      : `📖 Stay informed about ${billNumber} and similar legislation`;

    return {
      billTitle: bill.title,
      billNumber: billNumber,
      keyInsight: keyPoint,
      impactSummary: impact,
      callToAction: callToAction,
      url: `${window.location.origin}/bills/${bill.id}`
    };
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'dead':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'High':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Medium':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg leading-tight">
              {bill.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="outline" className={getStatusColor(bill.status)}>
                {bill.status}
              </Badge>
              <span>•</span>
              <span>{bill.chamber}</span>
              {bill.billNumber && (
                <>
                  <span>•</span>
                  <span className="font-medium">{bill.billNumber}</span>
                </>
              )}
            </div>
          </div>
          <SocialShareButton 
            billInsight={generateShareableInsights()}
            className="ml-4"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bill Timeline */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Introduced:</span>
            <span className="font-medium">{formatDate(bill.introducedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Last Action:</span>
            <span className="font-medium">{formatDate(bill.lastActionAt)}</span>
          </div>
        </div>

        {/* Sponsors */}
        {bill.sponsors && bill.sponsors.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <span className="text-gray-600">Sponsors: </span>
              <span className="font-medium">{bill.sponsors.join(', ')}</span>
            </div>
          </div>
        )}

        <Separator />

        {/* AI Insights Section */}
        {aiInsights && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Bill Analysis
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {getComplexityIcon(aiInsights.complexity)}
                <span className="text-gray-600">Complexity:</span>
                <span className="font-medium">{aiInsights.complexity}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">Impact Score:</span>
                <span className="font-medium">{aiInsights.impactScore}/10</span>
              </div>
            </div>

            {aiInsights.publicImpact && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <strong className="text-blue-800">Public Impact:</strong>
                <p className="text-blue-700 mt-1">{aiInsights.publicImpact}</p>
              </div>
            )}

            {aiInsights.keyPoints && aiInsights.keyPoints.length > 0 && (
              <div>
                <h5 className="font-medium text-sm mb-2">Key Points:</h5>
                <ul className="space-y-1 text-sm text-gray-700">
                  {aiInsights.keyPoints.slice(0, 3).map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiInsights.stakeholders && aiInsights.stakeholders.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Key Stakeholders: </span>
                <span className="font-medium">{aiInsights.stakeholders.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Bill Description */}
        <div>
          <h5 className="font-medium text-sm mb-2">Description:</h5>
          <p className="text-sm text-gray-700 leading-relaxed">
            {bill.summary || bill.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}