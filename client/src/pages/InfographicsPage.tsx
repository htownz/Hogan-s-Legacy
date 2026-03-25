import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import InfographicList from '@/components/infographics/InfographicList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const InfographicsPage: React.FC = () => {
  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Infographics</h1>
        <p className="text-lg text-muted-foreground">
          Create and share visual representations of civic data to increase engagement
        </p>
      </div>
      
      <Tabs defaultValue="infographics" className="mb-8">
        <TabsList>
          <TabsTrigger value="infographics">Infographics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="infographics" className="pt-6">
          <InfographicList />
        </TabsContent>
        
        <TabsContent value="templates" className="pt-6">
          <TemplatesTab />
        </TabsContent>
        
        <TabsContent value="analytics" className="pt-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface Template {
  id: number;
  name: string;
  description: string;
  type: string;
  previewUrl?: string;
}

interface AnalyticsData {
  totalViews: number;
  viewsChange: number;
  totalShares: number;
  sharesChange: number;
  totalInfographics: number;
  infographicsChange: number;
}

const TemplatesTab: React.FC = () => {
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['/api/infographics/templates'],
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template: Template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.type} template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-md border border-gray-200 aspect-video">
                {template.previewUrl ? (
                  <img src={template.previewUrl} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                    No preview
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AnalyticsTab: React.FC = () => {
  const { data: analytics = { 
    totalViews: 0, 
    viewsChange: 0, 
    totalShares: 0, 
    sharesChange: 0, 
    totalInfographics: 0, 
    infographicsChange: 0 
  } } = useQuery<AnalyticsData>({
    queryKey: ['/api/infographics/analytics'],
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Views</CardTitle>
            <CardDescription>All infographics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{analytics.totalViews}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.viewsChange > 0 ? '+' : ''}{analytics.viewsChange}% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Shares</CardTitle>
            <CardDescription>Across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{analytics.totalShares}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.sharesChange > 0 ? '+' : ''}{analytics.sharesChange}% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Infographics</CardTitle>
            <CardDescription>Created by all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{analytics.totalInfographics}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.infographicsChange > 0 ? '+' : ''}{analytics.infographicsChange}% from last week
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InfographicsPage;