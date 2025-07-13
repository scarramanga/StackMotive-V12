// Block 106 Implementation
import React, { createContext, useContext, ReactNode } from 'react';

interface VaultContextValue {
  activeVaultId: string;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

export const VaultContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // SSR-safe, static value for now
  const value: VaultContextValue = { activeVaultId: 'test-vault' };
  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export const useVaultContext = () => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVaultContext must be used within a VaultContextProvider');
  return ctx;
};
// Block 106 Implementation 