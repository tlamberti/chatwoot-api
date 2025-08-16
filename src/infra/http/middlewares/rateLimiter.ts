import rateLimit from 'express-rate-limit';

/**
 * Middleware de rate limiting para proteger a API contra abusos. Permite no
 * máximo 100 requisições por 15 minutos por IP. Ajuste conforme a necessidade.
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});