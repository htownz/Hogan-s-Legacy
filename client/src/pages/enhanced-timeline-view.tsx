import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedTimeline } from '@/components/legislation/EnhancedTimeline';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMobileDetection, useTabletDetection } from '@/hooks/use-media-query';
import { ArrowLeft, RefreshCw, Share2 } from 'lucide-react';

export default function EnhancedTimelineView() {
  const params = useParams<{ billId: string }>();
  const billId = params?.billId || '';
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const isMobile = useMobileDetection();
  const isTablet = useTabletDetection();
  
  // Fetch bill details
  const { data: bill, isLoading: isBillLoading } = useQuery<any>({
    queryKey: ['/api/bills', billId],
    queryFn: async () => {
      if (!billId) return null;
      const response = await fetch(`/api/bills/${billId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bill data');
      }
      return response.json();
    },
    enabled: !!billId,
  });
  
  // Fetch timeline data
  const { 
    data: timeline, 
    isLoading: isTimelineLoading, 
    isError: isTimelineError,
    error: timelineError,
    refetch: refetchTimeline 
  } = useQuery<any>({
    queryKey: ['/api/bills', billId, 'timeline'],
    queryFn: async () => {
      if (!billId) return [];
      const response = await fetch(`/api/bills/${billId}/timeline?includePrivate=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      return response.json();
    },
    enabled: !!billId,
  });
  
  // Handle back navigation
  const handleBack = () => {
    window.history.back();
  };
  
  // Handle timeline refresh
  const handleRefresh = () => {
    refetchTimeline();
    setShowSuccessMessage(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };
  
  // Handle share functionality
  const handleShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${bill?.number} Timeline`,
          text: `Track the legislative journey of ${bill?.number}: ${bill?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };
  
  useEffect(() => {
    // Set page title
    if (bill) {
      document.title = `${bill.number} Timeline | Act Up`;
    }
  }, [bill]);
  
  const isLoading = isBillLoading || isTimelineLoading;

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack} 
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold">
            {isBillLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              bill?.number || 'Bill Timeline'
            )}
          </h1>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
      
      {/* Success message */}
      {showSuccessMessage && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            {typeof navigator.share === 'function' ? 'Timeline shared successfully!' : 'Link copied to clipboard!'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Bill title */}
      {isBillLoading ? (
        <Skeleton className="h-6 w-full mb-6" />
      ) : (
        <h2 className="text-lg text-gray-700 mb-6">{bill?.title}</h2>
      )}
      
      {/* Timeline view */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Legislative Timeline</CardTitle>
            <CardDescription>
              Track the bill's journey through the Texas Legislature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedTimeline
              billId={billId}
              timelineItems={timeline || []}
              loading={isLoading}
              error={isTimelineError ? timelineError as Error : null}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Mobile-optimized bill information tabs */}
      {(isMobile || isTablet) && (
        <Tabs defaultValue="summary" className="mb-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="authors">Authors</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {isBillLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  bill?.summary || 'No summary available.'
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authors" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Authors</CardTitle>
              </CardHeader>
              <CardContent>
                {isBillLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ) : (
                  <ul className="list-disc list-inside text-sm">
                    {bill?.authors?.map((author: string, index: number) => (
                      <li key={index}>{author}</li>
                    )) || 'No authors available.'}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                {isBillLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {bill?.subjects?.map((subject: string, index: number) => (
                      <div 
                        key={index} 
                        className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-xs"
                      >
                        {subject}
                      </div>
                    )) || 'No subjects available.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Desktop bill information layout */}
      {!isMobile && !isTablet && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isBillLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                bill?.summary || 'No summary available.'
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Authors</CardTitle>
              </CardHeader>
              <CardContent>
                {isBillLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ) : (
                  <ul className="list-disc list-inside">
                    {bill?.authors?.map((author: string, index: number) => (
                      <li key={index}>{author}</li>
                    )) || 'No authors available.'}
                  </ul>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                {isBillLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {bill?.subjects?.map((subject: string, index: number) => (
                      <div 
                        key={index} 
                        className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm"
                      >
                        {subject}
                      </div>
                    )) || 'No subjects available.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}