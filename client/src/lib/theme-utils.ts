import type { ThemeRecommendation, UserThemePreferences } from '@shared/types';

/**
 * Convert hex color to HSL components 
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove the # if present
  hex = hex.replace(/^#/, '');

  // Parse the r, g, b values
  let r = parseInt(hex.slice(0, 2), 16) / 255;
  let g = parseInt(hex.slice(2, 4), 16) / 255;
  let b = parseInt(hex.slice(4, 6), 16) / 255;

  // Find min and max values of r, g, b
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60;
    } else if (max === b) {
      h = ((r - g) / d + 4) * 60;
    }
  }

  return { h, s, l };
}

/**
 * Convert HSL components to hex color string
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = h % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  
  // If lightness is 0, the color is black
  if (l === 0) return '#000000';
  
  // If lightness is 1, the color is white
  if (l === 1) return '#ffffff';
  
  // If saturation is 0, the color is a shade of gray
  if (s === 0) {
    const value = Math.round(l * 255);
    return `#${value.toString(16).padStart(2, '0').repeat(3)}`;
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const r = hue2rgb(p, q, (h / 360) + 1/3);
  const g = hue2rgb(p, q, h / 360);
  const b = hue2rgb(p, q, (h / 360) - 1/3);

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust emotion theme intensity based on user preference
 */
export function adjustIntensity(
  color: string, 
  baseColor: string, 
  intensity: 'subtle' | 'moderate' | 'strong'
): string {
  const base = hexToHSL(baseColor);
  const emotion = hexToHSL(color);
  
  // Intensity factors (how much of the emotion color to use)
  const factors = {
    subtle: 0.3,
    moderate: 0.6,
    strong: 0.9
  };
  
  const factor = factors[intensity];
  
  // Blend the colors based on intensity
  const h = base.h + (emotion.h - base.h) * factor;
  const s = base.s + (emotion.s - base.s) * factor;
  const l = base.l; // Keep original lightness
  
  return hslToHex(h, s, l);
}

/**
 * Apply theme recommendation based on intensity setting
 */
export function applyThemeRecommendation(
  recommendation: ThemeRecommendation,
  intensity: 'subtle' | 'moderate' | 'strong'
) {
  // Base colors from design system
  const baseColors = {
    primary: '#3b82f6', // blue-500 
    secondary: '#f97316', // orange-500
    accent: '#8b5cf6' // violet-500
  };
  
  // Adjust theme colors based on emotion and intensity
  const primaryColor = adjustIntensity(recommendation.primaryColor, baseColors.primary, intensity);
  const secondaryColor = adjustIntensity(recommendation.secondaryColor, baseColors.secondary, intensity);
  const accentColor = adjustIntensity(recommendation.accentColor, baseColors.accent, intensity);
  
  // Set mode based on emotional mood
  // Negative emotions use dark mode, positive use light
  const mode = recommendation.mood === 'negative' ? 'dark' : 'light';
  
  // Apply theme to document
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.style.setProperty('--primary', primaryColor);
  document.documentElement.style.setProperty('--secondary', secondaryColor);
  document.documentElement.style.setProperty('--accent', accentColor);
  
  // Return theme object for context
  return {
    primaryColor,
    secondaryColor,
    accentColor,
    mode
  };
}

/**
 * Get theme from user preferences (when emotion theming is disabled)
 */
export function getThemeFromPreferences(preferences: UserThemePreferences) {
  const mode = preferences.defaultTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preferences.defaultTheme;
  
  const primaryColor = preferences.themeColorOverride || 'hsl(var(--primary))';
  
  return {
    primaryColor,
    secondaryColor: 'hsl(var(--secondary))',
    accentColor: 'hsl(var(--accent))',
    mode: mode as 'light' | 'dark'
  };
}