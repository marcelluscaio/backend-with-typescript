import { v4 as uuid } from 'uuid';
import { NewUser, User } from '../../domain/entities/user.entity';
import { ConflictError } from '../../utils/app-error';
import { IUserRepository } from '../interfaces/user.repository.interface';

export class InMemoryUserRepository implements IUserRepository {
  private readonly usersById = new Map<string, User>();
  private readonly idByEmail = new Map<string, string>();

  async create(user: NewUser): Promise<User> {
    const email = user.email.toLowerCase();
    if (this.idByEmail.has(email)) {
      throw new ConflictError('Já existe um usuário com este e-mail');
    }

    const created: User = { ...user, id: uuid(), createdAt: new Date() };
    this.usersById.set(created.id, created);
    this.idByEmail.set(email, created.id);
    return created;
  }

  async findByEmail(email: string): Promise<User | null> {
    const id = this.idByEmail.get(email.toLowerCase());
    if (!id) return null;
    return this.usersById.get(id) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }
}
