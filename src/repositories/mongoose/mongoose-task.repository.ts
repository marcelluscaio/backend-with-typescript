import { FilterQuery, Types } from 'mongoose';
import {
  NewTask,
  TagCount,
  Task,
  TaskFilters,
  TaskStats,
  TaskStatus,
  TaskStatusCount,
} from '../../domain/entities/task.entity';
import { TaskAttrs, TaskModel } from '../../infra/database/models/task.model';
import { NotFoundError } from '../../utils/app-error';
import { ITaskRepository } from '../interfaces/task.repository.interface';
import { toDomain, toPersistence, toPersistenceUpdate } from './mappers/task.mapper';
import { rethrowAsAppError } from './mongo-error';

const TOP_TAGS_LIMIT = 5;

interface CountBucket {
  value: number;
}

interface StatsFacet {
  total: CountBucket[];
  overdue: CountBucket[];
  byStatus: TaskStatusCount[];
  topTags: TagCount[];
}

function firstCount(bucket: CountBucket[]): number {
  return bucket[0]?.value ?? 0;
}

export class MongooseTaskRepository implements ITaskRepository {
  async create(task: NewTask): Promise<Task> {
    if (!Types.ObjectId.isValid(task.ownerId)) {
      throw new NotFoundError('Usuário não encontrado');
    }

    try {
      const doc = new TaskModel(toPersistence(task));
      await doc.save();
      return toDomain(doc);
    } catch (error) {
      return rethrowAsAppError(error);
    }
  }

  async findById(id: string): Promise<Task | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await TaskModel.findById(id);
    return doc ? toDomain(doc) : null;
  }

  async findByOwner(ownerId: string, filters: TaskFilters = {}): Promise<Task[]> {
    if (!Types.ObjectId.isValid(ownerId)) {
      return [];
    }

    const query: FilterQuery<TaskAttrs> = { ownerId: new Types.ObjectId(ownerId) };
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.tag) {
      // Multikey index: matching a scalar against an array field matches any element.
      query.tags = filters.tag;
    }
    if (filters.dueBefore) {
      query.dueDate = { $lte: filters.dueBefore };
    }

    const docs = await TaskModel.find(query).sort({ createdAt: -1 }).exec();
    return docs.map(toDomain);
  }

  async update(id: string, changes: Partial<NewTask>): Promise<Task | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    try {
      const doc = await TaskModel.findByIdAndUpdate(
        id,
        { $set: toPersistenceUpdate(changes) },
        { new: true, runValidators: true },
      );
      return doc ? toDomain(doc) : null;
    } catch (error) {
      return rethrowAsAppError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const doc = await TaskModel.findByIdAndDelete(id);
    return doc !== null;
  }

  /**
   * Single round trip answering the dashboard questions: totals, overdue
   * count, distribution per status and the most used tags.
   */
  async statsByOwner(ownerId: string): Promise<TaskStats> {
    if (!Types.ObjectId.isValid(ownerId)) {
      return { total: 0, overdue: 0, byStatus: [], topTags: [] };
    }

    const now = new Date();
    const [facet] = await TaskModel.aggregate<StatsFacet>([
      { $match: { ownerId: new Types.ObjectId(ownerId) } },
      {
        $facet: {
          total: [{ $count: 'value' }],
          overdue: [
            { $match: { status: { $ne: TaskStatus.DONE }, dueDate: { $lt: now } } },
            { $count: 'value' },
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $project: { _id: 0, status: '$_id', count: 1 } },
          ],
          topTags: [
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: TOP_TAGS_LIMIT },
            { $project: { _id: 0, tag: '$_id', count: 1 } },
          ],
        },
      },
    ]);

    return {
      total: firstCount(facet.total),
      overdue: firstCount(facet.overdue),
      byStatus: facet.byStatus,
      topTags: facet.topTags,
    };
  }
}
