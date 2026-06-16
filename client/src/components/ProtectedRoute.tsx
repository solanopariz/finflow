import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth/context.ts';

/**
 * Libera as rotas filhas apenas para usuários autenticados. Enquanto a sessão
 * é restaurada (refresh no boot), mostra um placeholder; sem sessão, redireciona.
 */
export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Carregando…</div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
