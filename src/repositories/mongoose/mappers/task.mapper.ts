import { Types } from 'mongoose';
import { NewTask, Task } from '../../../domain/entities/task.entity';
import { TaskAttrs, TaskDocument } from '../../../infra/database/models/task.model';

type TaskPersistence = Omit<TaskAttrs, 'createdAt' | 'updatedAt'>;

/**
 * Translates between the persistence document and the domain entity: the
 * service only ever sees `id: string`, never `_id`, `__v` or an ObjectId.
 */
export function toDomain(doc: TaskDocument): Task {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description ?? undefined,
    status: doc.status,
    priority: doc.priority,
    dueDate: doc.dueDate ?? undefined,
    tags: [...doc.tags],
    checklist: doc.checklist.map((item) => ({
      title: item.title,
      done: item.done,
      createdAt: item.createdAt,
    })),
    ownerId: doc.ownerId.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toPersistence(task: NewTask): TaskPersistence {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    tags: task.tags,
    checklist: task.checklist,
    ownerId: new Types.ObjectId(task.ownerId),
  };
}

/**
 * Partial counterpart used by updates: only the keys actually present in the
 * payload reach the `$set`, so a PUT never wipes untouched fields.
 */
export function toPersistenceUpdate(changes: Partial<NewTask>): Partial<TaskPersistence> {
  const update: Partial<TaskPersistence> = {};

  if (changes.title !== undefined) update.title = changes.title;
  if (changes.description !== undefined) update.description = changes.description;
  if (changes.status !== undefined) update.status = changes.status;
  if (changes.priority !== undefined) update.priority = changes.priority;
  if (changes.dueDate !== undefined) update.dueDate = changes.dueDate;
  if (changes.tags !== undefined) update.tags = changes.tags;
  if (changes.checklist !== undefined) update.checklist = changes.checklist;
  if (changes.ownerId !== undefined) update.ownerId = new Types.ObjectId(changes.ownerId);

  return update;
}
