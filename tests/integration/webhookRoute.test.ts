import request from 'supertest';
import { buildServer } from '../../src/infra/http/server';

describe('Rota POST /webhook/chatwoot', () => {
  let app: ReturnType<typeof buildServer>;
  beforeAll(() => {
    process.env.PORT = '4000';
    process.env.CHATWOOT_URL = 'https://app.chatwoot.com';
    process.env.CHATWOOT_ACCOUNT_ID = '1';
    process.env.CHATWOOT_API_TOKEN = 'token';
    process.env.CHATWOOT_INBOX_ID = '2';
    // Sem segredo de webhook para simplificar este teste
    delete process.env.WEBHOOK_SECRET;
    app = buildServer();
  });
  it('deve aceitar payload e responder com received: true', async () => {
    const payload = { event: 'message.created', data: { content: 'Oi' } };
    const res = await request(app)
      .post('/webhook/chatwoot')
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});