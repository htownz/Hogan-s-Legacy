// @ts-nocheck
import { LEVEL_DISPLAY_NAMES } from "../constants";
import { SuperUserRoleType, SuperUserLevelType } from "../types";

/**
 * Calculates the amount remaining to reach the next level
 * @param currentProgress - The current progress percentage
 * @returns The remaining percentage to reach 100%
 */
export const calculateRemainingProgress = (currentProgress: number): number => {
  return 100 - currentProgress;
};

/**
 * Formats the level and role into a display string
 * @param level - The level number (1-4)
 * @param role - The role type
 * @returns Formatted string like "Level 2: Influencer"
 */
export const formatLevelDisplay = (level: number, role?: SuperUserRoleType): string => {
  const levelName = LEVEL_DISPLAY_NAMES[level as keyof typeof LEVEL_DISPLAY_NAMES] || "Unknown";
  return `Level ${level}: ${levelName}`;
};

/**
 * Gets the next level name based on the current level
 * @param level - The current level number (1-4)
 * @returns The name of the next level, or null if at max level
 */
export const getNextLevelName = (level: number): string | null => {
  if (level >= 4) return null;
  return LEVEL_DISPLAY_NAMES[(level + 1) as keyof typeof LEVEL_DISPLAY_NAMES];
};

/**
 * Maps level number to level type
 * @param level - The level number (1-4)
 * @returns The corresponding level type
 */
export const mapLevelNumberToType = (level: number): SuperUserLevelType => {
  switch (level) {
    case 1:
      return "advocate";
    case 2:
      return "influencer";
    case 3:
      return "super-spreader";
    case 4:
      return "movement-builder";
    default:
      return "advocate";
  }
};

/**
 * Calculates the remaining actions needed to reach the next level
 * @param role - The role type
 * @param progressPercentage - The current progress percentage
 * @returns A message indicating remaining actions
 */
export const getRemainingActionsMessage = (
  role: SuperUserRoleType,
  progressPercentage: number
): string => {
  // Calculate approximate remaining actions based on role and progress
  let remainingActions: number;
  let actionType: string;

  switch (role) {
    case "catalyst":
      remainingActions = Math.ceil((100 - progressPercentage) / 7); // Roughly 7% per verified fact
      actionType = remainingActions === 1 ? "verified fact" : "verified facts";
      break;
    case "amplifier":
      remainingActions = Math.ceil((100 - progressPercentage) / 10); // Roughly 10% per network action
      actionType = remainingActions === 1 ? "network action" : "network actions";
      break;
    case "convincer":
      remainingActions = Math.ceil((100 - progressPercentage) / 8); // Roughly 8% per persuasive action
      actionType = remainingActions === 1 ? "persuasive action" : "persuasive actions";
      break;
    default:
      remainingActions = Math.ceil((100 - progressPercentage) / 5);
      actionType = "actions";
  }

  return `${remainingActions} more ${actionType} needed`;
};

/**
 * Formats a movement progress percentage from integer (42) to string format (4.2%)
 * @param percentage - The percentage value (multiplied by 10)
 * @returns Formatted percentage string
 */
export const formatMovementPercentage = (percentage: number): string => {
  return (percentage / 10).toFixed(1) + "%";
};

/**
 * Calculates the progress towards the target percentage
 * @param current - The current percentage (multiplied by 10)
 * @param target - The target percentage (multiplied by 10)
 * @returns The percentage of progress towards the target (0-100)
 */
export const calculateProgressTowardsTarget = (current: number, target: number): number => {
  return Math.min(100, Math.round((current / target) * 100));
};
