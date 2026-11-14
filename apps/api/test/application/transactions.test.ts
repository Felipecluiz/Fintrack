import type { CategoryDTO, CreateTransactionInput } from '@fintrack/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { BusinessRuleError, NotFoundError } from '../../src/domain/shared/errors';
import { createTestContext, type TestContext } from '../support/fakes';

const MISSING_ID = '99999999-9999-4999-8999-999999999999';

describe('Transaction use cases', () => {
  let ctx: TestContext;
  let groceries: CategoryDTO;
  let salary: CategoryDTO;

  const expense = (overrides: Partial<CreateTransactionInput> = {}): CreateTransactionInput => ({
    description: 'Compras',
    amountCents: 10_000,
    type: 'expense',
    categoryId: groceries.id,
    occurredOn: '2026-11-01',
    ...overrides,
  });

  beforeEach(async () => {
    ctx = createTestContext();
    groceries = await ctx.useCases.createCategory.execute({ name: 'Mercado', type: 'expense' });
    salary = await ctx.useCases.createCategory.execute({ name: 'Salário', type: 'income' });
  });

  it('AC-201: creates a transaction', async () => {
    const created = await ctx.useCases.createTransaction.execute(expense());

    expect(created).toMatchObject({
      description: 'Compras',
      amountCents: 10_000,
      type: 'expense',
      categoryId: groceries.id,
      occurredOn: '2026-11-01',
    });
  });

  it('AC-204: rejects a transaction whose type differs from the category type', async () => {
    await expect(
      ctx.useCases.createTransaction.execute(expense({ type: 'income' })),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('AC-205: rejects a transaction pointing to a missing category', async () => {
    await expect(
      ctx.useCases.createTransaction.execute(expense({ categoryId: MISSING_ID })),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('AC-206: paginates newest first and reports the total', async () => {
    for (const day of ['01', '15', '03', '20', '07']) {
      await ctx.useCases.createTransaction.execute(expense({ occurredOn: `2026-10-${day}` }));
    }

    const firstPage = await ctx.useCases.listTransactions.execute({ page: 1, pageSize: 2 });
    const lastPage = await ctx.useCases.listTransactions.execute({ page: 3, pageSize: 2 });

    expect(firstPage.total).toBe(5);
    expect(firstPage.items.map((t) => t.occurredOn)).toEqual(['2026-10-20', '2026-10-15']);
    expect(lastPage.items.map((t) => t.occurredOn)).toEqual(['2026-10-01']);
  });

  it('AC-207: filters by period, type and category', async () => {
    await ctx.useCases.createTransaction.execute(expense({ occurredOn: '2026-09-30' }));
    await ctx.useCases.createTransaction.execute(expense({ occurredOn: '2026-10-01' }));
    await ctx.useCases.createTransaction.execute(expense({ occurredOn: '2026-10-31' }));
    await ctx.useCases.createTransaction.execute(
      expense({ type: 'income', categoryId: salary.id, occurredOn: '2026-10-05' }),
    );

    const october = await ctx.useCases.listTransactions.execute({
      page: 1,
      pageSize: 20,
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(october.total).toBe(3);

    const octoberExpenses = await ctx.useCases.listTransactions.execute({
      page: 1,
      pageSize: 20,
      from: '2026-10-01',
      to: '2026-10-31',
      type: 'expense',
      categoryId: groceries.id,
    });
    expect(octoberExpenses.items.map((t) => t.occurredOn)).toEqual(['2026-10-31', '2026-10-01']);
  });

  it('AC-208: gets a transaction by id, or fails with not found', async () => {
    const { id } = await ctx.useCases.createTransaction.execute(expense());

    await expect(ctx.useCases.getTransaction.execute(id)).resolves.toMatchObject({ id });
    await expect(ctx.useCases.getTransaction.execute(MISSING_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('AC-209: applies a partial update', async () => {
    const { id } = await ctx.useCases.createTransaction.execute(expense());
    ctx.clock.set('2026-11-14T08:00:00.000Z');

    const updated = await ctx.useCases.updateTransaction.execute(id, { amountCents: 12_345 });

    expect(updated).toMatchObject({ amountCents: 12_345, description: 'Compras' });
    expect(updated.updatedAt).toBe('2026-11-14T08:00:00.000Z');
  });

  it('AC-209: rejects changing the type without a compatible category', async () => {
    const { id } = await ctx.useCases.createTransaction.execute(expense());

    await expect(
      ctx.useCases.updateTransaction.execute(id, { type: 'income' }),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('AC-209: changes type and category together', async () => {
    const { id } = await ctx.useCases.createTransaction.execute(expense());

    const updated = await ctx.useCases.updateTransaction.execute(id, {
      type: 'income',
      categoryId: salary.id,
    });
    expect(updated).toMatchObject({ type: 'income', categoryId: salary.id });
  });

  it('AC-210: deletes a transaction, or fails with not found', async () => {
    const { id } = await ctx.useCases.createTransaction.execute(expense());

    await ctx.useCases.deleteTransaction.execute(id);
    await expect(ctx.useCases.getTransaction.execute(id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(ctx.useCases.deleteTransaction.execute(id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
