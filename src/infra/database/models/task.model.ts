import { HydratedDocument, Model, Schema, Types, model } from 'mongoose';
import { TaskPriority, TaskStatus } from '../../../domain/entities/task.entity';

export interface ChecklistItemAttrs {
  title: string;
  done: boolean;
  createdAt: Date;
}

export interface TaskAttrs {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  tags: string[];
  checklist: ChecklistItemAttrs[];
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskDocument = HydratedDocument<TaskAttrs>;

// Embedded subdocument: a checklist item has no life of its own and is never
// queried outside its task, so it carries no _id.
const checklistItemSchema = new Schema<ChecklistItemAttrs>(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const taskSchema = new Schema<TaskAttrs>(
  {
    title: { type: String, required: true, trim: true, minlength: 3 },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      required: true,
    },
    dueDate: { type: Date },
    tags: { type: [String], default: [] },
    checklist: { type: [checklistItemSchema], default: [] },
    // Reference instead of embedding: 1:N of high cardinality between two
    // aggregates with independent lifecycles.
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

// Serves "minhas tarefas por status", the most frequent list query.
taskSchema.index({ ownerId: 1, status: 1 });
// Serves agenda queries: due this week, overdue.
taskSchema.index({ ownerId: 1, dueDate: 1 });
// Multikey index over the embedded array, for filtering by tag.
taskSchema.index({ tags: 1 });

export const TaskModel: Model<TaskAttrs> = model<TaskAttrs>('Task', taskSchema);
