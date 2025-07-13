import { z } from 'zod';

// Trade filters schema
export const tradeFiltersSchema = z.object({
  strategyId: z.number().optional(),
  symbol: z.string().optional(),
  type: z.enum(["BUY", "SELL"]).optional(),
  status: z.enum(["open", "closed", "canceled"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  exchange: z.string().optional(),
  isAutomated: z.boolean().optional()
});

export type TradeFilters = z.infer<typeof tradeFiltersSchema>;

export const tradeSchema = z.object({
  strategyId: z.number().optional(),
  symbol: z.string().min(1, "Symbol is required"),
  type: z.enum(["BUY", "SELL"]),
  amount: z.string().or(z.number()).transform(val => val.toString()),
  entryPrice: z.string().or(z.number()).transform(val => val.toString()),
  exchange: z.string().min(1, "Exchange is required"),
  status: z.enum(["open", "closed", "canceled"]).default("open"),
  isAutomated: z.boolean().default(false)
});

export type TradeInput = z.infer<typeof tradeSchema>;

export const tradeResponseSchema = tradeSchema.extend({
  id: z.number(),
  userId: z.number(),
  exitPrice: z.string().nullable(),
  profitLoss: z.string().nullable(),
  profitLossPercentage: z.string().nullable(),
  entryTime: z.date(),
  exitTime: z.date().nullable(),
  taxImpact: z.string().nullable()
});

export type TradeResponse = z.infer<typeof tradeResponseSchema>; 