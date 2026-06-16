import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import {
  createController,
  deleteController,
  listController,
  updateController,
} from './budgets.controller.js';
import { createBudgetSchema, updateBudgetSchema } from './budgets.schemas.js';

export const budgetsRouter = Router();

budgetsRouter.use(requireAuth);

budgetsRouter.get('/', asyncHandler(listController));
budgetsRouter.post('/', validateBody(createBudgetSchema), asyncHandler(createController));
budgetsRouter.patch('/:id', validateBody(updateBudgetSchema), asyncHandler(updateController));
budgetsRouter.delete('/:id', asyncHandler(deleteController));
