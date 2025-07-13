export type TaxRegion = 'AU' | 'NZ';
export type UserProfile = 'investor' | 'trader';

export interface Transaction {
  id: string;
  symbol: string;
  date: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  costBasis?: number;
  proceeds?: number;
  heldDays?: number;
}

export interface CGTEvent {
  transactionId: string;
  gain: number;
  discounted: boolean;
  heldDays: number;
}

export interface FIFAttribution {
  asset: string;
  attributed: number;
}

export interface TaxReportAU {
  realizedGains: number;
  discountedGains: number;
  CGTEvents: CGTEvent[];
}

export interface TaxReportNZ {
  attributedIncome: number;
  FIFAttribution: FIFAttribution[];
  foreignTaxDeductions: number;
}

export function generateTaxReport(
  transactions: Transaction[],
  region: TaxRegion,
  profile: UserProfile
): TaxReportAU | TaxReportNZ {
  if (region === 'AU') {
    // FIFO cost basis, 50% discount if held >12 months (365 days)
    let realizedGains = 0;
    let discountedGains = 0;
    const CGTEvents: CGTEvent[] = [];
    // Mock: treat every sell as a CGT event
    transactions.filter(t => t.action === 'sell').forEach(t => {
      const heldDays = t.heldDays ?? 400; // mock: assume >12m
      const gain = (t.price - (t.costBasis ?? t.price * 0.7)) * t.quantity;
      const discounted = heldDays > 365;
      if (discounted) {
        discountedGains += gain * 0.5;
      } else {
        realizedGains += gain;
      }
      CGTEvents.push({ transactionId: t.id, gain, discounted, heldDays });
    });
    return { realizedGains, discountedGains, CGTEvents };
  } else {
    // NZ: If trader, all gains as income. If >NZ$50K foreign, apply FIF.
    let attributedIncome = 0;
    let FIFAttribution: FIFAttribution[] = [];
    let foreignTaxDeductions = 0;
    if (profile === 'trader') {
      attributedIncome = transactions.filter(t => t.action === 'sell').reduce((sum, t) => sum + ((t.price - (t.costBasis ?? t.price * 0.7)) * t.quantity), 0);
    }
    // Mock: if any asset symbol starts with 'F' and quantity*price > 50K, apply FIF
    transactions.forEach(t => {
      if (t.symbol.startsWith('F') && t.quantity * t.price > 50000) {
        FIFAttribution.push({ asset: t.symbol, attributed: 1000 });
      }
    });
    // Mock: fixed deduction
    foreignTaxDeductions = 200;
    return { attributedIncome, FIFAttribution, foreignTaxDeductions };
  }
} 