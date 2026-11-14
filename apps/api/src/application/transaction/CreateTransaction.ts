import type { CreateTransactionInput, TransactionDTO } from '@fintrack/contracts';
import type { CategoryRepository } from '../../domain/category/CategoryRepository';
import { CalendarDate } from '../../domain/shared/CalendarDate';
import { Money } from '../../domain/shared/Money';
import { Transaction } from '../../domain/transaction/Transaction';
import type { TransactionRepository } from '../../domain/transaction/TransactionRepository';
import type { Clock } from '../ports/Clock';
import type { IdGenerator } from '../ports/IdGenerator';
import { requireCategory } from './requireCategory';
import { toTransactionDTO } from './TransactionMapper';

export class CreateTransaction {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateTransactionInput): Promise<TransactionDTO> {
    const category = await requireCategory(this.categories, input.categoryId);

    const transaction = Transaction.create({
      id: this.ids.next(),
      description: input.description,
      amount: Money.fromCents(input.amountCents),
      type: input.type,
      category,
      occurredOn: CalendarDate.parse(input.occurredOn),
      now: this.clock.now(),
    });

    await this.transactions.save(transaction);
    return toTransactionDTO(transaction);
  }
}
