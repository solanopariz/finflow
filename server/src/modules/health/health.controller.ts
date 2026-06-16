import type { Request, Response } from 'express';
import { getHealth } from './health.service.js';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const health = await getHealth();
  const httpStatus = health.database === 'up' ? 200 : 503;
  res.status(httpStatus).json(health);
}
