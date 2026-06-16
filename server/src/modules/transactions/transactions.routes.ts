import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import {
  createController,
  deleteController,
  listController,
  updateController,
} from './transactions.controller.js';
import { createTransactionSchema, updateTransactionSchema } from './transactions.schemas.js';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.get('/', asyncHandler(listController));
transactionsRouter.post('/', validateBody(createTransactionSchema), asyncHandler(createController));
transactionsRouter.patch(
  '/:id',
  validateBody(updateTransactionSchema),
  asyncHandler(updateController),
);
transactionsRouter.delete('/:id', asyncHandler(deleteController));
