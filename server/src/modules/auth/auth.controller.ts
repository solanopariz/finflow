import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { HttpError } from '../../middlewares/error.middleware.js';
import { REFRESH_TTL_MS } from '../../lib/tokens.js';
import { getMe, login, refresh, register } from './auth.service.js';

const REFRESH_COOKIE = 'refreshToken';

const isProd = env.NODE_ENV === 'production';

/**
 * Opções do cookie do refresh token. `path` restrito às rotas de auth para que
 * o cookie só viaje quando necessário. Em produção o front e o back ficam em
 * domínios diferentes, então o cookie precisa de `SameSite=None` + `Secure`
 * (HTTPS) para ser enviado em requisições cross-site; em dev, `Lax` basta.
 */
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  path: '/api/auth',
  maxAge: REFRESH_TTL_MS,
};

export async function registerController(req: Request, res: Response): Promise<void> {
  const { user, accessToken, refreshToken } = await register(req.body);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  res.status(201).json({ user, accessToken });
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const { user, accessToken, refreshToken } = await login(req.body);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  res.status(200).json({ user, accessToken });
}

export async function refreshController(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  const { accessToken } = await refresh(token);
  res.status(200).json({ accessToken });
}

export async function logoutController(_req: Request, res: Response): Promise<void> {
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: undefined });
  res.status(204).end();
}

export async function meController(req: Request, res: Response): Promise<void> {
  if (!req.userId) {
    throw new HttpError(401, 'Não autenticado');
  }
  const user = await getMe(req.userId);
  res.status(200).json({ user });
}
