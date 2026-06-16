import type { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Envolve um handler assíncrono para encaminhar rejeições ao error handler.
 * No Express 4, throws em funções async não são capturados automaticamente.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
