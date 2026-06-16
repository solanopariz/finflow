import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { monthRange } from '../../lib/month.js';
import { HttpError } from '../../middlewares/error.middleware.js';
import type { CreateBudgetInput, UpdateBudgetInput } from './budgets.schemas.js';

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface BudgetDTO {
  id: string;
  categoryId: string;
  category: { id: string; name: string; color: string } | null;
  month: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function statusFor(percent: number): BudgetStatus {
  if (percent >= 100) return 'exceeded';
  if (percent >= 80) return 'warning';
  return 'ok';
}

type BudgetRecord = Prisma.BudgetGetPayload<{ include: { category: true } }>;

function toDTO(budget: BudgetRecord, spent: number): BudgetDTO {
  const limitAmount = budget.limitAmount.toNumber();
  const percent = limitAmount > 0 ? round2((spent / limitAmount) * 100) : 0;
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    category: budget.category
      ? { id: budget.category.id, name: budget.category.name, color: budget.category.color }
      : null,
    month: budget.month,
    limitAmount,
    spent: round2(spent),
    remaining: round2(limitAmount - spent),
    percent,
    status: statusFor(percent),
  };
}

/** Lista os orçamentos de um mês com o gasto realizado e o status de alerta. */
export async function listBudgets(userId: string, month: string): Promise<BudgetDTO[]> {
  const budgets = await prisma.budget.findMany({
    where: { userId, month },
    include: { category: true },
    orderBy: { category: { name: 'asc' } },
  });
  if (budgets.length === 0) return [];

  const { start, end } = monthRange(month);
  const txs = await prisma.transaction.findMany({
    where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
    select: { categoryId: true, amount: true },
  });

  const spentByCategory = new Map<string, number>();
  for (const tx of txs) {
    if (tx.categoryId) {
      spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) ?? 0) + tx.amount.toNumber());
    }
  }

  return budgets.map((b) => toDTO(b, spentByCategory.get(b.categoryId) ?? 0));
}

export async function createBudget(userId: string, input: CreateBudgetInput): Promise<BudgetDTO> {
  await ensureExpenseCategory(userId, input.categoryId);
  try {
    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId: input.categoryId,
        month: input.month,
        limitAmount: new Prisma.Decimal(input.limitAmount),
      },
      include: { category: true },
    });
    return toDTO(budget, await spentFor(userId, input.categoryId, input.month));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'Já existe um orçamento para esta categoria neste mês');
    }
    throw err;
  }
}

export async function updateBudget(
  userId: string,
  id: string,
  input: UpdateBudgetInput,
): Promise<BudgetDTO> {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new HttpError(404, 'Orçamento não encontrado');
  }
  const budget = await prisma.budget.update({
    where: { id },
    data: { limitAmount: new Prisma.Decimal(input.limitAmount) },
    include: { category: true },
  });
  return toDTO(budget, await spentFor(userId, existing.categoryId, existing.month));
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  const existing = await prisma.budget.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) {
    throw new HttpError(404, 'Orçamento não encontrado');
  }
  await prisma.budget.delete({ where: { id } });
}

async function ensureExpenseCategory(userId: string, categoryId: string): Promise<void> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { type: true },
  });
  if (!category) {
    throw new HttpError(404, 'Categoria não encontrada');
  }
  if (category.type !== 'EXPENSE') {
    throw new HttpError(400, 'Orçamentos só podem ser criados para categorias de despesa');
  }
}

async function spentFor(userId: string, categoryId: string, month: string): Promise<number> {
  const { start, end } = monthRange(month);
  const agg = await prisma.transaction.aggregate({
    where: { userId, categoryId, type: 'EXPENSE', date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return agg._sum.amount ? agg._sum.amount.toNumber() : 0;
}
