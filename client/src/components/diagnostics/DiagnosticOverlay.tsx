import React, { useState, useEffect } from 'react';

// Mock data for demonstration
const MOCK_VAULT_BELIEFS = [
  { id: 'usd-debase', statement: 'Structural USD debasement', confidence: 4 },
  { id: 'btc-sov-store', statement: 'BTC as sovereign store-of-value', confidence: 5 },
  { id: 'risk-allocation', statement: 'Risk allocation discipline', confidence: 3 },
];

const MOCK_GPT_OVERLAY = {
  summary: 'Market regime: Risk-on. BTC favored due to macro tailwinds. Reduce USD exposure.',
  recommendations: [
    { symbol: 'BTC', action: 'buy', rationale: 'Strong conviction, vault aligned.' },
    { symbol: 'USD', action: 'reduce', rationale: 'Vault debasement thesis active.' },
  ],
};

const MOCK_SIGNALS = [
  { symbol: 'BTC', action: 'buy', confidence: 0.92, origin: 'StrategyEngine' },
  { symbol: 'ETH', action: 'hold', confidence: 0.65, origin: 'SignalOverlay' },
  { symbol: 'AAPL', action: 'buy', confidence: 0.78, origin: 'GPTAdvisor' },
];

const MOCK_EXECUTION_MODE = 'simulate'; // simulate | broker | backtest

const themeClasses = {
  dark: 'bg-gray-900 text-gray-100',
  light: 'bg-white text-gray-900',
};

const DiagnosticOverlay: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Keyboard shortcut: Ctrl+D to toggle overlay (dev only)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!visible) {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded bg-blue-700 text-white shadow-lg hover:bg-blue-800"
        onClick={() => setVisible(true)}
        title="Show Diagnostic Overlay (Ctrl+D)"
      >
        Diagnostics
      </button>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${themeClasses[theme]} transition-colors duration-200`}>
      <div className="absolute top-0 left-0 w-full h-full opacity-80 pointer-events-none" />
      <div className="relative w-full max-w-3xl mx-auto my-8 p-8 rounded-lg shadow-2xl bg-opacity-95" style={{ background: theme === 'dark' ? '#18181b' : '#fff' }}>
        <button
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600"
          onClick={() => setVisible(false)}
          aria-label="Close"
        >
          ×
        </button>
        <button
          className="absolute top-4 left-4 px-2 py-1 rounded bg-gray-200 text-xs text-gray-700 hover:bg-gray-300"
          onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">System Diagnostic Overlay</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vault Beliefs */}
          <div>
            <h3 className="font-semibold mb-2">Vault Beliefs</h3>
            <ul className="space-y-1">
              {MOCK_VAULT_BELIEFS.map(b => (
                <li key={b.id} className="flex items-center gap-2">
                  <span className="font-medium">{b.statement}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">Confidence: {b.confidence}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* GPT Overlay */}
          <div>
            <h3 className="font-semibold mb-2">GPT Overlay</h3>
            <div className="mb-2 text-sm italic">{MOCK_GPT_OVERLAY.summary}</div>
            <ul className="space-y-1">
              {MOCK_GPT_OVERLAY.recommendations.map((rec, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="font-medium">{rec.symbol}:</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">{rec.action}</span>
                  <span className="text-xs text-gray-500">{rec.rationale}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Signal Inflows & Execution Mode */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Signal Inflow</h3>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 text-left">Symbol</th>
                  <th className="p-1">Action</th>
                  <th className="p-1">Confidence</th>
                  <th className="p-1">Origin</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SIGNALS.map((s, i) => (
                  <tr key={i}>
                    <td className="p-1 font-medium">{s.symbol}</td>
                    <td className="p-1 text-center">{s.action}</td>
                    <td className="p-1 text-center">{Math.round(s.confidence * 100)}%</td>
                    <td className="p-1 text-center text-xs text-gray-500">{s.origin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Execution Mode</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-bold px-3 py-1 rounded bg-indigo-100 text-indigo-800">
                {MOCK_EXECUTION_MODE.charAt(0).toUpperCase() + MOCK_EXECUTION_MODE.slice(1)}
              </span>
              <span className="text-xs text-gray-500">(simulate | broker | backtest)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticOverlay; 