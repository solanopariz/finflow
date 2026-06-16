import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './lib/auth/context.ts';

/**
 * Shell da aplicação autenticada: cabeçalho com usuário/logout + `<Outlet />`.
 * O layout completo (sidebar, navegação) chega nos próximos marcos.
 */
export function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-sky-600">FinFlow</span>
            <span className="text-xl">💸</span>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="text-sm text-slate-600">Olá, {user.name}</span>}
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
