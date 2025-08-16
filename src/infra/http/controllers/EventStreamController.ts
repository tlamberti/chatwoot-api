import { Request, Response } from 'express';
import { EventBus } from '../../../domain/ports/EventBus';
import { DomainEvent } from '../../../domain/events/DomainEvent';

/**
 * Cria o handler para a rota SSE (/events/stream). Cada cliente conectado
 * permanece com a conexão aberta e recebe eventos assim que são publicados
 * no barramento.
 */
export function createEventStreamHandler(eventBus: EventBus) {
  return (req: Request, res: Response): void => {
    // Configura cabeçalhos para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Garante que a resposta seja enviada imediatamente
    res.flushHeaders?.();
    // Mantém a conexão viva com um comentário a cada 30s
    const keepAliveInterval = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 30000);
    // Listener que será chamado para cada evento publicado
    const sendEvent = (event: DomainEvent) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
    };
    const unsubscribe = eventBus.subscribe(sendEvent);
    // Remove listener e limpa interval ao fechar a conexão
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      unsubscribe();
    });
  };
}