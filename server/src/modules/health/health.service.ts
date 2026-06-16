import { prisma } from '../../lib/prisma.js';

export interface HealthStatus {
  status: 'ok';
  uptime: number;
  timestamp: string;
  database: 'up' | 'down';
}

/**
 * Verifica a saúde da aplicação, incluindo conectividade com o banco.
 * O `SELECT 1` confirma que a conexão Prisma/MySQL está ativa.
 */
export async function getHealth(): Promise<HealthStatus> {
  let database: HealthStatus['database'] = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'up';
  } catch {
    database = 'down';
  }

  return {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database,
  };
}
