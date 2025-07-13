import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface UserSubscription {
  tier: string;
  status: string;
  stripeCustomerId: string;
  manageBilling: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Block 46: Account Settings & Billing — Subscription Hook
export function useUserSubscription(): UserSubscription {
  const { user } = useAuth();
  const [tier, setTier] = useState('free');
  const [status, setStatus] = useState('inactive');
  const [stripeCustomerId, setStripeCustomerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTier('free');
      setStatus('inactive');
      setStripeCustomerId('');
      setLoading(false);
      return;
    }
    setLoading(true);
    // Try to get from user metadata first
    const meta = user.metadata || {};
    setTier(meta.tier || 'free');
    setStatus(meta.subscription_status || 'inactive');
    setStripeCustomerId(meta.stripe_customer_id || '');
    setLoading(false);
    // TODO: Optionally fetch from API for real-time status
  }, [user]);

  const manageBilling = useCallback(async () => {
    if (!stripeCustomerId) return;
    setLoading(true);
    try {
      // Call backend to create Stripe portal session
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });
      if (!res.ok) throw new Error('Failed to create billing portal session');
      const data = await res.json();
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  }, [stripeCustomerId]);

  return { tier, status, stripeCustomerId, manageBilling, loading, error };
} 