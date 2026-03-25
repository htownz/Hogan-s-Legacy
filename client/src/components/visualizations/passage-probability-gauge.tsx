import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface PassageProbabilityData {
  probability: number; // 0-1
  reasoningFactors: string[];
  confidenceScore: number; // 0-1
}

interface PassageProbabilityGaugeProps {
  data: PassageProbabilityData;
  title?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showReasoningFactors?: boolean;
}

export const PassageProbabilityGauge: React.FC<PassageProbabilityGaugeProps> = ({
  data,
  title = 'Passage Probability',
  animate = true,
  size = 'md',
  showReasoningFactors = true
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Get dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case 'sm': return { size: 140, strokeWidth: 8, fontSize: 24 };
      case 'lg': return { size: 260, strokeWidth: 14, fontSize: 48 };
      case 'md':
      default: return { size: 200, strokeWidth: 12, fontSize: 36 };
    }
  };
  
  const { size: gaugeSize, strokeWidth, fontSize } = getDimensions();
  
  // Calculate gauge properties
  const center = gaugeSize / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  // We're using a semi-circle, so we need only half of the circumference
  const halfCircumference = circumference / 2;
  
  // Calculate the stroke-dashoffset based on probability
  const offset = halfCircumference - (data.probability * halfCircumference);
  
  // Get color based on probability
  const getProbabilityColor = (probability: number) => {
    if (probability < 0.3) return '#F87171'; // Red for low probability
    if (probability < 0.6) return '#FBBF24'; // Yellow for medium probability
    return '#34D399'; // Green for high probability
  };
  
  // Get text based on probability
  const getProbabilityText = (probability: number) => {
    if (probability < 0.3) return 'Low';
    if (probability < 0.6) return 'Medium';
    if (probability < 0.75) return 'Likely';
    return 'Highly Likely';
  };
  
  // Get visual confidence indicator
  const getConfidenceIndicator = (confidence: number) => {
    const dots = [];
    const totalDots = 5;
    const filledDots = Math.round(confidence * totalDots);
    
    for (let i = 0; i < totalDots; i++) {
      dots.push(
        <div 
          key={i} 
          className={`w-2 h-2 rounded-full ${i < filledDots ? 'bg-blue-500' : 'bg-gray-300'}`}
        ></div>
      );
    }
    
    return dots;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      
      <div className="flex flex-col items-center">
        {/* Semi-circular gauge */}
        <div 
          className="relative"
          style={{ 
            width: gaugeSize, 
            height: gaugeSize / 2 + 20 // Add some padding at the bottom
          }}
        >
          {/* Base track (grey) */}
          <svg 
            className="w-full absolute"
            height={gaugeSize / 2 + strokeWidth}
            viewBox={`0 0 ${gaugeSize} ${gaugeSize / 2 + strokeWidth}`}
          >
            <path
              d={`M ${strokeWidth/2},${center} a ${radius},${radius} 0 1,1 ${gaugeSize - strokeWidth},0`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Probability indicator (colored) */}
          <svg 
            className="w-full absolute"
            height={gaugeSize / 2 + strokeWidth}
            viewBox={`0 0 ${gaugeSize} ${gaugeSize / 2 + strokeWidth}`}
          >
            <motion.path
              d={`M ${strokeWidth/2},${center} a ${radius},${radius} 0 1,1 ${gaugeSize - strokeWidth},0`}
              fill="none"
              stroke={getProbabilityColor(data.probability)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={animate ? { strokeDasharray: halfCircumference, strokeDashoffset: halfCircumference } : { strokeDasharray: halfCircumference, strokeDashoffset: offset }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              onAnimationComplete={() => setAnimationComplete(true)}
            />
          </svg>
          
          {/* Percentage display */}
          <div 
            className="absolute text-center font-bold"
            style={{
              top: '65%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: `${fontSize}px`,
              color: getProbabilityColor(data.probability)
            }}
          >
            <motion.span
              initial={animate ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              {Math.round(data.probability * 100)}%
            </motion.span>
          </div>
          
          {/* Description text */}
          <div 
            className="absolute text-center font-medium text-gray-600"
            style={{
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: `${fontSize * 0.35}px`
            }}
          >
            <motion.span
              initial={animate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              {getProbabilityText(data.probability)}
            </motion.span>
          </div>
          
          {/* Tick marks */}
          <svg 
            className="w-full absolute"
            height={gaugeSize / 2 + strokeWidth}
            viewBox={`0 0 ${gaugeSize} ${gaugeSize / 2 + strokeWidth}`}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((tick, index) => {
              const angle = Math.PI * tick;
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              const x2 = center + (radius + strokeWidth/2) * Math.cos(angle);
              const y2 = center + (radius + strokeWidth/2) * Math.sin(angle);
              
              return (
                <g key={index}>
                  <motion.line
                    x1={x}
                    y1={y}
                    x2={x2}
                    y2={y2}
                    stroke="#6B7280"
                    strokeWidth={2}
                    initial={animate ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                  />
                  <motion.text
                    x={center + (radius + strokeWidth * 1.2) * Math.cos(angle)}
                    y={center + (radius + strokeWidth * 1.2) * Math.sin(angle)}
                    fill="#6B7280"
                    fontSize="10"
                    textAnchor="middle"
                    initial={animate ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                  >
                    {tick * 100}%
                  </motion.text>
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Confidence indicator */}
        <div className="mt-4 mb-2">
          <div className="flex items-center gap-1 justify-center">
            <span className="text-xs text-gray-500 mr-1">Confidence:</span>
            <div className="flex gap-1">
              {getConfidenceIndicator(data.confidenceScore)}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              {Math.round(data.confidenceScore * 100)}%
            </span>
          </div>
        </div>
        
        {/* Reasoning factors */}
        {showReasoningFactors && (
          <motion.div 
            className="mt-4 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Key Factors:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              {data.reasoningFactors.map((factor, index) => (
                <motion.li
                  key={index}
                  className="flex items-start"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.2, duration: 0.3 }}
                >
                  <div className="min-w-4 mr-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <span>{factor}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PassageProbabilityGauge;