import React from 'react';
import { useWatchlistContext } from '../../hooks/useWatchlistContext';

const MOCK_HEATMAP: Record<string, number> = {
  BTC: 0.9,
  ETH: 0.7,
  AAPL: 0.5,
  TSLA: 0.3,
};
const MOCK_SENTIMENT: Record<string, 'bullish' | 'neutral' | 'bearish'> = {
  BTC: 'bullish',
  ETH: 'bullish',
  AAPL: 'neutral',
  TSLA: 'bearish',
};

const WatchlistEngine: React.FC = () => {
  const { watchlist, remove, promoteToPortfolio, getAlerts } = useWatchlistContext();
  const alerts = getAlerts();

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Smart Watchlist</h2>
      {alerts.length > 0 && (
        <div className="mb-4">
          {alerts.map(alert => (
            <div key={alert.symbol + alert.type} className={`mb-2 px-4 py-2 rounded shadow text-sm font-medium ${alert.type === 'signal' ? 'bg-yellow-100 text-yellow-900' : 'bg-blue-100 text-blue-900'}`}>
              <span className="font-bold">{alert.symbol}:</span> {alert.message}
            </div>
          ))}
        </div>
      )}
      <ul className="divide-y divide-gray-200">
        {watchlist.map(symbol => {
          const heat = MOCK_HEATMAP[symbol] ?? Math.random();
          const sentiment = MOCK_SENTIMENT[symbol] ?? 'neutral';
          return (
            <li key={symbol} className="flex items-center py-3 gap-4">
              <span className="font-mono text-lg w-16">{symbol}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="w-24 h-3 rounded bg-gray-200 overflow-hidden">
                  <div
                    className={`h-3 rounded ${heat > 0.7 ? 'bg-green-400' : heat > 0.4 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.round(heat * 100)}%` }}
                  />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${sentiment === 'bullish' ? 'bg-green-100 text-green-800' : sentiment === 'bearish' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>{sentiment}</span>
              </div>
              <button
                className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                onClick={() => {
                  const result = promoteToPortfolio(symbol);
                  if (!result.valid) {
                    alert(`Cannot promote: ${result.reason}`);
                  }
                }}
              >
                Promote to Portfolio
              </button>
              <button
                className="ml-2 px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300"
                onClick={() => remove(symbol)}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WatchlistEngine; 