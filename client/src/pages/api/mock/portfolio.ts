import type { NextApiRequest, NextApiResponse } from 'next';

const MOCK_PORTFOLIO = [
  { symbol: 'BTC', name: 'Bitcoin', quantity: 0.5, avgPrice: 60000, currentPrice: 68000 },
  { symbol: 'ETH', name: 'Ethereum', quantity: 2, avgPrice: 3200, currentPrice: 3800 },
  { symbol: 'TSLA', name: 'Tesla', quantity: 10, avgPrice: 150, currentPrice: 180 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setTimeout(() => {
    res.status(200).json(MOCK_PORTFOLIO);
  }, 400); // Simulate delay
} 