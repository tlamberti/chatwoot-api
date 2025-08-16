import request from 'supertest';
import nock from 'nock';
import { buildServer } from '../../src/infra/http/server';

describe('Rota POST /chatwoot/messages/send', () => {
  const chatwootBaseUrl = 'https://app.chatwoot.com';
  let app: ReturnType<typeof buildServer>;

  beforeAll(() => {
    process.env.PORT = '4000';
    process.env.CHATWOOT_URL = chatwootBaseUrl;
    process.env.CHATWOOT_ACCOUNT_ID = '1';
    process.env.CHATWOOT_API_TOKEN = 'token';
    process.env.CHATWOOT_INBOX_ID = '2';
    // Carrega a aplicação após setar as variáveis de ambiente
    app = buildServer();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('deve criar contato, conversa e enviar mensagem', async () => {
    // Mock da criação de contato
    nock(chatwootBaseUrl)
      .post('/api/v1/accounts/1/contacts')
      .reply(200, {
        payload: [
          {
            id: 1,
            name: 'Fulano',
            email: 'fulano@example.com',
            identifier: 'fulano@example.com',
            contact_inboxes: [
              {
                source_id: 'source-123'
              }
            ]
          }
        ]
      });
    // Mock da criação de conversa
    nock(chatwootBaseUrl)
      .post('/api/v1/accounts/1/conversations')
      .reply(200, { id: 10, contact_id: 1, inbox_id: 2 });
    // Mock do envio de mensagem
    nock(chatwootBaseUrl)
      .post('/api/v1/accounts/1/conversations/10/messages')
      .reply(200, {
        id: 100,
        conversation_id: 10,
        content: 'Olá',
        sender_type: 'Agent',
        created_at: new Date().toISOString()
      });
    const res = await request(app)
      .post('/chatwoot/messages/send')
      .send({
        contact: { name: 'Fulano', email: 'fulano@example.com' },
        content: 'Olá'
      });
    expect(res.status).toBe(201);
    expect(res.body.conversationId).toBe(10);
    expect(res.body.messageId).toBe(100);
    expect(res.body.content).toBe('Olá');
  });

  it('deve retornar 400 quando payload for inválido', async () => {
    const res = await request(app)
      .post('/chatwoot/messages/send')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});