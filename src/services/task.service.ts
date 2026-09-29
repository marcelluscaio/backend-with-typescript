import {
  ChecklistItem,
  NewTask,
  Task,
  TaskFilters,
  TaskPriority,
  TaskStats,
  TaskStatus,
} from '../domain/entities/task.entity';
import { ITaskRepository } from '../repositories/interfaces/task.repository.interface';
import { ChecklistItemDto, CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { ForbiddenError, NotFoundError } from '../utils/app-error';

/** Tags are compared as lowercase so "Estudo" and "estudo" count as one. */
function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function normalizeTags(tags: string[] = []): string[] {
  return Array.from(new Set(tags.map(normalizeTag).filter((tag) => tag.length > 0)));
}

function toChecklist(items: ChecklistItemDto[] = []): ChecklistItem[] {
  const now = new Date();
  return items.map((item) => ({ title: item.title, done: item.done ?? false, createdAt: now }));
}

/**
 * Business logic for tasks, including the ownership check that turns a
 * plain "task exists" lookup into an authorized "this user may access it".
 */
export class TaskService {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async create(ownerId: string, dto: CreateTaskDto): Promise<Task> {
    const task: NewTask = {
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.PENDING,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      tags: normalizeTags(dto.tags),
      checklist: toChecklist(dto.checklist),
      ownerId,
    };
    return this.taskRepository.create(task);
  }

  async listByOwner(ownerId: string, filters: TaskFilters = {}): Promise<Task[]> {
    return this.taskRepository.findByOwner(ownerId, {
      ...filters,
      tag: filters.tag ? normalizeTag(filters.tag) : undefined,
    });
  }

  async statsByOwner(ownerId: string): Promise<TaskStats> {
    return this.taskRepository.statsByOwner(ownerId);
  }

  async getOwnedById(ownerId: string, id: string): Promise<Task> {
    return this.assertOwnedTask(ownerId, id);
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.assertOwnedTask(ownerId, id);

    const { dueDate, tags, checklist, ...rest } = dto;
    const changes: Partial<NewTask> = { ...rest };
    if (dueDate) {
      changes.dueDate = new Date(dueDate);
    }
    if (tags) {
      changes.tags = normalizeTags(tags);
    }
    if (checklist) {
      changes.checklist = toChecklist(checklist);
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
