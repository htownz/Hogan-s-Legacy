import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Calendar, FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PopulateTimelineButton } from './PopulateTimelineButton';
import { stageTypeNameMap } from '@shared/schema-timeline';

// Define the timeline item types
interface TimelineStage {
  id: number;
  billId: string;
  stageType: string;
  stageTitle: string;
  stageDescription?: string;
  stageAction?: string;
  stageOrder: number;
  stageDate?: Date;
  completed?: boolean;
  active?: boolean;
  voteData?: {
    yeas?: number;
    nays?: number;
    present?: number;
    absent?: number;
    abstain?: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  itemType: 'stage';
}

interface TimelineEvent {
  id: string;
  billId: string;
  userId?: number;
  title: string;
  description?: string;
  eventDate: Date;
  eventType: string;
  isPublic: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  itemType: 'event';
}

type TimelineItem = TimelineStage | TimelineEvent;

interface BillTimelineProps {
  billId: string;
  billNumber?: string;
  billTitle?: string;
}

export function BillTimeline({ billId, billNumber = 'Unknown Bill', billTitle = 'Bill Timeline' }: BillTimelineProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  // Fetch the timeline data
  const { data: timeline, isLoading, isError, error, refetch } = useQuery<any>({
    queryKey: ['/api/bills', billId, 'timeline'],
    queryFn: async () => {
      const response = await fetch(`/api/bills/${billId}/timeline?includePrivate=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      return response.json() as Promise<TimelineItem[]>;
    },
    enabled: !!billId,
  });

  // Separate timeline items by type for the tabs
  const stageItems = timeline?.filter((item: any) => item.itemType === 'stage') || [];
  const eventItems = timeline?.filter((item: any) => item.itemType === 'event') || [];

  // Handle timeline refresh after population
  const handleTimelinePopulated = () => {
    refetch();
  };

  // Get the icon for a stage type
  const getStageIcon = (stageType: string) => {
    switch (stageType) {
      case 'introduced':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'committee_assigned':
      case 'committee_hearing':
      case 'committee_vote':
        return <Users className="h-5 w-5 text-indigo-500" />;
      case 'chamber_vote_first':
      case 'other_chamber_vote':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'governor_action':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'effective':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get the icon for an event type
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'news':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'update':
        return <FileText className="h-5 w-5 text-indigo-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format a date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No date specified';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Render the timeline items
  const renderTimelineItems = (items: TimelineItem[]) => {
    if (items.length === 0) {
      return (
        <div className="p-6 text-center text-gray-500">
          No timeline items available.
        </div>
      );
    }

    return items.map((item, index) => {
      if (item.itemType === 'stage') {
        // Render a stage
        return (
          <div key={`stage-${item.id}`} className="mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getStageIcon(item.stageType)}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-lg font-medium">{item.stageTitle}</h4>
                  {item.completed && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Completed
                    </Badge>
                  )}
                  {item.active && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Active
                    </Badge>
                  )}
                </div>
                {item.stageDescription && (
                  <p className="text-sm text-gray-600 mb-2">{item.stageDescription}</p>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formatDate(item.stageDate)}
                </div>
                
                {item.voteData && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {item.voteData.yeas !== undefined && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Yeas: {item.voteData.yeas}
                      </Badge>
                    )}
                    {item.voteData.nays !== undefined && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Nays: {item.voteData.nays}
                      </Badge>
                    )}
                    {item.voteData.present !== undefined && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Present: {item.voteData.present}
                      </Badge>
                    )}
                    {item.voteData.absent !== undefined && (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        Absent: {item.voteData.absent}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="ml-2.5 mt-4 pl-6 border-l-2 border-gray-200 h-6"></div>
            )}
          </div>
        );
      } else {
        // Render an event
        return (
          <div key={`event-${item.id}`} className="mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getEventIcon(item.eventType)}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-lg font-medium">{item.title}</h4>
                  {!item.isPublic && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Private
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formatDate(item.eventDate)}
                </div>
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="ml-2.5 mt-4 pl-6 border-l-2 border-gray-200 h-6"></div>
            )}
          </div>
        );
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading timeline...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-500">{(error as Error).message}</p>
        <PopulateTimelineButton 
          billId={billId} 
          onSuccess={handleTimelinePopulated} 
        />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{billNumber}: Timeline</CardTitle>
        <CardDescription>Track the progress and key events for {billTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Timeline</TabsTrigger>
            <TabsTrigger value="stages">Bill Stages</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {(timeline?.length || 0) > 0 ? (
              <div className="mt-4">{renderTimelineItems(timeline || [])}</div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">No timeline information available for this bill.</p>
                <PopulateTimelineButton 
                  billId={billId} 
                  onSuccess={handleTimelinePopulated} 
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stages" className="space-y-4">
            {stageItems.length > 0 ? (
              <div className="mt-4">{renderTimelineItems(stageItems)}</div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">No stages available for this bill.</p>
                <PopulateTimelineButton 
                  billId={billId} 
                  onSuccess={handleTimelinePopulated} 
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="events" className="space-y-4">
            {eventItems.length > 0 ? (
              <div className="mt-4">{renderTimelineItems(eventItems)}</div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No events recorded for this bill.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Last updated: {timeline && timeline.length > 0 
            ? formatDate(new Date(Math.max(...timeline.map((item: any) => new Date(item.updatedAt).getTime())))) 
            : 'Never'}
        </div>
        {(timeline?.length || 0) > 0 && (
          <PopulateTimelineButton 
            billId={billId} 
            onSuccess={handleTimelinePopulated} 
          />
        )}
      </CardFooter>
    </Card>
  );
}