import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Budget, Category } from '../lib/api.ts';
import { FormField } from './FormField.tsx';

const schema = z.object({
  categoryId: z.string().min(1, 'Escolha uma categoria'),
  limitAmount: z.coerce.number().positive('Limite deve ser maior que zero'),
});

type Values = z.infer<typeof schema>;

interface BudgetFormProps {
  /** Em edição, a categoria é fixa e só o limite muda. */
  initial?: Budget;
  /** Categorias de despesa disponíveis (já sem as que têm orçamento no mês). */
  categories: Category[];
  onSubmit: (input: { categoryId: string; limitAmount: number }) => Promise<unknown>;
  onCancel: () => void;
  error?: string;
}

export function BudgetForm({ initial, categories, onSubmit, onCancel, error }: BudgetFormProps) {
  const isEdit = Boolean(initial);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: initial?.categoryId ?? '',
      limitAmount: initial?.limitAmount ?? undefined,
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v))} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="b-category" className="block text-sm font-medium text-slate-700">
          Categoria de despesa
        </label>
        {isEdit ? (
          <p className="rounded-md bg-slate-100 px-3 py-2 text-slate-700">
            {initial?.category?.name}
          </p>
        ) : (
          <select
            id="b-category"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            {...register('categoryId')}
          >
            <option value="">Selecione…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId.message}</p>}
      </div>

      <FormField
        id="b-limit"
        label="Limite mensal (R$)"
        type="number"
        step="0.01"
        min="0"
        error={errors.limitAmount?.message}
        {...register('limitAmount')}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
