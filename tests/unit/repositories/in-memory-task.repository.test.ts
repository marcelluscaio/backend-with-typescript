import { InMemoryTaskRepository } from '../../../src/repositories/in-memory/in-memory-task.repository';
import { Task, TaskStatus } from '../../../src/domain/entities/task.entity';

function buildTask(overrides: Partial<Task> = {}): Task {
  const now = new Date();
  return {
    id: overrides.id ?? 'task-1',
    title: overrides.title ?? 'Sample task',
    description: overrides.description,
    status: overrides.status ?? TaskStatus.PENDING,
    dueDate: overrides.dueDate,
    ownerId: overrides.ownerId ?? 'owner-1',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe('InMemoryTaskRepository', () => {
  it('creates and finds a task by id', async () => {
    const repository = new InMemoryTaskRepository();
    const task = buildTask();

    await repository.create(task);

    await expect(repository.findById(task.id)).resolves.toEqual(task);
  });

  it('returns null when finding a missing task', async () => {
    const repository = new InMemoryTaskRepository();

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('finds tasks scoped to a single owner', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.create(buildTask({ id: 'a', ownerId: 'owner-1' }));
    await repository.create(buildTask({ id: 'b', ownerId: 'owner-2' }));

    const tasks = await repository.findByOwner('owner-1');

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('a');
  });

  it('updates an existing task and bumps updatedAt', async () => {
    const repository = new InMemoryTaskRepository();
    const task = buildTask();
    await repository.create(task);

    const updated = await repository.update(task.id, { title: 'New title' });

    expect(updated?.title).toBe('New title');
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(task.updatedAt.getTime());
  });

  it('returns null when updating a missing task', async () => {
    const repository = new InMemoryTaskRepository();

    await expect(repository.update('missing', { title: 'x' })).resolves.toBeNull();
  });

  it('deletes an existing task and reports the outcome', async () => {
    const repository = new InMemoryTaskRepository();
    const task = buildTask();
    await repository.create(task);

    await expect(repository.delete(task.id)).resolves.toBe(true);
    await expect(repository.delete(task.id)).resolves.toBe(false);
  });
});
