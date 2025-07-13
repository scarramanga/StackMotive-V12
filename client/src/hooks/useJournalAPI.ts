// Block 69 Implementation
import { useAuth } from '../contexts/AuthContext';
import { useContext } from 'react';
import { PortfolioContext } from '../contexts/PortfolioContext';

export interface JournalEntry {
  entry_id: string;
  text: string;
  tags: string[];
  timestamp: string;
}

export function useJournalAPI() {
  // Block 69 Implementation
  const { session } = useAuth();
  const portfolioCtx = useContext(PortfolioContext);
  const activeVaultId = portfolioCtx?.activeVaultId;

  // SSR-safe: fail safely if no vault context or vaultId
  if (typeof window === 'undefined' || !activeVaultId) {
    return {
      fetchJournalForSessionVault: async () => [],
      addJournalEntryForSessionVault: async () => {},
      deleteJournalEntryForSessionVault: async () => {},
    };
  }

  async function fetchJournalForSessionVault(): Promise<JournalEntry[]> {
    if (!session) return [];
    const res = await fetch(`/api/journal?vaultId=${activeVaultId}`, {
      headers: { Authorization: `Bearer ${session.userId}` },
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async function addJournalEntryForSessionVault(entry: { text: string; tags?: string[]; timestamp?: string }): Promise<void> {
    if (!session) return;
    await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.userId}`,
      },
      body: JSON.stringify({ ...entry, vaultId: activeVaultId }),
    });
  }

  async function deleteJournalEntryForSessionVault(entryId: string): Promise<void> {
    if (!session) return;
    await fetch('/api/journal', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.userId}`,
      },
      body: JSON.stringify({ entryId, vaultId: activeVaultId }),
    });
  }

  return { fetchJournalForSessionVault, addJournalEntryForSessionVault, deleteJournalEntryForSessionVault };
} 