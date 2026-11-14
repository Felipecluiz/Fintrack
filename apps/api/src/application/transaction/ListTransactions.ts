import type { ListTransactionsQuery, Paginated, TransactionDTO } from '@fintrack/contracts';
import { CalendarDate } from '../../domain/shared/CalendarDate';
import type {
  TransactionFilter,
  TransactionRepository,
} from '../../domain/transaction/TransactionRepository';
import { toTransactionDTO } from './TransactionMapper';

export class ListTransactions {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(query: ListTransactionsQuery): Promise<Paginated<TransactionDTO>> {
    const page = { page: query.page, pageSize: query.pageSize };
    const result = await this.transactions.list(this.toFilter(query), page);

    return {
      items: result.items.map(toTransactionDTO),
      total: result.total,
      ...page,
    };
  }

  private toFilter(query: ListTransactionsQuery): TransactionFilter {
    return {
      from: query.from === undefined ? undefined : CalendarDate.parse(query.from),
      to: query.to === undefined ? undefined : CalendarDate.parse(query.to),
      type: query.type,
      categoryId: query.categoryId,
    };
  }
}
