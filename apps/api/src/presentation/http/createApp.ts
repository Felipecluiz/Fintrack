import type { ApiErrorBody } from '@fintrack/contracts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { UseCases } from '../../main/container';
import type { Env } from '../../main/env';
import type { AppEnv } from './AppEnv';
import { errorHandler } from './errorHandler';
import { categoryRoutes } from './routes/categoryRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { transactionRoutes } from './routes/transactionRoutes';

/**
 * A fábrica recebe como resolver os casos de uso. Em produção isso vem do
 * container com D1; nos testes, de repositórios em memória.
 */
export function createApp(resolveUseCases: (env: Env) => UseCases) {
  const app = new Hono<AppEnv>();

  app.use('*', logger());
  app.use('/api/*', (c, next) =>
    cors({
      origin: c.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      maxAge: 86400,
    })(c, next),
  );
  app.use('/api/*', async (c, next) => {
    c.set('useCases', resolveUseCases(c.env));
    await next();
  });

  app.get('/api/health', (c) => c.json({ status: 'ok' }));
  app.route('/api/categories', categoryRoutes);
  app.route('/api/transactions', transactionRoutes);
  app.route('/api/dashboard', dashboardRoutes);

  app.notFound((c) => {
    const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    return c.json(body, 404);
  });
  app.onError(errorHandler);

  return app;
}
