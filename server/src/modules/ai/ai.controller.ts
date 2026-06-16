import type { Request, Response } from 'express';
import { isAiConfigured } from '../../lib/anthropic.js';
import { HttpError } from '../../middlewares/error.middleware.js';
import { categorizeTransactions } from './ai.service.js';
import { summarizeMonth } from './ai.summary.js';

function requireAi(): void {
  if (!isAiConfigured()) {
    throw new HttpError(503, 'Recurso de IA indisponível: ANTHROPIC_API_KEY não configurada');
  }
}

export async function statusController(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ configured: isAiConfigured() });
}

export async function categorizeController(req: Request, res: Response): Promise<void> {
  requireAi();
  const results = await categorizeTransactions(req.userId!, req.body.items);
  res.status(200).json({ results });
}

export async function summaryController(req: Request, res: Response): Promise<void> {
  requireAi();
  const summary = await summarizeMonth(req.userId!, req.body.month);
  res.status(200).json(summary);
}
