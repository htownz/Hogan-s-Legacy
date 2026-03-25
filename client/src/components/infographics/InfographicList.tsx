// @ts-nocheck
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import InfographicViewer from './InfographicViewer';
import InfographicCreator from './InfographicCreator';

interface Infographic {
  id: number;
  title: string;
  description: string;
  svgContent: string;
  templateType: string;
  themeColor: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  shareCount: number;
  isPublic: boolean;
  billId?: string;
  creatorName?: string;
}

export const InfographicList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my');
  const [showCreator, setShowCreator] = useState(false);
  
  const { data: myInfographics = [], isLoading: myInfographicsLoading } = useQuery<Infographic[]>({
    queryKey: ['/api/infographics'],
    enabled: activeTab === 'my',
  });
  
  const { data: popularInfographics = [], isLoading: popularInfographicsLoading } = useQuery<Infographic[]>({
    queryKey: ['/api/infographics/popular'],
    enabled: activeTab === 'popular',
  });
  
  const { data: allInfographics = [], isLoading: allInfographicsLoading } = useQuery<Infographic[]>({
    queryKey: ['/api/infographics/all'],
    enabled: activeTab === 'all',
  });
  
  const { data: searchResults = [], isLoading: searchResultsLoading } = useQuery<Infographic[]>({
    queryKey: ['/api/infographics/search', searchQuery],
    enabled: !!searchQuery && searchQuery.length > 2,
  });
  
  const handleShare = (id: number) => {
    // Implement sharing functionality
    console.log(`Share infographic ${id}`);
  };
  
  const handleDownload = (id: number) => {
    // Implement download tracking
    console.log(`Download infographic ${id}`);
  };
  
  const filterInfographics = (infographics: Infographic[] = []) => {
    if (!searchQuery || searchQuery.length < 3) return infographics;
    
    return infographics.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };
  
  const getCurrentInfographics = () => {
    if (searchQuery && searchQuery.length > 2) {
      return searchResults || [];
    }
    
    switch (activeTab) {
      case 'my':
        return myInfographics || [];
      case 'popular':
        return popularInfographics || [];
      case 'all':
        return allInfographics || [];
      default:
        return [];
    }
  };
  
  const isLoading =
    (activeTab === 'my' && myInfographicsLoading) ||
    (activeTab === 'popular' && popularInfographicsLoading) ||
    (activeTab === 'all' && allInfographicsLoading) ||
    (searchQuery && searchQuery.length > 2 && searchResultsLoading);
  
  const filteredInfographics = filterInfographics(getCurrentInfographics());
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Infographics</h2>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Infographic
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search infographics..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="h-10">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>
      
      <Tabs defaultValue="my" value={activeTab} onValueChange={(value) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="my">My Infographics</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my" className="pt-4">
          {renderInfographicGrid(filteredInfographics, isLoading, handleShare, handleDownload)}
        </TabsContent>
        
        <TabsContent value="popular" className="pt-4">
          {renderInfographicGrid(filteredInfographics, isLoading, handleShare, handleDownload)}
        </TabsContent>
        
        <TabsContent value="all" className="pt-4">
          {renderInfographicGrid(filteredInfographics, isLoading, handleShare, handleDownload)}
        </TabsContent>
      </Tabs>
      
      <Dialog open={showCreator} onOpenChange={setShowCreator}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Infographic</DialogTitle>
            <DialogDescription>
              Create a shareable infographic to promote civic engagement
            </DialogDescription>
          </DialogHeader>
          <InfographicCreator onSuccess={() => setShowCreator(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

function renderInfographicGrid(
  infographics: Infographic[],
  isLoading: boolean,
  handleShare: (id: number) => void,
  handleDownload: (id: number) => void
) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!infographics || infographics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg text-muted-foreground mb-4">No infographics found</p>
        <Button variant="outline">Create your first infographic</Button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {infographics.map((infographic) => (
        <InfographicViewer
          key={infographic.id}
          id={infographic.id}
          title={infographic.title}
          description={infographic.description}
          svgContent={infographic.svgContent}
          createdAt={infographic.createdAt}
          viewCount={infographic.viewCount}
          shareCount={infographic.shareCount}
          creatorName={infographic.creatorName}
          onShare={() => handleShare(infographic.id)}
          onDownload={() => handleDownload(infographic.id)}
        />
      ))}
    </div>
  );
}

export default InfographicList;