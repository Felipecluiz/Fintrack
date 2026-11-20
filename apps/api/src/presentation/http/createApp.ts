import type { ApiErrorBody } from '@fintrack/contracts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import type { AuthModule, UseCases } from '../../main/container';
import type { Env } from '../../main/env';
import type { AppEnv } from './AppEnv';
import { createOriginMatcher } from './corsOrigins';
import { errorHandler } from './errorHandler';
import { requireAuth } from './middleware/requireAuth';
import { HUMAN_TOKEN_HEADER } from './middleware/requireHuman';
import { authRoutes } from './routes/authRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { transactionRoutes } from './routes/transactionRoutes';

/**
 * Em produção as fábricas vêm do container com D1; nos testes, de
 * repositórios em memória.
 */
export interface AppDependencies {
  authFor: (env: Env) => AuthModule;
  useCasesFor: (env: Env, userId: string) => UseCases;
}

export function createApp({ authFor, useCasesFor }: AppDependencies) {
  const app = new Hono<AppEnv>();

  app.use('*', logger());
  // A API é consumida de outra origem (Pages): CORP precisa permitir cross-origin.
  app.use('*', secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }));
  app.use('/api/*', (c, next) => {
    const isAllowed = createOriginMatcher(c.env.ALLOWED_ORIGINS);
    return cors({
      origin: (origin) => (isAllowed(origin) ? origin : null),
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', HUMAN_TOKEN_HEADER],
      maxAge: 86400,
    })(c, next);
  });

  app.get('/', (c) => c.redirect('/api/health'));
  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  app.use('/api/*', async (c, next) => {
    c.set('auth', authFor(c.env));
    await next();
  });

  // Públicas
  app.route('/api/auth', authRoutes);

  // Protegidas: tudo abaixo exige token válido.
  const protectedApi = new Hono<AppEnv>()
    .use('*', requireAuth(useCasesFor))
    .get('/me', async (c) => c.json(await c.var.auth.useCases.getCurrentUser.execute(c.var.userId)))
    .route('/categories', categoryRoutes)
    .route('/transactions', transactionRoutes)
    .route('/dashboard', dashboardRoutes);
  app.route('/api', protectedApi);

  app.notFound((c) => {
    const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    return c.json(body, 404);
  });
  app.onError(errorHandler);

  return app;
}
