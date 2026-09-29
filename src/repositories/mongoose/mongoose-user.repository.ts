import { Types } from 'mongoose';
import { NewUser, User } from '../../domain/entities/user.entity';
import { UserModel } from '../../infra/database/models/user.model';
import { ConflictError } from '../../utils/app-error';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { toDomain, toPersistence } from './mappers/user.mapper';
import { isDuplicateKeyError, rethrowAsAppError } from './mongo-error';

export class MongooseUserRepository implements IUserRepository {
  async create(user: NewUser): Promise<User> {
    try {
      const doc = new UserModel(toPersistence(user));
      await doc.save();
      return toDomain(doc);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError('Já existe um usuário com este e-mail');
      }
      return rethrowAsAppError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() });
    return doc ? toDomain(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    // A malformed id is simply "not found"; it must never surface as a CastError.
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await UserModel.findById(id);
    return doc ? toDomain(doc) : null;
  }
}
