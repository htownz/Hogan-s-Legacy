import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUpIcon, 
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ZapIcon,
  ArrowRightIcon,
  BarChart3Icon,
  Users,
  Calendar,
  Target,
  Bell,
  Eye,
  Heart,
  MessageCircle
} from "lucide-react";

// Animated counter for vote counts and statistics
export function AnimatedCounter({ 
  value, 
  duration = 2000, 
  prefix = "", 
  suffix = "" 
}: { 
  value: number; 
  duration?: number; 
  prefix?: string; 
  suffix?: string; 
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 50);
    
    const counter = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(counter);
      } else {
        setCount(Math.floor(start));
      }
    }, 50);

    return () => clearInterval(counter);
  }, [value, duration]);

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="font-bold"
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  );
}

// Pulse animation for urgent legislative alerts
export function PulsingAlert({ 
  children, 
  variant = "urgent" 
}: { 
  children: React.ReactNode; 
  variant?: "urgent" | "important" | "info"; 
}) {
  const getColors = () => {
    switch (variant) {
      case "urgent": return "border-red-500 bg-red-50 text-red-800";
      case "important": return "border-orange-500 bg-orange-50 text-orange-800";
      default: return "border-blue-500 bg-blue-50 text-blue-800";
    }
  };

  return (
    <motion.div
      animate={{ 
        scale: [1, 1.02, 1],
        boxShadow: [
          "0 0 0 0 rgba(239, 68, 68, 0.4)",
          "0 0 0 10px rgba(239, 68, 68, 0)",
          "0 0 0 0 rgba(239, 68, 68, 0)"
        ]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`border-2 rounded-lg p-4 ${getColors()}`}
    >
      {children}
    </motion.div>
  );
}

// Animated progress bar for bill advancement
export function BillProgressAnimation({ 
  currentStage, 
  totalStages = 7,
  billTitle,
  stageNames = [
    "Introduced",
    "Committee", 
    "Approved",
    "Floor Debate",
    "House Vote",
    "Senate",
    "Governor"
  ]
}: {
  currentStage: number;
  totalStages?: number;
  billTitle: string;
  stageNames?: string[];
}) {
  const [animatedStage, setAnimatedStage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStage(currentStage);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentStage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{billTitle}</h3>
        <Badge variant="outline" className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          Stage {currentStage} of {totalStages}
        </Badge>
      </div>
      
      <div className="relative">
        <Progress 
          value={(animatedStage / totalStages) * 100} 
          className="h-3"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          className="absolute top-0 left-0 w-full h-3 flex items-center"
          style={{ 
            marginLeft: `${(animatedStage / totalStages) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
        </motion.div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {stageNames.map((stage, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0.5 }}
            animate={{ 
              opacity: index <= animatedStage ? 1 : 0.5,
              color: index <= animatedStage ? "#16a34a" : "#6b7280"
            }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            {stage}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Voting result animation with real-time updates
export function VotingResultsAnimation({ 
  yesVotes, 
  noVotes, 
  abstentions = 0,
  billTitle,
  isLive = false
}: {
  yesVotes: number;
  noVotes: number;
  abstentions?: number;
  billTitle: string;
  isLive?: boolean;
}) {
  const total = yesVotes + noVotes + abstentions;
  const yesPercentage = (yesVotes / total) * 100;
  const noPercentage = (noVotes / total) * 100;
  
  const isPassing = yesVotes > noVotes;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{billTitle}</h3>
        {isLive && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 text-red-600"
          >
            <div className="w-2 h-2 bg-red-600 rounded-full" />
            <span className="text-sm font-medium">LIVE VOTE</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-medium">YES</span>
            <motion.span 
              className="font-bold text-green-600"
              key={yesVotes}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              <AnimatedCounter value={yesVotes} duration={1000} />
            </motion.span>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${yesPercentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-3 bg-green-500 rounded-full"
          />
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-red-600 font-medium">NO</span>
            <motion.span 
              className="font-bold text-red-600"
              key={noVotes}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              <AnimatedCounter value={noVotes} duration={1000} />
            </motion.span>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${noPercentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className="h-3 bg-red-500 rounded-full"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className={`text-center p-3 rounded-lg font-bold ${
          isPassing 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}
      >
        {isPassing ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            BILL PASSING
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <AlertTriangleIcon className="w-5 h-5" />
            BILL FAILING
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Impact score animation with visual feedback
export function ImpactScoreAnimation({ 
  score, 
  maxScore = 100,
  label,
  description 
}: {
  score: number;
  maxScore?: number;
  label: string;
  description: string;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{label}</h4>
        <motion.div
          key={score}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-2xl font-bold ${getScoreColor(score)}`}
        >
          <AnimatedCounter value={score} duration={1500} suffix={`/${maxScore}`} />
        </motion.div>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(animatedScore / maxScore) * 100}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-2 rounded-full ${getProgressColor(score)}`}
          />
        </div>
        
        {score >= 80 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, type: "spring" }}
            className="absolute -top-8 right-0"
          >
            <div className="flex items-center gap-1 text-green-600">
              <ZapIcon className="w-4 h-4" />
              <span className="text-xs font-medium">HIGH IMPACT</span>
            </div>
          </motion.div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

// Trending topic animation with momentum indicators
export function TrendingInsight({ 
  topic, 
  momentum, 
  change,
  mentions,
  category 
}: {
  topic: string;
  momentum: "rising" | "falling" | "stable";
  change: number;
  mentions: number;
  category: string;
}) {
  const getMomentumIcon = () => {
    switch (momentum) {
      case "rising": return <TrendingUpIcon className="w-4 h-4 text-green-600" />;
      case "falling": return <TrendingDownIcon className="w-4 h-4 text-red-600" />;
      default: return <BarChart3Icon className="w-4 h-4 text-blue-600" />;
    }
  };

  const getMomentumColor = () => {
    switch (momentum) {
      case "rising": return "border-l-green-500 bg-green-50";
      case "falling": return "border-l-red-500 bg-red-50";
      default: return "border-l-blue-500 bg-blue-50";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`border-l-4 p-4 rounded-r-lg ${getMomentumColor()}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getMomentumIcon()}
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
          </div>
          <h4 className="font-semibold">{topic}</h4>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <AnimatedCounter value={mentions} suffix=" mentions" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className={`flex items-center gap-1 ${
                change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
              }`}
            >
              <ArrowRightIcon className="w-3 h-3" />
              {change > 0 ? "+" : ""}{change}%
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Committee meeting countdown with urgency animation
export function CommitteeMeetingCountdown({ 
  meetingTitle,
  timeRemaining,
  isUrgent = false
}: {
  meetingTitle: string;
  timeRemaining: string;
  isUrgent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-lg border-2 ${
        isUrgent 
          ? "border-red-500 bg-red-50" 
          : "border-blue-500 bg-blue-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold">{meetingTitle}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Committee Meeting</span>
          </div>
        </div>
        
        <motion.div
          animate={isUrgent ? {
            scale: [1, 1.1, 1],
            color: ["#dc2626", "#ef4444", "#dc2626"]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-right"
        >
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            <span className="font-bold">{timeRemaining}</span>
          </div>
          {isUrgent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-600 font-medium"
            >
              URGENT
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Alert notification animation
export function LegislativeAlert({ 
  alert,
  onDismiss 
}: {
  alert: {
    id: string;
    type: "deadline" | "vote" | "amendment" | "news";
    title: string;
    description: string;
    timestamp: string;
    isNew?: boolean;
  };
  onDismiss: (id: string) => void;
}) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case "deadline": return <ClockIcon className="w-5 h-5 text-orange-600" />;
      case "vote": return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      case "amendment": return <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />;
      default: return <ZapIcon className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getAlertIcon()}
            <div>
              <h4 className="font-semibold">{alert.title}</h4>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
            </div>
          </div>
          
          {alert.isNew && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{alert.timestamp}</span>
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Engagement metrics animation
export function EngagementMetrics({ 
  views, 
  likes, 
  comments,
  shares 
}: {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1"
      >
        <Eye className="w-4 h-4" />
        <AnimatedCounter value={views} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-1"
      >
        <Heart className="w-4 h-4 text-red-500" />
        <AnimatedCounter value={likes} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-1"
      >
        <MessageCircle className="w-4 h-4 text-blue-500" />
        <AnimatedCounter value={comments} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-1"
      >
        <ArrowRightIcon className="w-4 h-4 text-green-500" />
        <AnimatedCounter value={shares} />
      </motion.div>
    </div>
  );
}