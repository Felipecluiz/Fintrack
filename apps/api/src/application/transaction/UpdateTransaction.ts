import type { TransactionDTO, UpdateTransactionInput } from '@fintrack/contracts';
import type { CategoryRepository } from '../../domain/category/CategoryRepository';
import { CalendarDate } from '../../domain/shared/CalendarDate';
import { NotFoundError } from '../../domain/shared/errors';
import { Money } from '../../domain/shared/Money';
import type { TransactionChanges } from '../../domain/transaction/Transaction';
import type { TransactionRepository } from '../../domain/transaction/TransactionRepository';
import type { Clock } from '../ports/Clock';
import { requireCategory } from './requireCategory';
import { toTransactionDTO } from './TransactionMapper';

export class UpdateTransaction {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, input: UpdateTransactionInput): Promise<TransactionDTO> {
    const transaction = await this.transactions.findById(id);
    if (!transaction) {
      throw new NotFoundError('Transaction', id);
    }

    const category = await requireCategory(
      this.categories,
      input.categoryId ?? transaction.categoryId,
    );

    transaction.update(this.toChanges(input), category, this.clock.now());
    await this.transactions.save(transaction);

    return toTransactionDTO(transaction);
  }

  private toChanges(input: UpdateTransactionInput): TransactionChanges {
    return {
      description: input.description,
      amount: input.amountCents === undefined ? undefined : Money.fromCents(input.amountCents),
      type: input.type,
      occurredOn: input.occurredOn === undefined ? undefined : CalendarDate.parse(input.occurredOn),
    };
  }
}
