import { Contact } from '../entities/Contact';
import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';
import { DomainEvent } from '../events/DomainEvent';

/**
 * Interface que descreve as operações que a camada de aplicação pode realizar
 * sobre o Chatwoot. A implementação concreta (ChatwootHttpGateway) lidará com
 * requisições HTTP, enquanto a camada de domínio opera apenas com as
 * abstrações definidas aqui.
 */
export interface ChatwootGateway {
  /**
   * Garante a existência de um contato na inbox fornecida. Caso o contato já
   * exista, retorna as informações existentes; caso contrário, cria um novo
   * contato com os dados fornecidos.
   *
   * @param inboxId ID da inbox onde o contato deve ser criado
   * @param contact Dados do contato (nome, e‑mail e/ou telefone)
   */
  ensureContact(
    inboxId: number,
    contact: { name?: string; email?: string; phone?: string }
  ): Promise<Contact>;

  /**
   * Garante a existência de uma conversa para um determinado contato na inbox
   * especificada. Se já existir uma conversa aberta, ela pode ser retornada;
   * caso contrário, uma nova conversa é criada.
   *
   * @param contact Instância do contato retornado por `ensureContact`
   * @param inboxId ID da inbox onde a conversa deve existir
   */
  ensureConversation(contact: Contact, inboxId: number): Promise<Conversation>;

  /**
   * Envia uma mensagem para uma conversa existente.
   *
   * @param conversationId Identificador da conversa
   * @param data Conteúdo da mensagem e, opcionalmente, anexos
   */
  sendMessage(
    conversationId: number,
    data: { content: string; attachments?: string[] }
  ): Promise<Message>;

  /**
   * Normaliza o payload recebido via webhook em uma lista de eventos de
   * domínio. Cada implementação deve converter o payload bruto do Chatwoot
   * para um ou mais eventos compreensíveis pela aplicação.
   *
   * @param payload Corpo recebido no webhook
   */
  normalizeIncomingWebhook(payload: any): DomainEvent[];
}