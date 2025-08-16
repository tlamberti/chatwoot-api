export interface Contact {
  /**
   * Identificador numérico do contato no Chatwoot.
   */
  id: number;
  /**
   * Nome do contato (opcional).
   */
  name?: string;
  /**
   * E‑mail do contato (opcional).
   */
  email?: string;
  /**
   * Número de telefone do contato no formato internacional (opcional).
   */
  phoneNumber?: string;
  /**
   * Identificador externo fornecido na criação (opcional). O Chatwoot utiliza
   * este valor para deduplicar contatos entre canais públicos.
   */
  identifier?: string;
  /**
   * ID de origem (source_id) retornado pelo Chatwoot em contact_inboxes. É
   * utilizado quando se utiliza a API pública.
   */
  sourceId?: string;
}