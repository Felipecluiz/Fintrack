import type { CalendarDate } from '../shared/CalendarDate';
import type { PageRequest, PageResult } from '../shared/pagination';
import type { TransactionType } from '../shared/TransactionType';
import type { Transaction } from './Transaction';

export interface TransactionFilter {
  from?: CalendarDate;
  to?: CalendarDate;
  type?: TransactionType;
  categoryId?: string;
}

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  /** Ordenadas da data mais recente para a mais antiga (AC-206). */
  list(filter: TransactionFilter, page: PageRequest): Promise<PageResult<Transaction>>;
  save(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
  countByCategory(categoryId: string): Promise<number>;
}
