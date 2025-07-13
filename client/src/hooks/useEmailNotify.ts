import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../contexts/PortfolioContext';
import { isDev } from "@/utils/isDev";

export function useEmailNotify() {
  const { user } = useAuth();
  const { activeVaultId } = usePortfolio();

  useEffect(() => {
    if (typeof window === 'undefined' || !user || !activeVaultId) return;
    // Register for notifications (e.g., via Supabase Edge Function or API)
    fetch('/api/notify/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id || user.userId, vaultId: activeVaultId }),
    });
  }, [user, activeVaultId]);

  const sendEmailNotification = async (
    type: "vault" | "journal" | "signal",
    payload: any
  ) => {
    if (isDev()) return;
    try {
      await fetch("/api/notify/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
    } catch (err) {
      console.error("Failed to trigger email notification", err);
    }
  };

  return { sendEmailNotification };
} 