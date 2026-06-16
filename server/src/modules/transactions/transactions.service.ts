import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middlewares/error.middleware.js';
import type {
  BulkCreateInput,
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from './transactions.schemas.js';

type TransactionRecord = Prisma.TransactionGetPayload<{ include: { category: true } }>;

/** DTO de saída: `amount` vira número (o Decimal do Prisma serializa como string). */
export interface TransactionDTO {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  date: Date;
  source: string;
  categoryId: string | null;
  category: { id: string; name: string; color: string; icon: string | null } | null;
  createdAt: Date;
}

function toDTO(tx: TransactionRecord): TransactionDTO {
  return {
    id: tx.id,
    type: tx.type,
    amount: tx.amount.toNumber(),
    description: tx.description,
    date: tx.date,
    source: tx.source,
    categoryId: tx.categoryId,
    category: tx.category
      ? { id: tx.category.id, name: tx.category.name, color: tx.category.color, icon: tx.category.icon }
      : null,
    createdAt: tx.createdAt,
  };
}

export async function listTransactions(
  userId: string,
  filters: ListTransactionsQuery,
): Promise<TransactionDTO[]> {
  const where: Prisma.TransactionWhereInput = { userId };
  if (filters.type) where.type = filters.type;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = filters.from;
    if (filters.to) where.date.lte = filters.to;
  }

  const txs = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return txs.map(toDTO);
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<TransactionDTO> {
  if (input.categoryId) {
    await ensureCategoryMatches(userId, input.categoryId, input.type);
  }

  const tx = await prisma.transaction.create({
    data: {
      userId,
      type: input.type,
      amount: new Prisma.Decimal(input.amount),
      description: input.description,
      date: input.date,
      categoryId: input.categoryId ?? null,
    },
    include: { category: true },
  });
  return toDTO(tx);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionDTO> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new HttpError(404, 'Transação não encontrada');
  }

  // O tipo efetivo após o update define a checagem de compatibilidade da categoria.
  const effectiveType = input.type ?? existing.type;
  if (input.categoryId) {
    await ensureCategoryMatches(userId, input.categoryId, effectiveType);
  }

  const data: Prisma.TransactionUpdateInput = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.amount !== undefined) data.amount = new Prisma.Decimal(input.amount);
  if (input.description !== undefined) data.description = input.description;
  if (input.date !== undefined) data.date = input.date;
  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }

  const tx = await prisma.transaction.update({
    where: { id },
    data,
    include: { category: true },
  });
  return toDTO(tx);
}

/**
 * Cria várias transações de uma vez (importação de CSV). Valida as categorias
 * em memória (uma consulta) e insere tudo em lote. Retorna a quantidade criada.
 */
export async function createManyTransactions(
  userId: string,
  input: BulkCreateInput,
): Promise<{ count: number }> {
  const categoryIds = [
    ...new Set(input.transactions.map((t) => t.categoryId).filter((id): id is string => !!id)),
  ];

  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds }, userId },
        select: { id: true, type: true },
      })
    : [];
  const byId = new Map(categories.map((c) => [c.id, c]));

  const data = input.transactions.map((t, i) => {
    if (t.categoryId) {
      const category = byId.get(t.categoryId);
      if (!category) {
        throw new HttpError(400, `Categoria inválida na transação ${i + 1}`);
      }
      if (category.type !== t.type) {
        throw new HttpError(400, `Categoria de tipo divergente na transação ${i + 1}`);
      }
    }
    return {
      userId,
      type: t.type,
      amount: new Prisma.Decimal(t.amount),
      description: t.description,
      date: t.date,
      categoryId: t.categoryId ?? null,
      source: t.source ?? 'IMPORT',
    };
  });

  const result = await prisma.transaction.createMany({ data });
  return { count: result.count };
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) {
    throw new HttpError(404, 'Transação não encontrada');
  }
  await prisma.transaction.delete({ where: { id } });
}

/** Valida que a categoria existe, é do usuário e tem o mesmo tipo da transação. */
async function ensureCategoryMatches(
  userId: string,
  categoryId: string,
  type: 'INCOME' | 'EXPENSE',
): Promise<void> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { type: true },
  });
  if (!category) {
    throw new HttpError(404, 'Categoria não encontrada');
  }
  if (category.type !== type) {
    throw new HttpError(400, 'A categoria deve ser do mesmo tipo da transação');
  }
}
