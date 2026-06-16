import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard.ts';
import type { CategorySlice, DashboardSummary } from '../lib/api.ts';
import { formatCurrency, formatMonthLabel } from '../lib/format.ts';

const PERIODS = [
  { label: '3 meses', monthsAgo: 2 },
  { label: '6 meses', monthsAgo: 5 },
  { label: '12 meses', monthsAgo: 11 },
];

function startOfMonthIso(monthsAgo: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1)).toISOString();
}

export function DashboardPage() {
  const [monthsAgo, setMonthsAgo] = useState(5);
  const { data, isLoading, isError } = useDashboard(startOfMonthIso(monthsAgo));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-slate-600">Visão geral das suas finanças.</p>
        </div>
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.monthsAgo}
              onClick={() => setMonthsAgo(p.monthsAgo)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                monthsAgo === p.monthsAgo
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-slate-500">Carregando…</p>}
      {isError && <p className="text-red-600">Não foi possível carregar o dashboard.</p>}
      {data && <DashboardContent data={data} />}
    </section>
  );
}

function DashboardContent({ data }: { data: DashboardSummary }) {
  const hasData = data.totals.income > 0 || data.totals.expense > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-slate-600">Sem lançamentos no período.</p>
        <Link to="/transactions" className="mt-2 inline-block font-medium text-sky-600 hover:underline">
          Adicionar transações →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Receitas" value={data.totals.income} tone="income" />
        <StatCard label="Despesas" value={data.totals.expense} tone="expense" />
        <StatCard label="Saldo" value={data.totals.balance} tone="balance" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Receita × Despesa por mês">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickFormatter={formatMonthLabel} fontSize={12} />
                <YAxis fontSize={12} width={48} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(l: string) => formatMonthLabel(l)}
                />
                <Legend />
                <Bar dataKey="income" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Gastos por categoria">
          {data.byCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Nenhuma despesa no período.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.name}
                  >
                    {data.byCategory.map((slice) => (
                      <Cell key={slice.categoryId ?? 'none'} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card title="Top categorias de despesa">
        {data.topExpenseCategories.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma despesa no período.</p>
        ) : (
          <ul className="space-y-3">
            {data.topExpenseCategories.map((c) => (
              <TopCategoryRow key={c.categoryId ?? 'none'} slice={c} max={data.topExpenseCategories[0]!.total} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'income' | 'expense' | 'balance';
}) {
  const color =
    tone === 'income'
      ? 'text-emerald-600'
      : tone === 'expense'
        ? 'text-red-600'
        : value >= 0
          ? 'text-slate-900'
          : 'text-red-600';
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{formatCurrency(value)}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function TopCategoryRow({ slice, max }: { slice: CategorySlice; max: number }) {
  const pct = max > 0 ? (slice.total / max) * 100 : 0;
  return (
    <li>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-700">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
          {slice.name}
        </span>
        <span className="text-slate-600">{formatCurrency(slice.total)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: slice.color }} />
      </div>
    </li>
  );
}
