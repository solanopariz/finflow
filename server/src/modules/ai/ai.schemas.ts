import { z } from 'zod';
import { categoryTypeEnum } from '../../lib/enums.js';

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
