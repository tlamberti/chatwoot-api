# API de Integração com Chatwoot

Este projeto implementa uma **API HTTP** em Node.js/TypeScript que integra de forma limpa com o [Chatwoot](https://www.chatwoot.com/). A aplicação segue princípios de **arquitetura limpa** e **SOLID**, separando cada responsabilidade em camadas distintas, além de expor endpoints para receber webhooks, enviar mensagens e consumir eventos via Server‑Sent Events (SSE).

## 🧭 Visão Geral

### Funcionalidades principais

1. **Webhook Chatwoot** (`POST /webhook/chatwoot`)
   - Recebe eventos de mensagens e conversas enviadas pelo Chatwoot.
   - Valida a assinatura se `WEBHOOK_SECRET` estiver configurado.
   - Publica os eventos no *EventBus* interno para que sejam propagados via SSE.

2. **Envio de mensagem** (`POST /chatwoot/messages/send`)
   - Envia mensagens para uma conversa existente ou cria um contato e uma conversa automaticamente caso você forneça apenas dados do contato.
   - Suporta anexos informados como URLs.
   - Valida o payload via [zod](https://zod.dev/).

3. **Escuta em tempo real** (`GET /events/stream`)
   - Disponibiliza um fluxo SSE para que os clientes recebam eventos emitidos pelo *EventBus* (incluindo webhooks) em tempo real.

4. **Healthcheck** (`GET /health`)
   - Retorna o status e a hora atual do servidor.

5. **Documentação OpenAPI** (`GET /docs`)
   - Interface Swagger com detalhes de todos os endpoints.

### Arquitetura de Pastas

```
chatwoot-api/
  ├── src/
  │   ├── application/         # Casos de uso (orquestram a lógica)
  │   │   └── use-cases/
  │   │       └── SendMessageUseCase.ts
  │   ├── domain/              # Entidades e portas (interfaces)
  │   │   ├── entities/
  │   │   │   ├── Contact.ts
  │   │   │   ├── Conversation.ts
  │   │   │   └── Message.ts
  │   │   ├── events/
  │   │   │   └── DomainEvent.ts
  │   │   └── ports/
  │   │       ├── ChatwootGateway.ts
  │   │       └── EventBus.ts
  │   ├── infra/
  │   │   ├── adapters/
  │   │   │   ├── chatwoot/
  │   │   │   │   └── ChatwootHttpGateway.ts
  │   │   │   └── event-bus/
  │   │   │       └── InMemoryEventBus.ts
  │   │   ├── config/
  │   │   │   ├── env.ts
  │   │   │   └── logger.ts
  │   │   └── http/
  │   │       ├── controllers/
  │   │       │   ├── EventStreamController.ts
  │   │       │   ├── HealthController.ts
  │   │       │   ├── MessageController.ts
  │   │       │   └── WebhookController.ts
  │   │       ├── middlewares/
  │   │       │   ├── errorHandler.ts
  │   │       │   └── rateLimiter.ts
  │   │       ├── validators/
  │   │       │   └── SendMessageDTO.ts
  │   │       ├── server.ts      # Configuração e rotas do Express
  │   │       └── docs/
  │   │           └── openapi.json
  │   └── main.ts               # Ponto de entrada da aplicação
  ├── tests/                    # Testes unitários e de integração (Jest + Supertest)
  │   ├── unit/
  │   │   └── sendMessageUseCase.test.ts
  │   └── integration/
  │       ├── messageRoute.test.ts
  │       └── webhookRoute.test.ts
  ├── Dockerfile                # Construção do container
  ├── docker-compose.yml        # Orquestração para executar localmente
  ├── jest.config.js            # Configurações do Jest
  ├── tsconfig.json             # Configurações do TypeScript
  ├── package.json              # Dependências e scripts
  ├── .env.example              # Exemplo de variáveis de ambiente
  └── README.md                 # Este documento
```

## 🚀 Executando localmente

### Pré‑requisitos

- Node.js 18+
- npm 8+

### Passos

1. Clone este repositório e acesse a pasta `chatwoot-api`.
2. Copie o arquivo `.env.example` para `.env` e edite os valores com suas credenciais do Chatwoot.

   ```bash
   cp .env.example .env
   # edite PORT, CHATWOOT_* etc.
   ```
3. Instale as dependências:

   ```bash
   npm install
   ```

4. Inicie a aplicação em modo desenvolvimento (hot reload com [tsx](https://github.com/esbuild-kit/tsx)):

   ```bash
   npm run dev
   ```

5. Acesse `http://localhost:4000/health` para verificar se o serviço está funcionando.
6. Acesse a documentação Swagger em `http://localhost:4000/docs`.

### Rodando com Docker

1. Ajuste as variáveis em `.env` conforme sua necessidade.
2. Execute o Compose:

   ```bash
   docker compose up -d --build
   ```

   Isso irá construir a imagem, instalar dependências e expor a porta 4000 no host.

### Configurando o Webhook no Chatwoot

1. No painel do Chatwoot, acesse **Configurações → Integrações → Webhooks**.
2. Crie um novo webhook e informe a URL pública (ex.: `https://seu-dominio.com/webhook/chatwoot`).
3. (Opcional) Defina um segredo de assinatura e configure o mesmo valor em `WEBHOOK_SECRET` no seu `.env`.

## 📬 Exemplos de uso

### Enviar uma nova mensagem

```bash
curl -X POST http://localhost:4000/chatwoot/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {"name": "Maria", "email": "maria@example.com"},
    "content": "Olá! Como posso ajudar?"
  }'
```

Resposta esperada:

```json
{
  "conversationId": 10,
  "messageId": 100,
  "content": "Olá! Como posso ajudar?",
  "sentAt": "2025-08-16T12:34:56.789Z"
}
```

### Assinar o fluxo SSE de eventos

Você pode usar `curl` para manter uma conexão aberta:

```bash
curl -H "Accept: text/event-stream" http://localhost:4000/events/stream
```

A cada mensagem recebida via webhook, você verá saídas no formato:

```
event: message.created
data: {"event":"message.created","data":{...}}

```

## 🧪 Testes

O projeto possui testes unitários e de integração escritos com **Jest** e **Supertest**. Para executá‑los, rode:

```bash
npm test
```

Um relatório de cobertura será gerado em `coverage/` e o projeto exige pelo menos **80% de cobertura** global.

## 🛠️ Como estender

- **Persistência**: substitua o `InMemoryEventBus` por uma implementação baseada em RabbitMQ/Kafka para escalabilidade.
- **Reutilizar conversas**: adapte o `ensureConversation` para verificar conversas abertas do contato usando `GET /api/v1/accounts/{account_id}/contacts/{id}/conversations`.
- **Novos canais**: adicione novas ferramentas implementando a interface `ChatwootGateway` para outros canais externos.

## 📑 Referências

- Criação de contato: `POST /api/v1/accounts/{account_id}/contacts` — [Chatwoot docs]【111684053471022†L137-L154】.
- Criação de conversa: `POST /api/v1/accounts/{account_id}/conversations` com `source_id`, `inbox_id` e `contact_id`【905327540285952†L144-L167】.
- Envio de mensagem: `POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages` com `content` e `message_type`【514401765224264†L190-L204】.

## ✅ Checklist de validação

Para validar a entrega:

1. Copie `.env.example` para `.env` e configure suas variáveis.
2. Rode `docker compose up -d --build` e acesse `http://localhost:4000/health` — deve retornar `{"status":"ok", ...}`.
3. Acesse `http://localhost:4000/docs` — a documentação Swagger deve carregar.
4. Envie uma requisição `POST /chatwoot/messages/send` com dados válidos — verifique se a mensagem aparece na inbox do Chatwoot.
5. Conecte‑se ao endpoint `GET /events/stream` e dispare uma mensagem no Chatwoot para ver o evento em tempo real.
6. Execute `npm test` e confirme que a cobertura está acima de 80%.

Ficou com dúvidas ou quer incrementar algo? Sinta‑se livre para abrir issues ou PRs. 😊