const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/**
 * Wrapper fino sobre `fetch` para a API do FinFlow. Prefixa a base URL, envia
 * cookies (refresh token) e lança erro em respostas não-2xx.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Erro ${res.status} ao chamar ${path}`);
  }

  return res.json() as Promise<T>;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  database: 'up' | 'down';
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/health');
}
