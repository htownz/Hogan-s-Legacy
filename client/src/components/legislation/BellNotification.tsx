import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";

interface BellNotificationProps {
  hasUpdates: boolean;
  count?: number;
  onClick?: () => void;
}

export default function BellNotification({
  hasUpdates,
  count = 1,
  onClick,
}: BellNotificationProps) {
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    // If there are updates, start the ringing animation
    if (hasUpdates) {
      setIsRinging(true);
      
      // Auto stop after 5 seconds to not be annoying
      const timer = setTimeout(() => {
        setIsRinging(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [hasUpdates]);

  // Bell shake animation
  const bellVariants = {
    ringing: {
      rotate: [0, 15, -15, 8, -8, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatType: "loop" as const,
      }
    },
    idle: {
      rotate: 0
    }
  };

  // Indicator animation
  const indicatorVariants = {
    initial: { 
      scale: 0,
      opacity: 0 
    },
    animate: { 
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 500
      }
    }
  };

  return (
    <div 
      className="relative cursor-pointer" 
      onClick={() => {
        setIsRinging(false);
        onClick?.();
      }}
    >
      <motion.div
        variants={bellVariants}
        animate={isRinging ? "ringing" : "idle"}
      >
        <Bell className={hasUpdates ? "text-primary-500" : "text-gray-500"} />
      </motion.div>
      
      {/* Notification count indicator */}
      {hasUpdates && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center"
          variants={indicatorVariants}
          initial="initial"
          animate="animate"
        >
          <span className="text-white text-xs font-bold">
            {count > 9 ? "9+" : count}
          </span>
        </motion.div>
      )}
    </div>
  );
}