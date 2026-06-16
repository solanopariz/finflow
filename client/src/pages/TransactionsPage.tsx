import { useState } from 'react';
import { Modal } from '../components/Modal.tsx';
import { TransactionForm } from '../components/TransactionForm.tsx';
import { useCategories } from '../hooks/useCategories.ts';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from '../hooks/useTransactions.ts';
import {
  ApiError,
  type CategoryType,
  type Transaction,
  type TransactionFilters,
  type TransactionInput,
} from '../lib/api.ts';
import { formatCurrency, formatDate } from '../lib/format.ts';

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const { data: transactions, isLoading, isError } = useTransactions(filters);
  const { data: categories } = useCategories();

  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction();
  const deleteMut = useDeleteTransaction();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [formError, setFormError] = useState<string>();

  function patchFilter(patch: Partial<TransactionFilters>) {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      for (const k of Object.keys(next) as (keyof TransactionFilters)[]) {
        if (!next[k]) delete next[k];
      }
      return next;
    });
  }

  function openCreate() {
    setEditing(null);
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setFormError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(input: TransactionInput) {
    setFormError(undefined);
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
      } else {
        await createMut.mutateAsync(input);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao salvar transação');
    }
  }

  async function handleDelete(tx: Transaction) {
    if (!confirm('Excluir esta transação?')) return;
    await deleteMut.mutateAsync(tx.id);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transações</h1>
          <p className="mt-1 text-slate-600">Receitas e despesas registradas.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          + Nova transação
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <FilterSelect
          label="Tipo"
          value={filters.type ?? ''}
          onChange={(v) => patchFilter({ type: (v || undefined) as CategoryType | undefined })}
        >
          <option value="">Todos</option>
          <option value="EXPENSE">Despesas</option>
          <option value="INCOME">Receitas</option>
        </FilterSelect>

        <FilterSelect
          label="Categoria"
          value={filters.categoryId ?? ''}
          onChange={(v) => patchFilter({ categoryId: v || undefined })}
        >
          <option value="">Todas</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </FilterSelect>

        <FilterDate label="De" value={filters.from ?? ''} onChange={(v) => patchFilter({ from: v })} />
        <FilterDate label="Até" value={filters.to ?? ''} onChange={(v) => patchFilter({ to: v })} />

        {Object.keys(filters).length > 0 && (
          <button
            onClick={() => setFilters({})}
            className="ml-auto text-sm text-sky-600 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {isLoading && <p className="p-6 text-slate-500">Carregando…</p>}
        {isError && <p className="p-6 text-red-600">Não foi possível carregar as transações.</p>}
        {transactions && transactions.length === 0 && (
          <p className="p-6 text-slate-400">Nenhuma transação encontrada.</p>
        )}
        {transactions && transactions.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-slate-600">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{tx.description}</td>
                  <td className="px-4 py-3">
                    {tx.category ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: tx.category.color }}
                        />
                        {tx.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex justify-end gap-3">
                      <button onClick={() => openEdit(tx)} className="text-sky-600 hover:underline">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(tx)}
                        className="text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar transação' : 'Nova transação'}
        onClose={() => setModalOpen(false)}
      >
        <TransactionForm
          initial={editing ?? undefined}
          categories={categories ?? []}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          error={formError}
        />
      </Modal>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
      >
        {children}
      </select>
    </label>
  );
}

function FilterDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
      />
    </label>
  );
}
