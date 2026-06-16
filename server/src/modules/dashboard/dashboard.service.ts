import { prisma } from '../../lib/prisma.js';
import type { DashboardQuery } from './dashboard.schemas.js';

export interface CategorySlice {
  categoryId: string | null;
  name: string;
  color: string;
  total: number;
}

export interface MonthlyPoint {
  month: string; // 'YYYY-MM'
  income: number;
  expense: number;
}

export interface DashboardSummary {
  range: { from: string; to: string };
  totals: { income: number; expense: number; balance: number };
  byCategory: CategorySlice[];
  monthly: MonthlyPoint[];
  topExpenseCategories: CategorySlice[];
}

const UNCATEGORIZED_COLOR = '#94a3b8';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** Lista contínua de meses 'YYYY-MM' entre dois instantes (inclusive). */
function monthsBetween(from: Date, to: Date): string[] {
  const months: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
  while (cursor <= end) {
    months.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export async function getSummary(
  userId: string,
  query: DashboardQuery,
): Promise<DashboardSummary> {
  // Janela padrão: últimos 6 meses (mês corrente + 5 anteriores).
  const to = query.to ?? new Date();
  const from =
    query.from ?? new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 5, 1));

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: from, lte: to } },
    include: { category: true },
  });

  let income = 0;
  let expense = 0;
  const categoryTotals = new Map<string, CategorySlice>();
  const monthly = new Map<string, { income: number; expense: number }>(
    monthsBetween(from, to).map((m) => [m, { income: 0, expense: 0 }]),
  );

  for (const tx of transactions) {
    const amount = tx.amount.toNumber();
    const bucket = monthly.get(monthKey(tx.date)) ?? { income: 0, expense: 0 };

    if (tx.type === 'INCOME') {
      income += amount;
      bucket.income += amount;
    } else {
      expense += amount;
      bucket.expense += amount;

      // Gastos por categoria consideram apenas despesas.
      const key = tx.categoryId ?? 'none';
      const existing = categoryTotals.get(key);
      if (existing) {
        existing.total += amount;
      } else {
        categoryTotals.set(key, {
          categoryId: tx.categoryId,
          name: tx.category?.name ?? 'Sem categoria',
          color: tx.category?.color ?? UNCATEGORIZED_COLOR,
          total: amount,
        });
      }
    }
    monthly.set(monthKey(tx.date), bucket);
  }

  const byCategory = [...categoryTotals.values()]
    .map((c) => ({ ...c, total: round2(c.total) }))
    .sort((a, b) => b.total - a.total);

  const monthlySeries: MonthlyPoint[] = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, income: round2(v.income), expense: round2(v.expense) }));

  return {
    range: { from: from.toISOString(), to: to.toISOString() },
    totals: {
      income: round2(income),
      expense: round2(expense),
      balance: round2(income - expense),
    },
    byCategory,
    monthly: monthlySeries,
    topExpenseCategories: byCategory.slice(0, 5),
  };
}
