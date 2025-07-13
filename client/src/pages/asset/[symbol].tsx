// Use dynamic import for router to support both Next.js and other SSR setups
let useRouter: any;
try {
  // @ts-ignore
  useRouter = require('next/router').useRouter;
} catch {
  useRouter = () => ({ query: { symbol: '' } });
}
import React, { useEffect, useState } from 'react';
import { useSignalLogStore } from '../../store/signalLog';
import { useAssetSentiment } from '../../hooks/useAssetSentiment';
import { useAssetStrategyProfile } from '../../hooks/useAssetStrategyProfile';
import { useAssetAllocation } from '../../hooks/useAssetAllocation';
import { DataTable } from '../../components/ui/data-table';
import { TimelineView } from '../../components/ui/TimelineView';
import { ChartContainer as Chart } from '../../components/ui/chart';
import { Button } from '../../components/ui/button';

const AssetDrillDownPage: React.FC = () => {
  const router = useRouter();
  const { symbol } = router.query as { symbol: string };
  const [view, setView] = useState<'timeline' | 'table'>('timeline');
  const { logEntries, setFilters, fetchMore, loading, anomalyMap, expandedRows } = useSignalLogStore();
  const { sentiment, trend, loading: loadingSentiment } = useAssetSentiment(symbol);
  const { strategy, loading: loadingStrategy } = useAssetStrategyProfile(symbol);
  const { allocation, loading: loadingAllocation } = useAssetAllocation(symbol);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Fetch all data on mount or symbol change
  useEffect(() => {
    if (!symbol) return;
    setFilters({ assets: [symbol] });
    fetchMore();
    setLoadingPerformance(true);
    fetch(`/api/asset/${symbol}/performance`)
      .then(res => res.json())
      .then(setPerformanceData)
      .finally(() => setLoadingPerformance(false));
  }, [symbol]);

  if (!symbol) return <div className="p-4">Loading...</div>;

  return (
    <main className="max-w-5xl mx-auto p-2 md:p-6">
      <header className="mb-4 flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
        <h1 className="text-2xl font-bold">{symbol} Asset Analytics</h1>
        <Button onClick={() => setView(view === 'timeline' ? 'table' : 'timeline')} aria-pressed={view === 'timeline'}>
          {view === 'timeline' ? 'Table View' : 'Timeline View'}
        </Button>
      </header>
      <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Signals & Overlays</h2>
          {view === 'timeline' ? (
            <TimelineView
              entries={logEntries}
              expandedRows={expandedRows}
              onToggleRow={() => {}}
              onTag={() => {}}
              onAnnotate={() => {}}
              anomalyMap={anomalyMap}
              search={symbol}
              timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
              locale={typeof navigator !== 'undefined' ? navigator.language : 'en-US'}
              deepLink={() => ''}
            />
          ) : (
            <DataTable
              data={logEntries}
              expandedRows={expandedRows}
              onToggleRow={() => {}}
              onTag={() => {}}
              onAnnotate={() => {}}
              anomalyMap={anomalyMap}
              search={symbol}
              timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
              locale={typeof navigator !== 'undefined' ? navigator.language : 'en-US'}
              deepLink={() => ''}
            />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Sentiment & Macro</h2>
          {loadingSentiment ? (
            <div>Loading sentiment...</div>
          ) : sentiment ? (
            <div className="mb-4">
              <div className="text-xs text-gray-500">Last updated: {new Date(sentiment.lastUpdated).toLocaleString()}</div>
              <div className="text-xl font-bold">{sentiment.score}</div>
              <div className="text-sm">{sentiment.trend}</div>
              <div className="text-xs">Macro: {sentiment.macroImpact}</div>
              {trend && trend.length > 0 && (
                <div className="mt-2">
                  <Chart
                    data={trend.map(t => ({ date: t.date, value: t.value }))}
                    config={{ value: { label: 'Sentiment', color: '#8884d8' } }}
                  />
                </div>
              )}
            </div>
          ) : <div>No sentiment data.</div>}
          <h2 className="text-lg font-semibold mb-2 mt-4">Allocation & Strategy Role</h2>
          {loadingAllocation ? (
            <div>Loading allocation...</div>
          ) : allocation ? (
            <div className="mb-2">
              <div className="text-xs">Portfolio %: <b>{allocation.percentage.toFixed(2)}%</b></div>
              <div className="text-xs">Role: {allocation.role}</div>
            </div>
          ) : <div>No allocation data.</div>}
          {loadingStrategy ? (
            <div>Loading strategy...</div>
          ) : strategy ? (
            <div className="mb-2">
              <div className="text-xs">Strategy: <b>{strategy.name}</b></div>
              <div className="text-xs">Type: {strategy.type}</div>
              <div className="text-xs">Status: {strategy.status}</div>
            </div>
          ) : <div>No strategy data.</div>}
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Historical Performance</h2>
        {loadingPerformance ? (
          <div>Loading performance...</div>
        ) : performanceData.length ? (
          <Chart
            data={performanceData}
            config={{ value: { label: 'Performance', color: '#10b981' } }}
          />
        ) : <div>No performance data.</div>}
      </section>
    </main>
  );
};

export default AssetDrillDownPage; 