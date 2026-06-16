import { Prisma } from '@prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { db } = vi.hoisted(() => ({
  db: {
    category: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Categories', () => {
  it('exige autenticação (401 sem token)', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('lista categorias do usuário', async () => {
    db.category.findMany.mockResolvedValue([
      { id: 'c1', userId: USER_ID, name: 'Salário', type: 'INCOME', color: '#22c55e', icon: null },
    ]);
    const res = await request(app).get('/api/categories').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
    expect(db.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } }),
    );
  });

  it('cria categoria (201)', async () => {
    db.category.create.mockResolvedValue({
      id: 'c2',
      userId: USER_ID,
      name: 'Mercado',
      type: 'EXPENSE',
      color: '#ef4444',
      icon: null,
    });
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', auth)
      .send({ name: 'Mercado', type: 'EXPENSE', color: '#ef4444' });

    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe('Mercado');
    expect(db.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: USER_ID }) }),
    );
  });

  it('rejeita dados inválidos (400)', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', auth)
      .send({ name: '', type: 'OUTRO' });
    expect(res.status).toBe(400);
  });

  it('converte violação de unicidade em 409', async () => {
    db.category.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6' }),
    );
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', auth)
      .send({ name: 'Mercado', type: 'EXPENSE' });
    expect(res.status).toBe(409);
  });

  it('retorna 404 ao atualizar categoria de outro usuário', async () => {
    db.category.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/categories/c999')
      .set('Authorization', auth)
      .send({ name: 'Novo' });
    expect(res.status).toBe(404);
    expect(db.category.update).not.toHaveBeenCalled();
  });

  it('exclui categoria própria (204)', async () => {
    db.category.findFirst.mockResolvedValue({ id: 'c1' });
    db.category.delete.mockResolvedValue({ id: 'c1' });
    const res = await request(app).delete('/api/categories/c1').set('Authorization', auth);
    expect(res.status).toBe(204);
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
