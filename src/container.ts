import { InMemoryUserRepository } from './repositories/in-memory/in-memory-user.repository';
import { InMemoryTaskRepository } from './repositories/in-memory/in-memory-task.repository';
import { AuthService } from './services/auth.service';
import { TaskService } from './services/task.service';
import { AuthController } from './controllers/auth.controller';
import { TaskController } from './controllers/task.controller';
import { createAuthMiddleware } from './middlewares/auth.middleware';

/**
 * Composition root: the single place where concrete implementations are
 * wired into the interfaces the services depend on (constructor-based
 * dependency injection). Swapping the in-memory repositories for real
 * database-backed ones only requires changes here.
 */
export function buildContainer() {
  const userRepository = new InMemoryUserRepository();
  const taskRepository = new InMemoryTaskRepository();

  const authService = new AuthService(userRepository);
  const taskService = new TaskService(taskRepository);

  const authController = new AuthController(authService);
  const taskController = new TaskController(taskService);

  const authMiddleware = createAuthMiddleware(authService);

  return {
    userRepository,
    taskRepository,
    authService,
    taskService,
    authController,
    taskController,
    authMiddleware,
  };
}

export type Container = ReturnType<typeof buildContainer>;
