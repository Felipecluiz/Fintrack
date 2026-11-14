import { ValidationError } from '../shared/errors';
import type { TransactionType } from '../shared/TransactionType';

const NAME_MAX_LENGTH = 50;

export interface CategorySnapshot {
  id: string;
  name: string;
  type: TransactionType;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCategory {
  id: string;
  name: string;
  type: TransactionType;
  now: Date;
}

export class Category {
  private constructor(private state: CategorySnapshot) {}

  /** Cria uma categoria nova, aplicando as regras de negócio (BR-101). */
  static create({ id, name, type, now }: NewCategory): Category {
    return new Category({
      id,
      name: Category.normalizeName(name),
      type,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstrói a partir da persistência; os dados já foram validados ao serem gravados. */
  static restore(snapshot: CategorySnapshot): Category {
    return new Category({ ...snapshot });
  }

  get id(): string {
    return this.state.id;
  }

  get name(): string {
    return this.state.name;
  }

  /** BR-103: não existe setter para o tipo. */
  get type(): TransactionType {
    return this.state.type;
  }

  accepts(transactionType: TransactionType): boolean {
    return this.state.type === transactionType;
  }

  rename(name: string, now: Date): void {
    this.state = { ...this.state, name: Category.normalizeName(name), updatedAt: now };
  }

  toSnapshot(): CategorySnapshot {
    return { ...this.state };
  }

  private static normalizeName(raw: string): string {
    const name = raw.trim().replace(/\s+/g, ' ');
    if (name.length === 0) {
      throw new ValidationError('Category name is required');
    }
    if (name.length > NAME_MAX_LENGTH) {
      throw new ValidationError(`Category name must have at most ${NAME_MAX_LENGTH} characters`);
    }
    return name;
  }
}
