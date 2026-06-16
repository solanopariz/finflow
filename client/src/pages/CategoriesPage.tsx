import { useState } from 'react';
import { CategoryForm } from '../components/CategoryForm.tsx';
import { Modal } from '../components/Modal.tsx';
import { ApiError, type Category, type CategoryInput } from '../lib/api.ts';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/useCategories.ts';

export function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string>();

  function openCreate() {
    setEditing(null);
    setFormError(undefined);
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormError(undefined);
    setModalOpen(true);
  }

  async function handleSubmit(input: CategoryInput) {
    setFormError(undefined);
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, input });
      } else {
        await createMut.mutateAsync(input);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao salvar categoria');
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Excluir a categoria "${category.name}"?`)) return;
    await deleteMut.mutateAsync(category.id);
  }

  const incomes = categories?.filter((c) => c.type === 'INCOME') ?? [];
  const expenses = categories?.filter((c) => c.type === 'EXPENSE') ?? [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categorias</h1>
          <p className="mt-1 text-slate-600">Organize receitas e despesas por categoria.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          + Nova categoria
        </button>
      </div>

      {isLoading && <p className="text-slate-500">Carregando…</p>}
      {isError && <p className="text-red-600">Não foi possível carregar as categorias.</p>}

      {categories && (
        <div className="grid gap-6 sm:grid-cols-2">
          <CategoryColumn title="Receitas" items={incomes} onEdit={openEdit} onDelete={handleDelete} />
          <CategoryColumn title="Despesas" items={expenses} onEdit={openEdit} onDelete={handleDelete} />
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar categoria' : 'Nova categoria'}
        onClose={() => setModalOpen(false)}
      >
        <CategoryForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          error={formError}
        />
      </Modal>
    </section>
  );
}

function CategoryColumn({
  title,
  items,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Category[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma categoria ainda.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="font-medium text-slate-800">{c.name}</span>
              </span>
              <span className="flex gap-3 text-sm">
                <button onClick={() => onEdit(c)} className="text-sky-600 hover:underline">
                  Editar
                </button>
                <button onClick={() => onDelete(c)} className="text-red-600 hover:underline">
                  Excluir
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
