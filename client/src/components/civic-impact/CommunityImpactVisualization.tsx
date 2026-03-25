import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ComparisonData {
  name: string;
  user: number;
  average: number;
  district: number;
}

interface CommunityImpactVisualizationProps {
  data: ComparisonData[];
  height?: number;
}

/**
 * A bar chart component that compares user impact metrics with community averages
 */
export default function CommunityImpactVisualization({
  data,
  height = 300,
}: CommunityImpactVisualizationProps) {
  // Custom tooltip that provides detailed comparison info
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-3 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm flex items-center">
              <span className="w-3 h-3 inline-block mr-2 bg-primary rounded-full"></span>
              Your Score: {payload[0].value}
            </p>
            <p className="text-sm flex items-center">
              <span className="w-3 h-3 inline-block mr-2 bg-gray-400 rounded-full"></span>
              Community Average: {payload[1].value}
            </p>
            <p className="text-sm flex items-center">
              <span className="w-3 h-3 inline-block mr-2 bg-blue-400 rounded-full"></span>
              District Average: {payload[2].value}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => {
              const labels = {
                user: "Your Score",
                average: "Community Average",
                district: "District Average"
              };
              return <span className="text-sm">{labels[value as keyof typeof labels]}</span>;
            }} 
          />
          <Bar 
            dataKey="user" 
            name="user" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="average" 
            name="average" 
            fill="hsl(var(--muted))" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="district" 
            name="district" 
            fill="hsl(217, 91%, 60%)" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}