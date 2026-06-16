import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Category, Transaction, TransactionInput } from '../lib/api.ts';
import { toDateInputValue } from '../lib/format.ts';
import { FormField } from './FormField.tsx';

const schema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(140),
  date: z.string().min(1, 'Data é obrigatória'),
  categoryId: z.string(),
});

type Values = z.infer<typeof schema>;

interface TransactionFormProps {
  initial?: Transaction;
  categories: Category[];
  onSubmit: (input: TransactionInput) => Promise<unknown>;
  onCancel: () => void;
  error?: string;
}

export function TransactionForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  error,
}: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initial?.type ?? 'EXPENSE',
      amount: initial?.amount ?? undefined,
      description: initial?.description ?? '',
      date: initial ? toDateInputValue(initial.date) : new Date().toISOString().slice(0, 10),
      categoryId: initial?.categoryId ?? '',
    },
  });

  // Só categorias do mesmo tipo da transação podem ser selecionadas.
  const selectedType = watch('type');
  const options = categories.filter((c) => c.type === selectedType);

  return (
    <form
      onSubmit={handleSubmit((v) =>
        onSubmit({
          type: v.type,
          amount: v.amount,
          description: v.description,
          date: new Date(v.date).toISOString(),
          categoryId: v.categoryId || null,
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1">
        <label htmlFor="tx-type" className="block text-sm font-medium text-slate-700">
          Tipo
        </label>
        <select
          id="tx-type"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          {...register('type')}
        >
          <option value="EXPENSE">Despesa</option>
          <option value="INCOME">Receita</option>
        </select>
      </div>

      <FormField
        id="tx-amount"
        label="Valor"
        type="number"
        step="0.01"
        min="0"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <FormField
        id="tx-description"
        label="Descrição"
        error={errors.description?.message}
        {...register('description')}
      />

      <FormField id="tx-date" label="Data" type="date" error={errors.date?.message} {...register('date')} />

      <div className="space-y-1">
        <label htmlFor="tx-category" className="block text-sm font-medium text-slate-700">
          Categoria
        </label>
        <select
          id="tx-category"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          {...register('categoryId')}
        >
          <option value="">Sem categoria</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
