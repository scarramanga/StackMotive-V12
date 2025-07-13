import React from 'react';
import AppShell from '../components/layout/AppShell';
import { usePortfolio } from '../contexts/PortfolioContext';
import { VaultStatusStrip } from '../components/ui/VaultStatusStrip';
import { AssetSignalGrid, AssetSignalGridSignal } from '../components/tiles/AssetSignalGrid';
import { useSignalPanel } from '../hooks/useSignalPanel';
import { PanelAnimator } from '../components/animation/PanelAnimator';
import { SignalGPTPanel } from '../components/panels/SignalGPTPanel';
import { SignalDetailsPanel } from '../components/panels/SignalDetailsPanel';
import WatchlistWeightPanel from '../components/panels/WatchlistWeightPanel';
import OverlayHistoryPanel from '../components/panels/OverlayHistoryPanel';
import VaultAllocator from '../components/panels/VaultAllocator';
import ReportArchive from '../components/panels/ReportArchive';
import { MarketClockIndicator } from '@/components/MarketClockIndicator';
import StrategyPresetMarketplace from '../components/strategy/StrategyPresetMarketplace';
import SyncHealthMonitor from '../components/dashboard/SyncHealthMonitor';
import { usePortfolioSync } from '../hooks/usePortfolioSync';
import { AssetAllocationChart } from '../components/portfolio/asset-allocation-chart';
import RiskExposureMeter from '../components/analytics/RiskExposureMeter';
import { usePortfolioHealthStore } from '../store/portfolioHealth';

const ASSETS = [
  'BTC/USD',
  'ETH/USD',
  'S&P 500',
  'AAPL',
  'TSLA',
  'DOGE',
  'EUR/USD',
];

const SIGNALS: Record<string, AssetSignalGridSignal> = {
  'BTC/USD': {
    type: 'technical',
    title: 'MACD',
    value: 'Bullish',
    confidence: 0.82,
    rationale: 'MACD crossover detected. Upward momentum likely.',
    sparkline: [0.5, 0.6, 0.7, 0.8, 0.82, 0.81, 0.83],
    asset: 'BTC/USD',
  },
  'ETH/USD': {
    type: 'technical',
    title: 'RSI',
    value: 'Neutral',
    confidence: 0.55,
    rationale: 'RSI in mid-range. No strong signal.',
    sparkline: [0.5, 0.52, 0.54, 0.55, 0.56, 0.55, 0.55],
    asset: 'ETH/USD',
  },
  'S&P 500': {
    type: 'macro',
    title: 'VIX',
    value: 'Low',
    confidence: 0.73,
    rationale: 'Volatility index is low. Market stable.',
    sparkline: [0.7, 0.72, 0.71, 0.7, 0.69, 0.7, 0.73],
    asset: 'S&P 500',
  },
  'AAPL': {
    type: 'news',
    title: 'News Sentiment',
    value: 'Positive',
    confidence: 0.68,
    rationale: 'Recent news coverage is positive.',
    sparkline: [0.6, 0.65, 0.67, 0.68, 0.7, 0.69, 0.68],
    asset: 'AAPL',
  },
  'TSLA': {
    type: 'earnings',
    title: 'Earnings',
    value: 'Beat',
    confidence: 0.91,
    rationale: 'Earnings beat expectations.',
    sparkline: [0.8, 0.85, 0.9, 0.91, 0.92, 0.91, 0.9],
    asset: 'TSLA',
  },
  'DOGE': {
    type: 'social',
    title: 'Social Sentiment',
    value: 'Hyped',
    confidence: 0.77,
    rationale: 'Social media mentions surging.',
    sparkline: [0.6, 0.65, 0.7, 0.75, 0.77, 0.76, 0.77],
    asset: 'DOGE',
  },
  'EUR/USD': {
    type: 'macro',
    title: 'Geopolitical Risk',
    value: 'Elevated',
    confidence: 0.61,
    rationale: 'Geopolitical tensions impacting currency.',
    sparkline: [0.5, 0.55, 0.6, 0.61, 0.62, 0.61, 0.6],
    asset: 'EUR/USD',
  },
};

const DashboardPage: React.FC = () => {
  const { activeVaultId } = usePortfolio();
  const { selectedSignal, panelType, openPanel, closePanel, followedSignals, toggleFollow } = useSignalPanel();
  const { syncJob, handleCSVUpload } = usePortfolioSync();
  const { breakdown } = usePortfolioHealthStore();
  const riskScore = Math.round((1 - breakdown.risk) * 100);
  const riskExplanation = `Risk is calculated from portfolio volatility, beta, and overlay parameters. Lower is safer. Current normalized risk: ${(breakdown.risk * 100).toFixed(1)}%.`;

  if (!activeVaultId) {
    return (
      <AppShell title="Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <span className="text-lg font-semibold text-destructive">Vault not selected</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-0">
        <div className="flex justify-end mb-4">
          <SyncHealthMonitor syncJob={syncJob} onForceResync={() => {/* TODO: Implement real resync */}} />
        </div>
        <div className="flex justify-end mb-4">
          <MarketClockIndicator market="NYSE" timezone="America/New_York" openTime="09:30" closeTime="16:00" />
        </div>
        <VaultStatusStrip className="mb-4" />
        <AssetSignalGrid
          assets={ASSETS}
          signals={SIGNALS}
          onTileAction={(asset, action) => {
            if (action === 'openGPT') openPanel(asset, 'gpt');
            if (action === 'showDetails') openPanel(asset, 'details');
            if (action === 'follow') toggleFollow(asset);
          }}
        />
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Watchlist Weighting</h3>
          <WatchlistWeightPanel />
        </div>
        <div className="mt-8">
          <details className="group">
            <summary className="text-lg font-semibold cursor-pointer select-none mb-2 group-open:mb-4">Overlay History</summary>
            <OverlayHistoryPanel />
          </details>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Vault Category Allocator</h3>
          <VaultAllocator />
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Reporting Archive</h3>
          <ReportArchive />
        </div>
        <div className="mt-8">
          <StrategyPresetMarketplace />
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Asset Class Allocation</h3>
          <AssetAllocationChart />
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Risk Exposure Meter</h3>
          <RiskExposureMeter riskScore={riskScore} explanation={riskExplanation} />
        </div>
        {panelType === 'gpt' && selectedSignal && (
          <PanelAnimator isVisible onClose={closePanel}>
            <SignalGPTPanel asset={selectedSignal} onClose={closePanel} />
          </PanelAnimator>
        )}
        {panelType === 'details' && selectedSignal && (
          <PanelAnimator isVisible onClose={closePanel}>
            <SignalDetailsPanel asset={selectedSignal} onClose={closePanel} />
          </PanelAnimator>
        )}
      </div>
    </AppShell>
  );
};

export default DashboardPage; 