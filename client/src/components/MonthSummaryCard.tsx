import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError, getAiStatus, getMonthSummary } from '../lib/api.ts';

/** Card de resumo mensal narrado por IA para o mês selecionado. */
export function MonthSummaryCard({ month }: { month: string }) {
  const { data: aiStatus } = useQuery({ queryKey: ['ai-status'], queryFn: getAiStatus });
  const summaryMut = useMutation({ mutationFn: () => getMonthSummary(month) });

  if (aiStatus && !aiStatus.configured) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Resumo por IA</h2>
        <p className="mt-2 text-sm text-amber-600">
          Configure a ANTHROPIC_API_KEY para gerar o resumo mensal narrado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-violet-700">
          ✨ Resumo do mês por IA
        </h2>
        <button
          onClick={() => summaryMut.mutate()}
          disabled={summaryMut.isPending}
          className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {summaryMut.isPending ? 'Gerando…' : summaryMut.data ? 'Gerar novamente' : 'Gerar resumo'}
        </button>
      </div>

      {summaryMut.isError && (
        <p className="mt-3 text-sm text-red-600">
          {summaryMut.error instanceof ApiError ? summaryMut.error.message : 'Falha ao gerar resumo'}
        </p>
      )}
      {summaryMut.data && (
        <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">
          {summaryMut.data.summary}
        </p>
      )}
      {!summaryMut.data && !summaryMut.isPending && !summaryMut.isError && (
        <p className="mt-3 text-sm text-slate-500">
          Gere uma narrativa do mês com base nas suas receitas, despesas e orçamentos.
        </p>
      )}
    </div>
  );
}
