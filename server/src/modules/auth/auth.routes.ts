import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(registerController));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(loginController));
authRouter.post('/refresh', asyncHandler(refreshController));
authRouter.post('/logout', asyncHandler(logoutController));
authRouter.get('/me', requireAuth, asyncHandler(meController));
