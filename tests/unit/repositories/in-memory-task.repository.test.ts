import { InMemoryTaskRepository } from '../../../src/repositories/in-memory/in-memory-task.repository';
import { NewTask, TaskPriority, TaskStatus } from '../../../src/domain/entities/task.entity';

function buildTask(overrides: Partial<NewTask> = {}): NewTask {
  return {
    title: 'Sample task',
    description: undefined,
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: undefined,
    tags: [],
    checklist: [],
    ownerId: 'owner-1',
    ...overrides,
  };
}

describe('InMemoryTaskRepository', () => {
  it('creates a task with a generated id and finds it back', async () => {
    const repository = new InMemoryTaskRepository();

    const created = await repository.create(buildTask());

    expect(created.id).toEqual(expect.any(String));
    await expect(repository.findById(created.id)).resolves.toEqual(created);
  });

  it('returns null when finding a missing task', async () => {
    const repository = new InMemoryTaskRepository();

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('finds tasks scoped to a single owner', async () => {
    const repository = new InMemoryTaskRepository();
    const mine = await repository.create(buildTask({ ownerId: 'owner-1' }));
    await repository.create(buildTask({ ownerId: 'owner-2' }));

    const tasks = await repository.findByOwner('owner-1');

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(mine.id);
  });

  it('filters by status, tag and due date', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.create(buildTask({ title: 'A', status: TaskStatus.DONE, tags: ['estudo'] }));
    await repository.create(
      buildTask({ title: 'B', tags: ['trabalho'], dueDate: new Date('2030-01-01') }),
    );

    await expect(repository.findByOwner('owner-1', { status: TaskStatus.DONE })).resolves.toEqual([
      expect.objectContaining({ title: 'A' }),
    ]);
    await expect(repository.findByOwner('owner-1', { tag: 'trabalho' })).resolves.toEqual([
      expect.objectContaining({ title: 'B' }),
    ]);
    await expect(
      repository.findByOwner('owner-1', { dueBefore: new Date('2030-06-01') }),
    ).resolves.toEqual([expect.objectContaining({ title: 'B' })]);
  });

  it('updates an existing task and bumps updatedAt', async () => {
    const repository = new InMemoryTaskRepository();
    const task = await repository.create(buildTask());

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
    const task = await repository.create(buildTask());

    await expect(repository.delete(task.id)).resolves.toBe(true);
    await expect(repository.delete(task.id)).resolves.toBe(false);
  });

  it('summarizes tasks by status, overdue count and top tags', async () => {
    const repository = new InMemoryTaskRepository();
    await repository.create(buildTask({ tags: ['estudo'], dueDate: new Date('2020-01-01') }));
    await repository.create(buildTask({ status: TaskStatus.DONE, tags: ['estudo', 'casa'] }));
    await repository.create(buildTask({ ownerId: 'owner-2', tags: ['ignorada'] }));

    const stats = await repository.statsByOwner('owner-1');

    expect(stats.total).toBe(2);
    expect(stats.overdue).toBe(1);
    expect(stats.byStatus).toEqual(
      expect.arrayContaining([
        { status: TaskStatus.PENDING, count: 1 },
        { status: TaskStatus.DONE, count: 1 },
      ]),
    );
    expect(stats.topTags[0]).toEqual({ tag: 'estudo', count: 2 });
    expect(stats.topTags.map((entry) => entry.tag)).not.toContain('ignorada');
  });
});
