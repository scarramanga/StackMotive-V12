import React from 'react';
import { useWatchlistContext } from '../../hooks/useWatchlistContext';

const WatchlistWeightPanel: React.FC = () => {
  const { watchlist, getWeight, setWeight } = useWatchlistContext();

  // Sort by weight descending
  const sorted = [...watchlist].sort((a, b) => getWeight(b) - getWeight(a));

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Watchlist Weighting</h2>
      <div className="space-y-4">
        {sorted.length === 0 && <div className="text-muted-foreground">No assets in your watchlist.</div>}
        {sorted.map(symbol => (
          <div key={symbol} className="flex items-center gap-4 bg-card rounded shadow p-3">
            <div className="flex-1 font-medium">{symbol}</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={getWeight(symbol)}
              onChange={e => setWeight(symbol, parseFloat(e.target.value))}
              className="w-32 accent-primary"
              aria-label={`Set weight for ${symbol}`}
            />
            <span className="w-12 text-right tabular-nums">{(getWeight(symbol) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="mt-6 text-xs text-muted-foreground">
        Higher-weighted assets are prioritized for agent recommendations and replacement logic.
      </div>
    </div>
  );
};

export default WatchlistWeightPanel; 