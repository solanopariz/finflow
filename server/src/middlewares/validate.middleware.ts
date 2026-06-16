import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Valida `req.body` contra um schema Zod, substituindo-o pelos dados já
 * tipados/parseados. Erros do Zod são tratados pelo handler global.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}
