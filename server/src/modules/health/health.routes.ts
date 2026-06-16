import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { healthCheck } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', asyncHandler(healthCheck));
