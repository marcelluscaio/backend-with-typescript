import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';

describe('Auth routes', () => {
  it('registers a new user', async () => {
    const app = buildTestApp();

    const response = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects registration with an invalid email', async () => {
    const app = buildTestApp();

    const response = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'not-an-email',
      password: 'secret123',
    });

    expect(response.status).toBe(400);
    expect(response.body.details).toHaveProperty('email');
  });

  it('rejects a duplicate email with 409', async () => {
    const app = buildTestApp();
    const user = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };

    await request(app).post('/api/auth/register').send(user);
    const response = await request(app).post('/api/auth/register').send(user);

    expect(response.status).toBe(409);
  });

  it('logs in with valid credentials', async () => {
    const app = buildTestApp();
    const user = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };
    await request(app).post('/api/auth/register').send(user);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('rejects login with wrong password with 401', async () => {
    const app = buildTestApp();
    const user = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };
    await request(app).post('/api/auth/register').send(user);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    expect(response.status).toBe(401);
  });

  it('throttles repeated auth attempts with 429 past the rate limit', async () => {
    const app = buildTestApp();
    const attempt = () =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' });

    for (let i = 0; i < 10; i += 1) {
      const response = await attempt();
      expect(response.status).toBe(401);
    }

    const throttled = await attempt();
    expect(throttled.status).toBe(429);
  });
});
