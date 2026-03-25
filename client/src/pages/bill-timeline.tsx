import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { BillTimeline } from '@/components/legislation/BillTimeline';
import { AddTimelineEventForm } from '@/components/legislation/AddTimelineEventForm';
import { PopulateTimelineButton } from '@/components/legislation/PopulateTimelineButton';
import { Plus, ArrowLeft, InfoIcon, Share2 } from 'lucide-react';

export default function BillTimelinePage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { billId } = params;
  
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isAddEventSheetOpen, setIsAddEventSheetOpen] = useState(false);
  
  // Fetch the bill details
  const { data: bill, isLoading, isError } = useQuery<any>({
    queryKey: ['/api/bills', billId],
    queryFn: async () => {
      const response = await fetch(`/api/bills/${billId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bill data');
      }
      return response.json();
    },
    enabled: !!billId,
  });
  
  const handleAddEventSuccess = () => {
    setIsAddEventDialogOpen(false);
    setIsAddEventSheetOpen(false);
  };
  
  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/bills')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bills
        </Button>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{bill?.number || 'Loading...'}</h1>
            <p className="text-lg text-muted-foreground mt-1">{bill?.title || 'Bill Timeline'}</p>
          </div>
          
          {/* Mobile Add Event */}
          <div className="mt-4 sm:mt-0 sm:hidden w-full">
            <Sheet open={isAddEventSheetOpen} onOpenChange={setIsAddEventSheetOpen}>
              <SheetTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Timeline Event
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add Timeline Event</SheetTitle>
                  <SheetDescription>
                    Record a new event in this bill's timeline.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                  {billId && (
                    <AddTimelineEventForm 
                      billId={billId}
                      onSuccess={handleAddEventSuccess}
                      onCancel={() => setIsAddEventSheetOpen(false)}
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Add Event */}
          <div className="hidden sm:block">
            <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Timeline Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Timeline Event</DialogTitle>
                  <DialogDescription>
                    Record a new event in this bill's timeline.
                  </DialogDescription>
                </DialogHeader>
                {billId && (
                  <AddTimelineEventForm 
                    billId={billId}
                    onSuccess={handleAddEventSuccess}
                    onCancel={() => setIsAddEventDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Separator className="my-4" />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {billId && (
          <BillTimeline 
            billId={billId} 
            billNumber={bill?.number} 
            billTitle={bill?.title}
          />
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>About Bill Timelines</CardTitle>
            <CardDescription>
              How to use the legislative timeline feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <InfoIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium">Track Bill Progress</h3>
                  <p className="text-sm text-gray-600">
                    The timeline shows the official stages a bill goes through in the legislative process, from introduction to becoming law.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <Plus className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium">Add Your Own Events</h3>
                  <p className="text-sm text-gray-600">
                    You can add custom events to track news coverage, community actions, or personal notes about this bill.
                  </p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <Share2 className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-medium">Public vs. Private Events</h3>
                  <p className="text-sm text-gray-600">
                    Choose whether your added events are visible to other users or kept private for your own tracking.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-gray-500">
              Bill stages are based on official Texas Legislature data. Events may be added by community members.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}