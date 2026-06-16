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

export const transactionSourceEnum = z.enum(['MANUAL', 'IMPORT', 'AI']);

/** Item de importação em lote: igual ao create, com `source` opcional (padrão IMPORT). */
export const bulkTransactionItemSchema = createTransactionSchema.extend({
  source: transactionSourceEnum.optional(),
});

export const bulkCreateSchema = z.object({
  transactions: z.array(bulkTransactionItemSchema).min(1).max(200),
});

export type BulkTransactionItem = z.infer<typeof bulkTransactionItemSchema>;
export type BulkCreateInput = z.infer<typeof bulkCreateSchema>;

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
