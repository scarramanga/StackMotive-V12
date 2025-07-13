// Block 7: Portfolio Sync Types

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  costBasis: number;
  assetClass: 'equity' | 'crypto' | 'fund' | 'other';
  account: string;
}

export interface NormalizedPortfolio {
  positions: PortfolioPosition[];
  lastSync: string;
  source: 'csv' | 'ibkr' | 'sharesies' | 'manual';
  syncJobId: string;
}

export interface FieldMapping {
  [csvColumn: string]: string; // e.g., 'Ticker' -> 'symbol'
}

export interface SyncJob {
  id: string;
  userId: string;
  startedAt: string;
  finishedAt?: string;
  source: 'csv' | 'ibkr' | 'sharesies';
  status: 'pending' | 'success' | 'error';
  errorLog?: string;
  fieldMapping: FieldMapping;
} 