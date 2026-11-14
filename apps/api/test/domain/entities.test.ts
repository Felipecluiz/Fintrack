import { describe, expect, it } from 'vitest';
import { Category } from '../../src/domain/category/Category';
import { CalendarDate } from '../../src/domain/shared/CalendarDate';
import { BusinessRuleError, ValidationError } from '../../src/domain/shared/errors';
import { Money } from '../../src/domain/shared/Money';
import { Transaction } from '../../src/domain/transaction/Transaction';

const now = new Date('2026-11-13T12:00:00.000Z');

const groceries = () => Category.create({ id: 'c1', name: 'Mercado', type: 'expense', now });
const salary = () => Category.create({ id: 'c2', name: 'Salário', type: 'income', now });

const newExpense = (overrides: Partial<Parameters<typeof Transaction.create>[0]> = {}) =>
  Transaction.create({
    id: 't1',
    description: 'Compras da semana',
    amount: Money.fromCents(25_000),
    type: 'expense',
    category: groceries(),
    occurredOn: CalendarDate.parse('2026-11-10'),
    now,
    ...overrides,
  });

describe('Category', () => {
  it('BR-101: normalizes whitespace in the name', () => {
    const category = Category.create({
      id: 'c',
      name: '  Contas   da  casa ',
      type: 'expense',
      now,
    });
    expect(category.name).toBe('Contas da casa');
  });

  it('AC-102: rejects a blank name', () => {
    expect(() => Category.create({ id: 'c', name: '   ', type: 'expense', now })).toThrow(
      ValidationError,
    );
  });

  it('AC-103: rejects a name longer than 50 characters', () => {
    expect(() => Category.create({ id: 'c', name: 'x'.repeat(51), type: 'expense', now })).toThrow(
      ValidationError,
    );
  });

  it('renames and bumps updatedAt', () => {
    const category = groceries();
    const later = new Date('2026-12-01T00:00:00.000Z');
    category.rename('Supermercado', later);
    expect(category.name).toBe('Supermercado');
    expect(category.toSnapshot().updatedAt).toEqual(later);
  });
});

describe('Transaction', () => {
  it('AC-201: creates a valid transaction', () => {
    const snapshot = newExpense().toSnapshot();
    expect(snapshot.amount.cents).toBe(25_000);
    expect(snapshot.categoryId).toBe('c1');
  });

  it.each([0, -100])('AC-202: rejects amount %i', (cents) => {
    expect(() => newExpense({ amount: Money.fromCents(cents) })).toThrow(ValidationError);
  });

  it('BR-202: rejects a blank description', () => {
    expect(() => newExpense({ description: '  ' })).toThrow(ValidationError);
  });

  it('AC-204: rejects an income transaction in an expense category', () => {
    expect(() => newExpense({ type: 'income' })).toThrow(BusinessRuleError);
  });

  it('AC-209: rejects changing the type while keeping an incompatible category', () => {
    const transaction = newExpense();
    expect(() => transaction.update({ type: 'income' }, groceries(), now)).toThrow(
      BusinessRuleError,
    );
  });

  it('AC-209: allows changing type and category together', () => {
    const transaction = newExpense();
    transaction.update({ type: 'income' }, salary(), now);
    expect(transaction.type).toBe('income');
    expect(transaction.categoryId).toBe('c2');
  });

  it('AC-209: keeps fields that were not changed', () => {
    const transaction = newExpense();
    transaction.update({ amount: Money.fromCents(30_000) }, groceries(), now);
    const snapshot = transaction.toSnapshot();
    expect(snapshot.amount.cents).toBe(30_000);
    expect(snapshot.description).toBe('Compras da semana');
  });
});
