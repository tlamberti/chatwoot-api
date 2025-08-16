import { Request, Response, NextFunction } from 'express';
import { ChatwootGateway } from '../../../domain/ports/ChatwootGateway';
import { EventBus } from '../../../domain/ports/EventBus';
import { getConfig } from '../../config/env';
import { logger } from '../../config/logger';
import crypto from 'crypto';

/**
 * Cria o handler para o webhook do Chatwoot. A função retorna um handler
 * compatível com express, capturando o ChatwootGateway e EventBus via
 * closure. O segredo do webhook é lido do arquivo de configuração.
 */
export function createWebhookHandler(
  chatwoot: ChatwootGateway,
  eventBus: EventBus
) {
  const { WEBHOOK_SECRET } = getConfig();
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body;
      // Verifica assinatura, se houver segredo e cabeçalho
      if (WEBHOOK_SECRET && req.headers['x-chatwoot-signature']) {
        const signature = Array.isArray(req.headers['x-chatwoot-signature'])
          ? req.headers['x-chatwoot-signature'][0]
          : req.headers['x-chatwoot-signature'];
        // Calcula HMAC SHA256 do corpo, assumindo que bodyParser foi configurado
        const rawBody = JSON.stringify(payload);
        const hmac = crypto
          .createHmac('sha256', WEBHOOK_SECRET)
          .update(rawBody)
          .digest('hex');
        if (hmac !== signature) {
          logger.warn({ msg: 'Assinatura do webhook inválida' });
          res.status(401).json({ error: 'Assinatura inválida' });
          return;
        }
      }
      // Normaliza e publica eventos
      const events = chatwoot.normalizeIncomingWebhook(payload);
      events.forEach(ev => eventBus.publish(ev));
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  };
}