import { Prisma } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { db } = vi.hoisted(() => ({
  db: { transaction: { findMany: vi.fn() } },
}));

vi.mock('../../lib/prisma.js', () => ({ prisma: db }));

const { createApp } = await import('../../app.js');
const { signAccessToken } = await import('../../lib/tokens.js');

const auth = `Bearer ${signAccessToken('user_1')}`;
const app = createApp();

function tx(over: Record<string, unknown>) {
  return {
    id: Math.random().toString(36).slice(2),
    userId: 'user_1',
    type: 'EXPENSE',
    amount: new Prisma.Decimal(0),
    description: 'x',
    date: new Date('2026-06-10T00:00:00.000Z'),
    source: 'MANUAL',
    categoryId: null,
    category: null,
    createdAt: new Date(),
    ...over,
  };
}

beforeEach(() => vi.clearAllMocks());

describe('Dashboard summary', () => {
  it('exige autenticação (401 sem token)', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });

  it('calcula totais, saldo, por categoria e top despesas', async () => {
    db.transaction.findMany.mockResolvedValue([
      tx({
        type: 'INCOME',
        amount: new Prisma.Decimal(5000),
        date: new Date('2026-06-05T00:00:00.000Z'),
      }),
      tx({
        type: 'EXPENSE',
        amount: new Prisma.Decimal(150.5),
        categoryId: 'c1',
        category: { id: 'c1', name: 'Mercado', color: '#ef4444', icon: null },
      }),
      tx({
        type: 'EXPENSE',
        amount: new Prisma.Decimal(49.5),
        categoryId: 'c1',
        category: { id: 'c1', name: 'Mercado', color: '#ef4444', icon: null },
      }),
      tx({ type: 'EXPENSE', amount: new Prisma.Decimal(80), categoryId: null, category: null }),
    ]);

    const res = await request(app)
      .get('/api/dashboard/summary')
      .query({ from: '2026-06-01', to: '2026-06-30' })
      .set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({ income: 5000, expense: 280, balance: 4720 });

    // Maior despesa primeiro: Mercado (200) antes de Sem categoria (80).
    expect(res.body.byCategory[0]).toMatchObject({ name: 'Mercado', total: 200 });
    expect(res.body.byCategory[1]).toMatchObject({ categoryId: null, name: 'Sem categoria', total: 80 });
    expect(res.body.topExpenseCategories).toHaveLength(2);
  });

  it('preenche meses sem lançamentos com zero na série mensal', async () => {
    db.transaction.findMany.mockResolvedValue([
      tx({
        type: 'EXPENSE',
        amount: new Prisma.Decimal(100),
        date: new Date('2026-06-15T00:00:00.000Z'),
      }),
    ]);

    const res = await request(app)
      .get('/api/dashboard/summary')
      .query({ from: '2026-04-01', to: '2026-06-30' })
      .set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.monthly).toEqual([
      { month: '2026-04', income: 0, expense: 0 },
      { month: '2026-05', income: 0, expense: 0 },
      { month: '2026-06', income: 0, expense: 100 },
    ]);
  });
});
