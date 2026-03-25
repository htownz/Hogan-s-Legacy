import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
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
const BAR_COLORS = ['#FF6400', '#5DB39E', '#1D2D44', '#596475'];
const STATUS_COLORS = {
  sustained: '#4ADE80',
  overruled: '#F87171',
  pending: '#60A5FA'
};

interface MonthlyTrend {
  month: string;
  count: number;
  status: string;
  avg_severity: number;
  displayMonth?: string;
}

interface TypeSuccessRate {
  type: string;
  total: number;
  sustained: number;
  success_rate: number;
  name?: string;
  color?: string;
}

interface PointsOfOrderTrendsProps {
  // Optional title override
  title?: string;
}

export default function PointsOfOrderTrends({ title }: PointsOfOrderTrendsProps) {
  // Define the response type
  interface TrendsResponse {
    monthlyTrends: MonthlyTrend[];
    typeSuccessRate: TypeSuccessRate[];
  }
  
  // Fetch trend data
  const { data, isLoading, error } = useQuery<TrendsResponse>({
    queryKey: ['/api/points-of-order/trends'],
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title || 'Points of Order Trends'}</CardTitle>
          <CardDescription>
            Historical patterns and trends in points of order
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
          <CardTitle className="text-lg">{title || 'Points of Order Trends'}</CardTitle>
          <CardDescription>
            Historical patterns and trends in points of order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Failed to load trends data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format monthly trend data for visualization
  const formattedTrends: MonthlyTrend[] = data?.monthlyTrends ? data.monthlyTrends.map((trend: MonthlyTrend) => {
    const date = new Date(trend.month);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return {
      ...trend,
      displayMonth: `${month} ${year}`
    };
  }) : [];

  // Group by month for stacked chart
  const monthGroups: Record<string, any> = {};
  formattedTrends.forEach((trend: MonthlyTrend) => {
    const displayMonth = trend.displayMonth || '';
    if (!monthGroups[displayMonth]) {
      monthGroups[displayMonth] = {
        month: displayMonth,
        totalCount: 0,
        avgSeverity: 0,
        severityCount: 0,
      };
    }
    
    monthGroups[displayMonth][trend.status] = parseInt(trend.count as any);
    monthGroups[displayMonth].totalCount += parseInt(trend.count as any);
    
    // Keep track of severity totals and count for averaging
    if (trend.avg_severity) {
      monthGroups[displayMonth].avgSeverity += 
        trend.avg_severity * parseInt(trend.count as any);
      monthGroups[displayMonth].severityCount += parseInt(trend.count as any);
    }
  });
  
  // Calculate final average severity
  Object.keys(monthGroups).forEach(month => {
    if (monthGroups[month].severityCount > 0) {
      monthGroups[month].avgSeverity = 
        monthGroups[month].avgSeverity / monthGroups[month].severityCount;
    }
  });

  const monthlyData = Object.values(monthGroups);

  // Format success rate data
  const successRateData: TypeSuccessRate[] = data?.typeSuccessRate ? data.typeSuccessRate
    .sort((a: TypeSuccessRate, b: TypeSuccessRate) => b.success_rate - a.success_rate)
    .slice(0, 10)
    .map((item: TypeSuccessRate, index: number) => ({
      ...item,
      name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      color: BAR_COLORS[index % BAR_COLORS.length]
    })) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title || 'Points of Order Trends'}</CardTitle>
        <CardDescription>
          Historical patterns and trends in points of order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
            <TabsTrigger value="success">Success Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="pt-4">
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 50,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tickMargin={25}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    domain={[0, 3]}
                    tickCount={4}
                    tickFormatter={(value) => {
                      if (value === 0) return "None";
                      if (value === 1) return "Low";
                      if (value === 2) return "Medium";
                      if (value === 3) return "High";
                      return value;
                    }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'avgSeverity') {
                        // Format severity value
                        const severity = parseFloat(value);
                        if (severity < 1) return ["Low", "Avg Severity"];
                        if (severity < 2) return ["Low-Medium", "Avg Severity"];
                        if (severity < 3) return ["Medium-High", "Avg Severity"];
                        return ["High", "Avg Severity"];
                      }
                      return [value, name === 'totalCount' ? 'Total' : name];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sustained"
                    name="Sustained"
                    stroke={STATUS_COLORS.sustained}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="overruled"
                    name="Overruled"
                    stroke={STATUS_COLORS.overruled}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="pending"
                    name="Pending"
                    stroke={STATUS_COLORS.pending}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgSeverity"
                    name="Avg Severity"
                    stroke="#A16207"
                    strokeDasharray="5 5"
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>This chart shows the monthly trends of points of order by status, along with the average severity over time.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="success" className="pt-4">
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={successRateData}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'success_rate') {
                        return [`${value.toFixed(1)}%`, 'Success Rate'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(value) => `Type: ${value}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="success_rate" 
                    name="Success Rate" 
                    fill={COLORS.ACCENT}
                  >
                    {successRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Success Rate by Point of Order Type</h4>
              <p className="text-sm text-muted-foreground">
                This chart shows the percentage of points of order that were sustained for each type.
                Higher percentages indicate types that are more likely to be successful.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}