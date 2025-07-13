import { useState } from 'react';

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  asset: string;
  category: string;
  timestamp: string;
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    headline: 'BTC breaks $70k as ETF inflows surge',
    summary: 'Bitcoin hits new all-time high amid institutional demand.',
    asset: 'BTC',
    category: 'BTC',
    timestamp: '2025-06-04T10:00:00Z',
  },
  {
    id: '2',
    headline: 'NVIDIA posts record earnings, AI sector booms',
    summary: 'NVIDIA beats expectations, fueling AI rally.',
    asset: 'NVDA',
    category: 'AI',
    timestamp: '2025-06-03T18:00:00Z',
  },
  {
    id: '3',
    headline: 'Fed signals rate pause, markets rally',
    summary: 'Macro tailwinds as Fed holds rates steady.',
    asset: 'SPY',
    category: 'macro',
    timestamp: '2025-06-03T15:00:00Z',
  },
  {
    id: '4',
    headline: 'ETH upgrade launches successfully',
    summary: 'Ethereum network upgrade boosts scalability.',
    asset: 'ETH',
    category: 'earnings',
    timestamp: '2025-06-02T12:00:00Z',
  },
  {
    id: '5',
    headline: 'Apple unveils new AI-powered device',
    summary: 'AAPL jumps as new product line is announced.',
    asset: 'AAPL',
    category: 'AI',
    timestamp: '2025-06-01T09:00:00Z',
  },
];

export function useNewsFeed() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(MOCK_NEWS);

  function filterNews({ asset, category, dateRange }: { asset?: string; category?: string; dateRange?: [string, string] }) {
    let filtered = MOCK_NEWS;
    if (asset) filtered = filtered.filter(n => n.asset === asset);
    if (category) filtered = filtered.filter(n => n.category === category);
    if (dateRange) filtered = filtered.filter(n => n.timestamp >= dateRange[0] && n.timestamp <= dateRange[1]);
    setTimeout(() => setNewsItems(filtered), 300); // Simulate network delay
    // Block 54 Implementation: log filter changes
    // eslint-disable-next-line no-console
    console.log('[Block 54] News filter:', { asset, category, dateRange });
  }

  return { newsItems, filterNews };
} 