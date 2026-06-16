import { z } from 'zod';
import { categoryTypeEnum } from '../../lib/enums.js';

export const createTransactionSchema = z.object({
  type: categoryTypeEnum,
  amount: z
    .number({ invalid_type_error: 'Valor deve ser numérico' })
    .positive('Valor deve ser maior que zero')
    .max(99_999_999.99),
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(140),
  date: z.coerce.date({ invalid_type_error: 'Data inválida' }),
  categoryId: z.string().trim().min(1).nullish(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const listTransactionsQuerySchema = z
  .object({
    type: categoryTypeEnum.optional(),
    categoryId: z.string().trim().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '`from` deve ser anterior ou igual a `to`',
    path: ['from'],
  });

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
