import { Request, Response } from 'express';

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NotFoundError',
    message: `Rota ${req.method} ${req.originalUrl} não existe`,
  });
}
