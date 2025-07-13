import { prisma } from '../lib/prisma';
import { NZTaxService, TaxCalculationOptions, TaxCalculationResult } from './nz-tax-service';

export class TaxCalculationService {
  private readonly nzTaxService: NZTaxService;

  constructor() {
    this.nzTaxService = new NZTaxService();
  }

  async calculateTax(userId: number, options: Partial<TaxCalculationOptions> = {}): Promise<TaxCalculationResult> {
    // Get user's tax settings
    const taxSettings = await prisma.taxSettings.findUnique({
      where: { userId }
    });

    if (!taxSettings) {
      throw new Error('Tax settings not found for user');
    }

    // Merge user settings with provided options
    const calculationOptions: TaxCalculationOptions = {
      userId,
      taxYear: options.taxYear || new Date().getFullYear().toString(),
      accountingMethod: options.accountingMethod || taxSettings.accountingMethod || 'FIFO',
      includeFees: options.includeFees ?? taxSettings.includeFees ?? true,
      includeForeignTax: options.includeForeignTax ?? taxSettings.includeForeignTax ?? true,
      offsetLosses: options.offsetLosses ?? taxSettings.offsetLosses ?? true,
      carryForward: options.carryForward ?? taxSettings.carryForward ?? true,
      previousYearLosses: options.previousYearLosses || taxSettings.previousYearLosses || 0
    };

    // Get previous year's tax calculation for loss carryforward
    if (calculationOptions.carryForward && !options.previousYearLosses) {
      const previousYear = (parseInt(calculationOptions.taxYear) - 1).toString();
      const previousCalculation = await prisma.taxCalculation.findFirst({
        where: {
          userId,
          taxYear: previousYear
        },
        orderBy: {
          calculatedAt: 'desc'
        }
      });

      if (previousCalculation) {
        calculationOptions.previousYearLosses = previousCalculation.carryForwardLosses;
      }
    }

    // Calculate tax based on user's residency
    if (taxSettings.taxResidency === 'NZ') {
      const result = await this.nzTaxService.calculateTax(calculationOptions);

      // Store calculation result
      await this.storeTaxCalculation(userId, calculationOptions.taxYear, result);

      return result;
    }

    throw new Error('Unsupported tax residency');
  }

  private async storeTaxCalculation(
    userId: number,
    taxYear: string,
    result: TaxCalculationResult
  ): Promise<void> {
    await prisma.taxCalculation.create({
      data: {
        userId,
        taxYear,
        totalGains: result.totalGains,
        totalLosses: result.totalLosses,
        netIncome: result.netIncome,
        taxableIncome: result.taxableIncome,
        taxOwed: result.taxOwed,
        carryForwardLosses: result.carryForwardLosses,
        foreignIncome: result.foreignIncome,
        feesPaid: result.feesPaid,
        calculatedAt: new Date(),
        yearBreakdown: result.yearBreakdown
      }
    });
  }
} 