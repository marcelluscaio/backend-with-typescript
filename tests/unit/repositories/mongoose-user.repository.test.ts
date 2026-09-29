import { Types } from 'mongoose';
import { MongooseUserRepository } from '../../../src/repositories/mongoose/mongoose-user.repository';
import { UserModel } from '../../../src/infra/database/models/user.model';
import { ConflictError } from '../../../src/utils/app-error';

describe('MongooseUserRepository', () => {
  const repository = new MongooseUserRepository();

  beforeAll(async () => {
    // Makes sure the unique index on email is in place before the tests rely on it.
    await UserModel.init();
  });

  it('creates a user with a generated id and a normalized email', async () => {
    const created = await repository.create({
      name: 'Alice',
      email: 'Alice@Example.com',
      passwordHash: 'hash',
    });

    expect(Types.ObjectId.isValid(created.id)).toBe(true);
    expect(created.email).toBe('alice@example.com');
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created).not.toHaveProperty('_id');
  });

  it('finds a user by email regardless of casing', async () => {
    const created = await repository.create({
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash: 'hash',
    });

    await expect(repository.findByEmail('ALICE@example.com')).resolves.toMatchObject({
      id: created.id,
    });
  });

  it('translates a duplicate email into a conflict error', async () => {
    await repository.create({ name: 'Alice', email: 'alice@example.com', passwordHash: 'hash' });

    await expect(
      repository.create({ name: 'Outra', email: 'alice@example.com', passwordHash: 'hash' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns null for a missing user and for a malformed id', async () => {
    await expect(repository.findById(new Types.ObjectId().toString())).resolves.toBeNull();
    await expect(repository.findById('nao-e-um-object-id')).resolves.toBeNull();
    await expect(repository.findByEmail('ninguem@example.com')).resolves.toBeNull();
  });
});
