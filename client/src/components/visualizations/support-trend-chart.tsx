import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SupportTrendDataPoint {
  date: string;
  supportPercentage: number;
  oppositionPercentage: number;
  neutralPercentage: number;
  totalCount?: number;
  event?: string;
}

interface SupportTrendChartProps {
  data: SupportTrendDataPoint[];
  title?: string;
  subtitle?: string;
  animate?: boolean;
  showLegend?: boolean;
  height?: number;
  onSelectPoint?: (point: SupportTrendDataPoint | null) => void;
}

export const SupportTrendChart: React.FC<SupportTrendChartProps> = ({
  data,
  title = 'Support Trend Analysis',
  subtitle = 'How public opinion has changed over time',
  animate = true,
  showLegend = true,
  height = 250,
  onSelectPoint
}) => {
  const [selectedPoint, setSelectedPoint] = useState<SupportTrendDataPoint | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (animate) {
      setIsAnimating(true);
    }
  }, [animate, data]);

  // Handle point selection
  const handlePointSelect = (point: SupportTrendDataPoint | null) => {
    setSelectedPoint(point);
    if (onSelectPoint) {
      onSelectPoint(point);
    }
  };

  // Calculate chart dimensions
  const chartWidth = 100; // percentage units
  const chartMargins = { top: 20, right: 20, bottom: 30, left: 30 };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Find min and max values for scaling
  const allValues = data.flatMap(d => [
    d.supportPercentage,
    d.oppositionPercentage,
    d.neutralPercentage
  ]);
  const maxValue = Math.max(...allValues, 100);
  
  // Scale values to chart height
  const scaleValue = (value: number) => {
    return (value / maxValue) * (height - chartMargins.top - chartMargins.bottom);
  };
  
  // Generate SVG paths for each trend line
  const generatePath = (accessor: (d: SupportTrendDataPoint) => number) => {
    const pointWidth = chartWidth / Math.max(data.length - 1, 1);
    
    return data.map((point, i) => {
      const x = i * pointWidth;
      const y = height - chartMargins.bottom - scaleValue(accessor(point));
      return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    }).join(' ');
  };
  
  const supportPath = generatePath(d => d.supportPercentage);
  const oppositionPath = generatePath(d => d.oppositionPercentage);
  const neutralPath = generatePath(d => d.neutralPercentage);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-gray-500 mb-4 text-sm">{subtitle}</p>
      
      {/* Trend Chart */}
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <svg width="100%" height={height}>
          {/* Y-axis grid lines */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={`grid-${tick}`}>
              <line
                x1={chartMargins.left}
                y1={height - chartMargins.bottom - scaleValue(tick)}
                x2="100%"
                y2={height - chartMargins.bottom - scaleValue(tick)}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={chartMargins.left - 5}
                y={height - chartMargins.bottom - scaleValue(tick)}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-xs text-gray-500"
              >
                {tick}%
              </text>
            </g>
          ))}
          
          {/* X-axis labels */}
          {data.map((point, i) => {
            const pointWidth = chartWidth / Math.max(data.length - 1, 1);
            const x = i * pointWidth;
            
            return (
              <text
                key={`label-${i}`}
                x={`${x}%`}
                y={height - chartMargins.bottom + 15}
                textAnchor="middle"
                className="text-xs text-gray-500"
              >
                {formatDate(point.date)}
              </text>
            );
          })}
          
          {/* Support trend line */}
          <motion.path
            d={supportPath}
            fill="none"
            stroke="#34D399"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Opposition trend line */}
          <motion.path
            d={oppositionPath}
            fill="none"
            stroke="#F87171"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
          />
          
          {/* Neutral trend line */}
          <motion.path
            d={neutralPath}
            fill="none"
            stroke="#60A5FA"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.6 }}
          />
          
          {/* Interactive data points */}
          {data.map((point, i) => {
            const pointWidth = chartWidth / Math.max(data.length - 1, 1);
            const x = i * pointWidth;
            
            return (
              <g key={`points-${i}`}>
                {/* Support point */}
                <motion.circle
                  cx={`${x}%`}
                  cy={height - chartMargins.bottom - scaleValue(point.supportPercentage)}
                  r={selectedPoint === point ? 5 : 4}
                  fill="#34D399"
                  stroke="#fff"
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.3 }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => handlePointSelect(point)}
                  onMouseLeave={() => handlePointSelect(null)}
                />
                
                {/* Opposition point */}
                <motion.circle
                  cx={`${x}%`}
                  cy={height - chartMargins.bottom - scaleValue(point.oppositionPercentage)}
                  r={selectedPoint === point ? 5 : 4}
                  fill="#F87171"
                  stroke="#fff"
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2 + i * 0.1, duration: 0.3 }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => handlePointSelect(point)}
                  onMouseLeave={() => handlePointSelect(null)}
                />
                
                {/* Neutral point */}
                <motion.circle
                  cx={`${x}%`}
                  cy={height - chartMargins.bottom - scaleValue(point.neutralPercentage)}
                  r={selectedPoint === point ? 5 : 4}
                  fill="#60A5FA"
                  stroke="#fff"
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.4 + i * 0.1, duration: 0.3 }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => handlePointSelect(point)}
                  onMouseLeave={() => handlePointSelect(null)}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Tooltip */}
        <AnimatePresence>
          {selectedPoint && (
            <motion.div
              className="absolute px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10"
              style={{
                left: `${(data.indexOf(selectedPoint) / (data.length - 1)) * 100}%`,
                top: 20,
                transform: 'translateX(-50%)'
              }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-bold mb-1">{formatDate(selectedPoint.date)}</div>
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-[#34D399] mr-2"></div>
                <span>Support: {selectedPoint.supportPercentage}%</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 rounded-full bg-[#F87171] mr-2"></div>
                <span>Opposition: {selectedPoint.oppositionPercentage}%</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[#60A5FA] mr-2"></div>
                <span>Neutral: {selectedPoint.neutralPercentage}%</span>
              </div>
              {selectedPoint.totalCount && (
                <div className="mt-1 pt-1 border-t border-gray-600">
                  Total votes: {selectedPoint.totalCount.toLocaleString()}
                </div>
              )}
              {selectedPoint.event && (
                <div className="mt-1 pt-1 border-t border-gray-600 italic">
                  {selectedPoint.event}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex gap-6 mt-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#34D399] mr-1"></div>
            <span>Support</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#F87171] mr-1"></div>
            <span>Opposition</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#60A5FA] mr-1"></div>
            <span>Neutral</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTrendChart;