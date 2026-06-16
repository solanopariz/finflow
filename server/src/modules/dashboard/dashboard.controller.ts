import type { Request, Response } from 'express';
import { dashboardQuerySchema } from './dashboard.schemas.js';
import { getSummary } from './dashboard.service.js';

export async function summaryController(req: Request, res: Response): Promise<void> {
  const query = dashboardQuerySchema.parse(req.query);
  const summary = await getSummary(req.userId!, query);
  res.status(200).json(summary);
}
