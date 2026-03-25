import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DemographicBreakdownProps {
  data: any[];
}

export const DemographicBreakdown: React.FC<DemographicBreakdownProps> = ({ data }) => {
  // Prepare data for age groups chart
  const ageGroupData = [
    { name: '18-24', sentiment: 0, count: 0 },
    { name: '25-34', sentiment: 0, count: 0 },
    { name: '35-44', sentiment: 0, count: 0 },
    { name: '45-54', sentiment: 0, count: 0 },
    { name: '55-64', sentiment: 0, count: 0 },
    { name: '65+', sentiment: 0, count: 0 }
  ];
  
  // Prepare data for region chart
  const regionData = [
    { name: 'Urban', sentiment: 0, count: 0 },
    { name: 'Suburban', sentiment: 0, count: 0 },
    { name: 'Rural', sentiment: 0, count: 0 }
  ];
  
  // Prepare data for education level chart
  const educationData = [
    { name: 'High School', sentiment: 0, count: 0 },
    { name: 'Some College', sentiment: 0, count: 0 },
    { name: 'Bachelor\'s', sentiment: 0, count: 0 },
    { name: 'Graduate', sentiment: 0, count: 0 }
  ];
  
  // Prepare data for political affiliation chart
  const politicalData = [
    { name: 'Liberal', sentiment: 0, value: 0, count: 0 },
    { name: 'Moderate', sentiment: 0, value: 0, count: 0 },
    { name: 'Conservative', sentiment: 0, value: 0, count: 0 },
    { name: 'Independent', sentiment: 0, value: 0, count: 0 }
  ];
  
  // Calculate averages and counts for each demographic group
  data.forEach(item => {
    // Process age group data
    const ageGroup = ageGroupData.find(group => group.name === item.ageGroup);
    if (ageGroup) {
      ageGroup.sentiment += item.sentiment * item.count;
      ageGroup.count += item.count;
    }
    
    // Process region data
    const region = regionData.find(r => r.name === item.region);
    if (region) {
      region.sentiment += item.sentiment * item.count;
      region.count += item.count;
    }
    
    // Process education data
    const education = educationData.find(e => e.name === item.educationLevel);
    if (education) {
      education.sentiment += item.sentiment * item.count;
      education.count += item.count;
    }
    
    // Process political data
    const political = politicalData.find(p => p.name === item.politicalAffiliation);
    if (political) {
      political.sentiment += item.sentiment * item.count;
      political.count += item.count;
      political.value += item.count; // For pie chart
    }
  });
  
  // Calculate average sentiment for each demographic group
  ageGroupData.forEach(group => {
    group.sentiment = group.count > 0 ? group.sentiment / group.count : 0;
  });
  
  regionData.forEach(region => {
    region.sentiment = region.count > 0 ? region.sentiment / region.count : 0;
  });
  
  educationData.forEach(education => {
    education.sentiment = education.count > 0 ? education.sentiment / education.count : 0;
  });
  
  politicalData.forEach(political => {
    political.sentiment = political.count > 0 ? political.sentiment / political.count : 0;
  });
  
  // Colors for pie chart
  const COLORS = ['#1D2D44', '#FF6400', '#5DB39E', '#596475'];
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="age">
        <TabsList className="mb-4">
          <TabsTrigger value="age">Age Groups</TabsTrigger>
          <TabsTrigger value="region">Regions</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="political">Political</TabsTrigger>
        </TabsList>
        
        <TabsContent value="age" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment by Age Group</CardTitle>
              <CardDescription>
                Average sentiment score across different age demographics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ageGroupData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-100, 100]} />
                    <Tooltip formatter={(value: number) => [value.toFixed(1), 'Sentiment']} />
                    <Legend />
                    <Bar 
                      dataKey="sentiment" 
                      name="Sentiment Score"
                      fill="#5DB39E" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                {ageGroupData.map((group, index) => (
                  <div key={index} className="p-2">
                    <p className="text-sm font-medium">{group.name}</p>
                    <p className={`text-xl font-bold ${
                      group.sentiment > 25 ? 'text-green-600' : 
                      group.sentiment > 0 ? 'text-green-500' : 
                      group.sentiment < -25 ? 'text-red-600' : 
                      group.sentiment < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {group.sentiment.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">({group.count} votes)</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="region" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment by Region</CardTitle>
              <CardDescription>
                Geographic sentiment distribution across urban, suburban, and rural areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-100, 100]} />
                    <Tooltip formatter={(value: number) => [value.toFixed(1), 'Sentiment']} />
                    <Legend />
                    <Bar 
                      dataKey="sentiment" 
                      name="Sentiment Score"
                      fill="#FF6400" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                {regionData.map((region, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">{region.name}</p>
                    <p className={`text-xl font-bold ${
                      region.sentiment > 25 ? 'text-green-600' : 
                      region.sentiment > 0 ? 'text-green-500' : 
                      region.sentiment < -25 ? 'text-red-600' : 
                      region.sentiment < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {region.sentiment.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">({region.count} votes)</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment by Education Level</CardTitle>
              <CardDescription>
                How education level correlates with sentiment on this legislation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={educationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-100, 100]} />
                    <Tooltip formatter={(value: number) => [value.toFixed(1), 'Sentiment']} />
                    <Legend />
                    <Bar 
                      dataKey="sentiment" 
                      name="Sentiment Score"
                      fill="#1D2D44" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {educationData.map((education, index) => (
                  <div key={index} className="p-2">
                    <p className="text-sm font-medium">{education.name}</p>
                    <p className={`text-xl font-bold ${
                      education.sentiment > 25 ? 'text-green-600' : 
                      education.sentiment > 0 ? 'text-green-500' : 
                      education.sentiment < -25 ? 'text-red-600' : 
                      education.sentiment < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {education.sentiment.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">({education.count} votes)</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="political" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment by Political Affiliation</CardTitle>
              <CardDescription>
                How political affiliation influences sentiment on this legislation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={politicalData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[-100, 100]} />
                      <Tooltip formatter={(value: number) => [value.toFixed(1), 'Sentiment']} />
                      <Legend />
                      <Bar 
                        dataKey="sentiment" 
                        name="Sentiment Score"
                        fill="#596475" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={politicalData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {politicalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Votes']}
                        labelFormatter={() => 'Distribution'}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {politicalData.map((political, index) => (
                  <div key={index} className="p-2 border rounded-lg" style={{ borderColor: COLORS[index % COLORS.length] }}>
                    <p className="text-sm font-medium">{political.name}</p>
                    <p className={`text-xl font-bold ${
                      political.sentiment > 25 ? 'text-green-600' : 
                      political.sentiment > 0 ? 'text-green-500' : 
                      political.sentiment < -25 ? 'text-red-600' : 
                      political.sentiment < 0 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {political.sentiment.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">({political.count} votes)</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};