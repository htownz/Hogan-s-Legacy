/**
 * Service to manage user preferences stored in localStorage
 */

// Keys used for localStorage storage
const STORAGE_KEYS = {
  ZIP_CODE: 'userZipCode',
  INTERESTS: 'userInterests',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
};

/**
 * Check if the user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
}

/**
 * Mark onboarding as completed
 */
export function markOnboardingCompleted(): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
}

/**
 * Get the user's ZIP code
 */
export function getUserZipCode(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ZIP_CODE);
}

/**
 * Set the user's ZIP code
 */
export function setUserZipCode(zipCode: string): void {
  localStorage.setItem(STORAGE_KEYS.ZIP_CODE, zipCode);
}

/**
 * Get the user's selected interests
 */
export function getUserInterests(): string[] {
  const interestsJson = localStorage.getItem(STORAGE_KEYS.INTERESTS);
  if (!interestsJson) return [];
  
  try {
    return JSON.parse(interestsJson);
  } catch (e) {
    console.error('Error parsing user interests from localStorage:', e);
    return [];
  }
}

/**
 * Set the user's selected interests
 */
export function setUserInterests(interests: string[]): void {
  localStorage.setItem(STORAGE_KEYS.INTERESTS, JSON.stringify(interests));
}

/**
 * Clear all user preferences
 */
export function clearUserPreferences(): void {
  localStorage.removeItem(STORAGE_KEYS.ZIP_CODE);
  localStorage.removeItem(STORAGE_KEYS.INTERESTS);
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
}

/**
 * Restart the onboarding process
 */
export function restartOnboarding(): void {
  clearUserPreferences();
  // Redirect to onboarding page
  window.location.href = '/onboarding';
}