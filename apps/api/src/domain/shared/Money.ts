import { ValidationError } from './errors';

/**
 * Valor monetário em centavos inteiros (Constituição, princípio IV).
 * Imutável: toda operação devolve uma nova instância.
 */
export class Money {
  private constructor(readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isSafeInteger(cents)) {
      throw new ValidationError('Money must be an integer amount of cents');
    }
    return new Money(cents);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
