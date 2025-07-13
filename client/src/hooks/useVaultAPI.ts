// Block 51 Implementation: useVaultAPI hook for Supabase Vault API
// SSR-safe, typed, fetches via /api/vault/[userId]
import { useState, useEffect } from 'react';

export interface Vault {
  vault_id: string;
  user_id: string;
  beliefs: any[];
  created_at: string;
}

export async function fetchVault(userId: string): Promise<Vault[]> {
  try {
    const res = await fetch(`/api/vault/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch vault');
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function saveVault(userId: string, beliefs: any[]): Promise<void> {
  try {
    await fetch(`/api/vault/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beliefs }),
    });
  } catch (e) {
    // fail silently
  }
}

export async function deleteVault(userId: string): Promise<void> {
  try {
    await fetch(`/api/vault/${userId}`, { method: 'DELETE' });
  } catch (e) {
    // fail silently
  }
}

// React hook for using the vault API
export function useVaultAPI(userId: string) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVaults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVault(userId);
      setVaults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vaults');
    } finally {
      setLoading(false);
    }
  };

  const saveVaultData = async (beliefs: any[]) => {
    try {
      await saveVault(userId, beliefs);
      await loadVaults(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vault');
    }
  };

  const deleteVaultData = async () => {
    try {
      await deleteVault(userId);
      await loadVaults(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vault');
    }
  };

  useEffect(() => {
    if (userId) {
      loadVaults();
    }
  }, [userId]);

  return {
    vaults,
    loading,
    error,
    saveVault: saveVaultData,
    deleteVault: deleteVaultData,
    refreshVaults: loadVaults,
  };
}