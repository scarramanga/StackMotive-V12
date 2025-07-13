export interface TradeFilters {
  strategyId?: number;
  symbol?: string;
  type?: 'BUY' | 'SELL';
  status?: 'open' | 'closed' | 'canceled';
  startDate?: Date;
  endDate?: Date;
  exchange?: string;
  isAutomated?: boolean;
}

export interface TradeResponse {
  id: number;
  userId: number;
  strategyId?: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  amount: string;
  entryPrice: string;
  exitPrice: string | null;
  exchange: string;
  status: 'open' | 'closed' | 'canceled';
  isAutomated: boolean;
  profitLoss: string | null;
  profitLossPercentage: string | null;
  entryTime: Date;
  exitTime: Date | null;
  taxImpact: string | null;
  strategy?: {
    name: string;
    riskPercentage: string | null;
  };
} 