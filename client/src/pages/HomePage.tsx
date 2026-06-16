import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getHealth } from '../lib/api.ts';

/**
 * Tela inicial do M0: confirma visualmente que o frontend conversa com a API.
 * Será substituída pelo dashboard nos próximos marcos.
 */
export function HomePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bem-vindo ao FinFlow</h1>
        <p className="mt-1 text-slate-600">
          Gestor de finanças pessoais com IA. Fundação (M0) no ar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/transactions"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow"
        >
          <h2 className="font-semibold text-slate-800">Transações →</h2>
          <p className="mt-1 text-sm text-slate-500">Registre receitas e despesas e filtre por período.</p>
        </Link>
        <Link
          to="/categories"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow"
        >
          <h2 className="font-semibold text-slate-800">Categorias →</h2>
          <p className="mt-1 text-sm text-slate-500">Organize seus lançamentos por categoria.</p>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Status da API</h2>
        {isLoading && <p className="mt-2 text-slate-600">Verificando conexão…</p>}
        {isError && (
          <p className="mt-2 text-red-600">
            API indisponível: {error instanceof Error ? error.message : 'erro desconhecido'}
          </p>
        )}
        {data && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge ok={data.status === 'ok'}>API: {data.status}</Badge>
            <Badge ok={data.database === 'up'}>Banco: {data.database}</Badge>
            <span className="text-sm text-slate-400">uptime {Math.round(data.uptime)}s</span>
          </div>
        )}
      </div>
    </section>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {children}
    </span>
  );
}
