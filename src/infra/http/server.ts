import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { json } from 'express';
import swaggerUi from 'swagger-ui-express';
import { getConfig } from '../config/env';
import { logger } from '../config/logger';
import { InMemoryEventBus } from '../adapters/event-bus/InMemoryEventBus';
import { ChatwootHttpGateway } from '../adapters/chatwoot/ChatwootHttpGateway';
import { SendMessageUseCase } from '../../application/use-cases/SendMessageUseCase';
import { createWebhookHandler } from './controllers/WebhookController';
import { createMessageHandler } from './controllers/MessageController';
import { createEventStreamHandler } from './controllers/EventStreamController';
import { healthHandler } from './controllers/HealthController';
import { rateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';

// Carregamos a especificação OpenAPI gerada manualmente. A importação dinâmica
// permite que o JSON seja carregado em tempo de execução sem interferir na
// compilação TypeScript.
import openApiSpec from '../../docs/openapi.json';

export function buildServer() {
  const app = express();
  const config = getConfig();
  const eventBus = new InMemoryEventBus();
  const chatwootGateway = new ChatwootHttpGateway();
  const sendMessageUseCase = new SendMessageUseCase(chatwootGateway, eventBus);
  // Middlewares globais
  app.use(helmet());
  app.use(cors());
  app.use(rateLimiter);
  // Express já possui bodyParser.json embutido a partir da versão 4.16
  app.use(json({ limit: '2mb' }));
  // Rotas
  app.post('/webhook/chatwoot', createWebhookHandler(chatwootGateway, eventBus));
  app.post('/chatwoot/messages/send', createMessageHandler(sendMessageUseCase));
  app.get('/events/stream', createEventStreamHandler(eventBus));
  app.get('/health', healthHandler);
  // Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });
  // Tratamento de erros
  app.use(errorHandler);
  return app;
}