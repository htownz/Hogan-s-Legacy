import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ExternalLink, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EnhancedBillProps {
  initialBillId?: number;
}

const EnhancedBillView: React.FC<EnhancedBillProps> = ({ initialBillId }) => {
  const [, setLocation] = useLocation();
  const [billId, setBillId] = useState<string>(initialBillId?.toString() || '');
  const [activeBillId, setActiveBillId] = useState<number | null>(initialBillId || null);

  // Query for enhanced bill data
  const {
    data: enhancedBill,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<any>({
    queryKey: ['/api/integrator/bill', activeBillId],
    queryFn: async () => {
      if (!activeBillId) return null;
      const response = await fetch(`/api/integrator/bill/${activeBillId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch enhanced bill data');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!activeBillId // Only run query if activeBillId is set
  });

  const handleSearch = () => {
    const parsedId = parseInt(billId.trim());
    if (!isNaN(parsedId)) {
      setActiveBillId(parsedId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillId(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Render loading state
  if (activeBillId && isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Loading enhanced bill data...</p>
      </div>
    );
  }

  // Render error state
  if (activeBillId && isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Bill</AlertTitle>
        <AlertDescription>
          Failed to load enhanced bill data: {(error as Error)?.message || 'Unknown error'}
        </AlertDescription>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Bill View</CardTitle>
          <CardDescription>
            Access detailed information about bills with related context, similar legislation, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter Bill ID"
              value={billId}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="max-w-[200px]"
            />
            <Button onClick={handleSearch}>View</Button>
          </div>
        </CardContent>
      </Card>

      {enhancedBill && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{enhancedBill.bill_number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  State: {enhancedBill.state} | Status: {enhancedBill.status_desc}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation(`/bills/${activeBillId}/real-time-timeline`)}
              >
                <Clock className="mr-2 h-4 w-4" />
                View Real-Time Timeline
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="related">Related Bills</TabsTrigger>
                <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Title</h3>
                  <p>{enhancedBill.title}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p>{enhancedBill.description}</p>
                </div>
                
                {enhancedBill.texts && enhancedBill.texts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold">Bill Text Versions</h3>
                    <ul className="list-disc pl-5">
                      {enhancedBill.texts.map((text: any) => (
                        <li key={text.doc_id} className="my-1">
                          <a 
                            href={text.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary flex items-center"
                          >
                            {text.type} ({new Date(text.date).toLocaleDateString()})
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {enhancedBill.history && enhancedBill.history.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold">Recent History</h3>
                    <ul className="space-y-2">
                      {enhancedBill.history.slice(0, 5).map((event: any, index: number) => (
                        <li key={index} className="border-l-2 border-primary pl-3 py-1">
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="related" className="space-y-4">
                {enhancedBill.relatedBills && enhancedBill.relatedBills.length > 0 ? (
                  <div className="space-y-3">
                    {enhancedBill.relatedBills.map((bill: any) => (
                      <Card key={bill.bill_id} className="overflow-hidden">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-base">{bill.bill_number}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                          <p className="text-sm line-clamp-2">{bill.title}</p>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setBillId(bill.bill_id.toString());
                              setActiveBillId(bill.bill_id);
                            }}
                          >
                            View Details
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No related bills found.</p>
                )}
              </TabsContent>
              
              <TabsContent value="sponsors" className="space-y-4">
                {enhancedBill.sponsors && enhancedBill.sponsors.length > 0 ? (
                  <div className="space-y-4">
                    <ul className="divide-y">
                      {enhancedBill.sponsors.map((sponsor: any) => (
                        <li key={sponsor.people_id} className="py-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{sponsor.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {sponsor.role || 'Sponsor'} | {sponsor.party}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/legislator/${sponsor.people_id}`, '_blank')}
                            >
                              View Profile
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>No sponsor information available.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedBillView;