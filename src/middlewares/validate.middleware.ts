import { NextFunction, Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { ValidationAppError } from '../utils/app-error';

type ClassConstructor<T> = new (...args: unknown[]) => T;

function flattenErrors(errors: ValidationError[]): Record<string, string[]> {
  const flat: Record<string, string[]> = {};
  for (const error of errors) {
    if (error.constraints) {
      flat[error.property] = Object.values(error.constraints);
    }
  }
  return flat;
}

/**
 * Generic DTO validation middleware: instantiates the given DTO class from
 * the request body, validates it with class-validator, and either replaces
 * req.body with the sanitized instance or forwards a 400 with field errors.
 */
export function validateDto<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, req.body);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    });

    if (errors.length > 0) {
      next(new ValidationAppError(flattenErrors(errors)));
      return;
    }

    req.body = instance;
    next();
  };
}
