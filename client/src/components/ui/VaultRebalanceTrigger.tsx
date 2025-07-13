import React from 'react';

export interface VaultRebalanceTriggerProps {
  vaultAlloc: Record<string, number>;
  strategyAlloc: Record<string, number>;
  onRebalance: () => void;
}

function getDeltaColor(delta: number) {
  if (delta < 0) return 'text-green-600 dark:text-green-400'; // need to buy
  if (delta > 0) return 'text-red-600 dark:text-red-400'; // need to sell
  return 'text-gray-500';
}

export const VaultRebalanceTrigger: React.FC<VaultRebalanceTriggerProps> = ({ vaultAlloc, strategyAlloc, onRebalance }) => {
  // Union of all assets
  const assets = Array.from(new Set([...Object.keys(vaultAlloc), ...Object.keys(strategyAlloc)]));

  return (
    <section className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow p-4 md:p-6 mt-4">
      <h3 className="text-base md:text-lg font-bold mb-3 text-primary">Rebalance Vault</h3>
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full text-sm md:text-base">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 font-semibold">Asset</th>
              <th className="text-right py-2 px-2 font-semibold">Current %</th>
              <th className="text-right py-2 px-2 font-semibold">Target %</th>
              <th className="text-right py-2 px-2 font-semibold">Delta</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => {
              const current = vaultAlloc[asset] ?? 0;
              const target = strategyAlloc[asset] ?? 0;
              const delta = +(target - current).toFixed(2);
              return (
                <tr key={asset} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">{asset}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{current}%</td>
                  <td className="py-2 px-2 text-right tabular-nums">{target}%</td>
                  <td className={`py-2 px-2 text-right tabular-nums font-semibold ${getDeltaColor(delta)}`}>{delta > 0 ? '+' : ''}{delta}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="w-full md:w-auto px-6 py-2 rounded bg-primary text-white font-semibold shadow hover:bg-primary/90 focus:outline-none focus:ring text-base transition-colors"
        onClick={onRebalance}
        aria-label="Rebalance Vault"
      >
        Rebalance Vault
      </button>
    </section>
  );
}; 