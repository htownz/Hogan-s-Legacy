// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserThemePreferences, ThemeRecommendation } from '@shared/types';
import { applyThemeRecommendation, getThemeFromPreferences } from '@/lib/theme-utils';
import { apiRequest } from '@/lib/queryClient';

interface EmotionThemeContextType {
  // Theme state
  currentTheme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    mode: 'light' | 'dark';
  };
  themeRecommendation: ThemeRecommendation | null;
  themePreferences: UserThemePreferences | null;
  
  // Loading states
  isLoadingPreferences: boolean;
  isLoadingRecommendation: boolean;
  
  // Methods
  updateThemePreferences: (preferences: UserThemePreferences) => Promise<void>;
  refreshThemeRecommendation: (billId?: string, committeeId?: string) => Promise<void>;
}

const defaultTheme = {
  primaryColor: 'hsl(var(--primary))',
  secondaryColor: 'hsl(var(--secondary))',
  accentColor: 'hsl(var(--accent))',
  mode: 'light' as const
};

const EmotionThemeContext = createContext<EmotionThemeContextType>({
  currentTheme: defaultTheme,
  themeRecommendation: null,
  themePreferences: null,
  isLoadingPreferences: false,
  isLoadingRecommendation: false,
  updateThemePreferences: async () => {},
  refreshThemeRecommendation: async () => {},
});

export function EmotionThemeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  
  // Fetch user theme preferences
  const { 
    data: themePreferences,
    isLoading: isLoadingPreferences,
  } = useQuery<any>({
    queryKey: ['/api/theme/preferences'],
    queryFn: async () => {
      try {
        const response = await apiRequest<UserThemePreferences>('/api/theme/preferences');
        return response;
      } catch (error) {
        console.error('Failed to fetch theme preferences:', error);
        return null;
      }
    }
  });
  
  // Theme recommendation mutation
  const getThemeRecommendation = useMutation({
    mutationFn: async ({ 
      billId, 
      committeeId 
    }: { 
      billId?: string; 
      committeeId?: string;
    }) => {
      if (billId) {
        return await apiRequest<ThemeRecommendation>(`/api/theme/bill/${billId}`);
      } else if (committeeId) {
        return await apiRequest<ThemeRecommendation>(`/api/theme/committee/${committeeId}`);
      } else {
        return await apiRequest<ThemeRecommendation>('/api/theme/default');
      }
    }
  });
  
  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (preferences: UserThemePreferences) => {
      return await apiRequest<UserThemePreferences>('/api/theme/preferences', {
        method: 'POST',
        data: preferences
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/theme/preferences'] });
    }
  });
  
  // Apply theme based on preferences and recommendation
  useEffect(() => {
    if (!themePreferences) return;
    
    // If emotion theming is disabled, apply the default theme from preferences
    if (!themePreferences.useEmotionTheming) {
      const theme = getThemeFromPreferences(themePreferences);
      setCurrentTheme(theme);
      
      // Apply theme to document
      document.documentElement.setAttribute(
        'data-theme', 
        themePreferences.defaultTheme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : themePreferences.defaultTheme
      );
      
      if (themePreferences.themeColorOverride) {
        document.documentElement.style.setProperty('--primary', themePreferences.themeColorOverride);
      }
    } 
    // If emotion theming is enabled and we have a recommendation, apply it
    else if (getThemeRecommendation.data) {
      const intensity = themePreferences.emotionThemeIntensity;
      const theme = applyThemeRecommendation(getThemeRecommendation.data, intensity);
      setCurrentTheme(theme);
    }
    // Otherwise, get the default recommendation
    else {
      refreshThemeRecommendation();
    }
  }, [themePreferences, getThemeRecommendation.data]);
  
  const updateThemePreferences = async (preferences: UserThemePreferences) => {
    await updatePreferences.mutateAsync(preferences);
  };
  
  const refreshThemeRecommendation = async (billId?: string, committeeId?: string) => {
    await getThemeRecommendation.mutateAsync({ billId, committeeId });
  };
  
  return (
    <EmotionThemeContext.Provider
      value={{
        currentTheme,
        themeRecommendation: getThemeRecommendation.data || null,
        themePreferences,
        isLoadingPreferences,
        isLoadingRecommendation: getThemeRecommendation.isPending,
        updateThemePreferences,
        refreshThemeRecommendation,
      }}
    >
      {children}
    </EmotionThemeContext.Provider>
  );
}

export const useEmotionTheme = () => useContext(EmotionThemeContext);