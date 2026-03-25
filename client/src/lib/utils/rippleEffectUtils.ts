// @ts-nocheck
import { ImpactTimelineItem } from "../types";
import { MOCK_TIMELINE_ITEMS } from "../constants";

/**
 * Formats a number with proper comma separators
 * @param num - The number to format
 * @returns The formatted number string
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

/**
 * Formats a relative timestamp for the timeline
 * @param date - The date to format
 * @returns A human-readable relative timestamp
 */
export const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? "1 year ago" : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? "1 month ago" : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? "1 day ago" : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
  }
  
  return "Just now";
};

/**
 * Gets the class name for the icon based on its type
 * @param iconType - The type of the icon (share, verify, contact, resource, etc.)
 * @returns The Tailwind class name
 */
export const getIconClassName = (iconType: string): string => {
  switch (iconType) {
    case "share":
      return "bg-primary-50 text-primary border-primary-200";
    case "verify":
      return "bg-secondary-50 text-secondary border-secondary-200";
    case "contact":
      return "bg-amber-50 text-amber-600 border-amber-200";
    case "resource":
      return "bg-indigo-50 text-indigo-600 border-indigo-200";
    case "catalyst":
      return "bg-success bg-opacity-10 text-success";
    case "amplifier":
      return "bg-primary bg-opacity-10 text-primary";
    case "convincer":
      return "bg-accent bg-opacity-10 text-accent";
    case "community":
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
};

/**
 * Gets dummy timeline items for development
 * @returns Array of impact timeline items
 */
export const getTimelineItems = (): ImpactTimelineItem[] => {
  return MOCK_TIMELINE_ITEMS;
};

/**
 * Calculates the total influence based on direct and secondary reach
 * @param directInfluence - Number of people directly influenced
 * @param secondaryReach - Number of people influenced indirectly
 * @returns The total influence count
 */
export const calculateTotalInfluence = (
  directInfluence: number,
  secondaryReach: number
): number => {
  return directInfluence + secondaryReach;
};
