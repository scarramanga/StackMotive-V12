import { TaxRegion, UserProfile } from '../modules/tax/TaxModule';

export function useTaxRules(region: TaxRegion, profile: UserProfile) {
  if (region === 'AU') {
    return {
      region: 'AU',
      yearEnd: '30 June',
      cgtDiscount: 0.5,
      costBasis: 'FIFO',
      notes: '50% CGT discount if held >12 months. FIFO cost basis.',
      thresholds: { cgtDiscountDays: 365 },
    };
  } else {
    return {
      region: 'NZ',
      yearEnd: '31 March',
      FIFThreshold: 50000,
      notes: profile === 'trader' ? 'All gains as income. FIF for >NZ$50K foreign.' : 'FIF for >NZ$50K foreign assets.',
      thresholds: { FIF: 50000 },
    };
  }
} 