import type { ApiErrorBody } from '@fintrack/contracts';
import type { ErrorHandler } from 'hono';
import { DomainError, type DomainErrorCode } from '../../domain/shared/errors';
import type { AppEnv } from './AppEnv';

/** O único lugar que traduz erros de domínio para status HTTP. */
const STATUS_BY_CODE: Record<DomainErrorCode, 400 | 404 | 409 | 422> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSINESS_RULE_VIOLATION: 422,
};

export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
  if (error instanceof DomainError) {
    const body: ApiErrorBody = { error: { code: error.code, message: error.message } };
    return c.json(body, STATUS_BY_CODE[error.code]);
  }

  console.error('Unhandled error', error);
  const body: ApiErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  };
  return c.json(body, 500);
};
