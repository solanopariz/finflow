import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import {
  createController,
  deleteController,
  listController,
  updateController,
} from './categories.controller.js';
import { createCategorySchema, updateCategorySchema } from './categories.schemas.js';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get('/', asyncHandler(listController));
categoriesRouter.post('/', validateBody(createCategorySchema), asyncHandler(createController));
categoriesRouter.patch('/:id', validateBody(updateCategorySchema), asyncHandler(updateController));
categoriesRouter.delete('/:id', asyncHandler(deleteController));
