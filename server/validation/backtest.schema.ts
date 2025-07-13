import { z } from 'zod';

export const backtestSessionSchema = z.object({
  strategyId: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  initialCapital: z.number().min(0),
  symbol: z.string().min(1),
  exchange: z.string().min(1),
  timeframe: z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]),
  includeFees: z.boolean().default(true),
  feeRate: z.number().min(0).max(100).default(0.1),
  slippage: z.number().min(0).max(100).default(0.1)
});

export type BacktestSessionInput = z.infer<typeof backtestSessionSchema>;

export const backtestSessionResponseSchema = backtestSessionSchema.extend({
  id: z.number(),
  userId: z.number(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  results: z.object({
    totalTrades: z.number(),
    winningTrades: z.number(),
    losingTrades: z.number(),
    winRate: z.number(),
    profitFactor: z.number(),
    netProfit: z.number(),
    maxDrawdown: z.number(),
    sharpeRatio: z.number(),
    trades: z.array(z.object({
      timestamp: z.date(),
      type: z.enum(["BUY", "SELL"]),
      price: z.number(),
      amount: z.number(),
      profitLoss: z.number()
    }))
  }).nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
  completedAt: z.date().nullable()
});

export type BacktestSessionResponse = z.infer<typeof backtestSessionResponseSchema>; 