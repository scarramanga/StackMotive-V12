import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserSubscription } from '../../hooks/useUserSubscription';

// Block 46: Account Settings & Billing
export const AccountSettingsPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const { tier, status, manageBilling, loading: billingLoading, error: billingError } = useUserSubscription();
  const [pw, setPw] = useState('');
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus('saving');
    setPwError('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) throw new Error('Failed to change password');
      setPwStatus('saved');
      setPw('');
    } catch (e: any) {
      setPwStatus('error');
      setPwError(e.message || 'Failed to change password');
    }
  };

  return (
    <section className="rounded-xl bg-card dark:bg-card/80 p-4 shadow-lg border border-border max-w-2xl mx-auto my-6 transition-colors" aria-labelledby="account-settings-title">
      <h2 id="account-settings-title" className="text-lg font-semibold mb-2">Account Settings</h2>
      <div className="mb-4 text-sm">Email: <span className="font-mono">{user?.email}</span></div>
      <form onSubmit={handlePasswordChange} className="mb-4">
        <label className="block mb-2 text-sm font-medium">Change Password</label>
        <input
          type="password"
          className="w-full rounded border px-3 py-2 mb-2 text-sm"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="New password"
          required
        />
        <button type="submit" className="btn btn-primary w-full" disabled={pwStatus === 'saving' || !pw.trim()}>
          {pwStatus === 'saving' ? 'Saving…' : 'Change Password'}
        </button>
        {pwStatus === 'saved' && <div className="mt-2 text-green-600 text-xs">Password changed!</div>}
        {pwStatus === 'error' && <div className="mt-2 text-red-600 text-xs">{pwError}</div>}
      </form>
      <div className="mb-4 text-sm">Subscription Tier: <span className="font-semibold">{tier}</span> <span className="ml-2 text-xs text-muted-foreground">({status})</span></div>
      <button className="btn btn-secondary w-full mb-2" onClick={manageBilling} disabled={billingLoading}>
        {billingLoading ? 'Loading…' : 'Manage Billing'}
      </button>
      {billingError && <div className="text-red-600 text-xs mb-2">{billingError}</div>}
      <button className="btn btn-outline w-full" onClick={logout}>Log Out</button>
    </section>
  );
}; 