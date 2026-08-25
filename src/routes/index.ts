import { Router } from 'express';
import { Container } from '../container';
import { createAuthRouter } from './auth.routes';
import { createTaskRouter } from './task.routes';

export function createApiRouter(container: Container): Router {
  const router = Router();
  router.use('/auth', createAuthRouter(container));
  router.use('/tasks', createTaskRouter(container));
  return router;
}
