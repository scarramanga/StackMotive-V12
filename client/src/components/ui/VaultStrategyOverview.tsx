import React from 'react';

interface Props {
  vaultName: string;
  currentAlloc: Record<string, number>; // asset: percent (0-100)
  targetAlloc: Record<string, number>; // asset: percent (0-100)
}

function getDeltaColor(delta: number) {
  if (delta < 0) return 'text-green-600 dark:text-green-400'; // under-allocated
  if (delta > 0) return 'text-red-600 dark:text-red-400'; // over-allocated
  return 'text-gray-500';
}

export const VaultStrategyOverview: React.FC<Props> = ({ vaultName, currentAlloc, targetAlloc }) => {
  // Union of all assets
  const assets = Array.from(new Set([...Object.keys(currentAlloc), ...Object.keys(targetAlloc)]));

  return (
    <section className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold mb-4 text-primary truncate">{vaultName} — Strategy Overview</h2>
      <div className="overflow-x-auto">
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
              const current = currentAlloc[asset] ?? 0;
              const target = targetAlloc[asset] ?? 0;
              const delta = +(current - target).toFixed(2);
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
    </section>
  );
}; 