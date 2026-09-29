import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './infra/database/mongoose-connection';
import { logger } from './services/logger.service';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`Servidor iniciado em http://localhost:${env.port}`);
    logger.info(`Documentação disponível em http://localhost:${env.port}/api-docs`);
  });

  // Graceful shutdown: stop accepting requests, then close the database.
  const shutdown = (signal: string): void => {
    logger.info(`Sinal ${signal} recebido, encerrando o servidor`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error: Error) => {
  logger.error('Falha ao iniciar o servidor', { message: error.message, stack: error.stack });
  process.exit(1);
});
