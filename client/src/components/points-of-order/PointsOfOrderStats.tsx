import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2 } from 'lucide-react';
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

// Act Up Color Palette
const COLORS = {
  PRIMARY: '#1D2D44', // Dark blue
  ACCENT: '#FF6400',  // Orange
  BACKGROUND: '#FAFAFA', // Off-white
  SUPPORT: '#596475', // Slate gray
  OPTIONAL: '#5DB39E'  // Teal
};

// Chart colors
const PIE_COLORS = ['#FF6400', '#5DB39E', '#1D2D44', '#596475'];
const STATUS_COLORS = {
  sustained: '#4ADE80',
  overruled: '#F87171',
  pending: '#60A5FA'
};

const SEVERITY_COLORS = {
  high: '#F87171',
  medium: '#FBBF24',
  low: '#4ADE80'
};

interface PointOfOrderStat {
  name: string;
  value: number;
  color?: string;
}

interface PointsOfOrderStatsProps {
  // If you want to restrict to a specific bill
  billId?: string;
}

export default function PointsOfOrderStats({ billId }: PointsOfOrderStatsProps) {
  interface StatisticsData {
    total: number;
    byStatus: {
      sustained: number;
      overruled: number;
      pending: number;
    };
    bySeverity: {
      high: number;
      medium: number;
      low: number;
    };
    byType: Record<string, number>;
    byRuleReference: Record<string, number>;
  }

  // Fetch statistics data
  const { data = {} as StatisticsData, isLoading, error } = useQuery<StatisticsData>({
    queryKey: ['/api/points-of-order/statistics', billId],
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Points of Order Statistics</CardTitle>
          <CardDescription>
            {billId ? 'Statistics for this bill' : 'Overall statistics for all points of order'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Points of Order Statistics</CardTitle>
          <CardDescription>
            {billId ? 'Statistics for this bill' : 'Overall statistics for all points of order'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Failed to load statistics</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for visualization
  const statusData: PointOfOrderStat[] = [
    { name: 'Sustained', value: data?.byStatus?.sustained || 0, color: STATUS_COLORS.sustained },
    { name: 'Overruled', value: data?.byStatus?.overruled || 0, color: STATUS_COLORS.overruled },
    { name: 'Pending', value: data?.byStatus?.pending || 0, color: STATUS_COLORS.pending }
  ];

  const severityData: PointOfOrderStat[] = [
    { name: 'High', value: data?.bySeverity?.high || 0, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: data?.bySeverity?.medium || 0, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: data?.bySeverity?.low || 0, color: SEVERITY_COLORS.low }
  ];

  const typeData: PointOfOrderStat[] = Object.entries(data?.byType || {})
    .map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count as number,
      color: PIE_COLORS[index % PIE_COLORS.length]
    }))
    .sort((a, b) => b.value - a.value);

  // Create bar chart for top rule citations
  const ruleData = Object.entries(data?.byRuleReference || {})
    .map(([rule, count]) => ({
      name: rule,
      value: count as number
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Points of Order Statistics</CardTitle>
        <CardDescription>
          {billId ? 'Statistics for this bill' : 'Analysis of all points of order in the system'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="severity">Severity</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="rules">Rules Cited</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} points`, 'Count']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              {statusData.map((status) => (
                <div key={status.name} className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{status.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {status.name} Points of Order
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="severity" className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} points`, 'Count']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              {severityData.map((severity) => (
                <div key={severity.name} className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{severity.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {severity.name} Severity
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="type" className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} points`, 'Count']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Type Distribution</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {typeData.slice(0, 6).map((type) => (
                  <div key={type.name} className="flex items-center justify-between">
                    <span className="text-sm">{type.name}</span>
                    <span className="font-medium">{type.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ruleData}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 50,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Number of Citations" 
                    fill={COLORS.ACCENT} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>The chart above shows the most commonly cited rules in points of order.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}