import { Request, Response, NextFunction } from 'express';
import { SendMessageUseCase } from '../../../application/use-cases/SendMessageUseCase';
import { sendMessageSchema, SendMessageDTO } from '../validators/SendMessageDTO';
import { logger } from '../../config/logger';

/**
 * Cria o handler para a rota de envio de mensagem. Valida o corpo da
 * requisição com zod e delega ao caso de uso de envio de mensagem.
 */
export function createMessageHandler(useCase: SendMessageUseCase) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = sendMessageSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map(issue => issue.message);
        res.status(400).json({ errors });
        return;
      }
      const dto: SendMessageDTO = parseResult.data;
      const message = await useCase.execute({
        conversationId: dto.conversationId,
        contact: dto.contact,
        content: dto.content,
        attachments: dto.attachments
      });
      res.status(201).json({
        conversationId: message.conversationId,
        messageId: message.id,
        content: message.content,
        sentAt: message.createdAt
      });
    } catch (err: any) {
      logger.error({ msg: 'Erro no controller de envio de mensagem', error: err.message });
      next(err);
    }
  };
}