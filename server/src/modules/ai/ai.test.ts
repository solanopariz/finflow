import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { aiMock, db, create } = vi.hoisted(() => {
  const create = vi.fn();
  return {
    create,
    aiMock: {
      isAiConfigured: vi.fn(() => true),
      getAnthropic: vi.fn(() => ({ messages: { create } })),
      CATEGORIZER_MODEL: 'claude-haiku-4-5',
      SUMMARY_MODEL: 'claude-sonnet-4-6',
    },
    db: {
      category: { findMany: vi.fn() },
      transaction: { findMany: vi.fn(), aggregate: vi.fn() },
      budget: { findMany: vi.fn() },
    },
  };
});

vi.mock('../../lib/anthropic.js', () => aiMock);
vi.mock('../../lib/prisma.js', () => ({ prisma: db }));

const { createApp } = await import('../../app.js');
const { signAccessToken } = await import('../../lib/tokens.js');

const auth = `Bearer ${signAccessToken('user_1')}`;
const app = createApp();

function toolResponse(assignments: unknown) {
  return { content: [{ type: 'tool_use', name: 'assign_categories', input: { assignments } }] };
}

beforeEach(() => {
  vi.clearAllMocks();
  aiMock.isAiConfigured.mockReturnValue(true);
});

describe('AI categorize', () => {
  it('GET /status reflete se a IA está configurada', async () => {
    aiMock.isAiConfigured.mockReturnValue(false);
    const res = await request(app).get('/api/ai/status').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
  });

  it('retorna 503 quando a IA não está configurada', async () => {
    aiMock.isAiConfigured.mockReturnValue(false);
    const res = await request(app)
      .post('/api/ai/categorize')
      .set('Authorization', auth)
      .send({ items: [{ description: 'X', amount: 10, type: 'EXPENSE' }] });
    expect(res.status).toBe(503);
  });

  it('mapeia sugestões e descarta categoria de tipo divergente', async () => {
    db.category.findMany.mockResolvedValue([
      { id: 'c1', name: 'Mercado', type: 'EXPENSE' },
      { id: 'c2', name: 'Salário', type: 'INCOME' },
    ]);
    create.mockResolvedValue(
      toolResponse([
        { index: 0, categoryId: 'c1', confidence: 0.9 },
        { index: 1, categoryId: 'c1', confidence: 0.5 }, // c1 é EXPENSE, item 1 é INCOME → inválido
      ]),
    );

    const res = await request(app)
      .post('/api/ai/categorize')
      .set('Authorization', auth)
      .send({
        items: [
          { description: 'Compras', amount: 100, type: 'EXPENSE' },
          { description: 'Salário', amount: 5000, type: 'INCOME' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.results[0]).toMatchObject({ categoryId: 'c1', categoryName: 'Mercado' });
    expect(res.body.results[1]).toMatchObject({ categoryId: null, categoryName: null });
  });

  it('valida o corpo (400 sem itens)', async () => {
    const res = await request(app)
      .post('/api/ai/categorize')
      .set('Authorization', auth)
      .send({ items: [] });
    expect(res.status).toBe(400);
  });
});

describe('AI summary', () => {
  it('retorna 503 quando a IA não está configurada', async () => {
    aiMock.isAiConfigured.mockReturnValue(false);
    const res = await request(app)
      .post('/api/ai/summary')
      .set('Authorization', auth)
      .send({ month: '2026-06' });
    expect(res.status).toBe(503);
  });

  it('gera o resumo do mês a partir dos dados agregados', async () => {
    db.transaction.findMany.mockResolvedValue([
      { type: 'INCOME', amount: { toNumber: () => 5000 }, category: null },
      {
        type: 'EXPENSE',
        amount: { toNumber: () => 200 },
        category: { name: 'Mercado' },
      },
    ]);
    db.budget.findMany.mockResolvedValue([]);
    db.transaction.aggregate.mockResolvedValue({ _sum: { amount: { toNumber: () => 100 } } });
    create.mockResolvedValue({ content: [{ type: 'text', text: 'Seu mês foi positivo.' }] });

    const res = await request(app)
      .post('/api/ai/summary')
      .set('Authorization', auth)
      .send({ month: '2026-06' });

    expect(res.status).toBe(200);
    expect(res.body.month).toBe('2026-06');
    expect(res.body.summary).toBe('Seu mês foi positivo.');
  });
});
