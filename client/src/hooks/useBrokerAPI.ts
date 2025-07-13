import { useAuth } from '../contexts/AuthContext';
import { useContext } from 'react';
import { PortfolioContext } from '../contexts/PortfolioContext';

const API_BASE = '/api/broker';

export function useBrokerAPI() {
  const { session } = useAuth();
  const portfolioCtx = useContext(PortfolioContext);
  const activeVaultId = portfolioCtx?.activeVaultId;

  if (typeof window === 'undefined' || !session || !activeVaultId) {
    return {
      getBrokersForSessionVault: async () => [],
      saveBrokerSessionForVault: async () => ({}),
      clearBrokerSessionsForVault: async () => ({}),
    };
  }

  async function getBrokersForSessionVault() {
    const res = await fetch(`${API_BASE}?vaultId=${activeVaultId}`, {
      headers: { Authorization: `Bearer ${session.userId}` },
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async function saveBrokerSessionForVault(broker_name: string, credentials: object) {
    const res = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.userId}`,
      },
      body: JSON.stringify({ broker_name, credentials, vaultId: activeVaultId }),
    });
    return await res.json();
  }

  async function clearBrokerSessionsForVault() {
    const res = await fetch(`${API_BASE}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.userId}` },
      body: JSON.stringify({ vaultId: activeVaultId }),
    });
    return await res.json();
  }

  return { getBrokersForSessionVault, saveBrokerSessionForVault, clearBrokerSessionsForVault };
} 