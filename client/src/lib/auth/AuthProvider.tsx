import { useEffect, useState, type ReactNode } from 'react';
import {
  fetchMe,
  loginRequest,
  logoutRequest,
  refreshAccessToken,
  registerRequest,
  tokenStore,
  type User,
} from '../api.ts';
import { AuthContext, type AuthStatus } from './context.ts';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Ao montar, tenta restaurar a sessão a partir do cookie de refresh.
  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await refreshAccessToken();
      if (!active) return;
      if (!token) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const me = await fetchMe();
        if (!active) return;
        setUser(me.user);
        setStatus('authenticated');
      } catch {
        if (active) setStatus('unauthenticated');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const { user: loggedIn, accessToken } = await loginRequest({ email, password });
    tokenStore.set(accessToken);
    setUser(loggedIn);
    setStatus('authenticated');
  }

  async function register(name: string, email: string, password: string): Promise<void> {
    const { user: created, accessToken } = await registerRequest({ name, email, password });
    tokenStore.set(accessToken);
    setUser(created);
    setStatus('authenticated');
  }

  async function logout(): Promise<void> {
    await logoutRequest();
    tokenStore.set(null);
    setUser(null);
    setStatus('unauthenticated');
  }

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
