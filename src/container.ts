import { IUserRepository } from './repositories/interfaces/user.repository.interface';
import { ITaskRepository } from './repositories/interfaces/task.repository.interface';
import { MongooseUserRepository } from './repositories/mongoose/mongoose-user.repository';
import { MongooseTaskRepository } from './repositories/mongoose/mongoose-task.repository';
import { AuthService } from './services/auth.service';
import { TaskService } from './services/task.service';
import { AuthController } from './controllers/auth.controller';
import { TaskController } from './controllers/task.controller';
import { createAuthMiddleware } from './middlewares/auth.middleware';

export interface ContainerOverrides {
  userRepository?: IUserRepository;
  taskRepository?: ITaskRepository;
}

/**
 * Composition root: the single place where concrete implementations are
 * wired into the interfaces the services depend on (constructor-based
 * dependency injection). Swapping MongoDB for the in-memory repositories —
 * or for any other store — only requires changes here.
 */
export function buildContainer(overrides: ContainerOverrides = {}) {
  const userRepository = overrides.userRepository ?? new MongooseUserRepository();
  const taskRepository = overrides.taskRepository ?? new MongooseTaskRepository();

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
