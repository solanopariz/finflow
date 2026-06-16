import type { Request, Response } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from './categories.service.js';

export async function listController(req: Request, res: Response): Promise<void> {
  const categories = await listCategories(req.userId!);
  res.status(200).json({ categories });
}

export async function createController(req: Request, res: Response): Promise<void> {
  const category = await createCategory(req.userId!, req.body);
  res.status(201).json({ category });
}

export async function updateController(req: Request, res: Response): Promise<void> {
  const category = await updateCategory(req.userId!, req.params.id!, req.body);
  res.status(200).json({ category });
}

export async function deleteController(req: Request, res: Response): Promise<void> {
  await deleteCategory(req.userId!, req.params.id!);
  res.status(204).end();
}
