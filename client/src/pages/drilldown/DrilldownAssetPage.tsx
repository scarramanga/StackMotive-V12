// Block 8 Implementation: DrilldownAssetPage scaffold for asset drilldown tabs
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import JournalLog from '@/components/ui/JournalLog';
import GPTAdvisor from '@/components/ui/GPTAdvisor';

const TABS = ['Performance', 'News', 'Trades', 'Logs'];

const DrilldownAssetPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Performance');
  // Mock asset symbol/name
  const assetSymbol = 'BTC';
  const assetName = 'Bitcoin';

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-1">{assetSymbol} <span className="text-lg text-muted-foreground font-normal">({assetName})</span></h1>
          <p className="text-muted-foreground">Asset drilldown view (scaffold only)</p>
        </div>
        <div className="border-b border-border mb-4 flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors focus:outline-none
                ${activeTab === tab ? 'bg-background border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded shadow p-6 min-h-[300px]">
          {activeTab === 'Performance' && (
            <div>
              <GPTAdvisor assetSymbol="BTC" contextLabel="macro" showHeader />
              <div className="text-center text-muted-foreground">Performance view coming soon.</div>
            </div>
          )}
          {activeTab === 'News' && (
            <div className="text-center text-muted-foreground">News view coming soon.</div>
          )}
          {activeTab === 'Trades' && (
            <div className="text-center text-muted-foreground">Trades view coming soon.</div>
          )}
          {activeTab === 'Logs' && (
            <div>
              <JournalLog />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default DrilldownAssetPage; 