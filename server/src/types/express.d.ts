/**
 * Augmenta o `Request` do Express para carregar o id do usuário autenticado,
 * preenchido pelo middleware de auth e lido pelos controllers.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
