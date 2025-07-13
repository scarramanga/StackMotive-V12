import React, { useState } from 'react';

const EmailStep: React.FC<{ onSubmit: (email: string) => Promise<void>; loading: boolean; error: string; onBack: () => void }> = ({ onSubmit, loading, error, onBack }) => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    await onSubmit(email);
  }

  return (
    <form className="flex flex-col items-center gap-4 min-h-[220px] w-full" onSubmit={handleSubmit}>
      <div className="w-full">
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">Email address</label>
        <input
          type="email"
          className="w-full border rounded px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
          placeholder="you@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
        {touched && !valid && (
          <div className="text-xs text-red-600 mt-1">Enter a valid email address.</div>
        )}
      </div>
      {error && <div className="text-sm text-red-700 dark:text-red-400">{error}</div>}
      <div className="flex gap-2 w-full mt-2">
        <button
          type="button"
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          disabled={!valid || loading}
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </div>
    </form>
  );
};

export default EmailStep; 