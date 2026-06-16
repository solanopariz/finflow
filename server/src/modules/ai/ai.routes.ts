import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { categorizeController, statusController, summaryController } from './ai.controller.js';
import { categorizeSchema, summarySchema } from './ai.schemas.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.get('/status', asyncHandler(statusController));
aiRouter.post('/categorize', validateBody(categorizeSchema), asyncHandler(categorizeController));
aiRouter.post('/summary', validateBody(summarySchema), asyncHandler(summaryController));
