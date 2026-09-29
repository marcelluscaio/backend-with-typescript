import { Response } from 'express';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { TaskFilters, TaskStatus } from '../domain/entities/task.entity';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { UnauthorizedError, ValidationAppError } from '../utils/app-error';

function requireUserId(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.id;
}

function readQueryParam(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Turns the query string into the domain filter the service understands. */
function parseFilters(req: AuthenticatedRequest): TaskFilters {
  const filters: TaskFilters = {};

  const status = readQueryParam(req.query.status);
  if (status) {
    if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
      throw new ValidationAppError({
        status: [`status deve ser um de: ${Object.values(TaskStatus).join(', ')}`],
      });
    }
    filters.status = status as TaskStatus;
  }

  const tag = readQueryParam(req.query.tag);
  if (tag) {
    filters.tag = tag;
  }

  const dueBefore = readQueryParam(req.query.dueBefore);
  if (dueBefore) {
    const parsed = new Date(dueBefore);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationAppError({ dueBefore: ['dueBefore deve ser uma data ISO 8601 válida'] });
    }
    filters.dueBefore = parsed;
  }

  return filters;
}

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const task = await this.taskService.create(requireUserId(req), req.body as CreateTaskDto);
    res.status(201).json(task);
  };

  list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const tasks = await this.taskService.listByOwner(requireUserId(req), parseFilters(req));
    res.status(200).json(tasks);
  };

  stats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const stats = await this.taskService.statsByOwner(requireUserId(req));
    res.status(200).json(stats);
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
