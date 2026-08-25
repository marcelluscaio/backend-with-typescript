import { AuthService } from '../../../src/services/auth.service';
import { InMemoryUserRepository } from '../../../src/repositories/in-memory/in-memory-user.repository';
import { ConflictError, UnauthorizedError } from '../../../src/utils/app-error';

describe('AuthService', () => {
  function setup() {
    const repository = new InMemoryUserRepository();
    const service = new AuthService(repository);
    return { repository, service };
  }

  it('registers a new user and returns a token without the password hash', async () => {
    const { service } = setup();

    const result = await service.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.user).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects registration with a duplicate email', async () => {
    const { service } = setup();
    await service.register({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });

    await expect(
      service.register({ name: 'Alice 2', email: 'alice@example.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('logs in with correct credentials', async () => {
    const { service } = setup();
    await service.register({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });

    const result = await service.login({ email: 'alice@example.com', password: 'secret123' });

    expect(result.token).toEqual(expect.any(String));
  });

  it('rejects login with a wrong password', async () => {
    const { service } = setup();
    await service.register({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });

    await expect(
      service.login({ email: 'alice@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects login for an unknown email', async () => {
    const { service } = setup();

    await expect(
      service.login({ email: 'nobody@example.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('verifies a token issued by itself and rejects a garbage token', async () => {
    const { service } = setup();
    const { token } = await service.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    const payload = service.verifyToken(token);
    expect(payload.email).toBe('alice@example.com');

    expect(() => service.verifyToken('not-a-valid-token')).toThrow(UnauthorizedError);
  });
});
