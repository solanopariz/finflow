import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './error.middleware.js';
import { verifyAccessToken } from '../lib/tokens.js';

/**
 * Exige um access token válido no header `Authorization: Bearer <token>`.
 * Em sucesso, anexa `req.userId`; caso contrário, responde 401.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token de acesso ausente');
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    throw new HttpError(401, 'Token de acesso inválido ou expirado');
  }
}
