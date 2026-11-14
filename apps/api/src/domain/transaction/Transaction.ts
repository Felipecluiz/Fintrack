import type { Category } from '../category/Category';
import type { CalendarDate } from '../shared/CalendarDate';
import { BusinessRuleError, ValidationError } from '../shared/errors';
import type { Money } from '../shared/Money';
import type { TransactionType } from '../shared/TransactionType';

const DESCRIPTION_MAX_LENGTH = 120;

export interface TransactionSnapshot {
  id: string;
  description: string;
  amount: Money;
  type: TransactionType;
  categoryId: string;
  occurredOn: CalendarDate;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewTransaction {
  id: string;
  description: string;
  amount: Money;
  type: TransactionType;
  category: Category;
  occurredOn: CalendarDate;
  now: Date;
}

export interface TransactionChanges {
  description?: string;
  amount?: Money;
  type?: TransactionType;
  occurredOn?: CalendarDate;
}

export class Transaction {
  private constructor(private state: TransactionSnapshot) {}

  static create(input: NewTransaction): Transaction {
    Transaction.assertCategoryAccepts(input.category, input.type);
    return new Transaction({
      id: input.id,
      description: Transaction.normalizeDescription(input.description),
      amount: Transaction.assertPositive(input.amount),
      type: input.type,
      categoryId: input.category.id,
      occurredOn: input.occurredOn,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static restore(snapshot: TransactionSnapshot): Transaction {
    return new Transaction({ ...snapshot });
  }

  get id(): string {
    return this.state.id;
  }

  get type(): TransactionType {
    return this.state.type;
  }

  get categoryId(): string {
    return this.state.categoryId;
  }

  /**
   * Aplica uma alteração parcial. A categoria efetiva (nova ou a atual) é
   * sempre informada, porque a regra BR-204 depende do par tipo × categoria.
   */
  update(changes: TransactionChanges, category: Category, now: Date): void {
    const type = changes.type ?? this.state.type;
    Transaction.assertCategoryAccepts(category, type);

    this.state = {
      ...this.state,
      description:
        changes.description === undefined
          ? this.state.description
          : Transaction.normalizeDescription(changes.description),
      amount:
        changes.amount === undefined
          ? this.state.amount
          : Transaction.assertPositive(changes.amount),
      type,
      categoryId: category.id,
      occurredOn: changes.occurredOn ?? this.state.occurredOn,
      updatedAt: now,
    };
  }

  toSnapshot(): TransactionSnapshot {
    return { ...this.state };
  }

  /** BR-204 */
  private static assertCategoryAccepts(category: Category, type: TransactionType): void {
    if (!category.accepts(type)) {
      throw new BusinessRuleError(
        `Category "${category.name}" only accepts ${category.type} transactions, got ${type}`,
      );
    }
  }

  /** BR-201 */
  private static assertPositive(amount: Money): Money {
    if (!amount.isPositive()) {
      throw new ValidationError('Transaction amount must be greater than zero');
    }
    return amount;
  }

  /** BR-202 */
  private static normalizeDescription(raw: string): string {
    const description = raw.trim();
    if (description.length === 0) {
      throw new ValidationError('Transaction description is required');
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError(
        `Transaction description must have at most ${DESCRIPTION_MAX_LENGTH} characters`,
      );
    }
    return description;
  }
}
