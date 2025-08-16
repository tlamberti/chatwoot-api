import { SendMessageUseCase } from '../../src/application/use-cases/SendMessageUseCase';
import { ChatwootGateway } from '../../src/domain/ports/ChatwootGateway';
import { EventBus } from '../../src/domain/ports/EventBus';

describe('SendMessageUseCase', () => {
  it('deve criar contato e conversa e enviar mensagem quando conversationId não for fornecido', async () => {
    // Mocks
    const chatwootMock: jest.Mocked<ChatwootGateway> = {
      ensureContact: jest.fn().mockResolvedValue({ id: 1, name: 'Teste' }),
      ensureConversation: jest.fn().mockResolvedValue({ id: 10, contactId: 1, inboxId: 2 }),
      sendMessage: jest.fn().mockResolvedValue({
        id: 100,
        conversationId: 10,
        content: 'Olá',
        senderType: 'agent',
        createdAt: new Date()
      }),
      normalizeIncomingWebhook: jest.fn()
    } as any;
    const eventBusMock: jest.Mocked<EventBus> = {
      publish: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {})
    };
    const useCase = new SendMessageUseCase(chatwootMock, eventBusMock);
    const message = await useCase.execute({
      contact: { name: 'Fulano', email: 'fulano@example.com' },
      content: 'Olá mundo'
    });
    expect(chatwootMock.ensureContact).toHaveBeenCalledTimes(1);
    expect(chatwootMock.ensureConversation).toHaveBeenCalledTimes(1);
    expect(chatwootMock.sendMessage).toHaveBeenCalledTimes(1);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'message.sent' })
    );
    expect(message.conversationId).toBe(10);
    expect(message.content).toBe('Olá');
  });
});