import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart4, Search, Calendar, FileText, Filter, SlidersHorizontal, 
  ChevronDown, Download, Loader2
} from 'lucide-react';
import VoteVisualization, { VoteData } from '@/components/legislation/VoteVisualization';
import { apiRequest } from '@/lib/api';

interface BillVoteData {
  id: string;
  billId: string;
  billNumber: string;
  billTitle: string;
  chamberName: 'house' | 'senate';
  voteDate: string;
  voteType: string;
  voteData: VoteData;
  lastUpdated: string;
}

export default function VoteDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chamber, setChamber] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [currentTab, setCurrentTab] = useState<string>('recent');
  
  // Fetch vote data
  const { data: voteData, isLoading, error } = useQuery<any>({
    queryKey: ['/api/bills/vote-data'],
    queryFn: async () => {
      try {
        const response = await apiRequest<BillVoteData[]>('/api/bills/vote-data');
        return response;
      } catch (err) {
        console.error('Error fetching vote data:', err);
        throw err;
      }
    }
  });
  
  // Filter vote data based on search term, chamber, and date range
  const filteredVoteData = React.useMemo(() => {
    if (!voteData) return [];
    
    let filtered = [...voteData];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(vote => 
        vote.billId.toLowerCase().includes(searchLower) ||
        vote.billNumber.toLowerCase().includes(searchLower) ||
        vote.billTitle.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply chamber filter
    if (chamber !== 'all') {
      filtered = filtered.filter(vote => vote.chamberName.toLowerCase() === chamber.toLowerCase());
    }
    
    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      filtered = filtered.filter(vote => new Date(vote.voteDate) >= startDate);
    }
    
    // Sort by different criteria based on the current tab
    switch (currentTab) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.voteDate).getTime() - new Date(a.voteDate).getTime());
        break;
      case 'closeVotes':
        filtered.sort((a, b) => {
          const diffA = Math.abs(a.voteData.yes - a.voteData.no);
          const diffB = Math.abs(b.voteData.yes - b.voteData.no);
          return diffA - diffB;
        });
        break;
      case 'highParticipation':
        filtered.sort((a, b) => {
          const totalA = a.voteData.yes + a.voteData.no + a.voteData.present + a.voteData.absent;
          const totalB = b.voteData.yes + b.voteData.no + b.voteData.present + b.voteData.absent;
          const participationA = (totalA - a.voteData.absent) / totalA;
          const participationB = (totalB - b.voteData.absent) / totalB;
          return participationB - participationA;
        });
        break;
    }
    
    return filtered;
  }, [voteData, searchTerm, chamber, dateRange, currentTab]);
  
  // Generate sample data if none is available yet
  const mockVoteData: BillVoteData[] = [
    {
      id: '1',
      billId: 'TX-HB456',
      billNumber: 'HB 456',
      billTitle: 'An Act relating to the regulation of groundwater conservation districts',
      chamberName: 'house',
      voteDate: '2023-04-15T14:30:00Z',
      voteType: 'passage',
      voteData: {
        yes: 98,
        no: 42,
        present: 5,
        absent: 5,
        chamber: 'house',
        billId: 'TX-HB456',
        date: '2023-04-15T14:30:00Z',
        action: 'Passed on third reading'
      },
      lastUpdated: '2023-04-15T15:00:00Z'
    },
    {
      id: '2',
      billId: 'TX-SB789',
      billNumber: 'SB 789',
      billTitle: 'An Act relating to cybersecurity for state agencies',
      chamberName: 'senate',
      voteDate: '2023-04-12T10:15:00Z',
      voteType: 'passage',
      voteData: {
        yes: 19,
        no: 12,
        present: 0,
        absent: 0,
        chamber: 'senate',
        billId: 'TX-SB789',
        date: '2023-04-12T10:15:00Z',
        action: 'Passed on third reading'
      },
      lastUpdated: '2023-04-12T11:00:00Z'
    },
    {
      id: '3',
      billId: 'TX-HB789',
      billNumber: 'HB 789',
      billTitle: 'An Act relating to public school funding',
      chamberName: 'house',
      voteDate: '2023-04-10T09:30:00Z',
      voteType: 'committee',
      voteData: {
        yes: 7,
        no: 6,
        present: 1,
        absent: 1,
        chamber: 'house',
        billId: 'TX-HB789',
        date: '2023-04-10T09:30:00Z',
        action: 'Reported favorably out of committee',
        committeeInfo: 'Education Committee'
      },
      lastUpdated: '2023-04-10T10:00:00Z'
    }
  ];
  
  // Use sample data if API data is not available
  const displayData = voteData?.length ? filteredVoteData : mockVoteData;
  
  // Export all vote data as CSV
  const handleExportCSV = () => {
    if (!displayData?.length) return;
    
    // Create CSV content
    const headers = [
      'Bill ID', 'Bill Number', 'Bill Title', 'Chamber', 
      'Vote Date', 'Yes Votes', 'No Votes', 'Present', 'Absent'
    ];
    
    const rows = displayData.map(vote => [
      vote.billId,
      vote.billNumber,
      vote.billTitle,
      vote.chamberName,
      new Date(vote.voteDate).toLocaleDateString(),
      vote.voteData.yes,
      vote.voteData.no,
      vote.voteData.present,
      vote.voteData.absent
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vote-data-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Custom data time period selection
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' },
    { value: 'year', label: 'Past Year' }
  ];
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-primary mb-2">Vote Visualization Dashboard</h1>
        <p className="text-muted-foreground max-w-3xl">
          Explore and analyze legislative voting patterns in the Texas Legislature. 
          View vote breakdowns by chamber, bill, and time period.
        </p>
      </motion.div>
      
      {/* Filters and controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="relative col-span-12 md:col-span-5">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bills by ID or title..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="col-span-6 md:col-span-2">
          <Select value={chamber} onValueChange={setChamber}>
            <SelectTrigger>
              <SelectValue placeholder="Chamber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chambers</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="senate">Senate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-6 md:col-span-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-12 md:col-span-2 flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            className="flex-1"
            onClick={() => setView('grid')}
            data-active={view === 'grid'}
          >
            <div className="grid grid-cols-2 gap-1 p-1">
              <div className="bg-primary/20 rounded-sm h-3 w-3"></div>
              <div className="bg-primary/20 rounded-sm h-3 w-3"></div>
              <div className="bg-primary/20 rounded-sm h-3 w-3"></div>
              <div className="bg-primary/20 rounded-sm h-3 w-3"></div>
            </div>
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="flex-1"
            onClick={() => setView('table')}
            data-active={view === 'table'}
          >
            <div className="flex flex-col gap-1 p-1">
              <div className="bg-primary/20 rounded-sm h-2 w-full"></div>
              <div className="bg-primary/20 rounded-sm h-2 w-full"></div>
              <div className="bg-primary/20 rounded-sm h-2 w-full"></div>
            </div>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleExportCSV}
            title="Export as CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tabs for different vote views */}
      <Tabs 
        value={currentTab} 
        onValueChange={setCurrentTab} 
        className="mb-6"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="recent">Most Recent</TabsTrigger>
          <TabsTrigger value="closeVotes">Closest Votes</TabsTrigger>
          <TabsTrigger value="highParticipation">High Participation</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Loading state */}
      {isLoading && (
        <div className="py-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading vote data...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <Card className="bg-red-50 border-red-200 mb-6">
          <CardContent className="pt-6">
            <p className="text-red-600">
              Error loading vote data. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* No results */}
      {!isLoading && !error && displayData.length === 0 && (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No Vote Data Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No votes match your current filters. Try adjusting your search criteria or selecting a different chamber or time period.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayData.map((vote, i) => (
            <VoteVisualization
              key={vote.id}
              voteData={{
                ...vote.voteData,
                chamber: vote.chamberName,
                date: vote.voteDate,
              }}
              title={`${vote.billNumber}: Vote Results`}
              description={vote.billTitle}
              showDownload={true}
              linkToBill={true}
            />
          ))}
        </div>
      )}
      
      {/* Table view */}
      {view === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">Bill</th>
                  <th className="py-3 px-4 text-left font-medium">Date</th>
                  <th className="py-3 px-4 text-left font-medium">Chamber</th>
                  <th className="py-3 px-4 text-center font-medium">Yes</th>
                  <th className="py-3 px-4 text-center font-medium">No</th>
                  <th className="py-3 px-4 text-center font-medium">Present</th>
                  <th className="py-3 px-4 text-center font-medium">Absent</th>
                  <th className="py-3 px-4 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((vote) => {
                  const voteDate = new Date(vote.voteDate);
                  return (
                    <tr key={vote.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium hover:text-primary">
                          <a href={`/legislation/${vote.billId}`}>{vote.billNumber}</a>
                        </div>
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
                          {vote.billTitle}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" />
                          <span>{voteDate.toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{
                          backgroundColor: vote.chamberName === 'house' ? '#3B82F620' : '#8B5CF620',
                          color: vote.chamberName === 'house' ? '#3B82F6' : '#8B5CF6',
                        }}>
                          {vote.chamberName === 'house' ? 'House' : 'Senate'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-green-600">{vote.voteData.yes}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-red-600">{vote.voteData.no}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-yellow-600">{vote.voteData.present}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-gray-500">{vote.voteData.absent}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/legislation/${vote.billId}`}>View Details</a>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      {/* Additional insights and statistics */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vote Distribution</CardTitle>
            <CardDescription>Average distribution of votes across all bills</CardDescription>
          </CardHeader>
          <CardContent>
            {displayData.length > 0 && (
              <VoteVisualization
                voteData={{
                  yes: displayData.reduce((sum, vote) => sum + vote.voteData.yes, 0) / displayData.length,
                  no: displayData.reduce((sum, vote) => sum + vote.voteData.no, 0) / displayData.length,
                  present: displayData.reduce((sum, vote) => sum + vote.voteData.present, 0) / displayData.length,
                  absent: displayData.reduce((sum, vote) => sum + vote.voteData.absent, 0) / displayData.length
                }}
                title="Average Vote Distribution"
                visualizationType="pie"
              />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Chamber Comparison</CardTitle>
            <CardDescription>Comparing voting patterns between chambers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">House Pass Rate</span>
                {displayData.length > 0 && (
                  <span className="font-bold">
                    {Math.round((displayData
                      .filter(v => v.chamberName === 'house')
                      .filter(v => v.voteData.yes > v.voteData.no).length / 
                      Math.max(1, displayData.filter(v => v.chamberName === 'house').length)) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Senate Pass Rate</span>
                {displayData.length > 0 && (
                  <span className="font-bold">
                    {Math.round((displayData
                      .filter(v => v.chamberName === 'senate')
                      .filter(v => v.voteData.yes > v.voteData.no).length / 
                      Math.max(1, displayData.filter(v => v.chamberName === 'senate').length)) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Pass Rate</span>
                {displayData.length > 0 && (
                  <span className="font-bold">
                    {Math.round((displayData
                      .filter(v => v.voteData.yes > v.voteData.no).length / 
                      Math.max(1, displayData.length)) * 100)}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest vote activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayData.slice(0, 3).map((vote, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                  <div 
                    className="mt-0.5 w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: vote.voteData.yes > vote.voteData.no 
                        ? '#22C55E' : '#EF4444'
                    }}
                  ></div>
                  <div>
                    <a 
                      href={`/legislation/${vote.billId}`} 
                      className="font-medium hover:text-primary"
                    >
                      {vote.billNumber}
                    </a>
                    <div className="text-xs text-muted-foreground">
                      {new Date(vote.voteDate).toLocaleDateString()} • {
                        vote.voteData.yes > vote.voteData.no 
                          ? 'Passed' 
                          : vote.voteData.yes < vote.voteData.no 
                            ? 'Failed' 
                            : 'Tied'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}