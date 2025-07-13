import type { Trade as PrismaTrade, TaxLot as PrismaTaxLot } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface TaxCalculationResult {
  totalGains: number;
  totalLosses: number;
  netIncome: number;
  taxableIncome: number;
  taxOwed: number;
  carryForwardLosses: number;
  foreignIncome: number;
  feesPaid: number;
  taxLots: PrismaTaxLot[];
  yearBreakdown: {
    [key: string]: {
      gains: number;
      losses: number;
      netIncome: number;
      taxableIncome: number;
      taxOwed: number;
    };
  };
}

export interface TaxCalculationOptions {
  userId: number;
  taxYear: string;
  accountingMethod: 'FIFO' | 'LIFO';
  includeFees: boolean;
  includeForeignTax: boolean;
  offsetLosses: boolean;
  carryForward: boolean;
  previousYearLosses: number;
}

// Define types based on Prisma models
type Trade = PrismaTrade & {
  taxLots: PrismaTaxLot[];
};

type TaxLot = PrismaTaxLot & {
  trade: PrismaTrade | null;
};

export class NZTaxService {
  private readonly TAX_RATES: Record<string, number> = {
    '2024': 0.33, // Current NZ tax rate for highest bracket
    '2023': 0.33,
    '2022': 0.33
  };

  private readonly FOREIGN_INCOME_THRESHOLD = 50000; // NZD threshold for foreign income

  async calculateTax(options: TaxCalculationOptions): Promise<TaxCalculationResult> {
    const {
      userId,
      taxYear,
      accountingMethod,
      includeFees,
      includeForeignTax,
      offsetLosses,
      carryForward,
      previousYearLosses
    } = options;

    // Get all trades for the user
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        entryTime: {
          // Filter trades within the tax year
          gte: new Date(`${parseInt(taxYear) - 1}-04-01`),
          lt: new Date(`${taxYear}-04-01`)
        }
      },
      orderBy: {
        entryTime: 'asc'
      },
      include: {
        taxLots: true
      }
    });

    // Initialize result structure
    const result: TaxCalculationResult = {
      totalGains: 0,
      totalLosses: 0,
      netIncome: 0,
      taxableIncome: 0,
      taxOwed: 0,
      carryForwardLosses: 0,
      foreignIncome: 0,
      feesPaid: 0,
      taxLots: [],
      yearBreakdown: {
        [taxYear]: {
          gains: 0,
          losses: 0,
          netIncome: 0,
          taxableIncome: 0,
          taxOwed: 0
        }
      }
    };

    // Process trades based on accounting method
    const taxLots = await this.processTrades(trades, accountingMethod);

    // Calculate gains and losses
    for (const lot of taxLots) {
      const gain = Number(lot.proceeds || 0) - Number(lot.costBasis);
      
      // Add fees if included
      const fees = includeFees ? Number(lot.feesPaid) : 0;
      const foreignTax = includeForeignTax ? Number(lot.foreignTaxPaid) : 0;
      
      if (gain > 0) {
        result.totalGains += gain;
        result.yearBreakdown[taxYear].gains += gain;
      } else {
        result.totalLosses += Math.abs(gain);
        result.yearBreakdown[taxYear].losses += Math.abs(gain);
      }

      result.feesPaid += fees;
      result.foreignIncome += this.calculateForeignIncome(lot);
    }

    // Calculate net income
    result.netIncome = result.totalGains - result.totalLosses;
    result.yearBreakdown[taxYear].netIncome = result.netIncome;

    // Apply loss offset and carryforward
    if (offsetLosses) {
      const totalLosses = result.totalLosses + (carryForward ? previousYearLosses : 0);
      result.taxableIncome = Math.max(0, result.netIncome - totalLosses);
      result.carryForwardLosses = Math.max(0, totalLosses - result.netIncome);
    } else {
      result.taxableIncome = result.totalGains;
      result.carryForwardLosses = result.totalLosses;
    }

    result.yearBreakdown[taxYear].taxableIncome = result.taxableIncome;

    // Calculate tax owed
    const taxRate = this.TAX_RATES[taxYear] || this.TAX_RATES['2024'];
    result.taxOwed = result.taxableIncome * taxRate;
    result.yearBreakdown[taxYear].taxOwed = result.taxOwed;

    // Store tax lots
    result.taxLots = taxLots;

    return result;
  }

  private async processTrades(trades: Trade[], method: 'FIFO' | 'LIFO'): Promise<TaxLot[]> {
    const lots: TaxLot[] = [];
    const openLots = new Map<string, TaxLot[]>();

    for (const trade of trades) {
      if (trade.type === 'buy') {
        // Create new tax lot
        const lot = await prisma.taxLot.create({
          data: {
            userId: trade.userId,
            tradeId: trade.id,
            symbol: trade.symbol,
            assetType: 'crypto', // TODO: Determine based on symbol
            quantity: trade.amount,
            costBasis: trade.entryPrice,
            acquiredDate: trade.entryTime,
            status: 'open',
            taxYear: new Date().getFullYear().toString()
          }
        });

        // Add to open lots
        const symbolLots = openLots.get(trade.symbol) || [];
        symbolLots.push(lot);
        openLots.set(trade.symbol, symbolLots);
      } else if (trade.type === 'sell') {
        // Get lots for this symbol
        const symbolLots = openLots.get(trade.symbol) || [];
        if (method === 'LIFO') {
          symbolLots.reverse();
        }

        let remainingAmount = Number(trade.amount);
        const proceeds = Number(trade.exitPrice || 0) * Number(trade.amount);

        // Match against open lots
        for (const lot of symbolLots) {
          if (lot.status === 'closed' || Number(lot.quantity) <= 0) continue;

          const amountToSell = Math.min(remainingAmount, Number(lot.quantity));
          const portion = amountToSell / Number(lot.quantity);

          // Update realized lot
          const realizedLot = await prisma.taxLot.update({
            where: { id: lot.id },
            data: {
              quantity: { decrement: amountToSell },
              proceeds: { increment: proceeds * portion },
              disposedDate: trade.exitTime,
              status: Number(lot.quantity) - amountToSell <= 0 ? 'closed' : 'open'
            }
          });

          lots.push(realizedLot);

          remainingAmount -= amountToSell;
          if (remainingAmount <= 0) break;
        }
      }
    }

    return lots;
  }

  private calculateForeignIncome(lot: TaxLot): number {
    // Determine if this is foreign income based on symbol or exchange
    const isForeignAsset = this.isForeignAsset(lot.symbol);
    if (!isForeignAsset) return 0;

    const gain = Number(lot.proceeds || 0) - Number(lot.costBasis);
    return gain > 0 ? gain : 0;
  }

  private isForeignAsset(symbol: string): boolean {
    // Simple check - could be expanded based on exchange info
    return symbol.includes('.') || // International exchanges often use dots
           symbol.endsWith('USD') || // USD pairs
           /^[A-Z]{6}$/.test(symbol); // Forex pairs
  }
} 