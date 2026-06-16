import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middlewares/error.middleware.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/tokens.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

const SALT_ROUNDS = 10;

/** Usuário sem o hash da senha — formato seguro para devolver ao cliente. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): PublicUser {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, 'Já existe uma conta com este e-mail');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  return buildAuthResult(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new HttpError(401, 'E-mail ou senha inválidos');
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'E-mail ou senha inválidos');
  }

  return buildAuthResult(user);
}

/** Gera um novo access token a partir de um refresh token válido. */
export async function refresh(refreshToken: string | undefined): Promise<{ accessToken: string }> {
  if (!refreshToken) {
    throw new HttpError(401, 'Refresh token ausente');
  }

  let userId: string;
  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    throw new HttpError(401, 'Refresh token inválido ou expirado');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(401, 'Usuário não encontrado');
  }

  return { accessToken: signAccessToken(user.id) };
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'Usuário não encontrado');
  }
  return toPublicUser(user);
}

function buildAuthResult(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): AuthResult {
  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  };
}
