import type { Request, Response } from 'express';
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from './transactions.service.js';
import { listTransactionsQuerySchema } from './transactions.schemas.js';

export async function listController(req: Request, res: Response): Promise<void> {
  const filters = listTransactionsQuerySchema.parse(req.query);
  const transactions = await listTransactions(req.userId!, filters);
  res.status(200).json({ transactions });
}

export async function createController(req: Request, res: Response): Promise<void> {
  const transaction = await createTransaction(req.userId!, req.body);
  res.status(201).json({ transaction });
}

export async function updateController(req: Request, res: Response): Promise<void> {
  const transaction = await updateTransaction(req.userId!, req.params.id!, req.body);
  res.status(200).json({ transaction });
}

export async function deleteController(req: Request, res: Response): Promise<void> {
  await deleteTransaction(req.userId!, req.params.id!);
  res.status(204).end();
}
