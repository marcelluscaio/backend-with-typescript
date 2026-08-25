import { Task } from '../../domain/entities/task.entity';
import { ITaskRepository } from '../interfaces/task.repository.interface';

export class InMemoryTaskRepository implements ITaskRepository {
  private readonly tasksById = new Map<string, Task>();

  async create(task: Task): Promise<Task> {
    this.tasksById.set(task.id, task);
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasksById.get(id) ?? null;
  }

  async findByOwner(ownerId: string): Promise<Task[]> {
    return Array.from(this.tasksById.values()).filter((task) => task.ownerId === ownerId);
  }

  async update(id: string, changes: Partial<Task>): Promise<Task | null> {
    const existing = this.tasksById.get(id);
    if (!existing) return null;
    const updated: Task = { ...existing, ...changes, id: existing.id, updatedAt: new Date() };
    this.tasksById.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasksById.delete(id);
  }
}
