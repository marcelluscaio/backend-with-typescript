import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { PublicUser, User, toPublicUser } from '../domain/entities/user.entity';
import { IUserRepository } from '../repositories/interfaces/user.repository.interface';
import { RegisterDto } from '../dtos/auth/register.dto';
import { LoginDto } from '../dtos/auth/login.dto';
import { ConflictError, UnauthorizedError } from '../utils/app-error';

const SALT_ROUNDS = 10;

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

/**
 * Encapsulates authentication concerns (registration, login, token
 * issuing/verification) so controllers and other services never touch
 * hashing or JWT details directly.
 */
export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Já existe um usuário com este e-mail');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    // Identity and createdAt belong to the repository, so the service stays
    // agnostic about how ids are generated.
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return { user: toPublicUser(user), token: this.signToken(user) };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    return { user: toPublicUser(user), token: this.signToken(user) };
  }

  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedError('Token inválido ou expirado');
    }
  }

  private signToken(user: User): string {
    const payload: AuthTokenPayload = { sub: user.id, email: user.email };
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
  }
}
