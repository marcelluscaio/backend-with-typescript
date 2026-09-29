import { NewUser, User } from '../../../domain/entities/user.entity';
import { UserAttrs, UserDocument } from '../../../infra/database/models/user.model';

export function toDomain(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
  };
}

export function toPersistence(user: NewUser): Omit<UserAttrs, 'createdAt'> {
  return {
    name: user.name,
    email: user.email.toLowerCase(),
    passwordHash: user.passwordHash,
  };
}
