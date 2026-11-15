import { LoginSchema, RegisterSchema } from '@fintrack/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../AppEnv';
import { authRateLimit } from '../middleware/rateLimit';
import { validate } from '../validate';

/** Rotas públicas de autenticação (`/api/auth/*`). */
export const authRoutes = new Hono<AppEnv>()
  .use('*', authRateLimit)
  .post('/register', validate('json', RegisterSchema), async (c) => {
    const session = await c.var.auth.useCases.registerUser.execute(c.req.valid('json'));
    return c.json(session, 201);
  })
  .post('/login', validate('json', LoginSchema), async (c) => {
    const session = await c.var.auth.useCases.loginUser.execute(c.req.valid('json'));
    return c.json(session);
  });
