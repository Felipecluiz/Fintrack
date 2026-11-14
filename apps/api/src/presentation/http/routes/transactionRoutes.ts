import {
  CreateTransactionSchema,
  IdParamSchema,
  ListTransactionsQuerySchema,
  UpdateTransactionSchema,
} from '@fintrack/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../AppEnv';
import { validate } from '../validate';

export const transactionRoutes = new Hono<AppEnv>()
  .get('/', validate('query', ListTransactionsQuerySchema), async (c) => {
    const page = await c.var.useCases.listTransactions.execute(c.req.valid('query'));
    return c.json(page);
  })
  .get('/:id', validate('param', IdParamSchema), async (c) => {
    const transaction = await c.var.useCases.getTransaction.execute(c.req.valid('param').id);
    return c.json(transaction);
  })
  .post('/', validate('json', CreateTransactionSchema), async (c) => {
    const transaction = await c.var.useCases.createTransaction.execute(c.req.valid('json'));
    return c.json(transaction, 201);
  })
  .patch(
    '/:id',
    validate('param', IdParamSchema),
    validate('json', UpdateTransactionSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const transaction = await c.var.useCases.updateTransaction.execute(id, c.req.valid('json'));
      return c.json(transaction);
    },
  )
  .delete('/:id', validate('param', IdParamSchema), async (c) => {
    await c.var.useCases.deleteTransaction.execute(c.req.valid('param').id);
    return c.body(null, 204);
  });
