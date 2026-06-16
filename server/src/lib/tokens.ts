import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

/** Duração do refresh token em ms — usado para o `maxAge` do cookie. */
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  sub: string; // id do usuário
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
