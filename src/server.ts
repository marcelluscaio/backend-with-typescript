import { createApp } from './app';
import { env } from './config/env';
import { logger } from './services/logger.service';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Servidor iniciado em http://localhost:${env.port}`);
  logger.info(`Documentação disponível em http://localhost:${env.port}/api-docs`);
});
