import { Types } from 'mongoose';
import { MongooseTaskRepository } from '../../../src/repositories/mongoose/mongoose-task.repository';
import { NewTask, TaskPriority, TaskStatus } from '../../../src/domain/entities/task.entity';
import { ValidationAppError } from '../../../src/utils/app-error';

const OWNER_ID = new Types.ObjectId().toString();
const OTHER_OWNER_ID = new Types.ObjectId().toString();

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function buildTask(overrides: Partial<NewTask> = {}): NewTask {
  return {
    title: 'Sample task',
    description: undefined,
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: undefined,
    tags: [],
    checklist: [],
    ownerId: OWNER_ID,
    ...overrides,
  };
}

describe('MongooseTaskRepository', () => {
  const repository = new MongooseTaskRepository();

  it('creates a task and maps the document to the domain entity', async () => {
    const created = await repository.create(
      buildTask({
        title: 'Estudar Mongoose',
        tags: ['estudo'],
        checklist: [{ title: 'Ler docs', done: false, createdAt: new Date() }],
      }),
    );

    expect(created.id).toEqual(expect.any(String));
    expect(Types.ObjectId.isValid(created.id)).toBe(true);
    expect(created).not.toHaveProperty('_id');
    expect(created).not.toHaveProperty('__v');
    expect(created.ownerId).toBe(OWNER_ID);
    expect(created.priority).toBe(TaskPriority.MEDIUM);
    expect(created.tags).toEqual(['estudo']);
    expect(created.checklist).toEqual([
      { title: 'Ler docs', done: false, createdAt: expect.any(Date) },
    ]);
  });

  it('finds a task by id', async () => {
    const created = await repository.create(buildTask());

    const found = await repository.findById(created.id);

    expect(found?.id).toBe(created.id);
    expect(found?.title).toBe(created.title);
  });

  it('returns null for a missing id and for a malformed ObjectId', async () => {
    await expect(repository.findById(new Types.ObjectId().toString())).resolves.toBeNull();
    await expect(repository.findById('nao-e-um-object-id')).resolves.toBeNull();
  });

  it('lists only the tasks of the given owner', async () => {
    await repository.create(buildTask({ title: 'Minha tarefa' }));
    await repository.create(buildTask({ title: 'De outro dono', ownerId: OTHER_OWNER_ID }));

    const tasks = await repository.findByOwner(OWNER_ID);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Minha tarefa');
  });

  it('filters the listing by status', async () => {
    await repository.create(buildTask({ title: 'Concluida', status: TaskStatus.DONE }));
    await repository.create(buildTask({ title: 'Pendente' }));

    const tasks = await repository.findByOwner(OWNER_ID, { status: TaskStatus.DONE });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Concluida');
  });

  it('filters the listing by tag', async () => {
    await repository.create(buildTask({ title: 'Com tag', tags: ['estudo', 'backend'] }));
    await repository.create(buildTask({ title: 'Sem tag' }));

    const tasks = await repository.findByOwner(OWNER_ID, { tag: 'backend' });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Com tag');
  });

  it('filters the listing by due date', async () => {
    await repository.create(buildTask({ title: 'Vence logo', dueDate: daysFromNow(2) }));
    await repository.create(buildTask({ title: 'Vence tarde', dueDate: daysFromNow(30) }));
    await repository.create(buildTask({ title: 'Sem prazo' }));

    const tasks = await repository.findByOwner(OWNER_ID, { dueBefore: daysFromNow(7) });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Vence logo');
  });

  it('returns an empty list when the owner id is malformed', async () => {
    await expect(repository.findByOwner('nao-e-um-object-id')).resolves.toEqual([]);
  });

  it('applies a partial update without touching the other fields', async () => {
    const created = await repository.create(
      buildTask({ title: 'Original', description: 'Uma descricao', tags: ['estudo'] }),
    );

    const updated = await repository.update(created.id, { status: TaskStatus.DONE });

    expect(updated?.status).toBe(TaskStatus.DONE);
    expect(updated?.title).toBe('Original');
    expect(updated?.description).toBe('Uma descricao');
    expect(updated?.tags).toEqual(['estudo']);
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it('replaces the embedded checklist on update', async () => {
    const created = await repository.create(
      buildTask({ checklist: [{ title: 'Item antigo', done: false, createdAt: new Date() }] }),
    );

    const updated = await repository.update(created.id, {
      checklist: [{ title: 'Item novo', done: true, createdAt: new Date() }],
    });

    expect(updated?.checklist).toEqual([
      { title: 'Item novo', done: true, createdAt: expect.any(Date) },
    ]);
  });

  it('returns null when updating a missing or malformed id', async () => {
    await expect(
      repository.update(new Types.ObjectId().toString(), { title: 'Qualquer titulo' }),
    ).resolves.toBeNull();
    await expect(repository.update('nao-e-um-object-id', { title: 'Nada' })).resolves.toBeNull();
  });

  it('translates a schema violation into a validation error', async () => {
    const created = await repository.create(buildTask());

    await expect(repository.update(created.id, { title: 'ab' })).rejects.toBeInstanceOf(
      ValidationAppError,
    );
  });

  it('deletes a task and reports whether anything was removed', async () => {
    const created = await repository.create(buildTask());

    await expect(repository.delete(created.id)).resolves.toBe(true);
    await expect(repository.delete(created.id)).resolves.toBe(false);
    await expect(repository.delete('nao-e-um-object-id')).resolves.toBe(false);
  });

  it('aggregates stats by status, overdue count and top tags', async () => {
    await repository.create(buildTask({ tags: ['estudo', 'backend'], dueDate: daysFromNow(-2) }));
    await repository.create(buildTask({ status: TaskStatus.IN_PROGRESS, tags: ['estudo'] }));
    await repository.create(
      buildTask({ status: TaskStatus.DONE, tags: ['estudo'], dueDate: daysFromNow(-10) }),
    );
    await repository.create(buildTask({ ownerId: OTHER_OWNER_ID, tags: ['ignorada'] }));

    const stats = await repository.statsByOwner(OWNER_ID);

    expect(stats.total).toBe(3);
    // The overdue task that is already DONE must not be counted.
    expect(stats.overdue).toBe(1);
    expect(stats.byStatus).toEqual(
      expect.arrayContaining([
        { status: TaskStatus.PENDING, count: 1 },
        { status: TaskStatus.IN_PROGRESS, count: 1 },
        { status: TaskStatus.DONE, count: 1 },
      ]),
    );
    expect(stats.topTags[0]).toEqual({ tag: 'estudo', count: 3 });
    expect(stats.topTags).toContainEqual({ tag: 'backend', count: 1 });
    expect(stats.topTags.map((entry) => entry.tag)).not.toContain('ignorada');
  });

  it('returns empty stats for an owner without tasks', async () => {
    const stats = await repository.statsByOwner(new Types.ObjectId().toString());

    expect(stats).toEqual({ total: 0, overdue: 0, byStatus: [], topTags: [] });
  });
});
