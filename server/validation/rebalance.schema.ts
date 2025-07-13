import { z } from 'zod';

export const rebalanceRecommendationSchema = z.object({
  portfolioId: z.number(),
  targetAllocation: z.record(z.string(), z.number()),
  currentAllocation: z.record(z.string(), z.number()),
  deviationThreshold: z.number().min(0).max(100).default(5),
  rebalanceType: z.enum(["FULL", "THRESHOLD", "TAX_EFFICIENT"]),
  includeTaxImpact: z.boolean().default(true),
  maxTrades: z.number().min(1).optional(),
  minTradeSize: z.number().min(0).optional(),
  excludedAssets: z.array(z.string()).optional()
});

export type RebalanceRecommendationInput = z.infer<typeof rebalanceRecommendationSchema>;

export const rebalanceRecommendationResponseSchema = rebalanceRecommendationSchema.extend({
  id: z.number(),
  userId: z.number(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  recommendations: z.array(z.object({
    symbol: z.string(),
    action: z.enum(["BUY", "SELL", "HOLD"]),
    amount: z.number(),
    currentWeight: z.number(),
    targetWeight: z.number(),
    estimatedValue: z.number(),
    taxImpact: z.number().nullable(),
    priority: z.number()
  })).nullable(),
  totalValue: z.number(),
  estimatedTaxImpact: z.number().nullable(),
  estimatedTurnover: z.number(),
  createdAt: z.date(),
  completedAt: z.date().nullable(),
  error: z.string().nullable()
});

export type RebalanceRecommendationResponse = z.infer<typeof rebalanceRecommendationResponseSchema>; 