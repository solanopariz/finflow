import { z } from 'zod';
import { categoryTypeEnum } from '../../lib/enums.js';
import { MONTH_REGEX } from '../../lib/month.js';

export const categorizeItemSchema = z.object({
  description: z.string().trim().min(1).max(140),
  amount: z.number().positive(),
  type: categoryTypeEnum,
});

export const categorizeSchema = z.object({
  items: z.array(categorizeItemSchema).min(1).max(100),
});

export type CategorizeItem = z.infer<typeof categorizeItemSchema>;
export type CategorizeInput = z.infer<typeof categorizeSchema>;

export const summarySchema = z.object({
  month: z.string().regex(MONTH_REGEX, 'Mês deve estar no formato YYYY-MM'),
});

export type SummaryInput = z.infer<typeof summarySchema>;
