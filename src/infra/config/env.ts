import * as dotenv from 'dotenv';
import { z } from 'zod';

// Carrega variáveis do .env na process.env
dotenv.config();

/**
 * Esquema de validação para as variáveis de ambiente. Utiliza zod para garantir
 * que todas as propriedades obrigatórias estejam presentes e com o tipo correto.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CHATWOOT_URL: z.string().url(),
  CHATWOOT_ACCOUNT_ID: z.coerce.number(),
  CHATWOOT_API_TOKEN: z.string().min(1),
  CHATWOOT_INBOX_ID: z.coerce.number(),   // <== garanta que está assim
  WEBHOOK_SECRET: z.string().optional()
});

type EnvConfig = z.infer<typeof EnvSchema>;

let cachedConfig: EnvConfig | null = null;

/**
 * Valida e retorna as configurações de ambiente. Lança erro se alguma variável
 * obrigatória estiver ausente.
 */
export function getConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Agregamos mensagens de erro para facilitar o debug
    const formatted = parsed.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new Error(`Erro ao carregar variáveis de ambiente: ${formatted}`);
  }
  // Normalizamos accountId e inboxId para número
  const config: EnvConfig = {
    ...parsed.data,
    CHATWOOT_ACCOUNT_ID: Number(parsed.data.CHATWOOT_ACCOUNT_ID),
    CHATWOOT_INBOX_ID: Number(parsed.data.CHATWOOT_INBOX_ID)
  };
  cachedConfig = config;
  return config;
}