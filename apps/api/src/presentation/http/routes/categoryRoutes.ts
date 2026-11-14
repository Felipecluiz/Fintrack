import { CreateCategorySchema, IdParamSchema, UpdateCategorySchema } from '@fintrack/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../AppEnv';
import { validate } from '../validate';

export const categoryRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const categories = await c.var.useCases.listCategories.execute();
    return c.json(categories);
  })
  .post('/', validate('json', CreateCategorySchema), async (c) => {
    const category = await c.var.useCases.createCategory.execute(c.req.valid('json'));
    return c.json(category, 201);
  })
  .patch(
    '/:id',
    validate('param', IdParamSchema),
    validate('json', UpdateCategorySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const category = await c.var.useCases.renameCategory.execute(id, c.req.valid('json'));
      return c.json(category);
    },
  )
  .delete('/:id', validate('param', IdParamSchema), async (c) => {
    await c.var.useCases.deleteCategory.execute(c.req.valid('param').id);
    return c.body(null, 204);
  });
