import { Outlet } from 'react-router-dom';

/**
 * Shell da aplicação: cabeçalho + área de conteúdo (`<Outlet />`).
 * O layout completo (sidebar, navegação) chega nos próximos marcos.
 */
export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-4">
          <span className="text-xl font-bold text-sky-600">FinFlow</span>
          <span className="text-xl">💸</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
