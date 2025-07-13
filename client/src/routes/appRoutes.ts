import { MarketOverviewPanel } from '../components/panels/MarketOverviewPanel';
import { PreferencesPanel } from '../components/panels/PreferencesPanel';

// Block 61 Implementation
export const appRoutes = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', requiresAuth: true, requiresVault: true },
  { id: 'journal', path: '/journal', label: 'Journal', requiresAuth: true, requiresVault: false },
  { id: 'vault', path: '/vault', label: 'Vault', requiresAuth: true, requiresVault: false },
  { id: 'settings', path: '/settings', label: 'Settings', requiresAuth: true, requiresVault: false },
  { id: 'watchlist', path: '/watchlist', label: 'Watchlist', requiresAuth: true, requiresVault: false },
  { id: 'onboarding', path: '/onboarding', label: 'Onboarding', requiresAuth: false, requiresVault: false },
  {
    path: '/dashboard/market',
    element: null // Use null for TS compatibility
  },
  {
    path: '/settings/preferences',
    element: null // Use null for TS compatibility
  }
];

// Block 91a Implementation
import { RouteObject } from 'react-router-dom';

export interface AppRoute {
  path: string;
  label: string;
  element: React.ReactNode;
  requiresAuth?: boolean;
  requiresVault?: boolean;
}

export function getAppRoutes(session: any, activeVaultId: string | null): AppRoute[] {
  // Block 91a Implementation: Only include routes user is allowed to see
  if (!session) return [];
  const vaultRoutes = activeVaultId
    ? [
        {
          path: '/app/vault',
          label: 'Vault Dashboard',
          element: null, // To be filled with VaultDashboardPage
          requiresAuth: true,
          requiresVault: true,
        },
      ]
    : [];
  return [
    {
      path: '/app',
      label: 'Home',
      element: null, // To be filled with HomePage
      requiresAuth: true,
    },
    ...vaultRoutes,
  ];
} 