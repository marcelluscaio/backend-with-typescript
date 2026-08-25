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

    const listed = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);

    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
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
      .get('/api/tasks/does-not-exist')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
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
});
