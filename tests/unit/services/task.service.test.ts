import { TaskService } from '../../../src/services/task.service';
import { InMemoryTaskRepository } from '../../../src/repositories/in-memory/in-memory-task.repository';
import { TaskPriority, TaskStatus } from '../../../src/domain/entities/task.entity';
import { ForbiddenError } from '../../../src/utils/app-error';

describe('TaskService', () => {
  // Wired against the in-memory repository: the service only knows the
  // interface, so no database is needed to exercise the business rules.
  function setup() {
    const repository = new InMemoryTaskRepository();
    const service = new TaskService(repository);
    return { repository, service };
  }

  it('creates a task owned by the given user with the default priority', async () => {
    const { service } = setup();

    const task = await service.create('user-1', { title: 'Estudar TypeScript' });

    expect(task).toMatchObject({
      title: 'Estudar TypeScript',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      ownerId: 'user-1',
      tags: [],
      checklist: [],
    });
  });

  it('normalizes tags and stamps the checklist items', async () => {
    const { service } = setup();

    const task = await service.create('user-1', {
      title: 'Estudar TypeScript',
      tags: ['Estudo', ' estudo ', 'Backend'],
      checklist: [{ title: 'Ler o capitulo 1' }, { title: 'Fazer o exercicio', done: true }],
    });

    expect(task.tags).toEqual(['estudo', 'backend']);
    expect(task.checklist).toEqual([
      { title: 'Ler o capitulo 1', done: false, createdAt: expect.any(Date) },
      { title: 'Fazer o exercicio', done: true, createdAt: expect.any(Date) },
    ]);
  });

  it('lists only the tasks owned by the requesting user', async () => {
    const { service } = setup();
    await service.create('user-1', { title: 'Task A' });
    await service.create('user-2', { title: 'Task B' });

    const tasks = await service.listByOwner('user-1');

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task A');
  });

  it('filters listed tasks by status', async () => {
    const { service } = setup();
    await service.create('user-1', { title: 'Task A', status: TaskStatus.DONE });
    await service.create('user-1', { title: 'Task B', status: TaskStatus.PENDING });

    const tasks = await service.listByOwner('user-1', { status: TaskStatus.DONE });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task A');
  });

  it('filters listed tasks by tag, ignoring the casing used in the query', async () => {
    const { service } = setup();
    await service.create('user-1', { title: 'Task A', tags: ['Estudo'] });
    await service.create('user-1', { title: 'Task B', tags: ['trabalho'] });

    const tasks = await service.listByOwner('user-1', { tag: 'ESTUDO' });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task A');
  });

  it('updates a task owned by the requesting user', async () => {
    const { service } = setup();
    const task = await service.create('user-1', { title: 'Task A' });

    const updated = await service.update('user-1', task.id, { status: TaskStatus.DONE });

    expect(updated.status).toBe(TaskStatus.DONE);
    expect(updated.title).toBe('Task A');
  });

  it('does not let a user update another user task', async () => {
    const { service } = setup();
    const task = await service.create('user-1', { title: 'Task A' });

    await expect(
      service.update('user-2', task.id, { status: TaskStatus.DONE }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('deletes a task owned by the requesting user', async () => {
    const { service, repository } = setup();
    const task = await service.create('user-1', { title: 'Task A' });

    await service.delete('user-1', task.id);

    await expect(repository.findById(task.id)).resolves.toBeNull();
  });

  it('does not let a user delete another user task', async () => {
    const { service } = setup();
    const task = await service.create('user-1', { title: 'Task A' });

    await expect(service.delete('user-2', task.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('summarizes the tasks of the requesting user', async () => {
    const { service } = setup();
    await service.create('user-1', { title: 'Task A', tags: ['estudo'] });
    await service.create('user-1', { title: 'Task B', status: TaskStatus.DONE, tags: ['estudo'] });
    await service.create('user-2', { title: 'Task C', tags: ['outra'] });

    const stats = await service.statsByOwner('user-1');

    expect(stats.total).toBe(2);
    expect(stats.topTags).toEqual([{ tag: 'estudo', count: 2 }]);
  });
});
