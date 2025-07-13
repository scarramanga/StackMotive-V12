import { z } from 'zod';

export const strategySchema = z.object({
  name: z.string().min(3, "Strategy name must be at least 3 characters"),
  symbol: z.string().min(1, "Symbol is required"),
  exchange: z.string().min(1, "Exchange is required"),
  description: z.string().optional(),
  accountId: z.number().optional(),
  indicators: z.record(z.any()).default({}),
  entryConditions: z.record(z.any()).default({}),
  exitConditions: z.record(z.any()).default({}),
  riskPercentage: z.string().or(z.number()).transform(val => val.toString()).optional(),
  status: z.enum(["active", "inactive", "testing"]).default("inactive"),
  stopLoss: z.object({
    enabled: z.boolean(),
    percent: z.number(),
    trailing: z.boolean()
  }).optional(),
  takeProfit: z.object({
    enabled: z.boolean(),
    percent: z.number(),
    trailing: z.boolean()
  }).optional(),
  timeframes: z.array(z.string()).default(["1d"])
});

export type StrategyInput = z.infer<typeof strategySchema>;

export const strategyResponseSchema = strategySchema.extend({
  id: z.number(),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  performance: z.string().nullable(),
  winRate: z.string().nullable(),
  profitFactor: z.string().nullable()
});

export type StrategyResponse = z.infer<typeof strategyResponseSchema>; 