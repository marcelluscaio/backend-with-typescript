import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/app-error';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

/**
 * Verifies the Bearer JWT on the Authorization header and attaches the
 * caller's identity to the request. Any route mounted behind this
 * middleware is considered a protected business route.
 */
export function createAuthMiddleware(authService: AuthService) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de acesso não informado');
    }

    const token = header.slice('Bearer '.length);
    const payload = authService.verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  };
}
