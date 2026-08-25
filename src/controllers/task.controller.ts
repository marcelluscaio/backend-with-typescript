import { Response } from 'express';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { TaskStatus } from '../domain/entities/task.entity';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { UnauthorizedError } from '../utils/app-error';

function requireUserId(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.id;
}

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const task = await this.taskService.create(requireUserId(req), req.body as CreateTaskDto);
    res.status(201).json(task);
  };

  list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const status = req.query.status as TaskStatus | undefined;
    const tasks = await this.taskService.listByOwner(requireUserId(req), status);
    res.status(200).json(tasks);
  };

  getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const task = await this.taskService.getOwnedById(requireUserId(req), req.params.id);
    res.status(200).json(task);
  };

  update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const task = await this.taskService.update(
      requireUserId(req),
      req.params.id,
      req.body as UpdateTaskDto,
    );
    res.status(200).json(task);
  };

  delete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await this.taskService.delete(requireUserId(req), req.params.id);
    res.status(204).send();
  };
}
