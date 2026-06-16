import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// Mock do Prisma para que o teste de saúde não dependa de um banco real.
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
  },
}));

const { createApp } = await import('../../app.js');

describe('GET /api/health', () => {
  it('retorna status ok e banco up', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('up');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('retorna 404 para rota desconhecida', async () => {
    const app = createApp();
    const res = await request(app).get('/api/nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
