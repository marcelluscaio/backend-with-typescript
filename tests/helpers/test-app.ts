import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';

export function buildTestApp(): Express {
  return createApp();
}

export async function registerAndLogin(
  app: Express,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<{ token: string; email: string }> {
  const user = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `user-${Date.now()}-${Math.random()}@example.com`,
    password: overrides.password ?? 'password123',
  };

  const response = await request(app).post('/api/auth/register').send(user);
  return { token: response.body.token as string, email: user.email };
}
