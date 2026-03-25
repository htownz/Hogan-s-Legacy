import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Define the standard legislative stages
const DEFAULT_STAGES = [
  "Filed", 
  "In Committee", 
  "Hearing Scheduled", 
  "Floor Vote", 
  "Passed Chamber",
  "In Other Chamber",
  "Passed Both Chambers", 
  "Signed Into Law"
];

// Define the action items that can be taken at each stage
const STAGE_ACTIONS = {
  "Filed": "Track this bill for updates as it moves through the process.",
  "In Committee": "Contact committee members to express your support or concerns.",
  "Hearing Scheduled": "Submit public testimony or prepare to testify in person.",
  "Floor Vote": "Call your representative before the vote happens.",
  "Passed Chamber": "Share updates with your network as the bill advances.",
  "In Other Chamber": "Contact senators/representatives in the other chamber.",
  "Passed Both Chambers": "Monitor for any amendments or conference committee changes.",
  "Signed Into Law": "Learn about implementation dates and how this will affect you."
};

export type BillStage = {
  name: string;
  date?: Date;
  completed: boolean;
  current: boolean;
};

interface TrackedTimelineProps {
  billId: string;
  billTitle?: string;
  chamber?: "House" | "Senate";
  stages?: BillStage[];
  currentStage?: string;
  estimatedNextDate?: Date;
  onActionClick?: () => void;
}

export default function TrackedTimeline({
  billId,
  billTitle,
  chamber = "House",
  stages: customStages,
  currentStage,
  estimatedNextDate,
  onActionClick
}: TrackedTimelineProps) {
  // If custom stages are not provided, use default stages and mark the appropriate current stage
  const [stages, setStages] = useState<BillStage[]>([]);
  
  useEffect(() => {
    if (customStages) {
      setStages(customStages);
    } else if (currentStage) {
      // Map the default stages with current stage highlighted
      const defaultStagesWithStatus = DEFAULT_STAGES.map(stage => ({
        name: stage,
        completed: DEFAULT_STAGES.indexOf(stage) < DEFAULT_STAGES.indexOf(currentStage),
        current: stage === currentStage,
        date: undefined
      }));
      setStages(defaultStagesWithStatus);
    } else {
      // Default to first stage if no currentStage provided
      const defaultStagesWithStatus = DEFAULT_STAGES.map((stage, index) => ({
        name: stage,
        completed: false,
        current: index === 0,
        date: undefined
      }));
      setStages(defaultStagesWithStatus);
    }
  }, [customStages, currentStage]);

  // Generate action recommendation based on current stage
  const getCurrentAction = (): string => {
    if (!currentStage) return STAGE_ACTIONS["Filed"];
    return STAGE_ACTIONS[currentStage as keyof typeof STAGE_ACTIONS] || 
           "Stay informed as this bill moves through the legislature.";
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const stageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  const lineVariants = {
    hidden: { scaleY: 0, originY: 0 },
    visible: { scaleY: 1, transition: { duration: 1 } }
  };
  
  const currentStageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, type: "spring", stiffness: 200 }
    }
  };
  
  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: { repeat: Infinity, duration: 2 }
    }
  };

  return (
    <Card className="bg-[#1e2334] border-gray-700 overflow-hidden">
      <CardContent className="p-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <h3 className="text-xl font-bold text-white">{billTitle || billId} Timeline</h3>
          <p className="text-gray-400 text-sm">
            Chamber: {chamber} | Current Stage: {currentStage || "Filed"}
          </p>
        </motion.div>

        {/* Timeline visualization */}
        <div className="relative">
          <motion.div 
            className="absolute h-full w-0.5 bg-gray-700 left-3 top-0"
            variants={lineVariants}
            initial="hidden"
            animate="visible"
          ></motion.div>
          <motion.ul 
            className="space-y-6 relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {stages.map((stage, index) => (
              <motion.li 
                key={`${stage.name}-${index}`} 
                className="ml-8 relative"
                variants={stageVariants}
                whileHover={{ x: 5 }}
              >
                {/* Stage marker */}
                <motion.div 
                  className={cn(
                    "absolute -left-8 mt-1.5 rounded-full border-4 border-[#121825] h-6 w-6 flex items-center justify-center",
                    stage.current ? "bg-[#f05a28]" : 
                    stage.completed ? "bg-green-600" : "bg-gray-700"
                  )}
                  variants={stage.current ? pulseVariants : {}}
                  animate={stage.current ? "pulse" : undefined}
                  title={stage.date ? `${stage.name}: ${stage.date.toLocaleDateString()}` : stage.name}
                >
                  {stage.completed && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-3 w-3 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </motion.div>
                
                {/* Stage content */}
                <div>
                  <h4 className={cn(
                    "text-md font-semibold flex items-center",
                    stage.current ? "text-[#f05a28]" : 
                    stage.completed ? "text-green-500" : "text-gray-400"
                  )}>
                    {stage.name}
                    {stage.date && (
                      <span className="ml-2 text-xs text-gray-500">
                        {stage.date.toLocaleDateString()}
                      </span>
                    )}
                    {stage.current && (
                      <motion.span 
                        className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#f05a28] bg-opacity-20 text-[#f05a28]"
                        variants={currentStageVariants}
                      >
                        Active
                      </motion.span>
                    )}
                  </h4>
                  
                  {stage.current && (
                    <motion.p 
                      className="text-sm text-gray-400 mt-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.4 }}
                    >
                      {getCurrentAction()}
                    </motion.p>
                  )}
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Action button */}
        {currentStage && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <h4 className="text-white font-semibold mb-2">Recommended Action</h4>
            <motion.button
              onClick={onActionClick}
              className="w-full py-2 bg-[#f05a28] hover:bg-[#e04a18] text-white font-medium rounded-md transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {currentStage === "Hearing Scheduled" ? "Submit Testimony" :
               currentStage === "Floor Vote" ? "Contact Your Representative" :
               currentStage === "In Committee" ? "Contact Committee Members" :
               "Track Changes & Get Updates"}
            </motion.button>
            {estimatedNextDate && (
              <motion.p 
                className="text-xs text-gray-400 mt-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                Next action estimated by: {estimatedNextDate.toLocaleDateString()}
              </motion.p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}