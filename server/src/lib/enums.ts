import { z } from 'zod';

/** Espelha o enum `CategoryType` do Prisma; reutilizado por categorias e transações. */
export const categoryTypeEnum = z.enum(['INCOME', 'EXPENSE']);

export type CategoryType = z.infer<typeof categoryTypeEnum>;
