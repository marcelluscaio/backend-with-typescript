import { Error as MongooseError } from 'mongoose';
import { ValidationAppError } from '../../utils/app-error';

const DUPLICATE_KEY_CODE = 11000;

/**
 * Mongo/Mongoose failures stop at the repository boundary: callers above
 * only ever see the application's own error types.
 */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === DUPLICATE_KEY_CODE
  );
}

export function rethrowAsAppError(error: unknown): never {
  if (error instanceof MongooseError.ValidationError) {
    const details: Record<string, string[]> = {};
    for (const [field, issue] of Object.entries(error.errors)) {
      details[field] = [issue.message];
    }
    throw new ValidationAppError(details);
  }
  throw error;
}
