import 'dotenv/config';
import { z } from 'zod';

/**
 * Validação das variáveis de ambiente. Falha cedo (no boot) se algo estiver
 * faltando ou inválido, em vez de quebrar em runtime mais adiante.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_ACCESS_SECRET: z.string().min(1).default('dev-access-secret'),
  JWT_REFRESH_SECRET: z.string().min(1).default('dev-refresh-secret'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`❌ Variáveis de ambiente inválidas:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;
