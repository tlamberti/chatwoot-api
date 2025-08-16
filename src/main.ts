import { buildServer } from './infra/http/server';
import { getConfig } from './infra/config/env';
import { logger } from './infra/config/logger';

const config = getConfig();
const app = buildServer();
const port = config.PORT || 4000;

app.listen(port, () => {
  logger.info(`Servidor iniciado na porta ${port}`);
});