import { CreateCategory } from '../application/category/CreateCategory';
import { DeleteCategory } from '../application/category/DeleteCategory';
import { ListCategories } from '../application/category/ListCategories';
import { RenameCategory } from '../application/category/RenameCategory';
import { GetDashboardSummary } from '../application/dashboard/GetDashboardSummary';
import type { ReportReader } from '../application/dashboard/ReportReader';
import type { Clock } from '../application/ports/Clock';
import type { IdGenerator } from '../application/ports/IdGenerator';
import { CreateTransaction } from '../application/transaction/CreateTransaction';
import { DeleteTransaction } from '../application/transaction/DeleteTransaction';
import { GetTransaction } from '../application/transaction/GetTransaction';
import { ListTransactions } from '../application/transaction/ListTransactions';
import { UpdateTransaction } from '../application/transaction/UpdateTransaction';
import type { CategoryRepository } from '../domain/category/CategoryRepository';
import type { TransactionRepository } from '../domain/transaction/TransactionRepository';
import { D1CategoryRepository } from '../infrastructure/d1/D1CategoryRepository';
import { D1ReportReader } from '../infrastructure/d1/D1ReportReader';
import { D1TransactionRepository } from '../infrastructure/d1/D1TransactionRepository';
import { CryptoIdGenerator } from '../infrastructure/system/CryptoIdGenerator';
import { SystemClock } from '../infrastructure/system/SystemClock';
import type { Env } from './env';

/** Tudo de que os casos de uso precisam, expresso apenas como portas. */
export interface Dependencies {
  categories: CategoryRepository;
  transactions: TransactionRepository;
  reports: ReportReader;
  clock: Clock;
  ids: IdGenerator;
}

export function wireUseCases(deps: Dependencies) {
  const { categories, transactions, reports, clock, ids } = deps;
  return {
    listCategories: new ListCategories(categories),
    createCategory: new CreateCategory(categories, clock, ids),
    renameCategory: new RenameCategory(categories, clock),
    deleteCategory: new DeleteCategory(categories, transactions),

    listTransactions: new ListTransactions(transactions),
    getTransaction: new GetTransaction(transactions),
    createTransaction: new CreateTransaction(transactions, categories, clock, ids),
    updateTransaction: new UpdateTransaction(transactions, categories, clock),
    deleteTransaction: new DeleteTransaction(transactions),

    getDashboardSummary: new GetDashboardSummary(reports, clock),
  };
}

export type UseCases = ReturnType<typeof wireUseCases>;

/** Composition root de produção: o único lugar que conhece D1. */
export function buildUseCases(env: Env): UseCases {
  return wireUseCases({
    categories: new D1CategoryRepository(env.DB),
    transactions: new D1TransactionRepository(env.DB),
    reports: new D1ReportReader(env.DB),
    clock: new SystemClock(),
    ids: new CryptoIdGenerator(),
  });
}
