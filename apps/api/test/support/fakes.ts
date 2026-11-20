import type {
  CategoryTotal,
  MonthlyTotal,
  Period,
  ReportReader,
  TypeTotals,
} from '../../src/application/dashboard/ReportReader';
import type { Clock } from '../../src/application/ports/Clock';
import type { IdGenerator } from '../../src/application/ports/IdGenerator';
import { Category } from '../../src/domain/category/Category';
import type { CategoryRepository } from '../../src/domain/category/CategoryRepository';
import type { PageRequest, PageResult } from '../../src/domain/shared/pagination';
import type { TransactionType } from '../../src/domain/shared/TransactionType';
import { Transaction, type TransactionSnapshot } from '../../src/domain/transaction/Transaction';
import type {
  TransactionFilter,
  TransactionRepository,
} from '../../src/domain/transaction/TransactionRepository';
import type { HumanVerifier } from '../../src/application/auth/ports/HumanVerifier';
import type { PasswordHasher } from '../../src/application/auth/ports/PasswordHasher';
import type { Email } from '../../src/domain/user/Email';
import { User, type UserSnapshot } from '../../src/domain/user/User';
import type { UserRepository } from '../../src/domain/user/UserRepository';
import { HmacJwtTokenService } from '../../src/infrastructure/security/HmacJwtTokenService';
import {
  wireAuth,
  wireUseCases,
  type AuthModule,
  type UseCases,
} from '../../src/main/container';

export class FixedClock implements Clock {
  constructor(private current = new Date('2026-11-13T12:00:00.000Z')) {}

  now(): Date {
    return new Date(this.current);
  }

  set(isoDate: string): void {
    this.current = new Date(isoDate);
  }
}

/** Gera UUIDs v4 válidos e previsíveis: 00000000-0000-4000-8000-000000000001, ... */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  /** `prefix` (um dígito hexa) separa os ids de geradores diferentes. */
  constructor(private readonly prefix = '0') {}

  next(): string {
    this.counter += 1;
    return `${this.prefix.repeat(8)}-0000-4000-8000-${String(this.counter).padStart(12, '0')}`;
  }
}

export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly rows = new Map<string, ReturnType<Category['toSnapshot']>>();

  async findById(id: string): Promise<Category | null> {
    const row = this.rows.get(id);
    return row ? Category.restore(row) : null;
  }

  async findByName(name: string, type: TransactionType): Promise<Category | null> {
    const wanted = name.toLocaleLowerCase();
    const row = [...this.rows.values()].find(
      (c) => c.type === type && c.name.toLocaleLowerCase() === wanted,
    );
    return row ? Category.restore(row) : null;
  }

  async list(): Promise<Category[]> {
    return [...this.rows.values()]
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
      .map(Category.restore);
  }

  async save(category: Category): Promise<void> {
    this.rows.set(category.id, category.toSnapshot());
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}

export class InMemoryTransactionRepository implements TransactionRepository {
  private readonly rows = new Map<string, TransactionSnapshot>();

  async findById(id: string): Promise<Transaction | null> {
    const row = this.rows.get(id);
    return row ? Transaction.restore(row) : null;
  }

  async list(filter: TransactionFilter, page: PageRequest): Promise<PageResult<Transaction>> {
    const matching = this.all()
      .filter((t) => !filter.from || !filter.from.isAfter(t.occurredOn))
      .filter((t) => !filter.to || !t.occurredOn.isAfter(filter.to))
      .filter((t) => !filter.type || t.type === filter.type)
      .filter((t) => !filter.categoryId || t.categoryId === filter.categoryId)
      .sort(
        (a, b) =>
          b.occurredOn.toString().localeCompare(a.occurredOn.toString()) ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      );

    const start = (page.page - 1) * page.pageSize;
    return {
      items: matching.slice(start, start + page.pageSize).map(Transaction.restore),
      total: matching.length,
    };
  }

  async save(transaction: Transaction): Promise<void> {
    this.rows.set(transaction.id, transaction.toSnapshot());
  }

  async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }

  async countByCategory(categoryId: string): Promise<number> {
    return this.all().filter((t) => t.categoryId === categoryId).length;
  }

  all(): TransactionSnapshot[] {
    return [...this.rows.values()];
  }
}

/** Implementação de referência da porta de leitura, usada para testar o caso de uso. */
export class InMemoryReportReader implements ReportReader {
  constructor(
    private readonly transactions: InMemoryTransactionRepository,
    private readonly categories: InMemoryCategoryRepository,
  ) {}

  async totals(period: Period): Promise<TypeTotals> {
    return this.inPeriod(period).reduce<TypeTotals>(
      (acc, t) =>
        t.type === 'income'
          ? { ...acc, incomeCents: acc.incomeCents + t.amount.cents }
          : { ...acc, expenseCents: acc.expenseCents + t.amount.cents },
      { incomeCents: 0, expenseCents: 0 },
    );
  }

  async expensesByCategory(period: Period): Promise<CategoryTotal[]> {
    const totals = new Map<string, number>();
    for (const t of this.inPeriod(period).filter((t) => t.type === 'expense')) {
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount.cents);
    }

    const result: CategoryTotal[] = [];
    for (const [categoryId, totalCents] of totals) {
      const category = await this.categories.findById(categoryId);
      result.push({ categoryId, categoryName: category?.name ?? '?', totalCents });
    }
    return result.sort((a, b) => b.totalCents - a.totalCents);
  }

  async monthlyTotals(period: Period): Promise<MonthlyTotal[]> {
    const byMonth = new Map<string, MonthlyTotal>();
    for (const t of this.inPeriod(period)) {
      const month = t.occurredOn.month;
      const entry = byMonth.get(month) ?? { month, incomeCents: 0, expenseCents: 0 };
      if (t.type === 'income') entry.incomeCents += t.amount.cents;
      else entry.expenseCents += t.amount.cents;
      byMonth.set(month, entry);
    }
    return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  }

  private inPeriod({ from, to }: Period): TransactionSnapshot[] {
    return this.transactions
      .all()
      .filter((t) => !from.isAfter(t.occurredOn) && !t.occurredOn.isAfter(to));
  }
}

export interface TestContext {
  useCases: UseCases;
  categories: InMemoryCategoryRepository;
  transactions: InMemoryTransactionRepository;
  clock: FixedClock;
}

export function createTestContext(idPrefix = '0'): TestContext {
  const categories = new InMemoryCategoryRepository();
  const transactions = new InMemoryTransactionRepository();
  const clock = new FixedClock();
  const useCases = wireUseCases({
    categories,
    transactions,
    reports: new InMemoryReportReader(transactions, categories),
    clock,
    ids: new SequentialIdGenerator(idPrefix),
  });
  return { useCases, categories, transactions, clock };
}

/* ---------- Autenticação ---------- */

export const TEST_JWT_SECRET = 'test-secret-with-at-least-32-characters!';

export class InMemoryUserRepository implements UserRepository {
  private readonly rows = new Map<string, UserSnapshot>();

  async findById(id: string): Promise<User | null> {
    const row = this.rows.get(id);
    return row ? User.restore(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = [...this.rows.values()].find((u) => u.email.equals(email));
    return row ? User.restore(row) : null;
  }

  async save(user: User): Promise<void> {
    this.rows.set(user.id, user.toSnapshot());
  }

  all(): UserSnapshot[] {
    return [...this.rows.values()];
  }
}

/** Hash "de mentira" e rápido — os testes de PBKDF2 ficam em infrastructure. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, storedHash: string | null): Promise<boolean> {
    return storedHash === `hashed:${password}`;
  }
}

export interface AuthTestContext {
  auth: AuthModule;
  users: InMemoryUserRepository;
  clock: FixedClock;
}

export function createAuthTestContext(
  clock = new FixedClock(),
  humans?: HumanVerifier,
): AuthTestContext {
  const users = new InMemoryUserRepository();
  const auth = wireAuth({
    users,
    hasher: new FakePasswordHasher(),
    tokens: new HmacJwtTokenService(TEST_JWT_SECRET, clock),
    clock,
    ids: new SequentialIdGenerator('a'),
    humans,
  });
  return { auth, users, clock };
}

/** Aceita só o token combinado; registra o que recebeu para as asserções. */
export class FakeHumanVerifier implements HumanVerifier {
  readonly checks: Parameters<HumanVerifier['verify']>[0][] = [];

  constructor(private readonly acceptedToken = 'human-ok') {}

  async verify(check: Parameters<HumanVerifier['verify']>[0]): Promise<boolean> {
    this.checks.push(check);
    return check.token === this.acceptedToken;
  }
}
