import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryTaskRepository } from '../../src/repositories/in-memory/in-memory-task.repository';
import { InMemoryUserRepository } from '../../src/repositories/in-memory/in-memory-user.repository';

/**
 * Inversion of control, end to end: the exact same HTTP surface is served
 * when the composition root is handed the in-memory repositories instead of
 * the Mongoose ones. Nothing above the repository boundary changes.
 */
describe('API served by the in-memory repositories', () => {
  function buildInMemoryApp() {
    return createApp({
      userRepository: new InMemoryUserRepository(),
      taskRepository: new InMemoryTaskRepository(),
    });
  }

  it('runs the full task lifecycle without a database', async () => {
    const app = buildInMemoryApp();

    const registered = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });
    expect(registered.status).toBe(201);
    const token = registered.body.token as string;

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Estudar TypeScript', tags: ['Estudo'] });
    expect(created.status).toBe(201);
    expect(created.body.tags).toEqual(['estudo']);

    const listed = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
    expect(listed.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE' });
    expect(updated.body.status).toBe('DONE');

    const stats = await request(app)
      .get('/api/tasks/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(stats.body).toMatchObject({
      total: 1,
      overdue: 0,
      byStatus: [{ status: 'DONE', count: 1 }],
      topTags: [{ tag: 'estudo', count: 1 }],
    });

    const deleted = await request(app)
      .delete(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const afterDelete = await request(app)
      .get(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(afterDelete.status).toBe(404);
  });

  it('still answers 409 on a duplicate e-mail', async () => {
    const app = buildInMemoryApp();
    const user = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };

    await request(app).post('/api/auth/register').send(user);
    const response = await request(app).post('/api/auth/register').send(user);

    expect(response.status).toBe(409);
  });
});
