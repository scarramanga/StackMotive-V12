// Block 14 Implementation: Global Portfolio Context
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import useUserPreferences from '@/hooks/useUserPreferences';
import { useBrokerAdapter } from '../hooks/useBrokerAdapter';
import { useVaultAPI, Vault } from '../hooks/useVaultAPI';

// Block 14 Implementation: Mock Position type
export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

// Block 14 Implementation: Context value type
interface PortfolioContextType {
  positions: Position[];
  totalEquity: number;
  preferredCurrency: 'NZD' | 'USD';
  updateCurrency: (currency: 'NZD' | 'USD') => void;
  brokerMode: string;
  setBrokerMode: (mode: string) => void;
  activeVaultId: string | null;
  setActiveVaultId: (id: string | null) => void;
  vaultList: Vault[];
  fetchVaultsForSession: () => Promise<void>;
}

// Block 14 Implementation: Mock data
const MOCK_POSITIONS: Position[] = [
  { symbol: 'BTC', name: 'Bitcoin', quantity: 0.5, avgPrice: 60000, currentPrice: 68000 },
  { symbol: 'ETH', name: 'Ethereum', quantity: 2, avgPrice: 3200, currentPrice: 3800 },
  { symbol: 'TSLA', name: 'Tesla', quantity: 10, avgPrice: 150, currentPrice: 180 },
];

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Block 77 Implementation
  const { preferences, setPreference } = useUserPreferences();
  const [positions, setPositions] = useState<Position[]>(MOCK_POSITIONS);
  const [brokerMode, setBrokerMode] = useState<string>('ibkr');
  const adapter = useBrokerAdapter(brokerMode);
  const [activeVaultId, setActiveVaultId] = useState<string | null>(typeof window === 'undefined' ? null : null);
  const [vaultList, setVaultList] = useState<Vault[]>([]);
  const { getVaultsForSession } = useVaultAPI();

  // Block 14 Implementation: Calculate total equity (mock, USD only)
  const totalEquity = useMemo(() => {
    return positions.reduce((sum, pos) => sum + pos.quantity * pos.currentPrice, 0);
  }, [positions]);

  // Block 14 Implementation: Currency state (persisted)
  const preferredCurrency = (preferences.preferredCurrency as 'NZD' | 'USD') || 'USD';
  const updateCurrency = (currency: 'NZD' | 'USD') => {
    setPreference('preferredCurrency', currency);
  };

  useEffect(() => {
    // Block 44 Implementation: hydrate portfolio from broker adapter
    adapter.getPositions().then((rawPositions: any[]) => {
      // Map to Position type (add missing fields as mock/defaults)
      setPositions(
        rawPositions.map((p: any) => ({
          symbol: p.symbol,
          quantity: p.quantity,
          avgPrice: p.avgPrice,
          name: p.symbol, // mock name
          currentPrice: p.avgPrice, // mock current price
        }))
      );
    });
  }, [brokerMode]);

  // Block 77 Implementation: SSR-safe vault switching and persistence
  useEffect(() => {
    let ignore = false;
    async function loadVaults() {
      const vaults = await getVaultsForSession();
      if (ignore) return;
      setVaultList(vaults);
      if (vaults.length > 0) {
        let initialVaultId: string | null = null;
        if (typeof window !== 'undefined') {
          initialVaultId = window.localStorage.getItem('activeVaultId');
        }
        if (!initialVaultId || !vaults.some(v => v.id === initialVaultId)) {
          initialVaultId = vaults[0].id;
        }
        setActiveVaultId(initialVaultId);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('activeVaultId', initialVaultId!);
        }
      } else {
        setActiveVaultId(null);
      }
    }
    loadVaults();
    return () => { ignore = true; };
  }, [getVaultsForSession]);

  // Block 77 Implementation: Persist vault switch to localStorage (SSR-safe)
  useEffect(() => {
    if (typeof window !== 'undefined' && activeVaultId) {
      window.localStorage.setItem('activeVaultId', activeVaultId);
    }
  }, [activeVaultId]);

  const fetchVaultsForSession = async () => {
    const vaults = await getVaultsForSession();
    setVaultList(vaults);
  };

  const value = useMemo(() => ({
    positions,
    totalEquity,
    preferredCurrency,
    updateCurrency,
    brokerMode,
    setBrokerMode,
    activeVaultId,
    setActiveVaultId,
    vaultList,
    fetchVaultsForSession,
  }), [positions, totalEquity, preferredCurrency, brokerMode, activeVaultId, vaultList]);

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

// Block 14 Implementation: usePortfolio hook
export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within a PortfolioProvider');
  return ctx;
}

// Block 66 Implementation: Export PortfolioContext for use in hooks
export { PortfolioContext }; 