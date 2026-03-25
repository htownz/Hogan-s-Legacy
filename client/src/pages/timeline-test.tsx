import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';

export default function TimelineTestPage() {
  const [, setLocation] = useLocation();
  const [billId, setBillId] = useState('TX-HB0001');

  const handleGoToTimeline = () => {
    if (billId) {
      setLocation(`/bills/${billId}/timeline`);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Timeline Feature Test</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Bill Timeline Navigation</CardTitle>
          <CardDescription>
            Enter a bill ID to view its timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input 
              placeholder="Bill ID (e.g., TX-HB0001)" 
              value={billId} 
              onChange={(e) => setBillId(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleGoToTimeline()}
            />
            <Button onClick={handleGoToTimeline}>
              Go <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Example bill IDs: TX-HB0001, TX-SB0001
          </p>
        </CardFooter>
      </Card>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[
          { id: 'TX-HB0001', name: 'HB 1', title: 'General Appropriations Bill' },
          { id: 'TX-SB0001', name: 'SB 1', title: 'Senate Budget Bill' },
          { id: 'TX-HB0005', name: 'HB 5', title: 'Border Security Funding' },
          { id: 'TX-SB0003', name: 'SB 3', title: 'School Safety Measures' },
          { id: 'TX-HB0100', name: 'HB 100', title: 'Higher Education Funding' },
          { id: 'TX-SB0020', name: 'SB 20', title: 'Property Tax Relief' }
        ].map(bill => (
          <Card key={bill.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{bill.name}</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground line-clamp-2">{bill.title}</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm" onClick={() => {
                setBillId(bill.id);
                setLocation(`/bills/${bill.id}/timeline`);
              }}>
                View Timeline
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}