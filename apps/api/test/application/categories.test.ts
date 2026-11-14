import { beforeEach, describe, expect, it } from 'vitest';
import { BusinessRuleError, ConflictError, NotFoundError } from '../../src/domain/shared/errors';
import { createTestContext, type TestContext } from '../support/fakes';

const MISSING_ID = '99999999-9999-4999-8999-999999999999';

describe('Category use cases', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  it('AC-101: creates a category', async () => {
    const created = await ctx.useCases.createCategory.execute({
      name: ' Mercado ',
      type: 'expense',
    });

    expect(created).toMatchObject({ name: 'Mercado', type: 'expense' });
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBe('2026-11-13T12:00:00.000Z');
  });

  it('AC-104: rejects a duplicate name of the same type, ignoring case', async () => {
    await ctx.useCases.createCategory.execute({ name: 'Mercado', type: 'expense' });

    await expect(
      ctx.useCases.createCategory.execute({ name: 'mercado', type: 'expense' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('AC-105: allows the same name for a different type', async () => {
    await ctx.useCases.createCategory.execute({ name: 'Bônus', type: 'expense' });

    await expect(
      ctx.useCases.createCategory.execute({ name: 'Bônus', type: 'income' }),
    ).resolves.toMatchObject({ type: 'income' });
  });

  it('AC-106: lists categories ordered by type, then name', async () => {
    await ctx.useCases.createCategory.execute({ name: 'Transporte', type: 'expense' });
    await ctx.useCases.createCategory.execute({ name: 'Salário', type: 'income' });
    await ctx.useCases.createCategory.execute({ name: 'Aluguel', type: 'expense' });

    const names = (await ctx.useCases.listCategories.execute()).map((c) => c.name);
    expect(names).toEqual(['Aluguel', 'Transporte', 'Salário']);
  });

  it('AC-107: renames a category', async () => {
    const { id } = await ctx.useCases.createCategory.execute({ name: 'Mercado', type: 'expense' });

    const renamed = await ctx.useCases.renameCategory.execute(id, { name: 'Supermercado' });
    expect(renamed.name).toBe('Supermercado');
  });

  it('AC-107: allows renaming to a different casing of its own name', async () => {
    const { id } = await ctx.useCases.createCategory.execute({ name: 'mercado', type: 'expense' });

    await expect(
      ctx.useCases.renameCategory.execute(id, { name: 'Mercado' }),
    ).resolves.toMatchObject({ name: 'Mercado' });
  });

  it('AC-107: rejects renaming to a name taken by another category', async () => {
    await ctx.useCases.createCategory.execute({ name: 'Mercado', type: 'expense' });
    const { id } = await ctx.useCases.createCategory.execute({ name: 'Feira', type: 'expense' });

    await expect(
      ctx.useCases.renameCategory.execute(id, { name: 'MERCADO' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('AC-108: returns not found for unknown ids', async () => {
    await expect(
      ctx.useCases.renameCategory.execute(MISSING_ID, { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(ctx.useCases.deleteCategory.execute(MISSING_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('AC-109: deletes an unused category', async () => {
    const { id } = await ctx.useCases.createCategory.execute({ name: 'Mercado', type: 'expense' });

    await ctx.useCases.deleteCategory.execute(id);
    expect(await ctx.useCases.listCategories.execute()).toEqual([]);
  });

  it('AC-110: refuses to delete a category that has transactions', async () => {
    const category = await ctx.useCases.createCategory.execute({
      name: 'Mercado',
      type: 'expense',
    });
    await ctx.useCases.createTransaction.execute({
      description: 'Compras',
      amountCents: 1000,
      type: 'expense',
      categoryId: category.id,
      occurredOn: '2026-11-01',
    });

    await expect(ctx.useCases.deleteCategory.execute(category.id)).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
    expect(await ctx.useCases.listCategories.execute()).toHaveLength(1);
  });
});
