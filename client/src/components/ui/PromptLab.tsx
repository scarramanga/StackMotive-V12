// Block 96 Implementation
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';

const CONTEXT_TAGS = [
  { value: 'macro', label: 'Macro' },
  { value: 'news', label: 'News' },
  { value: 'technicals', label: 'Technicals' },
  { value: 'custom', label: 'Custom' },
];

const PromptLab: React.FC = () => {
  // Block 96 Implementation
  const { activeVaultId } = usePortfolio();
  const [prompt, setPrompt] = useState('');
  const [contextTag, setContextTag] = useState(CONTEXT_TAGS[0].value);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (typeof window === 'undefined' || !activeVaultId) return null;

  const handleTestPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch('/api/gpt/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId: activeVaultId, prompt, contextTag }),
      });
      if (!res.ok) throw new Error('Failed to test prompt');
      const data = await res.json();
      setResponse(data.response || 'No response from GPT.');
    } catch (err: any) {
      setError(err.message || 'Error testing prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow flex flex-col gap-6 mt-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">PromptLab: GPT Prompt Designer</h2>
      <form className="flex flex-col gap-4" onSubmit={handleTestPrompt}>
        <div className="flex flex-col gap-2">
          <label htmlFor="prompt" className="font-medium text-gray-700 dark:text-gray-200">
            Prompt
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={6}
            className="input input-bordered w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-vertical"
            required
            aria-label="Prompt editor"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium text-gray-700 dark:text-gray-200">Context Tag</span>
          <div className="flex gap-4">
            {CONTEXT_TAGS.map(tag => (
              <label key={tag.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="contextTag"
                  value={tag.value}
                  checked={contextTag === tag.value}
                  onChange={() => setContextTag(tag.value)}
                  className="form-radio text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">{tag.label}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full mt-2 disabled:opacity-50"
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Testing...' : 'Test Prompt'}
        </button>
      </form>
      {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
      {response && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-2">
          <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">GPT Response:</div>
          <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 text-sm">{response}</pre>
        </div>
      )}
    </section>
  );
};

export default PromptLab; 