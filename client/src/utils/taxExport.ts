// Block 4: Tax CSV Export Logic
import type { TaxReportSummary } from '../types/tax';

export function exportTaxReportToCSV(report: TaxReportSummary): string {
  // Header
  const lines = [
    `Jurisdiction,${report.jurisdiction}`,
    `Cost Basis,${report.costBasis}`,
    `Year,${report.year}`,
    '',
    'Type,Date,Asset,Asset Class,Quantity,Proceeds,Cost Basis,Gain,Income Type,Notes,Source',
  ];
  for (const e of report.events) {
    lines.push([
      e.type,
      e.date,
      e.asset,
      e.assetClass,
      e.quantity,
      e.proceeds,
      e.costBasis,
      e.gain,
      e.incomeType || '',
      e.notes || '',
      e.source,
    ].join(','));
  }
  lines.push('');
  lines.push(`Capital Gains (Short),${report.capitalGains.shortTerm}`);
  lines.push(`Capital Gains (Long),${report.capitalGains.longTerm}`);
  lines.push(`Capital Gains (Total),${report.capitalGains.total}`);
  lines.push(`Income (Dividends),${report.income.dividends}`);
  lines.push(`Income (Interest),${report.income.interest}`);
  lines.push(`Income (Staking),${report.income.staking}`);
  lines.push(`Income (Total),${report.income.total}`);
  if (report.validationWarnings.length) {
    lines.push('');
    lines.push('Validation Warnings:');
    for (const w of report.validationWarnings) lines.push(w);
  }
  return lines.join('\n');
} 