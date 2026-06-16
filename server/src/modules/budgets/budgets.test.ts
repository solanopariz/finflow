import { Prisma } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { db } = vi.hoisted(() => ({
  db: {
    budget: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    category: { findFirst: vi.fn() },
    transaction: { findMany: vi.fn(), aggregate: vi.fn() },
  },
}));

vi.mock('../../lib/prisma.js', () => ({ prisma: db }));

const { createApp } = await import('../../app.js');
const { signAccessToken } = await import('../../lib/tokens.js');

const auth = `Bearer ${signAccessToken('user_1')}`;
const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
  db.transaction.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(0) } });
});

describe('Budgets', () => {
  it('exige autenticação (401 sem token)', async () => {
    const res = await request(app).get('/api/budgets');
    expect(res.status).toBe(401);
  });

  it('lista orçamentos com gasto, percentual e status', async () => {
    db.budget.findMany.mockResolvedValue([
      {
        id: 'b1',
        categoryId: 'c1',
        month: '2026-06',
        limitAmount: new Prisma.Decimal(100),
        category: { id: 'c1', name: 'Mercado', color: '#ef4444' },
      },
    ]);
    db.transaction.findMany.mockResolvedValue([
      { categoryId: 'c1', amount: new Prisma.Decimal(120) },
    ]);

    const res = await request(app)
      .get('/api/budgets')
      .query({ month: '2026-06' })
      .set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.budgets[0]).toMatchObject({
      spent: 120,
      limitAmount: 100,
      percent: 120,
      status: 'exceeded',
      remaining: -20,
    });
  });

  it('cria orçamento para categoria de despesa (201)', async () => {
    db.category.findFirst.mockResolvedValue({ type: 'EXPENSE' });
    db.budget.create.mockResolvedValue({
      id: 'b1',
      categoryId: 'c1',
      month: '2026-06',
      limitAmount: new Prisma.Decimal(500),
      category: { id: 'c1', name: 'Mercado', color: '#ef4444' },
    });

    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', auth)
      .send({ categoryId: 'c1', month: '2026-06', limitAmount: 500 });

    expect(res.status).toBe(201);
    expect(res.body.budget.limitAmount).toBe(500);
    expect(res.body.budget.status).toBe('ok');
  });

  it('rejeita orçamento para categoria de receita (400)', async () => {
    db.category.findFirst.mockResolvedValue({ type: 'INCOME' });
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', auth)
      .send({ categoryId: 'c1', month: '2026-06', limitAmount: 500 });
    expect(res.status).toBe(400);
    expect(db.budget.create).not.toHaveBeenCalled();
  });

  it('converte orçamento duplicado em 409', async () => {
    db.category.findFirst.mockResolvedValue({ type: 'EXPENSE' });
    db.budget.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', auth)
      .send({ categoryId: 'c1', month: '2026-06', limitAmount: 500 });
    expect(res.status).toBe(409);
  });

  it('valida mês inválido (400)', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', auth)
      .send({ categoryId: 'c1', month: '2026/06', limitAmount: 500 });
    expect(res.status).toBe(400);
  });

  it('retorna 404 ao excluir orçamento de outro usuário', async () => {
    db.budget.findFirst.mockResolvedValue(null);
    const res = await request(app).delete('/api/budgets/b999').set('Authorization', auth);
    expect(res.status).toBe(404);
    expect(db.budget.delete).not.toHaveBeenCalled();
  });
});
