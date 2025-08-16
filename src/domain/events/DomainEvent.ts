/**
 * Representa um evento de domínio genérico que pode ser publicado pelo
 * ChatwootGateway ao receber um webhook. A propriedade `type` indica o tipo
 * do evento (por exemplo: message.created) e o `payload` contém os dados
 * normalizados do evento.
 */
export interface DomainEvent<T = any> {
  type: string;
  payload: T;
}