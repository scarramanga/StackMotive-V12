import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../contexts/PortfolioContext';

export function useRouteGuard(route: { requiresAuth?: boolean; requiresVault?: boolean }) {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();
  const isSSR = typeof window === 'undefined';

  let canAccess = true;
  if (isSSR) canAccess = false;
  if (route.requiresAuth && !user) canAccess = false;
  if (route.requiresVault && !activeVaultId) canAccess = false;

  return { canAccess };
} 