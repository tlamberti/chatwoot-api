export interface Message {
  /**
   * ID do message retornado pela API. Pode ser numérico ou string dependendo
   * do canal de origem.
   */
  id: number | string;
  /**
   * ID da conversa em que a mensagem foi enviada.
   */
  conversationId: number;
  /**
   * Conteúdo textual da mensagem.
   */
  content: string;
  /**
   * Tipo de remetente (agent ou contact). O Chatwoot utiliza valores
   * numéricos para message_type, mas normalizamos aqui.
   */
  senderType: 'agent' | 'contact';
  /**
   * Data e hora de criação da mensagem.
   */
  createdAt: Date;
}