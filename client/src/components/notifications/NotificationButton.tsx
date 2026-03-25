import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/notification-context';
import { cn } from '@/lib/utils';

interface NotificationButtonProps {
  className?: string;
}

export default function NotificationButton({ className }: NotificationButtonProps) {
  const { 
    toggleNotificationPanel,
    stats
  } = useNotifications();
  
  const [isRinging, setIsRinging] = useState(false);
  
  // Animation variants
  const bellVariants = {
    idle: {
      rotate: 0,
    },
    ringing: {
      rotate: [0, 15, -15, 10, -10, 5, -5, 0],
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  };
  
  const indicatorVariants = {
    initial: {
      scale: 0.5,
      opacity: 0
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "backOut"
      }
    }
  };
  
  // Determine if there are unread notifications
  const hasUnread = stats && stats.unreadCount > 0;
  
  // Notification count to display
  const count = stats?.unreadCount || 0;
  
  // Ring the bell when new notifications arrive
  useEffect(() => {
    if (hasUnread) {
      setIsRinging(true);
      const timer = setTimeout(() => {
        setIsRinging(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [hasUnread, stats?.unreadCount]);
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleNotificationPanel}
      className={cn("relative", className)}
      aria-label="Open notifications"
    >
      <motion.div
        variants={bellVariants}
        animate={isRinging ? "ringing" : "idle"}
      >
        <Bell className={hasUnread ? "text-primary" : "text-muted-foreground"} />
      </motion.div>
      
      <AnimatePresence>
        {hasUnread && (
          <motion.div
            className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center"
            variants={indicatorVariants}
            initial="initial"
            animate="animate"
            exit={{
              scale: 0,
              opacity: 0,
              transition: { duration: 0.2 }
            }}
          >
            <span className="text-white text-xs font-bold">
              {count > 99 ? "99+" : count}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}