import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';

/**
 * Middleware global de tratamento de erros. Garante que todas as exceções não
 * tratadas sejam respondidas com status 500 e uma mensagem genérica, além de
 * registrar os detalhes no log.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error({ msg: 'Erro inesperado', error: err.message, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erro interno do servidor' });
}