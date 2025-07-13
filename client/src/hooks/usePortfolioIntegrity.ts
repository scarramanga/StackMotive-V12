import { usePortfolio } from '@/contexts/PortfolioContext';
import { diffPositions, PositionChange } from '@/utils/PortfolioIntegrityEngine';
import { useMemo, useEffect } from 'react';

export function usePortfolioIntegrity(newPositions: any[]) {
  const { positions: oldPositions } = usePortfolio();
  const diffs = useMemo(() => diffPositions(oldPositions, newPositions), [oldPositions, newPositions]);
  const hasDiscrepancies = diffs.length > 0;
  useEffect(() => {
    if (hasDiscrepancies) {
      console.warn('[PortfolioIntegrity] Discrepancies detected:', diffs);
    }
  }, [hasDiscrepancies, diffs]);
  return { diffs, hasDiscrepancies };
}

export function generateDigestEntries(diffs: PositionChange[]) {
  return diffs.map(diff => {
    if (diff.type === 'added') {
      return {
        id: `added-${diff.symbol}`,
        title: `Position Added: ${diff.symbol}`,
        summary: `New position for ${diff.symbol} (${diff.newPosition.quantity} @ ${diff.newPosition.currentPrice})`,
        severity: 'green',
        timestamp: new Date().toISOString(),
        context: 'integrity',
      };
    } else if (diff.type === 'removed') {
      return {
        id: `removed-${diff.symbol}`,
        title: `Position Removed: ${diff.symbol}`,
        summary: `Position for ${diff.symbol} removed (was ${diff.oldPosition.quantity} @ ${diff.oldPosition.currentPrice})`,
        severity: 'yellow',
        timestamp: new Date().toISOString(),
        context: 'integrity',
      };
    } else if (diff.type === 'modified') {
      const fields = Object.entries(diff.deltas).map(([k, v]) => `${k}: ${v.from} → ${v.to}`).join(', ');
      return {
        id: `modified-${diff.symbol}`,
        title: `Position Modified: ${diff.symbol}`,
        summary: `Fields changed: ${fields}`,
        severity: 'red',
        timestamp: new Date().toISOString(),
        context: 'integrity',
      };
    }
    return null;
  }).filter(Boolean);
}

// Block 49 Implementation: Portfolio Integrity Scanner (Risk Divergence Detection)
// SSR-safe, mock logic only, frontend-only
export interface IntegrityAlert {
  type: 'over-allocation' | 'belief-violation' | 'unscored-asset';
  message: string;
  asset: string;
  severity: 'low' | 'medium' | 'high';
}

export function usePortfolioIntegrityAlerts({ holdings, vaultBeliefs, strategy }: {
  holdings: { symbol: string; shares: number; valueUSD: number }[];
  vaultBeliefs: { id: string; statement: string; confidence: number }[];
  strategy?: { maxAllocation?: number };
}) {
  // Mock logic
  const alerts: IntegrityAlert[] = [];
  holdings.forEach(h => {
    // Over-allocation: valueUSD > 20000 or > strategy.maxAllocation
    if ((strategy?.maxAllocation && h.valueUSD > strategy.maxAllocation) || h.valueUSD > 20000) {
      alerts.push({
        type: 'over-allocation',
        message: `Over-allocated to ${h.symbol}`,
        asset: h.symbol,
        severity: 'high',
      });
    }
    // Belief violation: e.g., BTC short exposure if belief is strong
    if (h.symbol === 'BTC' && vaultBeliefs.some(b => b.id === 'btc-sov-store' && b.confidence >= 4)) {
      // If mock: treat as violation if >0.7 BTC
      if (h.shares > 0.7) {
        alerts.push({
          type: 'belief-violation',
          message: 'BTC holding exceeds conviction threshold',
          asset: 'BTC',
          severity: 'medium',
        });
      }
    }
    // Unscored asset: not in beliefs
    if (!vaultBeliefs.some(b => b.statement.toLowerCase().includes(h.symbol.toLowerCase()))) {
      alerts.push({
        type: 'unscored-asset',
        message: `No conviction or belief for ${h.symbol}`,
        asset: h.symbol,
        severity: 'low',
      });
    }
  });
  return alerts;
} 