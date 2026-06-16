import { z } from 'zod';

export const dashboardQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '`from` deve ser anterior ou igual a `to`',
    path: ['from'],
  });

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
