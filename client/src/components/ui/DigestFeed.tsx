// Block 18 Implementation: DigestFeed component
import React, { useState } from 'react';
import clsx from 'clsx';

// Block 18 Implementation: Mock digest data
const MOCK_DIGEST = [
  {
    id: '1',
    title: 'BTC Whale Alert',
    summary: 'Large BTC transfer detected on-chain.',
    severity: 'red',
    timestamp: '2024-06-10T09:15:00Z',
    context: 'social',
  },
  {
    id: '2',
    title: 'ETH RSI Signal',
    summary: 'ETH RSI dropped below 30 (oversold).',
    severity: 'yellow',
    timestamp: '2024-06-10T08:45:00Z',
    context: 'technical',
  },
  {
    id: '3',
    title: 'TSLA Macro Update',
    summary: 'TSLA flagged in macro digest for volatility.',
    severity: 'green',
    timestamp: '2024-06-09T17:30:00Z',
    context: 'macro',
  },
  {
    id: '4',
    title: 'BTC MACD Crossover',
    summary: 'BTC MACD bullish crossover detected.',
    severity: 'green',
    timestamp: '2024-06-10T07:10:00Z',
    context: 'technical',
  },
  {
    id: '5',
    title: 'Market Volatility Spike',
    summary: 'VIX index spiked above 30.',
    severity: 'red',
    timestamp: '2024-06-09T16:00:00Z',
    context: 'macro',
  },
  {
    id: '6',
    title: 'BTC Narrative Update',
    summary: 'BTC narrative aligns with macro deflation signals.',
    severity: 'yellow',
    timestamp: '2024-06-10T10:00:00Z',
    context: 'macro',
  },
  {
    id: '7',
    title: 'ETH Whale Alert',
    summary: 'Large ETH transfer detected on-chain.',
    severity: 'red',
    timestamp: '2024-06-09T15:30:00Z',
    context: 'social',
  },
  {
    id: '8',
    title: 'TSLA RSI Signal',
    summary: 'TSLA RSI above 70 (overbought).',
    severity: 'yellow',
    timestamp: '2024-06-10T11:00:00Z',
    context: 'technical',
  },
];

// Block 18 Implementation: Group by day
function groupByDay(items: typeof MOCK_DIGEST) {
  return items.reduce((acc: Record<string, typeof MOCK_DIGEST>, item) => {
    const day = item.timestamp.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<string, typeof MOCK_DIGEST>);
}

const SEVERITY_COLORS = {
  red: 'bg-red-500 text-white',
  yellow: 'bg-yellow-400 text-black',
  green: 'bg-green-500 text-white',
};

export const DigestFeed: React.FC = () => {
  // Block 18 Implementation: Collapsible state
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const grouped = groupByDay(MOCK_DIGEST);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const toggleDay = (day: string) => {
    setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow p-4 mt-6 overflow-y-auto max-h-[80vh]">
      <div className="font-bold text-lg mb-4">Digest Feed</div>
      {days.map((day) => (
        <div key={day} className="mb-4">
          <button
            className="w-full flex items-center justify-between py-2 px-3 bg-muted rounded hover:bg-muted/70 transition"
            onClick={() => toggleDay(day)}
          >
            <span className="font-semibold">{new Date(day).toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">{openDays[day] ? 'Hide' : 'Show'}</span>
          </button>
          {openDays[day] && (
            <div className="mt-2 space-y-2">
              {grouped[day].map((item) => (
                <div key={item.id} className="p-3 rounded border flex flex-col sm:flex-row sm:items-center gap-2 bg-muted/30">
                  <span className={clsx('px-2 py-1 rounded text-xs font-bold', SEVERITY_COLORS[item.severity])}>{item.severity.toUpperCase()}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.summary}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-neutral-800 ml-auto">{item.context}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 