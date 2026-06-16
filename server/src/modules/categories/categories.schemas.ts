import { z } from 'zod';
import { categoryTypeEnum } from '../../lib/enums.js';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve estar no formato hexadecimal #rrggbb');

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(40),
  type: categoryTypeEnum,
  color: hexColor.default('#38bdf8'),
  icon: z.string().trim().max(40).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
