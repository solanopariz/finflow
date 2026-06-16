import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';

/**
 * Router raiz da API. Cada módulo (auth, transactions, categories, ...) registra
 * seu próprio sub-router aqui à medida que os marcos avançam.
 */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
