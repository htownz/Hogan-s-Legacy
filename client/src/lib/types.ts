// User related types
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  displayName?: string | null;
  district?: string;
  profileImageUrl?: string;
  createdAt?: string;
}

// Super User Program types
export type SuperUserRoleType = 'catalyst' | 'amplifier' | 'convincer';
export type SuperUserLevelType = 1 | 2 | 3 | 4;

export interface SuperUserRole {
  id: number;
  userId: number;
  role: SuperUserRoleType;
  level: SuperUserLevelType;
  progressToNextLevel: number;
}

export interface ProgressionMilestone {
  id: number;
  userId: number;
  role: SuperUserRoleType;
  targetLevel: SuperUserLevelType;
  milestone: string;
  progress: number;
  total: number;
  completed?: boolean;
}

// Challenge system types
export interface Challenge {
  id: number;
  title: string;
  description: string;
  role: SuperUserRoleType;
  level: SuperUserLevelType;
  rewardPoints: number;
  category: string;
}

export interface UserChallenge {
  id: number;
  userId: number;
  challengeId: number;
  progress: number;
  total: number;
  completed: boolean;
  challenge?: Challenge;
}

// Action Circles types
export interface ActionCircle {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  category: string;
  isPublic: boolean;
  createdAt: string;
  memberCount?: number;
}

export interface CircleMember {
  id: number;
  circleId: number;
  userId: number;
  isActive: boolean;
  joinedAt: string;
  user?: User;
}

export interface CircleAction {
  id: number;
  circleId: number;
  title: string;
  description: string;
  actionType: string;
  dueDate?: string;
  createdAt: string;
  completedCount?: number;
}

export interface UserCircleAction {
  id: number;
  userId: number;
  actionId: number;
  completed: boolean;
  completedAt?: string;
}

// Legislation tracking types
export interface Bill {
  id: number;
  billNumber: string;
  session: string;
  title: string;
  summary?: string;
  status: string;
  authors?: string[];
  committee?: string;
  introducedDate?: string;
  lastUpdateDate?: string;
  link?: string;
  voteDate?: string;
  voteResult?: string;
}

export interface BillAction {
  id: number;
  billId: number;
  action: string;
  date: string;
  description?: string;
}

export interface BillSupport {
  id: number;
  billId: number;
  userId: number;
  support: boolean;
  createdAt: string;
}

export interface BillComment {
  id: number;
  billId: number;
  userId: number;
  comment: string;
  createdAt: string;
  user?: User;
}

// Representative tracking types
export interface Representative {
  id: number;
  name: string;
  district: string;
  party: string;
  position: string;
  contactInfo?: string;
  photoUrl?: string;
}

export interface UserRepTracking {
  id: number;
  userId: number;
  repId: number;
  isTracking: boolean;
}

export interface RepResponse {
  id: number;
  repId: number;
  billId: number;
  stance: string;
  comment?: string;
  responseDate: string;
}

// Tipping point metrics
export interface TippingPointMetric {
  id: number;
  district: string;
  totalVoters: number;
  actUpUsers: number;
  percentageReached: number;
  lastUpdated: string;
}

export interface UserNetworkImpact {
  id: number;
  userId: number;
  usersInvited: number;
  activeUsers: number;
  actionsInspired: number;
  totalReach: number;
  r0Value: number;
}

// Social Network types
export interface UserInvitation {
  id: number;
  inviterId: number;
  email: string;
  name: string;
  message?: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  inviter?: User;
}

export interface UserConnection {
  id: number;
  userId: number;
  connectedUserId: number;
  strength: number;
  createdAt: string;
  lastInteractionAt: string;
  connectedUser?: User;
}

export interface ConnectionActivity {
  id: number;
  userId: number;
  connectedUserId: number;
  activityType: string;
  description: string;
  createdAt: string;
  connectedUser?: User;
}

export interface NetworkShare {
  id: number;
  userId: number;
  shareType: string;
  contentId: string;
  contentType: string;
  shareUrl: string;
  clickCount: number;
  conversionCount: number;
  createdAt: string;
}

export interface ShareClickEvent {
  id: number;
  shareId: number;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  convertedToSignup: boolean;
  createdAt: string;
}

export interface ChallengeWithProgress extends Challenge {
  userProgress: number;
  userTotal: number;
  userCompleted: boolean;
  userStarted: boolean;
  requiredLevel: number;
  daysAvailable: number;
  rewardBadges: string[];
}

export interface ActionCircleWithMembers extends ActionCircle {
  iconType?: string;
  active?: boolean;
  recentActions?: number;
  updatedAt?: string;
  isActive?: boolean;
  members: Array<{ id: number; avatarUrl?: string }>;
}

export interface SuperUserRoleWithLevel extends SuperUserRole {
  name?: string;
  levelName?: string;
  selectedAsMain?: boolean;
  progressPercentage: number;
  metrics?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImpactTimelineItem {
  id: number;
  iconType: string;
  actionType: string;
  content: string;
  timestamp: Date;
  impactCount: number;
}

export interface RippleEffect {
  id: number;
  userId: number;
  directInfluence: number;
  secondaryReach: number;
  totalImpact: number;
  updatedAt: Date;
}

export interface NextLevelFeature {
  id: number;
  title: string;
}

export interface NetworkUser {
  id: number;
  name: string;
  imageUrl?: string;
  actionCount: number;
  position: { x: number; y: number };
}

export interface MovementMetrics {
  id: number;
  currentPercentage: number;
  formattedCurrentPercentage: string;
  targetPercentage: number;
  activeSuperUsers: number;
  recentGrowthPercentage: number;
  formattedRecentGrowthPercentage: string;
  progressTowardsTarget: number;
  updatedAt: Date;
}