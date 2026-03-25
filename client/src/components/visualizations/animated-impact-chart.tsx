import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface ImpactDataPoint {
  category: string;
  value: number;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface AnimatedImpactChartProps {
  data: ImpactDataPoint[];
  title?: string;
  subtitle?: string;
  animate?: boolean;
  height?: number;
  onCategoryClick?: (category: string) => void;
}

export const AnimatedImpactChart: React.FC<AnimatedImpactChartProps> = ({
  data,
  title = 'Personal Impact Analysis',
  subtitle = 'How this legislation affects you personally',
  animate = true,
  height = 350,
  onCategoryClick
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (animate) {
      setIsAnimating(true);
    }
  }, [animate, data]);

  // Sort data to separate positive and negative values
  const sortedData = [...data].sort((a, b) => {
    if (a.value >= 0 && b.value < 0) return -1;
    if (a.value < 0 && b.value >= 0) return 1;
    return Math.abs(b.value) - Math.abs(a.value);
  });

  // Find maximum absolute value for proper scaling
  const maxAbsValue = Math.max(...data.map(d => Math.abs(d.value)));
  
  // Set bar dimensions
  const barHeight = 35;
  const chartPadding = 20;
  const chartContentHeight = sortedData.length * (barHeight + 10) + chartPadding * 2;
  const actualHeight = Math.max(chartContentHeight, height);
  
  // Get color based on sentiment
  const getBarColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { bg: '#34D399', text: '#065F46' };
      case 'negative':
        return { bg: '#F87171', text: '#991B1B' };
      case 'neutral':
        return { bg: '#60A5FA', text: '#1E40AF' };
      default:
        return { bg: '#9CA3AF', text: '#1F2937' };
    }
  };

  // Calculate bar width based on value
  const calculateBarWidth = (value: number) => {
    return `${(Math.abs(value) / maxAbsValue) * 80}%`;
  };
  
  // Handle category selection
  const handleCategorySelect = (category: string, description: string) => {
    setSelectedCategory(category);
    setSelectedDescription(description);
    
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-gray-500 mb-6 text-sm">{subtitle}</p>
      
      <div style={{ height: `${actualHeight}px` }}>
        {sortedData.map((item, index) => (
          <motion.div 
            key={item.category}
            className="mb-4 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleCategorySelect(item.category, item.description)}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center mb-1">
              <div className="w-1/3 pr-4 text-sm font-medium text-right">
                {item.category}
              </div>
              
              <div className="w-2/3 flex items-center">
                {/* Bar direction depends on positive/negative value */}
                {item.value >= 0 ? (
                  <div className="flex items-center w-full">
                    {/* Zero point indicator */}
                    <div className="h-full w-0.5 bg-gray-300"></div>
                    
                    {/* Positive bar */}
                    <motion.div 
                      className="h-8 rounded-r-md flex items-center px-3"
                      style={{ 
                        backgroundColor: getBarColor(item.sentiment).bg,
                        color: getBarColor(item.sentiment).text,
                        width: calculateBarWidth(item.value)
                      }}
                      initial={animate ? { width: "0%" } : { width: calculateBarWidth(item.value) }}
                      animate={{ width: calculateBarWidth(item.value) }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    >
                      <span className="font-bold">+{item.value}</span>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end w-full flex-row-reverse">
                    {/* Zero point indicator */}
                    <div className="h-full w-0.5 bg-gray-300"></div>
                    
                    {/* Negative bar */}
                    <motion.div 
                      className="h-8 rounded-l-md flex items-center justify-end px-3"
                      style={{ 
                        backgroundColor: getBarColor(item.sentiment).bg,
                        color: getBarColor(item.sentiment).text,
                        width: calculateBarWidth(item.value)
                      }}
                      initial={animate ? { width: "0%" } : { width: calculateBarWidth(item.value) }}
                      animate={{ width: calculateBarWidth(item.value) }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    >
                      <span className="font-bold">{item.value}</span>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description appears when category is selected */}
            {selectedCategory === item.category && (
              <motion.div 
                className="pl-1/3 ml-[33%] pr-4 text-gray-600 text-sm mt-1 mb-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  {item.description}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#34D399] mr-1"></div>
          <span>Positive Impact</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#F87171] mr-1"></div>
          <span>Negative Impact</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[#60A5FA] mr-1"></div>
          <span>Neutral Impact</span>
        </div>
      </div>
    </div>
  );
};

export default AnimatedImpactChart;