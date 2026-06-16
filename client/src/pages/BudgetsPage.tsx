import { useState } from 'react';
import { BudgetForm } from '../components/BudgetForm.tsx';
import { Modal } from '../components/Modal.tsx';
import { MonthSummaryCard } from '../components/MonthSummaryCard.tsx';
import { useCategories } from '../hooks/useCategories.ts';
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from '../hooks/useBudgets.ts';
import { ApiError, type Budget, type BudgetStatus } from '../lib/api.ts';
import { formatCurrency } from '../lib/format.ts';

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_STYLES: Record<BudgetStatus, { bar: string; badge: string; label: string }> = {
  ok: { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'No limite' },
  warning: { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Atenção' },
  exceeded: { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: 'Estourou' },
};

export function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data: budgets, isLoading, isError } = useBudgets(month);
  const { data: categories } = useCategories();

  const createMut = useCreateBudget();
  const updateMut = useUpdateBudget();
  const deleteMut = useDeleteBudget();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [formError, setFormError] = useState<string>();

  // No criar, só categorias de despesa ainda sem orçamento neste mês.
  const budgetedIds = new Set(budgets?.map((b) => b.categoryId));
  const availableCategories =
    categories?.filter((c) => c.type === 'EXPENSE' && !budgetedIds.has(c.id)) ?? [];

  function openCreate() {
    setEditing(null);
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(budget: Budget) {
    setEditing(budget);
    setFormError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(input: { categoryId: string; limitAmount: number }) {
    setFormError(undefined);
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, limitAmount: input.limitAmount });
      } else {
        await createMut.mutateAsync({ ...input, month });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao salvar orçamento');
    }
  }

  async function handleDelete(budget: Budget) {
    if (!confirm(`Excluir o orçamento de "${budget.category?.name}"?`)) return;
    await deleteMut.mutateAsync(budget.id);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Orçamentos</h1>
          <p className="mt-1 text-slate-600">Defina limites por categoria e acompanhe os gastos.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
          <button
            onClick={openCreate}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            + Novo orçamento
          </button>
        </div>
      </div>

      <MonthSummaryCard month={month} />

      {isLoading && <p className="text-slate-500">Carregando…</p>}
      {isError && <p className="text-red-600">Não foi possível carregar os orçamentos.</p>}
      {budgets && budgets.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Nenhum orçamento neste mês. Crie um para começar a acompanhar.
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <div className="space-y-3">
          {budgets.map((b) => {
            const style = STATUS_STYLES[b.status];
            return (
              <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: b.category?.color ?? '#94a3b8' }}
                    />
                    {b.category?.name ?? 'Categoria'}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
                      {style.label}
                    </span>
                  </span>
                  <span className="flex gap-3 text-sm">
                    <button onClick={() => openEdit(b)} className="text-sky-600 hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(b)} className="text-red-600 hover:underline">
                      Excluir
                    </button>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${style.bar}`}
                    style={{ width: `${Math.min(b.percent, 100)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-sm text-slate-600">
                  <span>
                    {formatCurrency(b.spent)} de {formatCurrency(b.limitAmount)} ({Math.round(b.percent)}%)
                  </span>
                  <span className={b.remaining < 0 ? 'text-red-600' : 'text-slate-500'}>
                    {b.remaining < 0
                      ? `${formatCurrency(Math.abs(b.remaining))} acima`
                      : `${formatCurrency(b.remaining)} restante`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar orçamento' : 'Novo orçamento'}
        onClose={() => setModalOpen(false)}
      >
        <BudgetForm
          initial={editing ?? undefined}
          categories={availableCategories}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          error={formError}
        />
      </Modal>
    </section>
  );
}
