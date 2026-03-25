// Import icons from Lucide React
import { 
  Home, 
  FileText,
  Star,
  Bell,
  Users,
  Network,
  Lightbulb,
  UserCheck,
  BookOpen,
  Shield,
  PieChart,
  Globe,
  BarChart
} from "lucide-react";

import React from "react";

// Super User Role Constants
export const SUPER_USER_ROLES = ["catalyst", "amplifier", "connector", "advocate", "guardian"] as const;
export type SuperUserRole = typeof SUPER_USER_ROLES[number];

// Named role constants for switch/case usage
export const SUPER_USER_ROLE = {
  CATALYST: "catalyst" as const,
  AMPLIFIER: "amplifier" as const,
  CONNECTOR: "connector" as const,
  ADVOCATE: "advocate" as const,
  GUARDIAN: "guardian" as const,
  CONVINCER: "convincer" as const,
};

export const DEFAULT_SUPER_USER_ROLES = {
  catalyst: {
    name: "Catalyst",
    level: 1,
    progressToNextLevel: 0
  },
  amplifier: {
    name: "Amplifier",
    level: 1,
    progressToNextLevel: 0
  },
  connector: {
    name: "Connector",
    level: 1,
    progressToNextLevel: 0
  },
  advocate: {
    name: "Advocate",
    level: 1,
    progressToNextLevel: 0
  },
  guardian: {
    name: "Guardian",
    level: 1,
    progressToNextLevel: 0
  }
};

// Role Display Information
export const ROLE_DISPLAY_NAMES: Record<SuperUserRole, string> = {
  catalyst: "Catalyst",
  amplifier: "Amplifier",
  connector: "Connector",
  advocate: "Advocate",
  guardian: "Guardian"
};

export const ROLE_DESCRIPTIONS: Record<SuperUserRole, string> = {
  catalyst: "Catalysts drive change through powerful narratives and storytelling. They inspire and motivate others to take action on important legislation.",
  amplifier: "Amplifiers extend reach through digital networks. They ensure legislative information and action opportunities reach the widest possible audience.",
  connector: "Connectors build and strengthen community ties. They create local action circles and facilitate interpersonal connections around legislative issues.",
  advocate: "Advocates directly engage with elected officials. They develop expertise in specific policy areas and mobilize effective advocacy campaigns.",
  guardian: "Guardians ensure accountability and transparency. They verify facts, document official actions, and maintain the integrity of the civic process."
};

export const ROLE_COLORS: Record<SuperUserRole, string> = {
  catalyst: "text-purple-500",
  amplifier: "text-blue-500",
  connector: "text-green-500",
  advocate: "text-amber-500",
  guardian: "text-red-500"
};

export const ROLE_ICONS: Record<SuperUserRole, string> = {
  catalyst: "Flame",
  amplifier: "Megaphone",
  connector: "UsersRound",
  advocate: "MessageSquare",
  guardian: "Shield"
};

// Level Display Information
export const LEVEL_DISPLAY_NAMES: Record<number, string> = {
  1: "Advocate",
  2: "Influencer",
  3: "Super Spreader",
  4: "Movement Builder"
};

// Super Spreader Features by Role
export const SUPER_SPREADER_FEATURES: Record<SuperUserRole, string[]> = {
  catalyst: [
    "Create powerful legislative storytelling",
    "Coach others on effective communication",
    "Lead advocacy campaigns",
    "Create viral content for key bills"
  ],
  amplifier: [
    "Coordinate digital amplification campaigns",
    "Unlock premium sharing tools",
    "Track spread and engagement metrics",
    "Create targeted content distribution"
  ],
  connector: [
    "Create and manage multiple action circles",
    "Facilitate cross-circle collaborations",
    "Coordinate community events",
    "Access advanced networking tools"
  ],
  advocate: [
    "Access to decision-maker contact info",
    "Create policy briefs and talking points",
    "Lead direct advocacy campaigns",
    "Track advocacy effectiveness metrics"
  ],
  guardian: [
    "Verify legislative facts and claims",
    "Monitor representative activity",
    "Submit verified legislative updates", 
    "Contribute to Truth Index ratings"
  ]
};

// Mock data for timeline
export const MOCK_TIMELINE_ITEMS = [
  {
    id: 1,
    date: new Date(Date.now() - 86400000 * 7), // 7 days ago
    title: "Bill HB 1234 Tracked",
    impact: 3,
    description: "Started tracking the Texas Clean Energy Act"
  },
  {
    id: 2,
    date: new Date(Date.now() - 86400000 * 5), // 5 days ago
    title: "Message Sent to Rep. Johnson",
    impact: 5,
    description: "Advocated for support of HB 1234 with detailed policy points"
  },
  {
    id: 3,
    date: new Date(Date.now() - 86400000 * 3), // 3 days ago
    title: "Shared Bill Information",
    impact: 12,
    description: "Shared information about HB 1234 on social media"
  },
  {
    id: 4,
    date: new Date(Date.now() - 86400000 * 1), // 1 day ago
    title: "Created Action Circle",
    impact: 8,
    description: "Created 'Clean Energy Advocates' action circle with 5 members"
  }
];

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login", 
    LOGOUT: "/api/auth/logout"
  },
  USERS: {
    ME: "/api/users/me",
    ROLE: "/api/users/me/role",
    MILESTONES: "/api/users/me/milestones",
    CHALLENGES: "/api/users/me/challenges",
    NETWORK_IMPACT: "/api/users/me/network-impact"
  },
  CHALLENGES: {
    ALL: "/api/challenges"
  },
  ACTION_CIRCLES: {
    ALL: "/api/action-circles",
    MEMBERS: (id: number) => `/api/action-circles/${id}/members`,
    ACTIONS: (id: number) => `/api/action-circles/${id}/actions`
  },
  REPRESENTATIVES: {
    ALL: "/api/representatives",
    BY_DISTRICT: (district: string) => `/api/representatives?district=${district}`,
    RESPONSES: (id: number) => `/api/representatives/${id}/responses`
  },
  TIPPING_POINT: {
    METRICS: "/api/tipping-point/metrics"
  },
  LEGISLATION: {
    BILLS: "/api/legislation/bills",
    TRACKED: "/api/legislation/tracked",
    TRACK: "/api/legislation/track",
    SEARCH: (query: string) => `/api/legislation/search?query=${encodeURIComponent(query)}`,
    BILL_DETAIL: (id: string) => `/api/legislation/bills/${id}`
  },
  ADVOCACY: {
    TEMPLATES: "/api/advocacy/templates",
    REPRESENTATIVES: "/api/advocacy/representatives",
    SEND: "/api/advocacy/send",
    HISTORY: "/api/advocacy/history",
    IMPACT: "/api/advocacy/impact"
  },
  AWS: {
    STATUS: "/api/aws/status",
    FILES: "/api/aws/files",
    UPLOAD_URL: "/api/aws/generate-upload-url",
    DOWNLOAD_URL: (fileKey: string) => `/api/aws/generate-download-url/${fileKey}`,
    DELETE_FILE: (fileKey: string) => `/api/aws/files/${fileKey}`
  }
};

// Navigation
export const NAVIGATION_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
  { name: "Legislation", path: "/legislation", icon: "GavelIcon" },
  { name: "Committee Meetings", path: "/committee-meetings", icon: "Calendar" },
  { name: "Action Center", path: "/action-center", icon: "Megaphone" },
  { name: "Government Watch", path: "/government-watch", icon: "Eye" },
  { name: "Truth Index", path: "/truth-index", icon: "LineChart" },
  { name: "Action Circles", path: "/action-circles", icon: "UsersRound" },
  { name: "Challenges", path: "/challenges", icon: "Trophy" },
  { name: "Training", path: "/training", icon: "GraduationCap" },
  { name: "Resources", path: "/resources", icon: "BookOpen" },
  { name: "Settings", path: "/settings", icon: "Settings" }
];

// Navigation Items for Sidebar & Mobile Header
export const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: React.createElement(Home, { className: "w-5 h-5" }) },
  { name: "Legislation", path: "/legislation", icon: React.createElement(FileText, { className: "w-5 h-5" }) },
  { name: "Recommendations", path: "/recommendations", icon: React.createElement(Star, { className: "w-5 h-5" }) },
  { name: "War Room", path: "/war-room", icon: React.createElement(Bell, { className: "w-5 h-5" }) },
  { name: "Action Circles", path: "/action-circles", icon: React.createElement(Users, { className: "w-5 h-5" }) },
  { name: "My Network", path: "/network", icon: React.createElement(Network, { className: "w-5 h-5" }) },
  { name: "Role Assistant", path: "/ai-assistant", icon: React.createElement(Lightbulb, { className: "w-5 h-5" }) },
  { name: "Representatives", path: "/representatives", icon: React.createElement(UserCheck, { className: "w-5 h-5" }) },
  { name: "Resources", path: "/resources", icon: React.createElement(BookOpen, { className: "w-5 h-5" }) },
  { name: "Verification", path: "/verification", icon: React.createElement(Shield, { className: "w-5 h-5" }) },
  { name: "Civic Impact", path: "/civic-impact", icon: React.createElement(PieChart, { className: "w-5 h-5" }) },
  { name: "Community Impact", path: "/community-impact", icon: React.createElement(Globe, { className: "w-5 h-5" }) },
  { name: "Activity Dashboard", path: "/activity-dashboard", icon: React.createElement(BarChart, { className: "w-5 h-5" }) }
];

// Challenge categories
export const CHALLENGE_CATEGORIES = ["civic engagement", "advocacy", "community building", "education", "all"];

// Bill status options
export const BILL_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "introduced", label: "Introduced" },
  { value: "in_committee", label: "In Committee" },
  { value: "passed_house", label: "Passed House" },
  { value: "passed_senate", label: "Passed Senate" },
  { value: "signed", label: "Signed" },
  { value: "vetoed", label: "Vetoed" }
];

// Chamber options
export const CHAMBER_OPTIONS = [
  { value: "all", label: "All Chambers" },
  { value: "house", label: "House" },
  { value: "senate", label: "Senate" }
];

export const TIPPING_POINT_THRESHOLD = 25;

export const MOCK_NETWORK_USERS = [
  { id: 1, name: "Alex T.", actionCount: 12, position: { x: -80, y: -60 } },
  { id: 2, name: "Maria L.", actionCount: 8, position: { x: 70, y: -40 } },
  { id: 3, name: "James R.", actionCount: 5, position: { x: -60, y: 50 } },
  { id: 4, name: "Sarah K.", actionCount: 15, position: { x: 80, y: 60 } },
  { id: 5, name: "David M.", actionCount: 3, position: { x: -30, y: -90 } },
];