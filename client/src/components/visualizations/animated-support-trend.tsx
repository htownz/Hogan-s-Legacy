import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface SupportDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AnimatedSupportTrendProps {
  billTitle: string;
  supportData: SupportDataPoint[];
  oppositionData: SupportDataPoint[];
  className?: string;
}

export default function AnimatedSupportTrend({ 
  billTitle, 
  supportData, 
  oppositionData,
  className = '' 
}: AnimatedSupportTrendProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mount
    setIsVisible(true);
  }, []);

  // Get current trend direction
  const getCurrentTrend = (data: SupportDataPoint[]) => {
    if (data.length < 2) return 'neutral';
    const lastTwo = data.slice(-2);
    return lastTwo[1].value > lastTwo[0].value ? 'up' : 'down';
  };

  const supportTrend = getCurrentTrend(supportData);
  const oppositionTrend = getCurrentTrend(oppositionData);

  // Calculate max value for scaling
  const allValues = [...supportData.map(d => d.value), ...oppositionData.map(d => d.value)];
  const maxValue = Math.max(...allValues, 100); // Ensure at least 100 as max

  // Create SVG path for the trend lines
  const createPath = (data: SupportDataPoint[]): string => {
    if (data.length === 0) return '';
    
    const width = 300;
    const height = 100;
    
    // Calculate step between points
    const step = width / (data.length - 1);
    
    // Start at the first point
    let path = `M ${0} ${height - (data[0].value / maxValue) * height}`;
    
    // Add remaining points
    for (let i = 1; i < data.length; i++) {
      const x = i * step;
      const y = height - (data[i].value / maxValue) * height;
      path += ` L ${x} ${y}`;
    }
    
    return path;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  // Sparkle animation variants
  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: {
        repeat: Infinity,
        duration: 2,
        repeatType: 'loop' as const,
        repeatDelay: Math.random() * 2
      }
    }
  };

  // Create animated sparkles along the paths
  const createSparkles = (data: SupportDataPoint[], color: string, count: number = 3) => {
    if (data.length < 2) return null;
    
    const width = 300;
    const height = 100;
    const step = width / (data.length - 1);
    
    return [...Array(count)].map((_, i) => {
      // Calculate random position along the path
      const randomIndex = Math.floor(Math.random() * (data.length - 1)) + 1;
      const x = randomIndex * step;
      const y = height - (data[randomIndex].value / maxValue) * height;
      
      return (
        <motion.circle
          key={`sparkle-${color}-${i}`}
          cx={x}
          cy={y}
          r={3}
          fill={color}
          variants={sparkleVariants}
          animate="visible"
          initial="hidden"
          custom={i}
        />
      );
    });
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LineChart className="mr-2 h-5 w-5 text-accent" />
            Community Support Trends: {billTitle}
          </motion.div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          {/* Chart area */}
          <motion.div 
            className="relative h-[150px] w-full"
            variants={itemVariants}
          >
            <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
              {/* Y-axis labels */}
              <motion.text
                x="5"
                y="10"
                fontSize="8"
                textAnchor="start"
                fill="#6b7280"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 1 }}
              >
                100%
              </motion.text>
              <motion.text
                x="5"
                y="50"
                fontSize="8"
                textAnchor="start"
                fill="#6b7280"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 1 }}
              >
                50%
              </motion.text>
              <motion.text
                x="5"
                y="95"
                fontSize="8"
                textAnchor="start"
                fill="#6b7280"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 1 }}
              >
                0%
              </motion.text>
              
              {/* Horizontal grid lines */}
              <motion.line
                x1="20"
                y1="10"
                x2="300"
                y2="10"
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              />
              <motion.line
                x1="20"
                y1="50"
                x2="300"
                y2="50"
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              />
              <motion.line
                x1="20"
                y1="90"
                x2="300"
                y2="90"
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              />
              
              {/* Support trend line */}
              <motion.path
                d={createPath(supportData)}
                fill="none"
                stroke="#10b981" // Green for support
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                  delay: 0.5, 
                  duration: 1.5,
                  type: "spring",
                  stiffness: 50
                }}
              />
              
              {/* Opposition trend line */}
              <motion.path
                d={createPath(oppositionData)}
                fill="none"
                stroke="#ef4444" // Red for opposition
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                  delay: 1, 
                  duration: 1.5,
                  type: "spring",
                  stiffness: 50
                }}
              />
              
              {/* Animated sparkles */}
              {createSparkles(supportData, '#10b981')}
              {createSparkles(oppositionData, '#ef4444')}
              
              {/* Data point markers for support */}
              {supportData.map((point, i) => {
                const width = 300;
                const height = 100;
                const step = width / (supportData.length - 1);
                const x = i * step;
                const y = height - (point.value / maxValue) * height;
                
                return (
                  <motion.circle
                    key={`support-${i}`}
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#10b981"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: 1 + i * 0.1, 
                      duration: 0.3,
                      type: "spring"
                    }}
                  />
                );
              })}
              
              {/* Data point markers for opposition */}
              {oppositionData.map((point, i) => {
                const width = 300;
                const height = 100;
                const step = width / (oppositionData.length - 1);
                const x = i * step;
                const y = height - (point.value / maxValue) * height;
                
                return (
                  <motion.circle
                    key={`opposition-${i}`}
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#ef4444"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: 1.5 + i * 0.1, 
                      duration: 0.3,
                      type: "spring"
                    }}
                  />
                );
              })}
              
              {/* Legend */}
              <motion.circle
                cx="25"
                cy="110"
                r={4}
                fill="#10b981"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              />
              <motion.text
                x="35"
                y="113"
                fontSize="10"
                textAnchor="start"
                fill="#6b7280"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                Support
              </motion.text>
              <motion.circle
                cx="85"
                cy="110"
                r={4}
                fill="#ef4444"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              />
              <motion.text
                x="95"
                y="113"
                fontSize="10"
                textAnchor="start"
                fill="#6b7280"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                Opposition
              </motion.text>
            </svg>
          </motion.div>
          
          {/* Trend summaries */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              variants={itemVariants}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                boxShadow: supportTrend === 'up' 
                  ? ['0px 0px 0px rgba(0,0,0,0)', '0px 0px 8px rgba(16,185,129,0.3)', '0px 0px 0px rgba(0,0,0,0)']
                  : 'none',
              }}
              transition={{
                delay: 2.2,
                duration: 0.5,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop'
                }
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Support Trend</p>
                {supportTrend === 'up' ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <p className="mt-2 text-2xl font-bold text-green-500">
                {supportData.length > 0 ? `${supportData[supportData.length - 1].value}%` : '0%'}
              </p>
              {supportData.length >= 2 && (
                <div className="mt-1 flex items-center text-xs">
                  {supportTrend === 'up' ? (
                    <>
                      <ArrowUpCircle className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">
                        {Math.abs(supportData[supportData.length - 1].value - supportData[supportData.length - 2].value)}% from previous
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle className="h-3 w-3 text-gray-500 mr-1" />
                      <span className="text-gray-500 font-medium">
                        {Math.abs(supportData[supportData.length - 1].value - supportData[supportData.length - 2].value)}% from previous
                      </span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
            
            <motion.div 
              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              variants={itemVariants}
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                boxShadow: oppositionTrend === 'up' 
                  ? ['0px 0px 0px rgba(0,0,0,0)', '0px 0px 8px rgba(239,68,68,0.3)', '0px 0px 0px rgba(0,0,0,0)']
                  : 'none',
              }}
              transition={{
                delay: 2.4,
                duration: 0.5,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop'
                }
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Opposition Trend</p>
                {oppositionTrend === 'up' ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <p className="mt-2 text-2xl font-bold text-red-500">
                {oppositionData.length > 0 ? `${oppositionData[oppositionData.length - 1].value}%` : '0%'}
              </p>
              {oppositionData.length >= 2 && (
                <div className="mt-1 flex items-center text-xs">
                  {oppositionTrend === 'up' ? (
                    <>
                      <ArrowUpCircle className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-red-500 font-medium">
                        {Math.abs(oppositionData[oppositionData.length - 1].value - oppositionData[oppositionData.length - 2].value)}% from previous
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle className="h-3 w-3 text-gray-500 mr-1" />
                      <span className="text-gray-500 font-medium">
                        {Math.abs(oppositionData[oppositionData.length - 1].value - oppositionData[oppositionData.length - 2].value)}% from previous
                      </span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}