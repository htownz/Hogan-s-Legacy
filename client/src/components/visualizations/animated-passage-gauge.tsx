import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';

interface AnimatedPassageGaugeProps {
  billTitle: string;
  passageProbability: number; // Value between 0 and 100
  oddsDescription?: string;
  className?: string;
}

export default function AnimatedPassageGauge({ 
  billTitle, 
  passageProbability, 
  oddsDescription,
  className = '' 
}: AnimatedPassageGaugeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mount
    setIsVisible(true);
  }, []);

  // Determine gauge color based on passage probability
  const getGaugeColor = () => {
    if (passageProbability < 30) return '#ef4444'; // Red for low chance
    if (passageProbability < 60) return '#f59e0b'; // Amber for medium chance
    return '#10b981'; // Green for high chance
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

  // Calculate needle rotation based on probability (from -90 to 90 degrees)
  const needleRotation = -90 + (passageProbability / 100) * 180;

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
            <Gauge className="mr-2 h-5 w-5 text-accent" />
            Passage Probability: {billTitle}
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
          {/* Gauge visualization */}
          <motion.div 
            className="flex justify-center items-center"
            variants={itemVariants}
          >
            <div className="relative w-60 h-32">
              {/* Gauge background */}
              <motion.div
                className="absolute h-32 w-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <svg width="100%" height="100%" viewBox="0 0 240 120">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  {/* Gauge background arc */}
                  <path
                    d="M 20 100 A 100 100 0 0 1 220 100"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  {/* Colored gauge arc - dynamic based on passage probability */}
                  <motion.path
                    d="M 20 100 A 100 100 0 0 1 220 100"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray="314"
                    initial={{ strokeDashoffset: 314 }}
                    animate={{ strokeDashoffset: 314 - (314 * passageProbability / 100) }}
                    transition={{ 
                      delay: 0.8, 
                      duration: 1.5,
                      type: "spring",
                      stiffness: 25
                    }}
                  />
                  {/* Gauge ticks */}
                  {[...Array(11)].map((_, i) => {
                    const angle = -90 + i * 18; // -90 to 90 degrees
                    const x1 = 120 + 85 * Math.cos((angle * Math.PI) / 180);
                    const y1 = 100 + 85 * Math.sin((angle * Math.PI) / 180);
                    const x2 = 120 + 100 * Math.cos((angle * Math.PI) / 180);
                    const y2 = 100 + 100 * Math.sin((angle * Math.PI) / 180);
                    const isLarge = i % 2 === 0;
                    
                    return (
                      <motion.line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#6b7280"
                        strokeWidth={isLarge ? 3 : 1}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                      />
                    );
                  })}
                  {/* Percentage labels */}
                  <motion.text
                    x="20"
                    y="115"
                    fontSize="12"
                    fontWeight="500"
                    textAnchor="middle"
                    fill="#6b7280"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    0%
                  </motion.text>
                  <motion.text
                    x="120"
                    y="65"
                    fontSize="12"
                    fontWeight="500"
                    textAnchor="middle"
                    fill="#6b7280"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                  >
                    50%
                  </motion.text>
                  <motion.text
                    x="220"
                    y="115"
                    fontSize="12"
                    fontWeight="500"
                    textAnchor="middle"
                    fill="#6b7280"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    100%
                  </motion.text>
                </svg>
              </motion.div>
              
              {/* Gauge needle */}
              <motion.div
                className="absolute left-1/2 bottom-0 origin-bottom"
                initial={{ rotate: -90 }}
                animate={{ rotate: needleRotation }}
                transition={{ 
                  delay: 1, 
                  type: "spring",
                  stiffness: 15,
                  damping: 10
                }}
                style={{ translateX: '-50%' }}
              >
                <div className="w-1 h-16 bg-primary rounded-t-full" />
                <div className="w-5 h-5 rounded-full bg-primary -mt-1 mx-auto" />
              </motion.div>
              
              {/* Percentage display */}
              <motion.div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-2"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.3 }}
              >
                <div className="text-3xl font-bold" style={{ color: getGaugeColor() }}>
                  {passageProbability}%
                </div>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Betting odds description */}
          {oddsDescription && (
            <motion.div 
              className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                boxShadow: ['0px 0px 0px rgba(0,0,0,0)', '0px 0px 8px rgba(255,87,51,0.3)', '0px 0px 0px rgba(0,0,0,0)'],
              }}
              transition={{
                delay: 1.8,
                duration: 0.5,
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop'
                }
              }}
            >
              <p className="text-sm text-center">
                <span className="font-medium">Betting odds: </span>
                <span className="font-bold">{oddsDescription}</span>
              </p>
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}