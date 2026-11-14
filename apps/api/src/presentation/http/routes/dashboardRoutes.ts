import { DashboardQuerySchema } from '@fintrack/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../AppEnv';
import { validate } from '../validate';

export const dashboardRoutes = new Hono<AppEnv>().get(
  '/summary',
  validate('query', DashboardQuerySchema),
  async (c) => {
    const summary = await c.var.useCases.getDashboardSummary.execute(c.req.valid('query'));
    return c.json(summary);
  },
);
