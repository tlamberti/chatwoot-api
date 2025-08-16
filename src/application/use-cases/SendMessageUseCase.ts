import { ChatwootGateway } from '../../domain/ports/ChatwootGateway';
import { EventBus } from '../../domain/ports/EventBus';
import { Contact } from '../../domain/entities/Contact';
import { Message } from '../../domain/entities/Message';

/**
 * Estrutura de entrada para o caso de uso de envio de mensagem. O
 * conversationId é opcional; se não for fornecido, será criada uma
 * nova conversa para o contato informado.
 */
export interface SendMessageInput {
  conversationId?: number;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  content: string;
  attachments?: string[];
}

/**
 * Caso de uso responsável por orquestrar o envio de mensagens através do
 * Chatwoot. Depende do ChatwootGateway para interações externas e do
 * EventBus para publicar eventos adicionais se necessário.
 */
export class SendMessageUseCase {
  constructor(
    private readonly chatwoot: ChatwootGateway,
    private readonly eventBus: EventBus
  ) {}

  async execute(input: SendMessageInput): Promise<Message> {
    let conversationId = input.conversationId;
    let contact: Contact | undefined;

    // Se não houver conversationId, precisamos dos dados do contato
    if (!conversationId) {
      if (!input.contact) {
        throw new Error('Dados de contato são obrigatórios quando conversationId não é fornecido');
      }
      // Cria ou obtém o contato
      contact = await this.chatwoot.ensureContact(
        // inboxId é obtido no gateway via env config
        this.getInboxId(),
        input.contact
      );
      // Cria a conversa associada ao contato
      const conversation = await this.chatwoot.ensureConversation(
        contact,
        this.getInboxId()
      );
      conversationId = conversation.id;
    }

    // Por via das dúvidas, se contact não estiver definido e conversationId
    // existir, definimos um contato fantasma. sendMessage não usa contato.
    const message = await this.chatwoot.sendMessage(conversationId!, {
      content: input.content,
      attachments: input.attachments
    });
    // Publica um evento de que mensagem foi enviada. Isso permite que outros
    // componentes reajam (ex.: registrar histórico, estatísticas, etc.).
    this.eventBus.publish({ type: 'message.sent', payload: message });
    return message;
  }

  /**
   * Recupera a inboxId diretamente do ChatwootGateway por meio da configuração.
   * Ao centralizar aqui, isolamos o acesso às variáveis de ambiente.
   */
  private getInboxId(): number {
    // Internamente o gateway já valida a configuração, mas precisamos
    // expor a inboxId para criação de contato e conversa.
    const config = require('../../infra/config/env');
    return config.getConfig().CHATWOOT_INBOX_ID;
  }
}