import pino from 'pino';

/**
 * Função utilitária para mascarar valores sensíveis. Ela mostra apenas os
 * últimos 4 caracteres de um token, substituindo o restante por asteriscos.
 */
export function mask(value: string | undefined | null): string {
  if (!value) return '';
  const visibleLength = 4;
  return `${'*'.repeat(Math.max(0, value.length - visibleLength))}${value.slice(-visibleLength)}`;
}

/**
 * Instância do logger Pino. Utilizamos níveis padrão e JSON como formato
 * estruturado. Para desenvolvimento, pode-se trocar por pino-pretty se
 * necessário; no entanto, optamos pelo formato JSON por consistência e
 * facilidade de parsing em logs centralizados.
 */
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});