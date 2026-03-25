import { useState, useEffect } from 'react';

// Hook to detect if a media query matches
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Initialize on client-side only
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set initial value
      setMatches(media.matches);
      
      // Define listener function
      const listener = () => {
        setMatches(media.matches);
      };
      
      // Add event listener
      media.addEventListener('change', listener);
      
      // Clean up
      return () => media.removeEventListener('change', listener);
    }
    
    return undefined;
  }, [query]);
  
  return matches;
}

// Specific mobile detection hook
export function useMobileDetection(): boolean {
  return useMediaQuery('(max-width: 640px)');
}

// Specific tablet detection hook
export function useTabletDetection(): boolean {
  return useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
}

// Specific desktop detection hook
export function useDesktopDetection(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

// Hook to get responsive size category
export function useDeviceSize(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useMobileDetection();
  const isTablet = useTabletDetection();
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

// Hook to check if touch is supported
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    // Check if touch is supported
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;
      
      setIsTouch(hasTouch);
    }
  }, []);
  
  return isTouch;
}