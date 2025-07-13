import { useRef } from 'react';

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  valueUSD: number;
}

export interface PortfolioState {
  timestamp: string;
  holdings: PortfolioHolding[];
  cashBalance: number;
  event?: string; // e.g., "Bought 10 NVDA at $500"
}

const MOCK_TIMELINE: PortfolioState[] = [
  {
    timestamp: '2025-06-01T09:00:00Z',
    holdings: [
      { symbol: 'BTC', shares: 0.5, valueUSD: 20000 },
      { symbol: 'AAPL', shares: 10, valueUSD: 1800 },
    ],
    cashBalance: 5000,
    event: 'Initial deposit',
  },
  {
    timestamp: '2025-06-01T12:00:00Z',
    holdings: [
      { symbol: 'BTC', shares: 0.5, valueUSD: 21000 },
      { symbol: 'AAPL', shares: 10, valueUSD: 1850 },
    ],
    cashBalance: 5000,
    event: 'Market movement',
  },
  {
    timestamp: '2025-06-02T10:00:00Z',
    holdings: [
      { symbol: 'BTC', shares: 0.7, valueUSD: 30000 },
      { symbol: 'AAPL', shares: 10, valueUSD: 1900 },
    ],
    cashBalance: 3000,
    event: 'Bought 0.2 BTC at $10,000',
  },
  {
    timestamp: '2025-06-03T09:00:00Z',
    holdings: [
      { symbol: 'BTC', shares: 0.7, valueUSD: 32000 },
      { symbol: 'AAPL', shares: 5, valueUSD: 950 },
      { symbol: 'NVDA', shares: 10, valueUSD: 5000 },
    ],
    cashBalance: 2500,
    event: 'Bought 10 NVDA at $500, Sold 5 AAPL at $190',
  },
  {
    timestamp: '2025-06-04T10:00:00Z',
    holdings: [
      { symbol: 'BTC', shares: 0.7, valueUSD: 34000 },
      { symbol: 'NVDA', shares: 10, valueUSD: 5200 },
    ],
    cashBalance: 2500,
    event: 'AAPL removed (sold out)',
  },
];

export function usePortfolioTimeline() {
  // getTimeline: returns full array
  function getTimeline(): PortfolioState[] {
    return MOCK_TIMELINE;
  }

  // getStateAt: returns closest state at or before timestamp
  function getStateAt(timestamp: string): PortfolioState | undefined {
    return [...MOCK_TIMELINE].reverse().find(s => s.timestamp <= timestamp);
  }

  // playback: steps through states at given speed (ms per step), calls onUpdate
  function playback(speed: number, onUpdate: (state: PortfolioState, idx: number) => void) {
    let idx = 0;
    const ref = { stopped: false };
    function step() {
      if (ref.stopped || idx >= MOCK_TIMELINE.length) return;
      onUpdate(MOCK_TIMELINE[idx], idx);
      idx++;
      if (idx < MOCK_TIMELINE.length) {
        setTimeout(step, speed);
      }
    }
    step();
    return () => { ref.stopped = true; };
  }

  return { getTimeline, getStateAt, playback };
} 