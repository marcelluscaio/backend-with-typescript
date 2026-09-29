import { NewTask, Task, TaskFilters, TaskStats } from '../../domain/entities/task.entity';

export interface ITaskRepository {
  create(task: NewTask): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findByOwner(ownerId: string, filters?: TaskFilters): Promise<Task[]>;
  update(id: string, changes: Partial<NewTask>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  statsByOwner(ownerId: string): Promise<TaskStats>;
}
