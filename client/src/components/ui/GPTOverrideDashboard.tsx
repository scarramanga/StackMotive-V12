// Block 97 Implementation
import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';

interface GPTOverrideConfig {
  systemPrompt: string;
  allowAutoExecution: boolean;
  useSentimentSignals: boolean;
  enableRiskAverseMode: boolean;
}

const DEFAULT_CONFIG: GPTOverrideConfig = {
  systemPrompt: '',
  allowAutoExecution: false,
  useSentimentSignals: false,
  enableRiskAverseMode: false,
};

const GPTOverrideDashboard: React.FC = () => {
  // Block 97 Implementation
  const { activeVaultId } = usePortfolio();
  const [config, setConfig] = useState<GPTOverrideConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeVaultId) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    fetch(`/api/gpt/overrides?vaultId=${encodeURIComponent(activeVaultId)}`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load overrides');
        return res.json();
      })
      .then(data => {
        setConfig({
          systemPrompt: data.systemPrompt ?? '',
          allowAutoExecution: !!data.allowAutoExecution,
          useSentimentSignals: !!data.useSentimentSignals,
          enableRiskAverseMode: !!data.enableRiskAverseMode,
        });
      })
      .catch(err => setError(err.message || 'Error loading overrides'))
      .finally(() => setLoading(false));
  }, [activeVaultId]);

  if (typeof window === 'undefined' || !activeVaultId) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target;
    let checked = false;
    if (type === 'checkbox' && 'checked' in e.target) {
      checked = (e.target as HTMLInputElement).checked;
    }
    setConfig(cfg => ({
      ...cfg,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    if (!config.systemPrompt.trim()) {
      setError('System prompt cannot be empty.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/gpt/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, vaultId: activeVaultId }),
      });
      if (!res.ok) throw new Error('Failed to save overrides');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error saving overrides');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow flex flex-col gap-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">GPT Override Dashboard</h2>
      {loading ? (
        <div className="text-gray-500">Loading override settings...</div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSave}>
          <div className="flex flex-col gap-2">
            <label htmlFor="systemPrompt" className="font-medium text-gray-700 dark:text-gray-200">
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              value={config.systemPrompt}
              onChange={handleChange}
              rows={5}
              className="input input-bordered w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-vertical"
              required
              aria-label="System prompt editor"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-200">Flags & Toggles</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowAutoExecution"
                  checked={config.allowAutoExecution}
                  onChange={handleChange}
                  className="form-checkbox text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">Allow Auto Execution</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="useSentimentSignals"
                  checked={config.useSentimentSignals}
                  onChange={handleChange}
                  className="form-checkbox text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">Use Sentiment Signals</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="enableRiskAverseMode"
                  checked={config.enableRiskAverseMode}
                  onChange={handleChange}
                  className="form-checkbox text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">Enable Risk-Averse Mode</span>
              </label>
            </div>
          </div>
          {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
          {success && <div className="text-green-600 text-sm" role="status">Settings saved successfully.</div>}
          <button
            type="submit"
            className="btn btn-primary w-full mt-2 disabled:opacity-50"
            disabled={saving || !config.systemPrompt.trim()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </section>
  );
};

export default GPTOverrideDashboard; 