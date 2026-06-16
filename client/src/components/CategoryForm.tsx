import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Category, CategoryInput } from '../lib/api.ts';
import { FormField } from './FormField.tsx';

const schema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(40),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  icon: z.string().trim().max(40).optional(),
});

type Values = z.infer<typeof schema>;

interface CategoryFormProps {
  initial?: Category;
  onSubmit: (input: CategoryInput) => Promise<unknown>;
  onCancel: () => void;
  error?: string;
}

export function CategoryForm({ initial, onSubmit, onCancel, error }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type ?? 'EXPENSE',
      color: initial?.color ?? '#38bdf8',
      icon: initial?.icon ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit({ ...v, icon: v.icon || undefined }))}
      className="space-y-4"
      noValidate
    >
      <FormField id="cat-name" label="Nome" error={errors.name?.message} {...register('name')} />
      <div className="space-y-1">
        <label htmlFor="cat-type" className="block text-sm font-medium text-slate-700">
          Tipo
        </label>
        <select
          id="cat-type"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          {...register('type')}
        >
          <option value="EXPENSE">Despesa</option>
          <option value="INCOME">Receita</option>
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="cat-color" className="block text-sm font-medium text-slate-700">
          Cor
        </label>
        <input
          id="cat-color"
          type="color"
          className="h-10 w-16 cursor-pointer rounded border border-slate-300"
          {...register('color')}
        />
        {errors.color && <p className="text-sm text-red-600">{errors.color.message}</p>}
      </div>
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
