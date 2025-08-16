import axios, { AxiosInstance } from 'axios';
import { getConfig } from '../../config/env';
import { logger, mask } from '../../config/logger';
import { ChatwootGateway } from '../../../domain/ports/ChatwootGateway';
import { Contact } from '../../../domain/entities/Contact';
import { Conversation } from '../../../domain/entities/Conversation';
import { Message } from '../../../domain/entities/Message';
import { DomainEvent } from '../../../domain/events/DomainEvent';

/**
 * Implementação de ChatwootGateway que realiza requisições HTTP para a API
 * pública do Chatwoot. Toda interação com a API fica encapsulada aqui.
 */
export class ChatwootHttpGateway implements ChatwootGateway {
  private http: AxiosInstance;
  private accountId: number;
  private apiToken: string;

  constructor() {
    const config = getConfig();
    this.accountId = config.CHATWOOT_ACCOUNT_ID;
    this.apiToken = config.CHATWOOT_API_TOKEN;
    this.http = axios.create({
      baseURL: config.CHATWOOT_URL,
      headers: {
        'Content-Type': 'application/json',
        // O Chatwoot aceita api_access_token no cabeçalho para autenticação.
        api_access_token: this.apiToken
      },
      // Define timeout generoso para chamadas externas
      timeout: 15000
    });
  }

  /**
   * Garante a existência de um contato na inbox. Atualmente cria um novo
   * contato sempre que invocado. Em um cenário real, este método poderia
   * verificar a existência de um contato com base no e-mail ou telefone.
   */
  async ensureContact(
    inboxId: number,
    input: { name?: string; email?: string; phone?: string }
  ): Promise<Contact> {
    const phoneNumber = input.phone?.trim();
    const email = input.email?.trim();
    const name = input.name?.trim();

    // 1) Tenta ENCONTRAR por telefone (Contact Filter) — operador correto: equal_to
    try {
      if (phoneNumber) {
        const { data: filterData } = await this.http.post(
          `/api/v1/accounts/${this.accountId}/contacts/filter`,
          {
            page: 1,
            payload: [
              {
                attribute_key: 'phone_number',
                filter_operator: 'equal_to', // <— aqui!
                values: [phoneNumber]
              }
            ]
          }
        );

        // diferentes versões retornam formatos ligeiramente distintos.
        const found =
          filterData?.payload?.[0]?.payload?.contact ??
          filterData?.payload?.[0] ??
          filterData?.data?.[0];

        if (found?.id) {
          return {
            id: Number(found.id),
            name: found.name,
            email: found.email,
            phoneNumber: found.phone_number
          };
        }
      }
    } catch (err: any) {
      // se o filtro não estiver disponível, seguimos para criação
      logger.warn({ err: err?.response?.data }, 'Falha no contact filter, tentando criar contato');
    }

    // 2) Criar contato (usa phone_number)
    try {
      const { data } = await this.http.post(
        `/api/v1/accounts/${this.accountId}/contacts`,
        {
          name,
          email,
          phone_number: phoneNumber
        }
      );
      return {
        id: Number(data.id),
        name: data.name,
        email: data.email,
        phoneNumber: data.phone_number
      };
    } catch (err: any) {
      const status = err?.response?.status;

      // 3) Se já existe (422), BUSCAR e retornar o existente
      if (status === 422) {
        // 3a) tenta novamente o FILTER com equal_to
        if (phoneNumber) {
          try {
            const { data: filterAgain } = await this.http.post(
              `/api/v1/accounts/${this.accountId}/contacts/filter`,
              {
                page: 1,
                payload: [
                  {
                    attribute_key: 'phone_number',
                    filter_operator: 'equal_to',
                    values: [phoneNumber]
                  }
                ]
              }
            );
            const found =
              filterAgain?.payload?.[0]?.payload?.contact ??
              filterAgain?.payload?.[0] ??
              filterAgain?.data?.[0];

            if (found?.id) {
              return {
                id: Number(found.id),
                name: found.name,
                email: found.email,
                phoneNumber: found.phone_number
              };
            }
          } catch {
            // ignora e tenta search
          }
        }

        // 3b) fallback: SEARCH por telefone (funciona em várias versões)
        try {
          const { data: search } = await this.http.get(
            `/api/v1/accounts/${this.accountId}/contacts/search`,
            { params: { q: phoneNumber || email || name } }
          );
          const c =
            search?.payload?.find?.((x: any) => x?.phone_number === phoneNumber) ??
            search?.payload?.[0];

          if (c?.id) {
            return {
              id: Number(c.id),
              name: c.name,
              email: c.email,
              phoneNumber: c.phone_number
            };
          }
        } catch {
          // cai no throw final
        }
      }

      logger.error({ err: err?.response?.data }, 'Erro ao criar contato no Chatwoot');
      throw new Error('Falha ao criar contato no Chatwoot');
    }
  }



  /**
   * Cria uma nova conversa associada ao contato. Neste momento não tenta
   * reutilizar conversas existentes; sempre cria uma conversa nova.
   */
  async ensureConversation(contact: Contact, inboxId: number): Promise<Conversation> {
    // validações defensivas
    if (!contact || contact.id === undefined || contact.id === null) {
      throw new Error('Contato sem ID ao criar conversa');
    }
    if (!inboxId) {
      throw new Error('InboxId inválido ao criar conversa');
    }

    // source_id precisa ser string; use o identifier se existir, senão o id do contato
    const sourceId = String(contact.identifier ?? contact.id);

    // 1) GARANTIR contact_inbox (vínculo do contato com a inbox)
    //    POST /api/v1/accounts/{account_id}/contacts/{contact_id}/contact_inboxes
    //    body: { inbox_id, source_id }
    try {
      await this.http.post(
        `/api/v1/accounts/${this.accountId}/contacts/${contact.id}/contact_inboxes`,
        {
          inbox_id: Number(inboxId),
          source_id: sourceId
        }
      );
      logger.debug({ contactId: contact.id, inboxId }, 'Contact inbox garantido no Chatwoot');
    } catch (err: any) {
      // se já existe, o Chatwoot pode retornar 422; seguimos em frente
      const status = err?.response?.status;
      if (status !== 422) {
        logger.error({ err: err?.response?.data }, 'Erro ao garantir contact_inbox');
        throw new Error('Falha ao vincular contato à inbox no Chatwoot');
      }
    }

    // 2) CRIAR CONVERSA
    //    POST /api/v1/accounts/{account_id}/conversations
    //    body: { source_id, inbox_id, contact_id }
    try {
      const { data } = await this.http.post(
        `/api/v1/accounts/${this.accountId}/conversations`,
        {
          source_id: sourceId,
          inbox_id: Number(inboxId),
          contact_id: Number(contact.id)
        }
      );

      const conversation: Conversation = {
        id: Number(data.id),
        contactId: Number(contact.id),
        inboxId: Number(inboxId),
        status: data.status
      };
      logger.debug(
        { conversationId: conversation.id, contactId: conversation.contactId },
        'Conversa criada/garantida no Chatwoot'
      );
      return conversation;
    } catch (err: any) {
      logger.error({ err: err?.response?.data }, 'Erro ao criar conversa no Chatwoot');
      throw new Error('Falha ao criar conversa no Chatwoot');
    }
  }

  /**
   * Envia uma mensagem para uma conversa existente.
   */
  async sendMessage(
    conversationId: number,
    data: { content: string; attachments?: string[] }
  ): Promise<Message> {
    try {
      const body: any = {
        content: data.content,
        message_type: 'outgoing',
        private: false,
        content_type: 'text'
      };
      // O Chatwoot permite anexar arquivos enviando uma lista de URLs no campo
      // attachments. Cada item do array deve ser um objeto com url.
      if (data.attachments && data.attachments.length > 0) {
        body.attachments = data.attachments.map(url => ({ url }));
      }
      const res = await this.http.post(
        `/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        body
      );
      const msg = res.data;
      const message: Message = {
        id: msg.id,
        conversationId: msg.conversation_id,
        content: msg.content,
        senderType: msg.sender_type === 'Contact' ? 'contact' : 'agent',
        createdAt: new Date(msg.created_at)
      };
      logger.debug({
        msg: 'Mensagem enviada ao Chatwoot',
        messageId: message.id,
        conversationId: message.conversationId
      });
      return message;
    } catch (err: any) {
      logger.error({ msg: 'Erro ao enviar mensagem ao Chatwoot', error: err.message });
      throw new Error('Falha ao enviar mensagem');
    }
  }

  /**
   * Normaliza o payload recebido via webhook em eventos de domínio. A
   * implementação simplifica para um mapeamento direto do evento.
   */
  normalizeIncomingWebhook(payload: any): DomainEvent[] {
    if (!payload) return [];
    const eventName: string = payload?.event || payload?.event_type || 'unknown';
    return [
      {
        type: eventName,
        payload
      }
    ];
  }
}