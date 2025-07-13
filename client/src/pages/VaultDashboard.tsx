import React, { useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { VaultAssetsPanel } from '../components/panels/VaultAssetsPanel';
import { VaultStrategySelector } from '../components/ui/VaultStrategySelector';
import { StrategyRationalePanel } from '../components/panels/StrategyRationalePanel';
import { AlertPanel, AlertPanelProps } from '../components/panels/AlertPanel';
import { VaultBacktesterPanel } from '../components/panels/VaultBacktesterPanel';
import { VaultRebalanceTrigger } from '../components/ui/VaultRebalanceTrigger';
import { VaultNarrativeReportPanel } from '../components/panels/VaultNarrativeReportPanel';
import { useNotificationCenter } from '../hooks/useNotificationCenter';
import { NotificationCenter } from '../components/ui/NotificationCenter';

const MOCK_STRATEGIES = [
  'Balanced',
  'Aggressive Growth',
  'Defensive Income',
];

const MOCK_RATIONALES: Record<string, {
  name: string;
  description: string;
  macroContext: string[];
  assets: { symbol: string; weight: number }[];
}> = {
  'Balanced': {
    name: 'Balanced',
    description: 'A diversified approach balancing risk and reward across equities and crypto.',
    macroContext: [
      'Global economic growth expected to be moderate.',
      'Inflation risks remain but are declining.',
      'Crypto adoption continues to rise.'
    ],
    assets: [
      { symbol: 'AAPL', weight: 30 },
      { symbol: 'BTC', weight: 20 },
      { symbol: 'BND', weight: 25 },
      { symbol: 'GLD', weight: 25 },
    ],
  },
  'Aggressive Growth': {
    name: 'Aggressive Growth',
    description: 'Focuses on high-growth assets with higher volatility for maximum upside.',
    macroContext: [
      'Tech sector expected to outperform.',
      'Risk appetite is high among investors.',
      'Crypto markets show strong momentum.'
    ],
    assets: [
      { symbol: 'TSLA', weight: 35 },
      { symbol: 'BTC', weight: 35 },
      { symbol: 'ETH', weight: 20 },
      { symbol: 'ARKK', weight: 10 },
    ],
  },
  'Defensive Income': {
    name: 'Defensive Income',
    description: 'Prioritizes capital preservation and steady income with low volatility.',
    macroContext: [
      'Interest rates remain elevated.',
      'Market volatility is expected to persist.',
      'Defensive sectors favored.'
    ],
    assets: [
      { symbol: 'BND', weight: 40 },
      { symbol: 'GLD', weight: 30 },
      { symbol: 'JNJ', weight: 20 },
      { symbol: 'KO', weight: 10 },
    ],
  },
};

const MOCK_ALERTS: AlertPanelProps['alerts'] = [
  {
    id: '1',
    type: 'signal',
    message: 'BTC/USD MACD crossover detected. Bullish momentum likely.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2m ago
  },
  {
    id: '2',
    type: 'macro',
    message: 'Fed announces rate hold. Markets steady.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10m ago
  },
  {
    id: '3',
    type: 'gpt',
    message: 'GPT: Consider rebalancing towards defensive assets.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
  },
  {
    id: '4',
    type: 'signal',
    message: 'AAPL earnings beat expectations.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
  },
];

const MOCK_VAULT_ALLOC = {
  AAPL: 28,
  BTC: 22,
  BND: 30,
  GLD: 20,
};
const MOCK_STRATEGY_ALLOC = {
  AAPL: 30,
  BTC: 20,
  BND: 25,
  GLD: 25,
};

const MOCK_REPORT_CONTENT = {
  summary: 'The vault delivered steady growth this quarter, outperforming its benchmark by 1.2%. Risk was well managed, and the portfolio remained resilient during market volatility.',
  macroContext: [
    'US inflation cooled to 3.1%, supporting risk assets.',
    'Fed policy remained steady, with no rate hikes this quarter.',
    'Crypto markets saw renewed institutional inflows.'
  ],
  strategyReview: 'The Balanced strategy allocation provided a strong risk-adjusted return, with equities and gold contributing most to performance. Crypto exposure added volatility but also upside.',
  nextSteps: 'Consider a minor rebalance to increase bond exposure and trim outperforming equities. Monitor macro signals for potential rate changes next quarter.'
};

const VaultDashboard: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>(MOCK_STRATEGIES[0]);
  const [isRationaleVisible, setIsRationaleVisible] = useState(false);
  const [isAlertPanelVisible, setIsAlertPanelVisible] = useState(false);
  const [isBacktesterVisible, setIsBacktesterVisible] = useState(false);
  const [isNarrativeVisible, setIsNarrativeVisible] = useState(false);

  // Mock allocations for rebalance
  const vaultAlloc = MOCK_VAULT_ALLOC;
  const strategyAlloc = MOCK_STRATEGY_ALLOC;

  // Notification center
  const { notifications, addNotification, markAsRead, clearAll } = useNotificationCenter();

  const handleSelectStrategy = (strategy: string) => {
    setSelectedStrategy(strategy);
    setIsRationaleVisible(true);
  };

  const handleRebalance = () => {
    // Placeholder: log and show toast
    // eslint-disable-next-line no-console
    console.log('Rebalance triggered:', { vaultAlloc, strategyAlloc });
    if (typeof window !== 'undefined') {
      window.alert('Vault rebalanced to match strategy! (mock)');
    }
  };

  const handleTriggerMacroAlert = () => {
    addNotification({
      type: 'macro',
      message: 'BTC macro event: Volatility spike detected. Review your vault exposure.',
    });
  };

  return (
    <AppShell title="Vault Dashboard">
      <NotificationCenter
        notifications={notifications}
        markAsRead={markAsRead}
        clearAll={clearAll}
      />
      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 md:px-0 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between mb-2">
          <VaultStrategySelector
            selectedStrategy={selectedStrategy}
            onSelect={handleSelectStrategy}
            strategies={MOCK_STRATEGIES}
          />
          <button
            type="button"
            className="ml-2 px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold shadow hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring"
            onClick={() => setIsAlertPanelVisible(true)}
            aria-label="Show alerts"
          >
            Alerts
          </button>
        </div>
        <VaultRebalanceTrigger
          vaultAlloc={vaultAlloc}
          strategyAlloc={strategyAlloc}
          onRebalance={handleRebalance}
        />
        <button
          type="button"
          className="w-full md:w-auto px-4 py-2 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 font-semibold shadow hover:bg-green-200 dark:hover:bg-green-800 focus:outline-none focus:ring text-base transition-colors"
          onClick={() => setIsNarrativeVisible(true)}
          aria-label="Generate Report"
        >
          Generate Report
        </button>
        <button
          type="button"
          className="w-full md:w-auto px-4 py-2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold shadow hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring text-base transition-colors"
          onClick={handleTriggerMacroAlert}
          aria-label="Trigger BTC Macro Alert"
        >
          Trigger BTC Macro Alert
        </button>
        <VaultAssetsPanel />
        <div className="flex justify-end mt-4">
          <button
            type="button"
            className="px-4 py-2 rounded bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 font-semibold shadow hover:bg-orange-200 dark:hover:bg-orange-800 focus:outline-none focus:ring"
            onClick={() => setIsBacktesterVisible(true)}
            aria-label="Open backtester"
          >
            Backtest Vault vs. Strategy
          </button>
        </div>
      </div>
      <StrategyRationalePanel
        strategy={MOCK_RATIONALES[selectedStrategy]}
        isVisible={isRationaleVisible}
        onClose={() => setIsRationaleVisible(false)}
      />
      <AlertPanel
        isVisible={isAlertPanelVisible}
        onClose={() => setIsAlertPanelVisible(false)}
        alerts={MOCK_ALERTS}
      />
      <VaultBacktesterPanel
        isVisible={isBacktesterVisible}
        onClose={() => setIsBacktesterVisible(false)}
        vaultAlloc={vaultAlloc}
        strategyAlloc={strategyAlloc}
      />
      <VaultNarrativeReportPanel
        vaultName="StackMotive Vault"
        isVisible={isNarrativeVisible}
        onClose={() => setIsNarrativeVisible(false)}
        reportContent={MOCK_REPORT_CONTENT}
      />
    </AppShell>
  );
};

export default VaultDashboard; 