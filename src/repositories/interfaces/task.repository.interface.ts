import { Task } from '../../domain/entities/task.entity';

export interface ITaskRepository {
  create(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findByOwner(ownerId: string): Promise<Task[]>;
  update(id: string, changes: Partial<Task>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}
