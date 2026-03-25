import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "catalyst": return "text-blue-600";
    case "amplifier": return "text-purple-600";
    case "convincer": return "text-orange-600";
    default: return "text-primary";
  }
}

export function getRoleBgColor(role: string): string {
  switch (role) {
    case "catalyst": return "bg-blue-500";
    case "amplifier": return "bg-purple-500";
    case "convincer": return "bg-orange-500";
    default: return "bg-primary";
  }
}

export function getRoleBgLightColor(role: string): string {
  switch (role) {
    case "catalyst": return "bg-blue-50";
    case "amplifier": return "bg-purple-50";
    case "convincer": return "bg-orange-50";
    default: return "bg-gray-50";
  }
}

export function getProgressColor(role: string): string {
  switch (role) {
    case "catalyst": return "bg-blue-500";
    case "amplifier": return "bg-purple-500";
    case "convincer": return "bg-orange-500";
    default: return "bg-primary";
  }
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "catalyst": return "Catalyst";
    case "amplifier": return "Amplifier";
    case "convincer": return "Convincer";
    default: return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

export function getRoleIcon(role: string): string {
  switch (role) {
    case "catalyst": return "sparkles";
    case "amplifier": return "megaphone";
    case "convincer": return "users";
    default: return "message-square";
  }
}

export function getLevelName(level: number): string {
  switch (level) {
    case 1: return "Advocate";
    case 2: return "Influencer";
    case 3: return "Super Spreader";
    case 4: return "Movement Builder";
    default: return "Advocate";
  }
}

export function getLevelDisplayName(level: number, role: string): string {
  const roleName = getRoleDisplayName(role);
  const levelName = getLevelName(level);
  return `${roleName} ${levelName}`;
}

export function getProgressToNextLevel(level: number, levelProgress: number): string {
  if (level >= 4) return "Max level reached";
  return `${Math.round(levelProgress)}% to Level ${level + 1}`;
}

export function getChallengeStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "completed": return "bg-green-100 text-green-800 border-green-200";
    case "in progress": return "bg-blue-100 text-blue-800 border-blue-200";
    case "not started": return "bg-gray-100 text-gray-800 border-gray-200";
    default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
}

export function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "active": return "bg-green-100 text-green-800 border-green-200";
    case "forming": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
    case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function formatPercentage(value: number): string {
  if (Number.isInteger(value)) return `${value}%`;
  return `${value.toFixed(1)}%`;
}