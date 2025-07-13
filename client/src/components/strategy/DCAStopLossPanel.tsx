// Block 10: DCAStopLossPanel UI
import React, { useState } from 'react';
import { useDCAStopLossAgent } from '../../hooks/useDCAStopLossAgent';
import { useDCAStopLossStore } from '../../store/dcaStopLoss';
import { useSessionStore } from '../../store/session';

export default function DCAStopLossPanel({ priceData, volatility, aiMomentum }: any) {
  const user = useSessionStore(s => s.user);
  const isPremium = user?.isPremium;
  const { prompts, history } = useDCAStopLossAgent({ priceData, volatility, aiMomentum });
  const { dcaConfigs, stopLossConfigs, setDCAConfigs, setStopLossConfigs } = useDCAStopLossStore();
  const [showConfig, setShowConfig] = useState(false);

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">DCA & Stop-Loss Assistant (Premium Only)</h1>
        <p className="mb-4">Upgrade to unlock DCA and stop-loss automation.</p>
        <button className="btn btn-primary">Upgrade Now</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DCA & Stop-Loss Assistant</h1>
      <button className="btn btn-secondary mb-4" onClick={() => setShowConfig(!showConfig)}>
        {showConfig ? 'Hide' : 'Configure DCA/Stop-Loss'}
      </button>
      {showConfig && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h2 className="font-semibold mb-2">DCA/Stop-Loss Settings</h2>
          {/* TODO: Add DCA/stop-loss config UI (or link to Preferences) */}
          <p className="text-sm text-gray-500">DCA and stop-loss configuration goes here or in Preferences.</p>
        </div>
      )}
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Active Prompts</h2>
        {prompts.length === 0 && <div className="text-gray-500">No active prompts.</div>}
        {prompts.map(prompt => (
          <div key={prompt.id} className="mb-2 p-3 bg-blue-100 rounded flex flex-col">
            <div className="flex justify-between items-center">
              <div>
                <b>{prompt.asset}</b> — <span>{prompt.type}</span>
                <span className="ml-2 text-xs text-gray-600">{new Date(prompt.timestamp).toLocaleString()}</span>
              </div>
              <button className="btn btn-sm btn-outline ml-2">Dismiss</button>
            </div>
            <div className="text-sm mt-1">{prompt.rationale}</div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-xs btn-secondary">Snooze</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Prompt History</h2>
        {history.length === 0 && <div className="text-gray-500">No prompt history yet.</div>}
        {history.map((h, i) => (
          <div key={h.id} className="mb-2 p-3 bg-green-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <b>{new Date(h.timestamp).toLocaleString()}</b> — {h.rationale}
              </div>
              <span className="text-xs">{h.type === 'dca' ? 'DCA' : 'Stop-Loss'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 