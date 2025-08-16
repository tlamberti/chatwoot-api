import { z } from 'zod';

/**
 * Esquema de validação para a rota de envio de mensagens. Define os campos
 * aceitos e garante que o conteúdo seja obrigatório.
 */
export const sendMessageSchema = z.object({
  conversationId: z.number().int().positive().optional(),
  contact: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional()
    })
    .optional(),
  content: z.string().min(1, { message: 'O conteúdo da mensagem é obrigatório' }),
  attachments: z.array(z.string().url()).optional()
});

export type SendMessageDTO = z.infer<typeof sendMessageSchema>;