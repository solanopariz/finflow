import { PrismaClient } from '@prisma/client';

/**
 * Singleton do Prisma Client. Em desenvolvimento, o hot-reload do tsx pode
 * recriar módulos; reaproveitamos a instância global para não esgotar o pool
 * de conexões com o banco.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
