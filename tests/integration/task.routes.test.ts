import { Types } from 'mongoose';
import request from 'supertest';
import { buildTestApp, registerAndLogin } from '../helpers/test-app';

describe('Task routes', () => {
  it('rejects listing tasks without a token', async () => {
    const app = buildTestApp();

    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(401);
  });

  it('rejects requests with a malformed token', async () => {
    const app = buildTestApp();

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
  });

  it('creates and lists a task for the authenticated user', async () => {
    const app = buildTestApp();
    const { token } = await registerAndLogin(app);

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Estudar TypeScript' });

    expect(created.status).toBe(201);
    expect(created.body.title).toBe('Estudar TypeScript');
    expect(created.body.status).toBe('PENDING');
    expect(created.body.priority).toBe('MEDIUM');

    const listed = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);

    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
  });

  it('exposes id and hides the mongo internals in the response body', async () => {
    const app = buildTestApp();
    const { token } = await registerAndLogin(app);

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Estudar TypeScript' });

    expect(created.body.id).toEqual(expect.any(String));
    expect(created.body).not.toHaveProperty('_id');
    expect(created.body).not.toHaveProperty('__v');
  });

  it('rejects creating a task with an invalid body', async () => {
    const app = buildTestApp();
    const { token } = await registerAndLogin(app);

    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'ab' });

    expect(response.status).toBe(400);
  });

  it('gets a single task by id', async () => {
    const app = buildTestApp();
    const { token } = await registerAndLogin(app);
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Estudar TypeScript' });

    const response = await request(app)
      .get(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
  });

  it('returns 404 for a task that does not exist', async () => {
    const app = buildTestApp();
    const { token } = await registerAndLogin(app);

    const response = await request(app)
      .get(`/api/tasks/${new Types.ObjectId().toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('returns 404, not 500, for an id that is not a valid ObjectId', async () => {
    const app = buildTestApp();
    const { token } = await registerAndLogin(app);

    const response = await request(app)
      .get('/api/tasks/does-not-exist')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Tarefa não encontrada');
  });

  it('returns 403 when accessing another user task', async () => {
    const app = buildTestApp();
    const owner = await registerAndLogin(app, { email: 'owner@example.com' });
    const intruder = await registerAndLogin(app, { email: 'intruder@example.com' });

    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Private task' });

    const response = await request(app)
      .get(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${intruder.token}`);

    expect(response.status).toBe(403);
  });

  it('updates a task owned by the authenticated user', async () => {
    const app = buildTestApp();
    const { token } = await registerAndLogin(app);
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Estudar TypeScript' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('DONE');
    expect(response.body.title).toBe('Estudar TypeScript');
  });

  it('deletes a task owned by the authenticated user', async () => {
    const app = buildTestApp();
    const { token } = await registerAndLogin(app);
    const created = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Estudar TypeScript' });

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app)
      .get(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getResponse.status).toBe(404);
  });

  describe('embedded fields', () => {
    it('stores and returns tags and the checklist', async () => {
      const app = buildTestApp();
      const { token } = await registerAndLogin(app);

      const created = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Entregar o trabalho',
          priority: 'HIGH',
          tags: ['Faculdade', 'backend'],
          checklist: [
            { title: 'Modelar os documentos', done: true },
            { title: 'Escrever o readme' },
          ],
        });

      expect(created.status).toBe(201);
      expect(created.body.priority).toBe('HIGH');
      expect(created.body.tags).toEqual(['faculdade', 'backend']);
      expect(created.body.checklist).toEqual([
        { title: 'Modelar os documentos', done: true, createdAt: expect.any(String) },
        { title: 'Escrever o readme', done: false, createdAt: expect.any(String) },
      ]);

      const fetched = await request(app)
        .get(`/api/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(fetched.body.checklist).toHaveLength(2);
    });

    it('rejects a checklist item without a title', async () => {
      const app = buildTestApp();
      const { token } = await registerAndLogin(app);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Entregar o trabalho', checklist: [{ done: true }] });

      expect(response.status).toBe(400);
    });

    it('filters the listing by tag', async () => {
      const app = buildTestApp();
      const { token } = await registerAndLogin(app);

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Com a tag', tags: ['estudo'] });
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Sem a tag', tags: ['trabalho'] });

      const response = await request(app)
        .get('/api/tasks?tag=estudo')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Com a tag');
    });
  });

  describe('GET /api/tasks/stats', () => {
    it('requires authentication', async () => {
      const app = buildTestApp();

      const response = await request(app).get('/api/tasks/stats');

      expect(response.status).toBe(401);
    });

    it('is not swallowed by the /:id route', async () => {
      const app = buildTestApp();
      const { token } = await registerAndLogin(app);

      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ total: 0, overdue: 0, byStatus: [], topTags: [] });
    });

    it('summarizes the tasks of the authenticated user', async () => {
      const app = buildTestApp();
      const { token } = await registerAndLogin(app);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Atrasada', tags: ['estudo'], dueDate: yesterday.toISOString() });
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Concluida', status: 'DONE', tags: ['estudo', 'casa'] });

      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.overdue).toBe(1);
      expect(response.body.byStatus).toEqual(
        expect.arrayContaining([
          { status: 'PENDING', count: 1 },
          { status: 'DONE', count: 1 },
        ]),
      );
      expect(response.body.topTags[0]).toEqual({ tag: 'estudo', count: 2 });
    });

    it('does not leak the tasks of another user', async () => {
      const app = buildTestApp();
      const owner = await registerAndLogin(app, { email: 'owner@example.com' });
      const other = await registerAndLogin(app, { email: 'other@example.com' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ title: 'Tarefa do dono' });

      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${other.token}`);

      expect(response.body.total).toBe(0);
    });
  });
});
