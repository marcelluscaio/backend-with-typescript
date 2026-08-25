import { v4 as uuid } from 'uuid';
import { Task, TaskStatus } from '../domain/entities/task.entity';
import { ITaskRepository } from '../repositories/interfaces/task.repository.interface';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { ForbiddenError, NotFoundError } from '../utils/app-error';

/**
 * Business logic for tasks, including the ownership check that turns a
 * plain "task exists" lookup into an authorized "this user may access it".
 */
export class TaskService {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async create(ownerId: string, dto: CreateTaskDto): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: uuid(),
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.PENDING,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      ownerId,
      createdAt: now,
      updatedAt: now,
    };
    return this.taskRepository.create(task);
  }

  async listByOwner(ownerId: string, status?: TaskStatus): Promise<Task[]> {
    const tasks = await this.taskRepository.findByOwner(ownerId);
    return status ? tasks.filter((task) => task.status === status) : tasks;
  }

  async getOwnedById(ownerId: string, id: string): Promise<Task> {
    return this.assertOwnedTask(ownerId, id);
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.assertOwnedTask(ownerId, id);

    const { dueDate, ...rest } = dto;
    const changes: Partial<Task> = { ...rest };
    if (dueDate) {
      changes.dueDate = new Date(dueDate);
    }
    const updated = await this.taskRepository.update(id, changes);
    if (!updated) {
      throw new NotFoundError('Tarefa não encontrada');
    }
    return updated;
  }

  async delete(ownerId: string, id: string): Promise<void> {
    await this.assertOwnedTask(ownerId, id);
    await this.taskRepository.delete(id);
  }

  private async assertOwnedTask(ownerId: string, id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada');
    }
    if (task.ownerId !== ownerId) {
      throw new ForbiddenError('Você não tem permissão para acessar esta tarefa');
    }
    return task;
  }
}
