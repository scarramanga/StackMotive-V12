import { z } from 'zod';

export const taxSettingsSchema = z.object({
  country: z.string().min(2, "Country code must be at least 2 characters"),
  taxYear: z.number().min(2000).max(2100),
  accountingMethod: z.enum(["FIFO", "LIFO", "HIFO", "ACB"]),
  includeFees: z.boolean().default(true),
  includeForeignIncome: z.boolean().default(true),
  capitalGainsRate: z.number().min(0).max(100).optional(),
  carryForwardLosses: z.boolean().default(true),
  maxLossCarryForward: z.number().min(0).optional(),
  reportingCurrency: z.string().min(3, "Currency code must be 3 characters").max(3),
  exchangeRateSource: z.enum(["DAILY_CLOSE", "TRANSACTION_TIME", "PERIOD_AVERAGE"]).default("DAILY_CLOSE"),
  customExchangeRates: z.record(z.string(), z.number()).optional()
});

export type TaxSettingsInput = z.infer<typeof taxSettingsSchema>;

export const taxSettingsResponseSchema = taxSettingsSchema.extend({
  id: z.number(),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastCalculated: z.date().nullable()
});

export type TaxSettingsResponse = z.infer<typeof taxSettingsResponseSchema>; 