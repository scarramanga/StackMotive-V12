import React, { useState } from 'react';
import { useBrokerAuth } from '../../hooks/useBrokerAuth';

const BROKER_OPTIONS = [
  { value: 'ibkr', label: 'IBKR' },
  { value: 'kucoin', label: 'KuCoin' },
  { value: 'kraken', label: 'Kraken' },
  { value: 'easyCrypto', label: 'EasyCrypto' },
  { value: 'csv', label: 'Sharesies (CSV)' },
];

const BrokerModeSelector: React.FC = () => {
  const [selected, setSelected] = useState('ibkr');
  const { connected, error, loading, connect } = useBrokerAuth(selected);

  const handleConnect = () => {
    // Block 45 Implementation: Only log for now
    // eslint-disable-next-line no-console
    console.log(`[Block 45] Connect to broker: ${selected}`);
    connect();
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Broker Mode Selector</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Broker</label>
        <select
          className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          {BROKER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <button
        className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 disabled:opacity-60 mb-3"
        onClick={handleConnect}
        disabled={loading}
      >
        {loading ? 'Connecting...' : 'Connect'}
      </button>
      <div className="text-sm mt-2">
        {connected && <span className="text-green-700 dark:text-green-400 font-semibold">Connected</span>}
        {!connected && !error && <span className="text-gray-500">Not Connected</span>}
        {error && <span className="text-red-700 dark:text-red-400 font-semibold">{error}</span>}
      </div>
    </div>
  );
};

export default BrokerModeSelector; 