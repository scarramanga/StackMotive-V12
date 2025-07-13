import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { UserPreferences, Theme, DashboardLayout, AIToneBias } from '@/types/UserPreferenceSchema';

export default function useUserPreferences() {
  const { preferences, setPreference, resetPreferences } = useUserSettingsContext();

  return {
    preferences,
    setPreference,
    resetPreferences,
    // Helpers for each preference
    setLastSelectedTab: (tab: string) => setPreference('lastSelectedTab', tab),
    setTheme: (theme: Theme) => setPreference('theme', theme),
    setDashboardLayout: (layout: DashboardLayout) => setPreference('dashboardLayout', layout),
    setOnboardingComplete: (complete: boolean) => setPreference('isOnboardingComplete', complete),
    setAIToneBias: (bias: AIToneBias) => setPreference('aiToneBias', bias),
  };
} 