// Block 4: Tax Transformation Logic
import type { TaxJurisdiction, CostBasisMethod, TaxableEvent, TaxReportSummary } from '../types/tax';

interface TransformArgs {
  jurisdiction: TaxJurisdiction;
  costBasis: CostBasisMethod;
  year: string;
  events: TaxableEvent[];
}

export function transformTaxData({ jurisdiction, costBasis, year, events }: TransformArgs): TaxReportSummary {
  // Filter events by year
  const filtered = events.filter(e => e.date >= year + '-01-01' && e.date <= year + '-12-31');
  // Capital gains
  let shortTerm = 0, longTerm = 0, totalGains = 0;
  // Income
  let dividends = 0, interest = 0, staking = 0;
  // Validation
  const warnings: string[] = [];
  for (const e of filtered) {
    if (e.type === 'trade' || e.type === 'rebalance') {
      if (jurisdiction === 'NZ' || jurisdiction === 'GB') {
        totalGains += e.gain;
      } else {
        // AU/US: short/long term
        if (e.gain && e.notes?.includes('short')) shortTerm += e.gain;
        else if (e.gain && e.notes?.includes('long')) longTerm += e.gain;
        totalGains += e.gain;
      }
    }
    if (e.type === 'dividend' || e.incomeType === 'dividend') dividends += e.proceeds;
    if (e.type === 'interest' || e.incomeType === 'interest') interest += e.proceeds;
    if (e.type === 'staking' || e.incomeType === 'staking') staking += e.proceeds;
    // Validation
    if (!e.asset || !e.date || isNaN(e.proceeds)) warnings.push(`Missing or invalid data for event ${e.id}`);
  }
  return {
    jurisdiction,
    costBasis,
    year,
    events: filtered,
    capitalGains: { shortTerm, longTerm, total: totalGains },
    income: { dividends, interest, staking, total: dividends + interest + staking },
    validationWarnings: warnings,
  };
} 