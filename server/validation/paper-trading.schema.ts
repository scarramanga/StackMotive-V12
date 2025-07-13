import { z } from 'zod';

export const paperTradingAccountSchema = z.object({
  name: z.string().min(3, "Account name must be at least 3 characters"),
  initialBalance: z.number().min(0),
  currency: z.string().length(3, "Currency code must be 3 characters"),
  description: z.string().optional(),
  riskLimit: z.number().min(0).max(100).optional(),
  maxDrawdown: z.number().min(0).max(100).optional(),
  allowedSymbols: z.array(z.string()).optional(),
  allowedExchanges: z.array(z.string()).optional(),
  maxLeverage: z.number().min(1).optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active")
});

export type PaperTradingAccountInput = z.infer<typeof paperTradingAccountSchema>;

export const paperTradingAccountResponseSchema = paperTradingAccountSchema.extend({
  id: z.number(),
  userId: z.number(),
  currentBalance: z.number(),
  totalPnL: z.number(),
  totalTrades: z.number(),
  winRate: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastTraded: z.date().nullable()
});

export type PaperTradingAccountResponse = z.infer<typeof paperTradingAccountResponseSchema>; 