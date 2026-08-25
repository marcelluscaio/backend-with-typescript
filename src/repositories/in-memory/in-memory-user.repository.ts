import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../interfaces/user.repository.interface';

export class InMemoryUserRepository implements IUserRepository {
  private readonly usersById = new Map<string, User>();
  private readonly idByEmail = new Map<string, string>();

  async create(user: User): Promise<User> {
    this.usersById.set(user.id, user);
    this.idByEmail.set(user.email.toLowerCase(), user.id);
    return user;
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
