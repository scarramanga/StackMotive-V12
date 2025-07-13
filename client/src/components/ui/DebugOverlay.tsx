// Block 21 Implementation: DebugOverlay component
import React, { useState } from 'react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { useCrisisMode } from '@/hooks/useCrisisMode';
import { usePortfolioIntegrity, generateDigestEntries } from '@/hooks/usePortfolioIntegrity';
import { useVaultBeliefs } from '@/hooks/useVaultBeliefs';

export const DebugOverlay: React.FC = () => {
  const { preferences, setPreference } = useUserSettingsContext();
  const portfolio = usePortfolio();
  const { crisis, toggleForceCrisis } = useCrisisMode();
  const [open, setOpen] = useState(false);
  const vaultBeliefs = useVaultBeliefs();

  // Only render if debugMode is enabled in user preferences
  if (!preferences.debugMode) return null;

  // Block 22 Implementation: Dummy newPositions for integrity check
  const newPositions = [
    { symbol: 'BTC', name: 'Bitcoin', quantity: 0.7, avgPrice: 60000, currentPrice: 68000 }, // Modified
    { symbol: 'ETH', name: 'Ethereum', quantity: 2, avgPrice: 3200, currentPrice: 3800 }, // Unchanged
    { symbol: 'AAPL', name: 'Apple', quantity: 5, avgPrice: 170, currentPrice: 190 }, // Added
    // TSLA removed
  ];
  const { diffs, hasDiscrepancies } = usePortfolioIntegrity(newPositions);
  const digestEntries = generateDigestEntries(diffs).filter(Boolean);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md w-full">
      <button
        className="px-3 py-1 rounded bg-gray-800 text-white text-xs mb-2 shadow"
        onClick={() => setOpen(o => !o)}
      >
        {open ? 'Hide Debug' : 'Show Debug'}
      </button>
      {open && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg p-4 text-xs space-y-3">
          <div className="font-bold mb-1">Debug Overlay</div>
          <div>
            <span className="font-semibold">User Preferences:</span>
            <pre className="bg-gray-100 dark:bg-neutral-800 rounded p-2 overflow-x-auto">{JSON.stringify(preferences, null, 2)}</pre>
          </div>
          <div>
            <span className="font-semibold">Portfolio:</span>
            <pre className="bg-gray-100 dark:bg-neutral-800 rounded p-2 overflow-x-auto">{JSON.stringify(portfolio, null, 2)}</pre>
          </div>
          <div>
            <span className="font-semibold">Crisis Mode:</span> {crisis ? 'ON' : 'OFF'}
            <button
              className="ml-2 px-2 py-1 rounded bg-red-500 text-white"
              onClick={toggleForceCrisis}
            >
              Toggle Crisis
            </button>
          </div>
          <div>
            <span className="font-semibold">Override Currency:</span>
            <button
              className="ml-2 px-2 py-1 rounded bg-blue-500 text-white"
              onClick={() => portfolio.updateCurrency(portfolio.preferredCurrency === 'USD' ? 'NZD' : 'USD')}
            >
              Switch to {portfolio.preferredCurrency === 'USD' ? 'NZD' : 'USD'}
            </button>
          </div>
          {/* Block 22 Implementation: Portfolio Integrity Diffs */}
          <div>
            <span className="font-semibold">Portfolio Integrity Diffs:</span>
            {hasDiscrepancies ? (
              <ul className="mt-1 space-y-1">
                {digestEntries.map(entry => (
                  <li key={entry!.id} className={`p-2 rounded ${entry!.severity === 'red' ? 'bg-red-100' : entry!.severity === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    <div className="font-bold">{entry!.title}</div>
                    <div>{entry!.summary}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-green-700">No discrepancies detected.</div>
            )}
          </div>
          {/* Block 23 Implementation: Vault Beliefs */}
          <div>
            <span className="font-semibold">Vault Beliefs (Read-only):</span>
            <ul className="mt-1 space-y-1">
              {vaultBeliefs.map(belief => (
                <li key={belief.id} className="p-2 rounded bg-gray-50 dark:bg-neutral-800 border flex items-center gap-2">
                  <span className="font-bold">{belief.statement}</span>
                  <span className="ml-auto text-xs text-gray-500">Confidence: {belief.confidence}/5</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
export default DebugOverlay; 