import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TimeSeriesData {
  date: string;
  score: number;
  actions: number;
  comments: number;
  shares: number;
}

interface PersonalEngagementChartProps {
  data: TimeSeriesData[];
  height?: number;
}

/**
 * A responsive area chart that visualizes civic engagement over time
 */
export default function PersonalEngagementChart({
  data,
  height = 300,
}: PersonalEngagementChartProps) {
  // Format the date to show month only in a more readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  };

  // Custom tooltip that displays all metrics for a specific date
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-3 rounded-md shadow-md">
          <p className="font-medium">{new Date(label).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm flex items-center">
              <span className="w-3 h-3 inline-block mr-2 bg-primary rounded-full"></span>
              Engagement Score: {payload[0].value}
            </p>
            <p className="text-sm flex items-center">
              <span className="w-3 h-3 inline-block mr-2 bg-yellow-500 rounded-full"></span>
              Actions: {payload[1].value}
            </p>
            <p className="text-sm flex items-center">
              <span className="w-3 h-3 inline-block mr-2 bg-green-500 rounded-full"></span>
              Comments: {payload[2].value}
            </p>
            <p className="text-sm flex items-center">
              <span className="w-3 h-3 inline-block mr-2 bg-indigo-500 rounded-full"></span>
              Shares: {payload[3].value}
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
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="actionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="sharesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            width={30}
          />
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="score"
            name="Engagement Score"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#scoreGradient)"
          />
          <Area
            type="monotone"
            dataKey="actions"
            name="Actions"
            stroke="#fbbf24"
            fillOpacity={1}
            fill="url(#actionsGradient)"
          />
          <Area
            type="monotone"
            dataKey="comments"
            name="Comments"
            stroke="#22c55e"
            fillOpacity={1}
            fill="url(#commentsGradient)"
          />
          <Area
            type="monotone"
            dataKey="shares"
            name="Shares"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#sharesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}