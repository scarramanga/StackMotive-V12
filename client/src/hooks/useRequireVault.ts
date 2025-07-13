import { useEffect, useState } from 'react';
import { useVaultAPI } from './useVaultAPI';
import { useAuth } from '../contexts/AuthContext';

export function useRequireVault() {
  const { session } = useAuth();
  const { fetchVaultForSession } = useVaultAPI();
  const [hasVault, setHasVault] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      setLoading(true);
      if (!session) {
        setHasVault(false);
        setLoading(false);
        return;
      }
      const vaults = await fetchVaultForSession();
      if (mounted) {
        setHasVault(!!vaults && vaults.length > 0);
        setLoading(false);
      }
    }
    check();
    return () => { mounted = false; };
  }, [session]);

  return { hasVault, loading };
} 