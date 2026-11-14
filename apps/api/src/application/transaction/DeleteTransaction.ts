import { NotFoundError } from '../../domain/shared/errors';
import type { TransactionRepository } from '../../domain/transaction/TransactionRepository';

export class DeleteTransaction {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(id: string): Promise<void> {
    const transaction = await this.transactions.findById(id);
    if (!transaction) {
      throw new NotFoundError('Transaction', id);
    }
    await this.transactions.delete(id);
  }
}
