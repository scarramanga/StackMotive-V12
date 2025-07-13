export type Theme = 'light' | 'dark' | 'system';
export type DashboardLayout = 'default' | 'compact' | 'expanded';
export type AIToneBias = 'contrarian' | 'mainstream' | 'balanced' | 'btc_macro';

export interface DashboardPanelPrefs {
  id: string; // e.g., 'watchlist', 'vaultAllocator', etc.
  visible: boolean;
  pinned: boolean;
  order: number;
}

export interface UserPreferences {
  lastSelectedTab?: string;
  theme: Theme;
  dashboardLayout: DashboardLayout;
  isOnboardingComplete: boolean;
  aiToneBias: AIToneBias;
  showNarrativeOverlay?: boolean;
  debugMode: boolean;
  executionMode: 'simulate' | 'broker' | 'backtest';
  dashboardPanels?: DashboardPanelPrefs[];
  // For future extensibility
  [key: string]: any;
} 