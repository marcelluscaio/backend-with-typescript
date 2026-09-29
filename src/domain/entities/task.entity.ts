export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface ChecklistItem {
  title: string;
  done: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  tags: string[];
  checklist: ChecklistItem[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shape handed to the repository on creation: identity and timestamps are
 * owned by the persistence layer, not by the service.
 */
export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export interface TaskFilters {
  status?: TaskStatus;
  tag?: string;
  dueBefore?: Date;
}

export interface TaskStatusCount {
  status: TaskStatus;
  count: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface TaskStats {
  total: number;
  overdue: number;
  byStatus: TaskStatusCount[];
  topTags: TagCount[];
}
