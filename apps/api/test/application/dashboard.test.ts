import type { CategoryDTO, CreateTransactionInput } from '@fintrack/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { monthsBetween } from '../../src/application/dashboard/months';
import { CalendarDate } from '../../src/domain/shared/CalendarDate';
import { ValidationError } from '../../src/domain/shared/errors';
import { createTestContext, type TestContext } from '../support/fakes';

describe('monthsBetween', () => {
  it('AC-303: includes every month, across year boundaries', () => {
    const months = monthsBetween(
      CalendarDate.parse('2025-11-15'),
      CalendarDate.parse('2026-02-01'),
    );
    expect(months).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });
});

describe('GetDashboardSummary', () => {
  let ctx: TestContext;
  let salary: CategoryDTO;
  let rent: CategoryDTO;
  let groceries: CategoryDTO;

  const add = (input: Omit<CreateTransactionInput, 'description'>) =>
    ctx.useCases.createTransaction.execute({ description: 'x', ...input });

  beforeEach(async () => {
    ctx = createTestContext();
    salary = await ctx.useCases.createCategory.execute({ name: 'Salário', type: 'income' });
    rent = await ctx.useCases.createCategory.execute({ name: 'Moradia', type: 'expense' });
    groceries = await ctx.useCases.createCategory.execute({ name: 'Mercado', type: 'expense' });
  });

  it('AC-301: totals income, expense and balance for the period', async () => {
    await add({
      amountCents: 500_000,
      type: 'income',
      categoryId: salary.id,
      occurredOn: '2026-01-05',
    });
    await add({
      amountCents: 80_000,
      type: 'expense',
      categoryId: rent.id,
      occurredOn: '2026-01-10',
    });
    await add({
      amountCents: 40_000,
      type: 'expense',
      categoryId: groceries.id,
      occurredOn: '2026-01-20',
    });
    // fora do período
    await add({
      amountCents: 999_999,
      type: 'expense',
      categoryId: rent.id,
      occurredOn: '2026-02-01',
    });

    const summary = await ctx.useCases.getDashboardSummary.execute({
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(summary.totals).toEqual({
      incomeCents: 500_000,
      expenseCents: 120_000,
      balanceCents: 380_000,
    });
  });

  it('AC-302: the balance can be negative', async () => {
    await add({
      amountCents: 1_000,
      type: 'income',
      categoryId: salary.id,
      occurredOn: '2026-01-05',
    });
    await add({
      amountCents: 5_000,
      type: 'expense',
      categoryId: rent.id,
      occurredOn: '2026-01-06',
    });

    const summary = await ctx.useCases.getDashboardSummary.execute({
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(summary.totals.balanceCents).toBe(-4_000);
  });

  it('AC-303: zero-fills months without transactions', async () => {
    await add({
      amountCents: 100,
      type: 'income',
      categoryId: salary.id,
      occurredOn: '2026-01-05',
    });
    await add({ amountCents: 300, type: 'expense', categoryId: rent.id, occurredOn: '2026-03-05' });

    const summary = await ctx.useCases.getDashboardSummary.execute({
      from: '2026-01-01',
      to: '2026-03-31',
    });

    expect(summary.monthly).toEqual([
      { month: '2026-01', incomeCents: 100, expenseCents: 0 },
      { month: '2026-02', incomeCents: 0, expenseCents: 0 },
      { month: '2026-03', incomeCents: 0, expenseCents: 300 },
    ]);
  });

  it('AC-304: ranks only expenses, largest first', async () => {
    await add({
      amountCents: 500_000,
      type: 'income',
      categoryId: salary.id,
      occurredOn: '2026-01-05',
    });
    await add({
      amountCents: 20_000,
      type: 'expense',
      categoryId: groceries.id,
      occurredOn: '2026-01-07',
    });
    await add({
      amountCents: 30_000,
      type: 'expense',
      categoryId: groceries.id,
      occurredOn: '2026-01-08',
    });
    await add({
      amountCents: 80_000,
      type: 'expense',
      categoryId: rent.id,
      occurredOn: '2026-01-10',
    });

    const summary = await ctx.useCases.getDashboardSummary.execute({
      from: '2026-01-01',
      to: '2026-01-31',
    });

    expect(summary.expensesByCategory).toEqual([
      { categoryId: rent.id, categoryName: 'Moradia', totalCents: 80_000 },
      { categoryId: groceries.id, categoryName: 'Mercado', totalCents: 50_000 },
    ]);
  });

  it('AC-305: rejects "from" after "to"', async () => {
    await expect(
      ctx.useCases.getDashboardSummary.execute({ from: '2026-02-01', to: '2026-01-01' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('AC-306: defaults to the last 6 months, ending this month', async () => {
    ctx.clock.set('2026-11-13T12:00:00.000Z');

    const summary = await ctx.useCases.getDashboardSummary.execute({});

    expect(summary.period).toEqual({ from: '2026-06-01', to: '2026-11-30' });
    expect(summary.monthly.map((m) => m.month)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
  });

  it('AC-307: rejects periods longer than 24 months', async () => {
    await expect(
      ctx.useCases.getDashboardSummary.execute({ from: '2024-01-01', to: '2026-01-31' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
