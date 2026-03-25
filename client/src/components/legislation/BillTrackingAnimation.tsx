import { useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Star, Check, Users } from "lucide-react";

interface BillTrackingAnimationProps {
  isActive: boolean;
  onComplete: () => void;
  type: "track" | "untrack";
}

export default function BillTrackingAnimation({
  isActive,
  onComplete,
  type
}: BillTrackingAnimationProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (isActive) {
      const animate = async () => {
        // First animation
        await controls.start({
          scale: [1, 1.2, 1],
          opacity: 1,
          transition: { duration: 0.5 }
        });
        
        // Second animation
        await controls.start({
          y: [0, -10, 0],
          transition: { duration: 0.3 }
        });
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Call onComplete to remove the animation
        onComplete();
      };
      
      animate();
    }
  }, [isActive, controls, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
        >
          <motion.div
            className={`flex flex-col items-center justify-center p-8 rounded-lg ${
              type === "track" ? "bg-primary-100" : "bg-gray-100"
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={controls}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {type === "track" ? (
              <>
                <motion.div
                  className="relative mb-4"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Star
                    size={48}
                    className="text-primary-500 fill-primary-500"
                  />
                  <motion.div
                    className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Check size={16} className="text-white" />
                  </motion.div>
                </motion.div>
                <motion.h3
                  className="text-lg font-semibold text-primary-700 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Bill Tracked!
                </motion.h3>
                <motion.div
                  className="flex items-center gap-2 text-sm text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Users size={16} />
                  <span>You and 42 others are tracking this bill</span>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  className="relative mb-4"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Star size={48} className="text-gray-400" />
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <div className="w-full h-0.5 bg-red-500 absolute top-1/2 left-0 -rotate-45" />
                    <div className="w-full h-0.5 bg-red-500 absolute top-1/2 left-0 rotate-45" />
                  </motion.div>
                </motion.div>
                <motion.h3
                  className="text-lg font-semibold text-gray-700 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Bill Untracked
                </motion.h3>
                <motion.p
                  className="text-sm text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  You'll no longer receive updates about this bill
                </motion.p>
              </>
            )}
            
            <motion.p
              className="text-xs text-gray-500 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Tap anywhere to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}