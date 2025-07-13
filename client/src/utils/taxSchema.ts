// Block 4: Tax Schema Abstraction
import type { TaxJurisdiction, CostBasisMethod, TaxableEvent, TaxReportSummary } from '../types/tax';

export function getFinancialYears(jurisdiction: TaxJurisdiction): { label: string; start: string; end: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  if (jurisdiction === 'NZ') {
    return [
      { label: `${year - 1}/${year}`, start: `${year - 1}-04-01`, end: `${year}-03-31` },
      { label: `${year}/${year + 1}`, start: `${year}-04-01`, end: `${year + 1}-03-31` },
    ];
  }
  if (jurisdiction === 'AU') {
    return [
      { label: `${year - 1}/${year}`, start: `${year - 1}-07-01`, end: `${year}-06-30` },
      { label: `${year}/${year + 1}`, start: `${year}-07-01`, end: `${year + 1}-06-30` },
    ];
  }
  if (jurisdiction === 'US') {
    return [
      { label: `${year - 1}`, start: `${year - 1}-01-01`, end: `${year - 1}-12-31` },
      { label: `${year}`, start: `${year}-01-01`, end: `${year}-12-31` },
    ];
  }
  if (jurisdiction === 'GB') {
    return [
      { label: `${year - 1}/${year}`, start: `${year - 1}-04-06`, end: `${year}-04-05` },
      { label: `${year}/${year + 1}`, start: `${year}-04-06`, end: `${year + 1}-04-05` },
    ];
  }
  return [];
}

export function getTaxRules(jurisdiction: TaxJurisdiction) {
  // Placeholder for extensible rules per jurisdiction
  if (jurisdiction === 'NZ') {
    return { shortLongTerm: false, costBasis: ['FIFO', 'AVERAGE'] };
  }
  if (jurisdiction === 'AU') {
    return { shortLongTerm: true, costBasis: ['FIFO', 'AVERAGE'] };
  }
  if (jurisdiction === 'US') {
    return { shortLongTerm: true, costBasis: ['FIFO', 'AVERAGE', 'USER_SET'] };
  }
  if (jurisdiction === 'GB') {
    return { shortLongTerm: true, costBasis: ['FIFO', 'AVERAGE'] };
  }
  return { shortLongTerm: false, costBasis: ['FIFO'] };
} 