export interface Conversation {
  /**
   * ID da conversa no Chatwoot.
   */
  id: number;
  /**
   * Identificador do contato associado à conversa.
   */
  contactId: number;
  /**
   * Identificador da inbox em que a conversa está associada.
   */
  inboxId: number;
  /**
   * Status da conversa (ex.: open, resolved). Opcional para fins internos.
   */
  status?: string;
}