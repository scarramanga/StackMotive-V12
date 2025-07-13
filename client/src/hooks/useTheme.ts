import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Block 20: Theme Toggle - Frontend Hook with API Integration

export interface ThemePreferences {
  theme_mode: 'light' | 'dark' | 'auto' | 'system';
  accent_color: string;
  font_size: 'small' | 'medium' | 'large';
  high_contrast: boolean;
  reduce_motion: boolean;
  compact_mode: boolean;
  sidebar_collapsed: boolean;
}

export interface ThemePreferencesResponse {
  id: string;
  user_id: string;
  preferences: ThemePreferences;
  applied_at: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  theme_mode: 'light',
  accent_color: '#3B82F6',
  font_size: 'medium',
  high_contrast: false,
  reduce_motion: false,
  compact_mode: false,
  sidebar_collapsed: false
};

export const useTheme = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ThemePreferences>(DEFAULT_THEME_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Apply theme to document
  const applyTheme = useCallback((prefs: ThemePreferences) => {
    const root = document.documentElement;
    
    // Apply theme mode
    if (prefs.theme_mode === 'dark') {
      root.classList.add('dark');
    } else if (prefs.theme_mode === 'light') {
      root.classList.remove('dark');
    } else if (prefs.theme_mode === 'system' || prefs.theme_mode === 'auto') {
      // Follow system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // Apply accent color
    root.style.setProperty('--accent-color', prefs.accent_color);
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[prefs.font_size]);
    
    // Apply accessibility settings
    if (prefs.high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (prefs.reduce_motion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    if (prefs.compact_mode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
    
    // Update state
    setPreferences(prefs);
  }, []);

  // Load theme preferences from API or localStorage
  const loadThemePreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (user) {
        // Load from API
        const response = await fetch(`/api/theme/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data: ThemePreferencesResponse = await response.json();
          applyTheme(data.preferences);
          setLastSynced(data.updated_at);
          
          // Cache in localStorage as backup
          localStorage.setItem('theme-preferences', JSON.stringify(data.preferences));
        } else {
          throw new Error('Failed to load theme preferences from server');
        }
      } else {
        // Load from localStorage as fallback
        const cached = localStorage.getItem('theme-preferences');
        if (cached) {
          const cachedPrefs = JSON.parse(cached) as ThemePreferences;
          applyTheme(cachedPrefs);
        } else {
          applyTheme(DEFAULT_THEME_PREFERENCES);
        }
      }
    } catch (err) {
      console.error('Error loading theme preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load theme preferences');
      
      // Fallback to localStorage
      const cached = localStorage.getItem('theme-preferences');
      if (cached) {
        try {
          const cachedPrefs = JSON.parse(cached) as ThemePreferences;
          applyTheme(cachedPrefs);
        } catch {
          applyTheme(DEFAULT_THEME_PREFERENCES);
        }
      } else {
        applyTheme(DEFAULT_THEME_PREFERENCES);
      }
    } finally {
      setLoading(false);
    }
  }, [user, applyTheme]);

  // Save theme preferences to API and localStorage
  const saveThemePreferences = useCallback(async (newPreferences: Partial<ThemePreferences>) => {
    try {
      setError(null);
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Apply immediately for responsiveness
      applyTheme(updatedPreferences);
      
      // Save to localStorage immediately
      localStorage.setItem('theme-preferences', JSON.stringify(updatedPreferences));

      if (user) {
        // Save to API
        const response = await fetch(`/api/theme/${user.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            preferences: updatedPreferences
          })
        });

        if (response.ok) {
          const data = await response.json();
          setLastSynced(new Date().toISOString());
          console.log('Theme preferences saved to server:', data.message);
        } else {
          throw new Error('Failed to save theme preferences to server');
        }
      }
    } catch (err) {
      console.error('Error saving theme preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save theme preferences');
      
      // Keep the applied changes even if server save fails
      // The localStorage backup will persist the changes
    }
  }, [user, preferences, applyTheme]);

  // Reset theme preferences to default
  const resetThemePreferences = useCallback(async () => {
    try {
      setError(null);
      
      if (user) {
        // Reset on server
        const response = await fetch(`/api/theme/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          applyTheme(data.preferences);
          setLastSynced(new Date().toISOString());
        } else {
          throw new Error('Failed to reset theme preferences on server');
        }
      } else {
        applyTheme(DEFAULT_THEME_PREFERENCES);
      }
      
      // Reset localStorage
      localStorage.setItem('theme-preferences', JSON.stringify(DEFAULT_THEME_PREFERENCES));
      
    } catch (err) {
      console.error('Error resetting theme preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset theme preferences');
      
      // Fallback to local reset
      applyTheme(DEFAULT_THEME_PREFERENCES);
      localStorage.setItem('theme-preferences', JSON.stringify(DEFAULT_THEME_PREFERENCES));
    }
  }, [user, applyTheme]);

  // Sync theme across devices/tabs
  const syncThemePreferences = useCallback(async (source: string = 'manual') => {
    if (!user) return;
    
    try {
      setError(null);
      
      const response = await fetch(`/api/theme/sync/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: navigator.userAgent,
          sync_source: source,
          preferences: preferences
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLastSynced(data.sync_timestamp);
        console.log('Theme preferences synced:', data.message);
      } else {
        throw new Error('Failed to sync theme preferences');
      }
    } catch (err) {
      console.error('Error syncing theme preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync theme preferences');
    }
  }, [user, preferences]);

  // Listen for system theme changes
  useEffect(() => {
    if (preferences.theme_mode === 'system' || preferences.theme_mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme(preferences);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [preferences.theme_mode, preferences, applyTheme]);

  // Load preferences on mount and user change
  useEffect(() => {
    loadThemePreferences();
  }, [loadThemePreferences]);

  // Auto-sync on visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        syncThemePreferences('auto_sync');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, syncThemePreferences]);

  // Convenience functions for common theme operations
  const toggleTheme = useCallback(() => {
    const newMode = preferences.theme_mode === 'light' ? 'dark' : 'light';
    saveThemePreferences({ theme_mode: newMode });
  }, [preferences.theme_mode, saveThemePreferences]);

  const setThemeMode = useCallback((mode: ThemePreferences['theme_mode']) => {
    saveThemePreferences({ theme_mode: mode });
  }, [saveThemePreferences]);

  const setAccentColor = useCallback((color: string) => {
    saveThemePreferences({ accent_color: color });
  }, [saveThemePreferences]);

  const setFontSize = useCallback((size: ThemePreferences['font_size']) => {
    saveThemePreferences({ font_size: size });
  }, [saveThemePreferences]);

  const toggleSidebar = useCallback(() => {
    saveThemePreferences({ sidebar_collapsed: !preferences.sidebar_collapsed });
  }, [preferences.sidebar_collapsed, saveThemePreferences]);

  const toggleCompactMode = useCallback(() => {
    saveThemePreferences({ compact_mode: !preferences.compact_mode });
  }, [preferences.compact_mode, saveThemePreferences]);

  const toggleHighContrast = useCallback(() => {
    saveThemePreferences({ high_contrast: !preferences.high_contrast });
  }, [preferences.high_contrast, saveThemePreferences]);

  const toggleReduceMotion = useCallback(() => {
    saveThemePreferences({ reduce_motion: !preferences.reduce_motion });
  }, [preferences.reduce_motion, saveThemePreferences]);

  return {
    // State
    preferences,
    loading,
    error,
    lastSynced,
    
    // Actions
    saveThemePreferences,
    resetThemePreferences,
    syncThemePreferences,
    loadThemePreferences,
    
    // Convenience methods
    toggleTheme,
    setThemeMode,
    setAccentColor,
    setFontSize,
    toggleSidebar,
    toggleCompactMode,
    toggleHighContrast,
    toggleReduceMotion,
    
    // Computed values
    isDark: preferences.theme_mode === 'dark' || 
           (preferences.theme_mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
    isLight: preferences.theme_mode === 'light' || 
            (preferences.theme_mode === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches),
    isSystemMode: preferences.theme_mode === 'system' || preferences.theme_mode === 'auto'
  };
}; 