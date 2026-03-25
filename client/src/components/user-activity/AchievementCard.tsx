import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  BookOpen,
  Zap,
  Users,
  Target,
  Trophy,
  Sparkles,
  Megaphone,
  Crown,
  Medal,
  Star,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface Achievement {
  id: number | string;
  title: string;
  description: string;
  achievementType?: string;
  category?: string;
  level?: number;
  points?: number;
  earnedAt?: string;
  badgeUrl?: string;
  relatedRole?: string;
  iconName?: string;
  unlocked: boolean;
  visible?: boolean;
  metadata?: Record<string, any>;
}

// Map role to colors
const getRoleColors = (role?: string) => {
  switch (role) {
    case 'catalyst':
      return { 
        bg: 'bg-primary-50', 
        text: 'text-primary-600', 
        border: 'border-primary-200',
        gradient: 'from-primary-100 to-primary-50'
      };
    case 'amplifier':
      return { 
        bg: 'bg-indigo-50', 
        text: 'text-indigo-600', 
        border: 'border-indigo-200',
        gradient: 'from-indigo-100 to-indigo-50'
      };
    case 'convincer':
      return { 
        bg: 'bg-purple-50', 
        text: 'text-purple-600', 
        border: 'border-purple-200',
        gradient: 'from-purple-100 to-purple-50'
      };
    default:
      return { 
        bg: 'bg-amber-50', 
        text: 'text-amber-600', 
        border: 'border-amber-200',
        gradient: 'from-amber-100 to-amber-50'
      };
  }
};

// Map category to colors
const getCategoryColors = (category?: string) => {
  switch (category) {
    case 'learning':
      return { 
        bg: 'bg-blue-50', 
        text: 'text-blue-600', 
        border: 'border-blue-200',
        gradient: 'from-blue-100 to-blue-50'
      };
    case 'engagement':
      return { 
        bg: 'bg-green-50', 
        text: 'text-green-600', 
        border: 'border-green-200',
        gradient: 'from-green-100 to-green-50'
      };
    case 'advocacy':
      return { 
        bg: 'bg-orange-50', 
        text: 'text-orange-600', 
        border: 'border-orange-200',
        gradient: 'from-orange-100 to-orange-50'
      };
    case 'community':
      return { 
        bg: 'bg-purple-50', 
        text: 'text-purple-600', 
        border: 'border-purple-200',
        gradient: 'from-purple-100 to-purple-50'
      };
    case 'special':
      return { 
        bg: 'bg-rose-50', 
        text: 'text-rose-600', 
        border: 'border-rose-200',
        gradient: 'from-rose-100 to-rose-50'
      };
    default:
      return { 
        bg: 'bg-neutral-50', 
        text: 'text-neutral-600', 
        border: 'border-neutral-200',
        gradient: 'from-neutral-100 to-neutral-50'
      };
  }
};

// Helper to render the appropriate icon based on the icon name
const renderIcon = (iconName?: string, className = "h-5 w-5") => {
  const iconProps = { className };

  switch (iconName) {
    case 'award':
      return <Award {...iconProps} />;
    case 'book':
      return <BookOpen {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'target':
      return <Target {...iconProps} />;
    case 'megaphone':
      return <Megaphone {...iconProps} />;
    case 'trophy':
      return <Trophy {...iconProps} />;
    case 'crown':
      return <Crown {...iconProps} />;
    case 'medal':
      return <Medal {...iconProps} />;
    case 'star':
      return <Star {...iconProps} />;
    default:
      return <Award {...iconProps} />;
  }
};

// Format achievement date
const formatDate = (dateString?: string) => {
  if (!dateString) return "Not yet earned";
  
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (e) {
    return "Date unavailable";
  }
};

// Get icon from achievement type if no icon name is specified
const getIconFromType = (type?: string): string => {
  if (!type) return 'award';
  
  if (type.includes("scholar") || type.includes("learner") || type.includes("expert") || type.includes("civic_")) {
    return "book";
  }
  if (type.includes("action") || type.includes("advocate")) {
    return "zap";
  }
  if (type.includes("community") || type.includes("networker") || type.includes("social")) {
    return "users";
  }
  if (type.includes("tracker") || type.includes("watcher")) {
    return "target";
  }
  if (type.includes("streak") || type.includes("veteran")) {
    return "trophy";
  }
  if (type.includes("influence") || type.includes("voice")) {
    return "megaphone";
  }
  if (type.includes("super") || type.includes("graduate") || type.includes("founder")) {
    return "sparkles";
  }
  if (type.includes("master") || type.includes("leader")) {
    return "crown";
  }
  if (type.includes("star")) {
    return "star";
  }
  
  return "award"; // Default icon
};

interface AchievementCardProps {
  achievement: Achievement;
  animationDelay?: number;
  variant?: 'default' | 'compact' | 'highlight';
  showCategory?: boolean;
  onClick?: () => void;
}

export const AchievementCard = ({ 
  achievement, 
  animationDelay = 0,
  variant = 'default',
  showCategory = false,
  onClick
}: AchievementCardProps) => {
  const roleColors = getRoleColors(achievement.relatedRole);
  const categoryColors = getCategoryColors(achievement.category);
  
  // Determine icon to use
  const iconName = achievement.iconName || getIconFromType(achievement.achievementType);
  
  // For locked achievements, use a more muted style
  const lockStyles = achievement.unlocked 
    ? {} 
    : {
        bg: 'bg-neutral-50',
        text: 'text-neutral-400',
        border: 'border-neutral-200 border-dashed',
        titleColor: 'text-neutral-500',
        descColor: 'text-neutral-400',
        iconBg: 'bg-neutral-100',
        iconColor: 'text-neutral-400'
      };
  
  // Styles based on which color scheme to use
  const colors = achievement.relatedRole 
    ? roleColors 
    : (achievement.category ? categoryColors : getRoleColors());
  
  // Combine with lock styles if needed
  const styles = {
    bg: achievement.unlocked ? colors.bg : lockStyles.bg,
    text: achievement.unlocked ? colors.text : lockStyles.text,
    border: achievement.unlocked ? colors.border : lockStyles.border,
    titleColor: achievement.unlocked ? 'text-neutral-900' : lockStyles.titleColor,
    descColor: achievement.unlocked ? 'text-neutral-600' : lockStyles.descColor,
    iconBg: achievement.unlocked ? `bg-gradient-to-br ${colors.gradient}` : lockStyles.iconBg,
    iconColor: achievement.unlocked ? colors.text : lockStyles.iconColor
  };
  
  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: animationDelay }}
        className={cn(
          "flex items-center p-3 rounded-lg border gap-3 cursor-pointer hover:shadow-sm transition-all",
          styles.border,
          achievement.unlocked ? "bg-white" : styles.bg,
          onClick && "hover:border-neutral-300"
        )}
        onClick={onClick}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          styles.iconBg
        )}>
          <div className={styles.iconColor}>
            {renderIcon(iconName, "h-5 w-5")}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-medium text-sm truncate", styles.titleColor)}>
              {achievement.title}
            </h3>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            {achievement.points ? (
              <Badge variant={achievement.unlocked ? "outline" : "secondary"} className="text-xs font-normal">
                {achievement.points} pts
              </Badge>
            ) : (
              <span></span>
            )}
            
            {achievement.unlocked && achievement.earnedAt && (
              <span className="text-xs text-neutral-500">
                {formatDate(achievement.earnedAt)}
              </span>
            )}
            
            {!achievement.unlocked && (
              <Badge variant="secondary" className="text-xs font-normal">Locked</Badge>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Highlight variant with more emphasis
  if (variant === 'highlight') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: animationDelay }}
        className={cn(
          "relative overflow-hidden cursor-pointer group",
          onClick && "hover:shadow-md"
        )}
        onClick={onClick}
      >
        <Card className={cn(
          "border-2 overflow-hidden transition-all",
          achievement.unlocked ? colors.border : "border-dashed border-neutral-200",
        )}>
          <div className={cn(
            "absolute top-0 left-0 w-full h-1",
            achievement.unlocked ? `bg-gradient-to-r ${colors.gradient}` : "bg-neutral-200" 
          )} />
          
          <CardContent className={cn(
            "p-5 transition-colors",
            achievement.unlocked 
              ? "bg-white group-hover:bg-neutral-50"
              : "bg-neutral-50"
          )}>
            <div className="flex items-start">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0",
                styles.iconBg
              )}>
                <div className={styles.iconColor}>
                  {renderIcon(iconName, "h-6 w-6")}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className={cn("font-semibold", styles.titleColor)}>
                    {achievement.title}
                  </h3>
                  
                  {achievement.level && achievement.level > 1 && (
                    <Badge variant={achievement.unlocked ? "default" : "secondary"} className="font-normal">
                      Level {achievement.level}
                    </Badge>
                  )}
                  
                  {showCategory && achievement.category && (
                    <Badge variant="outline" className={cn(
                      "font-normal ml-auto",
                      achievement.unlocked ? categoryColors.text : "text-neutral-500"
                    )}>
                      {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
                    </Badge>
                  )}
                </div>
                
                <p className={cn("text-sm mb-3", styles.descColor)}>
                  {achievement.description}
                </p>
                
                <div className="flex items-center justify-between">
                  {achievement.points ? (
                    <Badge 
                      variant={achievement.unlocked ? "outline" : "secondary"} 
                      className={cn(
                        "font-normal",
                        achievement.unlocked ? colors.text : ""
                      )}
                    >
                      {achievement.points} points
                    </Badge>
                  ) : (
                    <span></span>
                  )}
                  
                  <span className={cn(
                    "text-xs",
                    achievement.unlocked ? "text-neutral-500" : "text-neutral-400"
                  )}>
                    {achievement.unlocked 
                      ? formatDate(achievement.earnedAt)
                      : "Locked"
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      className={cn(
        "cursor-pointer",
        onClick && "hover:shadow-sm"
      )}
      onClick={onClick}
    >
      <Card className={cn(
        "overflow-hidden",
        achievement.unlocked ? "bg-white" : "bg-neutral-50 border-dashed"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
              styles.iconBg
            )}>
              <div className={styles.iconColor}>
                {renderIcon(iconName, "h-6 w-6")}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn("font-semibold", styles.titleColor)}>
                  {achievement.title}
                </h3>
                
                {achievement.level && achievement.level > 1 && (
                  <Badge variant={achievement.unlocked ? "default" : "secondary"} className="font-normal">
                    Level {achievement.level}
                  </Badge>
                )}
              </div>
              
              <p className={cn("text-sm mb-2", styles.descColor)}>
                {achievement.description}
              </p>
              
              <div className="flex items-center justify-between">
                {achievement.points ? (
                  <Badge 
                    variant={achievement.unlocked ? "outline" : "secondary"} 
                    className={cn(
                      "font-normal",
                      achievement.unlocked ? colors.text : ""
                    )}
                  >
                    {achievement.points} points
                  </Badge>
                ) : (
                  <span></span>
                )}
                
                <span className={cn(
                  "text-xs",
                  achievement.unlocked ? "text-neutral-500" : "text-neutral-400"
                )}>
                  {achievement.unlocked 
                    ? formatDate(achievement.earnedAt)
                    : "Locked"
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};