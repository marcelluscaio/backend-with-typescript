import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { ContainerOverrides, buildContainer } from './container';
import { createApiRouter } from './routes';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { swaggerSpec } from './docs/swagger';

/**
 * Assembles the Express application without binding a port (and without any
 * I/O side effect), so it can be imported directly by supertest in
 * integration tests. Opening the database connection is the bootstrap's job.
 */
export function createApp(overrides: ContainerOverrides = {}): Express {
  const app = express();
  const container = buildContainer(overrides);

  app.use(cors());
  app.use(express.json());
  app.use(loggerMiddleware);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api', createApiRouter(container));

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
