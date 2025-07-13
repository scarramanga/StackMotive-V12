/**
 * Shared Holding interface matching backend HoldingResponse
 * This contract must stay in sync between frontend and backend
 */
export interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

/**
 * Legacy interface for backward compatibility
 * @deprecated Use Holding interface instead
 */
export interface LegacyHolding {
  symbol: string;
  exchange: string;
  broker: string;
  quantity: number;
  averagePrice: number;
  totalValue: number;
  currentPrice: number;
  value: number;
  change: number;
  changePercent: number;
  allocation: number;
  type: 'equity' | 'crypto';
  trades: {
    id: number;
    entryPrice: number;
    amount: number;
    entryTime: string;
    strategy?: string;
  }[];
} 