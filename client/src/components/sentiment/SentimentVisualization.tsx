import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Users, Share2, ArrowRight } from 'lucide-react';
// Define component implementations directly here to avoid import issues

// SentimentStats component implementation
const SentimentStats: React.FC<{
  title: string;
  value: number | string;
  change: number;
  icon: any;
  isPercentage?: boolean;
  isCount?: boolean;
  trendDirection?: string;
}> = ({
  title,
  value,
  change,
  icon: Icon,
  isPercentage = false,
  isCount = false,
  trendDirection
}) => {
  // Determine the color based on the change value and type of metric
  const getChangeColor = () => {
    // For sentiment scores, positive change is good (green)
    if (!isPercentage && !isCount) {
      return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
    }
    
    // For percentage/count metrics, positive change is usually good (green)
    return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
  };
  
  // Format the change value
  const formattedChange = isPercentage 
    ? `${change > 0 ? '+' : ''}${change}%` 
    : `${change > 0 ? '+' : ''}${change}`;
  
  // Determine sentiment color for the value
  const getValueColor = () => {
    if (isPercentage || isCount) return '';
    
    // For sentiment scores
    if (typeof value === 'number') {
      if (value > 25) return 'text-green-600';
      if (value > 0) return 'text-green-500';
      if (value < -25) return 'text-red-600';
      if (value < 0) return 'text-red-500';
      return 'text-gray-500';
    }
    
    return '';
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${getValueColor()}`}>
              {value}
            </p>
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${getChangeColor()}`}>
                {formattedChange}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                since start of period
              </span>
            </div>
          </div>
          <div className="bg-muted rounded-full p-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// DemographicBreakdown and SentimentTriggersList are more complex
// For simplicity, we'll implement placeholder versions here
const DemographicBreakdown: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Demographic breakdown visualization</p>
      <p className="text-sm text-muted-foreground mt-2">
        {data.length} demographic data points available
      </p>
    </div>
  );
};

const SentimentTriggersList: React.FC<{ triggers: any[] }> = ({ triggers }) => {
  return (
    <div className="space-y-4">
      {triggers.map((trigger, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="bg-muted rounded-full p-2 mt-1">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-base">{trigger.triggerDescription || 'Sentiment Trigger'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>
                    {trigger.triggerType || 'Event'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {trigger.triggerDate ? format(new Date(trigger.triggerDate), 'MMM d, yyyy') : 'Recent'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {triggers.length === 0 && (
        <div className="text-center p-6">
          <p className="text-muted-foreground">No sentiment triggers found for this period</p>
        </div>
      )}
    </div>
  );
};

interface SentimentVisualizationProps {
  billId: string;
}

const SentimentVisualization: React.FC<SentimentVisualizationProps> = ({ billId }) => {
  const [activeTab, setActiveTab] = useState('trends');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');
  
  // Calculate date ranges based on timeframe
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        // No filtering by date for 'all'
        return {};
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };
  
  // Query sentiment data
  const { 
    data: sentimentData, 
    isLoading: isLoadingSentiment,
    error: sentimentError
  } = useQuery<any>({ 
    queryKey: ['/api/sentiment/bills', billId, 'analytics/over-time', timeframe],
    queryFn: async () => {
      const dateRange = getDateRange();
      const queryParams = new URLSearchParams();
      
      if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);
      
      const url = `/api/sentiment/bills/${billId}/analytics/over-time${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch sentiment data');
      }
      return response.json();
    }
  });
  
  // Query demographic breakdown
  const { 
    data: demographicData,
    isLoading: isLoadingDemographics
  } = useQuery<any>({ 
    queryKey: ['/api/sentiment/bills', billId, 'analytics/demographics'],
    queryFn: async () => {
      const response = await fetch(`/api/sentiment/bills/${billId}/analytics/demographics`);
      if (!response.ok) {
        throw new Error('Failed to fetch demographic data');
      }
      return response.json();
    },
    enabled: activeTab === 'demographics'
  });
  
  // Query sentiment triggers/events
  const { 
    data: triggersData,
    isLoading: isLoadingTriggers
  } = useQuery<any>({ 
    queryKey: ['/api/sentiment/bills', billId, 'triggers', timeframe],
    queryFn: async () => {
      const dateRange = getDateRange();
      const queryParams = new URLSearchParams();
      
      if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
      if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);
      
      const url = `/api/sentiment/bills/${billId}/triggers${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch triggers data');
      }
      return response.json();
    },
    enabled: activeTab === 'triggers'
  });
  
  // Query sentiment correlations analysis
  const { 
    data: correlationsData,
    isLoading: isLoadingCorrelations
  } = useQuery<any>({ 
    queryKey: ['/api/sentiment/bills', billId, 'analytics/correlations'],
    queryFn: async () => {
      const response = await fetch(`/api/sentiment/bills/${billId}/analytics/correlations`);
      if (!response.ok) {
        throw new Error('Failed to fetch correlation data');
      }
      return response.json();
    },
    enabled: activeTab === 'analysis'
  });
  
  // Format sentiment data for the chart
  const formatSentimentData = () => {
    if (!sentimentData) return [];
    
    return sentimentData.map((item: any) => ({
      ...item,
      date: format(new Date(item.date), 'MMM d'),
    }));
  };
  
  const chartData = formatSentimentData();
  
  // Determine sentiment trend
  const getSentimentTrend = () => {
    if (!correlationsData?.sentimentTrends) return 'neutral';
    return correlationsData.sentimentTrends.trend;
  };
  
  const sentimentTrend = getSentimentTrend();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Dynamic Civic Sentiment</span>
            <div className="flex space-x-2">
              <Button 
                variant={timeframe === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeframe('week')}
              >
                Week
              </Button>
              <Button 
                variant={timeframe === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeframe('month')}
              >
                Month
              </Button>
              <Button 
                variant={timeframe === 'year' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeframe('year')}
              >
                Year
              </Button>
              <Button 
                variant={timeframe === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeframe('all')}
              >
                All
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Track public opinion and sentiment shifts over time for this bill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="trends">
                <Activity className="w-4 h-4 mr-2" />
                Sentiment Trends
              </TabsTrigger>
              <TabsTrigger value="demographics">
                <Users className="w-4 h-4 mr-2" />
                Demographics
              </TabsTrigger>
              <TabsTrigger value="triggers">
                <Share2 className="w-4 h-4 mr-2" />
                Key Events
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analysis
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="trends">
              {isLoadingSentiment ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                  <div className="grid grid-cols-4 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ) : sentimentError ? (
                <div className="p-4 text-center text-red-500">
                  Error loading sentiment data
                </div>
              ) : chartData.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">No sentiment data available for this timeframe</p>
                  <Button variant="outline" onClick={() => setTimeframe('all')}>
                    View All Time
                  </Button>
                </div>
              ) : (
                <>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[-100, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="overallSentiment" 
                          name="Overall Sentiment" 
                          stroke="#1D2D44" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="socialMediaSentiment" 
                          name="Social Media" 
                          stroke="#5DB39E" 
                          strokeWidth={1.5}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="legislatorSentiment" 
                          name="Legislators" 
                          stroke="#FF6400" 
                          strokeWidth={1.5}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="newsMediaSentiment" 
                          name="News Media" 
                          stroke="#596475" 
                          strokeWidth={1.5}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SentimentStats 
                      title="Overall Sentiment"
                      value={chartData[chartData.length - 1]?.overallSentiment || 0}
                      change={chartData.length > 1 ? 
                        chartData[chartData.length - 1]?.overallSentiment - chartData[0]?.overallSentiment : 0}
                      icon={sentimentTrend.includes('positive') ? TrendingUp : TrendingDown}
                      trendDirection={sentimentTrend}
                    />
                    <SentimentStats 
                      title="Community Support"
                      value={`${chartData[chartData.length - 1]?.communitySupport || 0}%`}
                      change={chartData.length > 1 ? 
                        chartData[chartData.length - 1]?.communitySupport - chartData[0]?.communitySupport : 0}
                      icon={Users}
                      isPercentage
                    />
                    <SentimentStats 
                      title="Social Media"
                      value={chartData[chartData.length - 1]?.socialMediaSentiment || 0}
                      change={chartData.length > 1 ? 
                        chartData[chartData.length - 1]?.socialMediaSentiment - chartData[0]?.socialMediaSentiment : 0}
                      icon={Share2}
                    />
                    <SentimentStats 
                      title="Engagement"
                      value={chartData[chartData.length - 1]?.communityEngagement || 0}
                      change={chartData.length > 1 ? 
                        chartData[chartData.length - 1]?.communityEngagement - chartData[0]?.communityEngagement : 0}
                      icon={Activity}
                      isCount
                    />
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="demographics">
              {isLoadingDemographics ? (
                <div className="space-y-6">
                  <Skeleton className="h-[300px] w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                </div>
              ) : demographicData && demographicData.length > 0 ? (
                <DemographicBreakdown data={demographicData} />
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No demographic data available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="triggers">
              {isLoadingTriggers ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : triggersData && triggersData.length > 0 ? (
                <SentimentTriggersList triggers={triggersData} />
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No significant events found for this timeframe</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analysis">
              {isLoadingCorrelations ? (
                <div className="space-y-6">
                  <Skeleton className="h-[200px] w-full" />
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : correlationsData ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Analysis</CardTitle>
                      <CardDescription>
                        AI-powered analysis of sentiment patterns and trends
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Trend</h4>
                          <div className="flex items-center">
                            {sentimentTrend.includes('positive') ? (
                              <TrendingUp className="text-green-500 mr-2" />
                            ) : sentimentTrend.includes('negative') ? (
                              <TrendingDown className="text-red-500 mr-2" />
                            ) : (
                              <Activity className="text-blue-500 mr-2" />
                            )}
                            <span className="capitalize">
                              {sentimentTrend.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Volatility</h4>
                          <div className="flex items-center">
                            <span className="text-lg font-semibold">
                              {correlationsData.sentimentTrends?.volatility?.toFixed(2) || 'N/A'}
                            </span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {correlationsData.sentimentTrends?.volatility < 5 ? 'Low' : 
                               correlationsData.sentimentTrends?.volatility < 15 ? 'Medium' : 'High'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Total Change</h4>
                          <div className="flex items-center">
                            <span className={`text-lg font-semibold ${
                              correlationsData.sentimentTrends?.totalChange > 0 ? 'text-green-500' :
                              correlationsData.sentimentTrends?.totalChange < 0 ? 'text-red-500' : ''
                            }`}>
                              {correlationsData.sentimentTrends?.totalChange > 0 ? '+' : ''}
                              {correlationsData.sentimentTrends?.totalChange?.toFixed(1) || 'N/A'}
                            </span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              points
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {correlationsData.triggerImpact && correlationsData.triggerImpact.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-medium mb-4">Key Impact Events</h3>
                          <div className="space-y-4">
                            {correlationsData.triggerImpact.slice(0, 3).map((impact: any, idx: number) => (
                              <div key={idx} className="p-4 border rounded-lg">
                                <h4 className="font-medium">{impact.trigger}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(impact.triggerDate), 'MMM d, yyyy')}
                                </p>
                                <div className="flex items-center mt-2">
                                  <span className={`font-medium ${
                                    impact.sentimentChange > 0 ? 'text-green-500' : 
                                    impact.sentimentChange < 0 ? 'text-red-500' : ''
                                  }`}>
                                    {impact.sentimentChange > 0 ? '+' : ''}
                                    {impact.sentimentChange?.toFixed(1)}
                                  </span>
                                  <span className="mx-2 text-muted-foreground">•</span>
                                  <span className={`text-sm ${
                                    impact.correlation === 'aligned' ? 'text-green-500' : 'text-amber-500'
                                  }`}>
                                    {impact.correlation === 'aligned' ? 
                                      'Expected impact' : 'Unexpected response'}
                                  </span>
                                </div>
                              </div>
                            ))}
                            
                            {correlationsData.triggerImpact.length > 3 && (
                              <Button variant="link" className="pl-0">
                                View more impact events
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No correlation analysis available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentVisualization;