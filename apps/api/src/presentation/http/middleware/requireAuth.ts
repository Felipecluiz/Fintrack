import type { MiddlewareHandler } from 'hono';
import { UnauthorizedError } from '../../../domain/shared/errors';
import type { UseCases } from '../../../main/container';
import type { Env } from '../../../main/env';
import type { AppEnv } from '../AppEnv';

/**
 * Valida o token Bearer e monta os casos de uso já escopados para o dono
 * do token (AC-407, BR-405).
 */
export function requireAuth(
  useCasesFor: (env: Env, userId: string) => UseCases,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const token = readBearerToken(c.req.header('Authorization'));
    if (!token) {
      throw new UnauthorizedError('Missing bearer token');
    }

    const userId = await c.var.auth.tokens.verify(token);
    if (!userId) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    c.set('userId', userId);
    c.set('useCases', useCasesFor(c.env, userId));
    await next();
  };
}

function readBearerToken(header: string | undefined): string | null {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : null;
}
