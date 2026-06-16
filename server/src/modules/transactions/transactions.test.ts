import { Prisma } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { db } = vi.hoisted(() => ({
  db: {
    transaction: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../../lib/prisma.js', () => ({ prisma: db }));

const { createApp } = await import('../../app.js');
const { signAccessToken } = await import('../../lib/tokens.js');

const USER_ID = 'user_1';
const auth = `Bearer ${signAccessToken(USER_ID)}`;
const app = createApp();

function fakeTx(over: Record<string, unknown> = {}) {
  return {
    id: 't1',
    userId: USER_ID,
    type: 'EXPENSE',
    amount: new Prisma.Decimal(150.5),
    description: 'Mercado',
    date: new Date('2026-06-10'),
    source: 'MANUAL',
    categoryId: 'c1',
    category: { id: 'c1', name: 'Mercado', color: '#ef4444', icon: null },
    createdAt: new Date('2026-06-10'),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Transactions', () => {
  it('exige autenticação (401 sem token)', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('lista e serializa amount como número', async () => {
    db.transaction.findMany.mockResolvedValue([fakeTx()]);
    const res = await request(app).get('/api/transactions').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.transactions[0].amount).toBe(150.5);
    expect(typeof res.body.transactions[0].amount).toBe('number');
  });

  it('aplica filtros de tipo, categoria e período no where', async () => {
    db.transaction.findMany.mockResolvedValue([]);
    await request(app)
      .get('/api/transactions')
      .query({ type: 'EXPENSE', categoryId: 'c1', from: '2026-06-01', to: '2026-06-30' })
      .set('Authorization', auth);

    const arg = db.transaction.findMany.mock.calls[0]![0];
    expect(arg.where).toMatchObject({
      userId: USER_ID,
      type: 'EXPENSE',
      categoryId: 'c1',
    });
    expect(arg.where.date.gte).toBeInstanceOf(Date);
    expect(arg.where.date.lte).toBeInstanceOf(Date);
  });

  it('cria transação com categoria de tipo compatível (201)', async () => {
    db.category.findFirst.mockResolvedValue({ type: 'EXPENSE' });
    db.transaction.create.mockResolvedValue(fakeTx());
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', auth)
      .send({ type: 'EXPENSE', amount: 150.5, description: 'Mercado', date: '2026-06-10', categoryId: 'c1' });

    expect(res.status).toBe(201);
    expect(res.body.transaction.amount).toBe(150.5);
  });

  it('rejeita categoria de tipo divergente (400)', async () => {
    db.category.findFirst.mockResolvedValue({ type: 'INCOME' });
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', auth)
      .send({ type: 'EXPENSE', amount: 10, description: 'X', date: '2026-06-10', categoryId: 'c1' });

    expect(res.status).toBe(400);
    expect(db.transaction.create).not.toHaveBeenCalled();
  });

  it('valida corpo inválido (400)', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', auth)
      .send({ type: 'EXPENSE', amount: -5, description: '', date: 'xx' });
    expect(res.status).toBe(400);
  });

  it('retorna 404 ao excluir transação de outro usuário', async () => {
    db.transaction.findFirst.mockResolvedValue(null);
    const res = await request(app).delete('/api/transactions/t999').set('Authorization', auth);
    expect(res.status).toBe(404);
    expect(db.transaction.delete).not.toHaveBeenCalled();
  });
});
