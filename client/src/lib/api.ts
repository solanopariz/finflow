const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/** Access token em memória (nunca em localStorage — mitiga XSS). */
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function doFetch(path: string, init: RequestInit, auth: boolean): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
}

/**
 * Troca o cookie de refresh por um novo access token. Não passa pelo retry nem
 * envia Authorization, evitando loop. Atualiza o token em memória em sucesso.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const res = await doFetch('/api/auth/refresh', { method: 'POST' }, false);
  if (!res.ok) {
    accessToken = null;
    return null;
  }
  const data = (await res.json()) as { accessToken: string };
  accessToken = data.accessToken;
  return accessToken;
}

interface ApiOptions {
  /** Anexa o access token e tenta refresh em 401 (padrão: true). */
  auth?: boolean;
}

/**
 * Wrapper de fetch da API: prefixa a base URL, envia cookies, anexa o access
 * token e, em 401, tenta um refresh transparente uma vez antes de repetir.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiOptions = {},
): Promise<T> {
  const auth = options.auth ?? true;
  let res = await doFetch(path, init, auth);

  if (res.status === 401 && auth) {
    const renewed = await refreshAccessToken();
    if (renewed) {
      res = await doFetch(path, init, true);
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? `Erro ${res.status} ao chamar ${path}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Tipos e endpoints de domínio
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  database: 'up' | 'down';
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/health', {}, { auth: false });
}

export function registerRequest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: false },
  );
}

export function loginRequest(input: { email: string; password: string }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify(input) },
    { auth: false },
  );
}

export function logoutRequest(): Promise<void> {
  return apiFetch<void>('/api/auth/logout', { method: 'POST' }, { auth: false });
}

export function fetchMe(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/api/auth/me');
}
