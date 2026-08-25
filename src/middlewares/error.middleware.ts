import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../services/logger.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { path: req.path, stack: err.stack });
    }
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
    return;
  }

  logger.error(err.message, { path: req.path, stack: err.stack });
  res.status(500).json({ error: 'InternalServerError', message: 'Erro interno no servidor' });
}
