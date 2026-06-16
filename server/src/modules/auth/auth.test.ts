import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

// Store em memória compartilhado com o mock do Prisma (hoisted p/ o vi.mock).
const { store } = vi.hoisted(() => ({ store: { users: [] as StoredUser[] } }));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        return (
          store.users.find(
            (u) =>
              (where.email !== undefined && u.email === where.email) ||
              (where.id !== undefined && u.id === where.id),
          ) ?? null
        );
      },
      create: async ({ data }: { data: Omit<StoredUser, 'id' | 'createdAt'> }) => {
        const user: StoredUser = { id: `user_${store.users.length + 1}`, createdAt: new Date(), ...data };
        store.users.push(user);
        return user;
      },
    },
  },
}));

const { createApp } = await import('../../app.js');

const VALID = { name: 'Ana Dev', email: 'ana@finflow.dev', password: 'segredo123' };

beforeEach(() => {
  store.users = [];
});

describe('Auth', () => {
  it('registra um novo usuário, retorna access token e seta cookie de refresh', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/register').send(VALID);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.user.email).toBe('ana@finflow.dev');
    expect(res.body.user.passwordHash).toBeUndefined();

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    expect(cookies.some((c) => /HttpOnly/i.test(c))).toBe(true);
  });

  it('rejeita registro com e-mail duplicado (409)', async () => {
    const app = createApp();
    await request(app).post('/api/auth/register').send(VALID);
    const res = await request(app).post('/api/auth/register').send(VALID);

    expect(res.status).toBe(409);
  });

  it('rejeita registro com dados inválidos (400)', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'nao-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  it('faz login com credenciais corretas e nega com senha errada', async () => {
    const app = createApp();
    await request(app).post('/api/auth/register').send(VALID);

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: VALID.password });
    expect(ok.status).toBe(200);
    expect(ok.body.accessToken).toBeTypeOf('string');

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID.email, password: 'errada' });
    expect(bad.status).toBe(401);
  });

  it('protege /me: nega sem token e devolve o usuário com token válido', async () => {
    const app = createApp();
    const reg = await request(app).post('/api/auth/register').send(VALID);
    const token = reg.body.accessToken as string;

    const noToken = await request(app).get('/api/auth/me');
    expect(noToken.status).toBe(401);

    const withToken = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(withToken.status).toBe(200);
    expect(withToken.body.user.email).toBe(VALID.email);
  });

  it('emite novo access token via refresh usando o cookie', async () => {
    const agent = request.agent(createApp());
    await agent.post('/api/auth/register').send(VALID);

    const res = await agent.post('/api/auth/refresh').send();
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
  });

  it('refresh sem cookie retorna 401', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/refresh').send();
    expect(res.status).toBe(401);
  });
});
