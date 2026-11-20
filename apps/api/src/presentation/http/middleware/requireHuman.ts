import type { ApiErrorBody } from '@fintrack/contracts';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../AppEnv';

/** Cabeçalho em que o front envia o token do Turnstile. */
export const HUMAN_TOKEN_HEADER = 'X-Turnstile-Token';

/**
 * BR-408: exige a verificação anti-robô antes de seguir. Sem verificador
 * configurado (dev sem chave, testes), não verifica.
 */
export const requireHuman =
  (action: string): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const verifier = c.var.auth.humans;
    if (!verifier) {
      await next();
      return;
    }

    const passed = await verifier.verify({
      token: c.req.header(HUMAN_TOKEN_HEADER) ?? '',
      action,
      remoteIp: c.req.header('CF-Connecting-IP'),
    });
    if (!passed) {
      const body: ApiErrorBody = {
        error: {
          code: 'HUMAN_VERIFICATION_FAILED',
          message: 'Could not confirm that this request came from a person.',
        },
      };
      return c.json(body, 403);
    }
    await next();
  };
