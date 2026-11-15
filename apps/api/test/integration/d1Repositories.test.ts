import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { Category } from '../../src/domain/category/Category';
import { CalendarDate } from '../../src/domain/shared/CalendarDate';
import { Money } from '../../src/domain/shared/Money';
import { Transaction } from '../../src/domain/transaction/Transaction';
import { Email } from '../../src/domain/user/Email';
import { User } from '../../src/domain/user/User';
import { D1CategoryRepository } from '../../src/infrastructure/d1/D1CategoryRepository';
import { D1ReportReader } from '../../src/infrastructure/d1/D1ReportReader';
import { D1TransactionRepository } from '../../src/infrastructure/d1/D1TransactionRepository';
import { D1UserRepository } from '../../src/infrastructure/d1/D1UserRepository';

const now = new Date('2026-11-13T12:00:00.000Z');
const ALICE = '00000000-0000-4000-8000-00000000a11c';
const BOB = '00000000-0000-4000-8000-000000000b0b';

async function createUser(id: string, email: string) {
  await new D1UserRepository(env.DB).save(
    User.create({ id, name: id, email: Email.parse(email), passwordHash: 'x', now }),
  );
}

function repositoriesFor(ownerId: string) {
  return {
    categories: new D1CategoryRepository(env.DB, ownerId),
    transactions: new D1TransactionRepository(env.DB, ownerId),
    reports: new D1ReportReader(env.DB, ownerId),
  };
}

describe('D1 repositories (integration)', () => {
  beforeEach(async () => {
    await createUser(ALICE, 'alice@example.com');
    await createUser(BOB, 'bob@example.com');
  });

  it('BR-401: finds users by normalized email', async () => {
    const users = new D1UserRepository(env.DB);
    const found = await users.findByEmail(Email.parse('  ALICE@Example.com '));
    expect(found?.id).toBe(ALICE);
  });

  it('AC-409: a category is invisible to other owners', async () => {
    const alice = repositoriesFor(ALICE);
    const bob = repositoriesFor(BOB);
    const groceries = Category.create({ id: 'c-alice', name: 'Mercado', type: 'expense', now });
    await alice.categories.save(groceries);

    expect(await alice.categories.findById('c-alice')).not.toBeNull();
    expect(await bob.categories.findById('c-alice')).toBeNull();
    expect(await bob.categories.list()).toEqual([]);
    expect(await bob.categories.findByName('Mercado', 'expense')).toBeNull();
  });

  it('AC-409: another owner cannot overwrite or delete a category', async () => {
    const alice = repositoriesFor(ALICE);
    const bob = repositoriesFor(BOB);
    await alice.categories.save(
      Category.create({ id: 'c-alice', name: 'Mercado', type: 'expense', now }),
    );

    // Bob tenta salvar com o mesmo id (upsert) e excluir.
    await bob.categories.save(
      Category.create({ id: 'c-alice', name: 'Hackeado', type: 'expense', now }),
    );
    await bob.categories.delete('c-alice');

    expect((await alice.categories.findById('c-alice'))?.name).toBe('Mercado');
  });

  it('BR-102: the same category name is allowed for different owners', async () => {
    await repositoriesFor(ALICE).categories.save(
      Category.create({ id: 'c-a', name: 'Mercado', type: 'expense', now }),
    );
    await expect(
      repositoriesFor(BOB).categories.save(
        Category.create({ id: 'c-b', name: 'Mercado', type: 'expense', now }),
      ),
    ).resolves.toBeUndefined();
  });

  it('AC-207 / AC-409: lists, filters and aggregates only the owner transactions', async () => {
    const alice = repositoriesFor(ALICE);
    const bob = repositoriesFor(BOB);
    const aliceCategory = Category.create({ id: 'c-a', name: 'Mercado', type: 'expense', now });
    const bobCategory = Category.create({ id: 'c-b', name: 'Mercado', type: 'expense', now });
    await alice.categories.save(aliceCategory);
    await bob.categories.save(bobCategory);

    const expense = (id: string, category: Category, day: string, cents: number) =>
      Transaction.create({
        id,
        description: 'Compras',
        amount: Money.fromCents(cents),
        type: 'expense',
        category,
        occurredOn: CalendarDate.parse(`2026-10-${day}`),
        now,
      });

    await alice.transactions.save(expense('t1', aliceCategory, '01', 1_000));
    await alice.transactions.save(expense('t2', aliceCategory, '15', 2_000));
    await bob.transactions.save(expense('t3', bobCategory, '10', 99_999));

    const page = await alice.transactions.list(
      { from: CalendarDate.parse('2026-10-10') },
      { page: 1, pageSize: 10 },
    );
    expect(page.total).toBe(1);
    expect(page.items[0]?.id).toBe('t2');

    const period = { from: CalendarDate.parse('2026-10-01'), to: CalendarDate.parse('2026-10-31') };
    expect(await alice.reports.totals(period)).toEqual({ incomeCents: 0, expenseCents: 3_000 });
    expect(await alice.reports.expensesByCategory(period)).toEqual([
      { categoryId: 'c-a', categoryName: 'Mercado', totalCents: 3_000 },
    ]);
    expect(await alice.reports.monthlyTotals(period)).toEqual([
      { month: '2026-10', incomeCents: 0, expenseCents: 3_000 },
    ]);
    expect(await alice.transactions.countByCategory('c-a')).toBe(2);
    expect(await bob.transactions.findById('t1')).toBeNull();
  });
});
