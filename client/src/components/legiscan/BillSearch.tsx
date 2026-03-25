import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

interface Bill {
  bill_id: number;
  bill_number: string;
  title: string;
  description: string;
  state: string;
  relevance: number;
  last_action: string;
  last_action_date: string;
}

/**
 * BillSearch component provides an interface to search for bills via LegiScan
 */
export function BillSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  interface SearchResponse {
    success: boolean;
    data: {
      [key: string]: Bill;
    };
  }

  // Fetch search results based on user query
  const { data, isLoading, refetch } = useQuery<SearchResponse>({
    queryKey: ['/api/legiscan/search', searchQuery],
    enabled: isSearching,
    retry: 1,
  });
  
  const handleSearch = () => {
    if (searchQuery.trim().length > 2) {
      setIsSearching(true);
      refetch();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
  
  const bills: Bill[] = data?.data ? Object.values(data.data) : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Search Legislation</CardTitle>
        <CardDescription>
          Find bills by keyword, topic, or bill number
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Enter search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searchQuery.trim().length < 3}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        
        {isSearching && isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isSearching && bills.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No bills found matching your search criteria.
          </p>
        ) : isSearching && bills.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Last Action</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.bill_id}>
                  <TableCell className="font-medium">{bill.bill_number}</TableCell>
                  <TableCell className="max-w-xs truncate" title={bill.title}>
                    {bill.title}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={bill.last_action}>
                    {bill.last_action}
                  </TableCell>
                  <TableCell>{formatDate(bill.last_action_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
            <div className="text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                Enter keywords above to search for legislation
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}