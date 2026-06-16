import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBudget,
  deleteBudget,
  listBudgets,
  updateBudget,
  type BudgetInput,
} from '../lib/api.ts';

const ROOT = ['budgets'] as const;

export function useBudgets(month: string) {
  return useQuery({ queryKey: [...ROOT, month], queryFn: () => listBudgets(month) });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ROOT });
}

export function useCreateBudget() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: BudgetInput) => createBudget(input),
    onSuccess: invalidate,
  });
}

export function useUpdateBudget() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, limitAmount }: { id: string; limitAmount: number }) =>
      updateBudget(id, limitAmount),
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: invalidate,
  });
}
