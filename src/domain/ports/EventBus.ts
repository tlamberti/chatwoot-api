import { DomainEvent } from '../events/DomainEvent';

/**
 * Barramento de eventos simples. Permite publicar eventos e assinar para
 * recebê-los. Utilizamos essa abstração para desacoplar a propagação de
 * eventos, facilitando a implementação do SSE e futuras integrações.
 */
export interface EventBus {
  /**
   * Publica um evento para todos os assinantes.
   */
  publish(event: DomainEvent): void;
  /**
   * Registra um callback que será invocado sempre que um evento for
   * publicado. Retorna uma função que remove o listener quando chamada.
   */
  subscribe(listener: (event: DomainEvent) => void): () => void;
}