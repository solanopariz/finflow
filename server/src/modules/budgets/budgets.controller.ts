import type { Request, Response } from 'express';
import { createBudget, deleteBudget, listBudgets, updateBudget } from './budgets.service.js';
import { listBudgetsQuerySchema } from './budgets.schemas.js';

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function listController(req: Request, res: Response): Promise<void> {
  const { month } = listBudgetsQuerySchema.parse(req.query);
  const budgets = await listBudgets(req.userId!, month ?? currentMonth());
  res.status(200).json({ budgets });
}

export async function createController(req: Request, res: Response): Promise<void> {
  const budget = await createBudget(req.userId!, req.body);
  res.status(201).json({ budget });
}

export async function updateController(req: Request, res: Response): Promise<void> {
  const budget = await updateBudget(req.userId!, req.params.id!, req.body);
  res.status(200).json({ budget });
}

export async function deleteController(req: Request, res: Response): Promise<void> {
  await deleteBudget(req.userId!, req.params.id!);
  res.status(204).end();
}
