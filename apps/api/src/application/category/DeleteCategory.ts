import type { CategoryRepository } from '../../domain/category/CategoryRepository';
import { BusinessRuleError, NotFoundError } from '../../domain/shared/errors';
import type { TransactionRepository } from '../../domain/transaction/TransactionRepository';

export class DeleteCategory {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly transactions: TransactionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    const usage = await this.transactions.countByCategory(id);
    if (usage > 0) {
      throw new BusinessRuleError(
        `Category "${category.name}" is used by ${usage} transaction(s) and cannot be deleted`,
      );
    }

    await this.categories.delete(id);
  }
}
