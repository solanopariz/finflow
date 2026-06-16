import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories.ts';
import {
  ApiError,
  bulkCreateTransactions,
  categorize,
  getAiStatus,
  type BulkTransactionInput,
} from '../lib/api.ts';
import { parseTransactionsCsv, type ParsedRow } from '../lib/csv.ts';
import { formatCurrency, formatDate } from '../lib/format.ts';

interface ReviewRow extends ParsedRow {
  categoryId: string | null;
  aiCategoryId: string | null;
  confidence: number;
}

export function ImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useCategories();
  const { data: aiStatus } = useQuery({ queryKey: ['ai-status'], queryFn: getAiStatus });

  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [categorizing, setCategorizing] = useState(false);
  const [error, setError] = useState<string>();

  const importMut = useMutation({
    mutationFn: (transactions: BulkTransactionInput[]) => bulkCreateTransactions(transactions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/transactions', { replace: true });
    },
  });

  async function handleFile(file: File) {
    setError(undefined);
    const text = await file.text();
    const { rows: parsed, errors } = parseTransactionsCsv(text);
    setParseErrors(errors);
    const reviewRows: ReviewRow[] = parsed.map((r) => ({
      ...r,
      categoryId: null,
      aiCategoryId: null,
      confidence: 0,
    }));
    setRows(reviewRows);

    if (parsed.length > 0 && aiStatus?.configured) {
      setCategorizing(true);
      try {
        const results = await categorize(
          parsed.map((r) => ({ description: r.description, amount: r.amount, type: r.type })),
        );
        setRows((prev) =>
          prev.map((row, i) => {
            const result = results.find((res) => res.index === i);
            return result?.categoryId
              ? { ...row, categoryId: result.categoryId, aiCategoryId: result.categoryId, confidence: result.confidence }
              : row;
          }),
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha na categorização por IA');
      } finally {
        setCategorizing(false);
      }
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function setRowCategory(index: number, categoryId: string | null) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, categoryId } : row)));
  }

  function handleImport() {
    setError(undefined);
    const payload: BulkTransactionInput[] = rows.map((row) => ({
      type: row.type,
      amount: row.amount,
      description: row.description,
      date: row.date,
      categoryId: row.categoryId,
      // Marca como AI quando a categoria veio (e foi mantida) da sugestão da IA.
      source: row.categoryId && row.categoryId === row.aiCategoryId ? 'AI' : 'IMPORT',
    }));
    importMut.mutate(payload);
  }

  function reset() {
    setRows([]);
    setParseErrors([]);
    setError(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importar CSV</h1>
        <p className="mt-1 text-slate-600">
          Envie um CSV com colunas <code className="rounded bg-slate-100 px-1">data, descrição, valor</code>{' '}
          (valor positivo = receita, negativo = despesa).{' '}
          <a href="/exemplo.csv" download className="font-medium text-sky-600 hover:underline">
            Baixar exemplo
          </a>
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onPickFile}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-sky-700"
        />
        {aiStatus && !aiStatus.configured && (
          <p className="mt-3 text-sm text-amber-600">
            IA não configurada — as transações serão importadas sem categoria (você pode ajustar
            depois).
          </p>
        )}
        {categorizing && <p className="mt-3 text-sm text-sky-600">IA categorizando transações…</p>}
      </div>

      {parseErrors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <p className="font-medium">Algumas linhas foram ignoradas:</p>
          <ul className="mt-1 list-inside list-disc">
            {parseErrors.slice(0, 5).map((e) => (
              <li key={e}>{e}</li>
            ))}
            {parseErrors.length > 5 && <li>…e mais {parseErrors.length - 5}</li>}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2 text-slate-600">{formatDate(row.date)}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{row.description}</td>
                    <td
                      className={`px-4 py-2 text-right font-semibold ${
                        row.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {row.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={row.categoryId ?? ''}
                          onChange={(e) => setRowCategory(i, e.target.value || null)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-sky-500"
                        >
                          <option value="">Sem categoria</option>
                          {categories
                            ?.filter((c) => c.type === row.type)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                        {row.aiCategoryId && row.categoryId === row.aiCategoryId && (
                          <span className="whitespace-nowrap rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                            IA {Math.round(row.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={importMut.isPending}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {importMut.isPending ? 'Importando…' : `Importar ${rows.length} transações`}
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
