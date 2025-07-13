export interface StrategyInput {
  name: string;
  symbol: string;
  exchange: string;
  description?: string;
  accountId?: number;
  indicators: Record<string, any>;
  entryConditions: Record<string, any>;
  exitConditions: Record<string, any>;
  riskPercentage?: string;
  status: 'active' | 'inactive' | 'testing';
  stopLoss?: {
    enabled: boolean;
    percent: number;
    trailing: boolean;
  };
  takeProfit?: {
    enabled: boolean;
    percent: number;
    trailing: boolean;
  };
  timeframes: string[];
}

export interface StrategyResponse extends StrategyInput {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  performance: string | null;
  winRate: string | null;
  profitFactor: string | null;
} 