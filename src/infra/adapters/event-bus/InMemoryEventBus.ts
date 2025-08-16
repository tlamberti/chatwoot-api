import { EventEmitter } from 'events';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { EventBus } from '../../../domain/ports/EventBus';

/**
 * Barramento de eventos que utiliza EventEmitter internamente. Mantém
 * assinantes em memória e transmite eventos imediatamente. Em uma
 * implementação futura, poderia ser substituído por RabbitMQ, Kafka ou outro
 * broker externo.
 */
export class InMemoryEventBus implements EventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  publish(event: DomainEvent): void {
    this.emitter.emit('event', event);
  }

  subscribe(listener: (event: DomainEvent) => void): () => void {
    this.emitter.on('event', listener);
    // Retorna função para remover o listener
    return () => {
      this.emitter.off('event', listener);
    };
  }
}