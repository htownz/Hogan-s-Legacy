import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft } from 'lucide-react';

interface BillDetailProps {
  billId: number;
  onBack: () => void;
}

interface Sponsor {
  people_id: number;
  person_hash: string;
  party_id: string;
  party: string;
  role_id: number;
  role: string;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  nickname: string;
  district: string;
  ftm_eid: number;
  votesmart_id: number;
  opensecrets_id: string;
  transparency_data_id: string;
  govtrack_id: number;
  bill_id: number;
  type_id: number;
  committee_sponsor: number;
  position: number;
}

interface HistoryItem {
  date: string;
  action: string;
  chamber: string;
}

interface Vote {
  roll_call_id: number;
  date: string;
  desc: string;
  chamber: string;
}

/**
 * BillDetail component displays detailed information about a specific bill
 */
export function BillDetail({ billId, onBack }: BillDetailProps) {
  interface BillResponse {
    success: boolean;
    data: {
      bill_id: number;
      bill_number: string;
      bill_type: string;
      bill_type_id: string;
      body: string;
      body_id: number;
      current_body: string;
      current_body_id: number;
      title: string;
      description: string;
      state: string;
      status: number;
      status_date: string;
      status_desc: string;
      sponsors: Sponsor[];
      history: HistoryItem[];
      votes: Vote[];
      [key: string]: any;
    };
  }

  // Fetch bill details
  const { data, isLoading, isError } = useQuery<BillResponse>({
    queryKey: [`/api/legiscan/bill/${billId}`],
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <CardTitle><Skeleton className="h-6 w-64" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-full" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <CardTitle>Error Loading Bill</CardTitle>
          <CardDescription>
            Unable to load bill information. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const bill = data?.data;
  if (!bill) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <CardTitle>Bill Not Found</CardTitle>
          <CardDescription>
            The requested bill information could not be found.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <Button variant="ghost" size="sm" onClick={onBack} className="w-fit mb-2">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <CardTitle>{bill.bill_number}</CardTitle>
          <Badge variant={bill.status === 1 ? "default" : "outline"}>
            {bill.status_desc}
          </Badge>
        </div>
        <CardDescription className="text-lg font-medium mt-2">
          {bill.title}
        </CardDescription>
        {bill.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {bill.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{bill.state}</Badge>
          <Badge variant="outline">{bill.bill_type}</Badge>
          <Badge variant="outline">Current Body: {bill.current_body}</Badge>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Latest Action</h3>
          <div className="p-3 bg-muted rounded-md">
            <div className="font-medium">{bill.status_desc}</div>
            <div className="text-sm">{formatDate(bill.status_date)}</div>
          </div>
        </div>

        {bill.sponsors && bill.sponsors.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sponsors">
              <AccordionTrigger>
                Sponsors ({bill.sponsors.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {bill.sponsors.map((sponsor: Sponsor) => (
                    <div key={sponsor.people_id} className="flex items-center">
                      <div className="flex-1">
                        <div className="font-medium">{sponsor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {sponsor.party} • {sponsor.role} • {sponsor.district}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {sponsor.committee_sponsor ? 'Committee' : 'Individual'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {bill.history && bill.history.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="history">
              <AccordionTrigger>
                History ({bill.history.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {bill.history.map((item: HistoryItem, index: number) => (
                    <div key={index} className="border-b pb-2 last:border-0">
                      <div className="text-sm font-medium">{formatDate(item.date)}</div>
                      <div>{item.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.chamber}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {bill.votes && bill.votes.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="votes">
              <AccordionTrigger>
                Votes ({bill.votes.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {bill.votes.map((vote: Vote) => (
                    <div key={vote.roll_call_id} className="border rounded-md p-3">
                      <div className="font-medium">{vote.desc}</div>
                      <div className="text-sm">
                        {vote.chamber} • {formatDate(vote.date)}
                      </div>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto mt-1" 
                        size="sm"
                      >
                        View Roll Call
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Results
        </Button>
        <Button>Track This Bill</Button>
      </CardFooter>
    </Card>
  );
}