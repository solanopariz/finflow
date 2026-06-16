import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './lib/auth/context.ts';

const navItems = [
  { to: '/', label: 'Início', end: true },
  { to: '/transactions', label: 'Transações', end: false },
  { to: '/categories', label: 'Categorias', end: false },
  { to: '/budgets', label: 'Orçamentos', end: false },
  { to: '/import', label: 'Importar', end: false },
];

/**
 * Shell da aplicação autenticada: cabeçalho com navegação, usuário/logout e
 * `<Outlet />` para a rota ativa.
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
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-sky-600">FinFlow</span>
              <span className="text-xl">💸</span>
            </div>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
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
