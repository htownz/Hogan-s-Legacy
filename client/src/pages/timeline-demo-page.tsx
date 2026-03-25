import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Clock, ChevronRight } from 'lucide-react';

export default function TimelineDemoPage() {
  const [, setLocation] = useLocation();
  const [billId, setBillId] = useState<string>('1234');

  const handleViewTimeline = () => {
    if (billId && billId.trim()) {
      setLocation(`/bills/${billId}/real-time-timeline`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Timeline Demo</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Real-Time Legislative Timeline</CardTitle>
          <CardDescription>
            View the interactive visualization of a bill's journey through the legislature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2">Enter a bill ID to view its timeline:</p>
            <div className="flex space-x-2">
              <Input 
                value={billId}
                onChange={(e) => setBillId(e.target.value)}
                placeholder="Enter bill ID"
                className="max-w-[200px]"
              />
              <Button onClick={handleViewTimeline}>
                <Clock className="mr-2 h-4 w-4" />
                View Timeline
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <h3 className="text-lg font-medium mb-2">Sample Bills:</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setBillId('1234');
                }}
              >
                HB 1234
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setBillId('5678');
                }}
              >
                SB 5678
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setBillId('9012');
                }}
              >
                HB 9012
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            The timeline visualization will show the bill's progress through various legislative stages.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}