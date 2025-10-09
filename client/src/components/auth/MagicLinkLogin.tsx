import React, { useState } from 'react';
import { api } from '@/lib/api';

export function MagicLinkLogin() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/api/auth/magic-link/request', { email });
      setSent(true);
    } catch (error) {
      console.error('Failed to request magic link:', error);
      alert('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center p-6">
        <div className="text-4xl mb-4">📧</div>
        <h3 className="text-xl font-semibold mb-2">Check your email</h3>
        <p className="text-gray-600 mb-4">
          We've sent a magic link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500">
          The link expires in 15 minutes
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-blue-600 hover:underline"
        >
          Send another link
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={requestMagicLink} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
  );
}
