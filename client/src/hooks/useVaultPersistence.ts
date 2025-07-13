import { useCallback } from 'react';
import * as vaultConnection from '../lib/vaultConnection';

// Types for vault and vaultId
export interface Vault {
  vault_id: string;
  user_id: string;
  beliefs: any[];
  created_at: string;
}

export function useVaultPersistence() {
  // Fetch all vaults (mocked)
  const fetchVaults = useCallback(async (): Promise<Vault[]> => {
    return vaultConnection.getVaults();
  }, []);

  // Save a vault (mocked)
  const saveVault = useCallback(async (vault: Vault) => {
    return vaultConnection.saveVault(vault);
  }, []);

  // Delete a vault (mocked)
  const deleteVault = useCallback(async (vaultId: string) => {
    // In a real API, would call delete endpoint
    return { success: true, deletedId: vaultId };
  }, []);

  return { fetchVaults, saveVault, deleteVault };
} 