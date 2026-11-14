import type { TransactionDTO } from '@fintrack/contracts';
import { NotFoundError } from '../../domain/shared/errors';
import type { TransactionRepository } from '../../domain/transaction/TransactionRepository';
import { toTransactionDTO } from './TransactionMapper';

export class GetTransaction {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(id: string): Promise<TransactionDTO> {
    const transaction = await this.transactions.findById(id);
    if (!transaction) {
      throw new NotFoundError('Transaction', id);
    }
    return toTransactionDTO(transaction);
  }
}
