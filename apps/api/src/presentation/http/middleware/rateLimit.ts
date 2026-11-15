import type { ApiErrorBody } from '@fintrack/contracts';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../AppEnv';

/**
 * BR-406: limita tentativas de login/cadastro por IP usando o binding de
 * Rate Limiting do Workers. Sem o binding (dev e testes), não limita.
 */
export const authRateLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
  const limiter = c.env.AUTH_RATE_LIMITER;
  if (!limiter) {
    await next();
    return;
  }

  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { success } = await limiter.limit({ key: `auth:${ip}` });
  if (!success) {
    const body: ApiErrorBody = {
      error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in a minute.' },
    };
    return c.json(body, 429);
  }
  await next();
};
