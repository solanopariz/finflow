import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(80),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
