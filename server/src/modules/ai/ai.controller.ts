import type { Request, Response } from 'express';
import { isAiConfigured } from '../../lib/anthropic.js';
import { HttpError } from '../../middlewares/error.middleware.js';
import { categorizeTransactions } from './ai.service.js';

export async function statusController(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ configured: isAiConfigured() });
}

export async function categorizeController(req: Request, res: Response): Promise<void> {
  if (!isAiConfigured()) {
    throw new HttpError(503, 'Categorização por IA indisponível: ANTHROPIC_API_KEY não configurada');
  }
  const results = await categorizeTransactions(req.userId!, req.body.items);
  res.status(200).json({ results });
}
