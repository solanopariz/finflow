import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../lib/api.ts';

export function useDashboard(from: string) {
  return useQuery({
    queryKey: ['dashboard', from],
    queryFn: () => getDashboardSummary({ from }),
  });
}
