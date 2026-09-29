import { NewUser, User } from '../../domain/entities/user.entity';

export interface IUserRepository {
  create(user: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
