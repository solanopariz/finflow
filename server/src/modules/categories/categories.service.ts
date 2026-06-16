import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middlewares/error.middleware.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schemas.js';

export function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  try {
    return await prisma.category.create({
      data: { ...input, userId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'Já existe uma categoria com este nome');
    }
    throw err;
  }
}

export async function updateCategory(userId: string, id: string, input: UpdateCategoryInput) {
  await ensureOwned(userId, id);
  try {
    return await prisma.category.update({ where: { id }, data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'Já existe uma categoria com este nome');
    }
    throw err;
  }
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  await ensureOwned(userId, id);
  await prisma.category.delete({ where: { id } });
}

/** Garante que a categoria existe e pertence ao usuário; senão, 404. */
async function ensureOwned(userId: string, id: string): Promise<void> {
  const found = await prisma.category.findFirst({ where: { id, userId }, select: { id: true } });
  if (!found) {
    throw new HttpError(404, 'Categoria não encontrada');
  }
}
