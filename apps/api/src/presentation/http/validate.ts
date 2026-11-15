import type { ApiErrorBody } from '@fintrack/contracts';
import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import type { ZodSchema } from 'zod';

/**
 * Valida a entrada com Zod e, em caso de erro, responde no formato padrão da
 * API (`ApiErrorBody`) em vez do formato default do zod-validator.
 */
export const validate = <Target extends keyof ValidationTargets, Schema extends ZodSchema>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const body: ApiErrorBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid ${String(target)}`,
          details: result.error.flatten(),
        },
      };
      return c.json(body, 400);
    }
    return undefined;
  });
