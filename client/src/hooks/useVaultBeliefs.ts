import { useMemo } from 'react';
import { getVaultBeliefs, VaultBelief } from '@/utils/vault';

export function useVaultBeliefs(): ReadonlyArray<VaultBelief> {
  // Block 23 Implementation: Return frozen beliefs array
  return useMemo(() => getVaultBeliefs(), []);
} 