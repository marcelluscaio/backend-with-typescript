import { v4 as uuid } from 'uuid';
import {
  NewTask,
  Task,
  TaskFilters,
  TaskStats,
  TaskStatus,
} from '../../domain/entities/task.entity';
import { ITaskRepository } from '../interfaces/task.repository.interface';

const TOP_TAGS_LIMIT = 5;

/**
 * Reference implementation kept alongside the Mongoose one: it is what the
 * service unit tests run against, and the proof that nothing above the
 * repository boundary depends on a database.
 */
export class InMemoryTaskRepository implements ITaskRepository {
  private readonly tasksById = new Map<string, Task>();

  async create(task: NewTask): Promise<Task> {
    const now = new Date();
    const created: Task = { ...task, id: uuid(), createdAt: now, updatedAt: now };
    this.tasksById.set(created.id, created);
    return created;
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasksById.get(id) ?? null;
  }

  async findByOwner(ownerId: string, filters: TaskFilters = {}): Promise<Task[]> {
    return Array.from(this.tasksById.values())
      .filter((task) => task.ownerId === ownerId)
      .filter((task) => !filters.status || task.status === filters.status)
      .filter((task) => !filters.tag || task.tags.includes(filters.tag))
      .filter(
        (task) =>
          !filters.dueBefore || (task.dueDate !== undefined && task.dueDate <= filters.dueBefore),
      );
  }

  async update(id: string, changes: Partial<NewTask>): Promise<Task | null> {
    const existing = this.tasksById.get(id);
    if (!existing) return null;
    const updated: Task = { ...existing, ...changes, id: existing.id, updatedAt: new Date() };
    this.tasksById.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasksById.delete(id);
  }

  async statsByOwner(ownerId: string): Promise<TaskStats> {
    const tasks = await this.findByOwner(ownerId);
    const now = new Date();

    const statusCounts = new Map<TaskStatus, number>();
    const tagCounts = new Map<string, number>();
    let overdue = 0;

    for (const task of tasks) {
      statusCounts.set(task.status, (statusCounts.get(task.status) ?? 0) + 1);
      for (const tag of task.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
      if (task.status !== TaskStatus.DONE && task.dueDate && task.dueDate < now) {
        overdue += 1;
      }
    }

    return {
      total: tasks.length,
      overdue,
      byStatus: Array.from(statusCounts.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
      topTags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
        .slice(0, TOP_TAGS_LIMIT),
    };
  }
}
