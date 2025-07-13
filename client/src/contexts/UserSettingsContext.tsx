import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserPreferences, Theme, DashboardLayout, AIToneBias } from '@/types/UserPreferenceSchema';

const defaultPreferences: UserPreferences = {
  lastSelectedTab: '',
  theme: 'system',
  dashboardLayout: 'default',
  isOnboardingComplete: false,
  aiToneBias: 'balanced',
  debugMode: false,
  executionMode: 'simulate',
};

interface UserSettingsContextType {
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user-preferences');
      if (stored) {
        try {
          setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
        } catch {
          setPreferences(defaultPreferences);
        }
      }
    }
    // eslint-disable-next-line
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-preferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  const setPreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => setPreferences(defaultPreferences);

  return (
    <UserSettingsContext.Provider value={{ preferences, setPreference, resetPreferences }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettingsContext = () => {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettingsContext must be used within UserSettingsProvider');
  return ctx;
}; 