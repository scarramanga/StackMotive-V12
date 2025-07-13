import React, { useState } from 'react';
import { Star, Trash2, PlusCircle } from 'lucide-react';

interface WatchlistEngineProps {
  assets?: string[];
}

const mockPrices: Record<string, string> = {
  BTC: '$69,420',
  TSLA: '$1,234',
  ETH: '$3,200',
  AAPL: '$189',
};

const WatchlistEngine: React.FC<WatchlistEngineProps> = ({ assets: initialAssets }) => {
  // Use local state for stub add/remove
  const [assets, setAssets] = useState<string[]>(initialAssets ?? ['BTC', 'TSLA']);

  // Stub handlers
  const handleAdd = () => {
    // Add a random asset (stub)
    const pool = ['ETH', 'AAPL', 'GOOG', 'NVDA'];
    const next = pool.find(a => !assets.includes(a));
    if (next) setAssets([...assets, next]);
  };
  const handleRemove = (symbol: string) => {
    setAssets(assets.filter(a => a !== symbol));
  };

  return (
    <div className="block10-watchlist-engine w-full max-w-xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Watchlist</h2>
        <button
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 transition text-sm"
          onClick={handleAdd}
          disabled
        >
          <PlusCircle className="w-4 h-4" /> Add Asset (stub)
        </button>
      </div>
      {assets.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">No assets in your watchlist.</div>
      ) : (
        <ul className="divide-y divide-border">
          {assets.map(symbol => (
            <li key={symbol} className="flex items-center gap-4 py-4">
              <span className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                <Star className="w-5 h-5 text-blue-500" />
              </span>
              <span className="font-semibold text-lg">{symbol}</span>
              <span className="ml-auto text-muted-foreground text-sm">{mockPrices[symbol] ?? '--'}</span>
              <button
                className="ml-4 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900"
                onClick={() => handleRemove(symbol)}
                disabled
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WatchlistEngine; 