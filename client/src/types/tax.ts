// Block 4: Tax Reporting Types

export type TaxJurisdiction = 'NZ' | 'AU' | 'US' | 'GB';
export type CostBasisMethod = 'FIFO' | 'AVERAGE' | 'USER_SET';

export interface TaxableEvent {
  id: string;
  date: string;
  type: 'trade' | 'dividend' | 'rebalance' | 'staking' | 'interest' | 'other';
  asset: string;
  assetClass: 'crypto' | 'equity' | 'fund' | 'other';
  quantity: number;
  proceeds: number;
  costBasis: number;
  gain: number;
  incomeType?: 'dividend' | 'interest' | 'staking';
  notes?: string;
  source: 'sync' | 'manual';
}

export interface TaxReportSummary {
  jurisdiction: TaxJurisdiction;
  costBasis: CostBasisMethod;
  year: string;
  events: TaxableEvent[];
  capitalGains: {
    shortTerm: number;
    longTerm: number;
    total: number;
  };
  income: {
    dividends: number;
    interest: number;
    staking: number;
    total: number;
  };
  validationWarnings: string[];
} 