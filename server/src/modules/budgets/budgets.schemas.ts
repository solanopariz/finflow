import { z } from 'zod';
import { MONTH_REGEX } from '../../lib/month.js';

const month = z.string().regex(MONTH_REGEX, 'Mês deve estar no formato YYYY-MM');

export const createBudgetSchema = z.object({
  categoryId: z.string().trim().min(1),
  month,
  limitAmount: z.number().positive('Limite deve ser maior que zero').max(99_999_999.99),
});

export const updateBudgetSchema = z.object({
  limitAmount: z.number().positive().max(99_999_999.99),
});

export const listBudgetsQuerySchema = z.object({
  month: month.optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
