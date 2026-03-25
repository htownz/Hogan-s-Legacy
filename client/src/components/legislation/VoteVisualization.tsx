import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart4, PieChart, Users, Calendar, Database, Download } from 'lucide-react';
import { Link } from 'wouter';

// Act Up Color Palette
const COLORS = {
  PRIMARY: '#1D2D44', // Dark blue
  ACCENT: '#FF6400',  // Orange
  BACKGROUND: '#FAFAFA', // Off-white
  SUPPORT: '#596475', // Slate gray
  OPTIONAL: '#5DB39E',  // Teal
  HOUSE: '#3B82F6',   // Blue
  SENATE: '#8B5CF6',  // Purple 
  GOVERNOR: '#10B981', // Green
  SUCCESS: '#22C55E',  // Success green
  WARNING: '#F59E0B',  // Warning yellow
  DANGER: '#EF4444',   // Danger red
};

// Animation variants for vote charts
const voteChartVariants: Variants = {
  initial: { width: 0 },
  animate: (custom) => ({
    width: `${custom}%`,
    transition: { duration: 0.8, delay: 0.3, ease: "easeOut" }
  })
};

// Animation variants for pie chart segments
const pieSegmentVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Animation variants for cards
const cardVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export interface VoteData {
  yes: number;
  no: number;
  present: number;
  absent: number;
  billId?: string;
  chamber?: 'house' | 'senate';
  date?: string;
  action?: string;
  committeeInfo?: string;
}

export interface VoteVisualizationProps {
  voteData: VoteData;
  title?: string;
  description?: string;
  showDownload?: boolean;
  className?: string;
  visualizationType?: 'bars' | 'pie' | 'both';
  linkToBill?: boolean;
}

export default function VoteVisualization({
  voteData,
  title = "Vote Results",
  description,
  showDownload = false,
  className = '',
  visualizationType = 'both',
  linkToBill = false
}: VoteVisualizationProps) {
  const [activeTab, setActiveTab] = useState<string>(
    visualizationType === 'bars' ? 'bars' : 
    visualizationType === 'pie' ? 'pie' : 
    'bars'
  );

  // Calculate total votes
  const totalVotes = voteData.yes + voteData.no + voteData.present + voteData.absent;
  
  // Calculate percentages
  const calculatePercentage = (count: number) => {
    if (totalVotes === 0) return 0;
    return (count / totalVotes) * 100;
  };

  const yesPercentage = calculatePercentage(voteData.yes);
  const noPercentage = calculatePercentage(voteData.no);
  const presentPercentage = calculatePercentage(voteData.present);
  const absentPercentage = calculatePercentage(voteData.absent);

  // Format percentage for display
  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(1) + '%';
  };

  // Get chamber color
  const getChamberColor = (chamber?: string) => {
    if (!chamber) return COLORS.SUPPORT;
    
    switch (chamber.toLowerCase()) {
      case 'house':
        return COLORS.HOUSE;
      case 'senate':
        return COLORS.SENATE;
      default:
        return COLORS.SUPPORT;
    }
  };

  // Get vote type color
  const getVoteTypeColor = (type: 'yes' | 'no' | 'present' | 'absent') => {
    switch (type) {
      case 'yes':
        return COLORS.SUCCESS;
      case 'no':
        return COLORS.DANGER;
      case 'present':
        return COLORS.WARNING;
      case 'absent':
        return COLORS.SUPPORT;
      default:
        return COLORS.SUPPORT;
    }
  };

  // Handler for downloading the vote data
  const handleDownload = () => {
    // Create CSV content
    const csvContent = [
      ['Vote Type', 'Count', 'Percentage'],
      ['Yes', voteData.yes, yesPercentage.toFixed(2)],
      ['No', voteData.no, noPercentage.toFixed(2)],
      ['Present', voteData.present, presentPercentage.toFixed(2)],
      ['Absent', voteData.absent, absentPercentage.toFixed(2)],
      ['Total', totalVotes, '100']
    ].map(row => row.join(',')).join('\n');
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vote-data-${voteData.billId || 'unknown'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className={`${className}`}
    >
      <Card className="shadow-md overflow-hidden border-t-4" style={{ 
        borderTopColor: voteData.chamber ? getChamberColor(voteData.chamber) : COLORS.PRIMARY 
      }}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart4 className="h-5 w-5 text-primary" />
                {linkToBill && voteData.billId ? (
                  <Link to={`/legislation/${voteData.billId}`} className="hover:underline hover:text-primary">
                    {title}
                  </Link>
                ) : (
                  <span>{title}</span>
                )}
              </CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {showDownload && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownload}
                className="text-muted-foreground hover:text-primary"
              >
                <Download size={16} />
              </Button>
            )}
          </div>
          
          {voteData.date && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(voteData.date).toLocaleDateString()}
            </div>
          )}
          
          {voteData.chamber && (
            <div className="inline-flex items-center mt-2">
              <span className="text-xs font-medium py-0.5 px-2 rounded-full" style={{
                backgroundColor: getChamberColor(voteData.chamber) + '20',
                color: getChamberColor(voteData.chamber)
              }}>
                {voteData.chamber === 'house' ? 'House' : 'Senate'}
              </span>
            </div>
          )}

          {voteData.committeeInfo && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3 mr-1" />
              {voteData.committeeInfo}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          {visualizationType === 'both' ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bars" className="text-xs">
                  <BarChart4 className="h-3 w-3 mr-1" />
                  Bar Chart
                </TabsTrigger>
                <TabsTrigger value="pie" className="text-xs">
                  <PieChart className="h-3 w-3 mr-1" />
                  Pie Chart
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="bars" className="space-y-3 mt-3">
                {renderBarChart(voteData, {
                  yesPercentage,
                  noPercentage,
                  presentPercentage,
                  absentPercentage,
                  formatPercentage
                })}
              </TabsContent>
              
              <TabsContent value="pie" className="mt-3">
                {renderPieChart(voteData, {
                  yesPercentage,
                  noPercentage,
                  presentPercentage,
                  absentPercentage,
                  formatPercentage
                })}
              </TabsContent>
            </Tabs>
          ) : visualizationType === 'bars' ? (
            <div className="space-y-3 mt-3">
              {renderBarChart(voteData, {
                yesPercentage,
                noPercentage,
                presentPercentage,
                absentPercentage,
                formatPercentage
              })}
            </div>
          ) : (
            <div className="mt-3">
              {renderPieChart(voteData, {
                yesPercentage,
                noPercentage,
                presentPercentage,
                absentPercentage,
                formatPercentage
              })}
            </div>
          )}
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <Database className="h-3 w-3 inline mr-1" />
            Total Votes: {totalVotes}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ChartDataProps {
  yesPercentage: number;
  noPercentage: number;
  presentPercentage: number;
  absentPercentage: number;
  formatPercentage: (percentage: number) => string;
}

function renderBarChart(voteData: VoteData, chartData: ChartDataProps) {
  const { yesPercentage, noPercentage, presentPercentage, absentPercentage, formatPercentage } = chartData;
  
  return (
    <>
      {/* Yes vote bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium">Yes</span>
          <span className="flex items-center">
            <span className="mr-1">{voteData.yes} votes</span>
            <span className="text-green-600">({formatPercentage(yesPercentage)})</span>
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-green-500"
            variants={voteChartVariants}
            initial="initial"
            animate="animate"
            custom={yesPercentage}
          />
        </div>
      </div>
      
      {/* No vote bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium">No</span>
          <span className="flex items-center">
            <span className="mr-1">{voteData.no} votes</span>
            <span className="text-red-600">({formatPercentage(noPercentage)})</span>
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-red-500"
            variants={voteChartVariants}
            initial="initial"
            animate="animate"
            custom={noPercentage}
          />
        </div>
      </div>
      
      {/* Present vote bar (if applicable) */}
      {voteData.present > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">Present</span>
            <span className="flex items-center">
              <span className="mr-1">{voteData.present} votes</span>
              <span className="text-yellow-600">({formatPercentage(presentPercentage)})</span>
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-yellow-500"
              variants={voteChartVariants}
              initial="initial"
              animate="animate"
              custom={presentPercentage}
            />
          </div>
        </div>
      )}
      
      {/* Absent vote bar (if applicable) */}
      {voteData.absent > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">Absent</span>
            <span className="flex items-center">
              <span className="mr-1">{voteData.absent} votes</span>
              <span className="text-gray-600">({formatPercentage(absentPercentage)})</span>
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gray-500"
              variants={voteChartVariants}
              initial="initial"
              animate="animate"
              custom={absentPercentage}
            />
          </div>
        </div>
      )}
    </>
  );
}

function renderPieChart(voteData: VoteData, chartData: ChartDataProps) {
  const { yesPercentage, noPercentage, presentPercentage, absentPercentage, formatPercentage } = chartData;
  
  // Create an SVG pie chart
  const radius = 50;
  const centerX = 75;
  const centerY = 75;
  const chartSize = 150;
  
  // Calculate the angles for each slice
  let currentAngle = 0;
  const calculateCoordinates = (percentage: number, startAngle: number) => {
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // Start point
    const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    
    // End point
    const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    return {
      path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      midAngle: startAngle + (angle / 2),
      percentage
    };
  };
  
  // Generate paths for each vote type
  const yesPath = calculateCoordinates(yesPercentage, currentAngle);
  currentAngle += (yesPercentage / 100) * 360;
  
  const noPath = calculateCoordinates(noPercentage, currentAngle);
  currentAngle += (noPercentage / 100) * 360;
  
  const presentPath = calculateCoordinates(presentPercentage, currentAngle);
  currentAngle += (presentPercentage / 100) * 360;
  
  const absentPath = calculateCoordinates(absentPercentage, currentAngle);
  
  // Calculate label positions
  const getLabelPosition = (midAngle: number, percentage: number) => {
    // Only show label if percentage is significant enough
    if (percentage < 3) return null;
    
    const labelRadius = radius * 0.7; // Position labels inside the pie
    const x = centerX + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const y = centerY + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
    
    return { x, y };
  };
  
  const yesLabel = getLabelPosition(yesPath.midAngle, yesPercentage);
  const noLabel = getLabelPosition(noPath.midAngle, noPercentage);
  const presentLabel = getLabelPosition(presentPath.midAngle, presentPercentage);
  const absentLabel = getLabelPosition(absentPath.midAngle, absentPercentage);
  
  return (
    <div className="flex flex-col items-center mt-3">
      <svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
        {/* Yes slice */}
        {yesPercentage > 0 && (
          <motion.path
            d={yesPath.path}
            fill="#22C55E" // Green
            variants={pieSegmentVariants}
            initial="initial"
            animate="animate"
            custom={0}
          />
        )}
        
        {/* No slice */}
        {noPercentage > 0 && (
          <motion.path
            d={noPath.path}
            fill="#EF4444" // Red
            variants={pieSegmentVariants}
            initial="initial"
            animate="animate"
            custom={1}
          />
        )}
        
        {/* Present slice */}
        {presentPercentage > 0 && (
          <motion.path
            d={presentPath.path}
            fill="#F59E0B" // Yellow
            variants={pieSegmentVariants}
            initial="initial"
            animate="animate"
            custom={2}
          />
        )}
        
        {/* Absent slice */}
        {absentPercentage > 0 && (
          <motion.path
            d={absentPath.path}
            fill="#6B7280" // Gray
            variants={pieSegmentVariants}
            initial="initial"
            animate="animate"
            custom={3}
          />
        )}
        
        {/* Labels */}
        {yesLabel && (
          <text
            x={yesLabel.x}
            y={yesLabel.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {formatPercentage(yesPercentage)}
          </text>
        )}
        
        {noLabel && (
          <text
            x={noLabel.x}
            y={noLabel.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {formatPercentage(noPercentage)}
          </text>
        )}
        
        {presentLabel && (
          <text
            x={presentLabel.x}
            y={presentLabel.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {formatPercentage(presentPercentage)}
          </text>
        )}
        
        {absentLabel && (
          <text
            x={absentLabel.x}
            y={absentLabel.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {formatPercentage(absentPercentage)}
          </text>
        )}
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span className="text-xs">Yes</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span className="text-xs">No</span>
        </div>
        {presentPercentage > 0 && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span className="text-xs">Present</span>
          </div>
        )}
        {absentPercentage > 0 && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
            <span className="text-xs">Absent</span>
          </div>
        )}
      </div>
    </div>
  );
}